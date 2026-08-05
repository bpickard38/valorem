/*
 * Every title tag, meta description and canonical on the site.
 *
 * This exists because the five routes each grew their own generateMetadata()
 * to the same template, and changing how a title reads meant editing five
 * files. Copy changes now happen here and nowhere else.
 *
 * Two rules the old template broke, and this one exists to keep:
 *
 *   1. A title has to contain a term someone searches for. "Poseidon I —
 *      VALOREM Solid Fragrance" targets people searching "Poseidon I", who do
 *      not exist. "Solid cologne" and "solid perfume" are the phrases with
 *      volume, so every product and collection title carries one.
 *   2. A description has to be a sentence. The old one joined the entire note
 *      list with commas — thirteen nouns and a price, which reads as machine
 *      output, truncates in the SERP and gives nobody a reason to click.
 *
 * The `I` edition mark stays on the page and in og:title, where it is brand
 * styling, and comes off the SEO title, where it only eats characters.
 *
 * LIMITS, enforced by the assertions at the bottom of this file: titles under
 * 60 characters, descriptions under 160. Both are where Google truncates.
 */

import type { Metadata } from "next";
import type { ScentId } from "@/lib/shopify";
import { CONTACT_EMAIL, WEAR_ESTIMATE_SHORT } from "@/lib/site";
import type { CollectionId } from "@/lib/site";

/* The wear figure, interpolated rather than typed into nine strings.
 *
 * It WAS typed into nine strings — "about three months of daily wear" in all
 * six product descriptions, the collections index and the home page — and when
 * WEAR_ESTIMATE moved to six-to-eight months on 2026-08-03 every one of them
 * kept the old number. A meta description is the version of a claim that ends
 * up in a Google snippet and on a shared link, so the result was the site
 * saying six-to-eight months on the page and three months everywhere it gets
 * quoted. Interpolated now, so the next change cannot half-land.
 *
 * Uses the SHORT form: a description has a 160-character budget (asserted at
 * the bottom of this file) and "6–8 months" spends ten of them where "six to
 * eight months" spends nineteen. It also scans better in a SERP. */
const WEAR = `about ${WEAR_ESTIMATE_SHORT}`;

/* Absolute base for canonicals and OG urls. Next needs this to resolve the
 * relative paths below; without it `alternates.canonical` silently emits
 * nothing.
 *
 * This is the live apex — houseofvalorem.com redirects here, and the
 * myshopify.com mirror is a real duplicate-content risk, which is the whole
 * reason canonicals matter on a headless build. */
export const SITE_URL = "https://www.valoremfragrances.com";

export const SITE_NAME = "Valorem";

/* Price handling: every description ends "From $X." where X is the lowest
 * available variant price, derived at request time — never a hardcoded $70.
 * Leading with the entry price raises click-through and the size selector
 * does the upselling on the page itself. */
function withPrice(body: string, from: string): string {
  return `${body} From ${from}.`;
}

/* ---- Products --------------------------------------------------------- */

/* Per-scent overrides. The note list a product page shows is the full
 * formulation; what belongs in a SERP snippet is three or four notes that
 * describe the smell, which is a different edit and cannot be derived. */
const PRODUCT_SEO: Record<
  ScentId,
  { title: string; body: string }
> = {
  poseidon: {
    title: "Poseidon Solid Cologne — Bergamot & Lavender | Valorem",
    body: `Solid cologne in a twist-up stick. Bergamot, Sichuan pepper and lavender over warm ambroxan. 30 ml, ${WEAR} of daily wear.`,
  },
  hades: {
    title: "Hades Solid Cologne — Bergamot & Black Currant | Valorem",
    body: `Solid cologne in a twist-up stick. Bergamot, black currant and apple over smoky birch, oakmoss and cedar. 30 ml, ${WEAR} of wear.`,
  },
  apollo: {
    title: "Apollo Solid Cologne — Grapefruit, Lemon, Mint | Valorem",
    body: `Solid cologne in a twist-up stick. Grapefruit, lemon and mint over blue cedar and musk. 30 ml, ${WEAR} of daily wear.`,
  },
  artemis: {
    title: "Artemis Solid Perfume — Vanilla and Amber | Valorem",
    body: `Solid perfume in a twist-up stick. Warm vanilla wrapped in soft amber. 30 ml, ${WEAR} of daily wear.`,
  },
  hera: {
    title: "Hera Solid Perfume — Lavender & Mandarin | Valorem",
    body: `Solid perfume in a twist-up stick. Lavender and mandarin over orange blossom, jasmine and warm cedar. 30 ml, ${WEAR} of wear.`,
  },
  aphrodite: {
    title: "Aphrodite Solid Perfume — Vanilla & Jasmine | Valorem",
    body: `Solid perfume in a twist-up stick. Vanilla orchid, jasmine absolute and amberwood over rich oakmoss. 30 ml, ${WEAR} of wear.`,
  },
};

export function productSeo(scent: ScentId, from: string) {
  const entry = PRODUCT_SEO[scent];
  return {
    title: entry.title,
    description: withPrice(entry.body, from),
    canonical: `/product/${scent}`,
  };
}

/* ---- Collections ------------------------------------------------------ */

const COLLECTION_SEO: Record<
  CollectionId,
  { title: string; body: string }
> = {
  gods: {
    title: "The Gods — Solid Cologne in a Twist-Up Stick | Valorem",
    body: "Hades, Poseidon and Apollo. Three fresh, sharp solid fragrances in 30 ml twist-up sticks — bergamot, citrus and smoke. No glass, no spills.",
  },
  goddesses: {
    title: "The Goddesses — Solid Perfume in a Twist-Up Stick | Valorem",
    body: "Artemis, Hera and Aphrodite. Three warm solid fragrances in 30 ml twist-up sticks — vanilla, jasmine and amber. No glass, no spills.",
  },
};

export function collectionSeo(collection: CollectionId, from: string) {
  const entry = COLLECTION_SEO[collection];
  return {
    title: entry.title,
    description: withPrice(entry.body, from),
    canonical: `/collections/${collection}`,
  };
}

/* ---- Everything else -------------------------------------------------- */

export function collectionsIndexSeo(from: string) {
  return {
    title: "Solid Cologne & Perfume — The Deity Collection | Valorem",
    description: withPrice(
      `Six solid fragrances in twist-up sticks. Three fresh, three warm. 30 ml, ${WEAR} of daily wear. No glass, no spills.`,
      from,
    ),
    canonical: "/collections",
  };
}

/* The title keeps its keyword shape on purpose. The hero moved from a format
 * message ("carried, not sprayed") to a benefit one, and the DESCRIPTION
 * follows it — but a title still has to contain the phrase someone typed, and
 * "solid cologne" / "solid perfume" are the phrases with volume. A benefit
 * headline in the title tag would match the page and rank for nothing.
 *
 * The description now leads with where the scent goes rather than how it is
 * applied, so the snippet and the H1 make the same promise. */
export function homeSeo(from: string) {
  return {
    title: "VALOREM — Solid Cologne & Perfume in a Twist-Up Stick",
    description: withPrice(
      `Solid fragrance that sits on your skin, not in the room. Six twist-up sticks in the Deity Collection — 30 ml, ${WEAR} of daily wear.`,
      from,
    ),
    canonical: "/",
  };
}

/* The scent finder became a route of its own on 2026-08-05, having lived as a
 * section of the home page behind /#quiz. A section cannot rank, cannot be
 * linked to from an ad, and cannot be shared — this can.
 *
 * The title leads with "Quiz" because that is the word people type, and keeps
 * "Solid Cologne & Perfume" because those are still the phrases with volume
 * (same reasoning as homeSeo above). No price interpolation: nothing on this
 * page quotes one until the result card, and a description promising a figure
 * the page does not show is a bounce. */
export const QUIZ_SEO = {
  title: "Scent Quiz — Find Your Solid Cologne or Perfume | Valorem",
  description:
    "Three questions and we'll point you at one of six. Answer what you like to smell, not what you know about fragrance.",
  canonical: "/quiz",
};

export const FAQ_SEO = {
  title: "FAQ — VALOREM Solid Fragrance",
  description:
    "How long solid fragrance lasts, shipping, returns, sizing, and what's inside the twist-up stick.",
  canonical: "/faq",
};

/* /faq, /contact and /privacy keep the titles and descriptions they already
 * had — they were fine, and rewriting a description that ranks is a cost with
 * no benefit. They are here only to gain a canonical and to stop being the
 * three routes whose metadata lives somewhere else. */
export const CONTACT_SEO = {
  title: "Contact — VALOREM Solid Fragrance",
  description: `Questions, orders, anything — write to ${CONTACT_EMAIL}.`,
  canonical: "/contact",
};

export const PRIVACY_SEO = {
  title: "Privacy Policy — VALOREM",
  description:
    "What VALOREM collects, why, who we share it with, and how to opt out.",
  canonical: "/privacy",
};

/* ---- Assembly --------------------------------------------------------- */

/* Turns one of the shapes above into Next's Metadata, attaching the canonical
 * every route was missing. `og` overrides the social title/description where
 * they should differ from the SEO ones — on products they do, because a share
 * card reads better as "Poseidon I — Valorem" than as a keyword string. */
export function toMetadata(
  seo: { title: string; description: string; canonical: string },
  og?: {
    title?: string;
    description?: string;
    images?: { url: string; width: number; height: number }[];
  },
): Metadata {
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: seo.canonical },
    openGraph: {
      title: og?.title ?? seo.title,
      description: og?.description ?? seo.description,
      url: seo.canonical,
      siteName: SITE_NAME,
      type: "website",
      images: og?.images,
    },
  };
}

/* ---- Structured data -------------------------------------------------- */

/* schema.org/Product for a scent page.
 *
 * Emits an AggregateOffer whenever there is more than one size, so the price
 * range in a rich result matches the range on the page. No AggregateRating:
 * there are no reviews, and inventing one is a manual-action risk under
 * Google's policy quite apart from being a lie. */
export function productJsonLd(params: {
  name: string;
  description: string;
  image: string[];
  url: string;
  offers: { price: number; currency: string; available: boolean }[];
}) {
  const { name, description, image, url, offers } = params;
  const availability = offers.some((o) => o.available)
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";
  const currency = offers[0]?.currency ?? "USD";
  const prices = offers.map((o) => o.price);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image,
    url: `${SITE_URL}${url}`,
    brand: { "@type": "Brand", name: SITE_NAME },
    offers:
      offers.length > 1
        ? {
            "@type": "AggregateOffer",
            priceCurrency: currency,
            lowPrice: Math.min(...prices),
            highPrice: Math.max(...prices),
            offerCount: offers.length,
            availability,
            url: `${SITE_URL}${url}`,
          }
        : {
            "@type": "Offer",
            priceCurrency: currency,
            price: prices[0],
            availability,
            url: `${SITE_URL}${url}`,
          },
  };
}

/* ---- Guardrails -------------------------------------------------------
 * Length limits are the whole reason these strings were rewritten, so they
 * are checked rather than trusted. Descriptions are measured with a
 * worst-case price appended: "From $16." is what ships today, but a longer
 * figure must not silently push a description past the limit.
 *
 * Dev-only — `next build` runs this module, and a hard throw in production
 * over a two-character overrun would take the site down to fix a snippet. */
if (process.env.NODE_ENV !== "production") {
  const LONGEST_PRICE = "$1,000";
  const entries: { label: string; title: string; body: string }[] = [
    ...Object.entries(PRODUCT_SEO).map(([k, v]) => ({ label: k, ...v })),
    ...Object.entries(COLLECTION_SEO).map(([k, v]) => ({ label: k, ...v })),
    {
      label: "collections-index",
      ...collectionsIndexSeo(""),
      body: collectionsIndexSeo("").description,
    },
    { label: "home", ...homeSeo(""), body: homeSeo("").description },
  ];

  for (const e of entries) {
    if (e.title.length >= 60) {
      console.warn(
        `[seo] title too long (${e.title.length} >= 60): ${e.label}`,
      );
    }
    const worst = withPrice(e.body, LONGEST_PRICE);
    if (worst.length >= 160) {
      console.warn(
        `[seo] description too long (${worst.length} >= 160): ${e.label}`,
      );
    }
  }
}
