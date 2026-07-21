import {
  PRICE,
  STICK_SIZE,
  WEAR_ESTIMATE,
  FRAGRANCE_LOAD,
  VALUE_COMPARISON,
} from "@/lib/site";

/*
 * Why $70. Stated as arithmetic, not argument — the numbers do the work and
 * the copy stays out of their way.
 *
 * Mobile-first: stacked cards on a phone (each row readable on its own),
 * a three-column table on desktop. All figures come from lib/site.ts.
 */

const columns = [
  VALUE_COMPARISON.ours,
  VALUE_COMPARISON.typicalSolid,
  VALUE_COMPARISON.designerEdp,
] as const;

export default function ValueComparison() {
  return (
    <section aria-labelledby="value-heading" className="w-full">
      <h2
        id="value-heading"
        className="font-serif text-2xl leading-snug text-charcoal sm:text-3xl"
      >
        What {PRICE} actually buys.
      </h2>
      <p className="mt-3 max-w-prose text-sm leading-relaxed text-charcoal/65">
        {STICK_SIZE} at a {FRAGRANCE_LOAD} fragrance load. Most solids carry a
        fraction of that and are gone in weeks. One stick is about{" "}
        {WEAR_ESTIMATE} of daily wear.
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
                {col.perWear}
              </p>
            </div>
          );
        })}
      </div>

      <p className="mt-5 text-sm leading-relaxed text-charcoal/60">
        {PRICE} ÷ {WEAR_ESTIMATE} of daily wear ={" "}
        <span className="text-charcoal/80">
          {VALUE_COMPARISON.ours.perWear.toLowerCase()}
        </span>
        . The designer bottle costs more than twice as much and never leaves
        the house.
      </p>
    </section>
  );
}
