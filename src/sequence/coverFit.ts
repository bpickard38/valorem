/*
 * Where the film sits on screen. Shared by SequenceCanvas (source + dest rects
 * for drawImage), the DOM logo (via --film-h), and finaleConfig (projecting
 * normalized footage coordinates to screen pixels so the tin hit-areas track
 * the frame across resizes and orientations).
 *
 * Wide viewports crop (cover). Narrow ones letterbox — see MIN_COVER_ASPECT.
 */

import { FILM_ASPECT } from "@/experience/phases";

export interface Focal {
  x: number;
  y: number;
}

export interface SourceRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

/** Source rect + where it lands on screen. Under a cover crop the dest is the
 *  whole viewport; when letterboxed it's the centered band. */
export interface StageRect extends SourceRect {
  dx: number;
  dy: number;
  dw: number;
  dh: number;
}

const CENTER: Focal = { x: 0.5, y: 0.5 };

/*
 * Viewport aspect below which we fit the whole frame instead of cropping it.
 * Derived from the finale composition: the two product tins span x ∈ [0.17,
 * 0.84] of the frame, so a cover crop has to keep ≥67% of the frame width to
 * hold both. That needs a viewport aspect of ~1.2. Anything narrower (every
 * phone in portrait) crops the products off screen entirely, so we letterbox.
 *
 * MUST stay in sync with the `6/5` aspect-ratio query behind .film-fit in
 * globals.css, which switches the finale <video> the same way.
 */
export const MIN_COVER_ASPECT = 1.2;

export function isLetterboxed(dstW: number, dstH: number): boolean {
  return dstW / dstH < MIN_COVER_ASPECT;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/** Source rect that covers dst, keeping the focal point as centered as the
 *  crop allows (never letterboxes, never samples outside the frame). */
export function coverFit(
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
  focal: Focal = CENTER,
): SourceRect {
  const srcAspect = srcW / srcH;
  const dstAspect = dstW / dstH;
  let sw: number;
  let sh: number;
  if (srcAspect > dstAspect) {
    sh = srcH;
    sw = srcH * dstAspect;
  } else {
    sw = srcW;
    sh = srcW / dstAspect;
  }
  return {
    sx: clamp(srcW * focal.x - sw / 2, 0, srcW - sw),
    sy: clamp(srcH * focal.y - sh / 2, 0, srcH - sh),
    sw,
    sh,
  };
}

/** The film's placement: crop-to-fill on wide viewports, whole-frame band on
 *  narrow ones. */
export function stageFit(
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
  focal: Focal = CENTER,
): StageRect {
  if (isLetterboxed(dstW, dstH)) {
    const scale = Math.min(dstW / srcW, dstH / srcH);
    const dw = srcW * scale;
    const dh = srcH * scale;
    return {
      sx: 0,
      sy: 0,
      sw: srcW,
      sh: srcH,
      dx: (dstW - dw) / 2,
      dy: (dstH - dh) / 2,
      dw,
      dh,
    };
  }
  return {
    ...coverFit(srcW, srcH, dstW, dstH, focal),
    dx: 0,
    dy: 0,
    dw: dstW,
    dh: dstH,
  };
}

/** On-screen height of the WHOLE source frame under the current fit — which
 *  exceeds the viewport when a cover crop is trimming top and bottom. This is
 *  the basis the DOM logo is sized against: it has to match the film's
 *  silhouette, not the window. */
export function filmHeight(
  dstW: number,
  dstH: number,
  srcAspect: number = FILM_ASPECT,
): number {
  const byWidth = dstW / srcAspect;
  return isLetterboxed(dstW, dstH) ? byWidth : Math.max(dstH, byWidth);
}

/*
 * Publish the film's on-screen height as --film-h for the logo dock.
 *
 * Called from two places on purpose, both writing the same value (it's a pure
 * function of the viewport, so they can't disagree):
 *   - SequenceCanvas's resize handler, which reliably fires on mount and on
 *     every resize. ScrollTrigger's refresh is NOT dependable here — it
 *     skips resize events it judges insignificant, which would leave the logo
 *     sized for the old viewport after a rotation.
 *   - ScrollRig's "refreshInit", for ordering: the dock's tweens are
 *     function-based and read offsetHeight, which depends on this var, so it
 *     has to be current before those values are re-solved.
 */
export function syncFilmVars(): void {
  if (typeof window === "undefined") return;
  const h = filmHeight(window.innerWidth, window.innerHeight);
  // A viewport with no width (pre-layout, hidden tab) would otherwise write
  // 0px and collapse the logo until something forces another refresh. Leave
  // the CSS default standing instead.
  if (!Number.isFinite(h) || h <= 0) return;
  document.documentElement.style.setProperty("--film-h", `${h}px`);
}

/** Normalized footage point (0..1 in source space) → screen pixels under the
 *  current fit. Used to pin the finale's tin hit-areas and captions. */
export function projectToScreen(
  nx: number,
  ny: number,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
  focal: Focal = CENTER,
): { x: number; y: number } {
  const { sx, sy, sw, sh, dx, dy, dw, dh } = stageFit(
    srcW,
    srcH,
    dstW,
    dstH,
    focal,
  );
  return {
    x: dx + ((nx * srcW - sx) / sw) * dw,
    y: dy + ((ny * srcH - sy) / sh) * dh,
  };
}
