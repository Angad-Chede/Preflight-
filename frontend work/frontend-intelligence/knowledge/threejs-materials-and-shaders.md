# Three.js Materials & Custom GLSL Shaders

## 1. What the Technique Is
Material and shader engineering determines how light interacts with 3D surfaces. Modern high-end web experiences leverage two primary paradigms:
1. **Physically Based Rendering (PBR)** via `MeshPhysicalMaterial`: Simulating complex optical properties such as glass transmission, subsurface scattering, clearcoat lacquer, and thin-film iridescence.
2. **Custom GLSL Shaders** via `ShaderMaterial` / `MeshDistortMaterial`: Running custom vertex shaders (geometric deformation, wave ripples, vertex noise) and fragment shaders (chromatic halos, holographic Fresnel glow, liquid flow) directly on the GPU.

---

## 2. When to Use It
- Luxury products featuring glass, frosted acrylic, chrome, or iridescent automotive finishes.
- Sci-fi, cosmic, or abstract mathematical visualizers (e.g. Celestial Forge, Lattice Drift).
- Hero section centerpiece elements requiring fluid motion that CPU JavaScript cannot compute at 60 FPS.

---

## 3. When NOT to Use It
- Low-power devices when heavy transmission materials (`transmission: 1.0`, `roughness: 0.2`) are rendered over complex geometry (transmission requires an internal scene render pass to create the refraction texture buffer).
- Simple flat UI shapes.

---

## 4. Implementation Pattern
1. **PBR Glass / Acrylic Recipe**:
   - `transmission: 1.0` (light passes through)
   - `roughness: 0.1 - 0.25` (frosted blur effect)
   - `ior: 1.5` (Index of refraction for glass)
   - `thickness: 0.8` (virtual thickness for volume absorption)
   - `chromaticAberration: 0.05`
2. **GLSL Uniform Pattern**:
   - Store uniforms in a persistent object: `{ uTime: { value: 0 }, uMouse: { value: new THREE.Vector2() } }`.
   - Update `uniforms.uTime.value` in `useFrame` or RAF loop.
   - Never reallocate new uniform objects inside the loop.

---

## 5. React / Next.js Example (with R3F and Custom Shader)

```tsx
'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial, Float, Environment } from '@react-three/drei';
import * as THREE from 'three';

// 1. Frosted Glass Luxury Prism
function FrostedGlassPrism() {
  return (
    <Float speed={1.5} rotationIntensity={1.2} floatIntensity={1}>
      <mesh position={[-1.5, 0, 0]}>
        <torusKnotGeometry args={[0.7, 0.25, 128, 32]} />
        <MeshTransmissionMaterial
          backside
          samples={16}
          resolution={512}
          transmission={1}
          roughness={0.15}
          thickness={0.8}
          ior={1.52}
          chromaticAberration={0.06}
          anisotropy={0.1}
          distortion={0.2}
          distortionScale={0.3}
          temporalDistortion={0.1}
          color="#ffffff"
        />
      </mesh>
    </Float>
  );
}

// 2. Custom GLSL Holographic Shader Sphere
const HologramShader = {
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform float uTime;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      // Gentle vertex breathing
      vec3 pos = position + normal * (sin(position.y * 5.0 + uTime * 2.0) * 0.05);
      vPosition = (modelViewMatrix * vec4(pos, 1.0)).xyz;
      gl_Position = projectionMatrix * vec4(vPosition, 1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform float uTime;

    void main() {
      vec3 viewDir = normalize(-vPosition);
      // Fresnel rim factor
      float fresnel = 1.0 - max(dot(viewDir, vNormal), 0.0);
      fresnel = pow(fresnel, 2.5);

      // Holographic scanlines
      float scanline = sin(vPosition.y * 40.0 + uTime * 4.0) * 0.5 + 0.5;

      vec3 baseColor = vec3(0.3, 0.4, 1.0);
      vec3 rimColor = vec3(0.9, 0.2, 0.8);
      vec3 finalColor = mix(baseColor, rimColor, fresnel) + scanline * 0.2;

      gl_FragColor = vec4(finalColor, fresnel + 0.3);
    }
  `,
};

function HolographicOrb() {
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
    }),
    []
  );

  useFrame((state) => {
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh position={[1.5, 0, 0]}>
      <sphereGeometry args={[0.9, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={HologramShader.vertexShader}
        fragmentShader={HologramShader.fragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export function MaterialShowcaseCanvas() {
  return (
    <div className="relative h-[550px] w-full rounded-3xl overflow-hidden bg-neutral-950">
      <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} />
        <Environment preset="night" />

        <FrostedGlassPrism />
        <HolographicOrb />
      </Canvas>
    </div>
  );
}
```

---

## 6. Dependencies
- `@react-three/fiber`: `^8.15.0`
- `@react-three/drei`: `^9.90.0`
- `three`: `^0.160.0`

---

## 7. Performance Considerations
- **`MeshTransmissionMaterial` Resolution**: By default, transmission creates an internal render target of the background scene. Always clamp `resolution={512}` (or `256` on mobile) and keep `samples={8 - 16}`. Leaving `samples={32}` causes noticeable mobile frame drops.
- **Shader Compilation Spikes**: Shaders compile on their very first render frame. Use `renderer.compile(scene, camera)` or Drei's `<Preload all />` during initial page load to prevent frame-rate stutter on first scroll.

---

## 8. Mobile Considerations
- `MeshTransmissionMaterial` is computationally demanding on low-tier mobile GPUs. On mobile, fall back to a high-roughness `MeshPhysicalMaterial` with `roughness: 0.1` and `metalness: 0.1` without real-time transmission buffer passes.

---

## 9. Accessibility Considerations
- Glowing or fluctuating shader surfaces (like holograms or scanlines) must not flash between 3Hz and 30Hz to prevent triggering photosensitive seizures. Maintain smooth, low-frequency oscillations.

---

## 10. Common Mistakes
1. **Missing `normalMatrix * normal` in vertex shader**: Transforming normals with standard `modelViewMatrix` causes distortion whenever non-uniform scaling is applied to the mesh. Always use `normalMatrix`.
2. **Recreating Uniform Objects in Render Loop**: Declaring `uniforms={{ uTime: { value: time } }}` inside a render function generates new objects every frame, causing garbage collection spikes.
3. **Overusing Transmission**: Placing 4+ distinct transmission meshes in a scene causes cascading render passes and rapid GPU memory saturation.

---

## 11. Related Patterns
- `threejs-celestial-forge.md`
- `webgl-fluid-and-distortion.md`
- `interactive-3d-hero.md`

---

## 12. Source References
- [ThreeJS Celestial Forge Teardown](../sources/threejs-celestial-forge.md)
- Three.js Docs: MeshPhysicalMaterial
