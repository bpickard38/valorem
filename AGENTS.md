<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# shop.valorem

Cinematic scroll-driven storytelling shop for VALOREM (shop.houseofvalorem.com), sibling of the `valorem/` landing-page app. Architecture: AI-generated footage scrubbed as frame sequences on a 2D canvas + live WebGL layers (R3F) + DOM overlays, driven by one master GSAP ScrollTrigger timeline. The full plan lives at `C:\Users\bpick\.claude\plans\ok-i-want-you-hidden-donut.md`.

- `src/experience/phases.ts` is the single source of truth for the scroll journey (spans, sequences, seams, focal points).
- Never `await` inside the canvas draw loop; draw the nearest decoded frame.
- Commerce (`src/lib/shopify.ts`, `/api/checkout`) is ported verbatim from `../valorem` — keep them in sync.
- Dev server runs on port 3001 (main app owns 3000).
