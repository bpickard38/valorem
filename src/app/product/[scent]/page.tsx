import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isScentId, productImages } from "@/lib/shopify";
import {
  PRICE,
  RETURN_WINDOW,
  SCENTS,
  STICK_SIZE,
  WEAR_ESTIMATE,
} from "@/lib/site";
import HomeHeader from "@/components/HomeHeader";
import HomeFooter from "@/components/HomeFooter";
import ProductGallery from "@/components/ProductGallery";
import AddToCartButton from "@/components/AddToCartButton";
import Guarantee from "@/components/Guarantee";
import ValueComparison from "@/components/ValueComparison";
import ProductReviews from "@/components/ProductReviews";
import TrackViewContent from "@/components/TrackViewContent";

export const dynamicParams = false;

/* Photography lives in Shopify, so the page can't be frozen at build time
 * forever — it re-fetches hourly and picks up new uploads on its own. */
export const revalidate = 3600;

export function generateStaticParams() {
  return Object.keys(SCENTS).map((scent) => ({ scent }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ scent: string }>;
}): Promise<Metadata> {
  const { scent } = await params;
  if (!isScentId(scent)) return {};
  const s = SCENTS[scent];
  const images = await productImages(scent);
  return {
    title: `${s.name} — VALOREM Solid Fragrance`,
    description: `${s.notes.join(", ")}. ${s.description} ${PRICE}.`,
    openGraph: {
      title: `${s.name} — VALOREM Solid Fragrance`,
      description: s.description,
      images: images.slice(0, 1).map((i) => ({
        url: i.url,
        width: i.width,
        height: i.height,
      })),
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ scent: string }>;
}) {
  const { scent } = await params;
  if (!isScentId(scent)) notFound();
  const s = SCENTS[scent];
  const otherId = scent === "aphrodite" ? "poseidon" : "aphrodite";
  const other = SCENTS[otherId];
  const images = await productImages(scent);

  return (
    <main className="flex-1">
      <HomeHeader />
      <TrackViewContent contentId={s.id} contentName={s.name} />

      {/* BUY BLOCK — gallery and details. On a phone this is a single column
          with the gallery first; the two columns only appear from md up. */}
      <div className="mx-auto grid w-full max-w-5xl gap-10 px-5 pb-16 pt-8 md:grid-cols-2 md:gap-14 md:px-6 md:pt-12">
        {/* min-w-0: a grid item defaults to min-width:auto, which lets the
            gallery's swipe track size itself from its slides and push the
            whole page wider than the viewport. */}
        <div className="min-w-0 md:sticky md:top-24 md:self-start">
          <ProductGallery images={images} productName={s.name} />
        </div>

        <div>
          <p className="label-engraved text-charcoal/50">The Parthenon</p>
          <h1 className="type-heading mt-3 text-charcoal">{s.name}</h1>
          <p className="mt-2 font-serif text-lg italic text-gold-deep">
            {s.lead}
          </p>
          <p className="mt-5 font-serif text-3xl text-charcoal">{PRICE}</p>

          <p className="mt-6 text-sm leading-relaxed text-charcoal/70">
            {s.description}
          </p>

          <p className="mt-6 text-[0.65rem] uppercase tracking-[0.28em] text-charcoal/55">
            {s.notes.join("  ·  ")}
          </p>
          {/* The notes translated into a scent people already own. */}
          <p className="mt-3 font-serif text-lg italic leading-snug text-charcoal">
            {s.comparison}
          </p>
          {/* Who it's for. Sits with the comparison because both answer the
              same question; deliberately a line of copy and not a category. */}
          <p className="label-engraved mt-4 text-gold-deep">{s.wearer}</p>

          <p className="mt-6 text-sm text-charcoal/60">
            {STICK_SIZE} solid fragrance · about {WEAR_ESTIMATE} of daily wear
          </p>

          {/* CTA — full-width and thumb-height on mobile, inline on desktop. */}
          <div className="mt-8">
            <AddToCartButton scent={s.id}>Add to Cart — {PRICE}</AddToCartButton>
          </div>

          <Guarantee className="mt-5" align="left" />

          <p className="mt-4 text-xs tracking-wide text-charcoal/50">
            Returns accepted within {RETURN_WINDOW} of delivery.
          </p>

          <Link
            href={`/product/${otherId}`}
            className="mt-8 inline-block text-xs uppercase tracking-[0.25em] text-charcoal/55 underline-offset-8 transition-colors hover:text-gold-deep hover:underline"
          >
            Or try {other.name} →
          </Link>
        </div>
      </div>

      {/* WHY $70 */}
      <div className="border-t border-charcoal/10">
        <div className="mx-auto w-full max-w-5xl px-5 py-16 md:px-6 md:py-20">
          <ValueComparison />
        </div>
      </div>

      {/* REVIEWS */}
      <div className="border-t border-charcoal/10">
        <div className="mx-auto w-full max-w-5xl px-5 py-16 md:px-6 md:py-20">
          <ProductReviews scent={s.id} />
        </div>
      </div>

      <div className="px-5 md:px-6">
        <HomeFooter />
      </div>
    </main>
  );
}
