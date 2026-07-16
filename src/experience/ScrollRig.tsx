"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  DOCK_RUN,
  DOCK_START_AT,
  FILM_ASPECT,
  PHASES,
  SILHOUETTE,
  TOTAL_SPAN,
} from "./phases";
import { experienceStore, locate } from "./state";
import { filmHeight, stageSize, syncFilmVars } from "@/sequence/coverFit";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Inset of the docked mark from the top-left corner, px. */
const DOCK_PAD = 20;

/*
 * The dock's containing block is the Overlay's `fixed inset-0` box — see
 * stageSize(). Measuring these offsets from innerWidth/2 parks the mark half a
 * scrollbar (~7-8px) off the corner on Windows and Linux, while looking
 * perfect on overlay-scrollbar platforms.
 */
const stageW = () => stageSize().w;
const stageH = () => stageSize().h;

/** Docked mark height, px. A fixed scale can't work across viewports any more:
 *  the mark is sized against the film (--film-h), so on a letterboxed phone
 *  it starts far smaller than on desktop and one ratio would dock it at ~29px.
 *  Target a height instead and let the scale fall out. */
function dockHeight(): number {
  return Math.min(140, Math.max(56, stageW() * 0.09));
}

/*
 * Where the dock has to sit so the DOM horse lands ON the film's horse at the
 * hand-off, rather than in the middle of the screen. The film frame is always
 * centred in the viewport (cover crops symmetrically, contain letterboxes
 * symmetrically), so the silhouette's offset from the frame centre scales
 * straight off --film-h.
 */
const settleX = () => {
  const h = filmHeight(stageW(), stageH());
  return (SILHOUETTE.cx - 0.5) * (h * FILM_ASPECT);
};
const settleY = () => (SILHOUETTE.cy - 0.5) * filmHeight(stageW(), stageH());

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
      // The dock's tweens read offsetHeight, which now depends on --film-h.
      // ScrollTrigger's own resize handling and a plain resize listener would
      // race, so publish the var from inside the refresh instead — refreshInit
      // runs before function-based values are re-solved. Also covers mount.
      ScrollTrigger.addEventListener("refreshInit", syncFilmVars);
      syncFilmVars();

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
      // Opening title, over the held pegasus frame. Clears early — the logo
      // dock starts settling at morph+=100.
      tl.fromTo(
        "[data-copy='hero']",
        { autoAlpha: 1 },
        { autoAlpha: 0, duration: 26 },
        "morph+=8",
      );
      // Logo dock: assembles over the clouds as the film silhouette fades
      // (morph fadeTail), then shrinks as one unit into the top-LEFT corner,
      // where it stays as the brand header and the way back to the start.
      const dock = document.querySelector<HTMLElement>("[data-logo-dock]");
      if (dock) {
        // Center on the MARK: the wordmark is out of flow, so dock.offsetHeight
        // is the mark's height and yPercent:-50 keeps the mark screen-centered.
        gsap.set(dock, { xPercent: -50, yPercent: -50 });
        // Settle: the mark's CSS size already matches the film silhouette's
        // height, so this is scale 1 — just fade it in over the clouds as the
        // baked pegasus dissolves out. x/y are pinned to the silhouette (which
        // is off-centre in frame) on BOTH sides of the fromTo, so the mark
        // holds still on top of the film instead of drifting into place.
        // Wordmark stays hidden here.
        tl.fromTo(
          dock,
          { autoAlpha: 0, scale: 1.02, x: settleX, y: settleY },
          {
            autoAlpha: 1,
            scale: 1,
            x: settleX,
            y: settleY,
            duration: 16,
            ease: "power2.out",
          },
          "morph+=100",
        );
        // x/y are offsets FROM the centered position (xPercent/yPercent own
        // the centering), so each is half the viewport minus the padding and
        // half the docked size. All three are function-based, so
        // invalidateOnRefresh re-solves them on resize and rotation.
        const dockScale = () => dockHeight() / dock.offsetHeight;
        tl.to(
          dock,
          {
            scale: dockScale,
            x: () =>
              -(stageW() / 2 - DOCK_PAD - (dock.offsetWidth * dockScale()) / 2),
            y: () =>
              -(stageH() / 2 - DOCK_PAD - (dock.offsetHeight * dockScale()) / 2),
            duration: DOCK_RUN,
            ease: "power1.inOut",
          },
          `voyage+=${DOCK_START_AT}`,
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

      return () => {
        ScrollTrigger.removeEventListener("refreshInit", syncFilmVars);
      };
    },
    { scope: track },
  );

  return (
    <div ref={track} style={{ height: `${TOTAL_SPAN}vh` }}>
      {children}
    </div>
  );
}
