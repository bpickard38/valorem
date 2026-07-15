import { createStore } from "zustand/vanilla";
import { PHASES, TOTAL_SPAN, type PhaseId } from "./phases";

/*
 * Transient experience state. ScrollTrigger writes on scroll; the canvas draw
 * loop and R3F useFrame read imperatively via experienceStore.getState() —
 * no React re-renders on the hot path. React components that need phase
 * changes subscribe selectively.
 */

export type RevealStatus = "idle" | "revealing" | "revealed" | "navigating";
export type RevealScent = "aphrodite" | "poseidon";

export interface ExperienceState {
  /** 0..1 raw progress across the whole scroll track */
  progress: number;
  phase: PhaseId;
  /** 0..1 within the current phase */
  phaseProgress: number;
  /** scroll velocity (sign = direction) for prefetch bias */
  velocity: number;
  sanctum: { status: RevealStatus; scent?: RevealScent };
  /** highest fully-fetched asset tier (-1 = nothing yet) */
  tier: number;
}

export const experienceStore = createStore<ExperienceState>(() => ({
  progress: 0,
  phase: "hero",
  phaseProgress: 0,
  velocity: 0,
  sanctum: { status: "idle" },
  tier: -1,
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

/* ---- sanctum actions (guarded state machine) ------------------------- */

export function revealStatue(scent: RevealScent): void {
  const s = experienceStore.getState();
  if (s.sanctum.status !== "idle" || s.phase !== "sanctum") return;
  experienceStore.setState({ sanctum: { status: "revealing", scent } });
}

export function revealComplete(): void {
  const s = experienceStore.getState().sanctum;
  if (s.status !== "revealing") return;
  experienceStore.setState({ sanctum: { status: "revealed", scent: s.scent } });
}

export function closeReveal(): void {
  const s = experienceStore.getState().sanctum;
  if (s.status === "idle" || s.status === "navigating") return;
  experienceStore.setState({ sanctum: { status: "idle" } });
}

export function beginNavigate(): void {
  const s = experienceStore.getState().sanctum;
  if (s.status !== "revealed") return;
  experienceStore.setState({ sanctum: { status: "navigating", scent: s.scent } });
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
