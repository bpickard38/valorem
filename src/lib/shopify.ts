/*
 * Shopify API clients. Server-side only — tokens must never reach the browser,
 * so import this file only from route handlers / server components.
 * Credentials live in .env.local (see .env.local.example).
 *
 * Ported verbatim from ../valorem/src/lib/shopify.ts — keep in sync.
 */

const API_VERSION = "2025-07";

function storeDomain(): string {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  if (!domain) throw new Error("SHOPIFY_STORE_DOMAIN is not set");
  return domain;
}

type GraphQLResponse<T> = {
  data?: T;
  errors?: { message: string }[];
};

/* Storefront API — public-facing catalog, carts, checkout.
 * Accepts either token from the Headless app: the private token (preferred
 * for server-side calls) via SHOPIFY_STOREFRONT_PRIVATE_TOKEN, or the public
 * token via SHOPIFY_STOREFRONT_TOKEN. They require different headers. */
export async function storefrontQuery<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const privateToken = process.env.SHOPIFY_STOREFRONT_PRIVATE_TOKEN;
  const publicToken = process.env.SHOPIFY_STOREFRONT_TOKEN;
  if (!privateToken && !publicToken) {
    throw new Error(
      "Set SHOPIFY_STOREFRONT_PRIVATE_TOKEN or SHOPIFY_STOREFRONT_TOKEN",
    );
  }

  const authHeader: Record<string, string> = privateToken
    ? { "Shopify-Storefront-Private-Token": privateToken }
    : { "X-Shopify-Storefront-Access-Token": publicToken! };

  const res = await fetch(
    `https://${storeDomain()}/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
      },
      body: JSON.stringify({ query, variables }),
    },
  );
  if (!res.ok) throw new Error(`Storefront API returned ${res.status}`);

  const json = (await res.json()) as GraphQLResponse<T>;
  if (json.errors?.length) throw new Error(json.errors[0].message);
  if (!json.data) throw new Error("Storefront API returned no data");
  return json.data;
}

/* Admin access tokens for Dev Dashboard apps come from the OAuth client
 * credentials grant and expire after 24h, so we cache one in memory and
 * refresh shortly before expiry. A fixed SHOPIFY_ADMIN_TOKEN (legacy
 * custom-app shpat_ token) is used directly if set. */
let cachedAdminToken: { token: string; expiresAt: number } | null = null;

async function adminToken(): Promise<string> {
  const fixed = process.env.SHOPIFY_ADMIN_TOKEN;
  if (fixed) return fixed;

  if (cachedAdminToken && Date.now() < cachedAdminToken.expiresAt) {
    return cachedAdminToken.token;
  }

  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "Set SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET (or SHOPIFY_ADMIN_TOKEN)",
    );
  }

  const res = await fetch(
    `https://${storeDomain()}/admin/oauth/access_token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`Token exchange returned ${res.status}`);
  }
  const json = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  cachedAdminToken = {
    token: json.access_token,
    // refresh 5 minutes early to avoid using a token mid-expiry
    expiresAt: Date.now() + (json.expires_in - 300) * 1000,
  };
  return cachedAdminToken.token;
}

/* Admin API — customer records for the founding list. */
export async function adminQuery<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const token = await adminToken();

  const res = await fetch(
    `https://${storeDomain()}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
    },
  );
  if (!res.ok) throw new Error(`Admin API returned ${res.status}`);

  const json = (await res.json()) as GraphQLResponse<T>;
  if (json.errors?.length) throw new Error(json.errors[0].message);
  if (!json.data) throw new Error("Admin API returned no data");
  return json.data;
}

const VARIANT_ENV = {
  poseidon: "SHOPIFY_VARIANT_POSEIDON",
  aphrodite: "SHOPIFY_VARIANT_APHRODITE",
} as const;

export type ScentId = keyof typeof VARIANT_ENV;

export function isScentId(value: unknown): value is ScentId {
  return typeof value === "string" && value in VARIANT_ENV;
}

/* Creates a single-item cart and returns Shopify's hosted checkout URL. */
export async function createCheckout(scent: ScentId): Promise<string> {
  const variantId = process.env[VARIANT_ENV[scent]];
  if (!variantId) throw new Error(`${VARIANT_ENV[scent]} is not set`);

  const data = await storefrontQuery<{
    cartCreate: {
      cart: { checkoutUrl: string } | null;
      userErrors: { message: string }[];
    };
  }>(
    `mutation cartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart { checkoutUrl }
        userErrors { message }
      }
    }`,
    {
      input: {
        lines: [
          {
            merchandiseId: `gid://shopify/ProductVariant/${variantId}`,
            quantity: 1,
          },
        ],
      },
    },
  );

  const { cart, userErrors } = data.cartCreate;
  if (!cart) {
    throw new Error(userErrors[0]?.message ?? "Cart creation failed");
  }
  return cart.checkoutUrl;
}

/* Saves an email as a subscribed Shopify customer tagged "founding-list". */
export async function subscribeEmail(email: string): Promise<void> {
  const data = await adminQuery<{
    customerCreate: {
      customer: { id: string } | null;
      userErrors: { message: string }[];
    };
  }>(
    `mutation customerCreate($input: CustomerInput!) {
      customerCreate(input: $input) {
        customer { id }
        userErrors { message }
      }
    }`,
    {
      input: {
        email,
        tags: ["founding-list"],
        emailMarketingConsent: {
          marketingState: "SUBSCRIBED",
          marketingOptInLevel: "SINGLE_OPT_IN",
        },
      },
    },
  );

  const { customer, userErrors } = data.customerCreate;
  if (customer) return;

  // An already-registered email counts as being on the list.
  const message = userErrors[0]?.message ?? "Subscription failed";
  if (/taken|exists/i.test(message)) return;
  throw new Error(message);
}
