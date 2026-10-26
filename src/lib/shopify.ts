/*
 * Shopify API clients. Server-side only — tokens must never reach the browser,
 * so import this file only from route handlers / server components.
 * Credentials live in .env.local (see .env.example).
 *
 * Ported verbatim from ../valorem/src/lib/shopify.ts — keep in sync.
 */

import {
  DEFAULT_SIZE,
  HERO_IMAGE_INDEX,
  SIZES,
  SIZE_OPTION,
  formatMoney,
} from "@/lib/site";
import type { SizeId } from "@/lib/site";

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
 */
const SCENT_HANDLE = {
  poseidon: "poseidon",
  aphrodite: "aphrodite",
  hades: "hades",
  apollo: "apollo",
  artemis: "artemis",
  hera: "hera",
} as const;

/* The six scents are the entire catalogue. There used to be a second map for
 * the discovery sets — they were their own Shopify products rather than
 * variants — and a `ScentId` union over both. The sets were retired on
 * 2026-07-25 and sampling moved onto the product page as the 5 ml size, so
 * the union collapsed back to exactly the scents. Everything the cart can
 * hold is now a scent plus a size. */
export type ScentId = keyof typeof SCENT_HANDLE;

/* Narrow: a scent with a catalogue entry and a product page. Routing, the
 * SCENTS record and the cart all key off this. */
export function isScentId(value: unknown): value is ScentId {
  return typeof value === "string" && value in SCENT_HANDLE;
}

/* Last-known-good prices, used only when Shopify cannot be reached.
 *
 * A page that renders no price at all is worse than one showing a stale
 * price, so every read falls back to these rather than throwing. Keep them
 * in step with Shopify; they are what customers see during an outage, and an
 * order placed against a wrong number here is a real complaint. */
const FALLBACK_PRICE: Record<ScentId, number> = {
  poseidon: 70,
  aphrodite: 70,
  hades: 70,
  apollo: 70,
  artemis: 70,
  hera: 70,
};

/* The same last-known-good prices, per SIZE rather than per scent.
 *
 * FALLBACK_PRICE above answers "what does this scent cost", which is the full
 * size. That was the only fallback there was, so productVariants() degraded to
 * a list of ONE variant — the 30 ml — and lowestPricing() therefore reported
 * $70 during an outage. Every "From $X" on the site quotes lowestPricing(),
 * so an outage silently repriced the entry point from $16 to $70 and turned
 * the home page's primary CTA into "Start with a $70 Sample".
 *
 * Keyed by size and not by scent because all six are priced identically; if
 * that ever stops being true this becomes a per-scent table. The 30 ml figure
 * MUST equal the values in FALLBACK_PRICE above.
 *
 * Same standing rule as FALLBACK_PRICE: these are what customers see when
 * Shopify is unreachable, so keep them in step with the admin. */
const FALLBACK_SIZE_PRICE: Record<SizeId, number> = {
  "30ml": 70,
  "15ml": 48,
  "5ml": 16,
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

/* House money style: "$70", not "$70.00". Defined in site.ts — this module
 * already imports that one, so the implementation lives there to keep the two
 * from becoming a runtime cycle. Re-exported here because every existing
 * caller reaches for it alongside Pricing. */
export { formatMoney } from "@/lib/site";

function fallbackSizePricing(size: SizeId): Pricing {
  return shapeFallback(FALLBACK_SIZE_PRICE[size]);
}

function fallbackPricing(product: ScentId): Pricing {
  return shapeFallback(FALLBACK_PRICE[product]);
}

function shapeFallback(amount: number): Pricing {
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
  ScentId,
  { variants: SizeVariant[]; expiresAt: number }
>();

type VariantNode = {
  id: string;
  availableForSale: boolean;
  selectedOptions: { name: string; value: string }[];
  price: { amount: string; currencyCode: string };
  compareAtPrice: { amount: string; currencyCode: string } | null;
};

/* One buyable size of one scent. `size` is our id ("30ml"); `gid` is the
 * Shopify ProductVariant id that a cart line actually needs. */
export interface SizeVariant {
  size: SizeId;
  gid: string;
  pricing: Pricing;
  availableForSale: boolean;
}

function shapePricing(node: VariantNode): Pricing {
  const amount = Number(node.price.amount);
  const currency = node.price.currencyCode;
  const compareAt = node.compareAtPrice
    ? Number(node.compareAtPrice.amount)
    : null;
  /* Shopify lets compare-at sit at or below the price; only treat it as a
   * sale when it is genuinely higher, otherwise the page shows a struck-out
   * number identical to the one beside it. */
  const onSale = compareAt !== null && compareAt > amount;

  return {
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
}

/* Every size of one scent, in SIZES order, resolved from Shopify.
 *
 * This used to ask for `variants(first: 1)` and treat whatever came back as
 * the product — which is why the site sold only the 30 ml and quoted $70
 * everywhere. It now reads the whole option set and matches each variant to a
 * row in SIZES by its "Size" option value.
 *
 * Matching is deliberately one-directional: a Shopify variant whose value is
 * not in SIZES is dropped, and a SIZES row with no Shopify variant is simply
 * absent from the result. That is what makes the selector degrade cleanly to
 * however many sizes actually exist rather than rendering a dead option. */
async function loadVariants(product: ScentId): Promise<SizeVariant[]> {
  const cached = variantCache.get(product);
  if (cached && Date.now() < cached.expiresAt) return cached.variants;

  const handle = SCENT_HANDLE[product];
  const data = await storefrontQuery<{
    product: { variants: { nodes: VariantNode[] } } | null;
  }>(
    `query variantsByHandle($handle: String!) {
      product(handle: $handle) {
        variants(first: 20) {
          nodes {
            id
            availableForSale
            selectedOptions { name value }
            price { amount currencyCode }
            compareAtPrice { amount currencyCode }
          }
        }
      }
    }`,
    { handle },
  );

  const nodes = data.product?.variants.nodes ?? [];
  if (nodes.length === 0) {
    // Almost always one of: wrong handle, product unpublished from the
    // headless sales channel, or the product was deleted. Name the handle so
    // the log says which of ours is broken rather than just "cart failed".
    throw new Error(
      `No Storefront variant for handle "${handle}" (${product}) — check the product exists and is published to the headless channel`,
    );
  }

  const variants: SizeVariant[] = [];
  for (const row of SIZES) {
    const node = nodes.find((n) =>
      n.selectedOptions.some(
        (o) => o.name === SIZE_OPTION && o.value === row.option,
      ),
    );
    if (!node) continue;
    variants.push({
      size: row.id,
      gid: node.id,
      pricing: shapePricing(node),
      availableForSale: node.availableForSale,
    });
  }

  /* A product with exactly one variant and no "Size" option at all — the
   * shape every scent had before 2026-07-25 — matches nothing above. Treat
   * that single variant as the default size so the page still sells. */
  if (variants.length === 0) {
    variants.push({
      size: DEFAULT_SIZE,
      gid: nodes[0].id,
      pricing: shapePricing(nodes[0]),
      availableForSale: nodes[0].availableForSale,
    });
  }

  variantCache.set(product, {
    variants,
    expiresAt: Date.now() + VARIANT_TTL_MS,
  });
  return variants;
}

/* The variant a cart line needs. Falls back to the first available size when
 * the requested one has gone — never silently substitutes a DIFFERENT price
 * without the caller knowing, because the caller is the cart and Shopify
 * charges its own number regardless of what we rendered. */
async function variantGid(product: ScentId, size: SizeId): Promise<string> {
  const variants = await loadVariants(product);
  const match = variants.find((v) => v.size === size);
  if (!match) {
    throw new Error(
      `No ${size} variant for ${product} — check the Size option in Shopify`,
    );
  }
  return match.gid;
}

/* Every size of a scent, for the product page's selector.
 *
 * Never throws: a Shopify outage yields a single fallback-priced default size
 * so the page still renders something buyable. */
export async function productVariants(
  product: ScentId,
): Promise<SizeVariant[]> {
  try {
    return await loadVariants(product);
  } catch (error) {
    console.error(`variant lookup failed for ${product}:`, error);
    /* Every size, not just the default one. The selector renders all three
     * greyed out rather than collapsing to a lone 30 ml, and — the reason this
     * matters — lowestPricing() can still find the 5 ml, so "From $16" stays
     * $16 while Shopify is down. gid is empty and availableForSale is false on
     * all of them, so nothing here is addable to a cart. */
    return SIZES.map((size) => ({
      size: size.id,
      gid: "",
      pricing: fallbackSizePricing(size.id),
      availableForSale: false,
    }));
  }
}

/* The cheapest size a shopper can actually buy — what "From $16" quotes.
 * Falls back to the default size's price if nothing is in stock, so the
 * figure is never blank. */
export function lowestPricing(variants: SizeVariant[]): Pricing {
  const buyable = variants.filter((v) => v.availableForSale);
  const pool = buyable.length > 0 ? buyable : variants;
  return pool.reduce((low, v) =>
    v.pricing.amount < low.pricing.amount ? v : low,
  ).pricing;
}

async function loadVariant(
  product: ScentId,
): Promise<{ gid: string; pricing: Pricing }> {
  const variants = await loadVariants(product);
  const preferred =
    variants.find((v) => v.size === DEFAULT_SIZE) ?? variants[0];
  return { gid: preferred.gid, pricing: preferred.pricing };
}

/* Live price for a product, straight from Shopify. Change a price or set a
 * compare-at in the admin and it lands here — no deploy, no code edit.
 *
 * Never throws: a Shopify outage falls back to FALLBACK_PRICE so the page
 * still renders something buyable rather than a blank where the price goes.
 * The cart and checkout always charge Shopify's real number regardless of
 * what was rendered. */
export async function productPricing(product: ScentId): Promise<Pricing> {
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

/* The one photo that represents this product away from its own page — the home
 * grid, the collection pages, the quiz, the share card.
 *
 * IT IS THE FLAGSHIP'S PHOTO, NOT IMAGE 1. This used to read the first variant's
 * image and fall back to featuredImage, which amounted to "whatever is first in
 * the admin". That was the 30 ml until the images were re-ordered to 5/15/30 on
 * 2026-08-07 — after which every card on the site would have been selling the
 * $16 sample. It now addresses HERO_IMAGE_INDEX, which is derived from
 * DEFAULT_SIZE, so the cards follow the flagship rather than the upload order.
 *
 * Falls back down the list rather than failing: the hero index, then the
 * product's own featured image, then whatever exists. Returns null (caller
 * renders a placeholder) rather than throwing — a missing image must never take
 * a page down. */
export async function productImage(
  product: ScentId,
): Promise<ProductImage | null> {
  try {
    const data = await storefrontQuery<{
      product: {
        featuredImage: ProductImage | null;
        images: { nodes: ProductImage[] };
      } | null;
    }>(
      `query productLeadImage($handle: String!) {
        product(handle: $handle) {
          featuredImage { url width height altText }
          images(first: 20) { nodes { url width height altText } }
        }
      }`,
      { handle: SCENT_HANDLE[product] },
    );
    const images = data.product?.images.nodes ?? [];
    return (
      images[HERO_IMAGE_INDEX] ??
      data.product?.featuredImage ??
      images[0] ??
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
  product: ScentId,
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
      { handle: SCENT_HANDLE[product] },
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
  /* The variant's own name — "30 ml". Shopify sends "Default Title" for a
   * product with no options; normalised to null so the drawer can just test
   * for it rather than filtering that string itself. */
  size: string | null;
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
          title
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
        title: string;
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
      size:
        line.merchandise.title && line.merchandise.title !== "Default Title"
          ? line.merchandise.title
          : null,
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
  product: ScentId,
  size: SizeId,
  quantity = 1,
): Promise<Cart> {
  const merchandiseId = await variantGid(product, size);
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
  product: ScentId,
  size: SizeId,
  quantity = 1,
): Promise<Cart> {
  const merchandiseId = await variantGid(product, size);
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
export async function createCheckout(
  product: ScentId,
  size: SizeId = DEFAULT_SIZE,
): Promise<string> {
  const merchandiseId = await variantGid(product, size);

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
