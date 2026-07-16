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
  morph: "linear-gradient(180deg,#8fadd0 0%,#dfe6ee 65%,#f2f0ea 100%)",
  voyage: "linear-gradient(180deg,#e8ecf0 0%,#b8c8dc 35%,#6b6459 70%,#241f18 100%)",
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
        // Plates stack in PHASES order, so a later one paints over an earlier
        // one: fade the CURRENT plate in over the first 15% of its OWN phase
        // and let the previous hold underneath.
        //
        // Not the other way round. Pre-fading the NEXT plate in over the last
        // 15% of the current phase pulled the voyage's brown gradient up behind
        // the morph — which is an alpha cutout, so the plate IS the background —
        // at exactly the point the logo settles (morph 83-97%). That was the
        // brown wash under the mark.
        if (i === idx) alpha = idx === 0 ? 1 : Math.min(1, phaseProgress / 0.15);
        else if (i === idx - 1) alpha = 1;
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
          style={{ background: PLATE_STYLES[p.id], opacity: p.id === "morph" ? 1 : 0 }}
        />
      ))}
    </div>
  );
}
