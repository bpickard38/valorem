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
