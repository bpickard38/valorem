/*
 * Compressed-blob store + tiered background fetching. Whole segments are kept
 * as compressed blobs once downloaded (cheap — tens of KB per frame) so the
 * decode pool never re-fetches; decoded bitmaps are the scarce resource.
 */

import { getManifest, loadManifest, pickTier } from "@/experience/manifest";
import { experienceStore } from "@/experience/state";

interface SegState {
  tier: string;
  w: number;
  h: number;
  frames: number;
  blobs: (Blob | null)[];
  loadedBytes: number;
  totalBytes: number;
  done: boolean;
}

const segs = new Map<string, SegState>();

/** Fetch priority: the opening segment first, then down the journey. */
export const TIER_ORDER: string[][] = [
  ["pegasus-morph"],
  ["voyage"],
];

export function getBlob(seg: string, i: number): Blob | null {
  return segs.get(seg)?.blobs[i] ?? null;
}

export function segMeta(
  seg: string,
): { frames: number; w: number; h: number } | null {
  const s = segs.get(seg);
  return s ? { frames: s.frames, w: s.w, h: s.h } : null;
}

async function fetchSegment(
  name: string,
  onProgress?: (loaded: number, total: number) => void,
): Promise<void> {
  const m = getManifest();
  if (!m) return;
  const info = m.segments[name];
  if (!info) return;
  if (segs.get(name)?.done) return;

  const tier = pickTier(info);
  const v = info.variants[tier];
  const state: SegState = {
    tier,
    w: v.w,
    h: v.h,
    frames: v.frames,
    blobs: new Array<Blob | null>(v.frames).fill(null),
    loadedBytes: 0,
    totalBytes: v.bytes,
    done: false,
  };
  segs.set(name, state);

  const indices = Array.from({ length: v.frames }, (_, i) => i);
  const CONCURRENCY = 6;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (indices.length) {
        const i = indices.shift()!;
        const pad = String(i + 1).padStart(4, "0");
        try {
          // generatedAt busts the immutable cache whenever a segment is
          // re-encoded — frame URLs change with every manifest rebuild.
          const res = await fetch(
            `/sequences/${name}/${tier}/f_${pad}.${info.format}?v=${encodeURIComponent(m.generatedAt)}`,
          );
          if (res.ok) {
            const blob = await res.blob();
            state.blobs[i] = blob;
            state.loadedBytes += blob.size;
            onProgress?.(state.loadedBytes, state.totalBytes);
          }
        } catch {
          // transient network failure: frame stays null; draw loop skips it
        }
      }
    }),
  );
  state.done = true;
}

let started = false;

/** Kick off the tiered download chain. T0 progress feeds the Loader; the
 *  store's `tier` field advances as each group completes. */
export async function startLoading(
  onT0Progress: (fraction: number) => void,
): Promise<void> {
  if (started) return;
  started = true;
  await loadManifest();

  for (let t = 0; t < TIER_ORDER.length; t++) {
    await Promise.all(
      TIER_ORDER[t].map((name) =>
        fetchSegment(
          name,
          t === 0
            ? (loaded, total) => onT0Progress(total ? loaded / total : 1)
            : undefined,
        ),
      ),
    );
    experienceStore.setState({ tier: t });
  }
}
