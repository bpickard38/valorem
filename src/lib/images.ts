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
  /* Homepage hero — the stick held over an open palm, wax raised, mid-gesture.
   *
   * OPAQUE, not a cutout. This is the one thing to know before touching it:
   * the file is a bleed photograph with its own background, so it renders
   * `object-cover` in a framed box and gets NO `.product-cutout` shadow. That
   * class is a CSS drop-shadow, and a drop-shadow on an opaque photo shadows
   * the photo's rectangle — the same trap documented on galleryImageMode() in
   * site.ts. Swap in a cutout here and you must switch the frame back to
   * object-contain + `.product-cutout` in the same edit; the file and the
   * frame are one decision, not two.
   *
   * 941x1672 (~9:16), deliberately UNCROPPED. Nine-by-sixteen is far too tall
   * for a hero column — at the frame's max width it would stand ~800px and
   * push the copy beside it off a phone entirely — so page.tsx crops it to 4:5
   * with object-cover rather than the crop being baked in here. Keeping the
   * full frame in the file means the crop can be re-aimed with a Tailwind
   * `object-*` position instead of a re-export. The 4:5 the frame lands on is
   * the catalogue ratio from AGENTS.md, which the previous hero was formally
   * exempt from; matching it costs nothing and lines the hero up with the
   * product cards further down the page.
   *
   * Replaced the AI-generated cutout `brand/hero-stick.png` on 2026-08-04,
   * which in turn had replaced a dark full-bleed lifestyle shot on 2026-07-28.
   * This is the first hero that is a real photograph of the real product. The
   * old cutout file is still in public/brand/ and is now unreferenced. */
  hero: "/brand/hero-lifestyle.webp",

  /* The three How It Works steps, in step order — real photography of the
   * gesture each step describes, shot 2026-08-04.
   *
   * TWO CROPS OF THE SAME THREE SHOTS, and both sets have to be regenerated
   * together. This one is the landscape master: opaque bleed shots at the
   * source's native 1672x941 (16:9). Each is a full-width block ~1152 CSS px
   * across on desktop, which is why they are at native size rather than the
   * 1200px they were encoded at while they lived in a 315px column.
   *
   * Keyed by the step's `lead` in page.tsx — step 02 is "Swipe." and its file
   * is apply.webp, which is the gesture, not the label. Left as a literal type
   * rather than a Record<string, string> on purpose: `steps` in page.tsx types
   * its lead as `keyof typeof IMAGES.howItWorks`, so renaming a step without
   * renaming its key here is a build error instead of an undefined src that
   * only shows up as a broken image at runtime. */
  howItWorks: {
    "Twist.": "/how-it-works/twist.webp",
    "Swipe.": "/how-it-works/apply.webp",
    "Go.": "/how-it-works/go.webp",
  },

  /* The same three shots cropped 4:5 for phones — ART DIRECTION, not a resize.
   * A 16:9 frame at 390px wide is a 219px strip, which turns the thing being
   * demonstrated into a smear; these keep the full height of the source and
   * take a 753px window out of its width, so the tin stays large.
   *
   * The window is NOT centred. It is placed per shot in
   * scripts/../encode-steps (see the `centre` fractions there): the wrist in
   * apply and the pocket in go both sit right of middle, and a centred 45%-
   * width window would cut the gesture in half. Re-crop by moving that
   * fraction, not by nudging object-position — the whole point of a second
   * file is that the crop is decided once, on the actual photograph.
   *
   * page.tsx pairs these with the landscape set in a single <picture>, NOT as
   * two <Image>s hidden by breakpoint. That was tried first and measured:
   * `display:none` does not stop a fetch, and lazy loading does not save it
   * either, so every viewport pulled all six files. <picture> is the only
   * construct where the browser evaluates the media condition BEFORE it
   * requests anything, and it is why one crop now costs exactly one
   * download. */
  howItWorksTall: {
    "Twist.": "/how-it-works/twist-tall.webp",
    "Swipe.": "/how-it-works/apply-tall.webp",
    "Go.": "/how-it-works/go-tall.webp",
  },

  /* The complete Canva logo lockup — pegasus, VALOREM, SOLID FRAGRANCE — as
   * one white image, for use on the dark hero only. Not photography; this one
   * is not being replaced. */
  logoLockupWhite: "/brand/valorem-lockup-white.png",

  /* The pegasus mark on its own. Used in the story section, the footer, and
   * as the engraved placeholder when a collection has no artwork yet. Not
   * photography; not being replaced.
   *
   * Six call sites render this, all with explicit width/height, so its
   * intrinsic size is exported as PEGASUS_SIZE below rather than retyped.
   * Until 2026-07-29 the path here was a root-level `/valorem-pegasus.png`
   * that was a stale byte-for-byte copy of the pre-v2 mark; the six call
   * sites carried the OLD file's 572x589. Deleting the copy 404'd all six.
   * Keep the path and the size together. */
  pegasus: "/brand/pegasus-mark-v2.png",
} as const;

/* A /_next/image URL built by hand, for the one place that cannot use
 * next/image: art direction.
 *
 * <Image> renders a bare <img> and offers no way to attach a <source>, so a
 * layout that must swap CROPS (not merely sizes) at a breakpoint has to write
 * its own <picture>. Routing the srcset entries through /_next/image keeps
 * what matters — on-demand resizing, WebP/AVIF negotiation, the same cache —
 * and gives up only the component's automatic width bookkeeping.
 *
 * `width` MUST be one of Next's configured deviceSizes/imageSizes. next.config
 * sets neither, so the defaults apply: 640, 750, 828, 1080, 1200, 1920, 2048,
 * 3840 (plus 16..384 for imageSizes). Anything else the optimizer rejects with
 * a 400, so the widths at the call site are picked off that list rather than
 * from what the layout would ideally ask for.
 *
 * Requesting a width above the source's own resolution is safe — the optimizer
 * never upscales, it returns the file at native size. The matching `w`
 * descriptor is then nominally larger than the bytes delivered, which is
 * exactly what next/image's own srcset does.
 *
 * This hardcodes the DEFAULT loader's URL shape. Point next.config at a custom
 * or external loader and these stop resolving — with no build error and no
 * runtime error, the pictures just 404. */
export function optimizedImage(src: string, width: number, quality = 75) {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}

/* Intrinsic pixels of IMAGES.pegasus. next/image needs width+height to reserve
 * space before the file loads, and a wrong ratio here is a visible jump on
 * first paint — spread this instead of copying numbers. */
export const PEGASUS_SIZE = { width: 1037, height: 957 } as const;

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
/* The homepage hero and the three How It Works steps came off this list on
 * 2026-08-04 — they are real photography now. What is left is the two
 * collection group shots and the Shopify catalogue. */
export const SHOOT_LIST = [
  { path: "public/collections/gods.png", ratio: "4:3", note: "three-bottle group shot" },
  { path: "public/collections/goddesses.png", ratio: "4:3", note: "three-bottle group shot" },
] as const;
