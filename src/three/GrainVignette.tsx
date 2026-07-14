"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/*
 * Film finish in one clip-space quad rendered last: animated grain + gentle
 * vignette over the WebGL layers. Deliberately subtle — the brand's paper
 * grain (CSS, body::before) stays the top-most texture.
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

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7)) + uTime) * 43758.5453);
        }

        void main() {
          vec2 uv = gl_FragCoord.xy / uResolution;
          float grain = (hash(gl_FragCoord.xy) - 0.5) * 0.06;
          float dist = length(uv - 0.5) * 1.35;
          float vignette = smoothstep(0.55, 1.25, dist) * 0.18;
          float a = clamp(vignette + max(grain, 0.0), 0.0, 1.0);
          gl_FragColor = vec4(0.0, 0.0, 0.0, a);
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
