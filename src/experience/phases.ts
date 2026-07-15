/*
 * SINGLE SOURCE OF TRUTH for the scroll journey.
 * Every layer (ScrollRig, SequenceCanvas, WebGL stage, overlays, hotspots)
 * derives its behavior from this table — change the film here, nowhere else.
 */

export type PhaseId = "hero" | "morph" | "voyage" | "sanctum";

export type Seam = "cut" | "dissolve" | "live-crossfade";

export interface PhaseSeq {
  /** folder under public/sequences/<name>/<tier>/ */
  name: string;
  frames: number;
  fps: 16 | 24 | 30 | 60;
}

export interface Phase {
  id: PhaseId;
  /** scroll length in vh units (100 = one viewport height) */
  span: number;
  /** how this phase enters from the previous one */
  seam: Seam;
  seq?: PhaseSeq;
  /** normalized cover-crop anchor for portrait viewports */
  focal?: { x: number; y: number };
  /** fraction of the phase over which the drawn film fades out at its end
   *  (hands the frame to a DOM element, e.g. morph silhouette → logo dock) */
  fadeTail?: number;
  overlay?: { label?: string; heading?: string };
}

export const PHASES: Phase[] = [
  {
    id: "hero",
    span: 100,
    seam: "cut",
    overlay: { heading: "Fragrance, in its most permanent form." },
  },
  {
    id: "morph",
    span: 120,
    seam: "live-crossfade",
    seq: { name: "pegasus-morph", frames: 120, fps: 24 },
    // Film silhouette dissolves out over the last 12% while the DOM logo
    // dock fades in over the live clouds.
    fadeTail: 0.12,
  },
  {
    // One continuous shot: fall through the clouds, cross the temple front,
    // and dolly through the doors onto the two statues.
    id: "voyage",
    span: 430,
    seam: "cut",
    seq: { name: "voyage", frames: 90, fps: 30 },
    focal: { x: 0.5, y: 0.5 },
    overlay: { label: "The House" },
  },
  {
    // Holds the final voyage frame (the statues); the scroll track ends here.
    // The finale video (statues → product tins) auto-plays on arrival.
    id: "sanctum",
    span: 40,
    seam: "cut",
    focal: { x: 0.5, y: 0.45 },
  },
];

/** Total scroll track length in vh units. */
export const TOTAL_SPAN = PHASES.reduce((sum, p) => sum + p.span, 0);

/** Cumulative [start, end) of a phase in vh units along the track. */
export function phaseRange(id: PhaseId): { start: number; end: number } {
  let acc = 0;
  for (const p of PHASES) {
    if (p.id === id) return { start: acc, end: acc + p.span };
    acc += p.span;
  }
  return { start: 0, end: 0 };
}

/** Shared exponential-smoothing constant — canvas and WebGL layers must damp
 *  with the same factor so baked footage and live parallax stay coherent. */
export const DAMP = 6;
