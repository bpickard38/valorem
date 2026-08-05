"use client";

import { useState } from "react";
import { RETURN_WINDOW, STICK_SIZE, WEAR_ESTIMATE } from "@/lib/site";

/* TODO — UNANSWERED, DO NOT WRITE COPY FOR THIS.
 *
 *   { q: "Will it stain my clothes?", a: ??? }
 *
 * The wash test has not been run. A hedge ("shouldn't stain", "unlikely to
 * mark") is worse than silence here — it reads as a claim to a customer and as
 * a liability to us, and it is the exact question a refund request quotes back.
 * Add the entry only once there is a tested answer, and surface it in the
 * homepage objection block at the same time. */

const items = [
  {
    /* The four-to-six-hour figure is TESTED — owner-confirmed 2026-08-03 that
     * he has timed it. Recorded here because the number was queried on the
     * grounds that lasting-power claims must be mechanistic unless measured,
     * and the answer is that this one is measured. It stays as a figure.
     *
     * Note the second sentence is doing the mechanistic work regardless: it
     * concedes that solids project less than sprays and names the trade rather
     * than selling around it. Keep that clause if the number ever changes. */
    q: "How long does it last?",
    a: "Four to six hours worn close to the skin. Solids project less than sprays and reapply in two seconds — that's the trade.",
  },
  {
    q: "How is this different from a spray?",
    a: "A spray is fragrance oil dissolved in alcohol. The alcohol atomizes the oil, carries it into the air and then evaporates off your skin — projection goes with it. Ours sets the same kind of oil in a wax base. There is no denatured alcohol to flash off, so the wax stays put at the pulse point and releases the oil with body heat as you warm up through the day.",
  },
  {
    q: "Will it melt in a hot car?",
    a: "No. We've left one in a parked car and it held its shape — the wax base is firm enough to sit in the heat and twist up normally afterwards.",
  },
  {
    q: "How much does one stick get me?",
    a: `${STICK_SIZE} — roughly ${WEAR_ESTIMATE} of daily use, depending on how many passes you take. One pass for the office, two before dinner.`,
  },
  {
    q: "When does it ship?",
    a: "You'll get tracking as soon as it's on its way.",
  },
  {
    /* Has to match GUARANTEE in site.ts. That block promises returns on
     * opened and used product, so the answer a customer looks up before
     * ordering cannot stop at "no questions asked" — an unqualified phrase
     * that still leaves them wondering whether wearing it voids anything. */
    q: "What if I don't like it?",
    a: `Returns accepted within ${RETURN_WINDOW} of delivery, including opened and used sticks. Wear it for a couple of weeks before you decide — that's what the window is for.`,
  },
  {
    /* "Most solids run 5–10%" was cut from this answer on 2026-08-03. It was
     * the same unsourced category figure as the retired
     * VALUE_COMPARISON.otherSolids, and research that day contradicted it:
     * premium solids describe their concentration qualitatively — Fulton &
     * Roark say "highly-concentrated", Duke Cannon "a high level of fragrance"
     * — and publish no percentage at all. So the honest version of the point is
     * about DISCLOSURE, which is checkable, rather than about their number,
     * which does not exist. Matches the "Fragrance load" framing that the
     * comparison table uses for the same reason.
     *
     * The base is named in full here now that IngredientList publishes the
     * complete list — "a beeswax and carnauba base" was true but omitted
     * candelilla, which is the second-largest wax in the formula. */
    q: "Is it really 20% fragrance oil?",
    a: "Yes. A carnauba, candelilla and beeswax base, skin-safe. No denatured alcohol — the wax holds the oil against your skin instead of flashing off the way a spray does. Most solid fragrances never publish a figure at all. Ours doesn't whisper.",
  },
];
/* "How big is it?" used to sit at the bottom of this list with the same two
 * constants and the same answer as "How much does one stick get me?" above.
 * Two entries answering one question makes the list look padded, so the size
 * question now lives in the phrasing a buyer actually uses. */

export default function Faq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="border-t border-charcoal/10">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className="border-b border-charcoal/10">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-baseline justify-between gap-6 py-6 text-left"
            >
              <span className="flex items-baseline gap-5">
                <span
                  aria-hidden="true"
                  className="font-serif text-xs tracking-[0.15em] text-gold"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-serif text-xl text-charcoal">
                  {item.q}
                </span>
              </span>
              <span
                aria-hidden="true"
                className="text-gold transition-transform duration-300"
                style={{ transform: isOpen ? "rotate(45deg)" : "none" }}
              >
                +
              </span>
            </button>
            <div
              className="grid transition-[grid-template-rows] duration-300 ease-out"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <p className="pb-7 pl-10 pr-10 text-sm leading-relaxed text-charcoal/70">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
