<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# houseofvalorem.com

The VALOREM production app. Solid fragrance ($70 twist-up tins), two scents: Poseidon & Aphrodite.

Routes:

- `/` — clean, light marketing home (`src/app/page.tsx`, server component). Sections navigate by anchor id; product cards link to `/product/[scent]`. Header is `src/components/HomeHeader.tsx`, footer `HomeFooter.tsx`.
- `/deity` — immersive alternate landing page. Treat as frozen: do not modify `src/app/deity/**`, and any shared component it imports (Nav, Faq, EmailForm, FadeIn, ProductRender, ui, OrderButton) must keep rendering identically for it. `Nav.tsx` is the /deity-only header.
- `/product/[scent]` — product detail pages, statically generated from the `SCENTS` catalog.

Conventions:

- `src/lib/site.ts` is the single source of truth for price, sizes, ship/return windows, and all scent copy. Never hardcode those facts in pages.
- Design system lives in `src/app/globals.css`: ivory/charcoal/gold/stone palette, Cormorant Garamond (serif display) + Inter (body), utilities `.label-engraved`, `.type-display`, `.type-heading`, `.texture-travertine`. Tailwind v4, CSS-first (no config file).
- Reveal animation is `src/components/FadeIn.tsx` (IntersectionObserver). No animation libraries.
- Commerce (`src/lib/shopify.ts`, `/api/checkout`, `/api/subscribe`) is canonical here; `../valorem-landing-archive` is the frozen landing-page archive.
- `scripts/` is legacy media tooling from the retired cinematic home; it is inert and not part of the build.
- Dev server runs on port 3001.
