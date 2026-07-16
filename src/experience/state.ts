import { createStore } from "zustand/vanilla";
import { PHASES, TOTAL_SPAN, type PhaseId } from "./phases";
import type { ScentId } from "@/lib/shopify";

/*
 * Transient experience state. ScrollTrigger writes on scroll; the canvas draw
 * loop and R3F useFrame read imperatively via experienceStore.getState() —
 * no React re-renders on the hot path. React components that need phase
 * changes subscribe selectively.
 */

export type FinaleStatus = "idle" | "playing" | "ended" | "navigating";

export interface ExperienceState {
  /** 0..1 raw progress across the whole scroll track */
  progress: number;
  phase: PhaseId;
  /** 0..1 within the current phase */
  phaseProgress: number;
  /** scroll velocity (sign = direction) for prefetch bias */
  velocity: number;
  /** the sanctum finale video (statues → product tins) */
  finale: { status: FinaleStatus; scent?: ScentId };
  /** highest fully-fetched asset tier (-1 = nothing yet) */
  tier: number;
  /** the Loader has dismissed — the film may accept input */
  loaded: boolean;
}

export const experienceStore = createStore<ExperienceState>(() => ({
  progress: 0,
  phase: "morph",
  phaseProgress: 0,
  velocity: 0,
  finale: { status: "idle" },
  tier: -1,
  loaded: false,
}));

/** Pure: raw track progress → { phase, phaseProgress }. */
export function locate(progress: number): {
  phase: PhaseId;
  phaseProgress: number;
} {
  const pos = progress * TOTAL_SPAN;
  let acc = 0;
  for (const p of PHASES) {
    if (pos < acc + p.span) {
      return { phase: p.id, phaseProgress: (pos - acc) / p.span };
    }
    acc += p.span;
  }
  return { phase: "sanctum", phaseProgress: 1 };
}

/* ---- finale actions (guarded state machine) -------------------------- */

export function startFinale(): void {
  const s = experienceStore.getState();
  if (s.finale.status !== "idle" || s.phase !== "sanctum") return;
  experienceStore.setState({ finale: { status: "playing" } });
}

export function finaleEnded(): void {
  const s = experienceStore.getState().finale;
  if (s.status !== "playing") return;
  experienceStore.setState({ finale: { status: "ended" } });
}

/** Scrolling back out of the sanctum rewinds the finale. */
export function resetFinale(): void {
  const s = experienceStore.getState().finale;
  if (s.status !== "playing" && s.status !== "ended") return;
  experienceStore.setState({ finale: { status: "idle" } });
}

export function beginNavigate(scent: ScentId): void {
  const s = experienceStore.getState().finale;
  if (s.status !== "ended") return;
  experienceStore.setState({ finale: { status: "navigating", scent } });
}

/** Frame-rate independent exponential smoothing toward a target. */
export function damp(
  current: number,
  target: number,
  lambda: number,
  dtSeconds: number,
): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dtSeconds));
}
