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

/* ---- Wear time --------------------------------------------------------
 * How long ONE 30 ml stick lasts at one application a day. Not to be confused
 * with how long a single application lasts on skin, which is the FAQ's "four to
 * six hours". Two different claims, and a comparison table that mixes them up
 * states a durability figure where it means a longevity one — so keep any copy
 * that quotes both visibly explicit about which is which.
 *
 * Raised from "three months" to six-to-eight on 2026-08-03 at the owner's
 * direction, and confirmed verified by the owner the same day. It is a
 * substantive product representation rather than a copy tweak — it is the
 * figure the cost-per-day line divides into, and it is quoted on the home page,
 * /collections, the FAQ, every size in SIZES and all nine meta descriptions in
 * seo.ts — so if the basis for it ever changes, change it HERE and everything
 * follows. Nothing downstream hardcodes it any more.
 *
 * Three forms, because one string cannot serve every slot:
 *   WEAR_ESTIMATE       prose — "about six to eight months of daily wear"
 *   WEAR_ESTIMATE_SHORT badges and table cells, where the prose form wraps
 *   WEAR_DAYS_MIN       the arithmetic, for cost-per-day
 *
 * WEAR_DAYS_MIN is the SHORT end of the range on purpose. Cost-per-day gets
 * cheaper the longer the stick lasts, so dividing by eight months would quote
 * the most flattering number the range allows. Six months is the defensible
 * one, and it is the one PriceJustification renders. */
export const WEAR_ESTIMATE = "six to eight months";
export const WEAR_ESTIMATE_SHORT = "6–8 months";
export const WEAR_DAYS_MIN = 180;

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
  /* These two scale linearly off the 30 ml figure — half the wax is half the
   * wear, a sixth is a sixth. They read "six weeks" and "two weeks" when the
   * full size was three months; they moved with it, because a 15 ml that lasts
   * six weeks beside a 30 ml that lasts eight months is arithmetic a shopper
   * can do and we can't. Change WEAR_ESTIMATE and change all three. */
  {
    id: "15ml",
    option: "15 ml",
    label: "15 ml",
    name: "Travel",
    wear: "about three to four months of daily wear",
    gift: "Includes one free 5 ml sample of a scent you haven't tried.",
  },
  {
    id: "5ml",
    option: "5 ml",
    label: "5 ml",
    name: "Sample",
    wear: "about a month of daily wear",
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

/* The two free samples packed with a full size. The strongest thing in the
 * offer, and it appeared nowhere on the site — it lives in SIZES[].gift, which
 * only the product page's size selector was reading.
 *
 * Note what it is NOT: nothing in Shopify adds these to the cart, so this says
 * "ships with", never "add to bag". See the SIZES comment above.
 *
 * Lived as a private const in app/page.tsx until 2026-08-05. The quiz moved to
 * its own route and needed the same sentence, and two copies of an offer
 * promise is how the two drift into saying different things. */
export const SAMPLE_GIFT = `Every full size ships with two ${SAMPLE_SIZE} samples in scents you didn't pick. Find your second one on us.`;

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
 * lean on the first line.
 *
 * "Even used" is a deliberate, owner-confirmed commitment (2026-07-28), not
 * marketing softening: opened and worn product comes back. It is the single
 * strongest thing on the page for cold traffic, and it is also an operational
 * promise someone has to honour — do not strengthen or weaken it without the
 * owner saying so.
 *
 * The window is spelled out here rather than interpolated from RETURN_WINDOW
 * because it opens a sentence and needs the capital. RETURN_WINDOW is the same
 * thirty days; change one and change the other. */
export const GUARANTEE = {
  headline: "Wear it for two weeks.",
  sub: "If it isn't yours, send it back — even used. Thirty days from delivery.",
} as const;

/* ---- What $70 buys ----------------------------------------------------
 * The case for the price, in Valorem's OWN specs. Every number here is a claim
 * shown to customers, so it stays in one place rather than inline in the JSX.
 *
 * THIS USED TO BE A THREE-COLUMN COMPARISON and both competitor columns were
 * deleted on 2026-08-03. Recording why, because "add the competitor column
 * back" is the obvious-looking improvement and it is a trap:
 *
 *   "Other premium solids" (0.2 oz, 5–10% load, $70, "gone in weeks") — the
 *     figures were flagged unverified, and research on 2026-08-03 actively
 *     contradicted them. The category runs 0.2 oz (Fulton & Roark) to 1.5 oz
 *     (Duke Cannon, cheaper per ounce and self-described as "a high level of
 *     fragrance"). Valorem's 30 ml is neither the biggest nor the best value
 *     per ounce, so "a fifth of the wax at half the concentration" was false.
 *
 *   "Designer perfume" (1.7 oz + glass, 15–20%, $225) — the load and size were
 *     fine; the price was not. A 1.7 oz designer EDP is $45–$125 mainstream and
 *     $140–$220 at prestige houses, so $225 labelled "Designer perfume"
 *     overstated it, in the direction that flattered us.
 *
 * The deeper problem is that this block's own thesis — size and concentration —
 * LOSES against a spray. A 50 ml EDP at 17.5% carries about 8.75 ml of
 * fragrance oil; a 30 ml Valorem stick at 20% carries 6 ml. More oil in the
 * bottle. The reason to buy Valorem was never volume of oil, it is that the
 * wax keeps the oil on skin instead of evaporating it into a room — and a
 * spec-versus-spec table is the one format that cannot say so.
 *
 * So the comparative argument moved to COMPARISON / ComparisonTable, where it
 * is made on MECHANISM and every row is verifiable. This block now does the one
 * job it can do honestly: state what the money buys. If a competitor column
 * ever comes back, it needs sourced figures AND a metric Valorem actually wins.
 *
 * `price` is passed in live from Shopify by the component; PRICE is only a
 * fallback.
 *
 * VALUE_SPECS itself is declared just below FRAGRANCE_LOAD, because it
 * interpolates it — module-level consts are not hoisted, so it cannot sit above
 * the thing it reads. */

/* 20%, confirmed by the owner 2026-08-03. Batch 6 is mixed to this and Batch 6
 * is the only batch that ships — Batch 5 (16%) never reaches a customer, so
 * there is no window in which the site overstates what is in the tin.
 *
 * Don't let this constant drift from the shipping formula: it is a numeric
 * product specification, not a soft marketing adjective, and it is the axis the
 * whole $70 argument turns on. It is also load-bearing for the ingredient
 * ORDER below — see the note on FULL_INGREDIENTS, where 20% is what puts
 * fragrance oil at the top of the list. */
export const FRAGRANCE_LOAD = "20%";

/* The specs the "What $70 actually buys" block renders. See the long note
 * above for why there is no competitor column beside them. */
export const VALUE_SPECS = [
  { label: "Size", value: STICK_SIZE },
  { label: "Concentration", value: `${FRAGRANCE_LOAD} fragrance load` },
  { label: "Daily wear", value: `About ${WEAR_ESTIMATE}` },
] as const;


/* ---- Ingredients ------------------------------------------------------
 * Derived from the Batch 5 (50 g) formulation sheet supplied by the owner
 * 2026-08-03, carried forward to the Batch 6 fragrance load — Batch 6 at 20%
 * is what ships. This replaces guesswork: before it, the only ingredient
 * statement on the site was the FAQ's "a beeswax and carnauba base", which is
 * true but partial.
 *
 * TODO — GET THE BATCH 6 SHEET. Only the fragrance figure is known for Batch 6;
 * the other nine ingredients are assumed to hold their Batch 5 proportions.
 * That assumption is safe for the plain-language groups below (the same
 * ingredients are present either way) and it is safe for the one ordering
 * change 20% forces, which is documented on FULL_INGREDIENTS. It is NOT safe
 * for anything finer than that. Send the sheet and this becomes fact.
 *
 * WHAT IS DELIBERATELY NOT HERE: the per-ingredient weights. The sheet gives
 * grams for all ten; publishing them would hand over the formula, and no
 * regulation asks for them — cosmetic labelling wants ingredients in
 * DESCENDING ORDER OF WEIGHT, which `FULL_INGREDIENTS` is, without the
 * numbers. The grams stay in the owner's sheet, not in a public bundle.
 *
 * The three groups below are the plain-language version for a marketing
 * surface. Each names only ingredients that are actually in the sheet.
 *
 * TWO RULES THIS BLOCK EXISTS TO KEEP (both settled, both non-negotiable):
 *
 *   1. Never "alcohol-free" or "no alcohol". Cetyl alcohol is the SECOND
 *      largest non-wax component of this formula at 5.5 g. It is a fatty
 *      alcohol emollient, not the ethanol in a spray, but the phrase has a
 *      settled meaning in cosmetics and the ingredient list contradicts it
 *      outright. `alcoholNote` states the distinction rather than dodging it,
 *      so the claim we DO make survives someone reading the full list.
 *
 *   2. Never "all natural". Retired, unsubstantiated — and this formula is
 *      half esters and synthetics by weight (C12-15 alkyl benzoate, IPM, CCT,
 *      fragrance oil), so it would be false as well as unsubstantiated.
 *
 * TODO — a compliant retail INCI panel also needs the fragrance oil's own
 * allergen declarations (linalool, limonene, and so on), which come from the
 * fragrance house per scent and are not in this sheet. FULL_INGREDIENTS is the
 * base formula, which is what a web page needs; do not print it on a tin and
 * call it a label. */
export const INGREDIENTS = [
  {
    title: "A wax base, not a solvent",
    /* Carnauba 9 g, candelilla 4.5 g, beeswax 2 g — 15.5 g of the 50 g batch,
     * the largest single group and the reason the format works at all. */
    body:
      "Carnauba, candelilla and beeswax. The wax holds fragrance oil against warm skin and releases it through the day, instead of flashing off the way a spray's solvent does.",
  },
  {
    title: "Skin-conditioning oils",
    body:
      "Shea butter and jojoba, with lighter esters that keep the pass smooth. It should glide on and sink in — conditioning, not greasy, and never tacky.",
  },
  {
    title: "No denatured alcohol",
    body:
      "Nothing in the stick evaporates to carry the scent into the air. That is why it sits at the pulse point instead of filling a room, and why it can be reapplied without the moment.",
  },
] as const;

/* The honesty footnote under the third card. Without it, "no denatured
 * alcohol" three lines above a list containing "cetyl alcohol" reads as a
 * contradiction — which is exactly the reading the rule in AGENTS.md is there
 * to prevent. */
/* Note the last sentence does NOT contain the forbidden phrase, even to deny
 * it. The first draft ended "we don't claim this product is alcohol-free",
 * which is honest in full and dangerous in fragments: it puts the phrase on
 * the page in the product's own voice, where a skimming reader, a screenshot
 * or a scraper lifting one line finds Valorem apparently claiming exactly what
 * AGENTS.md forbids. Saying the claim is NARROW makes the same point and
 * survives being quoted out of context. */
export const ALCOHOL_NOTE =
  "Cetyl alcohol is in the formula as a fatty alcohol that firms the wax and conditions skin. It is not the denatured alcohol a spray uses as a solvent, and it does not evaporate. Our claim is the narrow one: no denatured alcohol.";

/* Descending order of weight — the order a cosmetic ingredient declaration is
 * required to use, which makes this list's SEQUENCE a claim and not a styling
 * choice. Plain names with the INCI name after, so a curious shopper and a
 * cautious one both get what they came for.
 *
 * FRAGRANCE OIL LEADS, and it only leads because the load went to 20%.
 *
 * At Batch 5's 16% (8 g of 50 g) it sat second, behind carnauba at 9 g / 18%.
 * Raising it to 20% puts it above that 18% and therefore at the top of the
 * list. Worth spelling out because it is the one place the load percentage
 * silently rewrites something other than itself — bump the load and forget this
 * list, and the site publishes an ingredient declaration in the wrong order.
 *
 * The move holds under either way of hitting 20%: scaling the other nine down
 * inside a 50 g batch gives 10 g of oil against 8.57 g of carnauba, and adding
 * oil to the existing 42 g base gives 10.5 g against 9 g. Both put fragrance
 * first, which is why this reorder does not wait on the Batch 6 sheet.
 *
 * Everything BELOW the first line keeps its Batch 5 sequence, which assumes the
 * other nine scale together. Confirm against the Batch 6 sheet when it exists —
 * the four ingredients bunched at 3.8–5.7 g are close enough that a small
 * change to any one of them could reshuffle them. */
export const FULL_INGREDIENTS = [
  { name: "Fragrance oil", inci: "Parfum" },
  { name: "Carnauba wax", inci: "Copernicia Cerifera Cera" },
  { name: "C12-15 alkyl benzoate", inci: null },
  { name: "Cetyl alcohol", inci: null },
  { name: "Candelilla wax", inci: "Euphorbia Cerifera Cera" },
  { name: "Jojoba oil", inci: "Simmondsia Chinensis Seed Oil" },
  { name: "Caprylic/capric triglyceride", inci: null },
  { name: "Isopropyl myristate", inci: null },
  { name: "Shea butter", inci: "Butyrospermum Parkii Butter" },
  { name: "Beeswax", inci: "Cera Alba" },
] as const;

/* ---- Comparison table -------------------------------------------------
 * Valorem against A SPRAY, row by row, with a hard verification gate.
 *
 * The second column is a FORMAT, not a company and not even a category. That
 * is the whole reason this table can be five rows long instead of two, and it
 * is worth understanding why before anyone "improves" it back.
 *
 * WHY NOT OTHER SOLIDS — the first version of this table tried, and the
 * category will not support it. Findings from 2026-08-03, recorded here so
 * nobody spends the afternoon rediscovering them:
 *
 *   - Fulton & Roark: 0.2 oz metal tin, magnetic sliding lid, applied with
 *     fingers, $42–$70 depending on retailer. Refillable. They publicly claim
 *     FOUR MONTHS of daily use per tin.
 *   - Duke Cannon: 1.5 oz tins, far cheaper per ounce, and they describe
 *     themselves as "a high level of fragrance".
 *   - Others sit at 0.5 oz and 1 oz.
 *
 * So the category runs 0.2 oz to 1.5 oz, and 0.2 oz is ONE BRAND'S number, not
 * the norm. Valorem's 30 ml is neither the largest nor the best value per
 * ounce in the category. That killed three rows outright — size, price per
 * volume, and wear time — and the wear-time row was the dangerous one, because
 * F&R's published four months beats the three months this site claimed until
 * today and matches the low end of the six-to-eight it claims now.
 *
 * That research is also what retired the old VALUE_COMPARISON.otherSolids
 * column ("a fifth of the wax at half the concentration", 0.2 oz, 5–10%): it was
 * contradicted, not merely unverified, and ValueComparison was rendering it on
 * every product page. Both competitor columns are gone — see the note on
 * VALUE_SPECS above.
 *
 * WHY A SPRAY WORKS — every row below is MECHANICAL. It follows from what a
 * wax base does and what an alcohol solvent does, it is already argued in the
 * "Why Solid" section of the home page, and no part of it depends on another
 * company's spec sheet, price, or packaging staying still. There is nothing
 * here to go stale and nobody to be wrong about.
 *
 * TWO ROWS THAT STILL DON'T SHIP, for opposite reasons:
 *
 *   Fragrance load — CUT when the column became a spray, and this one is
 *     counter-intuitive: sprays DO disclose concentration. Eau de toilette and
 *     eau de parfum ARE concentration classes, and the retired designer column
 *     in this very file put designer perfume at 15–20%. So a 20% solid is not
 *     above a good EDP, and "rarely published" is simply false of sprays. The
 *     row was honest against other solids and became false against a spray.
 *
 *   Longevity per application — four to six hours is our own published figure
 *     and it is real, but sprays generally last LONGER on skin. Putting our
 *     hours beside a cross would invert the truth. The FAQ handles this the
 *     right way, by naming it as the trade the format asks you to make.
 *
 * The gate stays: `verified` is not documentation, ComparisonTable filters on
 * it, so an unverified row cannot reach a page even if someone writes
 * convincing copy into it. `minRows` keeps a one-row "table" from shipping as
 * a table when it should be a sentence. */
export const COMPARISON_MIN_ROWS = 2;

export interface ComparisonRow {
  label: string;
  /* `has` means FAVOURABLE, not "possesses" — it decides which glyph renders,
   * and the favourable side is not always the side that has something. On the
   * denatured-alcohol row the good answer is "none", so ours is `has: true`
   * with the value "None". Read it as "this column wins this row". */
  ours: { value: string; has: boolean };
  theirs: { value: string; has: boolean };
  /* False keeps the row off every page. The note says what would flip it —
   * write the evidence, not an intention. */
  verified: boolean;
  note: string;
}

/* Cells stay SHORT because they are table cells. At 375px each value column is
 * about 120px wide (see the min-width note in ComparisonTable), so a cell of
 * more than four or five words stops being a comparison and becomes a
 * paragraph wearing a tick. */
export const COMPARISON = {
  ours: "Valorem",
  theirs: "A spray",
  rows: [
    {
      label: "Where it lands",
      ours: { value: "On the pulse point", has: true },
      theirs: { value: "In the room around you", has: false },
      verified: true,
      note:
        "Mechanical, and already the first card in the home page's 'Why Solid' section. A spray atomizes the oil and carries it into the air; a wax base holds it against warm skin. This is what an atomizer is FOR, so it needs no competitor research.",
    },
    {
      label: "Dose",
      ours: { value: "One swipe, or two", has: true },
      theirs: { value: "One press, no undo", has: false },
      verified: true,
      note:
        "Second 'Why Solid' card, unchanged in substance. A spray dispenses a fixed atomized amount you cannot take back; a stick is dosed by how many passes you take. Both halves are statements about the dispenser, not about any brand's product.",
    },
    {
      label: "Reapplying at work",
      ours: { value: "Three seconds, unnoticed", has: true },
      theirs: { value: "Audible, and visible", has: false },
      verified: true,
      note:
        "Third 'Why Solid' card. The claim is about the ACT — a pump makes a noise and a raised bottle is visible, a swipe is neither. Phrased as audible/visible rather than the page's 'everyone knows' because a table cell has no room to carry a joke, and the mechanism is the checkable part.",
    },
    {
      label: "Denatured alcohol",
      ours: { value: "None", has: true },
      theirs: { value: "About 80% alcohol", has: false },
      verified: true,
      note:
        "The figure is the owner's, hedged to 'about' on purpose. It is sound for an eau de parfum and it is arithmetic a shopper can follow: EDP is a 15–20% concentration class, so the other 80–85% is the carrier, and 'Alcohol Denat.' is literally the first ingredient on a designer fragrance label. The hedge covers the two ways a flat 80% would be wrong — an EDT at 5–15% oil is more like 85–90% carrier, and the carrier is not purely alcohol (there is water in there too). 'About' costs nothing rhetorically and makes the row survive someone checking it. Ours says 'None' of DENATURED alcohol specifically: cetyl alcohol IS in our formula, ALCOHOL_NOTE discloses it a section below, and this row must never be read as 'contains no alcohol'.",
    },
    {
      label: "Flying with it",
      ours: { value: "Not a liquid", has: true },
      theirs: { value: "Liquid", has: false },
      verified: true,
      note:
        "Now just the physical fact, which is the strongest version of this row. It replaced 'Counts in your 3-1-1 bag' — true, but a regulatory detail that dates (the rule has a number in its name and the TSA has been changing it) and that reads as fine print. 'Liquid' vs 'Not a liquid' is a property of the two products, needs no citation, and lets the reader draw the airport conclusion themselves. Still deliberately NOT 'you can't fly with a spray': you can, a small one fits the allowance.",
    },
  ] as ComparisonRow[],
} as const;

/* ---- Price badge ------------------------------------------------------
 * Urgency beside the price. Currently OFF, at the owner's decision
 * 2026-08-03 ("neither for now"), so PriceBadge renders nothing.
 *
 * Two modes, and the difference between them is the whole reason this is a
 * typed config and not a string:
 *
 * "founding" — a forward promise. "Founding price, increases to $X on DATE."
 *   Honest, because the reference price is in the FUTURE: nothing is being
 *   claimed about what anyone paid before. It only stays honest if the
 *   increase actually happens, so `increasesOn` is a commitment someone has
 *   to keep, not a countdown to reset.
 *
 * "compare-at" — a genuine markdown, read from Shopify's compare-at price.
 *   Note what this mode CANNOT do: invent a "was" figure. It has no field for
 *   one. It renders only what Shopify reports, which means a struck-through
 *   price requires a real compare-at set in the admin — and Price.tsx already
 *   renders that natively, so this mode is a label beside it, never a source
 *   of truth for it.
 *
 * WHY THERE IS NO THIRD MODE: the original request was a struck-through
 * $20/$60/$120 against the live $16/$48/$70. Valorem has only ever sold at
 * $16/$48/$70, set 2026-07-25, so those higher figures describe no sale that
 * ever happened. A fabricated reference price is a deceptive-pricing problem
 * (FTC guidance on former-price comparisons; Meta's ad policy on false
 * discounts) before it is a taste problem, and the machinery for it is
 * deliberately absent from this file so that turning it on would require
 * writing it from scratch. */
export type PriceBadgeConfig =
  | { mode: "founding"; increasesTo: string; increasesOn: string }
  | { mode: "compare-at"; label: string }
  | null;

export const PRICE_BADGE: PriceBadgeConfig = null;

/* ---- Founder ----------------------------------------------------------
 * The person behind the brand, on the record. Added 2026-08-03.
 *
 * WHY THIS EXISTS: the "Our Story" section was brand mythology — Latin
 * etymology and a description of the collection — with no human being in it.
 * With almost no order history and no reviews yet, an anonymous luxury brand
 * reads as a template storefront, and a named solo founder is the cheapest
 * legitimacy the page can buy. It is also the only kind of proof here that
 * doesn't need a customer to exist first.
 *
 * EVERY WORD BELOW IS HIS, tightened but not embellished. Supplied 2026-08-03
 * in answer to "why did you start it": he wanted a travel cologne, he wanted to
 * smell good all day, he is busy, and he needed something that lives in a
 * pocket or a car. Nothing about a heritage, a lab, a mentor or a childhood has
 * been added, because none of it was said. Do not "warm this up" — a founder
 * story is the one piece of copy on the site where invention is
 * indistinguishable from lying about a real person.
 *
 * `craft` is derived rather than quoted: "hand-poured" is how AGENTS.md already
 * describes the operation (a "hand-poured SKU" a "solo operator" can't scale),
 * and the formulation sheets are numbered 50 g batches, which is what "small
 * batches" means literally. TODO — confirm the wording anyway. It is a
 * manufacturing claim, and it is the one line here not taken from his mouth. */
export const FOUNDER = {
  name: "Brayden",
  role: "Founder",
  /* The display line. His reason, reduced to the sentence it turns on. */
  hook: "I wanted a cologne I could carry.",
  body:
    "I'm busy. It needed to live in my pocket or my car, and it needed to still be there at the end of the day. That's the whole reason Valorem exists — from the Latin for worth.",
  craft: "Hand-poured in small batches.",
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
  /* The scent's character in three words — what it smells like. Stays that
   * way: the audience split introduced on 2026-08-05 lives at the HOUSE level,
   * on `Collection.audience`, and does not propagate down here. A single scent
   * describes itself; the house says who it is for. See AGENTS.md.
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
  /* Who the house is FOR, and what the format is called for them. Rendered as
   * the eyebrow on the /collections cards and the home grid.
   *
   * History, because this has moved twice: it described the wearer until
   * 2026-07-25, was replaced with scent-character words ("Fresh · Sharp ·
   * Smoky") on the argument that a wearer label halves each house's reach on
   * the one screen where a shopper picks a side, and went back to describing
   * the wearer on 2026-08-05 as a deliberate positioning call. See AGENTS.md.
   * That cost is real and still applies; it is being accepted, not overlooked.
   *
   * "Cologne" and "perfume" here are not decoration — they match the titles in
   * seo.ts, which have split the two houses that way all along (Gods are
   * "Solid Cologne", Goddesses "Solid Perfume"). Change one and change both,
   * or the page and its own <title> disagree. */
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
    audience: "Solid Cologne · For Men",
    lead: "Three ways to be remembered.",
    description:
      "Hades, Poseidon and Apollo — smoke, salt water and clean light. Three full-size sticks, each a different way of being the one people remember.",
    scents: ["hades", "poseidon", "apollo"],
    image: null,
  },
  goddesses: {
    id: "goddesses",
    name: "The Goddesses",
    audience: "Solid Perfume · For Women",
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
