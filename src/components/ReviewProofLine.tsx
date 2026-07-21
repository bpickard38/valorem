import Link from "next/link";
import Stars from "@/components/Stars";
import { getAggregateReviews } from "@/lib/reviews";
import { SCENTS } from "@/lib/site";
import type { ScentId } from "@/lib/shopify";

/*
 * Homepage social proof. Renders nothing at all until real reviews exist —
 * getAggregateReviews returns null with no provider configured or a zero
 * count, and null here means no DOM, not an empty five stars.
 *
 * The moment the first review lands it appears on its own.
 */
export default async function ReviewProofLine({
  className = "",
}: {
  className?: string;
}) {
  const scents = Object.keys(SCENTS) as ScentId[];
  const aggregate = await getAggregateReviews(scents);
  if (!aggregate) return null;

  return (
    <Link
      href={`/product/${scents[0]}#reviews-heading`}
      className={`group inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 ${className}`}
    >
      <Stars rating={aggregate.average} className="text-lg" />
      <span className="text-sm text-charcoal/75">
        <span className="tabular-nums">{aggregate.average.toFixed(1)}</span> from{" "}
        <span className="tabular-nums">{aggregate.count}</span>{" "}
        {aggregate.count === 1 ? "review" : "reviews"}
      </span>
      <span className="text-xs uppercase tracking-[0.2em] text-gold-deep underline-offset-4 group-hover:underline">
        Read them
      </span>
    </Link>
  );
}
