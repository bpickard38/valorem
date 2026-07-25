"use client";

import { useRef, useState } from "react";
import Price from "@/components/Price";
import AddToCartButton from "@/components/AddToCartButton";
import type { SizeVariant } from "@/lib/shopify";
import { sizeById } from "@/lib/site";
import type { SizeId } from "@/lib/site";

/*
 * The buy block: size, price, what the size buys, and the button.
 *
 * The three sizes are one Shopify product with a "Size" option, so the whole
 * control is really a variant picker — `variants` arrives already resolved by
 * the server (see productVariants) and each entry carries the real gid, so
 * Add to Cart can never send a product id or a stale default.
 *
 * A11y: this is a radio group, not a row of buttons. The APG pattern is one
 * tab stop for the whole group (roving tabindex), arrow keys to move between
 * options, and moving selects — so a keyboard user picks a size with two keys
 * rather than tabbing past three controls. Out-of-stock sizes stay visible and
 * announced but are skipped by the arrows, because hiding an option a shopper
 * came for tells them nothing about why it's gone.
 */
export default function SizeSelector({
  product,
  variants,
}: {
  product: string;
  variants: SizeVariant[];
}) {
  /* Default to the flagship when it's in stock, else the first size that is —
   * opening on a disabled option would leave the button dead on arrival. */
  const initial =
    variants.find((v) => v.size === "30ml" && v.availableForSale) ??
    variants.find((v) => v.availableForSale) ??
    variants[0];
  const [selected, setSelected] = useState<SizeId>(initial.size);

  const optionRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const active =
    variants.find((v) => v.size === selected) ?? initial;
  const meta = sizeById(active.size);
  const soldOut = !active.availableForSale;

  /* Arrow keys wrap and skip anything unbuyable. Home/End jump to the ends,
   * which the APG requires and which is the fast way to the full size. */
  function move(from: SizeId, direction: 1 | -1 | "first" | "last") {
    const buyable = variants.filter((v) => v.availableForSale);
    if (buyable.length === 0) return;

    let next: SizeVariant;
    if (direction === "first") next = buyable[0];
    else if (direction === "last") next = buyable[buyable.length - 1];
    else {
      const i = buyable.findIndex((v) => v.size === from);
      /* -1 when the current selection is itself sold out; stepping forward
       * from index 0 then lands on the first buyable option either way. */
      const start = i === -1 ? 0 : i;
      next = buyable[(start + direction + buyable.length) % buyable.length];
    }

    setSelected(next.size);
    optionRefs.current[next.size]?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent, size: SizeId) {
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        move(size, 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        move(size, -1);
        break;
      case "Home":
        e.preventDefault();
        move(size, "first");
        break;
      case "End":
        e.preventDefault();
        move(size, "last");
        break;
    }
  }

  return (
    <div>
      <Price pricing={active.pricing} className="mt-5" />

      {/* Only worth a control when there is a choice to make. A single-variant
          product still renders its price and button above and below this. */}
      {variants.length > 1 && (
        <div className="mt-6">
          <p id="size-label" className="label-engraved text-charcoal/50">
            Size
          </p>
          <div
            role="radiogroup"
            aria-labelledby="size-label"
            /* Three up even at 375px: the labels are short and stacking them
               would push the button below the fold on a phone. */
            className="mt-3 grid grid-cols-3 gap-2"
          >
            {variants.map((variant) => {
              const info = sizeById(variant.size);
              const isSelected = variant.size === selected;
              const unavailable = !variant.availableForSale;
              return (
                <button
                  key={variant.size}
                  ref={(el) => {
                    optionRefs.current[variant.size] = el;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-disabled={unavailable}
                  /* Roving tabindex: the group is one tab stop. */
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => !unavailable && setSelected(variant.size)}
                  onKeyDown={(e) => onKeyDown(e, variant.size)}
                  className={`flex cursor-pointer flex-col items-center gap-0.5 border px-2 py-3 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-deep ${
                    isSelected
                      ? "border-gold bg-gold/[0.08]"
                      : "border-charcoal/15 hover:border-charcoal/35"
                  } ${
                    unavailable
                      ? "cursor-not-allowed border-dashed opacity-45"
                      : ""
                  }`}
                >
                  <span
                    className={`font-serif text-lg leading-none ${
                      isSelected ? "text-gold-deep" : "text-charcoal"
                    } ${unavailable ? "line-through" : ""}`}
                  >
                    {info.label}
                  </span>
                  <span className="text-[0.6rem] uppercase tracking-[0.15em] text-charcoal/50">
                    {info.name}
                  </span>
                  <span className="mt-0.5 text-sm text-charcoal/70">
                    {variant.pricing.formatted}
                  </span>
                  {unavailable && (
                    <span className="text-[0.6rem] uppercase tracking-[0.15em] text-charcoal/45">
                      Sold out
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* What the chosen size actually buys. aria-live so a screen-reader user
          who arrowed through the sizes hears the wear estimate change instead
          of only the option label. */}
      <p aria-live="polite" className="mt-4 text-sm text-charcoal/60">
        {meta.label} · {meta.wear}
      </p>

      {/* The gift, stated inline. Deliberately not a modal or a popup: it is a
          reason to size up, and a shopper who has to dismiss something to keep
          reading is being interrupted, not persuaded.

          This is a fulfilment promise — nothing in Shopify adds these to the
          order, they are packed by hand — which is why it reads as a plain
          sentence and not as a cart line the drawer would have to show. */}
      {meta.gift && (
        <p className="mt-3 border-l-2 border-gold/50 pl-3 text-sm leading-relaxed text-gold-deep">
          {meta.gift}
        </p>
      )}

      <div className="mt-8">
        <AddToCartButton
          product={product}
          size={active.size}
          value={active.pricing.amount}
          disabled={soldOut}
        >
          {soldOut
            ? "Sold out"
            : `Add to Cart — ${active.pricing.formatted}`}
        </AddToCartButton>
      </div>
    </div>
  );
}
