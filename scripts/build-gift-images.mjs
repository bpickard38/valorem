/*
 * Builds the three gift-card images in public/gifts/ from the owner's source
 * renders. Run it again whenever a source changes:
 *
 *   node scripts/build-gift-images.mjs
 *
 * Unlike the rest of scripts/, this one is NOT inert legacy — it is how the
 * assets GIFT_IMAGES points at were made, and the knockout below is the part
 * worth keeping. Sources live outside the repo (they are large PNG renders);
 * override the paths with env vars if they have moved.
 *
 * Outputs, all 600px square with transparency:
 *   shipping.webp     the branded mailer, background removed
 *   sample.webp       one 5 ml tin
 *   sample-extra.webp two tins, for the card that completes the pair
 *
 * ---------------------------------------------------------------------------
 * WHY THE KNOCKOUT IS A FLOOD FILL AND NOT A BRIGHTNESS THRESHOLD
 *
 * The mailer is a black box on white, which invites "make every light pixel
 * transparent". That would erase the white Pegasus printed on the lid. A fill
 * that can only travel inward from the frame edges cannot reach the logo,
 * because the logo is completely enclosed by black card. Same reason the
 * threshold is 150 rather than something near white: it needs to swallow the
 * soft drop shadow too, and the shadow is mid-grey — but the box is ~35, so
 * there is a wide margin before the fill could eat into the product.
 *
 * TWO SHARP FOOTGUNS THIS FILE EXISTS TO REMEMBER, both of which produced
 * plausible-looking garbage rather than an error:
 *
 *   1. toBuffer() on a RAW input re-encodes to PNG when no output format is
 *      given. Feeding that to joinChannel() reads PNG container bytes as pixel
 *      data, so the alpha channel becomes compressed noise. Always .raw().
 *   2. blur() promotes a 1-channel raw buffer to 3 channels. Read the stride
 *      back out of the buffer length instead of assuming it survived.
 *
 * Also note sharp's trim() reads the RGB plane, not alpha — useless here,
 * since the pixels under the zeroed alpha are still white. The subject bounding
 * box is therefore computed from the mask directly.
 */

import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const TIN = process.env.GIFT_TIN_SRC ?? "C:/Users/bpick/Downloads/Sample trans.png";
const BOX = process.env.GIFT_BOX_SRC ?? "C:/Users/bpick/Downloads/Package.png";
const OUT = "public/gifts";

const SIZE = 600;
/* Anything at or above this luminance, reachable from the frame edge, is
 * backdrop or its shadow. The product sits far below it. */
const BACKDROP_LUMA = 150;

/** Remove a uniform light backdrop, returning a tightly cropped RGBA buffer. */
async function knockout(src) {
  const { data, info } = await sharp(src)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  const luma = (i) => 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];

  // Flood inward from every edge pixel.
  const isBackdrop = new Uint8Array(W * H);
  const stack = [];
  for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);

  while (stack.length) {
    const p = stack.pop();
    if (isBackdrop[p]) continue;
    if (luma(p * C) < BACKDROP_LUMA) continue;
    isBackdrop[p] = 1;
    const x = p % W;
    const y = (p - x) / W;
    if (x > 0) stack.push(p - 1);
    if (x < W - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - W);
    if (y < H - 1) stack.push(p + W);
  }

  // Subject bounds, from the mask — see the note on trim() above.
  let minX = W, minY = H, maxX = -1, maxY = -1;
  for (let p = 0; p < W * H; p++) {
    if (isBackdrop[p]) continue;
    const x = p % W;
    const y = (p - x) / W;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  if (maxX < 0) throw new Error(`${src}: knockout removed the entire image`);

  const hard = Buffer.alloc(W * H);
  for (let p = 0; p < W * H; p++) hard[p] = isBackdrop[p] ? 0 : 255;

  // Feather, so the cut is not aliased once scaled down to card size.
  const soft = await sharp(hard, { raw: { width: W, height: H, channels: 1 } })
    .blur(1.2)
    .raw()
    .toBuffer();
  const stride = soft.length / (W * H); // blur() may have promoted to 3

  const rgb = await sharp(src).removeAlpha().raw().toBuffer();
  const rgba = Buffer.alloc(W * H * 4);
  for (let p = 0; p < W * H; p++) {
    rgba[p * 4] = rgb[p * 3];
    rgba[p * 4 + 1] = rgb[p * 3 + 1];
    rgba[p * 4 + 2] = rgb[p * 3 + 2];
    rgba[p * 4 + 3] = soft[p * stride];
  }

  return sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
    .extract({
      left: minX,
      top: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    })
    .png()
    .toBuffer();
}

const square = (buf, file) =>
  sharp(buf)
    .resize(SIZE, SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(`${OUT}/${file}`);

await mkdir(OUT, { recursive: true });

// 1 — the mailer. The only source that needs its backdrop removed.
await square(await knockout(BOX), "shipping.webp");

// 2 — one tin. Already transparent; just letterboxed into the square.
await square(
  await sharp(TIN).resize({ height: Math.round(SIZE * 0.86), fit: "inside" }).png().toBuffer(),
  "sample.webp",
);

// 3 — two tins. Composited from the same render rather than drawn, so the card
// is unmistakably the same product. Scaled so the PAIR fits the canvas: at
// 0.72 of the height they overflow, which silently clips the second tin.
const tin = await sharp(TIN)
  .resize({ height: Math.round(SIZE * 0.66), fit: "inside" })
  .png()
  .toBuffer();
const { width: tw, height: th } = await sharp(tin).metadata();
const gap = Math.round(SIZE * 0.05);
const pairW = tw * 2 + gap;
if (pairW > SIZE) throw new Error(`pair is ${pairW}px, wider than the ${SIZE}px canvas`);

await sharp({
  create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
})
  .composite([
    { input: tin, left: Math.round((SIZE - pairW) / 2), top: Math.round((SIZE - th) / 2) },
    { input: tin, left: Math.round((SIZE - pairW) / 2) + tw + gap, top: Math.round((SIZE - th) / 2) },
  ])
  .webp({ quality: 90, alphaQuality: 100 })
  .toFile(`${OUT}/sample-extra.webp`);

console.log(`Wrote shipping.webp, sample.webp, sample-extra.webp to ${OUT}/`);
