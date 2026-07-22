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

const SCENT_VARIANT_ENV = {
  poseidon: "SHOPIFY_VARIANT_POSEIDON",
  aphrodite: "SHOPIFY_VARIANT_APHRODITE",
} as const;

/* The discovery sets are their own Shopify products, not variants of a scent,
 * so they live in a separate map. Keeping them out of SCENT_VARIANT_ENV is
 * what stops a set from turning up everywhere the catalogue is enumerated —
 * /product/[scent] routes, the /deity cards, generateStaticParams. */
const DISCOVERY_VARIANT_ENV = {
  "discovery-men": "SHOPIFY_VARIANT_DISCOVERY_MEN",
  "discovery-women": "SHOPIFY_VARIANT_DISCOVERY_WOMEN",
} as const;

const VARIANT_ENV = {
  ...SCENT_VARIANT_ENV,
  ...DISCOVERY_VARIANT_ENV,
} as const;

export type ScentId = keyof typeof SCENT_VARIANT_ENV;
export type DiscoverySetId = keyof typeof DISCOVERY_VARIANT_ENV;
/* Anything the cart is allowed to hold. */
export type ProductId = keyof typeof VARIANT_ENV;

/* Narrow: a scent with a catalogue entry and a product page. Routing and the
 * SCENTS record both key off this, so it must never widen to include a set. */
export function isScentId(value: unknown): value is ScentId {
  return typeof value === "string" && value in SCENT_VARIANT_ENV;
}

export function isProductId(value: unknown): value is ProductId {
  return typeof value === "string" && value in VARIANT_ENV;
}

export interface ProductImage {
  url: string;
  width: number;
  height: number;
  altText: string | null;
}

/* The scent's product image from Shopify — the variant's own image if one is
 * assigned, else the product's featured image. Returns null (caller falls
 * back to a placeholder) rather than throwing: a missing image must never
 * take the product page down. */
export async function productImage(
  scent: ScentId,
): Promise<ProductImage | null> {
  const variantId = process.env[VARIANT_ENV[scent]];
  if (!variantId) return null;
  try {
    const data = await storefrontQuery<{
      node: {
        image: ProductImage | null;
        product: { featuredImage: ProductImage | null };
      } | null;
    }>(
      `query variantImage($id: ID!) {
        node(id: $id) {
          ... on ProductVariant {
            image { url width height altText }
            product { featuredImage { url width height altText } }
          }
        }
      }`,
      { id: `gid://shopify/ProductVariant/${variantId}` },
    );
    return data.node?.image ?? data.node?.product.featuredImage ?? null;
  } catch {
    return null;
  }
}

/* Every image on the scent's product, in the order they are arranged in the
 * Shopify admin — image 1 is the gallery's opening shot. Uploading or
 * re-ordering photos in Shopify is the only step needed to change the
 * gallery; nothing here encodes how many there are or what they depict.
 *
 * The scent ids double as the Shopify product handles (verified against the
 * live store), so the handle lookup needs no extra env var.
 *
 * Returns [] rather than throwing — a product page with no photos is a bad
 * page, but a product page that 500s is a lost sale. */
export async function productImages(
  scent: ScentId,
): Promise<ProductImage[]> {
  try {
    const data = await storefrontQuery<{
      product: {
        images: { nodes: ProductImage[] };
      } | null;
    }>(
      `query productMedia($handle: String!) {
        product(handle: $handle) {
          images(first: 20) { nodes { url width height altText } }
        }
      }`,
      { handle: scent },
    );
    return data.product?.images.nodes ?? [];
  } catch {
    return [];
  }
}

/* ---- Cart -------------------------------------------------------------
 * The order buttons used to mint a throwaway cart and redirect immediately,
 * so there was nothing to show in a drawer. These keep a cart alive across
 * requests: the browser holds the cart id, the server does the mutating.
 */

export interface CartLine {
  id: string;
  quantity: number;
  scent: ScentId | null;
  title: string;
  image: ProductImage | null;
  amount: string;
  currency: string;
}

export interface Cart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  subtotal: string;
  currency: string;
  lines: CartLine[];
}

const CART_FIELDS = `
  id
  checkoutUrl
  totalQuantity
  cost { subtotalAmount { amount currencyCode } }
  lines(first: 50) {
    nodes {
      id
      quantity
      merchandise {
        ... on ProductVariant {
          id
          image { url width height altText }
          product { handle title }
        }
      }
      cost { totalAmount { amount currencyCode } }
    }
  }
`;

type RawCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: { subtotalAmount: { amount: string; currencyCode: string } };
  lines: {
    nodes: {
      id: string;
      quantity: number;
      merchandise: {
        id: string;
        image: ProductImage | null;
        product: { handle: string; title: string };
      };
      cost: { totalAmount: { amount: string; currencyCode: string } };
    }[];
  };
};

function shapeCart(raw: RawCart): Cart {
  return {
    id: raw.id,
    checkoutUrl: raw.checkoutUrl,
    totalQuantity: raw.totalQuantity,
    subtotal: raw.cost.subtotalAmount.amount,
    currency: raw.cost.subtotalAmount.currencyCode,
    lines: raw.lines.nodes.map((line) => ({
      id: line.id,
      quantity: line.quantity,
      scent: isScentId(line.merchandise.product.handle)
        ? line.merchandise.product.handle
        : null,
      title: line.merchandise.product.title,
      image: line.merchandise.image,
      amount: line.cost.totalAmount.amount,
      currency: line.cost.totalAmount.currencyCode,
    })),
  };
}

function variantGid(product: ProductId): string {
  const variantId = process.env[VARIANT_ENV[product]];
  if (!variantId) throw new Error(`${VARIANT_ENV[product]} is not set`);
  return `gid://shopify/ProductVariant/${variantId}`;
}

/* Reads an existing cart. Shopify returns null for a cart that has been
 * completed or has expired (they last ~10 days) — the caller treats that as
 * "no cart" and starts a fresh one. */
export async function getCart(cartId: string): Promise<Cart | null> {
  const data = await storefrontQuery<{ cart: RawCart | null }>(
    `query cart($id: ID!) { cart(id: $id) { ${CART_FIELDS} } }`,
    { id: cartId },
  );
  return data.cart ? shapeCart(data.cart) : null;
}

export async function createCart(
  product: ProductId,
  quantity = 1,
): Promise<Cart> {
  const data = await storefrontQuery<{
    cartCreate: { cart: RawCart | null; userErrors: { message: string }[] };
  }>(
    `mutation cartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart { ${CART_FIELDS} }
        userErrors { message }
      }
    }`,
    {
      input: {
        lines: [{ merchandiseId: variantGid(product), quantity }],
      },
    },
  );
  const { cart, userErrors } = data.cartCreate;
  if (!cart) throw new Error(userErrors[0]?.message ?? "Cart creation failed");
  return shapeCart(cart);
}

/* Adds to an existing cart. Shopify merges the line automatically when the
 * same variant is already present, so adding Poseidon twice yields one line
 * at quantity 2 rather than two lines. */
export async function addToCart(
  cartId: string,
  product: ProductId,
  quantity = 1,
): Promise<Cart> {
  const data = await storefrontQuery<{
    cartLinesAdd: { cart: RawCart | null; userErrors: { message: string }[] };
  }>(
    `mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart { ${CART_FIELDS} }
        userErrors { message }
      }
    }`,
    {
      cartId,
      lines: [{ merchandiseId: variantGid(product), quantity }],
    },
  );
  const { cart, userErrors } = data.cartLinesAdd;
  if (!cart) throw new Error(userErrors[0]?.message ?? "Add to cart failed");
  return shapeCart(cart);
}

/* Sets a line's quantity; quantity 0 removes it. */
export async function updateCartLine(
  cartId: string,
  lineId: string,
  quantity: number,
): Promise<Cart> {
  if (quantity <= 0) {
    const data = await storefrontQuery<{
      cartLinesRemove: {
        cart: RawCart | null;
        userErrors: { message: string }[];
      };
    }>(
      `mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
        cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
          cart { ${CART_FIELDS} }
          userErrors { message }
        }
      }`,
      { cartId, lineIds: [lineId] },
    );
    const { cart, userErrors } = data.cartLinesRemove;
    if (!cart) throw new Error(userErrors[0]?.message ?? "Remove failed");
    return shapeCart(cart);
  }

  const data = await storefrontQuery<{
    cartLinesUpdate: { cart: RawCart | null; userErrors: { message: string }[] };
  }>(
    `mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart { ${CART_FIELDS} }
        userErrors { message }
      }
    }`,
    { cartId, lines: [{ id: lineId, quantity }] },
  );
  const { cart, userErrors } = data.cartLinesUpdate;
  if (!cart) throw new Error(userErrors[0]?.message ?? "Update failed");
  return shapeCart(cart);
}

/* Creates a single-item cart and returns Shopify's hosted checkout URL. */
export async function createCheckout(product: ProductId): Promise<string> {
  const variantId = process.env[VARIANT_ENV[product]];
  if (!variantId) throw new Error(`${VARIANT_ENV[product]} is not set`);

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
