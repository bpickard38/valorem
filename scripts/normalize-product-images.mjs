/*
 * Product cutout normaliser.
 *
 * Takes background-free PNGs of wildly different crops and scales and returns
 * a matched set: same canvas, same bottle height, same optical centre. That
 * consistency — not the transparency itself — is what makes a product grid
 * look designed rather than assembled.
 *
 * What it does to each file:
 *   1. Trims the fully-transparent border away, leaving the bottle's true
 *      bounding box. This is what makes the result independent of however the
 *      source happened to be cropped.
 *   2. Scales that box so the bottle occupies exactly CONTENT_HEIGHT of the
 *      canvas height. Every product ends up optically the same size.
 *   3. Centres it on a transparent CANVAS_W x CANVAS_H (4:5) canvas.
 *
 * It deliberately does NOT remove backgrounds — that needs subject detection,
 * and guessing at it from pixel values wrecks reflective edges and soft
 * shadows. Cut the background in Shopify's admin editor (Products > image >
 * Edit > Remove background) or Photopea first, then run this.
 *
 * It also does not add a shadow. The site draws that from the alpha channel at
 * render time (`.product-cutout` in globals.css), so one CSS edit restyles
 * every product at once and the shadow always suits the background it lands
 * on. A baked shadow can do neither.
 *
 * Usage:
 *   node scripts/normalize-product-images.mjs <input-dir> [output-dir] [WxH] [fill]
 *
 * Defaults to scripts/_cutouts/in, scripts/_cutouts/out and a 1600x2000 (4:5)
 * canvas. Upload the output to Shopify, then flip CUTOUT_PHOTOGRAPHY in
 * src/lib/site.ts.
 *
 * The canvas argument exists because a single bottle and a three-bottle group
 * shot are different shapes: 4:5 suits one upright product, and forcing a wide
 * group into it strands half the frame as empty air above and below. The
 * collection artwork is built at 1600x1200 for that reason.
 */

import { mkdir, readdir, writeFile } from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";
import sharp from "sharp";

/* 4:5 by default — the ratio every product surface on the site uses (product
 * gallery, collection cards, ProductRender). Large enough that Shopify's own
 * resizer has room to work down from. Override with a WxH third argument. */
const CANVAS_ARG = process.argv[4] ?? "1600x2000";
const CANVAS_MATCH = /^(\d+)x(\d+)$/.exec(CANVAS_ARG);
if (!CANVAS_MATCH) {
  console.error(`Canvas must look like 1600x2000, got "${CANVAS_ARG}"`);
  process.exit(1);
}
const CANVAS_W = Number(CANVAS_MATCH[1]);
const CANVAS_H = Number(CANVAS_MATCH[2]);

/* Fraction of the canvas height the bottle fills. The remaining 14% is the
 * margin that stops the product touching the frame edge.
 *
 * Deliberately tight. Cutouts as uploaded carry a lot of dead space — the
 * Artemis file measured 36% empty — and that margin reads on the page as a
 * gap between the product and its name that no amount of CSS can close, since
 * it is inside the image. Pulling it to 14% is what makes the grid look like
 * the reference rather than like floating product shots.
 *
 * The value matters far less than it being IDENTICAL for all six. */
const CONTENT_HEIGHT = Number(process.argv[5] ?? 0.86);
if (!(CONTENT_HEIGHT > 0 && CONTENT_HEIGHT <= 1)) {
  console.error(`Content fraction must be between 0 and 1, got "${process.argv[5]}"`);
  process.exit(1);
}

/* Where the bottle's centre sits vertically. Slightly above middle: a shadow
 * falls downward, so an optically centred object needs to sit a little high or
 * the composition reads bottom-heavy. */
const VERTICAL_CENTRE = 0.47;

const INPUT = resolve(process.argv[2] ?? "scripts/_cutouts/in");
const OUTPUT = resolve(process.argv[3] ?? "scripts/_cutouts/out");

async function main() {
  let entries;
  try {
    entries = await readdir(INPUT);
  } catch {
    console.error(`No input directory at ${INPUT}`);
    console.error(
      "Create it, drop your background-free PNGs in, and run this again.",
    );
    process.exitCode = 1;
    return;
  }

  const files = entries.filter((f) => /\.(png|webp)$/i.test(f));
  if (files.length === 0) {
    console.error(`No .png or .webp files in ${INPUT}`);
    console.error(
      "JPEGs cannot hold transparency — export cutouts as PNG or WebP.",
    );
    process.exitCode = 1;
    return;
  }

  await mkdir(OUTPUT, { recursive: true });

  let opaque = 0;
  for (const file of files) {
    const result = await normalize(join(INPUT, file));
    if (result.wasOpaque) opaque++;
    console.log(
      `${file.padEnd(28)} ${result.trimmed} -> ${CANVAS_W}x${CANVAS_H}` +
        (result.wasOpaque ? "   [!] no transparency" : ""),
    );
  }

  console.log(`\n${files.length} file(s) written to ${OUTPUT}`);

  if (opaque > 0) {
    console.log(
      `\n[!] ${opaque} file(s) had no transparent pixels, so there was nothing\n` +
        "    to trim and the bottle was not re-scaled. Remove the background\n" +
        "    first — this script matches cutouts, it does not create them.",
    );
  }
}

async function normalize(path) {
  const input = sharp(path).ensureAlpha();
  const meta = await input.metadata();

  /* Trim the transparent border. threshold 0 with a fully transparent
   * background means "cut anything with zero alpha" — it will not eat into a
   * soft edge on the product itself. */
  const trimmedBuf = await input
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 0 })
    .toBuffer({ resolveWithObject: true });

  const tw = trimmedBuf.info.width;
  const th = trimmedBuf.info.height;

  /* Nothing was trimmed => the source has no transparent border, i.e. the
   * background is still there. Flagged rather than failed: the file is still
   * written so the caller can see what came out. */
  const wasOpaque = tw === meta.width && th === meta.height;

  /* Scale on HEIGHT, not on the longest edge. Every bottle then stands the
   * same height in its frame regardless of how wide its cap or base is, which
   * is what the eye actually compares across a row of products. */
  let targetH = Math.round(CANVAS_H * CONTENT_HEIGHT);
  let targetW = Math.round(tw * (targetH / th));

  /* A product wide enough to overrun the canvas gets scaled down to fit the
   * width instead. Only bites on an unusually squat shot — a stick never
   * trips it — but without it the composite lands off-canvas and throws. */
  const maxW = Math.round(CANVAS_W * CONTENT_HEIGHT);
  if (targetW > maxW) {
    targetH = Math.round(targetH * (maxW / targetW));
    targetW = maxW;
  }

  const resized = await sharp(trimmedBuf.data)
    .resize(targetW, targetH, {
      fit: "fill",
      kernel: sharp.kernel.lanczos3,
    })
    .toBuffer();

  /* Clamped to zero: a bottle wider than the canvas would compute a negative
   * offset, and sharp rejects a composite placed off-canvas. */
  const left = Math.max(0, Math.round((CANVAS_W - targetW) / 2));
  const top = Math.max(
    0,
    Math.round(CANVAS_H * VERTICAL_CENTRE - targetH / 2),
  );

  const out = await sharp({
    create: {
      width: CANVAS_W,
      height: CANVAS_H,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resized, left, top }])
    .png({ compressionLevel: 9 })
    .toBuffer();

  const name = `${basename(path, extname(path))}.png`;
  await writeFile(join(OUTPUT, name), out);

  return { trimmed: `${tw}x${th}`, wasOpaque };
}

main();
