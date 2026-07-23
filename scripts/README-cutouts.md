# Product cutouts — the whole workflow

Goal: every scent photographed as a background-free PNG, sitting on the page's
own ivory or stone with a shadow the browser draws. Six products that look like
one set.

## Status — done

All six scents have their own background-free cutout in Shopify, each with its
own tin (HADES I, POSEIDON I, …), and `CUTOUT_PHOTOGRAPHY` is `true`.

What is still worth doing: the uploaded cutouts sit at ~67% fill on a 1122x1402
canvas. Running them through the normaliser takes them to 86% on 1600x2000,
which tightens the gap between each product and its name on the collection
grid. Consistency is already there — all six are within 2px of each other — so
this is polish, not a defect.

## Steps

**1. Remove the background.** Shopify admin → Products → click the image →
Edit → Remove background. Free, no subscription. Photopea (browser, free) if
you want manual control over a tricky edge.

Do not try to keep the original shadow. It goes with the background, and that
is fine — see step 4.

**2. Normalise.** Put the cutouts in `scripts/_cutouts/in`, then:

```bash
node scripts/normalize-product-images.mjs
```

For collection artwork — the three-bottle group shots on `/collections` — pass
the wider canvas and a tighter fill, since landscape content in a portrait
frame strands half its height as empty air:

```bash
node scripts/normalize-product-images.mjs scripts/_cutouts/in public/collections 1600x1200 0.95
```

Output lands in `scripts/_cutouts/out`: every file trimmed to the bottle's true
bounding box, rescaled so the bottle is exactly 78% of the canvas height, and
centred on a transparent 1600×2000 (4:5) canvas.

This step is the one that matters. Backgrounds are the obvious half of the job;
**matched scale is the half people feel.** If one bottle fills 80% of its card
and its neighbour fills 55%, the grid looks broken no matter how clean the
cutouts are.

The script warns if a file has no transparent pixels — that means step 1 was
missed on it. It normalises cutouts, it does not create them.

**3. Upload to Shopify**, replacing the old image on each product.

**4. Flip the switch.** In `src/lib/site.ts`:

```ts
export const CUTOUT_PHOTOGRAPHY = true;
```

That single change moves every product frame on the site from crop-to-fill to
letterbox, insets the image, and turns on the shadow. Nothing else to edit.

Flip it only once **all six** have cutouts. The two modes must not mix: one
cutout among five bleed shots reads as a mistake, and a bleed shot in cutout
mode letterboxes into grey bars — which is exactly what Hades and Apollo did
when this was tested early.

## Why the shadow is CSS and not baked into the file

`.product-cutout` in `globals.css` uses `filter: drop-shadow`, which follows the
PNG's **alpha channel** — so it traces the bottle's silhouette. `box-shadow`
would trace the `<img>` rectangle and give you a shadowed grey box.

Keeping it in CSS means:

- all six products get an identical shadow automatically;
- it works on ivory and on stone, because it is not matched to one baked-in
  background;
- restyling every product is one CSS edit, with no re-export and no re-upload.

## Shooting or generating new ones

Plain white or very light grey background, even lighting, bottle centred and
upright, lots of margin. The cleaner the separation between bottle and
background, the better the automatic cutout works. Shoot larger than 1600×2000
— the normaliser scales down, and scaling up loses detail.
