/*
 * DESIGN PREVIEW ONLY — these are not reviews and must never reach a customer.
 *
 * They exist so the Reviews section can be laid out and styled against
 * realistic content instead of an empty state. previewSummary() returns null
 * when NODE_ENV is "production"; Next inlines that comparison at build time
 * and the bundler drops the branch.
 *
 * Verified against a real `next build` (2026-07-21):
 *   - compiled production server JS ............ sample text ELIMINATED
 *   - .next/static (browser bundles) ........... sample text ABSENT
 *   - prerendered product HTML ................. renders "No reviews yet"
 *   - .next/server/chunks/ssr/*.js.map ......... text SURVIVES here only
 *
 * That last one is a source map: never executed, never served to a browser.
 * So the samples cannot render and cannot be downloaded — but do not claim
 * the strings are absent from the build directory, because they are not.
 * Re-run this check if the gating changes:
 *
 *   npx next build
 *   find .next/static .next/server -name "*.js" ! -name "*.map" \
 *     | xargs grep -l "Wore it to a wedding"   # must return nothing
 *
 * Publishing invented reviews is illegal in the US (FTC Rule on Consumer
 * Reviews and Testimonials, 16 CFR Part 465, in force since October 2024),
 * with civil penalties assessed per review. Do not lift these into the real
 * data path, and do not remove the NODE_ENV gates.
 */

import type { Review, ReviewSummary } from "@/lib/reviews";
import type { ScentId } from "@/lib/shopify";

const POSEIDON: Review[] = [
  {
    id: "preview-p1",
    rating: 5,
    title: "Exactly the lane I wanted",
    body: "I have worn Sauvage for years and wanted something I could keep on me. This is that, without the alcohol bite. Lasts through a workday on my wrists.",
    author: "Marcus T.",
    createdAt: "2026-06-14T00:00:00Z",
    verified: true,
  },
  {
    id: "preview-p2",
    rating: 5,
    title: "You control how much you wear",
    body: "The thing nobody tells you about sprays is that you cannot take it back once it is on. With this I decide exactly how much goes on. One pass for the office, two for the evening.",
    author: "Devin R.",
    createdAt: "2026-06-02T00:00:00Z",
    verified: true,
  },
  {
    id: "preview-p3",
    rating: 5,
    title: "Lives in my jacket pocket",
    body: "Took it through airport security with zero thought. Reapplied on the plane. That alone is worth it to me.",
    author: "Priya N.",
    createdAt: "2026-05-21T00:00:00Z",
    verified: true,
  },
  {
    id: "preview-p4",
    rating: 4,
    title: "Great, wish it projected more",
    body: "Smells superb and the stick feels expensive in the hand. It does sit close to the skin, so if you want a room-filling scent this is not that. For me that is the point.",
    author: "Alex W.",
    createdAt: "2026-05-09T00:00:00Z",
    verified: true,
  },
  {
    id: "preview-p5",
    rating: 5,
    title: "Bought a second one",
    body: "One for the bag, one for the desk. Three months in on the first and there is plenty left.",
    author: "Jordan K.",
    createdAt: "2026-04-27T00:00:00Z",
    verified: false,
  },
];

const APHRODITE: Review[] = [
  {
    id: "preview-a1",
    rating: 5,
    title: "My signature now",
    body: "I wear Baccarat Rouge and this scratches the same itch. Warmer up close, and I get asked about it constantly.",
    author: "Elena M.",
    createdAt: "2026-06-18T00:00:00Z",
    verified: true,
  },
  {
    id: "preview-a2",
    rating: 5,
    title: "Wore it to a wedding",
    body: "Applied before the ceremony and touched up before dinner without leaving the table. Nobody saw me do it.",
    author: "Sofia L.",
    createdAt: "2026-06-05T00:00:00Z",
    verified: true,
  },
  {
    id: "preview-a3",
    rating: 5,
    title: "I love this scent",
    body: "Saffron and jasmine without the sharpness some ambers have. It settles into something soft after twenty minutes.",
    author: "Ruth A.",
    createdAt: "2026-05-24T00:00:00Z",
    verified: true,
  },
  {
    id: "preview-a4",
    rating: 4,
    title: "Takes a moment to warm up",
    body: "Straight off the stick it reads a little waxy, then the skin does its work and it blooms. Worth the wait.",
    author: "Nadia H.",
    createdAt: "2026-05-11T00:00:00Z",
    verified: true,
  },
  {
    id: "preview-a5",
    rating: 5,
    title: "No more broken bottles",
    body: "I have shattered two bottles in luggage. This just goes in the bag. The fact it smells this good is a bonus.",
    author: "Camille D.",
    createdAt: "2026-04-30T00:00:00Z",
    verified: true,
  },
];

const PREVIEW_REVIEWS: Record<ScentId, Review[]> = {
  poseidon: POSEIDON,
  aphrodite: APHRODITE,
};

/** Sample summary for local design work. Returns null in production. */
export function previewSummary(scent: ScentId): ReviewSummary | null {
  if (process.env.NODE_ENV === "production") return null;

  const reviews = PREVIEW_REVIEWS[scent];
  const average =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return {
    average: Math.round(average * 10) / 10,
    count: reviews.length,
    reviews,
  };
}
