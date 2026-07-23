/*
 * Launch constants + scent catalog for the shop experience.
 */

import type { DiscoverySetId, ScentId } from "@/lib/shopify";

/* The two houses of the Deity Collection. A presentation grouping, not a
 * Shopify entity — there are no Shopify collections behind these, just the
 * six scent products sorted into two lists (see COLLECTIONS below). */
export type CollectionId = "gods" | "goddesses";

export function isCollectionId(value: unknown): value is CollectionId {
  return value === "gods" || value === "goddesses";
}

export const PRICE = "$70";
export const PRICE_AMOUNT = 70; // numeric twin of PRICE for ad/event tracking
export const CURRENCY = "USD";

/* ---- Discovery sets ---------------------------------------------------
 * The paid-traffic entry point. A $70 blind purchase is a hard first ask
 * from a brand nobody has heard of, so cold ads land here instead: three
 * scents to try, and a credit that makes the trial nearly free.
 *
 * Shipping is inside the price on purpose — a shipping line added at
 * checkout is the single biggest abandonment driver on a low-ticket order.
 */
/* Fallbacks only. Live prices come from Shopify via productPricing(); these
 * are what a Shopify outage falls back to. */
export const DISCOVERY_PRICE = "$25";
export const DISCOVERY_PRICE_AMOUNT = 25;

/* The credit is our promise, not a Shopify product attribute — it stays a
 * constant here and must match the discount rule configured in Shopify. */
export const DISCOVERY_CREDIT = "$15";
export const DISCOVERY_CREDIT_AMOUNT = 15;
/* The credit expires so it creates a reason to come back rather than sitting
 * unredeemed forever. Stated on the page because an undisclosed expiry on a
 * promised credit is the kind of thing customers are right to be annoyed by. */
export const DISCOVERY_CREDIT_WINDOW = "thirty days";

// TODO: CONFIRM BEFORE TRAFFIC — this is a placeholder, not a measured number.
// It is the only shipping representation the site makes now that the preorder
// framing is gone, so it needs to be true.
export const SHIP_WINDOW = "2–5 business days";
export const RETURN_WINDOW = "thirty days";

export const STICK_SIZE = "30 ml (1 oz)";
export const WEAR_ESTIMATE = "three months";

/* ---- Product photography ----------------------------------------------
 * ONE SWITCH, FLIP IT WHEN THE CUTOUTS ARE UPLOADED.
 *
 * false — every product photo in Shopify is a full-bleed shot with its own
 *   baked background. Frames crop to fill (object-cover) and draw no shadow,
 *   because a drop-shadow on an opaque photo shadows the photo's rectangle.
 *
 * true — every product photo is a background-free PNG, normalised to a 4:5
 *   canvas by scripts/normalize-product-images.mjs. Frames letterbox instead
 *   of cropping (object-contain), sit the bottle on the page's own ivory or
 *   stone, and the browser draws the shadow off the alpha channel.
 *
 * This is a switch and not a per-image check on purpose: the two modes must
 * never mix. One cutout among five bleed shots looks like a mistake, and a
 * bleed shot rendered in cutout mode letterboxes into grey bars. Flip it only
 * once ALL SIX scent products have cutouts in Shopify.
 *
 * Today's photos are a spread of aspect ratios (0.56 through 1.33), so cover
 * is currently cropping each one differently — which is exactly the problem
 * normalised cutouts fix. */
export const CUTOUT_PHOTOGRAPHY = true;

/* Applied to the <Image> itself. */
export const productImageFit = CUTOUT_PHOTOGRAPHY
  ? "object-contain product-cutout"
  : "object-cover";

/* Applied to the frame around it. Cutout mode must NOT clip overflow, so the
 * shadow can fall past the frame edge rather than being sliced off there; with
 * overflow visible the small inset is for breathing room only, which is why it
 * can stay tight. The normalised canvas already carries its own margin — see
 * CONTENT_HEIGHT in scripts/normalize-product-images.mjs — and stacking a
 * generous padding on top of that is what pushes a product away from its own
 * name. Bleed mode clips, because a cover crop overflows by definition. */
export const productImageFrame = CUTOUT_PHOTOGRAPHY
  ? "p-[3%]"
  : "overflow-hidden";

/* Thumbnails get the fit but never the shadow: at a fifth of the strip's width
 * a drop-shadow is a few muddy pixels, and the frame keeps its overflow clip so
 * the active ring stays a crisp rectangle. */
export const productThumbFit = CUTOUT_PHOTOGRAPHY
  ? "object-contain p-[6%]"
  : "object-cover";

/* Per-image treatment inside a product GALLERY, where the two kinds of photo
 * live side by side: image 1 is the background-free product cutout, and the
 * rest are lifestyle scenes that still have their own backgrounds.
 *
 * They must not be treated alike. A cutout wants contain + shadow. A lifestyle
 * photo is opaque, so `drop-shadow` would trace its RECTANGLE and render a
 * grey box with a shadow under it — and contain would letterbox a scene that
 * is meant to bleed. Scenes therefore keep cover in both modes.
 *
 * "Image 1 is the product shot" is the same convention productImage() already
 * relies on (see shopify.ts) and matches how the photos are ordered in the
 * Shopify admin. Reorder them there and this follows. */
export function galleryImageMode(index: number) {
  const cutout = CUTOUT_PHOTOGRAPHY && index === 0;
  return {
    frame: cutout ? "p-[3%]" : "overflow-hidden",
    image: cutout ? "object-contain product-cutout" : "object-cover",
    thumb: cutout ? "object-contain p-[6%]" : "object-cover",
  };
}

/* The return policy, written as a promise instead of a policy. Used verbatim
 * beside every buy button — keep the two halves separate so the styling can
 * lean on the first line. */
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

/* Registered legal entity. This is who the privacy policy and terms bind, and
 * who a customer would have a claim against — it is not a brand name and must
 * not be swapped for "VALOREM" in legal copy. */
export const LEGAL_ENTITY = "Valorem Fragrances LLC";

export const SOCIAL = {
  instagram: "https://www.instagram.com/houseofvalorem/",
  facebook: "https://www.facebook.com/profile.php?id=61592043447665",
  tiktok: "https://www.tiktok.com/@houseofvalorem",
} as const;

/* Canonical scent copy — the collection cards, discovery sets and product
 * pages must read identically, so they all pull from here.
 *
 * The note pyramid. Most scents are built as top / middle / base; Artemis is a
 * single accord and is described in one line instead, so `summary` renders in
 * place of the three tiers rather than alongside them. */
export interface NotePyramid {
  top?: string[];
  middle?: string[];
  base?: string[];
  summary?: string;
}

export interface Scent {
  id: ScentId;
  name: string;
  /* Sub-name printed under the product name where one exists — Artemis is
   * "Midnight Vanilla". Most scents have none. */
  subtitle?: string;
  lead: string;
  pyramid: NotePyramid;
  /* Flat note list. DERIVED from the pyramid by makeScent() below, never
   * hand-written: the discovery sets join it as a plain string[], and a
   * second hand-kept copy of the notes is exactly the drift this file exists
   * to prevent. */
  notes: string[];
  /* One line under the price — what it smells like, in a breath. */
  description: string;
  /* The long-form story, shown under the price on the product page. */
  inspiration: string;
  /* Who the scent is made for. Guidance, not a gate — the Gods / Goddesses
   * split below is the same guidance expressed as navigation, and this line
   * repeats it on the card and the product page. */
  wearer: string;
}

/* Fills in the derived `notes` list. A scent may pass its own — Artemis has no
 * pyramid to flatten — but nothing else should. */
type ScentSeed = Omit<Scent, "notes"> & { notes?: string[] };

function makeScent(seed: ScentSeed): Scent {
  const { top = [], middle = [], base = [] } = seed.pyramid;
  return { ...seed, notes: seed.notes ?? [...top, ...middle, ...base] };
}

/* Notes and inspiration copy supplied by Valorem 2026-07-22 — these are the
 * real formulations, and they replace the placeholder pyramids that had been
 * inferred from reference fragrances. Treat as the source of truth. */
export const SCENTS: Record<ScentId, Scent> = {
  aphrodite: makeScent({
    id: "aphrodite",
    name: "Aphrodite",
    lead: "Radiant. Addictive.",
    pyramid: {
      top: ["Vanilla Orchid"],
      middle: ["Jasmine Absolute", "Amberwood"],
      base: ["Oakmoss", "Opulent Wood"],
    },
    description: "Elegant, sensual, and unmistakably magnetic.",
    inspiration:
      "Named for the goddess of love and beauty, Aphrodite captures her magnetic, luxurious presence — a scent that lingers in a room the way she lingered in myth. Warm vanilla orchid opens into jasmine and amberwood, settling into a rich oakmoss and opulent wood base. Elegant, sensual, and unmistakably magnetic.",
    wearer: "Worn by women",
  }),
  poseidon: makeScent({
    id: "poseidon",
    name: "Poseidon",
    lead: "Fresh. Commanding.",
    pyramid: {
      top: ["Bergamot"],
      middle: ["Sichuan Pepper", "Lavender", "Star Anise", "Nutmeg"],
      base: ["Ambroxan", "Vanilla"],
    },
    description: "Fresh, forceful, and full of raw energy.",
    inspiration:
      "Poseidon commands the sea — untamed, powerful, and impossible to ignore. Zesty bergamot crashes into spiced Sichuan pepper, lavender, and star anise, before settling into a warm, ambroxan-driven base. Fresh, forceful, and full of raw energy.",
    wearer: "Worn by men",
  }),
  hades: makeScent({
    id: "hades",
    name: "Hades",
    lead: "Smoke. Certainty.",
    pyramid: {
      top: ["Bergamot", "Black Currant", "Apple", "Lemon", "Pink Pepper"],
      middle: ["Pineapple", "Patchouli", "Moroccan Jasmine"],
      base: ["Birch", "Musk", "Oak Moss", "Ambroxan", "Cedarwood"],
    },
    description: "Bold, layered, and sophisticated.",
    inspiration:
      "Hades ruled the underworld with a quiet, commanding intensity — depth beneath the surface. This scent opens sharp and fruity with bergamot, black currant, and pink pepper, moves into pineapple and jasmine, then descends into a smoky base of birch, oak moss, and cedarwood. Bold, layered, and sophisticated.",
    wearer: "Worn by men",
  }),
  apollo: makeScent({
    id: "apollo",
    name: "Apollo",
    lead: "Clear. Composed.",
    pyramid: {
      top: ["Grapefruit", "Lemon", "Mint Leaf"],
      middle: ["Ginger Zest", "Black Pepper", "Vetiver"],
      base: ["Blue Cedar", "Patchouli", "Musk"],
    },
    description: "Fresh, radiant, and effortlessly sharp.",
    inspiration:
      "Apollo, god of sun and light, brings clarity wherever he goes. Sparkling grapefruit, lemon, and mint open bright and clean, spiced with ginger and black pepper, before resolving into a grounded blue cedar and musk base. Fresh, radiant, and effortlessly sharp.",
    wearer: "Worn by men",
  }),
  artemis: makeScent({
    id: "artemis",
    name: "Artemis",
    subtitle: "Midnight Vanilla",
    lead: "Warm. Nocturnal.",
    /* One accord, not a pyramid — hence `summary` and the explicit note list
     * below, which names only what the summary itself names. */
    pyramid: { summary: "Cozy, warm vanilla with a soft amber base." },
    notes: ["Vanilla", "Amber"],
    description: "Cozy, warm vanilla with a soft amber base.",
    inspiration:
      "Artemis, goddess of the moon and the wild, moves through the dark with quiet confidence. This scent channels that stillness — a cozy, comforting vanilla wrapped in soft amber, like moonlight settling in for the night.",
    wearer: "Worn by women",
  }),
  hera: makeScent({
    id: "hera",
    name: "Hera",
    lead: "Floral. Unyielding.",
    pyramid: {
      top: ["Lavender", "Mandarin Orange", "Black Currant", "Petitgrain"],
      middle: ["Orange Blossom", "Jasmine"],
      base: ["Vanilla", "Cedarwood", "Ambergris", "Musk"],
    },
    description: "Strong, feminine, and regal.",
    inspiration:
      "Hera, queen of the gods, ruled with both authority and grace — the balance this scent is built on. Bright lavender and mandarin open with confidence, orange blossom and jasmine soften the edges, and a warm base of vanilla, cedarwood, and musk grounds it all. Strong, feminine, and regal.",
    wearer: "Worn by women",
  }),
};

/* The three notes shown as a teaser on a collection card. Top notes lead where
 * there is a pyramid, because they are what a customer smells first. */
export function noteTeaser(scent: Scent): string[] {
  return scent.notes.slice(0, 3);
}

/* The pyramid as label/value rows, ready to render. Returns a single unlabelled
 * row for a scent built as one accord. */
export function noteRows(
  pyramid: NotePyramid,
): { label: string | null; value: string }[] {
  if (pyramid.summary) return [{ label: null, value: pyramid.summary }];
  const rows: { label: string | null; value: string }[] = [];
  if (pyramid.top?.length) rows.push({ label: "Top", value: pyramid.top.join(", ") });
  if (pyramid.middle?.length)
    rows.push({ label: "Middle", value: pyramid.middle.join(", ") });
  if (pyramid.base?.length)
    rows.push({ label: "Base", value: pyramid.base.join(", ") });
  return rows;
}

/* ---- Collections ------------------------------------------------------
 * The Deity Collection splits into two houses. This is the only place the
 * split is defined: /collections, /collections/[collection], the product page
 * eyebrow and the "next scent" link all read it, so re-ordering a collection
 * or moving a scent between them is a one-line edit here.
 *
 * `scents` order is the display order on the collection page.
 *
 * `image` is the lead photograph for the collection card on /collections. Drop
 * a file at public/collections/<id>.<ext> and set the path here; until then the
 * card renders an engraved placeholder rather than a broken frame. */
export interface Collection {
  id: CollectionId;
  name: string;
  /* Who it's for, in the same voice as Scent.wearer. */
  audience: string;
  lead: string;
  description: string;
  scents: ScentId[];
  image: string | null;
}

export const COLLECTION_TITLE = "The Deity Collection";

/* Edition mark. Everything in the Deity Collection is Collection I, and the
 * tins themselves are stamped "POSEIDON I" — so the numeral is part of what a
 * product is called, not decoration on top of it. A second collection would
 * carry a different mark, which is why this is a constant and not typed into
 * each scent's name. */
export const EDITION = "I";

/* How a scent is TITLED — grid cards, product headings, page titles. Distinct
 * from `scent.name`, which is the bare name and stays that way in running prose
 * ("Or try Apollo", "Reviews for Apollo"), where the numeral reads as a stutter. */
export function productTitle(scent: Scent): string {
  return `${scent.name} ${EDITION}`;
}

export const COLLECTIONS: Record<CollectionId, Collection> = {
  gods: {
    id: "gods",
    name: "The Gods",
    audience: "Worn by men",
    lead: "Three ways to be remembered.",
    description:
      "Hades, Poseidon and Apollo — smoke, salt water and clean light. Three full-size sticks, each a different way of being the one people remember.",
    scents: ["hades", "poseidon", "apollo"],
    image: null,
  },
  goddesses: {
    id: "goddesses",
    name: "The Goddesses",
    audience: "Worn by women",
    lead: "Three ways to be remembered.",
    description:
      "Artemis, Hera and Aphrodite — midnight vanilla, sharpened florals and luminous amber. Three full-size sticks, each a different way of being the one people remember.",
    scents: ["artemis", "hera", "aphrodite"],
    image: null,
  },
};

/* Which collection a scent belongs to. Derived from COLLECTIONS rather than
 * stored on the Scent so the two can never disagree. */
export function collectionOf(scent: ScentId): Collection {
  const found = Object.values(COLLECTIONS).find((c) =>
    c.scents.includes(scent),
  );
  /* Every ScentId is in exactly one collection; the fallback only exists so
   * adding a scent to SCENTS and forgetting COLLECTIONS doesn't 500 the
   * product page. */
  return found ?? COLLECTIONS.gods;
}

/* A scent inside a discovery set.
 *
 * All six now have a full catalogue entry and a product page, so every member
 * sets `scent` and reads its copy from SCENTS — the set, the collection page
 * and the product page can never disagree. The inline `description` field
 * survives for a member that gets added to a set before it earns a SCENTS
 * entry. */
export interface DiscoveryMember {
  name: string;
  scent?: ScentId;
  /* Only read when `scent` is absent. */
  description?: string;
}

/* The copy to show for a member, wherever it lives. Keeps the page from
 * having to know which members are catalogued and which are not.
 *
 * `notes` is the three-note TEASER, not the full pyramid — a discovery set
 * lists three scents at once, and three complete note lists stacked in one
 * card is thirty-odd notes that nobody reads. The full pyramid is on the
 * product page, one tap away through `href`. */
export function memberCopy(member: DiscoveryMember): {
  name: string;
  inspiration: string;
  notes: string[];
  href: string | null;
} {
  if (member.scent) {
    const s = SCENTS[member.scent];
    return {
      name: s.name,
      inspiration: s.inspiration,
      notes: noteTeaser(s),
      href: `/product/${s.id}`,
    };
  }
  /* Uncatalogued member: its inline `description` is the only prose it has, so
   * that stands in for the inspiration. */
  return {
    name: member.name,
    inspiration: member.description ?? "",
    /* No notes until there is a formulation to quote. */
    notes: [],
    href: null,
  };
}

export interface DiscoverySet {
  id: DiscoverySetId;
  name: string;
  /* Who it's for, in the same voice as Scent.wearer — guidance, not a gate. */
  audience: string;
  lead: string;
  members: DiscoveryMember[];
}

export const DISCOVERY_SETS: Record<DiscoverySetId, DiscoverySet> = {
  "discovery-men": {
    id: "discovery-men",
    name: "The Men's Discovery Set",
    audience: "Worn by men",
    lead: "Three ways to be remembered.",
    members: [
      { name: "Hades", scent: "hades" },
      { name: "Poseidon", scent: "poseidon" },
      { name: "Apollo", scent: "apollo" },
    ],
  },
  "discovery-women": {
    id: "discovery-women",
    name: "The Women's Discovery Set",
    audience: "Worn by women",
    lead: "Three ways to be remembered.",
    members: [
      { name: "Artemis", scent: "artemis" },
      { name: "Hera", scent: "hera" },
      { name: "Aphrodite", scent: "aphrodite" },
    ],
  },
};
