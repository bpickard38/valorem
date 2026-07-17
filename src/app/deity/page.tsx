import type { Metadata } from "next";
import Image from "next/image";
import FadeIn from "@/components/FadeIn";
import EmailForm from "@/components/EmailForm";
import HomeHeader from "@/components/HomeHeader";
import SocialLinks from "@/components/SocialLinks";
import { CheckoutZone } from "@/components/OrderButton";
import { HeroRender, CardRender } from "@/components/ProductRender";
import { ButtonLink, SectionHeader } from "@/components/ui";
import { PRICE, RETURN_WINDOW, SCENTS } from "@/lib/site";

export const metadata: Metadata = {
  title: "VALOREM — Fragrance, carved down to its essence",
  description: `Designer-grade solid fragrance in a twist-up stick. 20% fragrance load, no glass, no alcohol. Poseidon & Aphrodite — ${PRICE}.`,
};

/* Copy comes from the canonical SCENTS catalog (lib/site.ts) so these cards
 * and the /product pages always read identically; only the render styling
 * lives here. */
const scents = [
  {
    ...SCENTS.poseidon,
    body: SCENTS.poseidon.description,
    wax: "linear-gradient(180deg, #dfe4de 0%, #c8d1c9 100%)",
    backdrop: "linear-gradient(160deg, #e6eae5 0%, #ccd6d0 100%)",
  },
  {
    ...SCENTS.aphrodite,
    body: SCENTS.aphrodite.description,
    wax: "linear-gradient(180deg, #eee2cf 0%, #e0cfb2 100%)",
    backdrop: "linear-gradient(160deg, #f1e8d7 0%, #e3d4ba 100%)",
  },
];

const benefits = [
  {
    numeral: "I",
    lead: "Travels anywhere.",
    body: "No glass, no liquids rules, no leaks. Pocket, gym bag, carry-on.",
  },
  {
    numeral: "II",
    lead: "20% fragrance load.",
    body: "Most solids run 5–10%. Ours doesn't whisper.",
  },
  {
    numeral: "III",
    lead: "Impossible to overspray.",
    body: "Wax wears close — you control exactly how much.",
  },
];

export default function Home() {
  return (
    <main className="flex-1">
      <HomeHeader />

      {/* HERO */}
      <section
        id="hero"
        className="relative flex min-h-svh flex-col justify-center px-6 pb-24 pt-16 sm:pb-28"
      >
        <div className="mx-auto grid w-full max-w-5xl items-center gap-14 md:grid-cols-[1.1fr_1fr] md:gap-10">
          <div className="text-center md:text-left">
            <FadeIn duration={900}>
              <Image
                src="/valorem-pegasus.png"
                alt="Valorem pegasus mark"
                width={572}
                height={589}
                priority
                className="mx-auto h-auto w-16 opacity-90 sm:w-20 md:mx-0"
              />
              <p className="label-engraved mt-5 font-serif text-charcoal">
                Valorem
              </p>
            </FadeIn>
            <FadeIn delay={150} duration={900}>
              <h1 className="type-display mt-10 text-charcoal">
                Fragrance, carved down to its{" "}
                <em className="font-light italic text-gold-deep">essence.</em>
              </h1>
              <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed tracking-wide text-charcoal/65 sm:text-base md:mx-0">
                Designer-grade scent in a twist-up stick — no glass, no
                alcohol, no overspray. Swipe on anywhere.
              </p>
            </FadeIn>
            <FadeIn delay={300} duration={900}>
              <p className="mt-9 font-serif text-2xl text-charcoal">{PRICE}</p>
              <div className="mt-7">
                <ButtonLink href="#parthenon">Order Now</ButtonLink>
              </div>
              <p className="mt-4 text-xs tracking-wide text-charcoal/55">
                Returns accepted within {RETURN_WINDOW}.
              </p>
            </FadeIn>
          </div>
          <FadeIn delay={450} duration={900}>
            <HeroRender />
          </FadeIn>
        </div>
        {/* scroll cue */}
        <FadeIn
          delay={700}
          duration={900}
          className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 sm:block"
        >
          <a
            href="#parthenon"
            aria-label="Scroll to the collection"
            className="flex flex-col items-center gap-3 text-charcoal/50 transition-colors hover:text-gold-deep"
          >
            <span aria-hidden="true" className="h-10 w-px bg-gold/70" />
          </a>
        </FadeIn>
      </section>

      {/* I — THE COLLECTION: full-bleed split */}
      <section id="parthenon" className="scroll-mt-16 py-24 sm:py-28">
        <FadeIn className="px-6">
          <SectionHeader
            numeral="I"
            title="Collection I — The Parthenon"
          />
        </FadeIn>
        <div className="mt-10 grid md:grid-cols-2 md:divide-x md:divide-gold/50">
          {scents.map((scent, i) => (
            <FadeIn
              key={scent.name}
              delay={i * 150}
              className="group pb-16 last:pb-4 md:pb-4"
            >
              <CheckoutZone
                scent={scent.id}
                buttonLabel={<>Order — {PRICE}</>}
                note={<>Returns within {RETURN_WINDOW}.</>}
                className="h-full px-6 pt-4 sm:px-10 lg:px-16"
              >
                <div className="mx-auto w-full max-w-[300px]">
                  <CardRender wax={scent.wax} backdrop={scent.backdrop} scentId={scent.id} />
                </div>
                <h3 className="mt-6 text-center font-serif text-3xl uppercase tracking-[0.22em] text-charcoal">
                  {scent.name}
                </h3>
                <p className="mt-3 text-center font-serif text-lg italic text-gold-deep">
                  {scent.lead}
                </p>
                <p className="mx-auto mt-4 max-w-sm text-center text-sm leading-relaxed text-charcoal/70">
                  {scent.body}
                </p>
                <p className="mt-5 text-center text-[0.65rem] uppercase tracking-[0.28em] text-charcoal/55">
                  {scent.notes.join("  ·  ")}
                </p>
              </CheckoutZone>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* II — WHY SOLID */}
      <section id="format" className="px-6 py-24 sm:py-28">
        <FadeIn>
          <SectionHeader numeral="II" label="The Format" />
          <div className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-12 text-center sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-charcoal/10">
            {benefits.map((b) => (
              <div key={b.lead} className="sm:px-8">
                <p
                  aria-hidden="true"
                  className="font-serif text-sm tracking-[0.2em] text-gold"
                >
                  {b.numeral}
                </p>
                <p className="mt-4 font-serif text-xl text-charcoal">
                  {b.lead}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-charcoal/65">
                  {b.body}
                </p>
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* III — THE FORMAT, OWNED */}
      <section className="texture-travertine px-6 py-24 sm:py-28">
        <div className="mx-auto grid max-w-4xl items-center gap-14 md:grid-cols-2">
          <FadeIn>
            <SectionHeader numeral="III" label="The Format, Owned" align="left" />
            <blockquote className="mt-9 text-center font-serif text-2xl leading-snug text-charcoal sm:text-3xl md:text-left">
              Yes, it looks like something else you carry every day.
              <span className="text-gold-deep"> That&rsquo;s the point.</span>
            </blockquote>
            <p className="mt-5 text-center text-sm leading-relaxed text-charcoal/70 md:text-left">
              Great fragrance shouldn&rsquo;t live on a shelf — it should live
              in your pocket.
            </p>
          </FadeIn>
          <FadeIn delay={150} className="group">
            <div className="mx-auto w-full max-w-xs">
              <CardRender
                wax="linear-gradient(180deg, #ece5d4 0%, #ddd3ba 100%)"
                backdrop="linear-gradient(160deg, #ece7db 0%, #d8d0bd 100%)"
                scentId="valorem"
              />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* IV — CLOSING CTA: engraved plaque */}
      <section className="px-6 py-24 sm:py-28">
        <FadeIn className="mx-auto max-w-2xl">
          <div className="border border-gold/35 p-2.5 sm:p-3">
            <div className="border border-gold/70 px-6 py-16 text-center sm:px-12 sm:py-20">
              <SectionHeader numeral="IV" label="The First Batch" />
              <h2 className="type-heading mx-auto mt-9 max-w-xl text-charcoal">
                Poseidon and Aphrodite. {PRICE}.
              </h2>
              <div className="mt-10">
                <ButtonLink href="#parthenon" variant="outline">
                  Choose Your Scent
                </ButtonLink>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* VI — EMAIL CAPTURE + FOOTER */}
      <section id="founding" className="px-6 pb-14 pt-12 sm:pt-16">
        <FadeIn className="text-center">
          <h2 className="type-heading mx-auto max-w-xl text-charcoal">
            First to know when the next collection drops.
          </h2>
          <div className="mt-12">
            <EmailForm />
          </div>
        </FadeIn>
        <footer className="mx-auto mt-28 flex max-w-4xl flex-col items-center gap-7 border-t border-charcoal/10 pt-14">
          <Image
            src="/valorem-pegasus.png"
            alt="Valorem"
            width={572}
            height={589}
            className="h-auto w-14 opacity-80"
          />
          <p className="label-engraved font-serif text-charcoal/80">Valorem</p>
          <SocialLinks />
          <p className="max-w-md text-center text-xs leading-relaxed text-charcoal/45">
            Returns accepted within {RETURN_WINDOW} of delivery.
          </p>
          <p className="text-xs tracking-[0.2em] text-charcoal/45">
            © 2026 VALOREM
          </p>
        </footer>
      </section>
    </main>
  );
}
