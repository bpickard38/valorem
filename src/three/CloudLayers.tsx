"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DAMP, TOTAL_SPAN, phaseRange } from "@/experience/phases";
import { experienceStore, damp } from "@/experience/state";

/*
 * Soft parallax cloud planes. Procedural sprites for now (blurred white
 * blobs) — swappable for AI-generated cloud plates without touching the
 * motion. Clouds rise as the camera "falls" (morph → voyage), then fade
 * out once the baked voyage footage owns the frame.
 */

function makeCloudTexture(seed: number): THREE.CanvasTexture {
  const w = 512;
  const h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  for (let i = 0; i < 16; i++) {
    const x = w * (0.2 + rand() * 0.6);
    const y = h * (0.35 + rand() * 0.3);
    const r = 40 + rand() * 90;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255,255,255,${0.10 + rand() * 0.12})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  return new THREE.CanvasTexture(canvas);
}

interface Layer {
  z: number;
  x: number;
  y: number;
  scale: number;
  speed: number;
  texture: THREE.CanvasTexture;
}

// Fraction into voyage where live clouds are gone. 0.12 × 430vh ≈ the same
// ~52vh absolute fade the old 0.35 × 150vh descent gave.
const CLOUD_FADE_END = 0.12;

export function CloudLayers() {
  const group = useRef<THREE.Group>(null);
  const dampedPos = useRef(0);

  const layers = useMemo<Layer[]>(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        z: -6 + i * 1.3,
        x: (i % 2 === 0 ? -1 : 1) * (1 + i * 0.7),
        y: -1.5 + i * 0.9,
        scale: 9 + i * 3,
        speed: 0.4 + i * 0.25,
        texture: makeCloudTexture(1234 + i * 999),
      })),
    [],
  );

  const voyage = phaseRange("voyage");
  const morph = phaseRange("morph");

  useFrame((state, dt) => {
    const st = experienceStore.getState();
    dampedPos.current = damp(
      dampedPos.current,
      st.progress * TOTAL_SPAN,
      DAMP,
      dt,
    );
    const pos = dampedPos.current;
    const g = group.current;
    if (!g) return;

    // Full atmosphere on the held hero frame, then the veil thins while the
    // pegasus transforms — white sprites sit ABOVE the film (z-10) and at
    // full strength they wash out both the morphing horse and the black
    // mark. Held at a low floor through the logo settle/dock, then the
    // voyage fade takes the rest to zero.
    const morphT = THREE.MathUtils.clamp(pos / morph.end, 0, 1);
    const veil = 1 - 0.8 * THREE.MathUtils.smoothstep(morphT, 0.3, 0.65);

    // The camera "falls" after the morph: clouds rise and part quickly
    // across early descent before the fade hands the sky to the baked
    // footage.
    const fall = Math.max(0, pos - morph.end) / 100;
    const t = state.clock.elapsedTime;
    g.children.forEach((child, i) => {
      const layer = layers[i];
      const mesh = child as THREE.Mesh;
      mesh.position.y =
        layer.y + fall * layer.speed * 4.5 + Math.sin(t * 0.05 + i * 1.7) * 0.12;
      mesh.position.x =
        layer.x + Math.sin(t * 0.04 + i * 2.1) * 0.35;
      // fade out as the baked voyage film takes over
      const fadeT =
        (pos - voyage.start) / ((voyage.end - voyage.start) * CLOUD_FADE_END);
      const opacity = veil * (1 - THREE.MathUtils.clamp(fadeT, 0, 1));
      (mesh.material as THREE.MeshBasicMaterial).opacity = opacity;
      mesh.visible = opacity > 0.01;
    });
  });

  return (
    <group ref={group}>
      {layers.map((layer, i) => (
        <mesh key={i} position={[layer.x, layer.y, layer.z]}>
          <planeGeometry args={[layer.scale, layer.scale * 0.5]} />
          <meshBasicMaterial
            map={layer.texture}
            transparent
            depthWrite={false}
            opacity={1}
          />
        </mesh>
      ))}
    </group>
  );
}
