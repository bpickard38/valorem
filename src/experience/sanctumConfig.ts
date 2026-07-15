import { getManifest } from "./manifest";
import { segMeta } from "@/sequence/sequences";
import { projectToScreen, type Focal } from "@/sequence/coverFit";
import { PHASES } from "./phases";
import type { RevealScent } from "./state";

/*
 * Where the two statues live inside the held doors frame (normalized frame
 * coordinates), plus reveal palettes. Tune cx/cy/w/h here if a master
 * re-generation shifts the final framing — everything (hotspots, particle
 * morphs) derives from these numbers through the same cover-fit projection
 * the film canvas uses.
 */

export interface FrameRect {
  cx: number;
  cy: number;
  w: number;
  h: number;
}

export const STATUES: Record<RevealScent, FrameRect> = {
  poseidon: { cx: 0.443, cy: 0.58, w: 0.11, h: 0.42 },
  aphrodite: { cx: 0.55, cy: 0.59, w: 0.1, h: 0.38 },
};

export const REVEAL_PALETTES: Record<
  RevealScent,
  { a: string; b: string }
> = {
  aphrodite: { a: "#b8963e", b: "#9a7d33" }, // gold dust
  poseidon: { a: "#9fc3d8", b: "#4a7a96" }, // sea spray
};

const DOORS_FALLBACK = { w: 1024, h: 608 };

function doorsFrame(): { w: number; h: number; focal?: Focal } {
  const focal = PHASES.find((p) => p.id === "doors")?.focal;
  const meta =
    segMeta("doors") ??
    (() => {
      const m = getManifest()?.segments["doors"];
      const v = m && Object.values(m.variants)[0];
      return v ? { w: v.w, h: v.h, frames: v.frames } : { ...DOORS_FALLBACK, frames: 0 };
    })();
  return { w: meta.w, h: meta.h, focal };
}

export interface ScreenRect {
  x: number; // center, px
  y: number;
  w: number;
  h: number;
}

/** Statue rect in *screen pixels* under the film's current cover crop. */
export function statueScreenRect(
  scent: RevealScent,
  viewW: number,
  viewH: number,
): ScreenRect {
  const s = STATUES[scent];
  const { w, h, focal } = doorsFrame();
  const c = projectToScreen(s.cx, s.cy, w, h, viewW, viewH, focal);
  const top = projectToScreen(s.cx, s.cy - s.h / 2, w, h, viewW, viewH, focal);
  const bottom = projectToScreen(s.cx, s.cy + s.h / 2, w, h, viewW, viewH, focal);
  const left = projectToScreen(s.cx - s.w / 2, s.cy, w, h, viewW, viewH, focal);
  const right = projectToScreen(s.cx + s.w / 2, s.cy, w, h, viewW, viewH, focal);
  return {
    x: c.x,
    y: c.y,
    w: Math.abs(right.x - left.x),
    h: Math.abs(bottom.y - top.y),
  };
}
