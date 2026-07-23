import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import FadeIn from "@/components/FadeIn";
import HomeHeader from "@/components/HomeHeader";
import HomeFooter from "@/components/HomeFooter";
import Guarantee from "@/components/Guarantee";
import { productImage, productPricing } from "@/lib/shopify";
import {
  COLLECTIONS,
  COLLECTION_TITLE,
  RETURN_WINDOW,
  SCENTS,
  SHIP_WINDOW,
  isCollectionId,
  noteTeaser,
  productImageFit,
  productImageFrame,
  productTitle,
} from "@/lib/site";

export const dynamicParams = false;

/* Photography and prices live in Shopify, so this re-fetches hourly like the
 * product pages rather than freezing at build time. */
export const revalidate = 3600;

export function generateStaticParams() {
  return Object.keys(COLLECTIONS).map((collection) => ({ collection }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ collection: string }>;
}): Promise<Metadata> {
  const { collection } = await params;
  if (!isCollectionId(collection)) return {};
  const c = COLLECTIONS[collection];
  const names = c.scents.map((s) => productTitle(SCENTS[s])).join(", ");
  return {
    title: `${c.name} — ${COLLECTION_TITLE} — VALOREM`,
    description: `${names}. ${c.description}`,
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ collection: string }>;
}) {
  const { collection } = await params;
  if (!isCollectionId(collection)) notFound();
  const c = COLLECTIONS[collection];
  const other =
    COLLECTIONS[c.id === "gods" ? "goddesses" : "gods"];

  /* One lead photo and one price per scent. Fetched together so the three
     cards cost a single round of requests rather than three sequential ones. */
  const scents = await Promise.all(
    c.scents.map(async (id) => {
      const [image, pricing] = await Promise.all([
        productImage(id),
        productPricing(id),
      ]);
      return { ...SCENTS[id], image, pricing };
    }),
  );

  return (
    <main className="flex-1">
      <HomeHeader />

      {/* TITLE */}
      <section className="px-5 pb-4 pt-14 md:px-6 md:pt-20">
        <FadeIn className="mx-auto w-full max-w-5xl text-center">
          <Link
            href="/collections"
            className="label-engraved text-charcoal/45 underline-offset-8 transition-colors hover:text-gold-deep hover:underline"
          >
            ← {COLLECTION_TITLE}
          </Link>
          <h1 className="type-display mt-7 text-charcoal">{c.name}</h1>
          <p className="mt-3 font-serif text-lg italic text-gold-deep">
            {c.lead}
          </p>
          <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-charcoal/65">
            {c.description}
          </p>
        </FadeIn>
      </section>

      {/* THE THREE SCENTS */}
      <section className="px-5 pb-16 pt-10 md:px-6 md:pb-20">
        <div className="mx-auto grid w-full max-w-5xl gap-6 md:grid-cols-3 md:gap-7">
          {scents.map((scent, i) => (
            <FadeIn key={scent.id} delay={i * 110}>
              {/* Name and price only. Everything that used to sit here — lead,
                  notes, description, comparison, CTA — lives on the product
                  page. A grid's job is to let someone scan six products and
                  pick one; paragraphs of copy on every card work against that,
                  and the whole card is already the button. */}
              <Link href={`/product/${scent.id}`} className="group block">
                {/* 4:5 to match the product gallery and ProductRender — every
                    product surface on the site uses it, and a stick is a tall
                    object that wastes a square frame's width. */}
                <div
                  className={`relative aspect-[4/5] w-full ${productImageFrame}`}
                >
                  {scent.image ? (
                    <Image
                      src={scent.image.url}
                      alt={scent.image.altText ?? scent.name}
                      fill
                      sizes="(min-width: 768px) 330px, 100vw"
                      priority={i === 0}
                      className={`${productImageFit} transition-transform duration-700 ease-out group-hover:scale-[1.03]`}
                    />
                  ) : (
                    <div className="texture-travertine absolute inset-0 flex items-center justify-center">
                      <Image
                        src="/valorem-pegasus.png"
                        alt=""
                        width={572}
                        height={589}
                        className="h-auto w-16 opacity-40"
                      />
                    </div>
                  )}
                </div>

                <div className="px-2 pt-3 text-center">
                  {/* Three notes, not the full four — a teaser that says what
                      it smells like in one glance. The complete list stays on
                      the product page, which is where someone who cares about
                      the fourth note is heading anyway. */}
                  <p className="font-serif text-sm italic leading-snug text-charcoal/65">
                    {noteTeaser(scent).join(", ")}
                  </p>
                  {/* Playfair at 600 — the heaviest weight actually loaded
                      (layout.tsx ships 400/500/600). font-bold would ask for
                      700 and get a synthesised faux-bold, which smears the
                      serifs at this size.
                      gold-deep rather than gold: #9a7d33 on ivory is 3.57:1,
                      which clears the 3:1 bar for large text at 24px. The
                      brighter #b8963e lands near 2.8:1 and is genuinely hard
                      to read for anyone with low vision. */}
                  <h2 className="mt-2 font-serif text-2xl font-semibold uppercase tracking-[0.14em] text-gold-deep transition-colors group-hover:text-gold">
                    {productTitle(scent)}
                  </h2>
                  {/* Plain figure, not <Price>: a grid this quiet has no room
                      for a struck-through original and a discount badge. The
                      sale price is still the real price, and the full sale
                      treatment runs on the product page. */}
                  <p className="mt-2 font-serif text-lg text-charcoal/70">
                    {scent.pricing.formatted}
                  </p>
                </div>
              </Link>
            </FadeIn>
          ))}
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
          <p className="mt-8 text-xs uppercase tracking-[0.25em] text-charcoal/45">
            <Link
              href={`/collections/${other.id}`}
              className="text-charcoal/60 underline-offset-8 transition-colors hover:text-gold-deep hover:underline"
            >
              Or see {other.name} →
            </Link>
          </p>
        </FadeIn>
      </section>

      <div className="px-5 md:px-6">
        <HomeFooter />
      </div>
    </main>
  );
}
