/*
 * Star rating. Renders a real fractional average by clipping a gold layer
 * over a muted one — a 4.3 looks like a 4.3, not a rounded 4.
 */
export default function Stars({
  rating,
  className = "",
}: {
  rating: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  const glyphs = "★★★★★";

  return (
    <span
      className={`relative inline-block select-none leading-none ${className}`}
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      <span aria-hidden="true" className="text-charcoal/20">
        {glyphs}
      </span>
      <span
        aria-hidden="true"
        className="absolute inset-0 overflow-hidden text-gold"
        style={{ width: `${pct}%` }}
      >
        {glyphs}
      </span>
    </span>
  );
}
