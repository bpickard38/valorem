/*
 * Launch constants + scent catalog for the shop experience.
 */

import type { ScentId } from "@/lib/shopify";

export const PRICE = "$70";
export const PRICE_AMOUNT = 70; // numeric twin of PRICE for ad/event tracking
export const CURRENCY = "USD";

// TODO: CONFIRM BEFORE TRAFFIC — this is a placeholder, not a measured number.
// It is the only shipping representation the site makes now that the preorder
// framing is gone, so it needs to be true.
export const SHIP_WINDOW = "2–5 business days";
export const RETURN_WINDOW = "thirty days";

export const STICK_SIZE = "30 ml (1 oz)";
export const WEAR_ESTIMATE = "three months";

/* Canonical scent copy — the /deity cards and the product pages must read
 * identically, so both pull from here. */
export interface Scent {
  id: ScentId;
  name: string;
  lead: string;
  notes: string[];
  description: string;
}

export const SCENTS: Record<ScentId, Scent> = {
  aphrodite: {
    id: "aphrodite",
    name: "Aphrodite",
    lead: "Radiant. Addictive.",
    notes: ["Saffron", "Jasmine", "Amberwood", "Cedar"],
    description:
      "A luminous sweet amber in the spirit of the modern cult classics — saffron and jasmine glowing over crystalline amberwood. The scent of being remembered.",
  },
  poseidon: {
    id: "poseidon",
    name: "Poseidon",
    lead: "Fresh. Commanding.",
    notes: ["Bergamot", "Pepper", "Ambroxan", "Cedar"],
    description:
      "A crisp aquatic in the spirit of the great blue colognes — bergamot brightness over ambroxan depth. The scent of showing up sure of yourself.",
  },
};
