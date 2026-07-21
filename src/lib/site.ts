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

/* The return policy, written as a promise instead of a policy. Used verbatim
 * beside every buy button on /deity and the product pages — keep the two
 * halves separate so the styling can lean on the first line. */
export const GUARANTEE = {
  headline: "Wear it for 30 days.",
  sub: "Don't love it? Full refund.",
} as const;

/* The case for the $70, argued on size and concentration rather than price.
 * Every number here is a claim shown to customers, so it stays in one place
 * rather than inline in the JSX.
 *
 * FRAGRANCE_LOAD / STICK_SIZE are Valorem's own spec. The other two columns
 * are category figures kept as ranges and left unbranded on purpose — naming
 * a competitor turns a comparison into a claim about them.
 *
 * Sizes are all in oz so the columns compare directly; quoting ours in ml and
 * theirs in grams hides the difference the block exists to show. */
export const FRAGRANCE_LOAD = "20%";

export const VALUE_COMPARISON = {
  ours: {
    label: "Valorem",
    size: STICK_SIZE,
    load: `${FRAGRANCE_LOAD} fragrance load`,
    price: PRICE,
    note: `About ${WEAR_ESTIMATE} of daily wear`,
  },
  /* Verified 2026-07-21 against the leading premium solid brand's public
   * catalogue: their solid fragrances list at exactly $70.00 for 0.2 oz.
   * Left unbranded — naming them turns a comparison into a claim about a
   * competitor. Re-check before changing the price or size here. */
  otherSolids: {
    label: "Other premium solids",
    size: "0.2 oz",
    load: "5–10% load",
    price: "$70",
    note: "Gone in weeks",
  },
  designer: {
    label: "Designer perfume",
    size: "1.7 oz + glass",
    load: "15–20% load",
    price: "$225",
    note: "Stays on a shelf",
  },
} as const;

export const CONTACT_EMAIL = "houseofvalorem@gmail.com";

export const SOCIAL = {
  instagram: "https://www.instagram.com/houseofvalorem/",
  facebook: "https://www.facebook.com/profile.php?id=61592043447665",
  tiktok: "https://www.tiktok.com/@houseofvalorem",
} as const;

/* Canonical scent copy — the /deity cards and the product pages must read
 * identically, so both pull from here. */
export interface Scent {
  id: ScentId;
  name: string;
  lead: string;
  notes: string[];
  description: string;
  /* Plain-language translation of the notes — the "so what does it smell
   * like?" line, anchored to a fragrance the customer already knows. Sits
   * directly under the notes everywhere the notes appear. */
  comparison: string;
  /* Who the scent is made for. Guidance, not a gate: there are no separate
   * men's/women's collections — with a two-scent catalogue those would be
   * dead-end categories — so this line does the self-selection instead. */
  wearer: string;
}

export const SCENTS: Record<ScentId, Scent> = {
  aphrodite: {
    id: "aphrodite",
    name: "Aphrodite",
    lead: "Radiant. Addictive.",
    notes: ["Saffron", "Jasmine", "Amberwood", "Cedar"],
    description:
      "A luminous sweet amber in the spirit of the modern cult classics — saffron and jasmine glowing over crystalline amberwood. The scent of being remembered.",
    comparison: "If you love Baccarat Rouge 540, Aphrodite is your signature.",
    wearer: "Worn by women",
  },
  poseidon: {
    id: "poseidon",
    name: "Poseidon",
    lead: "Fresh. Commanding.",
    notes: ["Bergamot", "Pepper", "Ambroxan", "Cedar"],
    description:
      "A crisp aquatic in the spirit of the great blue colognes — bergamot brightness over ambroxan depth. The scent of showing up sure of yourself.",
    comparison: "If you wear Sauvage, Poseidon is your lane.",
    wearer: "Worn by men",
  },
};
