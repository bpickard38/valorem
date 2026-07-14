"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { DAMP, TOTAL_SPAN, phaseRange } from "@/experience/phases";
import { experienceStore, damp } from "@/experience/state";
import { createChromaKeyMaterial } from "./chromaKey";

/*
 * The hero pegasus: a single plane whose texture is chroma-keyed live.
 * M3: static green-screen still with an idle float. M4 swaps the texture
 * source for the wing-flap loop (VideoTexture) and the scrubbed morph
 * frames (CanvasTexture) — same plane, same material, no layer seam.
 */

const SRC = "/plates/pegasus-front-green.png";

export function PegasusPlane() {
  const mesh = useRef<THREE.Mesh>(null);
  const dampedPos = useRef(0);
  const texture = useTexture(SRC);
  const material = useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    return createChromaKeyMaterial(texture);
  }, [texture]);

  const morph = phaseRange("morph");
  const img = texture.image as { width: number; height: number };
  const aspect = img.width / img.height;

  useFrame((state, dt) => {
    const st = experienceStore.getState();
    dampedPos.current = damp(
      dampedPos.current,
      st.progress * TOTAL_SPAN,
      DAMP,
      dt,
    );
    const pos = dampedPos.current;
    const m = mesh.current;
    if (!m) return;

    // Idle float — wings-of-a-hovering-thing, not a bobbing buoy.
    const t = state.clock.elapsedTime;
    m.position.y = Math.sin(t * 1.15) * 0.09 + Math.sin(t * 2.3) * 0.03;

    // Hand off to the baked morph film across the first 20% of morph.
    const fadeT = (pos - morph.start) / ((morph.end - morph.start) * 0.2);
    const opacity = 1 - THREE.MathUtils.clamp(fadeT, 0, 1);
    material.uniforms.uOpacity.value = opacity;
    m.visible = opacity > 0.01;
  });

  return (
    <mesh ref={mesh} material={material} position={[0, 0, 0]}>
      <planeGeometry args={[4.6, 4.6 / aspect]} />
    </mesh>
  );
}
