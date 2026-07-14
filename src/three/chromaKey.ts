import * as THREE from "three";

/*
 * Green-screen key + despill. Uses green-dominance (g − max(r, b)) rather
 * than color distance — robust for saturated screens behind a white subject,
 * and the despill clamp kills the green fringe on feather edges.
 * Iterated on live: tune uSimilarity/uSmoothness per clip.
 */
export function createChromaKeyMaterial(map: THREE.Texture): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      map: { value: map },
      uSimilarity: { value: 0.04 },
      uSmoothness: { value: 0.1 },
      uOpacity: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D map;
      uniform float uSimilarity;
      uniform float uSmoothness;
      uniform float uOpacity;
      varying vec2 vUv;

      void main() {
        vec4 c = texture2D(map, vUv);
        float greenness = c.g - max(c.r, c.b);
        float alpha = 1.0 - smoothstep(uSimilarity, uSimilarity + uSmoothness, greenness);
        // despill: green may never exceed the other channels by more than the
        // similarity threshold — removes fringe without dulling true greens
        c.g = min(c.g, max(c.r, c.b) + uSimilarity);
        float a = alpha * uOpacity;
        if (a < 0.01) discard;
        gl_FragColor = vec4(c.rgb, a);
      }
    `,
  });
}
