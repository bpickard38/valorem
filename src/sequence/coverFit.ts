/*
 * Focal-point cover-crop math, shared by SequenceCanvas (source rect for
 * drawImage) and StatueHotspots (projecting normalized footage coordinates
 * to screen pixels so buttons track the crop across resizes/orientations).
 */

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

const CENTER: Focal = { x: 0.5, y: 0.5 };

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

/** Normalized footage point (0..1 in source space) → screen pixels under the
 *  current cover crop. Used to pin hotspots to statues. */
export function projectToScreen(
  nx: number,
  ny: number,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
  focal: Focal = CENTER,
): { x: number; y: number } {
  const { sx, sy, sw, sh } = coverFit(srcW, srcH, dstW, dstH, focal);
  return {
    x: ((nx * srcW - sx) / sw) * dstW,
    y: ((ny * srcH - sy) / sh) * dstH,
  };
}
