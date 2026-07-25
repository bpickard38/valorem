"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useCart } from "@/components/CartProvider";
import {
  CURRENCY,
  FREE_SHIPPING_THRESHOLD,
  GUARANTEE,
  formatMoney,
} from "@/lib/site";

/* Slide-in cart. Mobile-first: near full-width on a phone, a panel on
 * desktop, dismissable by backdrop tap, Escape, the close button, or a
 * rightward drag on the panel itself. */
export default function CartDrawer() {
  const { cart, open, status, closeCart, setLineQuantity } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Live drag offset in px; 0 whenever the shopper is not dragging.
  const [drag, setDrag] = useState(0);
  const dragStart = useRef<number | null>(null);

  /* Escape closes, and the page behind must not scroll while the drawer is
   * up — on iOS a scrollable body under a fixed panel is the classic
   * "scrolled the wrong thing" bug. */
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", onKey);

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    // Move focus into the drawer so keyboard and screen-reader users land
    // where the action is.
    closeRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, closeCart]);

  function onTouchStart(e: React.TouchEvent) {
    dragStart.current = e.touches[0].clientX;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (dragStart.current === null) return;
    // Only rightward movement dismisses; clamp so the panel never pulls left
    // off its own edge.
    setDrag(Math.max(0, e.touches[0].clientX - dragStart.current));
  }

  function onTouchEnd() {
    const panelWidth = panelRef.current?.offsetWidth ?? 320;
    // Past a quarter of the panel, finish the dismissal; otherwise spring back.
    if (drag > panelWidth * 0.25) closeCart();
    setDrag(0);
    dragStart.current = null;
  }

  const lines = cart?.lines ?? [];
  const isEmpty = lines.length === 0;
  const busy = status === "loading";

  /* Progress toward free shipping. Measured on the SUBTOTAL, which is what
   * Shopify's own rate is measured against — using the line total or a
   * post-discount figure would promise a threshold checkout then refuses.
   *
   * Only the sample sits below $40, so for most carts this line exists to
   * confirm free shipping rather than to chase it. */
  const subtotal = Number(cart?.subtotal ?? 0);
  const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
  const hasFreeShipping = remaining <= 0;

  /* No InitiateCheckout here on purpose.
   *
   * Checkout is hosted on Shopify, so we can't fire an accurate checkout event
   * from this app anyway. Split of responsibility:
   *  - This app owns BROWSING only (PageView, ViewContent, AddToCart, Lead) via
   *    the pixel + CAPI relay, each with a shared event_id (see lib/metaPixel.ts).
   *    Native Shopify can't see these — they happen on our custom frontend, not
   *    Shopify's storefront — so this app is their only source.
   *  - Checkout onward (InitiateCheckout, AddPaymentInfo, Purchase) is owned by
   *    the native Facebook & Instagram sales channel on Shopify's hosted
   *    checkout, which fires a deduped browser+CAPI pair. It is the SINGLE
   *    Purchase source — do not add another (an orders/paid webhook, a Stape
   *    gateway, a second pixel), or it double-counts. Removed 2026-07-24. */
  function onCheckout() {
    if (!cart) return;
    window.location.assign(cart.checkoutUrl);
  }

  return (
    <>
      {/* Backdrop — rendered always so it can fade rather than pop. */}
      <div
        aria-hidden="true"
        onClick={closeCart}
        className={`fixed inset-0 z-[60] bg-charcoal/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Your cart"
        aria-hidden={!open}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={drag ? { transform: `translateX(${drag}px)`, transition: "none" } : undefined}
        className={`fixed inset-y-0 right-0 z-[61] flex w-[92%] max-w-sm flex-col bg-ivory shadow-2xl transition-transform duration-300 ease-out sm:w-full ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-charcoal/10 px-5 py-4">
          <p className="label-engraved text-charcoal/70">
            Your Cart{cart?.totalQuantity ? ` (${cart.totalQuantity})` : ""}
          </p>
          <button
            ref={closeRef}
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            /* 44px min target — thumb-sized, per Apple/Material guidance. */
            className="-mr-2 flex h-11 w-11 items-center justify-center text-2xl leading-none text-charcoal/60 transition-colors hover:text-gold-deep"
          >
            ×
          </button>
        </div>

        {/* Lines */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          {isEmpty ? (
            <p className="mt-10 text-center text-sm text-charcoal/60">
              {busy ? "Adding to your cart…" : "Your cart is empty."}
            </p>
          ) : (
            <ul className="flex flex-col gap-5">
              {lines.map((line) => (
                <li key={line.id} className="flex gap-4">
                  <div className="relative h-24 w-20 shrink-0 overflow-hidden bg-stone">
                    {line.image ? (
                      <Image
                        src={line.image.url}
                        alt={line.image.altText ?? line.title}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="font-serif text-lg text-charcoal">
                      {line.title}
                    </p>
                    {/* Which size — without it two lines of the same scent
                        are indistinguishable in the drawer. */}
                    {line.size ? (
                      <p className="label-engraved mt-1 text-charcoal/50">
                        {line.size}
                      </p>
                    ) : null}
                    <p className="mt-0.5 text-sm text-charcoal/60">
                      ${Number(line.amount).toFixed(2)}
                    </p>
                    <div className="mt-auto flex items-center gap-3 pt-3">
                      <div className="flex items-center border border-charcoal/15">
                        <button
                          type="button"
                          aria-label={`Decrease ${line.title} quantity`}
                          disabled={busy}
                          onClick={() =>
                            setLineQuantity(line.id, line.quantity - 1)
                          }
                          className="flex h-10 w-10 items-center justify-center text-lg text-charcoal/70 disabled:opacity-40"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm tabular-nums">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase ${line.title} quantity`}
                          disabled={busy}
                          onClick={() =>
                            setLineQuantity(line.id, line.quantity + 1)
                          }
                          className="flex h-10 w-10 items-center justify-center text-lg text-charcoal/70 disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setLineQuantity(line.id, 0)}
                        className="text-xs uppercase tracking-[0.2em] text-charcoal/45 underline-offset-4 transition-colors hover:text-gold-deep hover:underline disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {status === "error" && (
            <p className="mt-6 text-center text-xs tracking-wide text-charcoal/70">
              Something went wrong. Try again shortly.
            </p>
          )}
        </div>

        {/* Footer — sits above the iOS home indicator via safe-area padding. */}
        {!isEmpty && (
          <div
            className="border-t border-charcoal/10 px-5 pt-5"
            style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
          >
            {/* Free-shipping progress, above the subtotal so it reads as a
                condition on the number rather than a footnote to it. A track
                that fills is the whole point — "$24 away" alone doesn't say
                how close that is. aria-live so the message is announced when
                a quantity change crosses the threshold. */}
            <div aria-live="polite" className="mb-4">
              <p className="text-xs leading-relaxed text-charcoal/65">
                {hasFreeShipping ? (
                  <>
                    <span className="font-medium text-gold-deep">
                      Free shipping applied.
                    </span>{" "}
                    Taxes calculated at checkout.
                  </>
                ) : (
                  <>
                    <span className="font-medium text-charcoal/80">
                      {formatMoney(remaining, CURRENCY)} away
                    </span>{" "}
                    from free shipping.
                  </>
                )}
              </p>
              <div
                aria-hidden="true"
                className="mt-2 h-px w-full overflow-hidden bg-charcoal/12"
              >
                <div
                  className="h-full bg-gold transition-transform duration-500 ease-out"
                  style={{
                    /* scaleX rather than width: it animates on the compositor
                       and can't reflow the drawer footer mid-transition. */
                    transform: `scaleX(${Math.min(
                      1,
                      Math.max(0, subtotal / FREE_SHIPPING_THRESHOLD),
                    )})`,
                    transformOrigin: "left",
                  }}
                />
              </div>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="label-engraved text-charcoal/60">Subtotal</span>
              <span className="font-serif text-2xl text-charcoal">
                ${Number(cart?.subtotal ?? 0).toFixed(2)}
              </span>
            </div>

            <button
              type="button"
              onClick={onCheckout}
              disabled={busy}
              className="group relative mt-4 block w-full cursor-pointer overflow-hidden bg-gold px-10 py-4 text-center text-xs font-medium uppercase tracking-[0.25em] text-ivory transition-colors duration-300 active:translate-y-px disabled:pointer-events-none disabled:opacity-60"
            >
              <span
                aria-hidden="true"
                className="absolute inset-0 origin-left scale-x-0 bg-gold-deep transition-transform duration-300 ease-out group-hover:scale-x-100"
              />
              <span className="relative z-10">
                {busy ? "One moment" : "Checkout"}
              </span>
            </button>

            <p className="mt-3 text-center text-xs leading-relaxed text-charcoal/60">
              <span className="font-medium text-charcoal/80">
                {GUARANTEE.headline}
              </span>{" "}
              {GUARANTEE.sub}
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
