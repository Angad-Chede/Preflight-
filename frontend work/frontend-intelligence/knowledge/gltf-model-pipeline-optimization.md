# GLTF / GLB 3D Model Pipeline & Optimization

## 1. What the Technique Is
The 3D model asset pipeline is the process of compressing, formatting, lazy loading, and rendering 3D digital assets (GLTF / GLB). Raw 3D models exported from Blender, Cinema4D, or Maya often weigh 20MB to 100MB with millions of unoptimized polygons and uncompressed 4K PNG textures. Production frontend architecture compresses models to <1-2MB using:
- **Geometry Compression**: Google Draco or Meshopt.
- **Texture Compression**: KTX2 / Basis Universal GPU textures (decoded directly into GPU VRAM without CPU decompression).
- **React Tree Integration**: `gltfjsx` code generation and `@react-three/drei`'s `useGLTF`.

---

## 2. When to Use It
- Any web application rendering real-world 3D assets (e-commerce products, architectural models, interactive characters, mechanical assemblies).
- When model file sizes need to be reduced from 30MB+ down to <1.5MB for fast web delivery.

---

## 3. When NOT to Use It
- Purely procedural geometric scenes (spheres, cubes, mathematical meshes) that can be generated dynamically in code via Three.js primitives without network downloads.

---

## 4. Implementation Pattern
1. **Asset Compression Pipeline (CLI Pre-build)**:
   Use `gltf-transform` to optimize the raw asset before serving:
   ```bash
   # 1. Resize textures to max 1024/2048, convert to WebP/KTX2
   npx gltf-transform resize input.glb output.glb --width 1024 --height 1024
   # 2. Dedup materials and weld duplicate vertices
   npx gltf-transform dedup output.glb output.glb
   npx gltf-transform weld output.glb output.glb
   # 3. Compress geometry with Draco or Meshopt
   npx gltf-transform draco output.glb compressed.glb
   ```
2. **React Component Generation**:
   Use `gltfjsx` to generate a declarative, typed React Three Fiber component:
   ```bash
   npx gltfjsx compressed.glb -t -s
   ```
3. **Suspense & Preloading**:
   - Wrap the 3D model in `<Suspense fallback={<ModelLoader />}>`.
   - Call `useGLTF.preload('/models/compressed.glb')` at the module root to initiate background downloading before the route mounts.

---

## 5. React / Next.js Example

```tsx
'use client';

import { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, Html, Center, Float } from '@react-three/drei';
import * as THREE from 'three';

// 1. Loading Fallback Progress
function ModelLoader() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2 rounded-xl bg-neutral-900/80 p-4 border border-neutral-800 text-white backdrop-blur-md">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        <span className="text-xs font-mono text-neutral-400">Loading 3D Asset...</span>
      </div>
    </Html>
  );
}

// 2. Optimized Model Component
interface ProductModelProps {
  url: string;
}

function ProductModel({ url }: ProductModelProps) {
  // useGLTF leverages DRACOLoader internally when Draco-compressed
  const { scene, materials } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);

  // Optional: Dynamically adjust material properties at runtime
  if (materials && materials.MetalBody) {
    (materials.MetalBody as THREE.MeshStandardMaterial).roughness = 0.15;
    (materials.MetalBody as THREE.MeshStandardMaterial).metalness = 0.9;
  }

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.8}>
      <Center>
        <primitive ref={groupRef} object={scene} scale={1.5} />
      </Center>
    </Float>
  );
}

// 3. Preload the asset to trigger immediate network fetch
useGLTF.preload('/models/smartwatch-draco.glb');

export function ProductCanvas() {
  return (
    <div className="relative h-[550px] w-full rounded-2xl overflow-hidden bg-neutral-950">
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 5]} intensity={1.5} />

        <Suspense fallback={<ModelLoader />}>
          <ProductModel url="/models/smartwatch-draco.glb" />
        </Suspense>
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
- CLI tools: `@gltf-transform/cli`, `gltfjsx`

---

## 7. Performance Considerations
- **Draco WebAssembly Overhead**: Draco decodes geometry using a WASM worker (~200KB). For very simple low-poly models (<5,000 vertices), the Draco WASM initialization time can actually exceed standard uncompressed download time. Use Draco for models with >30,000 vertices.
- **Polycount Budget for Web**: Aim for <50,000 to 100,000 total triangles across the entire scene on mobile.
- **Material Consolidation (Draw Calls)**: Each unique material on a model triggers a separate GPU draw call. A model with 50 separate sub-meshes with 50 unique materials requires 50 draw calls. Combine textures into texture atlases to reduce draw calls to <5.

---

## 8. Mobile Considerations
- Memory is the primary killer on mobile devices. A 4K texture (4096x4096) uncompresses to **67MB of raw GPU memory**. Two 4K textures will cause mobile Safari to forcibly reload the page. Restrict all mobile textures to **1024x1024** or **2048x2048** maximum.

---

## 9. Accessibility Considerations
- 3D models cannot be inspected by screen readers. Always provide structured HTML semantic descriptions alongside the canvas with complete product specifications, dimensions, materials, and features.

---

## 10. Common Mistakes
1. **Shipping 4K PNGs inside GLB**: Exporting models with uncompressed 4096x4096 PNG files embedded, ballooning file size to 80MB.
2. **Forgetting `useGLTF.preload`**: Not preloading causes visible pop-in delays when navigating to the product page.
3. **Cloning Skinned Meshes incorrectly**: Using `scene.clone()` on models with skeleton rigs without using `SkeletonUtils.clone()`, which detaches the bone references and breaks animations.

---

## 11. Related Patterns
- `3d-product-showcase.md`
- `threejs-scene-architecture.md`
- `threejs-lighting-and-shadows.md`

---

## 12. Source References
- [React Three Fiber Ecosystem Teardown](../sources/react-three-fiber-ecosystem.md)
- `gltf-transform` Documentation: https://gltf-transform.dev/
- Khronos Group GLTF 2.0 Specification
