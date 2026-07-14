"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { experienceStore } from "./state";

/* Dev-only readout: phase / local % / global % / velocity. Writes textContent
 * directly from the ticker — zero React re-renders. */
export function DebugHud() {
  const el = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const tick = () => {
      const s = experienceStore.getState();
      if (el.current) {
        el.current.textContent =
          `phase   ${s.phase}\n` +
          `local   ${(s.phaseProgress * 100).toFixed(1)}%\n` +
          `global  ${(s.progress * 100).toFixed(1)}%\n` +
          `vel     ${s.velocity.toFixed(2)}\n` +
          `reveal  ${s.sanctum.status}`;
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  if (process.env.NODE_ENV !== "development") return null;
  return (
    <pre
      ref={el}
      className="fixed left-3 top-3 z-[60] bg-charcoal/80 p-3 font-mono text-[11px] leading-relaxed text-ivory"
    />
  );
}
