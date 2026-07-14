"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { DAMP, TOTAL_SPAN, phaseRange } from "@/experience/phases";
import { experienceStore, damp } from "@/experience/state";

/*
 * Soft parallax cloud planes. Procedural sprites for now (blurred white
 * blobs) — swappable for AI-generated cloud plates without touching the
 * motion. Clouds rise as the camera "falls" (hero → descent), then fade
 * out once the baked descent footage owns the frame.
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

const CLOUD_FADE_END = 0.35; // fraction into descent where live clouds are gone

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

  const descent = phaseRange("descent");

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

    // Camera "falls": clouds rise, nearer layers faster.
    const fall = pos / 100; // vh → world units baseline
    g.children.forEach((child, i) => {
      const layer = layers[i];
      const mesh = child as THREE.Mesh;
      mesh.position.y = layer.y + fall * layer.speed * 1.6;
      mesh.position.x =
        layer.x + Math.sin(state.clock.elapsedTime * 0.04 + i * 2.1) * 0.35;
      // fade out as the baked descent film takes over
      const fadeT =
        (pos - descent.start) / ((descent.end - descent.start) * CLOUD_FADE_END);
      const opacity = 1 - THREE.MathUtils.clamp(fadeT, 0, 1);
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
