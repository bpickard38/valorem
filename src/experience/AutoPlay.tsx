"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { experienceStore } from "./state";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

/*
 * The guided run. The film is 590vh of scroll and viewers were stalling in the
 * middle of it, never reaching the product — so a downward input at the TOP of
 * the track hands it over and carries them to the finale.
 *
 * It arms on the INPUT (wheel/key/touch), never on scroll position — a scroll
 * that moved without a gesture we saw (restoration, programmatic) must not
 * start the film. It's re-armable: any time the viewer is back at frame one
 * (scrollY within TOP_ZONE — e.g. after the docked logo jump), the next
 * downward gesture runs it again. Mid-track gestures never arm; a deliberate
 * UP takes control back. Down never cancels, because the momentum of the very
 * flick that started the run is downward — which is also why ScrollToPlugin's
 * autoKill is off, it can't tell the two apart.
 *
 * Voyage frames stream during the run, and the morph fills the first ~20% of
 * the track, giving them a head start; the canvas holds its nearest decoded
 * frame rather than awaiting, so a slow connection stutters instead of stalls.
 */

/** Top of the film to the product. One knob — tune to taste. */
const RUN_SECONDS = 12;
/** "At the top of the page" — anything within this many px still counts. */
const TOP_ZONE = 8;
/** Finger travel in px (downward drag = scrolling up) that counts as taking over. */
const TOUCH_CANCEL = 24;

let tween: gsap.core.Tween | null = null;

export function cancelAutoPlay(): void {
  tween?.kill();
  tween = null;
}

function run(): void {
  tween = gsap.to(window, {
    scrollTo: { y: "max", autoKill: false },
    duration: RUN_SECONDS,
    // Linear on purpose. An inOut ease covered only ~1.4% in its first second,
    // which reads as "it never took over" — you scroll, nothing moves, you
    // scroll again. But an `out` ease overcorrects the other way: it'd burn
    // 16% in that same second and rush the whole pegasus→logo morph in ~1.3s,
    // which is the one moment worth watching. Constant speed gives the morph
    // ~2.4s and the voyage ~8.8s, and it moves the instant it starts.
    // Smoothing isn't this tween's job anyway — the rig already scrubs at 1s
    // over a DAMP=6 playhead, which both softens the motion and glides the
    // film to a stop after the scroll lands.
    ease: "none",
    onComplete: () => {
      tween = null;
    },
  });
}

/** Ready once the Loader has dismissed AND the opening tier is fetched (the
 *  failsafe can dismiss the Loader with nothing playable yet). Wheel/key
 *  events fire straight through the Loader's overflow lock — arming on those
 *  would start a film that can't move. */
function filmReady(): boolean {
  const s = experienceStore.getState();
  return s.loaded && s.tier >= 0;
}

function armFromIntent(): void {
  if (tween || !filmReady()) return;
  if (window.scrollY > TOP_ZONE) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  run();
}

/** Straight to the product (Skip to Shop). */
export function jumpToFilmEnd(): void {
  cancelAutoPlay();
  window.scrollTo({ top: ScrollTrigger.maxScroll(window), behavior: "instant" });
}

/** Back to frame one (the docked logo). Landing at scrollY 0 re-arms: a fresh
 *  scroll carries them through again. */
export function jumpToFilmStart(): void {
  cancelAutoPlay();
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

    // Reloads must open on frame one. The browser's own restoration would
    // drop the film mid-track behind the Loader — the page feels frozen, and
    // the first input afterwards reads as a jump to wherever it left off.
    // Mount-only on purpose: bfcache restores (Back from checkout) skip this
    // effect and correctly keep their position.
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    // Leaving the page mid-run (checkout, browser chrome) must not leave a
    // live tween behind for a bfcache restore to resume.
    const onPageHide = () => cancelAutoPlay();

    const onWheel = (e: WheelEvent) => {
      if (tween) {
        if (e.deltaY < 0) cancelAutoPlay();
        return;
      }
      if (e.deltaY > 0) armFromIntent();
    };
    const DOWN_KEYS = ["ArrowDown", "PageDown", "End", " ", "Spacebar"];
    const UP_KEYS = ["ArrowUp", "PageUp", "Home"];
    const onKey = (e: KeyboardEvent) => {
      if (tween) {
        if (UP_KEYS.includes(e.key)) cancelAutoPlay();
        return;
      }
      if (DOWN_KEYS.includes(e.key)) armFromIntent();
    };
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      const dy = (e.touches[0]?.clientY ?? 0) - touchY;
      if (tween) {
        if (dy > TOUCH_CANCEL) cancelAutoPlay(); // finger down = scrolling up
        return;
      }
      if (dy < -TOUCH_CANCEL) armFromIntent(); // finger up = scrolling down
    };

    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    return () => {
      cancelAutoPlay();
      root.style.scrollBehavior = prevBehavior;
      if ("scrollRestoration" in history) history.scrollRestoration = "auto";
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  return null;
}
