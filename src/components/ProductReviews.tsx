import Stars from "@/components/Stars";
import { getProductReviews, reviewsConfigured } from "@/lib/reviews";
import { previewSummary } from "@/lib/reviewsPreview";
import type { ScentId } from "@/lib/shopify";
import { SCENTS } from "@/lib/site";

/*
 * Review section for a product page. Server component — the Judge.me token
 * never reaches the browser and the reviews are part of the HTML, so they are
 * indexable.
 *
 * Three honest states, no invented ones:
 *   - no provider configured  → an invitation to be the first buyer
 *   - provider live, 0 reviews → same invitation
 *   - provider live, N reviews → the real reviews
 *
 * Plus a fourth that exists only on localhost: sample content for laying out
 * the section. previewSummary() returns null when NODE_ENV is "production",
 * and Next inlines that check at build time so the samples are stripped from
 * the deployed bundle entirely. Real reviews always win over the samples.
 */
export default async function ProductReviews({ scent }: { scent: ScentId }) {
  const real = await getProductReviews(scent);
  const name = SCENTS[scent].name;

  const isPreview = (real === null || real.count === 0) && previewSummary(scent) !== null;
  const summary = isPreview ? previewSummary(scent) : real;
  const hasReviews = summary !== null && summary.count > 0;

  return (
    <section aria-labelledby="reviews-heading" className="w-full">
      {isPreview && (
        /* Impossible to mistake for the real thing in a screenshot, and gone
         * from the production bundle along with the samples themselves. */
        <p className="mb-6 border border-red-500 bg-red-50 px-4 py-3 text-xs font-medium uppercase tracking-[0.15em] text-red-700">
          Local preview only — sample reviews for design work. Never rendered
          in production, never sent to a browser. houseofvalorem.com shows
          &ldquo;No reviews yet&rdquo; until a real customer writes one.
        </p>
      )}
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2
          id="reviews-heading"
          className="font-serif text-2xl leading-snug text-charcoal sm:text-3xl"
        >
          Reviews
        </h2>
        {hasReviews && (
          <p className="flex items-center gap-2 text-sm text-charcoal/70">
            <Stars rating={summary.average} className="text-base" />
            <span className="tabular-nums">{summary.average.toFixed(1)}</span>
            <span className="text-charcoal/50">
              · {summary.count} {summary.count === 1 ? "review" : "reviews"}
            </span>
          </p>
        )}
      </div>

      {hasReviews ? (
        <ul className="mt-8 flex flex-col divide-y divide-charcoal/10">
          {summary.reviews.map((review) => (
            <li key={review.id} className="py-6 first:pt-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Stars rating={review.rating} className="text-sm" />
                <span className="text-sm font-medium text-charcoal">
                  {review.author}
                </span>
                {review.verified && (
                  <span className="text-[0.6rem] uppercase tracking-[0.2em] text-gold-deep">
                    Verified buyer
                  </span>
                )}
              </div>
              {review.title && (
                <p className="mt-3 font-serif text-lg text-charcoal">
                  {review.title}
                </p>
              )}
              <p className="mt-2 text-sm leading-relaxed text-charcoal/70">
                {review.body}
              </p>
              <p className="mt-3 text-xs text-charcoal/40">
                {new Date(review.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        /* Deliberately empty of numbers. A rating cannot be shown before a
         * customer has given one. */
        <div className="mt-6 border border-charcoal/10 px-6 py-10 text-center">
          <p className="font-serif text-xl text-charcoal">
            No reviews yet.
          </p>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-charcoal/60">
            {name}{" "}
            is new. Order it, wear it for 30 days, and tell us honestly —
            we&rsquo;ll publish it either way.
          </p>
          {!reviewsConfigured() && process.env.NODE_ENV !== "production" && (
            <p className="mt-6 text-xs tracking-wide text-charcoal/40">
              Dev note: set JUDGEME_API_TOKEN and JUDGEME_SHOP_DOMAIN to pull
              live reviews.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
