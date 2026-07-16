"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/*
 * Film finish in one clip-space quad rendered last: a gentle vignette over
 * the WebGL layers. The animated grain that used to accompany it was cut —
 * like the CSS paper-grain overlay before it, its noise specks read as
 * confetti lights on mobile screens.
 */
export function GrainVignette() {
  const material = useRef<THREE.ShaderMaterial>(null);
  const size = useThree((s) => s.size);

  const shader = useMemo(
    () => ({
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(1, 1) },
      },
      vertexShader: /* glsl */ `
        void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform vec2 uResolution;

        void main() {
          vec2 uv = gl_FragCoord.xy / uResolution;
          float dist = length(uv - 0.5) * 1.35;
          float vignette = smoothstep(0.55, 1.25, dist) * 0.18;
          gl_FragColor = vec4(0.0, 0.0, 0.0, vignette);
        }
      `,
    }),
    [],
  );

  useFrame((state) => {
    if (!material.current) return;
    material.current.uniforms.uTime.value = state.clock.elapsedTime;
    material.current.uniforms.uResolution.value.set(
      size.width * state.gl.getPixelRatio(),
      size.height * state.gl.getPixelRatio(),
    );
  });

  return (
    <mesh frustumCulled={false} renderOrder={999}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={material}
        args={[shader]}
        transparent
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}
