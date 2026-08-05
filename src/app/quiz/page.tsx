import type { Metadata } from "next";
import FadeIn from "@/components/FadeIn";
import HomeHeader from "@/components/HomeHeader";
import HomeFooter from "@/components/HomeFooter";
import ReviewProofLine from "@/components/ReviewProofLine";
import ScentQuiz from "@/components/ScentQuiz";
import { loadQuizScents } from "@/lib/quizScents";
import { QUIZ_SEO, toMetadata } from "@/lib/seo";
import { SAMPLE_GIFT, productImageFit, productImageFrame } from "@/lib/site";

export const metadata: Metadata = toMetadata(QUIZ_SEO);

/* Reads Shopify for the six result cards, so it follows the site convention:
 * ISR at an hour, with the 5-minute variant cache inside shopify.ts underneath
 * it. A price change reaches this page within the hour, same as everywhere. */
export const revalidate = 3600;

/*
 * THE SCENT FINDER, on a route of its own since 2026-08-05.
 *
 * It ran as a section of the home page behind /#quiz until then. Three things
 * an anchor could not do: rank for "fragrance quiz" and its neighbours, be the
 * landing page for an ad, or be sent to someone. It also sat below the entire
 * home page, so the tool that answers "which of these six is mine?" was the
 * last thing a visitor reached rather than something they could be pointed
 * straight at.
 *
 * The home page keeps the heading, the copy and the id="quiz" anchor, and now
 * closes with a button through to here — so the funnel is unchanged and any
 * external /#quiz link still lands somewhere that makes sense.
 */
export default async function QuizPage() {
  const scents = await loadQuizScents();

  return (
    <main className="flex-1">
      <HomeHeader />
      <section className="px-6 pb-14 pt-24 sm:pt-28">
        <FadeIn className="text-center">
          {/* Renders nothing until a real review exists — see ReviewProofLine.
              Worth carrying onto this page because this is now where the
              hesitation actually is: someone taking a quiz has not decided
              anything yet. The home page kept its own copy. */}
          <ReviewProofLine className="mb-10" />
          {/* h1, not the h2 it was on the home page. It was a section heading
              under that page's own h1; here it is the page. */}
          <h1 className="type-heading mx-auto max-w-xl text-charcoal">
            Not sure which one is yours?
          </h1>
          <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-charcoal/70">
            Three questions. No wrong answers — just the one we&rsquo;d start
            you on.
          </p>
        </FadeIn>
        <FadeIn className="mt-14">
          {/* Photography treatment is a cutout/bleed decision made in site.ts
              and passed down, so this component never hardcodes a fit. */}
          <ScentQuiz
            scents={scents}
            sampleGift={SAMPLE_GIFT}
            frameClass={productImageFrame}
            imageClass={productImageFit}
          />
        </FadeIn>
        <HomeFooter />
      </section>
    </main>
  );
}
