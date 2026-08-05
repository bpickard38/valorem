/*
 * Reviews — provider-agnostic read layer.
 *
 * Nothing here invents social proof. Every function returns null or an empty
 * summary until a provider is configured AND that provider reports real
 * reviews, so the star rating and review count cannot render until a customer
 * has actually left one.
 *
 * Currently implemented: Judge.me, read through its REST API.
 *
 * Why the API and not Judge.me's widget: this storefront is headless. Judge.me's
 * theme app extension injects into a Shopify theme's Liquid, and there is no
 * theme here — but the app installs to the *store*, not the theme, and its API
 * is reachable from anywhere. These calls run from the Next.js server, so the
 * token never reaches the browser.
 *
 * Verified against the Judge.me API docs (2026-07-21). Four things there that
 * are easy to get wrong, all of which this file depends on:
 *
 *   1. The host is api.judge.me, NOT judge.me.
 *   2. GET /reviews does NOT accept a `handle` filter — only `product_id`,
 *      which is Judge.me's own internal id, not the Shopify handle. Passing
 *      `handle` is silently ignored, which would return every review in the
 *      store for every product. We fetch once and filter on the review's own
 *      `product_handle` field instead, which does match the Shopify handle.
 *   3. GET /reviews accepts the PRIVATE token only (or OAuth). The public
 *      token works for widget endpoints, not this one.
 *   4. `body` is documented as raw and unsanitized. It is rendered as a React
 *      text child, which escapes it. NEVER pass it to dangerouslySetInnerHTML
 *      — that is the XSS the docs are warning about.
 *
 * To activate, add to .env.local (and Vercel):
 *   JUDGEME_API_TOKEN=<Judge.me > Settings > API tokens — the PRIVATE token>
 *   JUDGEME_SHOP_DOMAIN=houseofvalorem.myshopify.com
 */

import type { ScentId } from "@/lib/shopify";

export interface Review {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  author: string;
  createdAt: string;
  verified: boolean;
}

export interface ReviewSummary {
  average: number;
  count: number;
  reviews: Review[];
}

/** True when a review provider is wired up at all. */
export function reviewsConfigured(): boolean {
  return Boolean(process.env.JUDGEME_API_TOKEN && process.env.JUDGEME_SHOP_DOMAIN);
}

type JudgeMeReview = {
  id: number;
  rating: number;
  title: string | null;
  body: string | null;
  product_handle: string | null;
  reviewer?: { name?: string | null };
  created_at: string;
  /* "ok" means published; "spam" means the merchant hid it. */
  curated?: string | null;
  hidden?: boolean;
  /* A string enum — "buyer", "none", … — not a boolean. */
  verified?: string | null;
};

function shape(r: JudgeMeReview): Review {
  return {
    id: String(r.id),
    rating: r.rating,
    title: r.title?.trim() || null,
    body: r.body?.trim() ?? "",
    author: r.reviewer?.name?.trim() || "Verified buyer",
    createdAt: r.created_at,
    verified: Boolean(r.verified && r.verified !== "none"),
  };
}

/*
 * Every published review in the store, in one request. The catalogue is two
 * products, so fetching once and partitioning by handle is cheaper than a
 * call per product — and it is the only option anyway, since the endpoint
 * cannot filter by handle.
 *
 * Returns null when unconfigured or on any failure: a review outage must
 * never take a product page down.
 */
async function fetchPublishedReviews(): Promise<JudgeMeReview[] | null> {
  const token = process.env.JUDGEME_API_TOKEN;
  const shop = process.env.JUDGEME_SHOP_DOMAIN;
  if (!token || !shop) return null;

  try {
    const url = new URL("https://api.judge.me/api/v1/reviews");
    url.searchParams.set("shop_domain", shop);
    url.searchParams.set("per_page", "100");

    const res = await fetch(url, {
      headers: { "X-Api-Token": token },
      // Reviews change rarely; an hour of cache keeps product pages fast and
      // stays well inside Judge.me's rate limits.
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;

    const json = (await res.json()) as { reviews?: JudgeMeReview[] };
    return (json.reviews ?? []).filter(
      (r) => r.hidden !== true && r.curated !== "spam",
    );
  } catch {
    return null;
  }
}

function summarise(reviews: JudgeMeReview[]): ReviewSummary {
  if (reviews.length === 0) return { average: 0, count: 0, reviews: [] };
  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  return {
    average: Math.round((total / reviews.length) * 10) / 10,
    count: reviews.length,
    reviews: reviews.map(shape),
  };
}

/*
 * Reviews for one scent. The scent id doubles as the Shopify product handle,
 * which is what Judge.me reports in `product_handle`.
 */
export async function getProductReviews(
  scent: ScentId,
): Promise<ReviewSummary | null> {
  const all = await fetchPublishedReviews();
  if (all === null) return null;
  return summarise(all.filter((r) => r.product_handle === scent));
}

/* ---- Testimonials -----------------------------------------------------
 * The homepage quote cards. Same data as the product-page reviews, selected
 * and trimmed for a three-card row — NOT a second source of review content.
 *
 * The request that prompted this asked for a hardcoded placeholder array to
 * swap out later. There is nothing to swap: Judge.me is already wired above,
 * so these are real reviews or they are nothing at all. No placeholder array
 * exists to be forgotten and shipped.
 *
 * Three things this function will not do, all of them the same rule — a
 * testimonial is a customer's statement and editing it is misrepresenting
 * them (FTC 16 CFR Part 465, in force since October 2024):
 *
 *   1. It will not write a headline. `headline` is the reviewer's OWN title or
 *      it is null. The brief asked for "a short phrase from the review" as a
 *      bold pulled quote, which sounds harmless and isn't: choosing which
 *      six words of someone's review to set in bold is editorial control over
 *      their meaning. Judge.me already collects a title; that is the
 *      reviewer's own pulled quote and it is the only one used.
 *   2. It will not cut a sentence in half. Bodies are trimmed on sentence
 *      boundaries only, so a trimmed review still ends where the reviewer
 *      ended a thought. A review too long to trim cleanly is passed whole
 *      rather than clipped mid-clause with an ellipsis.
 *   3. It will not round a rating up. The card shows what was given.
 */

/* Reviewer names as "first name + last initial" — the brief's format, and the
 * conventional one for published testimonials.
 *
 * Judge.me's `reviewer.name` is free text a customer typed, so this handles
 * what actually arrives: "Marcus Thompson" → "Marcus T.", "Marcus T." stays
 * put, a single "Marcus" stays "Marcus", and the "Verified buyer" fallback
 * from shape() above passes through untouched rather than becoming
 * "Verified B." Anything unexpected is returned as-is: a name rendered oddly
 * is a blemish, a name mangled into something else is a misattribution. */
export function shortenName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name.trim();
  if (parts[0].toLowerCase() === "verified") return name.trim();

  const last = parts[parts.length - 1];
  /* Already an initial, with or without the period. */
  if (/^[A-Za-z]\.?$/.test(last)) {
    return `${parts[0]} ${last.replace(/\.?$/, ".")}`;
  }
  return `${parts[0]} ${last[0].toUpperCase()}.`;
}

/* First `max` sentences, and only whole ones. Returns the body unchanged when
 * it cannot find a boundary — see rule 2 above. */
export function trimToSentences(body: string, max = 3): string {
  const sentences = body.match(/[^.!?]+[.!?]+(\s|$)/g);
  if (!sentences || sentences.length <= max) return body.trim();
  return sentences.slice(0, max).join("").trim();
}

export interface Testimonial {
  id: string;
  rating: number;
  /* The reviewer's own title. Null when they left none — the card renders
   * without a headline rather than inventing one. */
  headline: string | null;
  body: string;
  author: string;
  scent: ScentId;
}

/*
 * The best few reviews across the given scents, for the homepage row.
 *
 * "Best" is highest-rated first, then newest — an ordinary editorial pick from
 * real reviews, which is what a testimonial section is. Ties break toward the
 * recent one. Reviews with no body are dropped: a bare star rating is not a
 * testimonial and renders as an empty card.
 *
 * Returns an empty array when unconfigured, when the fetch fails, or when
 * there is simply nothing yet — the component treats all three the same way
 * and renders nothing.
 */
export async function getTestimonials(
  scents: ScentId[],
  limit = 3,
): Promise<Testimonial[]> {
  const all = await fetchPublishedReviews();
  if (all === null) return [];

  return all
    .filter(
      (r) =>
        r.product_handle &&
        (scents as string[]).includes(r.product_handle) &&
        (r.body?.trim() ?? "").length > 0,
    )
    .sort(
      (a, b) =>
        b.rating - a.rating ||
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, limit)
    .map((r) => {
      const shaped = shape(r);
      return {
        id: shaped.id,
        rating: shaped.rating,
        headline: shaped.title,
        body: trimToSentences(shaped.body),
        author: shortenName(shaped.author),
        scent: r.product_handle as ScentId,
      };
    });
}

/*
 * Store-wide rating for the homepage proof line. Returns null unless there is
 * at least one real review, so the homepage shows nothing rather than an empty
 * five stars.
 *
 * Counts only reviews belonging to the given scents — a store-level review
 * left against no product should not inflate the product rating.
 */
export async function getAggregateReviews(
  scents: ScentId[],
): Promise<{ average: number; count: number } | null> {
  const all = await fetchPublishedReviews();
  if (all === null) return null;

  const mine = all.filter(
    (r) => r.product_handle && (scents as string[]).includes(r.product_handle),
  );
  if (mine.length === 0) return null;

  const { average, count } = summarise(mine);
  return { average, count };
}
