"use client";

import { useEffect, useRef, useState } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import {
  experienceStore,
  revealComplete,
  type RevealScent,
} from "@/experience/state";
import {
  REVEAL_PALETTES,
  statueScreenRect,
} from "@/experience/sanctumConfig";

/*
 * The reveal: a cloud of particles born in the statue's screen-space rect
 * flies home into a capsule-shaped volume at center screen. Aphrodite gets
 * gold dust, Poseidon sea spray — same mechanism, different palette.
 * Click-driven gsap timeline (never scroll-scrubbed).
 */

const COUNT = 9000;

function buildGeometry(
  scent: RevealScent,
  viewW: number,
  viewH: number,
  worldW: number,
  worldH: number,
): THREE.BufferGeometry {
  const statue = statueScreenRect(scent, viewW, viewH);
  const toScreenX = (px: number) => ((px / viewW) - 0.5) * worldW;
  const toScreenY = (px: number) => (0.5 - px / viewH) * worldH;

  // Capsule target: centered, slightly above middle.
  const cap = {
    x: viewW / 2,
    y: viewH * 0.46,
    w: Math.min(viewW, viewH) * 0.13,
    h: Math.min(viewW, viewH) * 0.42,
  };

  const start = new Float32Array(COUNT * 3);
  const end = new Float32Array(COUNT * 3);
  const delay = new Float32Array(COUNT);
  const rand = new Float32Array(COUNT);

  for (let i = 0; i < COUNT; i++) {
    // Statue-shaped ellipse fill (denser toward the core).
    const a1 = Math.random() * Math.PI * 2;
    const r1 = Math.sqrt(Math.random());
    start[i * 3] = toScreenX(statue.x + Math.cos(a1) * r1 * statue.w * 0.55);
    start[i * 3 + 1] = toScreenY(statue.y + Math.sin(a1) * r1 * statue.h * 0.55);
    start[i * 3 + 2] = (Math.random() - 0.5) * 0.6;

    // Capsule fill: rounded-rect volume.
    const a2 = Math.random() * Math.PI * 2;
    const r2 = Math.sqrt(Math.random());
    const capY = (Math.random() - 0.5) * cap.h;
    end[i * 3] = toScreenX(cap.x + Math.cos(a2) * r2 * cap.w * 0.5);
    end[i * 3 + 1] = toScreenY(cap.y + capY);
    end[i * 3 + 2] = (Math.random() - 0.5) * 0.4;

    delay[i] = Math.random() * 0.45;
    rand[i] = Math.random();
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("aStart", new THREE.BufferAttribute(start, 3));
  geo.setAttribute("aEnd", new THREE.BufferAttribute(end, 3));
  geo.setAttribute("aDelay", new THREE.BufferAttribute(delay, 1));
  geo.setAttribute("aRand", new THREE.BufferAttribute(rand, 1));
  // three needs a `position` attribute to compute draw range; alias aStart.
  geo.setAttribute("position", new THREE.BufferAttribute(start, 3));
  return geo;
}

function makeMaterial(scent: RevealScent, dpr: number): THREE.ShaderMaterial {
  const palette = REVEAL_PALETTES[scent];
  return new THREE.ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uProgress: { value: 0 },
      uOpacity: { value: 1 },
      uSize: { value: 3.2 * dpr },
      uColorA: { value: new THREE.Color(palette.a) },
      uColorB: { value: new THREE.Color(palette.b) },
    },
    vertexShader: /* glsl */ `
      attribute vec3 aStart;
      attribute vec3 aEnd;
      attribute float aDelay;
      attribute float aRand;
      uniform float uProgress;
      uniform float uSize;
      varying float vT;
      varying float vRand;

      void main() {
        float t = smoothstep(aDelay, 1.0, uProgress);
        // eased flight with a per-particle arc + swirl mid-path
        float e = t * t * (3.0 - 2.0 * t);
        vec3 pos = mix(aStart, aEnd, e);
        float arc = sin(e * 3.14159);
        pos.x += sin(aRand * 40.0 + e * 9.0) * 0.35 * arc;
        pos.y += cos(aRand * 31.0 + e * 7.0) * 0.28 * arc + arc * 0.5;
        pos.z += sin(aRand * 17.0 + e * 5.0) * 0.3 * arc;
        vT = t;
        vRand = aRand;
        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = uSize * (0.5 + aRand) * (1.0 + arc * 0.8);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform float uOpacity;
      varying float vT;
      varying float vRand;

      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        if (d > 0.5) discard;
        float soft = smoothstep(0.5, 0.05, d);
        vec3 color = mix(uColorA, uColorB, vRand);
        float a = soft * uOpacity * (0.25 + 0.75 * smoothstep(0.0, 0.15, vT));
        gl_FragColor = vec4(color, a);
      }
    `,
  });
}

export function ParticleMorph() {
  const { viewport, size, gl } = useThree();
  const points = useRef<THREE.Points>(null);
  const [active, setActive] = useState<{
    scent: RevealScent;
    geo: THREE.BufferGeometry;
    mat: THREE.ShaderMaterial;
  } | null>(null);

  useEffect(() => {
    const unsub = experienceStore.subscribe((s, prev) => {
      if (s.sanctum.status === "revealing" && prev.sanctum.status === "idle") {
        const scent = s.sanctum.scent!;
        const geo = buildGeometry(
          scent,
          size.width,
          size.height,
          viewport.width,
          viewport.height,
        );
        const mat = makeMaterial(scent, gl.getPixelRatio());
        setActive({ scent, geo, mat });
        gsap.fromTo(
          mat.uniforms.uProgress,
          { value: 0 },
          {
            value: 1,
            duration: 2.2,
            ease: "power2.inOut",
            onComplete: revealComplete,
          },
        );
      }
      if (s.sanctum.status === "idle" && prev.sanctum.status !== "idle") {
        setActive((cur) => {
          if (cur) {
            gsap.to(cur.mat.uniforms.uOpacity, {
              value: 0,
              duration: 0.45,
              onComplete: () => {
                cur.geo.dispose();
                cur.mat.dispose();
              },
            });
          }
          return null;
        });
      }
    });
    return unsub;
  }, [viewport.width, viewport.height, size.width, size.height, gl]);

  if (!active) return null;
  return (
    <points
      ref={points}
      geometry={active.geo}
      material={active.mat}
      frustumCulled={false}
      renderOrder={500}
    />
  );
}
