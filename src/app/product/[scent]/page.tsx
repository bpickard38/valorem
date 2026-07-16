import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isScentId, productImage } from "@/lib/shopify";
import {
  PRICE,
  RETURN_WINDOW,
  SCENTS,
  STICK_SIZE,
  WEAR_ESTIMATE,
} from "@/lib/site";
import { SectionHeader } from "@/components/ui";
import OrderButton from "@/components/OrderButton";

export const dynamicParams = false;

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
  return {
    title: `${s.name} — VALOREM Solid Fragrance`,
    description: `${s.notes.join(", ")}. ${s.description} ${PRICE}.`,
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
  const image = await productImage(scent);

  const sideArrow =
    "group/arrow absolute top-1/2 -translate-y-1/2 text-center text-charcoal/50 transition-colors hover:text-gold";

  return (
    // One screen, no scroll — everything fits inside the viewport.
    <main className="flex h-svh flex-col items-center justify-center overflow-hidden bg-ivory px-6">
      {/* Picks up where the film's logo dock left off — same corner, same
          inset — so the mark reads as continuous across the route change. */}
      <Link
        href="/"
        aria-label="Valorem — home"
        className="group fixed left-5 top-5 z-50 block"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size mark; next/image adds nothing here */}
        <img
          src="/brand/pegasus-mark-v2.png"
          alt=""
          draggable={false}
          className="h-16 w-auto select-none opacity-80 transition-opacity group-hover:opacity-100"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none mt-1.5 block text-center text-[0.7rem] uppercase tracking-[0.3em] text-charcoal/70 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        >
          Home
        </span>
      </Link>

      <div className="w-full max-w-xl text-center">
        <SectionHeader numeral="№ 1" label="The Parthenon" />

        {/* Hero image flanked by the ‹ › arrows to the other scent,
            vertically centered on the image */}
        <div className="relative mx-auto mt-8 w-fit">
          <div
            data-product-hero={s.id}
            className="mx-auto flex aspect-[4/5] h-[34vh] items-end justify-center overflow-hidden bg-stone"
          >
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element -- remote Shopify CDN image; sized by the frame
              <img
                src={image.url}
                alt={image.altText ?? `${s.name} — VALOREM solid fragrance`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="mb-8 h-[60%] w-10 bg-charcoal/85" aria-hidden="true" />
            )}
          </div>

          <Link
            href={`/product/${otherId}`}
            aria-label={`View ${other.name}`}
            className={`${sideArrow} right-full mr-5 sm:mr-8`}
          >
            <span className="block font-serif text-4xl leading-none">‹</span>
            <span className="mt-2 block text-[0.65rem] uppercase tracking-[0.28em]">
              {other.name}
            </span>
          </Link>
          <Link
            href={`/product/${otherId}`}
            aria-label={`View ${other.name}`}
            className={`${sideArrow} left-full ml-5 sm:ml-8`}
          >
            <span className="block font-serif text-4xl leading-none">›</span>
            <span className="mt-2 block text-[0.65rem] uppercase tracking-[0.28em]">
              {other.name}
            </span>
          </Link>
        </div>

        <h1 className="type-display mt-8">{s.name}</h1>
        <p className="mt-3 font-serif text-lg italic text-gold-deep">{s.lead}</p>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-charcoal/70">
          {s.description}
        </p>
        <p className="mt-4 text-[0.65rem] uppercase tracking-[0.28em] text-charcoal/55">
          {s.notes.join("  ·  ")}
        </p>
        <p className="mt-4 text-sm text-charcoal/60">
          {STICK_SIZE} solid fragrance · about {WEAR_ESTIMATE} of wear
        </p>

        <div className="mt-7">
          <OrderButton scent={s.id}>Order — {PRICE}</OrderButton>
          <p className="mt-3 text-xs tracking-wide text-charcoal/55">
            Returns accepted within {RETURN_WINDOW}.
          </p>
        </div>
      </div>
    </main>
  );
}
