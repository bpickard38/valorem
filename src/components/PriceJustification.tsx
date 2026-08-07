import {
  CURRENCY,
  SAMPLE_SIZE,
  STICK_SIZE,
  WEAR_DAYS_MIN,
  WEAR_ESTIMATE,
  formatMoney,
  sizeById,
} from "@/lib/site";
import type { Pricing } from "@/lib/shopify";

/*
 * The cost-per-day line.
 *
 * NO LONGER RENDERED ON THE PRODUCT PAGE (2026-08-07). The size selector now
 * shows a per-day figure under each size, derived from the size the shopper has
 * actually selected — which is strictly better than this component's compromise
 * of always naming the 30 ml — so keeping both meant making the same argument
 * twice, the second time about a size that might not be chosen.
 *
 * The file is kept rather than deleted because of the note directly below: it is
 * the record of the owner's explicit override of the no-cost-per-wear rule, and
 * that override is what makes the selector's per-day line publishable at all.
 * Delete this and the reasoning behind a figure still on the page goes with it.
 *
 * NOTE A REVERSED DECISION, so nobody re-litigates it by accident:
 * ValueComparison.tsx holds the standing rule that the case for $70 is argued
 * on what you get, never on cost-per-wear, because a price per use frames a
 * premium product as a cheap one. This component is the owner's explicit
 * override of that (2026-08-03) and it is the ONLY one — the rule still applies
 * everywhere else, and ValueComparison says so. The two coexist on the same
 * page: that block states what the money buys, this states how long it lasts.
 * Kept to a single sentence so it reads as a footnote to the price rather than
 * a discount pitch, which is the risk the original rule guarded against.
 *
 * Two things the arithmetic does deliberately:
 *
 *   - It divides by WEAR_DAYS_MIN, the SHORT end of the wear range. Six months
 *     rather than eight, because a longer stick makes the daily figure smaller
 *     and quoting the flattering end of a range is how an estimate becomes a
 *     claim. The number shown is therefore the most it costs per day, not the
 *     least.
 *   - It rounds UP to the cent, for the same reason.
 *
 * It also takes `pricing` live from Shopify rather than the PRICE constant, so
 * the figure cannot survive a price change — and it names the 30 ml explicitly
 * instead of tracking the size selector, because a per-day figure derived from
 * the full size and displayed while a shopper has the 5 ml selected would be
 * quietly wrong.
 *
 * The six-to-eight-month figure this divides into was confirmed verified by the
 * owner on 2026-08-03, which is what makes a per-day figure publishable at all:
 * dividing by an estimate produces an estimate wearing a decimal point, which
 * reads as far more confident than the range behind it.
 */
export default function PriceJustification({
  pricing,
  className = "",
}: {
  /* The 30 ml variant's live pricing. */
  pricing: Pricing;
  className?: string;
}) {
  if (!pricing || WEAR_DAYS_MIN <= 0) return null;

  const perDay = Math.ceil((pricing.amount / WEAR_DAYS_MIN) * 100) / 100;

  /* The samples clause is conditional on the promise still existing in SIZES.
   * A hardcoded "ships with two free samples" would keep promising hand-packed
   * product after the gift was dropped. Set `giftSamples` to 0 there and this
   * half-sentence disappears with it. */
  const hasGift = sizeById("30ml").giftSamples > 0;

  return (
    <p className={`text-sm leading-relaxed text-charcoal/60 ${className}`}>
      {STICK_SIZE} is about {WEAR_ESTIMATE} of daily wear — under{" "}
      <span className="text-charcoal/80">
        {formatMoney(perDay, CURRENCY)} a day
      </span>
      {hasGift
        ? `, and every full size ships with two free ${SAMPLE_SIZE} samples.`
        : "."}
    </p>
  );
}
