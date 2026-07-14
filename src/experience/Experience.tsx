"use client";

import Link from "next/link";
import { ScrollRig } from "./ScrollRig";
import { GrayboxPlates } from "./GrayboxPlates";
import { Overlay } from "./Overlay";
import { DebugHud } from "./DebugHud";
import { SequenceCanvas } from "@/sequence/SequenceCanvas";
import { Stage } from "@/three/Stage";
import { Loader } from "@/ui/Loader";

/*
 * Composition root for the cinematic journey. Layer order (bottom → top):
 *   z-0   GrayboxPlates — graybox fallback under the film (hero keeps it)
 *   z-5   SequenceCanvas — the baked film
 *   z-10  (M3+) R3F Stage — clouds, pegasus, particles, grain
 *   z-30  Overlay — DOM copy · StatueHotspots · ProductReveal
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
      <Loader />
      <SkipToShop />
      <DebugHud />
    </ScrollRig>
  );
}

function SkipToShop() {
  return (
    <nav className="fixed right-5 top-5 z-50">
      <Link
        href="/product/aphrodite"
        className="label-engraved bg-ivory/70 px-4 py-2 text-charcoal/70 backdrop-blur-sm transition-colors hover:text-gold"
      >
        Skip to Shop
      </Link>
    </nav>
  );
}
