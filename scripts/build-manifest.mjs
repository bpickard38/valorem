/*
 * Scans public/sequences/<segment>/<tier>/f_*.{avif,webp} and writes
 * public/sequences/manifest.json — the runtime source of truth for frame
 * counts, dimensions, byte weights, and formats. Run after any (re)encode.
 *
 *   node scripts/build-manifest.mjs
 */
import sharp from "sharp";
import { readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..", "public", "sequences");

// fps is authored, not derivable from files.
const FPS = { "pegasus-morph": 24, descent: 16, approach: 16, doors: 16 };

const manifest = { generatedAt: new Date().toISOString(), segments: {} };

for (const segName of (await readdir(ROOT, { withFileTypes: true }))
  .filter((d) => d.isDirectory())
  .map((d) => d.name)) {
  const segDir = path.join(ROOT, segName);
  const variants = {};
  let format = "webp";

  for (const tier of (await readdir(segDir, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name)) {
    const dir = path.join(segDir, tier);
    const files = (await readdir(dir))
      .filter((f) => /^f_\d{4}\.(avif|webp)$/.test(f))
      .sort();
    if (!files.length) continue;
    format = files[0].endsWith(".avif") ? "avif" : "webp";

    let bytes = 0;
    for (const f of files) bytes += (await stat(path.join(dir, f))).size;
    const meta = await sharp(path.join(dir, files[0])).metadata();

    variants[tier] = {
      w: meta.width,
      h: meta.height,
      frames: files.length,
      bytes,
    };
  }

  if (Object.keys(variants).length) {
    manifest.segments[segName] = {
      fps: FPS[segName] ?? 16,
      format,
      variants,
    };
  }
}

const out = path.join(ROOT, "manifest.json");
await writeFile(out, JSON.stringify(manifest, null, 2));
console.log(`wrote ${out}`);
for (const [name, seg] of Object.entries(manifest.segments)) {
  for (const [tier, v] of Object.entries(seg.variants)) {
    console.log(
      `  ${name}/${tier}: ${v.frames} frames, ${(v.bytes / 1e6).toFixed(1)}MB`,
    );
  }
}
