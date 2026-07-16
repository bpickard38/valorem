"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

/*
 * The guided run. The film is 590vh of scroll and viewers were stalling in the
 * middle of it, never reaching the product — so the first scroll, however
 * small, hands the track over and carries them to the finale.
 *
 * A deliberate scroll UP takes control back; scrolling down never cancels,
 * because the momentum of the very flick that started the run is downward.
 * That's also why ScrollToPlugin's autoKill is off — it can't tell the two
 * apart.
 *
 * No load gate needed: Loader pins body overflow until the opening tier is
 * fetched, so this can't arm before the film can play. Voyage frames stream
 * during the run, and the morph fills the first ~20% of the track, giving
 * them a head start; the canvas holds its nearest decoded frame rather than
 * awaiting, so a slow connection stutters instead of stalling.
 */

/** Top of the film to the product. One knob — tune to taste. */
const RUN_SECONDS = 12;
/** "Even a little scroll" is the whole point; this is just past noise. */
const ARM_AT_Y = 4;
/** Finger travel in px (downward drag = scrolling up) that counts as taking over. */
const TOUCH_CANCEL = 24;

let tween: gsap.core.Tween | null = null;
let spent = false;

export function cancelAutoPlay(): void {
  tween?.kill();
  tween = null;
}

function run(): void {
  spent = true;
  tween = gsap.to(window, {
    // power1.inOut is load-bearing, not decoration: the rig scrubs at 1s over
    // a DAMP=6 playhead, so the film trails the scroll. Easing out lets the
    // two converge before the end, so the finale doesn't arm over a film
    // that's still moving.
    scrollTo: { y: "max", autoKill: false },
    duration: RUN_SECONDS,
    ease: "power1.inOut",
    onComplete: () => {
      tween = null;
    },
  });
}

/** Straight to the product (Skip to Shop). */
export function jumpToFilmEnd(): void {
  cancelAutoPlay();
  spent = true;
  window.scrollTo({ top: ScrollTrigger.maxScroll(window), behavior: "instant" });
}

/** Back to frame one (the docked logo). Re-arms: a fresh scroll should carry
 *  them through again. */
export function jumpToFilmStart(): void {
  cancelAutoPlay();
  spent = false;
  window.scrollTo({ top: 0, behavior: "instant" });
}

export function AutoPlay() {
  useEffect(() => {
    // globals.css sets scroll-behavior:smooth for /deity's anchor links, but
    // it fights ScrollToPlugin: the tween writes a scroll target every frame
    // and the browser tries to smooth-animate to each one, which stalls the
    // run. The film has no anchors, so turn it off for as long as we're here.
    const root = document.documentElement;
    const prevBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";

    const onScroll = () => {
      if (spent || tween) return;
      if (window.scrollY > ARM_AT_Y) run();
    };
    const onWheel = (e: WheelEvent) => {
      if (tween && e.deltaY < 0) cancelAutoPlay();
    };
    const onKey = (e: KeyboardEvent) => {
      if (!tween) return;
      if (e.key === "ArrowUp" || e.key === "PageUp" || e.key === "Home") {
        cancelAutoPlay();
      }
    };
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? 0;
      if (tween && y - touchY > TOUCH_CANCEL) cancelAutoPlay();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    return () => {
      cancelAutoPlay();
      spent = false;
      root.style.scrollBehavior = prevBehavior;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  return null;
}
