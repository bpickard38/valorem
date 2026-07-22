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

/* ---- Product catalogue ------------------------------------------------
 * Our ids mapped to Shopify product handles. Variant ids are resolved from
 * these at runtime (see variantGid) rather than pinned in env vars: a handle
 * is stable and human-checkable, a numeric variant id is neither, and the env
 * approach silently 502s the moment someone re-creates a product in Shopify
 * and the number changes underneath us.
 *
 * These products are single-variant. If one ever gains real variants — a size,
 * a two-pack — this picks the first and that assumption needs revisiting.
 */
const SCENT_HANDLE = {
  poseidon: "poseidon",
  aphrodite: "aphrodite",
} as const;

/* The discovery sets are their own Shopify products, not variants of a scent,
 * so they live in a separate map. Keeping them out of SCENT_HANDLE is what
 * stops a set from turning up everywhere the catalogue is enumerated —
 * /product/[scent] routes, the /deity cards, generateStaticParams. */
const DISCOVERY_HANDLE = {
  "discovery-men": "discovery-set-gods",
  "discovery-women": "discovery-set-goddesses",
} as const;

const PRODUCT_HANDLE = {
  ...SCENT_HANDLE,
  ...DISCOVERY_HANDLE,
} as const;

export type ScentId = keyof typeof SCENT_HANDLE;
export type DiscoverySetId = keyof typeof DISCOVERY_HANDLE;
/* Anything the cart is allowed to hold. */
export type ProductId = keyof typeof PRODUCT_HANDLE;

/* Narrow: a scent with a catalogue entry and a product page. Routing and the
 * SCENTS record both key off this, so it must never widen to include a set. */
export function isScentId(value: unknown): value is ScentId {
  return typeof value === "string" && value in SCENT_HANDLE;
}

export function isProductId(value: unknown): value is ProductId {
  return typeof value === "string" && value in PRODUCT_HANDLE;
}

/* Last-known-good prices, used only when Shopify cannot be reached.
 *
 * A page that renders no price at all is worse than one showing a stale
 * price, so every read falls back to these rather than throwing. Keep them
 * in step with Shopify; they are what customers see during an outage, and an
 * order placed against a wrong number here is a real complaint. */
const FALLBACK_PRICE: Record<ProductId, number> = {
  poseidon: 70,
  aphrodite: 70,
  "discovery-men": 25,
  "discovery-women": 25,
};

export interface Pricing {
  amount: number;
  currency: string;
  /* Display string, e.g. "$70" — whole amounts drop the cents so the house
   * style ("$70", not "$70.00") survives. */
  formatted: string;
  /* Shopify's compare-at price. Set it above the price to run a sale; null
   * or lower means no sale is running. */
  compareAt: number | null;
  compareAtFormatted: string | null;
  onSale: boolean;
  percentOff: number | null;
  /* True when these numbers came from the fallback above rather than
   * Shopify. Pages do not surface it; it exists so a caller can log. */
  stale: boolean;
}

/* House money style: "$70", not "$70.00". Exported so a page deriving its own
 * figure (the discovery net cost) formats it the same way as a Shopify one. */
export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}

function fallbackPricing(product: ProductId): Pricing {
  const amount = FALLBACK_PRICE[product];
  return {
    amount,
    currency: "USD",
    formatted: formatMoney(amount, "USD"),
    compareAt: null,
    compareAtFormatted: null,
    onSale: false,
    percentOff: null,
    stale: true,
  };
}

/* Handle → variant gid and price, cached together in module memory. One
 * Storefront query answers both, so a page needing the price and a cart add
 * needing the id share a single round-trip.
 *
 * The TTL is short enough that a price change or a sale switched on in
 * Shopify reaches the site quickly, and long enough that the lookup cost
 * disappears under load. Note the page's own `revalidate` is the outer bound:
 * a cached page will not re-render just because this expired.
 *
 * Only successful lookups are cached — a miss must stay retryable, or a
 * product published a minute after boot stays broken until the next deploy. */
const VARIANT_TTL_MS = 5 * 60 * 1000;
const variantCache = new Map<
  ProductId,
  { gid: string; pricing: Pricing; expiresAt: number }
>();

type VariantNode = {
  id: string;
  price: { amount: string; currencyCode: string };
  compareAtPrice: { amount: string; currencyCode: string } | null;
};

async function loadVariant(
  product: ProductId,
): Promise<{ gid: string; pricing: Pricing }> {
  const cached = variantCache.get(product);
  if (cached && Date.now() < cached.expiresAt) {
    return { gid: cached.gid, pricing: cached.pricing };
  }

  const handle = PRODUCT_HANDLE[product];
  const data = await storefrontQuery<{
    product: { variants: { nodes: VariantNode[] } } | null;
  }>(
    `query variantByHandle($handle: String!) {
      product(handle: $handle) {
        variants(first: 1) {
          nodes {
            id
            price { amount currencyCode }
            compareAtPrice { amount currencyCode }
          }
        }
      }
    }`,
    { handle },
  );

  const node = data.product?.variants.nodes[0];
  if (!node) {
    // Almost always one of: wrong handle, product unpublished from the
    // headless sales channel, or the product was deleted. Name the handle so
    // the log says which of ours is broken rather than just "cart failed".
    throw new Error(
      `No Storefront variant for handle "${handle}" (${product}) — check the product exists and is published to the headless channel`,
    );
  }

  const amount = Number(node.price.amount);
  const currency = node.price.currencyCode;
  const compareAt = node.compareAtPrice
    ? Number(node.compareAtPrice.amount)
    : null;
  /* Shopify lets compare-at sit at or below the price; only treat it as a
   * sale when it is genuinely higher, otherwise the page shows a struck-out
   * number identical to the one beside it. */
  const onSale = compareAt !== null && compareAt > amount;

  const pricing: Pricing = {
    amount,
    currency,
    formatted: formatMoney(amount, currency),
    compareAt,
    compareAtFormatted: compareAt ? formatMoney(compareAt, currency) : null,
    onSale,
    percentOff: onSale
      ? Math.round(((compareAt! - amount) / compareAt!) * 100)
      : null,
    stale: false,
  };

  const entry = { gid: node.id, pricing };
  variantCache.set(product, { ...entry, expiresAt: Date.now() + VARIANT_TTL_MS });
  return entry;
}

async function variantGid(product: ProductId): Promise<string> {
  return (await loadVariant(product)).gid;
}

/* Live price for a product, straight from Shopify. Change a price or set a
 * compare-at in the admin and it lands here — no deploy, no code edit.
 *
 * Never throws: a Shopify outage falls back to FALLBACK_PRICE so the page
 * still renders something buyable rather than a blank where the price goes.
 * The cart and checkout always charge Shopify's real number regardless of
 * what was rendered. */
export async function productPricing(product: ProductId): Promise<Pricing> {
  try {
    return (await loadVariant(product)).pricing;
  } catch (error) {
    console.error(`pricing lookup failed for ${product}:`, error);
    return fallbackPricing(product);
  }
}

export interface ProductImage {
  url: string;
  width: number;
  height: number;
  altText: string | null;
}

/* The product's lead image from Shopify — the first variant's own image if one
 * is assigned, else the product's featured image. Returns null (caller falls
 * back to a placeholder) rather than throwing: a missing image must never
 * take the product page down. */
export async function productImage(
  product: ProductId,
): Promise<ProductImage | null> {
  try {
    const data = await storefrontQuery<{
      product: {
        featuredImage: ProductImage | null;
        variants: { nodes: { image: ProductImage | null }[] };
      } | null;
    }>(
      `query productLeadImage($handle: String!) {
        product(handle: $handle) {
          featuredImage { url width height altText }
          variants(first: 1) { nodes { image { url width height altText } } }
        }
      }`,
      { handle: PRODUCT_HANDLE[product] },
    );
    return (
      data.product?.variants.nodes[0]?.image ??
      data.product?.featuredImage ??
      null
    );
  } catch {
    return null;
  }
}

/* Every image on the product, in the order they are arranged in the Shopify
 * admin — image 1 is the gallery's opening shot. Uploading or re-ordering
 * photos in Shopify is the only step needed to change the gallery; nothing
 * here encodes how many there are or what they depict.
 *
 * Returns [] rather than throwing — a product page with no photos is a bad
 * page, but a product page that 500s is a lost sale. */
export async function productImages(
  product: ProductId,
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
      { handle: PRODUCT_HANDLE[product] },
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
  const merchandiseId = await variantGid(product);
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
        lines: [{ merchandiseId, quantity }],
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
  const merchandiseId = await variantGid(product);
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
      lines: [{ merchandiseId, quantity }],
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
  const merchandiseId = await variantGid(product);

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
        lines: [{ merchandiseId, quantity: 1 }],
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
