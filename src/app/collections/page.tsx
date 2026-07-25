import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import FadeIn from "@/components/FadeIn";
import HomeHeader from "@/components/HomeHeader";
import HomeFooter from "@/components/HomeFooter";
import Guarantee from "@/components/Guarantee";
import { collectionImage } from "@/lib/collectionImage";
import { productPricing } from "@/lib/shopify";
import {
  COLLECTIONS,
  COLLECTION_TITLE,
  RETURN_WINDOW,
  SHIP_WINDOW,
  STICK_SIZE,
  WEAR_ESTIMATE,
  productImageFit,
  productImageFrame,
} from "@/lib/site";

/* Price comes from Shopify, so this can't be frozen at build time — hourly,
 * matching the product pages and /discovery. */
export const revalidate = 3600;

const collections = [COLLECTIONS.gods, COLLECTIONS.goddesses];

export async function generateMetadata(): Promise<Metadata> {
  const pricing = await productPricing("poseidon");
  return {
    title: `${COLLECTION_TITLE} — VALOREM`,
    description: `Six solid fragrances in two houses — the Gods and the Goddesses. ${STICK_SIZE} twist-up sticks, ${pricing.formatted} each.`,
  };
}

export default async function CollectionsPage() {
  /* Every scent is priced together, so one lookup speaks for all six. */
  const pricing = await productPricing("poseidon");

  return (
    <main className="flex-1">
      <HomeHeader />

      {/* TITLE — the page opens on the collection name and nothing else. No
          hero, no price, no order button: someone who clicked "Collections"
          is here to choose a house, and anything above that choice is in the
          way of it. */}
      <section className="px-5 pb-4 pt-16 md:px-6 md:pt-24">
        <FadeIn className="mx-auto w-full max-w-5xl text-center">
          <p className="font-serif text-sm tracking-[0.2em] text-gold">I</p>
          <div className="mx-auto mt-4 h-px w-10 bg-gold/70" />
          <h1 className="type-display mt-8 text-charcoal">
            {COLLECTION_TITLE}
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-charcoal/65 sm:text-base">
            Six fragrances, two houses. Every one a {STICK_SIZE} twist-up
            stick — no glass, no spray, about {WEAR_ESTIMATE} of daily wear.
          </p>
        </FadeIn>
      </section>

      {/* THE TWO HOUSES — Gods left, Goddesses right. Each whole card is one
          link into its collection page. */}
      <section className="px-5 pb-16 pt-10 md:px-6 md:pb-20">
        <div className="mx-auto grid w-full max-w-5xl gap-6 md:grid-cols-2 md:gap-8">
          {collections.map((collection, i) => {
            const image = collectionImage(collection);
            return (
              <FadeIn key={collection.id} delay={i * 120}>
                <Link
                  href={`/collections/${collection.id}`}
                  className="group flex h-full flex-col"
                >
                  {/* 4:3, not the 4:5 used everywhere else on the site. These
                      are three-bottle group shots — landscape content — and a
                      portrait frame strands half its height as empty air
                      between the bottles and the copy beneath them. The
                      artwork is normalised to a matching 1600x1200 canvas.
                      Fixed either way: the two must occupy identical space or
                      the copy below falls out of step, and the frame has to
                      hold its shape before the art loads. */}
                  <div
                    className={`relative aspect-[4/3] w-full ${productImageFrame}`}
                  >
                    {image ? (
                      <Image
                        src={image}
                        alt={collection.name}
                        fill
                        /* Two-up from md, full-bleed below — stops a 1600px
                           file being shipped to a 375px phone. */
                        sizes="(min-width: 768px) 496px, 100vw"
                        priority={i === 0}
                        className={`${productImageFit} transition-transform duration-700 ease-out group-hover:scale-[1.03]`}
                      />
                    ) : (
                      /* No photograph yet. An engraved plate rather than a grey
                         hole — the page has to look finished before the
                         photography lands. Drop a file at
                         public/collections/<id>.jpg and it takes over. */
                      <div className="texture-travertine absolute inset-0 flex flex-col items-center justify-center gap-6">
                        <Image
                          src="/valorem-pegasus.png"
                          alt=""
                          width={572}
                          height={589}
                          className="h-auto w-20 opacity-40"
                        />
                        <p className="label-engraved text-charcoal/45">
                          {collection.name}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-7 text-center md:p-9">
                    <p className="label-engraved text-gold-deep">
                      {collection.audience}
                    </p>
                    <h2 className="type-heading mt-4 text-charcoal transition-colors group-hover:text-gold-deep">
                      {collection.name}
                    </h2>
                    <p className="mt-2 font-serif text-lg italic text-charcoal/70">
                      {collection.lead}
                    </p>
                    <p className="mt-5 text-sm leading-relaxed text-charcoal/65">
                      {collection.description}
                    </p>

                    {/* mt-auto pins the CTA to the card's floor so both cards
                        put their button on the same line. Rendered as a span:
                        this sits inside the card's <a>, and a nested anchor is
                        invalid HTML. */}
                    <div className="mt-8 md:mt-auto md:pt-8">
                      <span className="group/btn relative inline-block w-full cursor-pointer overflow-hidden bg-gold px-10 py-4 text-xs font-medium uppercase tracking-[0.25em] text-ivory transition-colors duration-300">
                        <span
                          aria-hidden="true"
                          className="absolute inset-0 origin-left scale-x-0 bg-gold-deep transition-transform duration-300 ease-out group-hover/btn:scale-x-100"
                        />
                        <span className="relative z-10">
                          Explore {collection.name}
                        </span>
                      </span>
                      <p className="mt-4 text-xs tracking-wide text-charcoal/50">
                        Three scents · {pricing.formatted} each
                      </p>
                    </div>
                  </div>
                </Link>
              </FadeIn>
            );
          })}
        </div>
      </section>

      {/* CLOSE */}
      <section className="border-t border-charcoal/10 px-5 py-16 md:px-6 md:py-20">
        <FadeIn className="mx-auto w-full max-w-xl text-center">
          <Guarantee />
          <p className="mt-6 text-sm text-charcoal/60">
            Ships in {SHIP_WINDOW}. Returns accepted within {RETURN_WINDOW} of
            delivery.
          </p>
        </FadeIn>
      </section>

      <div className="px-5 md:px-6">
        <HomeFooter />
      </div>
    </main>
  );
}
