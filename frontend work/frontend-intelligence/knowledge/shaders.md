# Technique: Custom GLSL Shaders & Material Pipeline

## Technique Name
Custom GLSL Shaders & Material Pipeline

## Purpose
Executes mathematical graphics calculations directly on GPU vertex and fragment pipelines, producing complex fluid wave distortions, holographic Fresnel rim lighting, procedural noise, and plasma surfaces at 60/120 FPS.

## Difficulty
Advanced to Expert

## Dependencies
- `three`: `^0.160.0`
- `@react-three/fiber`: `^8.0.0` or `^9.0.0`

## When to Use
- When the visual effect cannot be achieved with standard PBR textures or CSS.
- Organic fluid wave surfaces, simplex noise vertex displacement, audio visualizers.
- Holographic energy shields, plasma orbs, and luminous cosmic visuals.

## When NOT to Use
- Simple flat UI shapes or standard realistic materials (metal, wood, plastic) where standard `MeshStandardMaterial` suffices.
- Low-tier mobile devices when shaders use multiple nested loops or unoptimized raymarching algorithms.

## Implementation Strategy
1. **Persistent Uniforms Object**: Allocate uniforms in a persistent object (`useMemo`). Never recreate uniform objects inside render loops.
2. **Transform Normals with `normalMatrix`**: In vertex shaders, always multiply surface normals by `normalMatrix` to maintain correct lighting after scaling.
3. **Fresnel Equation**: Compute rim lighting via view-direction dot product:
   `float fresnel = pow(1.0 - max(dot(normalize(-vPosition), vNormal), 0.0), power);`

## Example Code Pattern
```tsx
'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const FresnelShader = {
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform float uTime;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec3 pos = position + normal * (sin(position.y * 6.0 + uTime * 2.0) * 0.08);
      vPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;
      gl_Position = projectionMatrix * vec4(vPosition, 1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform vec3 uColorCore;
    uniform vec3 uColorRim;

    void main() {
      vec3 viewDir = normalize(-vPosition);
      float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);
      vec3 color = mix(uColorCore, uColorRim, fresnel);
      gl_FragColor = vec4(color * (1.0 + fresnel * 2.5), 1.0);
    }
  `,
};

export function HologramSphere() {
  const matRef = useRef<THREE.ShaderMaterial>(null!);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColorCore: { value: new THREE.Color('#1e1b4b') },
      uColorRim: { value: new THREE.Color('#818cf8') },
    }),
    []
  );

  useFrame((state) => {
    matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh>
      <sphereGeometry args={[1.2, 64, 64]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={FresnelShader.vertexShader}
        fragmentShader={FresnelShader.fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}
```

## Performance Cost
- Shaders compile on their first render frame. Use `renderer.compile()` or `<Preload all />` during preloading to prevent frame stutters.
- Avoid branch divergence (`if/else` inside complex loops in fragment shaders) to maximize GPU parallelization.

## Mobile Behavior
- Clamp DPR to 1.0 on mobile to avoid fillrate exhaustion from evaluating millions of fragment shader calculations per frame.

## Accessibility Concerns
- Avoid rapid strobe color changes between 3Hz and 30Hz to protect users with photosensitive epilepsy.

## Source Repository
- [`ShAuRyA-Noodle/ThreeJS-Celestial-Forge`](file:///c:/Users/USER/frontend%20work/frontend-intelligence/sources/threejs-celestial-forge.md)
- [`Kavtuai/lattice-drift`](file:///c:/Users/USER/frontend%20work/frontend-intelligence/sources/lattice-drift.md)
