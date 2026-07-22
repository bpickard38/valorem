import {
  addToCart,
  createCart,
  getCart,
  isProductId,
  updateCartLine,
} from "@/lib/shopify";
import type { Cart } from "@/lib/shopify";

/* The cart drawer's backend. The browser holds only the cart id; all Shopify
 * mutations happen here so the Storefront token stays server-side.
 *
 * GET  ?id=<cartId>  — rehydrate the drawer on page load
 * POST { action: "add",    product, cartId? }
 * POST { action: "update", cartId, lineId, quantity }
 *
 * `product` is a scent id or a discovery set id. It was called `scent` before
 * the sets existed, and a browser holding cached JS from that build will still
 * post the old field — so both are read.
 */

function ok(cart: Cart) {
  return Response.json({ cart });
}

function fail(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return fail("Missing cart id", 400);

  try {
    const cart = await getCart(id);
    // An expired or already-checked-out cart is not an error — the client
    // drops its stored id and starts over on the next add.
    return Response.json({ cart });
  } catch (error) {
    console.error("cart fetch failed:", error);
    return fail("Cart is unavailable right now.", 502);
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return fail("Bad request", 400);

  const { action, product, scent, cartId, lineId, quantity } = body as {
    action?: string;
    product?: unknown;
    scent?: unknown;
    cartId?: unknown;
    lineId?: unknown;
    quantity?: unknown;
  };

  try {
    if (action === "add") {
      const item = product ?? scent;
      if (!isProductId(item)) return fail("Unknown product", 400);
      const qty =
        typeof quantity === "number" && quantity > 0 ? Math.floor(quantity) : 1;

      if (typeof cartId === "string" && cartId) {
        try {
          return ok(await addToCart(cartId, item, qty));
        } catch {
          // Stale cart id (expired / completed) — fall through to a new cart
          // rather than surfacing an error the shopper can do nothing about.
        }
      }
      return ok(await createCart(item, qty));
    }

    if (action === "update") {
      if (typeof cartId !== "string" || !cartId) return fail("Missing cart", 400);
      if (typeof lineId !== "string" || !lineId) return fail("Missing line", 400);
      if (typeof quantity !== "number") return fail("Missing quantity", 400);
      return ok(await updateCartLine(cartId, lineId, Math.floor(quantity)));
    }

    return fail("Unknown action", 400);
  } catch (error) {
    console.error("cart action failed:", error);
    return fail("Cart is unavailable right now.", 502);
  }
}
