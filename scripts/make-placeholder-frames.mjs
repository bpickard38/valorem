/*
 * M2 placeholder sequences: numbered frames with a sweeping position bar so
 * scrub direction, monotonicity, and cross-blends are visible before real
 * footage exists. Real segments replace these via scripts/encode.mjs.
 *
 *   node scripts/make-placeholder-frames.mjs
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve(import.meta.dirname, "..", "public", "sequences");

// Keep in step with src/experience/phases.ts (frames/fps) — build-manifest.mjs
// re-reads reality from disk either way.
const SEGMENTS = [
  { name: "pegasus-morph", frames: 120, fps: 24, from: "#8fadd0", to: "#dfe6ee" },
  { name: "voyage", frames: 92, fps: 30, from: "#e8ecf0", to: "#241f18" },
];

const TIERS = [
  { dir: "1080", w: 1920, h: 1080 },
  { dir: "720", w: 1280, h: 720 },
];

function frameSvg(seg, i, w, h) {
  const t = i / (seg.frames - 1);
  const barX = 40 + t * (w - 80);
  const light = seg.name === "doors" ? "#f7f4ee" : "#1a1917";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${seg.from}"/><stop offset="1" stop-color="${seg.to}"/>
  </linearGradient></defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <text x="${w / 2}" y="${h * 0.32}" text-anchor="middle" font-family="Georgia" font-size="${h * 0.09}" letter-spacing="12" fill="${light}" opacity="0.35">${seg.name.toUpperCase()}</text>
  <text x="${w / 2}" y="${h * 0.58}" text-anchor="middle" font-family="Georgia" font-size="${h * 0.22}" fill="${light}" opacity="0.55">${String(i + 1).padStart(4, "0")}</text>
  <text x="${w / 2}" y="${h * 0.66}" text-anchor="middle" font-family="monospace" font-size="${h * 0.03}" fill="${light}" opacity="0.5">of ${seg.frames}</text>
  <rect x="40" y="${h - 90}" width="${w - 80}" height="2" fill="${light}" opacity="0.25"/>
  <rect x="${barX - 3}" y="${h - 120}" width="6" height="62" fill="#b8963e"/>
</svg>`;
}

async function pool(jobs, size) {
  const queue = [...jobs];
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (queue.length) await queue.shift()();
    }),
  );
}

const jobs = [];
for (const seg of SEGMENTS) {
  for (const tier of TIERS) {
    const dir = path.join(OUT, seg.name, tier.dir);
    await mkdir(dir, { recursive: true });
    for (let i = 0; i < seg.frames; i++) {
      const file = path.join(dir, `f_${String(i + 1).padStart(4, "0")}.webp`);
      jobs.push(() =>
        sharp(Buffer.from(frameSvg(seg, i, tier.w, tier.h)))
          .webp({ quality: 60 })
          .toFile(file),
      );
    }
  }
}

console.log(`generating ${jobs.length} placeholder frames…`);
const t0 = Date.now();
await pool(jobs, 8);
console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s → ${OUT}`);
