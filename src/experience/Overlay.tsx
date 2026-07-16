"use client";

import { useSyncExternalStore } from "react";
import { jumpToFilmStart } from "./AutoPlay";
import { DOCK_SETTLE_AT, phaseRange, TOTAL_SPAN } from "./phases";
import { experienceStore } from "./state";

/*
 * DOM copy layer. Elements are tweened by ScrollRig at timeline labels via
 * their data attributes — this component only renders them (hidden states are
 * set by GSAP autoAlpha). pointer-events stay off except interactive children.
 */

/** Track position where the dock finishes shrinking into the corner. */
const DOCKED_AT = phaseRange("voyage").start + DOCK_SETTLE_AT;
const readDocked = () =>
  experienceStore.getState().progress * TOTAL_SPAN >= DOCKED_AT;

export function Overlay() {
  // The mark is FULL-SCREEN while it settles over the clouds; it only becomes
  // a clickable corner logo once the shrink has landed. Gating on the store
  // (not GSAP) is what lets tabIndex follow too — pointer-events alone would
  // leave a full-screen button sitting in the tab order. The snapshot is a
  // boolean, so this only re-renders on the one flip, not on every scroll tick.
  const docked = useSyncExternalStore(
    experienceStore.subscribe,
    readDocked,
    () => false,
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-30">
      {/* HERO */}
      <div
        data-copy="hero"
        className="absolute inset-x-0 top-[16%] mx-auto max-w-2xl px-6 text-center"
      >
        <p className="label-engraved text-charcoal/60">Valorem</p>
        <h1 className="type-display mt-6 text-charcoal">
          Fragrance, in its most permanent form.
        </h1>
        <p className="mt-5 text-sm tracking-wide text-charcoal/65">
          Carried, not sprayed.
        </p>
      </div>

      {/* Scroll hint */}
      <div
        data-copy="hero"
        className="absolute inset-x-0 bottom-10 text-center"
      >
        {/* inline font-size: .label-engraved sets its own and wins the
            cascade over a Tailwind utility */}
        <span className="label-engraved text-charcoal/60" style={{ fontSize: "1rem" }}>
          Scroll
        </span>
      </div>

      {/* MORPH settle → dock. The pegasus MARK matches the film silhouette's
          size at settle (wordmark hidden); as the whole thing shrinks into the
          top-left corner, VALOREM + subline fade in beneath it and ride along,
          becoming the persistent brand header — and the way back to the start.
          GSAP owns the transform (centering + x/y/scale). The wordmark is out
          of flow so it never shifts the mark off-center, and so dock.offsetHeight
          stays equal to the mark's — which ScrollRig's dock math depends on. */}
      <div
        data-logo-dock
        className="absolute left-1/2 top-1/2 opacity-0 will-change-transform"
      >
        <button
          type="button"
          onClick={jumpToFilmStart}
          aria-label="Valorem — back to the start"
          tabIndex={docked ? 0 : -1}
          style={{ pointerEvents: docked ? "auto" : "none" }}
          className="block cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
        >
          {/* The mark is trimmed tight to the horse, so its height IS the
              horse's — and the film's silhouette measures 0.9741 of the frame
              height (scripts/make-brand-mark.mjs prints both). Sized against
              --film-h rather than the viewport because once a narrow screen
              letterboxes the film, the silhouette is no longer viewport height;
              on a normal desktop --film-h resolves to 100vh. */}
          {/* eslint-disable-next-line @next/next/no-img-element -- animated, scaled element; next/image adds nothing here */}
          <img
            data-logo-mark
            src="/brand/pegasus-mark-v2.png"
            alt=""
            draggable={false}
            className="block h-[calc(var(--film-h)*0.9741)] w-auto max-w-[104vw] select-none object-contain"
          />
          <div
            data-logo-word
            className="absolute left-1/2 top-full -translate-x-1/2 whitespace-nowrap text-center opacity-0"
          >
            <p className="type-display leading-none text-charcoal">VALOREM</p>
            <div className="mx-auto mt-3 h-px w-12 bg-gold/80" />
            <p className="label-engraved mt-3 text-charcoal/55">
              Solid Fragrance
            </p>
          </div>
        </button>
      </div>

      {/* VOYAGE — sits below the docked brand header */}
      {/* (The "The House" and "Collection" copy beats that floated over the
          voyage were cut — the collection line now lives in the Finale,
          centered between the two tins.) */}
    </div>
  );
}
