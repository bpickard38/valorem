import { PRICE, STICK_SIZE, VALUE_SPECS, WEAR_ESTIMATE } from "@/lib/site";

/*
 * Why $70 — stated in Valorem's own specs, with no competitor column.
 *
 * The three-column comparison this replaced ("Other premium solids" /
 * "Designer perfume") was deleted on 2026-08-03: one column's figures were
 * contradicted by research and the other's price overstated the category. The
 * full reasoning is on VALUE_SPECS in lib/site.ts, including why adding a
 * competitor column back is harder than it looks — this block's own metric,
 * size and concentration, is one a spray actually wins.
 *
 * The comparative argument now lives in ComparisonTable, made on mechanism.
 * This block states what the money buys and then says the one thing a spec
 * table cannot: that the point is where the oil ends up.
 *
 * STILL NO COST-PER-WEAR HERE. That rule survives the rewrite — a price per use
 * frames a premium product as a cheap one. PriceJustification.tsx is the
 * owner's deliberate, documented exception to it and it sits higher up the
 * product page, by the price, where it reads as a footnote rather than a pitch.
 * Don't add a second one here.
 *
 * Mobile-first: stacked rows on a phone, one row of specs on desktop.
 */

/* `price` lets a caller pass the live Shopify figure so the argument quotes
 * what the shopper is actually being asked to pay. It falls back to the
 * constant for callers that have no live pricing to hand. */
export default function ValueComparison({ price = PRICE }: { price?: string }) {
  return (
    <section aria-labelledby="value-heading" className="w-full">
      <h2
        id="value-heading"
        className="font-serif text-2xl leading-snug text-charcoal sm:text-3xl"
      >
        What {price} actually buys.
      </h2>
      <p className="mt-3 max-w-prose text-sm leading-relaxed text-charcoal/65">
        {STICK_SIZE} of wax at a high concentration, and about {WEAR_ESTIMATE}{" "}
        of daily wear from one stick. The wax is the point: it holds the oil
        against warm skin and releases it through the day instead of
        evaporating it into the room in the first hour.
      </p>

      <dl className="mt-8 grid gap-px overflow-hidden border border-charcoal/10 bg-charcoal/10 sm:grid-cols-3">
        {VALUE_SPECS.map((spec) => (
          <div
            key={spec.label}
            className="flex flex-col gap-2 bg-gold/[0.07] px-5 py-6"
          >
            <dt className="label-engraved text-gold-deep">{spec.label}</dt>
            <dd className="font-serif text-xl text-charcoal">{spec.value}</dd>
          </div>
        ))}
      </dl>

      {/* NO free-samples line here, though it was written and cut. The gift
          ladder under the size selector already states it above this block, per
          size and with the "different from your purchase" qualifier attached. A
          second mention in the same scroll is not emphasis, it is the page
          repeating itself — and this one would have to restate the qualifier or
          quietly drop it. */}
    </section>
  );
}
