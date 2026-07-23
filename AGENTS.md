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
- `src/lib/site.ts` remains the single source of truth for sizes, ship/return windows, the discovery credit, all scent copy, and the `COLLECTIONS` split. Never hardcode those facts in pages. Adding a scent means: a handle in `SCENT_HANDLE` + `FALLBACK_PRICE` (shopify.ts), an entry in `SCENTS`, and its id in one collection's `scents` array — routing, the discovery sets, the collection page and the product page all follow from those.
- Scent notes are a **pyramid** (`Scent.pyramid`: top/middle/base, or `summary` for a single-accord scent like Artemis). `Scent.notes` is the flat list DERIVED from it by `makeScent()` — never hand-write it. It stays a `string[]` so the discovery sets can keep joining it directly. Render the pyramid with `noteRows()` and the card teaser with `noteTeaser()`.
- Notes and inspiration copy are the **real formulations**, supplied 2026-07-22. They replaced placeholder pyramids inferred from reference fragrances; treat `site.ts` as the source of truth and do not "improve" a note list without a formulation sheet.
- Pages reading Shopify set `export const revalidate = 3600`; the variant/price cache inside `shopify.ts` has its own 5-minute TTL. A price change therefore reaches the site within the hour, not instantly.
- Design system lives in `src/app/globals.css`: ivory/charcoal/gold/stone palette, Cormorant Garamond (serif display) + Inter (body), utilities `.label-engraved`, `.type-display`, `.type-heading`, `.texture-travertine`. Tailwind v4, CSS-first (no config file).
- Reveal animation is `src/components/FadeIn.tsx` (IntersectionObserver). No animation libraries.
- **Product photography is 4:5 everywhere** — gallery, slides, thumbnails, collection cards. Do not introduce another ratio for a product surface.
- `CUTOUT_PHOTOGRAPHY` in `site.ts` switches product frames between bleed shots (`object-cover`, no shadow) and background-free PNGs (`object-contain`, inset, CSS `.product-cutout` shadow). Currently **`true`** — all six scents have cutouts in Shopify. Consume it through `productImageFit` / `productImageFrame` rather than hardcoding a fit.
- **Inside a gallery, use `galleryImageMode(index)`, not the flat constants.** A product's image 1 is the cutout and images 2+ are lifestyle scenes that still carry their own backgrounds; `drop-shadow` on an opaque photo shadows its rectangle, so scenes must keep `object-cover` and no shadow. That per-index rule is the only thing standing between the gallery and a row of shadowed grey boxes.
- Collection artwork (`/collections` cards) is **4:3**, not 4:5 — they are three-bottle group shots, and a portrait frame strands half its height as air. Normalised to 1600x1200 at 0.95 fill; product cutouts are 1600x2000 at 0.86. Full workflow in `scripts/README-cutouts.md`.
- Commerce (`src/lib/shopify.ts`, `/api/checkout`, `/api/subscribe`) is canonical here; `../valorem-landing-archive` is the frozen landing-page archive.
- `scripts/` is legacy media tooling from the retired cinematic home; it is inert and not part of the build.
- Dev server runs on port 3001.
