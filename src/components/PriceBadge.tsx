import { PRICE_BADGE } from "@/lib/site";
import type { Pricing } from "@/lib/shopify";

/*
 * Urgency beside the price.
 *
 * RENDERS NOTHING TODAY. PRICE_BADGE is null in lib/site.ts, by the owner's
 * decision on 2026-08-03 ("neither for now"). Setting that constant is the
 * only thing needed to turn this on.
 *
 * The brief asked for a struck-through "was" price — $20/$60/$120 against the
 * live $16/$48/$70. That is not built, and could not be built out of this
 * component, because Valorem has only ever sold at $16/$48/$70 (set
 * 2026-07-25). A "was" price describing no sale that ever happened is a
 * former-price misrepresentation under FTC guidance and a false-discount
 * violation under Meta's ad policy — a legal exposure rather than a style
 * choice, which is why the request was flagged instead of implemented.
 *
 * So the two modes are:
 *
 * "founding" — the honest way to get the same urgency. The reference price is
 *   in the FUTURE, so it asserts nothing about the past: "founding price,
 *   increases to $X on DATE". It is a promise rather than a claim, which means
 *   the date has to be real and the increase has to happen. A founding price
 *   that keeps sliding is a fake discount that took the long way round.
 *
 * "compare-at" — a genuine markdown. Note what this mode has no field for: a
 *   price. It reads `pricing.compareAtFormatted`, which comes from Shopify, so
 *   it can only ever announce a markdown that actually exists in the admin. If
 *   compare-at is unset it renders nothing, and no amount of configuration
 *   here can make it show a figure nobody was charged. Price.tsx already draws
 *   the struck-through number itself; this mode only adds the label beside it.
 */
export default function PriceBadge({
  pricing,
  className = "",
}: {
  /* Only "compare-at" reads this, but both modes take it so a caller never
   * has to know which mode is configured. */
  pricing?: Pricing;
  className?: string;
}) {
  const config = PRICE_BADGE;
  if (!config) return null;

  const skin =
    "inline-block border border-gold/40 bg-gold/[0.08] px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.18em] text-gold-deep";

  if (config.mode === "founding") {
    return (
      <p className={`${skin} ${className}`}>
        Founding price — increases to {config.increasesTo} on{" "}
        {config.increasesOn}
      </p>
    );
  }

  /* compare-at: Shopify is the only source. No live markdown, no badge. */
  if (!pricing?.onSale || !pricing.compareAtFormatted) return null;

  return <p className={`${skin} ${className}`}>{config.label}</p>;
}
