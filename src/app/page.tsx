import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import FadeIn from "@/components/FadeIn";
import HomeHeader from "@/components/HomeHeader";
import Guarantee from "@/components/Guarantee";
import ScentQuiz from "@/components/ScentQuiz";
import type { QuizScent } from "@/components/ScentQuiz";
import HomeFooter from "@/components/HomeFooter";
import ScrollLink from "@/components/ScrollLink";
import ReviewProofLine from "@/components/ReviewProofLine";
import { ButtonLink, SectionHeader } from "@/components/ui";
import {
  lowestPricing,
  productImage,
  productPricing,
  productVariants,
} from "@/lib/shopify";
import type { ScentId } from "@/lib/shopify";
import { homeSeo, toMetadata } from "@/lib/seo";
import { IMAGES } from "@/lib/images";
import {
  COLLECTIONS,
  COLLECTION_TITLE,
  CURRENCY,
  FRAGRANCE_LOAD,
  FREE_SHIPPING_THRESHOLD,
  RETURN_WINDOW,
  SAMPLE_SIZE,
  SCENTS,
  STICK_SIZE,
  WEAR_ESTIMATE,
  SHIP_WINDOW,
  formatMoney,
  noteTeaser,
  productImageFit,
  productImageFrame,
  productTitle,
} from "@/lib/site";

/* Prices come from Shopify, so this can't be frozen at build time forever —
 * it re-fetches hourly, matching the product pages. */
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const from = lowestPricing(await productVariants("poseidon"));
  return toMetadata(homeSeo(from.formatted));
}

/* These three used to be convenience arguments — travels well, no spills,
 * clears airport security. Convenience is a reason to own a second bottle, not
 * a reason to spend $70 on a first one, so each card now argues the format
 * itself: where the scent goes, who controls the dose, and when you can top up.
 *
 * Every performance claim here is mechanical — what a wax base does that an
 * alcohol solvent doesn't. Nothing promises it outlasts anything, because
 * nothing has been tested against anything. */
const hooks = [
  {
    question: "Sprays announce you. This doesn't.",
    answer:
      "A spray atomizes and fills the space around you. A wax base holds the oil against warm skin, so the scent travels inches instead of feet. It gets discovered rather than declared.",
  },
  {
    question: "You decide how much of you they get.",
    answer:
      "A spray is one irreversible decision at seven in the morning. A stick is dosed by the swipe. One pass for the office. Two before dinner.",
  },
  {
    question: "Reapply without the moment.",
    answer:
      "Nobody sprays cologne at their desk or in a locker room, because everyone knows. A swipe takes three seconds and nobody looks up.",
  },
];

/* The two free samples packed with a full size. This is the strongest thing in
 * the offer and it appeared nowhere on the site — it lives in SIZES[].gift,
 * which only the product page's size selector was reading.
 *
 * Note what it is NOT: nothing in Shopify adds these to the cart, so this says
 * "ships with", never "add to bag". See the SIZES comment in site.ts. */
const SAMPLE_GIFT = `Every full size ships with two ${SAMPLE_SIZE} samples in scents you didn't pick. Find your second one on us.`;

/* The two scents the shortlist under the hero shows — one from each house, so
 * the block spans the range rather than pushing a single taste.
 *
 * This is an EDITORIAL pick, not a sales ranking. Nothing in this codebase
 * knows what has actually sold, so anything ordered by popularity here would
 * be invented. Reorder freely; just keep it two, and keep one from each house
 * or the section stops arguing that the brand is unisex. */
const FEATURED: ScentId[] = ["poseidon", "aphrodite"];

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
   * everywhere this page names a price. `stickPricing` is the full size the
   * hero and closing CTA quote; `samplePricing` is the entry price the
   * "you can't smell a website" block answers with. */
  const [stickPricing, variants] = await Promise.all([
    productPricing("poseidon"),
    productVariants("poseidon"),
  ]);
  const samplePricing = lowestPricing(variants);

  /* The six scents, for the grid below. Read out of COLLECTIONS rather than
   * listed here, so the two houses and their order stay defined in exactly one
   * place — move a scent between houses in site.ts and this follows.
   *
   * Twelve Shopify calls sounds like a lot for a home page; it isn't. Every
   * variant and image lookup is memoised behind the 5-minute cache in
   * shopify.ts and the page itself is ISR at an hour, so a visitor pays for
   * none of it. Nested Promise.all so all twelve overlap rather than walking
   * the houses in series. */
  const houses = await Promise.all(
    [COLLECTIONS.gods, COLLECTIONS.goddesses].map(async (house) => ({
      ...house,
      cards: await Promise.all(
        house.scents.map(async (id) => {
          const [image, scentVariants] = await Promise.all([
            productImage(id),
            productVariants(id),
          ]);
          return {
            ...SCENTS[id],
            image,
            pricing: lowestPricing(scentVariants),
          };
        }),
      ),
    })),
  );

  /* The shortlist reuses the cards already fetched for the grid rather than
   * asking Shopify for Poseidon and Aphrodite a second time. flatMap over a
   * possibly-missing lookup so a scent dropped from COLLECTIONS quietly
   * disappears from the shortlist instead of rendering a hole. */
  const cardsById = new Map(
    houses.flatMap((house) => house.cards).map((card) => [card.id, card]),
  );
  const featured = FEATURED.flatMap((id) => {
    const card = cardsById.get(id);
    return card ? [card] : [];
  });

  /* Flattened for the quiz, which needs all six regardless of house but wants
   * the house NAME on the result card. Built from the same fetched cards as
   * the grid — the quiz is a client component and cannot reach Shopify, so
   * everything it renders has to cross the boundary as plain data here. */
  const quizScents: QuizScent[] = houses.flatMap((house) =>
    house.cards.map((card) => ({
      id: card.id,
      title: productTitle(card),
      house: house.name,
      lead: card.lead,
      description: card.description,
      teaser: noteTeaser(card).join(", "),
      price: card.pricing.formatted,
      image: card.image
        ? { url: card.image.url, altText: card.image.altText ?? null }
        : null,
    })),
  );

  return (
    <main id="top" className="flex-1 scroll-mt-24">
      <HomeHeader />

      {/* HERO — product-forward, light, split.
       *
       * Replaced the full-bleed cinematic shot on 2026-07-28. That hero was a
       * dark lifestyle photograph with a scrim and white type over it: it read
       * as a perfume advert, and a stranger arriving from a cold ad never
       * actually saw the thing being sold. This one puts the stick on the
       * page's own ivory, at size, next to the claim.
       *
       * Everything that was ivory-on-dark is now charcoal-on-ivory — the
       * scrim, the `text-ivory!` override on the outline button and the
       * hand-rolled dark guarantee box are all gone, and <Guarantee /> does
       * that job again in its normal skin. The white logo lockup came off too:
       * it was there because the photo was dark, and the header two inches
       * above already says VALOREM.
       *
       * Copy left, product right on desktop; product first on mobile, where a
       * wall of text above the fold is what makes people leave. */}
      <section className="texture-travertine overflow-hidden px-5 py-14 md:px-6 md:py-20">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 md:grid-cols-2 md:gap-14">
          {/* order-first on mobile, second on desktop — Tailwind's order
              utilities, so the DOM keeps copy first for screen readers. */}
          <FadeIn
            duration={900}
            className="order-first md:order-last"
          >
            <div className="relative mx-auto aspect-square w-full max-w-md">
              <Image
                src={IMAGES.hero}
                alt="Valorem solid fragrance stick, twisted up"
                fill
                priority
                sizes="(min-width: 768px) 480px, 90vw"
                className="product-cutout object-contain"
              />
            </div>
          </FadeIn>

          <div className="text-center md:text-left">
            <FadeIn duration={900}>
              <p className="label-engraved text-gold-deep">
                {COLLECTION_TITLE}
              </p>
              {/* Leads with what the scent DOES, not with the format. Cold ad
                * traffic has no idea what a solid fragrance is and does not
                * care yet; "stays on your skin, not in the room" is a benefit
                * they can feel before they know what they're buying. The
                * format explanation moved down into the subhead. */}
              <h1 className="type-display mt-5 text-charcoal">
                Fragrance that stays on your{" "}
                <em className="font-light italic text-gold-deep">skin,</em> not
                in the room.
              </h1>
              <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed tracking-wide text-charcoal/70 sm:text-base md:mx-0">
                High-concentration scent set in a wax balm, in a twist-up
                stick. It sits at the pulse point instead of filling a room —
                noticed by people close enough to matter. {STICK_SIZE}, about{" "}
                {WEAR_ESTIMATE} of daily wear.
              </p>
            </FadeIn>
            <FadeIn delay={200} duration={900}>
              {/* The cheap way in is the SOLID button and it comes first. The
                * old hero made $70 the primary action, which asks a stranger
                * who has never smelled this to make the largest decision on
                * the page first. Sample leads; the full size is the outline
                * beside it. Order is source order — the flex row does not
                * reverse — so this is also the tap order on a phone. */}
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center md:justify-start">
                <ScrollLink href="#scents">
                  Start with a {samplePricing.formatted} Sample
                </ScrollLink>
                <ButtonLink href="/collections" variant="outline">
                  Shop Full Size — {stickPricing.formatted}
                </ButtonLink>
              </div>

              {/* GUARANTEE — at the price decision, not in the footer. Back to
                * the shared component now the hero is light: one skin, one
                * constant, four placements that cannot drift. */}
              <Guarantee className="mt-8" />

              <p className="mx-auto mt-5 max-w-md text-xs leading-relaxed tracking-wide text-charcoal/60 md:mx-0">
                {SAMPLE_GIFT}
              </p>
              {/* Returns came off this line when the guarantee block above
                * took the job — it said "Returns within thirty days" two
                * inches under a box already promising thirty days. Shipping
                * facts stay. */}
              <p className="mt-3 text-xs tracking-wide text-charcoal/55">
                Ships in {SHIP_WINDOW} · Free shipping over{" "}
                {formatMoney(FREE_SHIPPING_THRESHOLD, CURRENCY)}
              </p>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* PROOF STRIP — the row of badges Carpe runs directly under its hero.
       *
       * The pattern is worth taking; the CONTENT is not. Carpe's row leans on
       * "Dermatologist Tested" and a medical advisor, and its hero carries
       * "Over 40,000 Reviews" — Valorem has no clinician, no reviews and
       * almost no orders, so every one of those would be fabricated.
       *
       * These four are all independently checkable facts the brand already
       * makes elsewhere on the site: the fragrance load, the size and wear
       * estimate, the return window, and the shipping threshold. Nothing here
       * implies a customer count. */}
      <section className="border-y border-charcoal/10 bg-stone/25 px-5 py-8 md:px-6">
        <FadeIn>
          <ul className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-x-6 gap-y-6 text-center md:grid-cols-4">
            {[
              { lead: FRAGRANCE_LOAD, body: "fragrance load" },
              { lead: STICK_SIZE, body: `about ${WEAR_ESTIMATE} of wear` },
              {
                /* Capitalised for this row only. RETURN_WINDOW is written
                 * lowercase because every other use of it is mid-sentence
                 * ("Returns within thirty days"); here it is a standalone
                 * figure sitting beside "20%" and "$40+", and lowercase reads
                 * as a typo in that company. */
                lead: `${RETURN_WINDOW[0].toUpperCase()}${RETURN_WINDOW.slice(1)}`,
                body: "returns, even used",
              },
              {
                lead: `${formatMoney(FREE_SHIPPING_THRESHOLD, CURRENCY)}+`,
                body: "ships free",
              },
            ].map((item) => (
              <li key={item.body}>
                <p className="font-serif text-xl text-gold-deep sm:text-2xl">
                  {item.lead}
                </p>
                <p className="mt-1 text-[0.65rem] uppercase tracking-[0.2em] text-charcoal/55">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </FadeIn>
      </section>

      {/* PICKED FOR YOU — the first thing under the hero image.
          This replaced "You can't smell a website", which spent the most
          valuable block on the page arguing that a stranger should not buy
          yet. The objection was real but the answer was abstract: it named no
          scent and showed no product, so someone who agreed with it still had
          nothing to look at. Two photographed scents and a price do the same
          job — they answer "which one" instead of "why not yet" — and the
          sample framing survives in the price line and the CTA.

          NOT called "Our Bestsellers". That is a claim about order volume this
          brand cannot support, and inventing social proof is the one thing the
          site is not allowed to do (see ReviewProofLine, which renders nothing
          rather than fake a rating). A recommendation from the house needs no
          sales figures behind it. */}
      <section
        id="discover"
        className="scroll-mt-20 border-y border-charcoal/10 bg-stone/25 px-5 py-20 sm:py-24 md:px-6"
      >
        <FadeIn className="mx-auto max-w-xl text-center">
          <p className="label-engraved text-charcoal/50">Start Here</p>
          <h2 className="type-heading mt-5 text-charcoal">
            Start with these two.
          </h2>
        </FadeIn>

        {/* Same card as the full grid below and as /collections/[collection]:
            4:5 frame, note teaser, entry price, whole card is the link. Two up
            and narrower than the six-card grid, so these read as a shortlist
            rather than a truncated version of the collection. */}
        <div className="mx-auto mt-14 grid w-full max-w-2xl gap-6 sm:grid-cols-2 md:gap-8">
          {featured.map((scent, i) => (
            <FadeIn key={scent.id} delay={i * 120}>
              <Link href={`/product/${scent.id}`} className="group block">
                <div
                  className={`relative aspect-[4/5] w-full ${productImageFrame}`}
                >
                  {scent.image ? (
                    <Image
                      src={scent.image.url}
                      alt={scent.image.altText ?? scent.name}
                      fill
                      sizes="(min-width: 640px) 320px, 100vw"
                      priority
                      className={`${productImageFit} transition-transform duration-700 ease-out group-hover:scale-[1.03]`}
                    />
                  ) : (
                    <div className="texture-travertine absolute inset-0 flex items-center justify-center">
                      <Image
                        src={IMAGES.pegasus}
                        alt=""
                        width={572}
                        height={589}
                        className="h-auto w-16 opacity-40"
                      />
                    </div>
                  )}
                </div>
                <div className="px-2 pt-3 text-center">
                  <p className="font-serif text-sm italic leading-snug text-charcoal/65">
                    {noteTeaser(scent).join(", ")}
                  </p>
                  <h3 className="mt-2 font-serif text-2xl font-semibold uppercase tracking-[0.14em] text-gold-deep transition-colors group-hover:text-gold">
                    {productTitle(scent)}
                  </h3>
                  <p className="mt-2 font-serif text-lg text-charcoal/70">
                    From {scent.pricing.formatted}
                  </p>
                </div>
              </Link>
            </FadeIn>
          ))}
        </div>

        {/* The price came off this button. The two cards above already quote
            "From $16" each, so the CTA was the third time the same figure
            appeared inside one section — and a button that repeats a price is
            answering a question the cards already answered. It now does the
            one thing the shortlist can't: open the door to the other four. */}
        <FadeIn className="mt-12 text-center">
          <ScrollLink href="#scents">Discover Other Scents</ScrollLink>
        </FadeIn>
      </section>

      {/* EDUCATION */}
      <div id="learn" className="scroll-mt-20">
        {/* I — WHY SOLID. Relabelled from "Sound Familiar?", which framed the
            three cards as questions a reader recognises. They are statements
            about the format now, and a question mark over them read as a
            non-sequitur. */}
        <section id="why-solid" className="px-6 py-24 sm:py-28">
          <FadeIn>
            <SectionHeader numeral="I" label="Why Solid" />
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

      {/* III — THE SIX SCENTS
       *
       * These were one click away on /collections, which is the most
       * interesting thing on the site sitting behind a click cold traffic will
       * not make. The card is the same one /collections/[collection] uses —
       * 4:5 frame, note teaser, entry price, whole card is the link — because
       * a shopper who scrolls to it here and one who navigates there should be
       * looking at the same object. The markup is inline rather than imported
       * because it is inline on the collection page too; there is no shared
       * card component to reuse.
       *
       * Everything rendered here is derived: the houses and their order from
       * COLLECTIONS, the three-note teaser from noteTeaser(), the title from
       * productTitle(). Nothing about a scent is typed into this page. */}
      <section id="scents" className="scroll-mt-20 px-5 py-24 sm:py-28 md:px-6">
        {/* The collection name carries the section on its own. It previously
            ran a "Six scents. Two houses." title over a paragraph explaining
            that the houses are not a rule about who may wear what — three
            lines of throat-clearing before the first photograph, restating a
            count the grid below makes obvious. The unisex point is still made
            where it does work: Collection.audience describes the scent rather
            than the wearer, so the two house eyebrows read "Fresh · Sharp ·
            Smoky", not "Worn by men". */}
        <FadeIn>
          <SectionHeader numeral="III" title={COLLECTION_TITLE} />
        </FadeIn>

        {houses.map((house) => (
          <div key={house.id} className="mx-auto mt-16 w-full max-w-5xl">
            <FadeIn>
              <h3 className="text-center font-serif text-2xl text-charcoal">
                {house.name}
              </h3>
              <p className="label-engraved mt-2 text-center text-gold-deep">
                {house.audience}
              </p>
            </FadeIn>
            <div className="mt-10 grid gap-6 md:grid-cols-3 md:gap-7">
              {house.cards.map((scent, i) => (
                <FadeIn key={scent.id} delay={i * 110}>
                  <Link href={`/product/${scent.id}`} className="group block">
                    <div
                      className={`relative aspect-[4/5] w-full ${productImageFrame}`}
                    >
                      {scent.image ? (
                        <Image
                          src={scent.image.url}
                          alt={scent.image.altText ?? scent.name}
                          fill
                          sizes="(min-width: 768px) 330px, 100vw"
                          className={`${productImageFit} transition-transform duration-700 ease-out group-hover:scale-[1.03]`}
                        />
                      ) : (
                        <div className="texture-travertine absolute inset-0 flex items-center justify-center">
                          <Image
                            src={IMAGES.pegasus}
                            alt=""
                            width={572}
                            height={589}
                            className="h-auto w-16 opacity-40"
                          />
                        </div>
                      )}
                    </div>
                    <div className="px-2 pt-3 text-center">
                      <p className="font-serif text-sm italic leading-snug text-charcoal/65">
                        {noteTeaser(scent).join(", ")}
                      </p>
                      {/* h4, not the h2 the collection page uses — this sits
                        * under the section's own h2 and the house h3, and the
                        * heading order has to stay walkable. */}
                      <h4 className="mt-2 font-serif text-2xl font-semibold uppercase tracking-[0.14em] text-gold-deep transition-colors group-hover:text-gold">
                        {productTitle(scent)}
                      </h4>
                      <p className="mt-2 font-serif text-lg text-charcoal/70">
                        From {scent.pricing.formatted}
                      </p>
                    </div>
                  </Link>
                </FadeIn>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* IV — OUR STORY */}
      <section
        id="story"
        className="texture-travertine scroll-mt-20 px-6 py-24 sm:py-28"
      >
        <div className="mx-auto grid max-w-4xl items-center gap-14 md:grid-cols-2">
          <FadeIn>
            <SectionHeader numeral="IV" label="Our Story" align="left" />
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
              src={IMAGES.pegasus}
              alt="Valorem pegasus mark"
              width={572}
              height={589}
              className="mx-auto h-auto w-40 opacity-90 sm:w-52"
            />
          </FadeIn>
        </div>
      </section>

      {/* CLOSING CTA + EMAIL + FOOTER
       *
       * The "Will it melt in a hot car?" objection block used to open this
       * section. It now lives only in the FAQ, where someone who has the
       * question goes looking — putting it here made the last thing before
       * the final ask a paragraph about heat damage, which raises the doubt
       * for every reader who did not already have it. */}
      <section id="quiz" className="scroll-mt-20 px-6 pb-14 pt-24 sm:pt-28">
        {/* The whole closing block that used to sit here is gone — the
            "Six scents. One format. $70." heading, the price breakdown, the
            free-samples line and the Choose Your Scent button. It was the
            page's fourth ask, arriving after the six-card grid had already
            made the same one, and it re-anchored on $70 at the last moment.
            The grid and the shortlist carry the buying decision now.

            SAMPLE_GIFT still runs in the hero, so the two free samples are
            stated where the price decision actually happens. */}

        {/* THE SCENT FINDER — what "Not sure which one is yours?" now does.
          *
          * The heading is unchanged; the answer under it is. It used to be an
          * email capture: type an address, wait for an inbox to solve a
          * problem you have right now. Three questions solve it here and hand
          * over a product page, and the email form survives inside the result
          * as the second, optional ask — so the Lead event still fires without
          * standing between anyone and the buy.
          *
          * The payoff is the two free 5 ml samples that already ship with
          * every full size. No third sample was invented for this: that would
          * be another hand-packed item with no cart line behind it.
          *
          * mt-24 came off with the block above it — this is the section's
          * first content now, and the section's own pt-24 is the spacing. */}
        <FadeIn className="text-center">
          {/* Renders nothing until real reviews exist — see ReviewProofLine.
            * Kept, and kept on this page, because it is the only place the
            * homepage is wired to show a rating the day the first one lands.
            * Inlined rather than given its own FadeIn so that returning null
            * costs no wrapper and no vertical space. */}
          <ReviewProofLine className="mb-10" />
          <h2 className="type-heading mx-auto max-w-xl text-charcoal">
            Not sure which one is yours?
          </h2>
          <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-charcoal/70">
            Three questions. No wrong answers — every scent is built to wear on
            anyone.
          </p>
        </FadeIn>
        <FadeIn className="mt-14">
          <ScentQuiz
            scents={quizScents}
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
