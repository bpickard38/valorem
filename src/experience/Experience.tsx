"use client";

import { useSyncExternalStore } from "react";
import { ScrollRig } from "./ScrollRig";
import { GrayboxPlates } from "./GrayboxPlates";
import { Overlay } from "./Overlay";
import { DebugHud } from "./DebugHud";
import { AutoPlay, jumpToFilmEnd } from "./AutoPlay";
import { experienceStore } from "./state";
import { SequenceCanvas } from "@/sequence/SequenceCanvas";
import { Stage } from "@/three/Stage";
import { Loader } from "@/ui/Loader";
import { Finale } from "@/ui/Finale";

/*
 * Composition root for the cinematic journey. Layer order (bottom → top):
 *   z-0   GrayboxPlates — sky plates under the film
 *   z-4   Film backdrop — blurred fill behind a letterboxed band
 *   z-5   SequenceCanvas — the baked film
 *   z-8   Finale video (statues → tins) — under the grain pass
 *   z-10  R3F Stage — clouds, grain
 *   z-30  Overlay — DOM copy · logo dock · Finale shop overlay
 *   z-40  Loader (until T0 fetched)
 *   z-50  SkipToShop
 *   z-60  DebugHud (dev)
 */
export default function Experience() {
  return (
    <ScrollRig>
      <GrayboxPlates />
      <SequenceCanvas />
      <Stage />
      <Overlay />
      <Finale />
      <Loader />
      <AutoPlay />
      <SkipToShop />
      <DebugHud />
    </ScrollRig>
  );
}

const readAtShop = () => experienceStore.getState().phase === "sanctum";

function SkipToShop() {
  // Meaningless once they're there — and it would sit on top of the finale.
  const atShop = useSyncExternalStore(
    experienceStore.subscribe,
    readAtShop,
    () => false,
  );

  return (
    <nav
      className={`fixed right-5 top-5 z-50 transition-opacity duration-500 ${
        atShop ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      {/* Jumps to the end of the track rather than routing away, so the finale
          still plays its statues → product animation. The scrub catches up
          over ~1s underneath, which reads as a whoosh. */}
      <button
        type="button"
        onClick={jumpToFilmEnd}
        tabIndex={atShop ? -1 : 0}
        className="label-engraved cursor-pointer bg-ivory/70 px-4 py-2 text-charcoal/70 backdrop-blur-sm transition-colors hover:text-gold"
      >
        Skip to Shop
      </button>
    </nav>
  );
}
