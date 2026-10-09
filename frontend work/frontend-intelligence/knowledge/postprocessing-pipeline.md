# WebGL Postprocessing Pipeline & Performance Optimization

## 1. What the Technique Is
Postprocessing is a full-screen image processing pass executed after the 3D scene has rendered to an offscreen frame buffer. Effects like **Selective Bloom**, **Chromatic Aberration**, **Film Grain/Noise**, and **Vignette** transform raw digital 3D models into cinematic, photorealistic visuals. Using `@react-three/postprocessing` (built on `postprocessing` by pmndrs), multiple effects are composited into a single combined shader pass to minimize GPU memory bandwidth.

---

## 2. When to Use It
- High-end creative landing pages, sci-fi/cyberpunk visuals, and luxury product reveals.
- Emissive glowing materials (lasers, neon circuits, stars, plasma cores).
- Camera lens simulations requiring subtle chromatic fringing, film grain, or depth blur.

---

## 3. When NOT to Use It
- Low-power mobile devices where rendering full-screen buffers at high resolutions causes thermal throttling and battery drain.
- Crisp UI dashboards or text overlays (postprocessing blurs crisp vector edges unless isolated to 3D layers).
- Situations where antialiasing is critical but MSAA is disabled by custom postprocessing passes.

---

## 4. Implementation Pattern
1. **The Single Pass Rule**: Never chain 5 independent render passes. Use `@react-three/postprocessing`'s `<EffectComposer>`, which merges Bloom, Vignette, and Noise into a single multi-effect fragment shader.
2. **Selective Bloom with HDR Threshold**: Set `luminanceThreshold: 0.9 - 1.1` and `mipmapBlur: true`. Only surfaces with emissive color values exceeding 1.0 will trigger the glow, preserving the sharpness of dark and mid-tone geometry.
3. **Multisampling vs MipmapBlur**: When using `mipmapBlur`, set `<EffectComposer multisampling={0}>` to save substantial GPU VRAM.
4. **Adaptive Mobile Bypass**: Conditionally disable the entire `<EffectComposer>` on mobile devices or lower-tier hardware.

---

## 5. React / Next.js Example (with R3F and Postprocessing)

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
  Noise,
} from '@react-three/postprocessing';
import * as THREE from 'three';

function GlowingCore() {
  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={1}>
      <mesh>
        <octahedronGeometry args={[1, 0]} />
        {/* Emissive HDR color exceeding 1.0 to trigger Bloom */}
        <meshStandardMaterial
          color="#050510"
          emissive="#6366f1"
          emissiveIntensity={3.5}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
    </Float>
  );
}

export function PostprocessingScene() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile / low-tier device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || window.navigator.hardwareConcurrency <= 4);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="relative h-[600px] w-full rounded-3xl overflow-hidden bg-neutral-950">
      <Canvas
        camera={{ position: [0, 0, 4], fov: 45 }}
        dpr={isMobile ? [1, 1] : [1, 1.5]}
        gl={{ powerPreference: 'high-performance', antialias: false }}
      >
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 5, 5]} intensity={1} />

        <GlowingCore />

        {/* Postprocessing Pipeline - Bypassed on Mobile for Performance */}
        {!isMobile && (
          <EffectComposer multisampling={0} disableNormalPass>
            {/* 1. Mipmap Blur Bloom: Rich, smooth photographic glow */}
            <Bloom
              luminanceThreshold={0.9}
              luminanceSmoothing={0.025}
              mipmapBlur
              intensity={1.2}
            />

            {/* 2. Subtle Lens Chromatic Aberration */}
            <ChromaticAberration
              offset={new THREE.Vector2(0.0015, 0.0015)}
              radialModulation={false}
              modulationOffset={0.15}
            />

            {/* 3. Subtle Film Grain */}
            <Noise opacity={0.035} />

            {/* 4. Filmic Vignette */}
            <Vignette eskil={false} offset={0.15} darkness={0.8} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
```

---

## 6. Dependencies
- `@react-three/postprocessing`: `^2.16.0`
- `postprocessing`: `^6.35.0`
- `@react-three/fiber`: `^8.15.0`
- `three`: `^0.160.0`

---

## 7. Performance Considerations
- **Screen Resolution Impact**: Postprocessing runs per-pixel fragment shaders across the entire screen quad. On a 4K monitor at DPR 2 (7680x4320 pixels), postprocessing must evaluate over **33 million pixels per frame**! Always clamp DPR (`[1, 1.5]`) when postprocessing is active.
- **`disableNormalPass`**: If no effects require surface normals (like Screen Space Reflections or Depth of Field), always pass `disableNormalPass` to `<EffectComposer>` to eliminate an entire pre-render scene pass.

---

## 8. Mobile Considerations
- **Bypass Rule**: On mobile Safari / Android Chrome, postprocessing is the #1 cause of thermal throttling and 20 FPS drops. If you cannot bypass entirely, use only `<Bloom mipmapBlur intensity={0.8} />` with zero chromatic aberration, zero noise, and `dpr={1}`.

---

## 9. Accessibility Considerations
- Avoid intense chromatic aberration or disorienting screen shakes. High chromatic aberration creates color fringing that impairs visual comfort for users with astigmatism.

---

## 10. Common Mistakes
1. **Bloom Blowout**: Setting `luminanceThreshold: 0` causes every dark background and grey object to glow, turning the screen into a washed-out white fog.
2. **Leaving MSAA enabled alongside multiple render targets**: Multi-sampling antialiasing with postprocessing doubles memory usage; use FXAA or SMAA passes instead, or rely on `mipmapBlur`.
3. **Hardcoding Vector2 without useMemo**: Passing `offset={[0.002, 0.002]}` directly into props can cause reallocations if props re-render.

---

## 11. Related Patterns
- `threejs-celestial-forge.md`
- `responsive-dpr-monitor.md`
- `webgl-background.md`

---

## 12. Source References
- [ThreeJS Celestial Forge Teardown](../sources/threejs-celestial-forge.md)
- [Official Docs Synthesis: React Postprocessing](../sources/official-docs-synthesis.md)
- `pmndrs/postprocessing` GitHub: https://github.com/pmndrs/postprocessing
