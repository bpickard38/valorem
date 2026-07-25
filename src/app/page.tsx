import type { Metadata } from "next";
import Image from "next/image";
import FadeIn from "@/components/FadeIn";
import EmailForm from "@/components/EmailForm";
import HomeHeader from "@/components/HomeHeader";
import HomeFooter from "@/components/HomeFooter";
import ScrollLink from "@/components/ScrollLink";
import ReviewProofLine from "@/components/ReviewProofLine";
import { ButtonLink, SectionHeader } from "@/components/ui";
import { productPricing } from "@/lib/shopify";
import {
  SAMPLE_PRICE,
  SAMPLE_SIZE,
  STICK_SIZE,
  WEAR_ESTIMATE,
  SHIP_WINDOW,
  RETURN_WINDOW,
} from "@/lib/site";

/* Prices come from Shopify, so this can't be frozen at build time forever —
 * it re-fetches hourly, matching the product pages. */
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const stick = await productPricing("poseidon");
  return {
    title: "VALOREM — Solid Cologne & Perfume in a Twist-Up Stick",
    description: `Solid fragrance you carry, not spray. The Deity Collection — six scents, ${stick.formatted} each. ${STICK_SIZE}, about ${WEAR_ESTIMATE} of daily wear. No glass, no spills.`,
  };
}

const hooks = [
  {
    question: "Never heard of solid cologne?",
    answer:
      "Same fragrance you know — minus the spray. High-concentration scent set in a solid wax balm. Swipe it across wrists and neck; the warmth of your skin does the rest.",
  },
  {
    question: "Tired of your scent running out by 1 PM?",
    answer:
      "A spray bottle stays home on a shelf. A stick rides in your pocket — reapply anywhere in seconds. No mirror, no mist, no announcing it to the room.",
  },
  {
    question: "Want a fragrance that can actually travel?",
    answer:
      "No glass. No liquid. No spills. A pocket stick that walks straight through airport security — carry-on, gym bag, jacket pocket.",
  },
];

const steps = [
  {
    numeral: "01",
    lead: "Twist.",
    body: "Turn the base to raise the wax.",
  },
  {
    numeral: "02",
    lead: "Swipe.",
    body: "A pass over wrists, neck, collar — anywhere skin runs warm.",
  },
  {
    numeral: "03",
    lead: "Go.",
    body: "It lives in your pocket. Reapply whenever you like.",
  },
];

export default async function Home() {
  /* Every scent is priced together, so one lookup speaks for all six
   * everywhere this page names a stick price. */
  const stickPricing = await productPricing("poseidon");

  return (
    <main id="top" className="flex-1 scroll-mt-24">
      <HomeHeader />

      {/* HERO — full-bleed cinematic image, both sticks, white text overlaid */}
      <section className="relative flex min-h-[88svh] flex-col justify-center overflow-hidden px-6 py-16">
        <Image
          src="/shopify/hero-duo.png"
          alt="Valorem Poseidon and Aphrodite solid fragrance sticks"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* darkening scrim so the white text stays readable on any screen crop.
         * The image's calm zone is dead center, so the copy is centered too. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/30 to-black/55"
        />
        <div className="relative z-10 mx-auto w-full max-w-5xl">
          <div className="mx-auto max-w-xl text-center">
            <FadeIn duration={900}>
              {/* The complete Canva logo lockup — pegasus, VALOREM (Playfair
               * Display), SOLID FRAGRANCE (Montserrat) — as one image. */}
              <Image
                src="/brand/valorem-lockup-white.png"
                alt="Valorem — Solid Fragrance"
                width={450}
                height={563}
                priority
                className="mx-auto h-auto w-40 sm:w-48"
              />
              <h1 className="type-display mt-8 text-ivory">
                Solid fragrance.{" "}
                <em className="font-light italic text-gold">Carried,</em> not
                sprayed.
              </h1>
              <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed tracking-wide text-ivory/80 sm:text-base">
                High-concentration scent set in a wax balm, in a twist-up
                stick.
                Swipe it on at the pulse points and go — {STICK_SIZE}, about{" "}
                {WEAR_ESTIMATE} of daily wear.
              </p>
            </FadeIn>
            <FadeIn delay={200} duration={900}>
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <ButtonLink href="/collections">
                  Shop the Collection — {stickPricing.formatted}
                </ButtonLink>
                {/* outline variant's charcoal text is unreadable on the dark
                 * hero image — force ivory (the ! wins the specificity tie).
                 * ScrollLink keeps #discover out of the URL so reloads start
                 * at the top. */}
                <ScrollLink
                  href="#discover"
                  variant="outline"
                  className="text-ivory!"
                >
                  New to solid cologne?
                </ScrollLink>
              </div>
              <p className="mt-5 text-xs tracking-wide text-ivory/65">
                Ships in {SHIP_WINDOW} · Returns within {RETURN_WINDOW}
              </p>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* SAMPLE — where "New to solid cologne?" lands. Someone who pressed that
          button is telling you they are not ready to spend full price on a
          scent they have never smelled, so the first thing they meet is the
          cheap way in, not the education.

          This replaced the Discovery Set block on 2026-07-25. The objection is
          the same one — you cannot smell a website — but it is now answered by
          the 5 ml size on each product page rather than by a separate route,
          so this block is deliberately three lines and a button. Anything more
          rebuilds the discovery page in disguise, which is the thing being
          undone. Single centred column because the photograph this section
          used to carry was the set's. */}
      <section
        id="discover"
        className="scroll-mt-20 border-y border-charcoal/10 bg-stone/25 px-6 py-20 sm:py-24"
      >
        <FadeIn className="mx-auto max-w-xl text-center">
          <p className="label-engraved text-charcoal/50">Start Here</p>
          <h2 className="type-heading mt-5 text-charcoal">
            You can&apos;t smell a website.
          </h2>
          <p className="mt-6 text-sm leading-relaxed text-charcoal/70">
            So don&apos;t spend {stickPricing.formatted} on a guess. Every scent
            comes in a {SAMPLE_SIZE} sample for {SAMPLE_PRICE} —
            wear it for a couple of weeks, then buy the full stick if it&apos;s
            yours.
          </p>
          <div className="mt-8">
            <ButtonLink href="/collections">Find Your Scent</ButtonLink>
          </div>
        </FadeIn>
      </section>

      {/* EDUCATION */}
      <div id="learn" className="scroll-mt-20">
        {/* I — SOUND FAMILIAR? */}
        <section id="why-solid" className="px-6 py-24 sm:py-28">
          <FadeIn>
            <SectionHeader numeral="I" label="Sound Familiar?" />
          </FadeIn>
          <div className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-12 md:grid-cols-3 md:gap-10">
            {hooks.map((hook, i) => (
              <FadeIn key={hook.question} delay={i * 150}>
                <h3 className="font-serif text-2xl leading-snug text-charcoal">
                  {hook.question}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-charcoal/65">
                  {hook.answer}
                </p>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* II — HOW IT WORKS */}
        <section id="how-it-works" className="px-6 pb-24 sm:pb-28">
          <FadeIn>
            <SectionHeader numeral="II" label="How It Works" />
            <div className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-12 text-center sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-charcoal/10">
              {steps.map((step) => (
                <div key={step.lead} className="sm:px-8">
                  <p
                    aria-hidden="true"
                    className="font-serif text-sm tracking-[0.2em] text-gold"
                  >
                    {step.numeral}
                  </p>
                  <p className="mt-4 font-serif text-xl text-charcoal">
                    {step.lead}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-charcoal/65">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-14 text-center text-[0.65rem] uppercase tracking-[0.28em] text-charcoal/55">
              {STICK_SIZE} · about {WEAR_ESTIMATE} of daily wear · {stickPricing.formatted}
            </p>
          </FadeIn>
        </section>
      </div>

      {/* III — OUR STORY */}
      <section
        id="story"
        className="texture-travertine scroll-mt-20 px-6 py-24 sm:py-28"
      >
        <div className="mx-auto grid max-w-4xl items-center gap-14 md:grid-cols-2">
          <FadeIn>
            <SectionHeader numeral="III" label="Our Story" align="left" />
            <p className="mt-9 text-center font-serif text-2xl leading-snug text-charcoal sm:text-3xl md:text-left">
              Valorem — from the Latin for{" "}
              <span className="text-gold-deep">worth.</span>
            </p>
            <p className="mt-5 text-center text-sm leading-relaxed text-charcoal/70 md:text-left">
              We make fragrance worth keeping. Our first collection, the Deity
              Collection, runs to six scents in two houses — the Gods and the
              Goddesses.
            </p>
          </FadeIn>
          <FadeIn delay={150}>
            <Image
              src="/valorem-pegasus.png"
              alt="Valorem pegasus mark"
              width={572}
              height={589}
              className="mx-auto h-auto w-40 opacity-90 sm:w-52"
            />
          </FadeIn>
        </div>
      </section>

      {/* CLOSING CTA + EMAIL + FOOTER */}
      <section className="px-6 pb-14 pt-24 sm:pt-28">
        <FadeIn className="text-center">
          <h2 className="type-heading mx-auto max-w-xl text-charcoal">
            Six scents. One format. {stickPricing.formatted}.
          </h2>
          <div className="mt-8">
            <ButtonLink href="/collections">Choose Your Scent</ButtonLink>
          </div>
          {/* Renders nothing until real reviews exist — see ReviewProofLine. */}
          <div className="mt-6">
            <ReviewProofLine />
          </div>
        </FadeIn>
        <FadeIn className="mt-24 text-center">
          <h2 className="type-heading mx-auto max-w-xl text-charcoal">
            First in line for the next collection.
          </h2>
          <div className="mt-10">
            <EmailForm />
          </div>
        </FadeIn>
        <HomeFooter />
      </section>
    </main>
  );
}
