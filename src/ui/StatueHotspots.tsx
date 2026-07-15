"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { experienceStore, revealStatue, type RevealScent } from "@/experience/state";
import { statueScreenRect } from "@/experience/sanctumConfig";
import { SCENTS } from "@/lib/site";

/*
 * Two real <button>s pinned over the statues in the held doors frame.
 * Positions are projected through the same cover-fit crop the film canvas
 * draws with, so they track the statues across resizes and orientations.
 * Active only once the scroll track has settled into the sanctum.
 */

const SCENT_IDS: RevealScent[] = ["poseidon", "aphrodite"];

export function StatueHotspots() {
  const [armed, setArmed] = useState(false);
  const refs = useRef(new Map<RevealScent, HTMLButtonElement>());

  useEffect(() => {
    const tick = () => {
      const s = experienceStore.getState();
      const on =
        s.phase === "sanctum" &&
        s.phaseProgress > 0.9 &&
        s.sanctum.status === "idle";
      setArmed((prev) => (prev === on ? prev : on));
      if (!on) return;
      for (const id of SCENT_IDS) {
        const el = refs.current.get(id);
        if (!el) continue;
        const r = statueScreenRect(id, window.innerWidth, window.innerHeight);
        el.style.left = `${r.x}px`;
        el.style.top = `${r.y}px`;
        el.style.width = `${Math.max(44, r.w)}px`;
        el.style.height = `${Math.max(44, r.h)}px`;
      }
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-30 transition-opacity duration-700 ${
        armed ? "pointer-events-none opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!armed}
    >
      {SCENT_IDS.map((id) => {
        const s = SCENTS[id];
        return (
          <button
            key={id}
            ref={(el) => {
              if (el) refs.current.set(id, el);
            }}
            type="button"
            tabIndex={armed ? 0 : -1}
            aria-label={`Discover ${s.name} — ${s.notes.join(", ")}`}
            onClick={() => revealStatue(id)}
            className="group absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer focus:outline-none"
            style={{ pointerEvents: armed ? "auto" : "none" }}
          >
            {/* halo */}
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/70 transition-transform duration-500 group-hover:scale-125 group-focus-visible:scale-125 animate-[haloPulse_3s_ease-in-out_infinite]"
            />
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold"
            />
            {/* name on hover/focus */}
            <span className="label-engraved absolute left-1/2 top-[calc(50%+3rem)] -translate-x-1/2 whitespace-nowrap text-ivory opacity-0 transition-opacity duration-300 [text-shadow:0_1px_10px_rgba(26,25,23,.6)] group-hover:opacity-100 group-focus-visible:opacity-100">
              {s.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
