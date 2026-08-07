"use client";

import { useRef, useState } from "react";
import Price from "@/components/Price";
import AddToCartButton from "@/components/AddToCartButton";
import GiftLadder from "@/components/GiftLadder";
import { useSelectedSize } from "@/components/SelectedSizeProvider";
import type { SizeVariant } from "@/lib/shopify";
import {
  CURRENCY,
  formatMoney,
  giftLadder,
  preferredSize,
  sampleEquivalentSaving,
  sizeById,
} from "@/lib/site";
import type { SizeId } from "@/lib/site";

/*
 * The buy block: size, price, what the size unlocks, and the button.
 *
 * The three sizes are one Shopify product with a "Size" option, so the whole
 * control is really a variant picker — `variants` arrives already resolved by
 * the server (see productVariants) and each entry carries the real gid, so
 * Add to Cart can never send a product id or a stale default.
 *
 * Sizes run smallest-first, which is SIZES order — see the note there. The
 * shopper meets the $16 sample first and climbs.
 *
 * Beside the price, on any size where it is genuinely true, sits what that size
 * saves against buying the same volume in 5 ml samples. Derived from the LIVE
 * sample price rather than a constant, so it cannot outlive a repricing, and
 * absent entirely on the 15 ml because three samples cost exactly what the
 * 15 ml costs. See sampleEquivalentSaving — it is a saving, never a "was".
 *
 * Selection is published to SelectedSizeProvider so the gallery can bring the
 * chosen tin's photograph to the front. When no provider is above this — the
 * component works standalone — it keeps the state itself and the gallery simply
 * doesn't sync.
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
  /* The same preferredSize() the server used to seed the provider and the
   * gallery's opening photo — the three must agree, so they call one function
   * rather than each re-deriving "the flagship, unless it's sold out". */
  const initialSize = preferredSize(variants);

  /* Shared when a provider is present, local when it isn't. Both hooks always
   * run; only the pair that gets used changes. `select` rather than a plain
   * setter because the provider also notifies the gallery from inside it — see
   * the note there on why that is an event and not a state read. */
  const shared = useSelectedSize();
  const [localSize, setLocalSize] = useState<SizeId>(initialSize);
  const selected = shared?.selected ?? localSize;
  const setSelected = shared?.select ?? setLocalSize;

  const optionRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const active =
    variants.find((v) => v.size === selected) ??
    variants.find((v) => v.size === initialSize) ??
    variants[0];
  const meta = sizeById(active.size);
  const soldOut = !active.availableForSale;

  /* The ladder reads the live price, not a configured tier — so the free
   * shipping rung is the actual threshold arithmetic and cannot promise
   * something the cart then fails to apply. */
  /* The sample's live price and volume. Every "Save $N" is measured against it,
   * and it is what the gift cards show as the value of a free sample. Null when
   * the 5 ml isn't in the variant list at all — then no size claims a saving and
   * the cards show no value, rather than falling back to a hardcoded $16 that a
   * repricing in the admin would quietly invalidate. */
  const sampleMeta = sizeById("5ml");
  const samplePrice =
    variants.find((v) => v.size === "5ml")?.pricing.amount ?? null;

  const rungs = giftLadder(
    active.pricing.amount,
    meta.giftSamples,
    samplePrice,
  );

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
               would push the button below the fold on a phone.
               pt-2.5 is headroom for the "Best deal" badge, which straddles the
               top border of its option and would otherwise be clipped by the
               grid's own bounds. */
            className="mt-3 grid grid-cols-3 gap-2 pt-2.5"
          >
            {variants.map((variant) => {
              const info = sizeById(variant.size);
              const isSelected = variant.size === selected;
              const unavailable = !variant.availableForSale;
              const saving = sampleEquivalentSaving(
                variant.pricing.amount,
                info.ml,
                samplePrice,
                sampleMeta.ml,
              );

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
                  /* A badged option needs deeper top padding: the badge hangs
                     into the box by about half its height, and at the normal
                     py-3 it sits on top of the size label. */
                  className={`relative flex cursor-pointer flex-col items-center gap-0.5 border px-2 pb-3 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-deep ${
                    info.badge ? "pt-5" : "pt-3"
                  } ${
                    isSelected
                      ? "border-gold bg-gold/[0.08]"
                      : "border-charcoal/15 hover:border-charcoal/35"
                  } ${
                    unavailable
                      ? "cursor-not-allowed border-dashed opacity-45"
                      : ""
                  }`}
                >
                  {/* Straddles the top border, Carpe-style. Set in charcoal
                      rather than green or gold on purpose: green is spoken for
                      as "unlocked" on the cards below, and gold already means
                      "selected" on this very control — a badge in either would
                      be read as a state rather than a recommendation. */}
                  {info.badge && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-charcoal px-2 py-1 text-[0.55rem] font-medium uppercase tracking-[0.12em] text-ivory">
                      {info.badge}
                    </span>
                  )}
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

                  {/* Set in gold rather than muted grey: this is the argument
                      for climbing the row, and on the only size that makes it.
                      The visible chip stays two words — the basis for the
                      figure would not fit a 110px box at 375px — so the
                      comparison it rests on is spoken to screen readers and
                      spelled out in sampleEquivalentSaving. */}
                  {saving !== null && (
                    <span className="mt-1.5 border border-gold/35 bg-gold/[0.10] px-1.5 py-0.5 text-[0.65rem] font-medium leading-none text-gold-deep">
                      Save {formatMoney(saving, CURRENCY)}
                      <span className="sr-only">
                        {" "}
                        compared with buying {info.label} as{" "}
                        {info.ml / sampleMeta.ml} separate {sampleMeta.label}{" "}
                        samples
                      </span>
                    </span>
                  )}

                  {unavailable && (
                    <span className="mt-1 text-[0.6rem] uppercase tracking-[0.15em] text-charcoal/45">
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

      {/* The offer, as a ladder rather than as the one sentence that used to
          sit here. That sentence only ever described the size ALREADY chosen,
          so the reason to trade up was invisible until after trading up.
          Deliberately not a modal or a popup: a shopper who has to dismiss
          something to keep reading is being interrupted, not persuaded. */}
      <GiftLadder rungs={rungs} className="mt-5" />

      <div className="mt-6">
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
