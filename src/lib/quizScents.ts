/*
 * The six scents, shaped for the quiz's result card.
 *
 * WHY THIS IS ITS OWN MODULE. The quiz is a client component and cannot reach
 * Shopify, so everything it renders has to be fetched on a server and handed
 * across the boundary as plain data. That used to happen inline in the home
 * page, which had already fetched all six for its grid and could hand the quiz
 * a reshaped copy for free. The quiz moved to /quiz on 2026-08-05 and no
 * longer has a grid to borrow from, so the fetch lives here — one function,
 * called by one route, rather than the same twenty lines pasted into it.
 *
 * Server-only in practice: it imports shopify.ts. Do not import it from a
 * component with "use client" at the top.
 *
 * The twelve Shopify calls are cheaper than they look. Every image and variant
 * lookup is memoised behind the 5-minute cache in shopify.ts, and the route
 * that calls this sets `revalidate`, so a visitor pays for none of it.
 */

import type { QuizScent } from "@/components/ScentQuiz";
import { lowestPricing, productImage, productVariants } from "@/lib/shopify";
import { COLLECTIONS, SCENTS, noteTeaser, productTitle } from "@/lib/site";

export async function loadQuizScents(): Promise<QuizScent[]> {
  /* Read out of COLLECTIONS rather than listing six ids here, so the houses
   * and their order stay defined in exactly one place — move a scent between
   * houses in site.ts and this follows. The house NAME is carried through
   * because the result card prints it above the scent. */
  const houses = await Promise.all(
    [COLLECTIONS.gods, COLLECTIONS.goddesses].map(async (house) => ({
      name: house.name,
      /* Nested Promise.all so all twelve calls overlap rather than walking the
       * houses in series. */
      cards: await Promise.all(
        house.scents.map(async (id) => {
          const [image, variants] = await Promise.all([
            productImage(id),
            productVariants(id),
          ]);
          return {
            ...SCENTS[id],
            image,
            pricing: lowestPricing(variants),
          };
        }),
      ),
    })),
  );

  return houses.flatMap((house) =>
    house.cards.map((card) => ({
      id: card.id,
      title: productTitle(card),
      house: house.name,
      lead: card.lead,
      description: card.description,
      teaser: noteTeaser(card).join(", "),
      price: card.pricing.formatted,
      /* Narrowed to the two fields the card reads. The Shopify image object
       * carries more, and passing it whole would ship the extra across the
       * server/client boundary for nothing. */
      image: card.image
        ? { url: card.image.url, altText: card.image.altText ?? null }
        : null,
    })),
  );
}
