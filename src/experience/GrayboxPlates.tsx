"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { PHASES, type PhaseId } from "./phases";
import { experienceStore } from "./state";

/*
 * M1 graybox stand-in for SequenceCanvas + Stage: one fixed plate per phase,
 * cross-faded by phase-local progress so the full journey can be scrubbed and
 * timed before any real footage exists. Deleted when the real layers land.
 */

const PLATE_STYLES: Record<PhaseId, string> = {
  hero: "linear-gradient(180deg,#9db8d4 0%,#e8ecf0 70%,#f7f4ee 100%)",
  morph: "linear-gradient(180deg,#8fadd0 0%,#dfe6ee 65%,#f2f0ea 100%)",
  descent: "linear-gradient(180deg,#e8ecf0 0%,#b9c9a8 60%,#8fa07a 100%)",
  approach: "linear-gradient(180deg,#b8c8dc 0%,#d8d2bd 55%,#a9a184 100%)",
  doors: "linear-gradient(180deg,#6b6459 0%,#3a352c 60%,#241f18 100%)",
  sanctum: "linear-gradient(180deg,#f0e9dc 0%,#d9cba8 55%,#8a6f3d 100%)",
};

export function GrayboxPlates() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current!;
    const layers = new Map<PhaseId, HTMLElement>();
    el.querySelectorAll<HTMLElement>("[data-plate]").forEach((n) => {
      layers.set(n.dataset.plate as PhaseId, n);
    });

    const tick = () => {
      const { phase, phaseProgress } = experienceStore.getState();
      const idx = PHASES.findIndex((p) => p.id === phase);
      for (const [id, node] of layers) {
        const i = PHASES.findIndex((p) => p.id === id);
        let alpha = 0;
        if (i === idx) alpha = 1;
        // fade the next plate in over the last 15% of the current phase
        else if (i === idx + 1) alpha = Math.max(0, (phaseProgress - 0.85) / 0.15);
        node.style.opacity = String(alpha);
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  return (
    <div ref={root} className="fixed inset-0 z-0" aria-hidden="true">
      {PHASES.map((p) => (
        <div
          key={p.id}
          data-plate={p.id}
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: PLATE_STYLES[p.id], opacity: p.id === "hero" ? 1 : 0 }}
        />
      ))}
    </div>
  );
}
