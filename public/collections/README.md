# Collection artwork

Drop the two collection photographs here:

- `gods.jpg` — the left card on /collections
- `goddesses.jpg` — the right card on /collections

`.avif`, `.webp`, `.png`, `.jpg` and `.jpeg` all work, and the extension is
matched case-insensitively — the filename is the only thing that matters. No
code change is needed: `src/lib/collectionImage.ts` finds the file, and the
engraved pegasus placeholder disappears on the next build.

Note the resolver prefers formats in that order, so a `gods.webp` sitting
beside a `gods.png` wins and the `.png` is dead weight. Delete the loser rather
than leaving both.

## Ratio

Shoot or crop them **4:3 landscape** — the card frame is a fixed `aspect-[4/3]`
box. Both current files are 1254x941.

(This file said "3:4 portrait" until 2026-08-05. It was wrong, and had been
since the frame was set to 4:3. Anything shot to that instruction would have
been cropped to a ribbon from the sides.)

## These are bleed shots, not cutouts

The card renders its artwork `object-cover` in an `overflow-hidden` frame, with
no drop-shadow. That is a deliberate exception to `CUTOUT_PHOTOGRAPHY` in
`site.ts`, which governs the product surfaces: those want a background-free PNG
under a CSS drop-shadow, and collection artwork wants the opposite — a full
photograph with its own background, edge to edge.

So a background-free PNG dropped in here will NOT get a shadow, and an opaque
photo will NOT be inset. If you ever switch this folder to cutouts, the two
classes on the frame in `src/app/collections/page.tsx` have to change with it.
