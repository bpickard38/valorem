import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  isScentId,
  lowestPricing,
  productImages,
  productVariants,
} from "@/lib/shopify";
import {
  RETURN_WINDOW,
  SCENTS,
  SHIPPING_NOTE,
  collectionOf,
  noteRows,
  productTitle,
} from "@/lib/site";
import HomeHeader from "@/components/HomeHeader";
import HomeFooter from "@/components/HomeFooter";
import ProductGallery from "@/components/ProductGallery";
import SizeSelector from "@/components/SizeSelector";
import Guarantee from "@/components/Guarantee";
import ValueComparison from "@/components/ValueComparison";
import ProductReviews from "@/components/ProductReviews";
import Disclosure from "@/components/Disclosure";
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
  const [images, variants] = await Promise.all([
    productImages(scent),
    productVariants(scent),
  ]);
  const from = lowestPricing(variants);
  return {
    title: `${productTitle(s)} — VALOREM Solid Fragrance`,
    description: `${s.notes.join(", ")}. ${s.description} From ${from.formatted}.`,
    openGraph: {
      title: `${productTitle(s)} — VALOREM Solid Fragrance`,
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
  /* The next scent in the same house, wrapping at the end — so the three
   * scents of a collection form a loop a shopper can walk without going back
   * to the grid. Derived from COLLECTIONS, so re-ordering a collection
   * re-orders these links too. */
  const collection = collectionOf(scent);
  const siblings = collection.scents;
  const otherId = siblings[(siblings.indexOf(scent) + 1) % siblings.length];
  const other = SCENTS[otherId];
  const [images, variants] = await Promise.all([
    productImages(scent),
    productVariants(scent),
  ]);
  /* The default size anchors the page's non-interactive figures — the
   * ViewContent value and the comparison heading. The selector owns every
   * price a shopper can change. */
  const defaultPricing =
    (variants.find((v) => v.size === "30ml") ?? variants[0]).pricing;

  return (
    <main className="flex-1">
      <HomeHeader />
      <TrackViewContent
        contentId={s.id}
        contentName={s.name}
        value={defaultPricing.amount}
      />

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
          {/* Eyebrow doubles as the way back up to the collection the shopper
              came down from. */}
          <Link
            href={`/collections/${collection.id}`}
            className="label-engraved text-charcoal/50 underline-offset-8 transition-colors hover:text-gold-deep hover:underline"
          >
            {collection.name}
          </Link>
          <h1 className="type-heading mt-3 text-charcoal">{productTitle(s)}</h1>
          {/* Only Artemis carries a sub-name today ("Midnight Vanilla"). */}
          {s.subtitle ? (
            <p className="label-engraved mt-3 text-charcoal/55">
              {s.subtitle}
            </p>
          ) : null}
          <p className="mt-2 font-serif text-lg italic text-gold-deep">
            {s.lead}
          </p>
          {/* BUY BLOCK — price, size, what that size buys, and the button, in
              one contiguous run. Splitting the price from the selector would
              leave a figure on screen that silently stops describing what is
              about to be added to the cart. */}
          <SizeSelector product={s.id} variants={variants} />

          <Guarantee className="mt-5" align="left" />

          <p className="mt-4 text-xs leading-relaxed tracking-wide text-charcoal/50">
            {SHIPPING_NOTE} Returns accepted within {RETURN_WINDOW} of
            delivery.
          </p>

          {/* The story, in full and in the open — not behind a disclosure. It
              is the one piece of copy that sells the scent, so it stays high:
              directly under the buy block, which is where a shopper's eye
              already is. It sat between the price and the button until sizes
              arrived; a paragraph wedged between choosing a size and paying
              for it is an interruption, so it moved below the CTA rather than
              splitting the buy block in half. Set as body copy rather than the
              display serif; a paragraph this long in italic 18px is a wall. */}
          <p className="mt-8 text-sm leading-relaxed text-charcoal/75">
            {s.inspiration}
          </p>

          {/* THE DETAIL — the pyramid, below the buy block. The story used to
              sit beside this in a second disclosure; it now runs in the open
              above, so this is the only one left. */}
          <div className="mt-10">
            <Disclosure title="Fragrance Notes" defaultOpen>
              <dl className="space-y-3">
                {noteRows(s.pyramid).map((row) => (
                  <div
                    key={row.label ?? "summary"}
                    className="sm:flex sm:gap-4"
                  >
                    {row.label ? (
                      <dt className="label-engraved shrink-0 pt-1 text-charcoal/50 sm:w-20">
                        {row.label}
                      </dt>
                    ) : null}
                    <dd className="text-sm leading-relaxed text-charcoal/75">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </Disclosure>
          </div>

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
          <ValueComparison price={defaultPricing.formatted} />
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
