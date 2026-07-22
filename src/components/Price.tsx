import type { Pricing } from "@/lib/shopify";

/*
 * A price, and the sale around it if one is running.
 *
 * Sale state is driven entirely by the compare-at price in Shopify: set it
 * above the price and the struck-through original, the discounted figure and
 * the percentage all appear here on their own. Nothing in the code needs to
 * know a promotion started.
 *
 * The original is announced to screen readers as "was $70" rather than left
 * as a bare struck-through number, which reads as two prices with no relation
 * between them.
 */
export default function Price({
  pricing,
  className = "",
  size = "lg",
}: {
  pricing: Pricing;
  className?: string;
  /* lg — the buy block. sm — inline in a line of copy. */
  size?: "lg" | "sm";
}) {
  const priceType = size === "lg" ? "font-serif text-3xl" : "font-serif text-xl";
  const wasType = size === "lg" ? "text-lg" : "text-sm";

  if (!pricing.onSale) {
    return (
      <p className={`${priceType} text-charcoal ${className}`}>
        {pricing.formatted}
      </p>
    );
  }

  return (
    <div className={`flex flex-wrap items-baseline gap-x-3 gap-y-1 ${className}`}>
      <p className={`${priceType} text-gold-deep`}>{pricing.formatted}</p>
      <p className={`${wasType} text-charcoal/45 line-through`}>
        <span className="sr-only">was </span>
        {pricing.compareAtFormatted}
      </p>
      {pricing.percentOff !== null && (
        <span className="label-engraved border border-gold/40 bg-gold/[0.08] px-2 py-1 text-gold-deep">
          {pricing.percentOff}% off
        </span>
      )}
    </div>
  );
}
