"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { DAMP, TOTAL_SPAN, phaseRange } from "@/experience/phases";
import { experienceStore, damp } from "@/experience/state";
import { createChromaKeyMaterial } from "./chromaKey";

/*
 * The hero pegasus: a chroma-keyed wing-flap loop (green-screen video) on a
 * plane sized to mimic the film canvas's cover-fit — so when the baked morph
 * sequence (same full-frame composition) takes over on the canvas below, the
 * pegasus holds its screen position and scale across the hand-off.
 */

const LOOP_SRC = "/fx/pegasus-loop.mp4";
const VIDEO_ASPECT = 16 / 9;

export function PegasusPlane() {
  const mesh = useRef<THREE.Mesh>(null);
  const dampedPos = useRef(0);
  const viewport = useThree((s) => s.viewport);
  const [video] = useState(() => {
    if (typeof document === "undefined") return null;
    const v = document.createElement("video");
    v.src = LOOP_SRC;
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.crossOrigin = "anonymous";
    return v;
  });

  const material = useMemo(() => {
    if (!video) return null;
    const tex = new THREE.VideoTexture(video);
    tex.colorSpace = THREE.SRGBColorSpace;
    return createChromaKeyMaterial(tex);
  }, [video]);

  useEffect(() => {
    if (!video) return;
    // Autoplay policies allow muted playback; retry on first interaction if
    // the initial attempt is blocked.
    const tryPlay = () => void video.play().catch(() => {});
    tryPlay();
    window.addEventListener("pointerdown", tryPlay, { once: true });
    return () => {
      window.removeEventListener("pointerdown", tryPlay);
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [video]);

  const morph = phaseRange("morph");

  useFrame((state, dt) => {
    const st = experienceStore.getState();
    dampedPos.current = damp(
      dampedPos.current,
      st.progress * TOTAL_SPAN,
      DAMP,
      dt,
    );
    const m = mesh.current;
    if (!m || !material) return;

    // Cover-fit the 16:9 video across the viewport (world units at z=0),
    // matching SequenceCanvas's crop of the same full-frame composition.
    const coverW = Math.max(viewport.width, viewport.height * VIDEO_ASPECT);
    m.scale.set(coverW, coverW / VIDEO_ASPECT, 1);

    // Gentle hover — the whole plate breathes, the flap does the rest.
    const t = state.clock.elapsedTime;
    m.position.y = Math.sin(t * 1.15) * 0.06;

    // Hand off to the baked morph film across the first 20% of morph.
    const fadeT =
      (dampedPos.current - morph.start) / ((morph.end - morph.start) * 0.2);
    const opacity = 1 - THREE.MathUtils.clamp(fadeT, 0, 1);
    material.uniforms.uOpacity.value = opacity;
    m.visible = opacity > 0.01;
  });

  if (!material) return null;
  return (
    <mesh ref={mesh} material={material}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}
