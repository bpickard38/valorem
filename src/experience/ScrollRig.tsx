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
        // Center on the MARK: the wordmark is out of flow, so dock.offsetHeight
        // is the mark's height and yPercent:-50 keeps the mark screen-centered.
        gsap.set(dock, { xPercent: -50, yPercent: -50 });
        // Settle: the mark's CSS size (h-[104vh]) already matches the film
        // silhouette, so this is scale 1 — just fade it in over the clouds
        // as the baked pegasus dissolves out. Wordmark stays hidden here.
        tl.fromTo(
          dock,
          { autoAlpha: 0, scale: 1.02 },
          { autoAlpha: 1, scale: 1, duration: 16, ease: "power2.out" },
          "morph+=100",
        );
        const DOCK_SCALE = 0.13;
        const DOCK_TOP = 26; // px from viewport top to the docked mark's top
        tl.to(
          dock,
          {
            scale: DOCK_SCALE,
            // Function-based → invalidateOnRefresh recomputes on resize, so
            // the docked mark stays glued to top-center at any viewport.
            y: () =>
              -(
                window.innerHeight / 2 -
                DOCK_TOP -
                (dock.offsetHeight * DOCK_SCALE) / 2
              ),
            duration: 55,
            ease: "power1.inOut",
          },
          "voyage+=5",
        );
        // VALOREM + subline fade in as the shrink begins and ride down with
        // the mark into the docked header.
        tl.fromTo(
          "[data-logo-word]",
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 22, ease: "power1.out" },
          "voyage+=8",
        );
      }
      tl.fromTo(
        "[data-copy='voyage']",
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 20, ease: "power2.out" },
        "voyage+=60",
      );
      tl.to("[data-copy='voyage']", { autoAlpha: 0, duration: 16 }, "voyage+=170");
      tl.fromTo(
        "[data-copy='collection']",
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 20, ease: "power2.out" },
        "voyage+=370",
      );
      // Clear the frame before the sanctum finale video takes over.
      tl.to("[data-copy='collection']", { autoAlpha: 0, duration: 12 }, "voyage+=415");
    },
    { scope: track },
  );

  return (
    <div ref={track} style={{ height: `${TOTAL_SPAN}vh` }}>
      {children}
    </div>
  );
}
