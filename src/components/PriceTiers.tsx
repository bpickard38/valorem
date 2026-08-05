import { SIZES, sizeById } from "@/lib/site";
import type { SizeVariant } from "@/lib/shopify";

/*
 * All three sizes and their prices, on one line.
 *
 * WHY THIS EXISTS: the home page quoted $16 and $70 and never mentioned the
 * $48 15 ml at all, so a visitor saw the cheapest option and the dearest with
 * nothing between them. Two prices read as a choice between a trial and a
 * commitment; three read as a range with a middle, and the middle is what makes
 * the full size look like a considered pick rather than the expensive one.
 *
 * Every figure comes from the live Shopify variants — nothing here hardcodes a
 * price, so this line cannot drift from the product page or the cart. Sizes are
 * ordered by SIZES (cheapest first, matching the selector's display order).
 *
 * STOCK IS DELIBERATELY IGNORED HERE, and the first version got this wrong.
 * Filtering on `availableForSale` meant one sold-out size silently collapsed
 * the range to two prices — breaking the exact anchor the line exists to
 * create — and, because the Shopify fallback path reports everything as
 * unavailable, it also meant the whole line vanished during an outage and in
 * any environment without a storefront token.
 *
 * This is a statement about what the range COSTS, not a buy control: it links
 * nowhere and adds nothing to a cart. The product page's size selector is where
 * stock belongs, and it says so properly with dashed borders and a label. A
 * price shown here for a temporarily sold-out size is a far smaller problem
 * than a price range that quietly loses its middle.
 */
export default function PriceTiers({
  variants,
  className = "",
}: {
  variants: SizeVariant[];
  className?: string;
}) {
  /* Walk SIZES rather than `variants` so the order is the house order and not
   * whatever Shopify returned — then REVERSE it, because SIZES leads with the
   * 30 ml flagship and this line wants to climb.
   *
   * Ascending is the deliberate choice. Leading with $70 would anchor high and
   * make the $16 look like a discount, which is the opposite of what this page
   * does two lines above: the primary CTA is "Start with a $16 Sample" and the
   * $70 is the outline button beside it, on purpose. A tier line that opened at
   * $70 would argue against its own hero. */
  const tiers = [...SIZES]
    .reverse()
    .flatMap((size) => {
      const variant = variants.find((v) => v.size === size.id);
      return variant
        ? [{ id: size.id, label: sizeById(size.id).label, price: variant.pricing.formatted }]
        : [];
    });

  /* One price is not a range, and a range is the entire point — with a single
   * size in stock this line would just repeat the CTA above it. */
  if (tiers.length < 2) return null;

  return (
    <p
      className={`flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs tracking-wide text-charcoal/55 ${className}`}
    >
      {tiers.map((tier, i) => (
        /* Fragment per tier so the separator is a SIBLING of the size, not part
         * of it. Nested inside, a wrapped line opened with "· 5 ml $16"; as a
         * sibling the break falls after the separator instead, so a line ends
         * on "·" and reads as continuing. Each size stays nowrap so "15 ml" and
         * "$48" can never be split from each other. */
        <span key={tier.id} className="flex items-baseline gap-x-2">
          {i > 0 && (
            <span aria-hidden="true" className="text-charcoal/25">
              ·
            </span>
          )}
          <span className="whitespace-nowrap">
            {tier.label} <span className="text-charcoal/75">{tier.price}</span>
          </span>
        </span>
      ))}
    </p>
  );
}
