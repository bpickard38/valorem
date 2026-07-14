"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { PHASES, TOTAL_SPAN } from "./phases";
import { experienceStore, locate } from "./state";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const DEV = process.env.NODE_ENV === "development";

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
      tl.fromTo(
        "[data-logo-lockup]",
        { autoAlpha: 0, scale: 0.97 },
        { autoAlpha: 1, scale: 1, duration: 18, ease: "power2.out" },
        "morph+=95",
      );
      tl.to(
        "[data-logo-lockup]",
        { autoAlpha: 0, duration: 14 },
        "descent+=25",
      );
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
