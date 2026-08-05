import Link from "next/link";
import Stars from "@/components/Stars";
import { getTestimonials } from "@/lib/reviews";
import { previewTestimonials } from "@/lib/reviewsPreview";
import { SCENTS, productTitle } from "@/lib/site";
import type { ScentId } from "@/lib/shopify";

/*
 * Homepage testimonial row — three quote cards, real reviews only.
 *
 * Server component, so the Judge.me token stays on the server and the quotes
 * are in the HTML a crawler sees. Same data path as the product-page reviews
 * (lib/reviews.ts), so a quote here and the same review there cannot drift.
 *
 * THE EMPTY CASE RENDERS NOTHING. Not a skeleton, not "reviews coming soon",
 * not a placeholder card — `return null`, no DOM, no vertical space. This
 * follows ReviewProofLine, and the reason is the same: the day this section
 * has content is the day a customer supplies it. Until then the page is one
 * section shorter and no visitor is any the wiser.
 *
 * Nothing here shows a review COUNT. The cards say what individual people
 * wrote; they never imply how many people wrote it, because three cards drawn
 * from three reviews and three drawn from three hundred look identical and
 * only one of those is a claim this brand can make.
 */
export default async function TestimonialCards({
  className = "",
}: {
  className?: string;
}) {
  const scents = Object.keys(SCENTS) as ScentId[];
  const real = await getTestimonials(scents, 3);

  /* Samples only when there is nothing real AND we are not in production.
   * previewTestimonials() returns [] when NODE_ENV is "production" and Next
   * inlines that check at build time, so the sample text is dropped from the
   * deployed bundle — the mechanism ProductReviews already relies on. Real
   * reviews always win. */
  const preview = real.length === 0 ? previewTestimonials(3) : [];
  const isPreview = preview.length > 0;
  const testimonials = isPreview ? preview : real;

  if (testimonials.length === 0) return null;

  return (
    <section
      aria-labelledby="testimonials-heading"
      className={`px-5 py-24 sm:py-28 md:px-6 ${className}`}
    >
      {isPreview && (
        /* Impossible to mistake for the real thing, and gone from the
         * production bundle along with the samples themselves. */
        <p className="mx-auto mb-10 max-w-5xl border border-red-500 bg-red-50 px-4 py-3 text-xs font-medium uppercase tracking-[0.15em] text-red-700">
          Local preview only — sample testimonials for design work. Never
          rendered in production. houseofvalorem.com shows this section only
          once real reviews exist.
        </p>
      )}

      <div className="mx-auto max-w-xl text-center">
        <p className="label-engraved text-charcoal/50">In Their Words</p>
        <h2 id="testimonials-heading" className="type-heading mt-5 text-charcoal">
          What people say once they&rsquo;ve worn it.
        </h2>
      </div>

      {/* One column on a phone, three from md. Two-up at sm was tried and
          cut — it leaves a single orphaned card on the second row, which is
          the one arrangement that looks like a bug rather than a layout.
          items-start so a short card doesn't stretch to a tall neighbour. */}
      <ul className="mx-auto mt-14 grid w-full max-w-5xl items-start gap-6 md:grid-cols-3 md:gap-7">
        {testimonials.map((t) => (
          <li
            key={t.id}
            /* Padding eases back at the md breakpoint. Three columns inside
               max-w-5xl are ~216px wide at exactly 768px — the same width the
               "Why Solid" and six-scent grids use, so the column count matches
               the rest of the page. But those sections have no box around them,
               and px-6 here would spend 48 of those 216px on padding and leave
               a 166px measure for a three-sentence quote. Full padding returns
               at lg, where there is room for it. */
            className="flex h-full flex-col border border-charcoal/10 bg-stone/25 px-4 py-6 lg:px-6 lg:py-7"
          >
            {/* The real rating, always. A four-star review renders four
                stars — see the rule in lib/reviews.ts. */}
            <Stars rating={t.rating} className="text-base" />

            {/* The reviewer's OWN title, or nothing. This component does not
                pull a phrase out of the body to bold — that would be editing
                someone's testimonial. Cards without one lead with the body,
                which reads fine because the quote mark carries the weight. */}
            {t.headline && (
              <h3 className="mt-4 font-serif text-xl leading-snug text-charcoal">
                {t.headline}
              </h3>
            )}

            {/* min-w-0 + break-words: a reviewer can type a 40-character
                unbroken string and a fixed grid column has no way to absorb
                it otherwise. */}
            <blockquote className="mt-3 min-w-0 grow text-sm leading-relaxed break-words text-charcoal/70">
              {t.body}
            </blockquote>

            <footer className="mt-5 flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t border-charcoal/10 pt-4">
              <cite className="text-sm font-medium not-italic text-charcoal">
                {t.author}
              </cite>
              {/* Which scent it was left on. A testimonial attached to a
                  product a shopper can open is worth more than a floating
                  quote, and it is also the honest attribution — this person
                  reviewed one scent, not the range. */}
              <Link
                href={`/product/${t.scent}`}
                className="text-[0.65rem] uppercase tracking-[0.2em] text-gold-deep underline-offset-4 hover:underline"
              >
                {productTitle(SCENTS[t.scent])}
              </Link>
            </footer>
          </li>
        ))}
      </ul>
    </section>
  );
}
