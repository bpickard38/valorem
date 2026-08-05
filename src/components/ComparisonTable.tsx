import { COMPARISON, COMPARISON_MIN_ROWS } from "@/lib/site";
import type { ComparisonRow } from "@/lib/site";

/*
 * Valorem against the category, row by row.
 *
 * RIGHT NOW THIS RENDERS NOTHING, and that is the component working, not
 * failing. Of the four rows in COMPARISON (lib/site.ts) exactly one survives
 * verification, and one row is a sentence rather than a table — so the gate
 * below returns null. Each row's `note` says precisely what would flip it.
 *
 * The gate is the whole design. A checkmark-and-cross table looks like a
 * layout and behaves like a set of factual assertions about other companies'
 * products, so the filter runs in the component and not in a reviewer's head:
 * writing copy into an unverified row is not enough to publish it.
 *
 * Two structural decisions worth keeping:
 *
 *   - The marks are never the only signal. Every cell carries its own words,
 *     so the table is readable with images off, by a screen reader, and by
 *     someone who cannot tell the green from the red. A bare tick in a column
 *     headed "Other premium solids" also states nothing checkable, which is
 *     how a hedge ("typically") gets quietly lost in visual shorthand.
 *   - Real <table> markup. This is tabular data with row and column headers,
 *     and a screen reader announces "How you apply it, Valorem, twist-up
 *     stick" only if the scope attributes are there to do it.
 *
 * Palette: the checks and crosses are the site's own gold and a muted
 * charcoal, NOT the green-and-red of the pattern this was modelled on. Six
 * saturated traffic-light glyphs would be the loudest thing on an ivory page
 * built out of gold and stone.
 */

function Mark({ has }: { has: boolean }) {
  /* aria-hidden throughout: the adjacent text is the accessible content, and
   * announcing "check mark" before it just doubles every cell. */
  return has ? (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-4 w-4 shrink-0 text-gold-deep"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 10.5 8 14.5 16 6" />
    </svg>
  ) : (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-4 w-4 shrink-0 text-charcoal/30"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5.5 5.5 14.5 14.5M14.5 5.5 5.5 14.5" />
    </svg>
  );
}

function Cell({
  value,
  has,
  emphasis,
}: {
  value: string;
  has: boolean;
  emphasis: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="pt-0.5">
        <Mark has={has} />
      </span>
      <span
        className={`min-w-0 text-sm leading-snug ${
          emphasis ? "text-charcoal" : "text-charcoal/60"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function ComparisonTable({
  className = "",
}: {
  className?: string;
}) {
  const rows: ComparisonRow[] = COMPARISON.rows.filter((r) => r.verified);

  /* One verified row is not a comparison. Rather than publish a
   * single-row table, publish nothing and let the fact live in prose —
   * "Why Solid" on the home page already makes the format argument in
   * sentences. Raise or lower the bar in lib/site.ts. */
  if (rows.length < COMPARISON_MIN_ROWS) return null;

  return (
    <section aria-labelledby="comparison-heading" className={className}>
      <div className="mx-auto max-w-xl text-center">
        <p className="label-engraved text-charcoal/50">The Difference</p>
        <h2 id="comparison-heading" className="type-heading mt-5 text-charcoal">
          How it compares.
        </h2>
      </div>

      {/* overflow-x-auto on the WRAPPER, never the page: the table scrolls
          inside its own box and the body never scrolls sideways.

          `min-w-[28rem]` is why that matters. Three columns inside 375px of
          phone gives each value cell about 68px of text — "Typically a tin,
          applied with fingers" wraps to six lines and the row grows to 137px
          of stacked fragments. Holding the table at 448px and letting the last
          ~110px scroll keeps a readable measure (~145px per cell) at the cost
          of a swipe, which is the better trade for tabular data: the columns
          stay aligned, and a comparison whose two sides can't be read side by
          side isn't doing its job. The `.no-scrollbar` treatment is
          deliberately NOT used here — on a table the scrollbar is the only
          affordance telling a reader there is more to the right. */}
      <div className="mx-auto mt-12 w-full max-w-3xl overflow-x-auto">
        <table className="w-full min-w-[28rem] border-collapse text-left">
          <caption className="sr-only">
            {COMPARISON.ours} compared with {COMPARISON.theirs}
          </caption>
          <thead>
            <tr className="border-b border-charcoal/15">
              {/* Empty corner cell above the row labels. */}
              <td className="w-[24%] py-3" />
              <th
                scope="col"
                className="w-[38%] px-3 py-3 font-serif text-base font-normal uppercase tracking-[0.14em] text-gold-deep sm:text-lg"
              >
                {COMPARISON.ours}
              </th>
              <th
                scope="col"
                className="w-[38%] px-3 py-3 font-serif text-base font-normal text-charcoal/55 sm:text-lg"
              >
                {COMPARISON.theirs}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.label}
                className="border-b border-charcoal/10 align-top"
              >
                <th
                  scope="row"
                  className="py-5 pr-3 text-xs font-normal uppercase tracking-[0.14em] text-charcoal/50"
                >
                  {row.label}
                </th>
                <td className="bg-gold/[0.05] px-3 py-5">
                  <Cell {...row.ours} emphasis />
                </td>
                <td className="px-3 py-5">
                  <Cell {...row.theirs} emphasis={false} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
