"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/*
 * Film lifecycle + the two programmatic jumps. The guided auto-run that used
 * to live here is gone — viewers scrub the film themselves; Skip to Shop and
 * the docked logo remain the shortcuts to either end.
 */

/** Straight to the product (Skip to Shop). */
export function jumpToFilmEnd(): void {
  window.scrollTo({ top: ScrollTrigger.maxScroll(window), behavior: "instant" });
}

/** Back to frame one (the docked logo). */
export function jumpToFilmStart(): void {
  window.scrollTo({ top: 0, behavior: "instant" });
}

export function AutoPlay() {
  useEffect(() => {
    // globals.css sets scroll-behavior:smooth for /deity's anchor links; the
    // film's programmatic jumps must be instant, so neutralize it here.
    const root = document.documentElement;
    const prevBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";

    // Reloads must open on frame one. The browser's own restoration would
    // drop the film mid-track behind the Loader — the page feels frozen at a
    // frame the viewer never chose. Mount-only on purpose: bfcache restores
    // (Back from checkout) skip this effect and correctly keep their position.
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    return () => {
      root.style.scrollBehavior = prevBehavior;
      if ("scrollRestoration" in history) history.scrollRestoration = "auto";
    };
  }, []);

  return null;
}
