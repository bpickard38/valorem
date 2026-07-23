# Collection artwork

Drop the two collection photographs here:

- `gods.jpg` — the left card on /collections
- `goddesses.jpg` — the right card on /collections

`.avif`, `.webp`, `.png`, `.jpg` and `.jpeg` all work, and the extension is
matched case-insensitively — the filename is the only thing that matters. No
code change is needed: `src/lib/collectionImage.ts` finds the file, and the
engraved pegasus placeholder disappears on the next build.

Shoot or crop them **3:4 portrait**. The card frame is a fixed 3:4 box and the
image is `object-cover`, so anything wider gets cropped from the sides.
