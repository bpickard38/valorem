/*
 * Launch constants + scent catalog for the shop experience.
 */

import type { ScentId } from "@/lib/shopify";

export const PRICE = "$70";

// TODO: CONFIRM BEFORE TRAFFIC — this is a placeholder, not a measured number.
// It is the only shipping representation the site makes now that the preorder
// framing is gone, so it needs to be true.
export const SHIP_WINDOW = "2–5 business days";
export const RETURN_WINDOW = "thirty days";

export const STICK_SIZE = "30 ml (1 oz)";
export const WEAR_ESTIMATE = "three months";

export interface Scent {
  id: ScentId;
  name: string;
  epithet: string;
  notes: [string, string, string];
  description: string;
}

export const SCENTS: Record<ScentId, Scent> = {
  aphrodite: {
    id: "aphrodite",
    name: "Aphrodite",
    epithet: "Risen from the foam",
    notes: ["Rose", "Vanilla", "Musk"],
    description:
      "Warm rose over vanilla, held close by musk. A scent for the people close enough to matter.",
  },
  poseidon: {
    id: "poseidon",
    name: "Poseidon",
    epithet: "Lord of the deep",
    notes: ["Marine", "Musk", "Driftwood"],
    description:
      "Cold salt air over driftwood, grounded in musk. Carried, not sprayed.",
  },
};
