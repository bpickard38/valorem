/*
 * Every image path the app hardcodes, in one place.
 *
 * READ THIS BEFORE TRYING TO SWAP THE PHOTOGRAPHY.
 *
 * There are two kinds of image on this site and only one of them is here:
 *
 *   1. PRODUCT AND COLLECTION photography — the scent shots on product pages,
 *      the gallery, the lead image on a collection card. These live in
 *      SHOPIFY, not in this repo. They are fetched at request time by
 *      productImage() / productImages() from cdn.shopify.com, and nothing in
 *      the codebase names a file. Replacing them is an upload in the Shopify
 *      admin; no deploy, no code change. They cannot be centralized here
 *      because they are not referenced here.
 *
 *   2. BRAND AND MARKETING art — the hero, the logo lockup, the pegasus mark,
 *      the two collection-card group shots. These are static files under
 *      public/ that JSX points at directly. THOSE are what this module holds,
 *      so swapping the set is an edit to this file and nothing else.
 *
 * Every current file is AI-generated and is being replaced with real
 * photography of the actual product. See SHOOT_LIST below for what needs
 * shooting and at what ratio.
 */

export const IMAGES = {
  /* Homepage hero product shot — the branded stick, cap off, wax raised.
   *
   * A CUTOUT with a real alpha channel (verified: corner alpha 0, ~70% of the
   * canvas fully clear). It sits on the page's own ivory with object-contain
   * and the CSS drop-shadow from `.product-cutout`, exactly like the product
   * cards. A file with a background baked in would shadow as a grey rectangle
   * here — see CUTOUT_PHOTOGRAPHY in site.ts.
   *
   * 1600x1600, and that is fine: the 4:5 rule in AGENTS.md governs PRODUCT
   * SURFACES — gallery, slides, thumbnails, cards — where a mixed ratio makes
   * a grid look broken. The hero is marketing art in a frame of its own and
   * has no neighbour to line up with. Do not copy this exemption to a card.
   *
   * Replaced the full-bleed `hero-duo.png` lifestyle shot on 2026-07-28. That
   * image needed a dark scrim and white type over it; this one is the product
   * itself against the page, which is what a first-time visitor from a cold ad
   * actually needs to see.
   *
   * DERIVED, not the original. `public/Valorem_transparent.png` was keyed
   * against magenta and kept the key colour in its edge pixels — 5.5k of them,
   * including ~400 at near-full opacity. Invisible on magenta; a purple
   * outline the moment it sits on ivory. `scripts/defringe-cutout.mjs`
   * produced this file from it. Re-run that script on any future cutout that
   * shows a coloured rim, and keep the untouched source where it is. */
  hero: "/brand/hero-stick.png",

  /* The previous full-bleed lifestyle hero. Kept because it is still the only
   * wide brand image in the repo and the shoot list still calls for one — but
   * nothing renders it today. */
  heroLifestyle: "/shopify/hero-duo.png",

  /* The complete Canva logo lockup — pegasus, VALOREM, SOLID FRAGRANCE — as
   * one white image, for use on the dark hero only. Not photography; this one
   * is not being replaced. */
  logoLockupWhite: "/brand/valorem-lockup-white.png",

  /* The pegasus mark on its own. Used in the story section, the footer, and
   * as the engraved placeholder when a collection has no artwork yet. Not
   * photography; not being replaced. */
  pegasus: "/valorem-pegasus.png",
} as const;

/* Collection-card artwork is resolved from the filesystem by
 * lib/collectionImage.ts, which looks for public/collections/<id>.<ext> and
 * falls back to an engraved plate when there is no file. That indirection is
 * deliberate — dropping in gods.jpg is the whole swap — so the paths are not
 * repeated here. The files themselves are on the shoot list below. */

/* ---- What still needs shooting ----------------------------------------
 * Ratios are not suggestions: each frame is fixed in the layout so the page
 * holds its shape before the image loads, and a file at the wrong ratio gets
 * cropped to fit rather than fitting.
 *
 *   public/shopify/hero-duo.png        16:9 or wider, 2400px+ on the long
 *                                      edge. Two sticks. Centre stays calm —
 *                                      white type sits over the middle.
 *
 *   public/collections/gods.png        4:3, 1600x1200. Three-bottle group
 *   public/collections/goddesses.png   shot, landscape. NOT 4:5 — these are
 *                                      the one surface on the site that is
 *                                      not portrait.
 *
 * In SHOPIFY, per scent (six products), replacing the ChatGPTImage* files:
 *
 *   image 1        4:5, 1600x2000, background-free PNG with real alpha.
 *                  This is the cutout the gallery and every card renders with
 *                  a CSS drop-shadow — a white background baked into the file
 *                  will shadow as a grey rectangle. See CUTOUT_PHOTOGRAPHY in
 *                  site.ts and scripts/README-cutouts.md.
 *   images 2..n    4:5, lifestyle scenes, backgrounds intact. These keep
 *                  object-cover and get no shadow, so they must not be
 *                  cutouts.
 *
 * All six products must be swapped together. CUTOUT_PHOTOGRAPHY is one switch
 * for the whole catalogue, and one bleed shot among five cutouts renders as a
 * mistake. */
export const SHOOT_LIST = [
  { path: "public/shopify/hero-duo.png", ratio: "16:9+", note: "homepage hero, two sticks, calm centre" },
  { path: "public/collections/gods.png", ratio: "4:3", note: "three-bottle group shot" },
  { path: "public/collections/goddesses.png", ratio: "4:3", note: "three-bottle group shot" },
] as const;
