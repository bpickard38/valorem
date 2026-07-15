"use client";

import { useState } from "react";
import { SHIP_DATE, STICK_SIZE, WEAR_ESTIMATE } from "@/lib/site";

const items = [
  {
    q: "How long does it last?",
    a: "Four to six hours worn close to the skin. Solids project less than sprays and reapply in two seconds — that's the trade.",
  },
  {
    q: "When does it ship?",
    a: `${SHIP_DATE}. If we're late, we'll tell you why — and you can refund with one click.`,
  },
  {
    q: "What if I don't like it?",
    a: "Refund any time before shipping, no questions asked. After shipping, returns accepted within thirty days.",
  },
  {
    q: "Is it really 20% fragrance oil?",
    a: "Yes. A beeswax and carnauba base, alcohol-free, skin-safe. Most solids run 5–10%. Ours doesn't whisper.",
  },
  {
    q: "How big is it?",
    a: `${STICK_SIZE} — roughly ${WEAR_ESTIMATE} of daily wear.`,
  },
];

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
