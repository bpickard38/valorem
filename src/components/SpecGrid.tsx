import { PRODUCT_SPECS } from "@/lib/site";
import type { ProductSpec } from "@/lib/site";

/*
 * The spec row — six facts about the product, under the story.
 *
 * WHAT MAKES THIS ROW DIFFERENT from the icon strip it is modelled on: nothing
 * in it is an adjective. Every row is a number or a mechanism, and every one is
 * gated on `verified` in site.ts, which is where the reasoning for each lives.
 * The offer — free shipping, the free samples — is NOT here: it moved up to the
 * gift ladder under the size selector, because an offer stated twice on one
 * page trains a shopper to skim both. See the long note on PRODUCT_SPECS.
 *
 * The visual rules that make it read as one set rather than six stickers:
 *
 *   ONE STROKE WEIGHT. Every glyph is 1.25 on a 24 box with round caps and
 *   joins, drawn to the same optical size inside it. Mixing a filled glyph into
 *   a stroked set is the single thing that makes an icon row look bought rather
 *   than drawn, and it is invisible until all six sit in a line.
 *
 *   ONE BASELINE. The icon is a fixed-height box and the label starts at the
 *   same y in every cell, so the row scans horizontally even when one label
 *   wraps to two lines and its neighbours don't. `items-start` plus a fixed
 *   icon box does this; centering would let each cell find its own baseline.
 *
 *   NO BOXES. Cells are separated by the grid's own gap and a single hairline
 *   rule, not by six bordered cards — at this size a border per cell is more
 *   ink than the content inside it.
 */
export default function SpecGrid({ className = "" }: { className?: string }) {
  /* The gate, not documentation: an unverified spec cannot reach the page on
   * the strength of good copy alone. */
  const specs = PRODUCT_SPECS.filter((s) => s.verified);
  if (specs.length === 0) return null;

  return (
    <section
      aria-label="Product specifications"
      className={`border-t border-charcoal/10 pt-6 ${className}`}
    >
      <ul className="grid grid-cols-2 gap-x-5 gap-y-6 sm:grid-cols-3">
        {specs.map((spec) => (
          <li key={spec.label} className="flex items-start gap-2.5">
            <span className="mt-px shrink-0 text-gold-deep">
              <SpecIcon icon={spec.icon} />
            </span>
            <div className="min-w-0">
              <p className="text-[0.8rem] font-medium leading-snug text-charcoal">
                {spec.label}
              </p>
              <p className="mt-1 text-[0.7rem] leading-snug text-charcoal/50">
                {spec.detail}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* One <svg> shell, six paths — so stroke weight, cap style and box size are
 * physically impossible to set differently per icon. Adding a spec means adding
 * a case here and nothing else. */
function SpecIcon({ icon }: { icon: ProductSpec["icon"] }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-[18px] w-[18px]"
    >
      {PATHS[icon]}
    </svg>
  );
}

const PATHS: Record<ProductSpec["icon"], React.ReactNode> = {
  /* The tin, twisted up. */
  tin: (
    <>
      <rect x="7" y="8" width="10" height="13" rx="1.5" />
      <path d="M9 8V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V8" />
      <path d="M7 11.5h10" />
    </>
  ),
  /* Concentration — a droplet. */
  load: (
    <>
      <path d="M12 3s5.5 6.1 5.5 9.8A5.5 5.5 0 0 1 12 21a5.5 5.5 0 0 1-5.5-8.2C6.5 9.1 12 3 12 3Z" />
      <path d="M9.5 14.5a2.6 2.6 0 0 0 2.5 2.6" />
    </>
  ),
  /* Wear time — a calendar. */
  wear: (
    <>
      <rect x="3.5" y="5.5" width="17" height="15" rx="1.5" />
      <path d="M3.5 10h17" />
      <path d="M8 3.5v4M16 3.5v4" />
      <path d="M8 14h3" />
    </>
  ),
  /* The wax base — poured layers. */
  wax: (
    <>
      <path d="M3.5 8.5 12 4.5l8.5 4-8.5 4Z" />
      <path d="m3.5 12.5 8.5 4 8.5-4" />
      <path d="m3.5 16.5 8.5 4 8.5-4" />
    </>
  ),
  /* No denatured alcohol — an atomiser, struck through. */
  solvent: (
    <>
      <path d="M9 9.5h6a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z" />
      <path d="M10 9.5v-3h4v3" />
      <path d="M4 4l16 16" />
    </>
  ),
  /* Not a liquid — a pocket. */
  solid: (
    <>
      <path d="M5 4.5h14a1.5 1.5 0 0 1 1.5 1.5v13a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V6A1.5 1.5 0 0 1 5 4.5Z" />
      <path d="M8.5 4.5v6a3.5 3.5 0 0 0 7 0v-6" />
    </>
  ),
};
