# Three.js Lighting & Realistic Shadow Architecture

## 1. What the Technique Is
Lighting and shadow architecture controls photorealism and spatial grounding in 3D scenes. Traditional WebGL shadow maps (`PCFSoftShadowMap`) are computationally expensive on mobile GPUs. Modern high-end web architecture pairs image-based lighting (HDRI Environment maps) with specialized grounding shadow techniques:
- **`ContactShadows`**: Screen-space/orthogonal blur shadows rendered to an offscreen buffer directly beneath an object.
- **`AccumulativeShadows`**: Multi-pass progressive soft shadows accumulated over several frames, delivering filmic penumbra with zero runtime GPU overhead once baked.
- **Image-Based Lighting (IBL)**: High Dynamic Range environment maps (`.hdr` / `.exr`) providing physically accurate diffuse reflections and specular highlights.

---

## 2. When to Use It
- High-end 3D product showcases (electronics, watches, automotive, sneakers).
- Floating 3D heroes that need realistic floor contact without harsh digital artifacts.
- Scenes featuring metallic, reflective, or glass/transmission materials.

---

## 3. When NOT to Use It
- Flat isometric or stylized unlit (Toon/Cel-shaded) scenes.
- Low-end mobile devices where multiple real-time shadow maps drop frame rates below 30 FPS.

---

## 4. Implementation Pattern
1. **Light Budget**: Use at most 1 primary shadow-casting DirectionalLight and 1 Ambient/Hemisphere fill light. Do not enable `castShadow = true` on more than 1 or 2 lights.
2. **Environment Map Dominance**: Rely on `<Environment preset="city" />` or a low-resolution HDR (`512x256` or `1024x512`) for realistic specular reflections rather than creating 6 physical point lights.
3. **ContactShadows Grounding**: Place Drei's `<ContactShadows opacity={0.6} scale={10} blur={2.5} far={4} />` on the floor plane beneath floating models.

---

## 5. React / Next.js Example (with R3F and Drei)

```tsx
'use client';

import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, Float, MeshDistortMaterial } from '@react-three/drei';

function FloatingChromeOrb() {
  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={1.5}>
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[1, 64, 64]} />
        <MeshDistortMaterial
          color="#f1f5f9"
          roughness={0.05}
          metalness={0.95}
          clearcoat={1}
          clearcoatRoughness={0.1}
          distort={0.25}
          speed={1.5}
        />
      </mesh>
    </Float>
  );
}

export function HighEndLightingScene() {
  return (
    <div className="relative h-[600px] w-full rounded-3xl overflow-hidden bg-neutral-950">
      <Canvas camera={{ position: [0, 2, 5], fov: 45 }} dpr={[1, 1.5]}>
        {/* Fill Ambient Light */}
        <ambientLight intensity={0.4} />

        {/* Key Directional Rim Light */}
        <directionalLight position={[10, 10, 5]} intensity={1.2} />

        {/* Realistic Reflection & Specularity Map */}
        <Environment preset="city" environmentIntensity={0.8} />

        <FloatingChromeOrb />

        {/* Soft Grounding Penumbra Shadow */}
        <ContactShadows
          position={[0, -0.6, 0]}
          opacity={0.65}
          scale={8}
          blur={2.4}
          far={4}
          resolution={512}
          color="#050510"
        />
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
- **Avoid Oversized HDR Maps**: A 16MB 4K HDR map chokes mobile bandwidth and consumes 64MB of uncompressed GPU texture memory. A 1K (`1024x512`) or blurred 512x256 HDR is visually identical for diffuse reflections and downloads in <200KB.
- **Shadow Map Resolution**: If standard Three.js directional shadows are required, use `shadow.mapSize.width = 1024` (or `2048` on desktop). Never use `4096` shadow maps unless running a dedicated desktop workstation app.

---

## 8. Mobile Considerations
- On mobile devices, disable standard dynamic cascade shadow maps entirely and rely exclusively on `<ContactShadows resolution={256} />`. This eliminates 90% of shadow-pass draw calls.

---

## 9. Accessibility Considerations
- High specular glare can reduce readability of text placed over 3D scenes. Provide an overlay scrim or blur backdrop (`backdrop-blur-md bg-neutral-950/60`) behind all HTML typography overlays.

---

## 10. Common Mistakes
1. **Adding 10 point lights**: Developers often add a point light every time an area looks dark. Each dynamic light multiplies the fragment shader calculations across all surfaces. Use an HDR environment map instead.
2. **Missing shadow camera bounds**: Leaving directional shadow camera frustum at default (`-500` to `+500`) spreads shadow map texels over an enormous area, resulting in jagged, blocky shadows.
3. **Black shadows**: Setting shadows to pure `#000000` looks artificial. Real shadows inherit color from the ambient bounce light (e.g. deep dark indigo `#0a0a1a`).

---

## 11. Related Patterns
- `3d-product-showcase.md`
- `interactive-3d-hero.md`
- `threejs-materials-and-shaders.md`

---

## 12. Source References
- [React Three Fiber Ecosystem Teardown](../sources/react-three-fiber-ecosystem.md)
- [Official Docs Synthesis](../sources/official-docs-synthesis.md)
