/*
 * Reviews — provider-agnostic read layer.
 *
 * Nothing here invents social proof. Every function returns null or an empty
 * summary until a provider is configured AND that provider reports real
 * reviews, so the star rating and review count cannot render until a customer
 * has actually left one.
 *
 * Currently implemented: Judge.me, read through its public REST API.
 *
 * Why the REST API and not Judge.me's widget: this storefront is headless.
 * Judge.me's theme app extension injects into a Shopify theme's Liquid, and
 * there is no theme here — but the app installs to the *store*, not the
 * theme, and its API is reachable from anywhere. Installing Judge.me on the
 * Shopify store is all that is required; these calls run from the Next.js
 * server, so the token never reaches the browser.
 *
 * To activate, add to .env.local (and Vercel):
 *   JUDGEME_API_TOKEN=<Judge.me > Settings > API tokens>
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
  reviewer?: { name?: string | null };
  created_at: string;
  verified?: string | null;
  hidden?: boolean;
  published?: boolean;
};

function shapeJudgeMe(r: JudgeMeReview): Review {
  return {
    id: String(r.id),
    rating: r.rating,
    title: r.title?.trim() || null,
    body: r.body?.trim() ?? "",
    author: r.reviewer?.name?.trim() || "Verified buyer",
    createdAt: r.created_at,
    // Judge.me reports verification as a string enum ("buyer", "none", …)
    verified: Boolean(r.verified && r.verified !== "none"),
  };
}

/*
 * Reviews for one scent. The scent id doubles as the Shopify product handle.
 *
 * Returns null when no provider is configured or the call fails — callers
 * render nothing in that case, which is the correct state for a store that
 * has not collected reviews yet.
 */
export async function getProductReviews(
  scent: ScentId,
): Promise<ReviewSummary | null> {
  const token = process.env.JUDGEME_API_TOKEN;
  const shop = process.env.JUDGEME_SHOP_DOMAIN;
  if (!token || !shop) return null;

  try {
    const url = new URL("https://judge.me/api/v1/reviews");
    url.searchParams.set("api_token", token);
    url.searchParams.set("shop_domain", shop);
    url.searchParams.set("handle", scent);
    url.searchParams.set("per_page", "50");

    const res = await fetch(url, {
      // Reviews change rarely; an hour of cache keeps the product page fast
      // and stays well inside Judge.me's rate limits.
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;

    const json = (await res.json()) as { reviews?: JudgeMeReview[] };
    const reviews = (json.reviews ?? [])
      .filter((r) => !r.hidden && r.published !== false)
      .map(shapeJudgeMe);

    if (reviews.length === 0) return { average: 0, count: 0, reviews: [] };

    const average =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    return {
      average: Math.round(average * 10) / 10,
      count: reviews.length,
      reviews,
    };
  } catch {
    return null;
  }
}

/*
 * Store-wide rating for the homepage proof line — every scent's reviews
 * pooled. Returns null unless there is at least one real review, so the
 * homepage shows nothing rather than an empty five stars.
 */
export async function getAggregateReviews(
  scents: ScentId[],
): Promise<{ average: number; count: number } | null> {
  const summaries = await Promise.all(scents.map(getProductReviews));
  const real = summaries.filter((s): s is ReviewSummary => s !== null);
  if (real.length === 0) return null;

  const count = real.reduce((sum, s) => sum + s.count, 0);
  if (count === 0) return null;

  const weighted = real.reduce((sum, s) => sum + s.average * s.count, 0);
  return { average: Math.round((weighted / count) * 10) / 10, count };
}
