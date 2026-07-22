import type { Metadata } from "next";
import Link from "next/link";
import HomeHeader from "@/components/HomeHeader";
import HomeFooter from "@/components/HomeFooter";
import FadeIn from "@/components/FadeIn";
import Guarantee from "@/components/Guarantee";
import AddToCartButton from "@/components/AddToCartButton";
import TrackViewContent from "@/components/TrackViewContent";
import { SectionHeader } from "@/components/ui";
import {
  DISCOVERY_CREDIT,
  DISCOVERY_CREDIT_WINDOW,
  DISCOVERY_NET_COST,
  DISCOVERY_PRICE,
  DISCOVERY_PRICE_AMOUNT,
  DISCOVERY_SETS,
  PRICE,
  RETURN_WINDOW,
  SHIP_WINDOW,
} from "@/lib/site";

/* The landing page for cold paid traffic.
 *
 * Everything here is arranged around one number: what trying the house
 * actually costs once the credit is spent. That figure leads the hero, names
 * the price on both cards, and closes the page — it is the whole reason this
 * route exists rather than sending ads at a $70 product page.
 */

export const metadata: Metadata = {
  title: "Discovery Sets — Try Three Scents for " + DISCOVERY_PRICE,
  description: `Three solid fragrances to try, ${DISCOVERY_PRICE} with free shipping, plus ${DISCOVERY_CREDIT} credit toward any full-size stick. You can't smell a website — don't spend ${PRICE} on a guess.`,
};

const steps = [
  {
    numeral: "01",
    lead: "Try all three.",
    body: `Live with each one for a few days — how it wears, how it settles, how people react.`,
  },
  {
    numeral: "02",
    lead: "We email your credit.",
    body: `A ${DISCOVERY_CREDIT} code lands in your inbox after your set ships. It's good for ${DISCOVERY_CREDIT_WINDOW}.`,
  },
  {
    numeral: "03",
    lead: "Keep the one you love.",
    body: `Spend it on any full-size stick. Which makes trying all three cost you ${DISCOVERY_NET_COST}.`,
  },
];

export default function DiscoveryPage() {
  const sets = Object.values(DISCOVERY_SETS);

  return (
    <main className="flex-1">
      <HomeHeader />
      <TrackViewContent
        contentId="discovery"
        contentName="Discovery Set"
        value={DISCOVERY_PRICE_AMOUNT}
      />

      {/* HERO — the offer, stated as arithmetic. No image: this page is reached
          from an ad that already did the visual work, and a second hero shot
          just delays the price. */}
      <section className="border-b border-charcoal/10 px-5 py-16 md:px-6 md:py-24">
        <div className="mx-auto w-full max-w-3xl text-center">
          <FadeIn>
            <p className="label-engraved text-charcoal/50">The Discovery Set</p>
            <h1 className="type-display mt-6 text-charcoal">
              Trying all three costs you {DISCOVERY_NET_COST}.
            </h1>
            <p className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-charcoal/70">
              {DISCOVERY_PRICE} with free shipping. Try all three scents in your
              collection, then take {DISCOVERY_CREDIT} off the full-size stick
              you keep.
            </p>
            <p className="mt-6 font-serif text-xl italic leading-snug text-gold-deep sm:text-2xl">
              You can&apos;t smell a website. Don&apos;t spend {PRICE} on a
              guess.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* THE TWO SETS */}
      <section className="px-5 py-16 md:px-6 md:py-20">
        <div className="mx-auto w-full max-w-5xl">
          <SectionHeader numeral="I" label="Choose your set" />

          <div className="mt-12 grid gap-6 md:grid-cols-2 md:gap-8">
            {sets.map((set, i) => (
              <FadeIn key={set.id} delay={i * 100}>
                {/* h-full + flex so both cards match height and both buttons
                    sit on the same line however long the names run. */}
                <article className="flex h-full flex-col border border-charcoal/12 bg-stone/25 p-7 md:p-9">
                  <p className="label-engraved text-gold-deep">
                    {set.audience}
                  </p>
                  <h2 className="type-heading mt-4 text-charcoal">
                    {set.name}
                  </h2>
                  <p className="mt-2 font-serif text-lg italic text-charcoal/70">
                    {set.lead}
                  </p>

                  <ul className="mt-7 flex flex-col gap-3 border-y border-charcoal/10 py-6">
                    {set.members.map((member) => (
                      <li
                        key={member.name}
                        className="flex items-baseline gap-3"
                      >
                        <span
                          aria-hidden="true"
                          className="h-px w-4 shrink-0 bg-gold/70"
                        />
                        {/* Only the scents with a catalogue entry have a page
                            to link to; the rest are named and nothing more. */}
                        {member.scent ? (
                          <Link
                            href={`/product/${member.scent}`}
                            className="font-serif text-xl text-charcoal underline-offset-8 transition-colors hover:text-gold-deep hover:underline"
                          >
                            {member.name}
                          </Link>
                        ) : (
                          <span className="font-serif text-xl text-charcoal">
                            {member.name}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>

                  <p className="mt-6 font-serif text-3xl text-charcoal">
                    {DISCOVERY_PRICE}
                  </p>
                  <p className="mt-1 text-sm text-charcoal/60">
                    Free shipping · {DISCOVERY_CREDIT} credit toward full size
                  </p>

                  {/* mt-auto pins the CTA to the card's floor. */}
                  <div className="mt-7 pt-1 md:mt-auto md:pt-7">
                    <AddToCartButton
                      product={set.id}
                      value={DISCOVERY_PRICE_AMOUNT}
                      className="w-full"
                    >
                      Add to Cart — {DISCOVERY_PRICE}
                    </AddToCartButton>
                  </div>
                </article>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* HOW THE CREDIT WORKS — the offer is unusual enough that leaving it
          unexplained reads as a catch. */}
      <section className="border-t border-charcoal/10 px-5 py-16 md:px-6 md:py-20">
        <div className="mx-auto w-full max-w-5xl">
          <SectionHeader numeral="II" label="How the credit works" />

          <div className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {steps.map((step, i) => (
              <FadeIn key={step.numeral} delay={i * 100}>
                <div>
                  <p className="font-serif text-sm tracking-[0.2em] text-gold">
                    {step.numeral}
                  </p>
                  <div className="mt-4 h-px w-8 bg-gold/70" />
                  <p className="mt-5 font-serif text-2xl text-charcoal">
                    {step.lead}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-charcoal/70">
                    {step.body}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CLOSE */}
      <section className="border-t border-charcoal/10 px-5 py-16 md:px-6 md:py-20">
        <div className="mx-auto w-full max-w-xl text-center">
          <FadeIn>
            <Guarantee />
            <p className="mt-6 text-sm text-charcoal/60">
              Ships in {SHIP_WINDOW}. Returns accepted within {RETURN_WINDOW} of
              delivery.
            </p>
            <p className="mt-8 text-xs uppercase tracking-[0.25em] text-charcoal/45">
              Already know your scent?{" "}
              <Link
                href="/deity#parthenon"
                className="text-charcoal/60 underline-offset-8 transition-colors hover:text-gold-deep hover:underline"
              >
                Shop full size
              </Link>
            </p>
          </FadeIn>
        </div>
      </section>

      <div className="px-5 md:px-6">
        <HomeFooter />
      </div>
    </main>
  );
}
