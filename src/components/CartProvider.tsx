"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { Cart } from "@/lib/shopify";
import { trackMetaEvent } from "@/lib/metaPixel";
import { CURRENCY, DEFAULT_SIZE, PRICE_AMOUNT } from "@/lib/site";
import type { SizeId } from "@/lib/site";

const STORAGE_KEY = "valorem-cart-id";

type Status = "idle" | "loading" | "error";

interface CartContextValue {
  cart: Cart | null;
  open: boolean;
  status: Status;
  openCart: () => void;
  closeCart: () => void;
  /* `value` is what the item is worth to Meta's optimiser. It defaults to the
   * full-size price because that is what every caller sold before sizes
   * existed; a caller adding a 5 ml MUST pass its own, or AddToCart reports
   * $70 for a $16 order and the ROAS the ads are tuned against is fiction. */
  addItem: (
    product: string,
    size?: SizeId,
    value?: number,
  ) => Promise<void>;
  setLineQuantity: (lineId: string, quantity: number) => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

export default function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");

  /* Rehydrate a cart left over from a previous visit. A cart Shopify no
   * longer recognises comes back null — clear the id so the next add starts
   * clean instead of retrying a dead cart forever. */
  useEffect(() => {
    const id = localStorage.getItem(STORAGE_KEY);
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/cart?id=${encodeURIComponent(id)}`);
        const data = await res.json();
        if (cancelled) return;
        if (data.cart) setCart(data.cart);
        else localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* offline or transient — keep the id and try again next load */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* Coming back from Shopify checkout via the bfcache would otherwise restore
   * a frozen "loading" button. */
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setStatus("idle");
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const persist = useCallback((next: Cart) => {
    setCart(next);
    localStorage.setItem(STORAGE_KEY, next.id);
  }, []);

  const addItem = useCallback(
    async (
      product: string,
      size: SizeId = DEFAULT_SIZE,
      value: number = PRICE_AMOUNT,
    ) => {
      setStatus("loading");
      // Open immediately — the drawer animates in while the request is in
      // flight and shows its own pending state, which reads far better on a
      // phone than a button that sits dead for half a second.
      setOpen(true);
      trackMetaEvent("AddToCart", {
        content_ids: [product],
        content_type: "product",
        value,
        currency: CURRENCY,
      });
      try {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "add",
            product,
            size,
            // localStorage is the authoritative cart id — persist() writes it
            // on every mutation, so reading it here keeps this callback from
            // depending on the cart object and re-creating on every change.
            cartId: localStorage.getItem(STORAGE_KEY) ?? undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.cart) throw new Error(data.error);
        persist(data.cart);
        setStatus("idle");
      } catch {
        setStatus("error");
      }
    },
    [persist],
  );

  const setLineQuantity = useCallback(
    async (lineId: string, quantity: number) => {
      if (!cart) return;
      setStatus("loading");
      try {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update",
            cartId: cart.id,
            lineId,
            quantity,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.cart) throw new Error(data.error);
        persist(data.cart);
        setStatus("idle");
      } catch {
        setStatus("error");
      }
    },
    [cart, persist],
  );

  const openCart = useCallback(() => setOpen(true), []);
  const closeCart = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ cart, open, status, openCart, closeCart, addItem, setLineQuantity }),
    [cart, open, status, openCart, closeCart, addItem, setLineQuantity],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
