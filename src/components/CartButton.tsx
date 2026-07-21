"use client";

import { useCart } from "@/components/CartProvider";

/* Header bag. Opens the cart drawer and carries a count badge once there is
 * something in the cart.
 *
 * The count comes from the cart Shopify knows about, which CartProvider
 * rehydrates from localStorage after mount — so it starts empty on both
 * server and client and fills in a moment later. That avoids a hydration
 * mismatch, at the cost of the badge appearing a beat after paint. */
export default function CartButton() {
  const { cart, openCart } = useCart();
  const count = cart?.totalQuantity ?? 0;

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={
        count > 0
          ? `Open cart — ${count} item${count === 1 ? "" : "s"}`
          : "Open cart"
      }
      /* The tap target stays a full 44px, but negative margins let it bleed
       * into the header's own padding instead of growing it — otherwise the
       * sticky bar jumps from ~44px to 72px tall and eats the viewport on a
       * phone. -mr pulls the icon back out to the nav's right edge. */
      className="group relative -my-3 -mr-2.5 flex h-11 w-11 items-center justify-center text-charcoal/70 transition-colors hover:text-gold-deep"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="h-[1.15rem] w-[1.15rem]"
      >
        {/* tote body */}
        <path d="M4.5 7.5h15l-1.15 12.1a1.5 1.5 0 0 1-1.5 1.4H7.15a1.5 1.5 0 0 1-1.5-1.4L4.5 7.5Z" />
        {/* handle */}
        <path d="M9 10V6.75a3 3 0 0 1 6 0V10" />
      </svg>

      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute right-1 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 font-sans text-[0.6rem] font-medium leading-none text-ivory tabular-nums"
        >
          {count}
        </span>
      )}
    </button>
  );
}
