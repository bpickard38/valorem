<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# houseofvalorem.com

The VALOREM production app. Solid fragrance ($70 twist-up tins). Six scents in the Deity Collection, split into two houses: the Gods (Hades, Poseidon, Apollo) and the Goddesses (Artemis, Hera, Aphrodite).

Routes:

- `/` — clean, light marketing home (`src/app/page.tsx`, server component). Sections navigate by anchor id; product cards link to `/product/[scent]`. Header is `src/components/HomeHeader.tsx`, footer `HomeFooter.tsx`.
- `/collections` — where the "Collections" nav tab points. The Deity Collection title over two cards, Gods and Goddesses. Artwork is resolved from `public/collections/<id>.<ext>` by `src/lib/collectionImage.ts` (server-only, reads the filesystem) and falls back to an engraved placeholder when no file is there.
- `/collections/[collection]` — the three scents of one house, statically generated from `COLLECTIONS`.
- `/product/[scent]` — product detail pages, statically generated from the `SCENTS` catalog.

Conventions:

- **Prices come from Shopify, not from code.** `productPricing(productId)` in `src/lib/shopify.ts` returns the live price, the compare-at price, and the derived sale state; render it through `src/components/Price.tsx`. Set a compare-at above the price in the Shopify admin and the struck-through original, the sale figure and the "N% off" badge appear on their own — no code change starts a promotion. The `PRICE` / `DISCOVERY_PRICE` constants in `site.ts` are now **fallbacks only**: they cover a Shopify outage, and must be kept in step with the admin. Never render them on a page that can `await`.
- `src/lib/site.ts` remains the single source of truth for sizes, ship/return windows, all scent copy, and the `COLLECTIONS` split. Never hardcode those facts in pages. Adding a scent means: a handle in `SCENT_HANDLE` + `FALLBACK_PRICE` (shopify.ts), an entry in `SCENTS`, and its id in one collection's `scents` array — routing, the collection page and the product page all follow from those.
- **The Discovery Set was retired 2026-07-25.** The `/discovery` route, `DISCOVERY_SETS`, `DISCOVERY_HANDLE` and the `ProductId` union are gone; `ProductId` collapsed back to `ScentId`, so a scent id is now the only thing the cart accepts. `/discovery` 301s to `/collections` via `next.config.ts`. Sampling lives on the product page as the 5 ml size — do not reintroduce a separate sampling route or SKU.
- **Never claim "alcohol-free" or "no alcohol" anywhere.** The formula contains cetyl alcohol (a fatty alcohol emollient, not the ethanol in a spray), so the phrase is contradicted by the ingredient list and has a settled meaning in cosmetics. Use mechanism framing instead: "no denatured alcohol", "doesn't flash off like a spray", "wax base, not a solvent".
- **Labels describe the scent, never the wearer.** The brand is unisex. `Collection.audience` and `Scent.character` carry character words ("Fresh · Sharp · Smoky"); they held "Worn by men" / "Worn by women" until 2026-07-25 and must not go back.
- `VALUE_COMPARISON.otherSolids` in `site.ts` carries **unverified** competitor figures (0.2 oz, 5–10% load). They are flagged with a TODO and must not be quoted as fact or copied into new copy until re-checked.
- Scent notes are a **pyramid** (`Scent.pyramid`: top/middle/base, or `summary` for a single-accord scent like Artemis). `Scent.notes` is the flat list DERIVED from it by `makeScent()` — never hand-write it. It stays a `string[]` so the discovery sets can keep joining it directly. Render the pyramid with `noteRows()` and the card teaser with `noteTeaser()`.
- Notes and inspiration copy are the **real formulations**, supplied 2026-07-22. They replaced placeholder pyramids inferred from reference fragrances; treat `site.ts` as the source of truth and do not "improve" a note list without a formulation sheet.
- Pages reading Shopify set `export const revalidate = 3600`; the variant/price cache inside `shopify.ts` has its own 5-minute TTL. A price change therefore reaches the site within the hour, not instantly.
- Design system lives in `src/app/globals.css`: ivory/charcoal/gold/stone palette, Cormorant Garamond (serif display) + Inter (body), utilities `.label-engraved`, `.type-display`, `.type-heading`, `.texture-travertine`. Tailwind v4, CSS-first (no config file).
- Reveal animation is `src/components/FadeIn.tsx` (IntersectionObserver). No animation libraries.
- **Product photography is 4:5 everywhere** — gallery, slides, thumbnails, collection cards. Do not introduce another ratio for a product surface.
- `CUTOUT_PHOTOGRAPHY` in `site.ts` switches product frames between bleed shots (`object-cover`, no shadow) and background-free PNGs (`object-contain`, inset, CSS `.product-cutout` shadow). Currently **`true`** — all six scents have cutouts in Shopify. Consume it through `productImageFit` / `productImageFrame` rather than hardcoding a fit.
- **Inside a gallery, use `galleryImageMode(index)`, not the flat constants.** A product's image 1 is the cutout and images 2+ are lifestyle scenes that still carry their own backgrounds; `drop-shadow` on an opaque photo shadows its rectangle, so scenes must keep `object-cover` and no shadow. That per-index rule is the only thing standing between the gallery and a row of shadowed grey boxes.
- Collection artwork (`/collections` cards) is **4:3**, not 4:5 — landscape ingredient still-lifes, and a portrait frame strands half its height as air. It is also the site's **one bleed exception**: the card hardcodes `object-cover` + `overflow-hidden` instead of consuming `productImageFit` / `productImageFrame`, because these are opaque photographs with their own slate and travertine backgrounds and a `.product-cutout` shadow on an opaque image shadows its rectangle. Flipping `CUTOUT_PHOTOGRAPHY` therefore does not reach these two cards. Ratio and reasoning in `public/collections/README.md`; product cutouts remain 1600x2000 at 0.86 per `scripts/README-cutouts.md`.
- Commerce (`src/lib/shopify.ts`, `/api/checkout`, `/api/subscribe`) is canonical here; `../valorem-landing-archive` is the frozen landing-page archive.
- `scripts/` is legacy media tooling from the retired cinematic home; it is inert and not part of the build.
- Dev server runs on port 3001.
