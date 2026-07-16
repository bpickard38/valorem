<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# houseofvalorem.com

The VALOREM production app: the cinematic scroll-driven storytelling shop at `/` plus the merged landing page at `/deity`. Architecture: AI-generated footage scrubbed as frame sequences on a 2D canvas + live WebGL layers (R3F) + DOM overlays, driven by one master GSAP ScrollTrigger timeline.

Phase model: `morph` (opens on the held pegasus frame, then pegasus → black logo silhouette; film hands off to the DOM logo dock, which shrinks into the top-left corner and doubles as the way back to the start) → `voyage` (one continuous clouds → temple doors → statues scrub, 430vh) → `sanctum` (holds the statue frame; the finale video `statues → product tins` auto-plays, then a price + Order overlay appears per tin; tins click through to `/product/[scent]`). 590vh total.

- There is NO guided auto-run — viewers scrub the film themselves (an auto-scroll was tried and cut as laggy). `AutoPlay.tsx` now only owns lifecycle: reloads always open on frame one (`history.scrollRestoration = "manual"` + scroll-to-0 on mount) and the `jumpToFilmEnd`/`jumpToFilmStart` shortcuts (Skip to Shop / docked logo). The Loader gates on ALL media — both sequence tiers plus the finale video (blob-preloaded in `src/sequence/finaleVideo.ts`) — and flips `loaded` in the store on dismissal. Back-from-checkout: a `return-to-finale` sessionStorage note (set by OrderButton on `/`) makes Finale jump back to the tins after a fresh-load return; bfcache restores keep their position — never scroll inside a `pageshow` handler.
- `src/experience/phases.ts` is the single source of truth for the scroll journey (spans, sequences, seams, focal points, opacity, dock timings). Runtime frame counts come from `public/sequences/manifest.json` (rebuild with `node scripts/build-manifest.mjs`).
- Viewports narrower than `MIN_COVER_ASPECT` (~1.2) letterbox instead of cropping — a portrait cover-crop drops both product tins off screen. `stageFit()` in `src/sequence/coverFit.ts` owns that decision for the canvas, the tin hit-areas, and `--film-h` (which sizes the DOM logo against the film, not the window); the `.film-fit` class mirrors it for the finale `<video>`. Opaque phases get a blurred fill behind the band; alpha cutouts composite over the sky plates instead.
- `/fx/**`, `/sequences/**`, `/plates/**` are immutable-cached — new or regenerated media MUST ship under a new filename/folder (finale: `statues-to-product-v1.mp4`).
- Media is git-ignored and regenerable: masters in `scripts/_raw/`, encode with `node scripts/encode.mjs <segment> <master> --fps N`, then rebuild the manifest.
- Never `await` inside the canvas draw loop; draw the nearest decoded frame.
- Commerce (`src/lib/shopify.ts`, `/api/checkout`, `/api/subscribe`) is canonical here; `../valorem-landing-archive` is the frozen landing-page archive.
- Dev server runs on port 3001.
