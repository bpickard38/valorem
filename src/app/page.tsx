import type { Metadata } from "next";
import Image from "next/image";
import FadeIn from "@/components/FadeIn";
import EmailForm from "@/components/EmailForm";
import HomeHeader from "@/components/HomeHeader";
import HomeFooter from "@/components/HomeFooter";
import { ButtonLink, SectionHeader } from "@/components/ui";
import {
  PRICE,
  STICK_SIZE,
  WEAR_ESTIMATE,
  SHIP_WINDOW,
  RETURN_WINDOW,
} from "@/lib/site";

export const metadata: Metadata = {
  title: "VALOREM — Solid Cologne & Perfume in a Twist-Up Tin",
  description: `Solid fragrance you carry, not spray. Poseidon & Aphrodite — ${PRICE}. ${STICK_SIZE}, about ${WEAR_ESTIMATE} of daily wear. No glass, no spills.`,
};

const hooks = [
  {
    question: "Never heard of solid cologne?",
    answer:
      "Same fragrance you know — minus the spray. High-concentration scent set in a solid wax balm. Swipe it across wrists and neck; the warmth of your skin does the rest.",
  },
  {
    question: "Tired of your scent running out by 1 PM?",
    answer:
      "A spray bottle stays home on a shelf. A tin rides in your pocket — reapply anywhere in seconds. No mirror, no mist, no announcing it to the room.",
  },
  {
    question: "Want a fragrance that can actually travel?",
    answer:
      "No glass. No liquid. No spills. A pocket tin that walks straight through airport security — carry-on, gym bag, jacket pocket.",
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

export default function Home() {
  return (
    <main id="top" className="flex-1 scroll-mt-24">
      <HomeHeader />

      {/* HERO */}
      <section className="flex min-h-[88svh] flex-col justify-center px-6 py-16">
        <div className="mx-auto grid w-full max-w-5xl items-center gap-12 md:grid-cols-[1.1fr_1fr]">
          <div className="text-center md:text-left">
            <FadeIn duration={900}>
              <p className="label-engraved text-charcoal/55">
                Solid Fragrance · Collection № 1
              </p>
              <h1 className="type-display mt-6 text-charcoal">
                Solid fragrance.{" "}
                <em className="font-light italic text-gold-deep">Carried,</em>{" "}
                not sprayed.
              </h1>
              <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed tracking-wide text-charcoal/65 sm:text-base md:mx-0">
                High-concentration scent set in a wax balm, in a twist-up tin.
                Swipe it on at the pulse points and go — {STICK_SIZE}, about{" "}
                {WEAR_ESTIMATE} of daily wear.
              </p>
            </FadeIn>
            <FadeIn delay={200} duration={900}>
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center md:justify-start">
                <ButtonLink href="/deity#parthenon">
                  Shop the Collection — {PRICE}
                </ButtonLink>
                <ButtonLink href="#learn" variant="outline">
                  New to solid cologne?
                </ButtonLink>
              </div>
              <p className="mt-5 text-xs tracking-wide text-charcoal/55">
                Ships in {SHIP_WINDOW} · Returns within {RETURN_WINDOW}
              </p>
            </FadeIn>
          </div>
          <FadeIn delay={350} duration={900}>
            <div aria-hidden="true" className="mx-auto w-full max-w-sm">
              <Image
                src="/shopify/aphrodite-scene.png"
                alt=""
                width={1024}
                height={1024}
                priority
                className="h-auto w-full"
              />
            </div>
          </FadeIn>
        </div>
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
              {STICK_SIZE} · about {WEAR_ESTIMATE} of daily wear · {PRICE}
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
              We make fragrance worth keeping. Collection № 1
              carries two scents, each named for a Greek god, each under the
              sign of the pegasus.
            </p>
            <div className="mt-9 text-center md:text-left">
              <p className="label-engraved text-charcoal/55">
                The Immersive Side
              </p>
              <div className="mt-5">
                <ButtonLink href="/deity" variant="outline">
                  Enter the Pantheon
                </ButtonLink>
              </div>
              <p className="mt-3 text-xs text-charcoal/55">
                Meet Poseidon and Aphrodite where they live.
              </p>
            </div>
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
            Two scents. One format. {PRICE}.
          </h2>
          <div className="mt-8">
            <ButtonLink href="/deity#parthenon">Choose Your Scent</ButtonLink>
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
