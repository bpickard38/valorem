<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# houseofvalorem.com

The VALOREM production app: the cinematic scroll-driven storytelling shop at `/` plus the merged landing page at `/deity`. Architecture: AI-generated footage scrubbed as frame sequences on a 2D canvas + live WebGL layers (R3F) + DOM overlays, driven by one master GSAP ScrollTrigger timeline.

Phase model: `hero` (live chroma-keyed pegasus loop) → `morph` (pegasus → black logo silhouette; film hands off to the DOM logo dock) → `voyage` (one continuous clouds → temple doors → statues scrub, 430vh) → `sanctum` (holds the statue frame; the finale video `statues → product tins` auto-plays, then a price + Order overlay appears per tin; tins click through to `/product/[scent]`).

- `src/experience/phases.ts` is the single source of truth for the scroll journey (spans, sequences, seams, focal points). Runtime frame counts come from `public/sequences/manifest.json` (rebuild with `node scripts/build-manifest.mjs`).
- `/fx/**`, `/sequences/**`, `/plates/**` are immutable-cached — new or regenerated media MUST ship under a new filename/folder (loop: `pegasus-loop-side-v2.mp4`, finale: `statues-to-product-v1.mp4`).
- Media is git-ignored and regenerable: masters in `scripts/_raw/`, encode with `node scripts/encode.mjs <segment> <master> --fps N`, then rebuild the manifest.
- Never `await` inside the canvas draw loop; draw the nearest decoded frame.
- Commerce (`src/lib/shopify.ts`, `/api/checkout`, `/api/subscribe`) is canonical here; `../valorem` is the frozen landing-page archive.
- Dev server runs on port 3001.
