import type { Metadata } from "next";
import Image from "next/image";
import FadeIn from "@/components/FadeIn";
import Faq from "@/components/Faq";
import EmailForm from "@/components/EmailForm";
import Nav from "@/components/Nav";
import OrderButton from "@/components/OrderButton";
import { HeroRender, CardRender } from "@/components/ProductRender";
import { ButtonLink, SectionHeader } from "@/components/ui";
import { PRICE, RETURN_WINDOW, SHIP_WINDOW } from "@/lib/site";

export const metadata: Metadata = {
  title: "VALOREM — Fragrance, carved down to its essence",
  description: `Designer-grade solid fragrance in a twist-up stick. 20% fragrance load, no glass, no alcohol. Poseidon & Aphrodite — ${PRICE}.`,
};

const scents = [
  {
    name: "Poseidon",
    lead: "Fresh. Commanding.",
    body: "A crisp aquatic in the spirit of the great blue colognes — bergamot brightness over ambroxan depth. The scent of showing up sure of yourself.",
    notes: ["Bergamot", "Pepper", "Ambroxan", "Cedar"],
    wax: "linear-gradient(180deg, #dfe4de 0%, #c8d1c9 100%)",
    backdrop: "linear-gradient(160deg, #e6eae5 0%, #ccd6d0 100%)",
    id: "poseidon",
  },
  {
    name: "Aphrodite",
    lead: "Warm. Magnetic.",
    body: "A sophisticated vanilla that stays close to the skin — soft amber and cream without the sugar. The scent of being remembered.",
    notes: ["Vanilla", "Amber", "Jasmine", "Sandalwood"],
    wax: "linear-gradient(180deg, #eee2cf 0%, #e0cfb2 100%)",
    backdrop: "linear-gradient(160deg, #f1e8d7 0%, #e3d4ba 100%)",
    id: "aphrodite",
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
      <Nav />

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
              <p className="mt-9 font-serif text-2xl text-charcoal">
                {PRICE}
                <span className="mx-3 text-gold">·</span>
                <span className="text-lg text-charcoal/70">
                  Ships in {SHIP_WINDOW}
                </span>
              </p>
              <div className="mt-7">
                <ButtonLink href="#pantheon">Order Now</ButtonLink>
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
            href="#pantheon"
            className="flex flex-col items-center gap-3 text-charcoal/50 transition-colors hover:text-gold-deep"
          >
            <span className="label-engraved text-[0.58rem]">
              The Collection
            </span>
            <span aria-hidden="true" className="h-10 w-px bg-gold/70" />
          </a>
        </FadeIn>
      </section>

      {/* I — THE COLLECTION: full-bleed split */}
      <section id="pantheon" className="py-24 sm:py-28">
        <FadeIn className="px-6">
          <SectionHeader
            numeral="I"
            label="Collection № 1 — The Pantheon"
            title="Two to begin. Choose your side."
          />
        </FadeIn>
        <div className="mt-16 grid md:grid-cols-2 md:divide-x md:divide-gold/50">
          {scents.map((scent, i) => (
            <FadeIn
              key={scent.name}
              delay={i * 150}
              className="group px-6 pb-16 pt-4 last:pb-4 sm:px-10 md:pb-4 lg:px-16"
            >
              <div className="mx-auto w-full max-w-sm">
                <CardRender wax={scent.wax} backdrop={scent.backdrop} scentId={scent.id} />
              </div>
              <h3 className="mt-9 text-center font-serif text-3xl uppercase tracking-[0.22em] text-charcoal">
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
              <div className="mt-8 text-center">
                <OrderButton scent={scent.id}>Order — {PRICE}</OrderButton>
                <p className="mt-3 text-xs tracking-wide text-charcoal/50">
                  Ships in {SHIP_WINDOW}. Returns within {RETURN_WINDOW}.
                </p>
              </div>
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
            <p className="mt-3 text-center font-serif text-sm italic text-charcoal/50 md:text-left">
              (It is not lip balm. Please don&rsquo;t.)
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

      {/* IV — FAQ */}
      <section id="faq" className="px-6 py-24 sm:py-28">
        <FadeIn>
          <SectionHeader numeral="IV" label="Questions" />
        </FadeIn>
        <FadeIn delay={120} className="mx-auto mt-14 max-w-2xl">
          <Faq />
        </FadeIn>
      </section>

      {/* V — CLOSING CTA: engraved plaque */}
      <section className="px-6 py-24 sm:py-28">
        <FadeIn className="mx-auto max-w-2xl">
          <div className="border border-gold/35 p-2.5 sm:p-3">
            <div className="border border-gold/70 px-6 py-16 text-center sm:px-12 sm:py-20">
              <SectionHeader numeral="V" label="The First Batch" />
              <h2 className="type-heading mx-auto mt-9 max-w-xl text-charcoal">
                Poseidon and Aphrodite. {PRICE}. Ships in {SHIP_WINDOW}.
              </h2>
              <div className="mt-10">
                <ButtonLink href="#pantheon" variant="outline">
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
          <div className="flex items-center gap-6 text-charcoal/60">
            <a href="#" aria-label="Instagram" className="transition-colors hover:text-gold">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <a href="#" aria-label="TikTok" className="transition-colors hover:text-gold">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
              </svg>
            </a>
          </div>
          <p className="max-w-md text-center text-xs leading-relaxed text-charcoal/45">
            Orders ship in {SHIP_WINDOW}. Returns accepted within{" "}
            {RETURN_WINDOW} of delivery.
          </p>
          <p className="text-xs tracking-[0.2em] text-charcoal/45">
            © 2026 VALOREM
          </p>
        </footer>
      </section>
    </main>
  );
}
