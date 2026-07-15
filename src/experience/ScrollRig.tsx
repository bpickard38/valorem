"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { PHASES, TOTAL_SPAN } from "./phases";
import { experienceStore, locate } from "./state";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const DEV = process.env.NODE_ENV === "development";

// Dev-only: lets headless checks drive gsap.ticker.tick() when the tab is
// backgrounded (rAF frozen) to verify scrubbed states numerically.
if (DEV && typeof window !== "undefined") {
  (window as unknown as { __gsap?: typeof gsap }).__gsap = gsap;
}

/*
 * The master rig: one tall scroll track, one scrubbed timeline, labels per
 * phase. The timeline's length is TOTAL_SPAN units so label offsets read in
 * vh (e.g. "morph+=95" = 95vh of scroll after the morph label).
 *
 * All visual layers are position:fixed children — the track only provides
 * scroll length. Canvas/WebGL layers read the store; DOM overlay beats are
 * tweened here, riding the same timecode.
 */
export function ScrollRig({ children }: { children: ReactNode }) {
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({
        defaults: { ease: "none" }, // scrubbed master = linear time
        scrollTrigger: {
          trigger: track.current,
          start: "top top",
          // Track bottom meeting viewport bottom = exactly the max scrollable
          // distance (track height − one viewport). Never use the raw track
          // height here — the last viewport-height of it can't be scrolled.
          end: "bottom bottom",
          scrub: 1, // 1s catch-up = the cinematic inertia
          invalidateOnRefresh: true,
          markers: DEV,
          onUpdate(self) {
            const { phase, phaseProgress } = locate(self.progress);
            experienceStore.setState({
              progress: self.progress,
              phase,
              phaseProgress,
              velocity: self.getVelocity() / 1000,
            });
          },
        },
      });

      // Labels at cumulative vh positions.
      let t = 0;
      for (const p of PHASES) {
        tl.addLabel(p.id, t);
        t += p.span;
      }
      tl.to({}, { duration: TOTAL_SPAN }, 0); // give the timeline its length

      // --- DOM overlay beats (eases allowed inside the scrub) -------------
      tl.fromTo(
        "[data-copy='hero']",
        { autoAlpha: 1 },
        { autoAlpha: 0, duration: 30 },
        "hero+=55",
      );
      // Logo dock: assembles over the clouds as the film silhouette fades
      // (morph fadeTail), then shrinks as one unit and pins top-center as
      // the persistent brand header for the rest of the journey.
      const dock = document.querySelector<HTMLElement>("[data-logo-dock]");
      if (dock) {
        gsap.set(dock, { xPercent: -50, yPercent: -50 });
        // Settle size: the lockup appears AS BIG as the film silhouette it
        // replaces — composite scaled to the full viewport height (width-
        // guarded for portrait) — then shrinks continuously down to the dock.
        const mark = dock.querySelector<HTMLElement>("img");
        const bigScale = () =>
          Math.min(
            window.innerHeight / dock.offsetHeight,
            (0.9 * window.innerWidth) / (mark?.offsetWidth || 1),
          );
        tl.fromTo(
          dock,
          { autoAlpha: 0, scale: () => bigScale() * 0.97 },
          {
            autoAlpha: 1,
            scale: bigScale,
            duration: 16,
            ease: "power2.out",
          },
          "morph+=100",
        );
        const DOCK_SCALE = 0.16;
        const DOCK_TOP = 30; // px from viewport top to the scaled lockup's top
        tl.to(
          dock,
          {
            scale: DOCK_SCALE,
            // Function-based → invalidateOnRefresh recomputes on resize, so
            // the docked lockup stays glued to top-center at any viewport.
            y: () =>
              -(
                window.innerHeight / 2 -
                DOCK_TOP -
                (dock.offsetHeight * DOCK_SCALE) / 2
              ),
            duration: 55,
            ease: "power1.inOut",
          },
          "descent+=5",
        );
        tl.to(
          "[data-logo-subline]",
          { autoAlpha: 0, duration: 14 },
          "descent+=5",
        );
      }
      tl.fromTo(
        "[data-copy='descent']",
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 20, ease: "power2.out" },
        "descent+=60",
      );
      tl.to("[data-copy='descent']", { autoAlpha: 0, duration: 16 }, "approach+=20");
      tl.fromTo(
        "[data-copy='doors']",
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 20, ease: "power2.out" },
        "doors+=70",
      );
      tl.fromTo(
        "[data-copy='sanctum']",
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 20 },
        "sanctum+=10",
      );
    },
    { scope: track },
  );

  return (
    <div ref={track} style={{ height: `${TOTAL_SPAN}vh` }}>
      {children}
    </div>
  );
}
