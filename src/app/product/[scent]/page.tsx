import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isScentId } from "@/lib/shopify";
import {
  PRICE,
  RETURN_WINDOW,
  SCENTS,
  SHIP_WINDOW,
  STICK_SIZE,
  WEAR_ESTIMATE,
} from "@/lib/site";
import { SectionHeader } from "@/components/ui";
import OrderButton from "@/components/OrderButton";
import EmailForm from "@/components/EmailForm";

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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ivory px-6 py-24">
      {/* Picks up where the film's logo dock left off — same corner, same
          inset — so the mark reads as continuous across the route change. */}
      <Link
        href="/"
        aria-label="Valorem — back to the start"
        className="fixed left-5 top-5 z-50 block"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size mark; next/image adds nothing here */}
        <img
          src="/brand/pegasus-mark.png"
          alt=""
          draggable={false}
          className="h-16 w-auto select-none opacity-80 transition-opacity hover:opacity-100"
        />
      </Link>

      <div className="w-full max-w-xl text-center">
        <SectionHeader numeral="№ 1" label="The Pantheon" />

        {/* Hero slot — the sanctum FLIP transition lands the capsule here */}
        <div
          data-product-hero={s.id}
          className="mx-auto mt-12 flex aspect-[4/5] w-56 items-end justify-center bg-stone"
        >
          <div className="mb-8 h-40 w-10 bg-charcoal/85" aria-hidden="true" />
        </div>

        <h1 className="type-display mt-12">{s.name}</h1>
        <p className="label-engraved mt-4 text-charcoal/55">
          {s.notes.join("  ·  ")}
        </p>
        <p className="mx-auto mt-8 max-w-md text-sm leading-relaxed text-charcoal/75">
          {s.description}
        </p>
        <p className="mt-6 text-sm text-charcoal/60">
          {STICK_SIZE} solid fragrance · about {WEAR_ESTIMATE} of wear
        </p>

        <div className="mt-10">
          <OrderButton scent={s.id}>Order — {PRICE}</OrderButton>
          <p className="mt-4 text-xs tracking-wide text-charcoal/55">
            Ships in {SHIP_WINDOW}. Returns accepted within {RETURN_WINDOW}.
          </p>
        </div>

        <div className="mx-auto mt-16 h-px w-10 bg-gold/70" />

        <p className="label-engraved mt-10 text-charcoal/55">
          First to know when a collection drops
        </p>
        <div className="mt-6">
          <EmailForm />
        </div>

        <nav className="mt-16 text-xs uppercase tracking-[0.28em] text-charcoal/50">
          <Link href="/" className="hover:text-gold">
            ← Return to the House
          </Link>
          <span className="mx-4 text-gold/60">|</span>
          <Link
            href={s.id === "aphrodite" ? "/product/poseidon" : "/product/aphrodite"}
            className="hover:text-gold"
          >
            {s.id === "aphrodite" ? "Poseidon" : "Aphrodite"} →
          </Link>
        </nav>
      </div>
    </main>
  );
}
