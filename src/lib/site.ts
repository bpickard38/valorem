/*
 * Launch constants + scent catalog for the shop experience.
 * Price/ship date mirror ../valorem/src/lib/site.ts — lock before traffic.
 */

import type { ScentId } from "@/lib/shopify";

export const PRICE = "$70";

// TODO: real ship date before launch (kept in sync with main app)
export const SHIP_DATE = "September 15, 2026";
export const SHIP_DATE_SHORT = "September 15";

export const STICK_SIZE = "15 g";
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
