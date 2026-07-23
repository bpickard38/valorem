import {
  PRICE,
  STICK_SIZE,
  WEAR_ESTIMATE,
  FRAGRANCE_LOAD,
  VALUE_COMPARISON,
} from "@/lib/site";

/*
 * Why $70. The argument is size and concentration, never cost-per-wear —
 * quoting a price per use frames a premium product as a cheap one.
 *
 * Mobile-first: stacked cards on a phone (each row readable on its own),
 * a three-column table on desktop. All figures come from lib/site.ts.
 */

/* `price` lets a caller pass the live Shopify figure so the argument quotes
 * what the shopper is actually being asked to pay. It falls back to the
 * constant for callers that have no live pricing to hand. */
export default function ValueComparison({ price = PRICE }: { price?: string }) {
  const columns = [
    { ...VALUE_COMPARISON.ours, price },
    VALUE_COMPARISON.otherSolids,
    VALUE_COMPARISON.designer,
  ];

  return (
    <section aria-labelledby="value-heading" className="w-full">
      <h2
        id="value-heading"
        className="font-serif text-2xl leading-snug text-charcoal sm:text-3xl"
      >
        What {price} actually buys.
      </h2>
      <p className="mt-3 max-w-prose text-sm leading-relaxed text-charcoal/65">
        {STICK_SIZE} at a {FRAGRANCE_LOAD} fragrance load. Other premium solids
        ask the same {price} for a fifth of the wax at half the concentration.
        One stick is about {WEAR_ESTIMATE} of daily wear.
      </p>

      <div className="mt-8 grid gap-px overflow-hidden border border-charcoal/10 bg-charcoal/10 sm:grid-cols-3">
        {columns.map((col, i) => {
          const isOurs = i === 0;
          return (
            <div
              key={col.label}
              className={`flex flex-col gap-2 px-5 py-6 ${
                isOurs ? "bg-gold/[0.07]" : "bg-ivory"
              }`}
            >
              <p
                className={`label-engraved ${
                  isOurs ? "text-gold-deep" : "text-charcoal/50"
                }`}
              >
                {col.label}
              </p>
              <p className="mt-1 font-serif text-2xl text-charcoal">
                {col.price}
              </p>
              <p className="text-sm text-charcoal/70">{col.size}</p>
              <p className="text-sm text-charcoal/70">{col.load}</p>
              <p
                className={`mt-2 text-sm ${
                  isOurs ? "font-medium text-gold-deep" : "text-charcoal/55"
                }`}
              >
                {col.note}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
