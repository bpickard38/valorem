/*
 * Strip chroma-key residue from a "transparent" PNG.
 *
 * The source was keyed against magenta. Most of the canvas got alpha 0, but
 * the silhouette edge kept magenta RGB — including ~400 near-OPAQUE magenta
 * pixels, which render as a purple outline the moment the cutout sits on a
 * light background instead of its original magenta one.
 *
 * Two passes:
 *   1. KEY  — any magenta-dominant pixel becomes fully transparent.
 *   2. DESPILL — remaining EDGE pixels (alpha < 255) that still carry a
 *      magenta cast get green pulled back up to kill the purple tint. Interior
 *      pixels are never touched, so the cream wax and silver label are safe.
 */
import sharp from "sharp";

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) {
  console.error("usage: node defringe.mjs <in.png> <out.png>");
  process.exit(1);
}

const img = sharp(inPath).ensureAlpha();
const { width, height } = await img.metadata();
const raw = await img.raw().toBuffer();

const isMagenta = (r, g, b) => r > 120 && b > 120 && g < r - 40 && g < b - 40;

let keyed = 0;
let despilled = 0;

for (let i = 0; i < raw.length; i += 4) {
  const r = raw[i];
  const g = raw[i + 1];
  const b = raw[i + 2];
  const a = raw[i + 3];
  if (a === 0) continue;

  if (isMagenta(r, g, b)) {
    raw[i] = 0;
    raw[i + 1] = 0;
    raw[i + 2] = 0;
    raw[i + 3] = 0;
    keyed++;
    continue;
  }

  /* Edge pixels only. A magenta cast is green sitting below both red and
   * blue; lifting green to the lower of the two neutralises the tint without
   * changing luminance much. */
  if (a < 255) {
    const cast = (r + b) / 2 - g;
    if (cast > 12) {
      raw[i + 1] = Math.min(255, Math.round(Math.min(r, b)));
      despilled++;
    }
  }
}

await sharp(raw, { raw: { width, height, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile(outPath);

console.log(
  JSON.stringify(
    { in: inPath, out: outPath, width, height, keyed, despilled },
    null,
    1,
  ),
);
