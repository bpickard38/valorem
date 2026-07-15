import { projectToScreen, type Focal } from "@/sequence/coverFit";
import type { ScentId } from "@/lib/shopify";

/*
 * Where the two product tins live inside the finale video's FINAL frame
 * (normalized frame coordinates). The finale <video> renders object-fit:cover
 * center-focal, so projecting through the same cover-fit math the film canvas
 * uses keeps hit-areas and captions glued to the tins across resizes and
 * orientations. Tune cx/cy/w/h here if the finale master is regenerated.
 */

export interface FrameRect {
  cx: number;
  cy: number;
  w: number;
  h: number;
}

export const TINS: Record<ScentId, FrameRect> = {
  poseidon: { cx: 0.31, cy: 0.57, w: 0.28, h: 0.86 },
  aphrodite: { cx: 0.7, cy: 0.57, w: 0.28, h: 0.86 },
};

/** Fallback until the video's metadata is loaded. */
export const FINALE_FRAME_FALLBACK = { w: 1920, h: 1073 };

const FOCAL: Focal = { x: 0.5, y: 0.5 };

export interface ScreenRect {
  x: number; // center, px
  y: number;
  w: number;
  h: number;
}

/** Tin rect in *screen pixels* under the video's cover crop. */
export function tinScreenRect(
  scent: ScentId,
  frameW: number,
  frameH: number,
  viewW: number,
  viewH: number,
): ScreenRect {
  const t = TINS[scent];
  const c = projectToScreen(t.cx, t.cy, frameW, frameH, viewW, viewH, FOCAL);
  const top = projectToScreen(t.cx, t.cy - t.h / 2, frameW, frameH, viewW, viewH, FOCAL);
  const bottom = projectToScreen(t.cx, t.cy + t.h / 2, frameW, frameH, viewW, viewH, FOCAL);
  const left = projectToScreen(t.cx - t.w / 2, t.cy, frameW, frameH, viewW, viewH, FOCAL);
  const right = projectToScreen(t.cx + t.w / 2, t.cy, frameW, frameH, viewW, viewH, FOCAL);
  return {
    x: c.x,
    y: c.y,
    w: Math.abs(right.x - left.x),
    h: Math.abs(bottom.y - top.y),
  };
}

/** Normalized frame point → screen pixels (caption anchors). */
export function finalePointToScreen(
  nx: number,
  ny: number,
  frameW: number,
  frameH: number,
  viewW: number,
  viewH: number,
): { x: number; y: number } {
  return projectToScreen(nx, ny, frameW, frameH, viewW, viewH, FOCAL);
}
