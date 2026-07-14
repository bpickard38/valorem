"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { CloudLayers } from "./CloudLayers";
import { PegasusPlane } from "./PegasusPlane";
import { GrainVignette } from "./GrainVignette";

/*
 * The live WebGL layer above the baked film: sky depth (clouds), the
 * chroma-keyed pegasus, later the sanctum particle FX, and the grain finish.
 * Transparent canvas; never intercepts pointer events.
 */
export function Stage() {
  return (
    <div className="pointer-events-none fixed inset-0 z-10" aria-hidden="true">
      <Canvas
        dpr={[1, 1.75]}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "high-performance",
        }}
        camera={{ fov: 45, position: [0, 0, 10] }}
      >
        <Suspense fallback={null}>
          <CloudLayers />
          <PegasusPlane />
        </Suspense>
        <GrainVignette />
      </Canvas>
    </div>
  );
}
