/*
 * Master clip → scrub-ready frame sequence.
 *
 *   node scripts/encode.mjs <segment> <input.mp4> [--fps 16] [--key]
 *
 * <segment>  folder name under public/sequences/ (e.g. descent)
 * --fps      sample rate (16 for slow moves, 24 for the morph)
 * --key      chroma-key green screen → transparent frames (pegasus clips)
 *
 * Pipeline: ffmpeg extracts PNG frames (keyed if requested) into a temp dir,
 * sharp encodes WebP at 1080 + 720 tiers into public/sequences/<segment>/.
 * Re-run build-manifest.mjs afterwards.
 */
import { execFileSync } from "node:child_process";
import { mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import ffmpegPath from "ffmpeg-static";

const [segment, input, ...rest] = process.argv.slice(2);
if (!segment || !input) {
  console.error("usage: node scripts/encode.mjs <segment> <input.mp4> [--fps 16] [--key]");
  process.exit(1);
}
const fps = Number(rest[rest.indexOf("--fps") + 1]) || 16;
const key = rest.includes("--key");

const ROOT = path.resolve(import.meta.dirname, "..");
const TMP = path.join(ROOT, "scripts", "_tmp_frames", segment);
const OUT = path.join(ROOT, "public", "sequences", segment);

await rm(TMP, { recursive: true, force: true });
await mkdir(TMP, { recursive: true });

// 1. Extract frames (keyed → RGBA png). Tune the key color/threshold per clip
//    if fringe shows: sample the actual screen green from a corner pixel.
const vf = key
  ? `fps=${fps},chromakey=0x1EC81E:0.28:0.06,despill=type=green`
  : `fps=${fps}`;
console.log(`extracting @ ${fps}fps${key ? " with chroma key" : ""}…`);
execFileSync(ffmpegPath, [
  "-i", input,
  "-vf", vf,
  "-y", path.join(TMP, "f_%04d.png"),
], { stdio: "inherit" });

// 2. Encode tiers.
const TIERS = [
  { dir: "1080", width: 1920 },
  { dir: "720", width: 1280 },
];
const frames = (await readdir(TMP)).filter((f) => f.endsWith(".png")).sort();
console.log(`${frames.length} frames → webp tiers…`);
for (const tier of TIERS) {
  const dir = path.join(OUT, tier.dir);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  let i = 0;
  const queue = [...frames];
  await Promise.all(
    Array.from({ length: 8 }, async () => {
      while (queue.length) {
        const f = queue.shift();
        await sharp(path.join(TMP, f))
          .resize({ width: tier.width, withoutEnlargement: true })
          .webp({ quality: 72, alphaQuality: 80 })
          .toFile(path.join(dir, f.replace(".png", ".webp")));
        if (++i % 50 === 0) console.log(`  ${tier.dir}: ${i}/${frames.length}`);
      }
    }),
  );
}

await rm(TMP, { recursive: true, force: true });
console.log(`done → ${OUT}. Now run: node scripts/build-manifest.mjs`);
