/*
 * Launch constants + scent catalog for the shop experience.
 */

import type { ScentId } from "@/lib/shopify";

/* The two houses of the Deity Collection. A presentation grouping, not a
 * Shopify entity — there are no Shopify collections behind these, just the
 * six scent products sorted into two lists (see COLLECTIONS below). */
export type CollectionId = "gods" | "goddesses";

export function isCollectionId(value: unknown): value is CollectionId {
  return value === "gods" || value === "goddesses";
}

/* House money style: "$70", not "$70.00".
 *
 * Lives here rather than in shopify.ts because shopify.ts already imports
 * this module for SIZES; putting it the other way round would make the two
 * files a runtime cycle. shopify.ts re-exports it, so `formatMoney` from
 * either module is the same function. */
export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}

export const PRICE = "$70";
export const PRICE_AMOUNT = 70; // numeric twin of PRICE for ad/event tracking
export const CURRENCY = "USD";

/* The Discovery Set was retired on 2026-07-25. It fragmented the funnel and
 * needed a second hand-poured SKU a solo operator can't sustain. Sampling now
 * lives on the product page as the 5 ml size — see SIZES — so the "you can't
 * smell a website" objection is answered where the buying decision is made,
 * one tap from the full size, instead of on a route of its own. */

// TODO: CONFIRM BEFORE TRAFFIC — this is a placeholder, not a measured number.
// It is the only shipping representation the site makes now that the preorder
// framing is gone, so it needs to be true.
export const SHIP_WINDOW = "2–5 business days";
export const RETURN_WINDOW = "thirty days";

/* ---- Shipping ---------------------------------------------------------
 * Free at $40 and over, flat $5 below it. The threshold sits deliberately
 * between the 5 ml ($16) and the 15 ml ($48): it puts a shipping line on the
 * sample alone and narrows the felt gap between the two, so trading up is
 * $32 for three times the wax rather than $32 plus a delivery charge.
 *
 * These MUST match the rates configured in the Shopify admin. Nothing here
 * charges anything — Shopify does — so a mismatch shows a promise at the
 * cart that checkout then breaks, which is worse than showing nothing. */
export const FREE_SHIPPING_THRESHOLD = 40;
export const FLAT_SHIPPING_RATE = 5;

export const SHIPPING_NOTE = `Free shipping on orders ${formatMoney(
  FREE_SHIPPING_THRESHOLD,
  CURRENCY,
)} and over. ${formatMoney(FLAT_SHIPPING_RATE, CURRENCY)} flat below that.`;

export const STICK_SIZE = "30 ml (1 oz)";
export const WEAR_ESTIMATE = "three months";

/* ---- Sizes ------------------------------------------------------------
 * Every scent is one Shopify product with three variants on a single option
 * named "Size". This table is the bridge between our ids and that option, and
 * the display order on the product page.
 *
 * `option` must match the Shopify option VALUE byte for byte — "30 ml", with
 * the space. A variant whose value isn't in this table is ignored, and a size
 * listed here with no matching Shopify variant simply doesn't render, which
 * is what lets the selector degrade to a single option rather than break.
 *
 * `gift` is a FULFILMENT PROMISE, not a cart mechanism. Nothing in Shopify
 * adds these samples to the order — they are packed by hand. Say "included"
 * plainly, but do not build UI that implies a line item the cart will show,
 * because it won't. */
/* The Shopify product option these values live under. One option, one name,
 * on all six products — change it in the admin and change it here. */
export const SIZE_OPTION = "Size";

export const SIZES = [
  {
    id: "30ml",
    option: "30 ml",
    label: "30 ml",
    name: "Full size",
    wear: `about ${WEAR_ESTIMATE} of daily wear`,
    gift: "Includes two free 5 ml samples of scents you haven't tried.",
  },
  {
    id: "15ml",
    option: "15 ml",
    label: "15 ml",
    name: "Travel",
    wear: "about six weeks of daily wear",
    gift: "Includes one free 5 ml sample of a scent you haven't tried.",
  },
  {
    id: "5ml",
    option: "5 ml",
    label: "5 ml",
    name: "Sample",
    wear: "about two weeks of daily wear",
    gift: null,
  },
] as const;

export type SizeId = (typeof SIZES)[number]["id"];

/* The flagship. Preselected on load — it is the product the brand is built
 * around, and opening on the cheapest option invites a shopper to anchor
 * there before they have read anything. */
export const DEFAULT_SIZE: SizeId = "30ml";

export function isSizeId(value: unknown): value is SizeId {
  return typeof value === "string" && SIZES.some((s) => s.id === value);
}

export function sizeById(id: SizeId) {
  /* Non-null: SIZES is the definition of SizeId, so a valid id always hits. */
  return SIZES.find((s) => s.id === id)!;
}

/* The entry size — what answers "you can't smell a website" now that the
 * Discovery Set is gone. The PRICE comes from Shopify via lowestPricing();
 * only the size label lives here. */
export const SAMPLE_SIZE = sizeById("5ml").label;

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
  /* TODO: UNVERIFIED — do not quote these figures as fact until they are
   * re-checked against a competitor's live catalogue.
   *
   * An earlier comment here claimed they were verified on 2026-07-21. That
   * claim has been withdrawn: the size and load numbers below may be
   * materially wrong, and they are the only numbers on the site making an
   * assertion about someone else's product.
   *
   * They stay in this constant, and nowhere else, so a correction is a
   * one-place edit rather than a hunt through JSX. Left unbranded — naming a
   * competitor turns a comparison into a claim about them. */
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
  /* The scent's character in three words — what it smells like, not who is
   * allowed to wear it. The brand is unisex, so nothing here describes a
   * gender; `Collection.audience` below carries the same rule for a house.
   *
   * Currently held but not rendered anywhere. Kept because it is the natural
   * home for a character line if a card ever wants one. */
  character: string;
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
    character: "Warm · Floral · Sensual",
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
    character: "Fresh · Spiced · Warm",
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
    character: "Fruity · Smoky · Deep",
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
    character: "Citrus · Fresh · Sharp",
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
    character: "Warm · Vanilla · Soft",
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
    character: "Floral · Bright · Warm",
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
  /* The house's character in three words, in the same voice as
   * Scent.character. Rendered as the eyebrow on the /collections cards.
   *
   * These described the WEARER until 2026-07-25 ("Worn by men" / "Worn by
   * women"), which argued against a unisex brand and halved each house's
   * audience on the one screen where a shopper picks a side. The two-house
   * structure and the deity names are unchanged — only the label is. Keep it
   * about the scent. */
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
    audience: "Fresh · Sharp · Smoky",
    lead: "Three ways to be remembered.",
    description:
      "Hades, Poseidon and Apollo — smoke, salt water and clean light. Three full-size sticks, each a different way of being the one people remember.",
    scents: ["hades", "poseidon", "apollo"],
    image: null,
  },
  goddesses: {
    id: "goddesses",
    name: "The Goddesses",
    audience: "Warm · Vanilla · Floral",
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
