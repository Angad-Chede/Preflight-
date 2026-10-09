# Technique: 3D Model Optimization & Pipeline (GLTF / GLB)

## Technique Name
3D Model Optimization & Pipeline (GLTF / GLB)

## Purpose
Prepares, compresses, and loads 3D models from Blender or CAD tools into production-ready web assets, reducing file sizes from 40MB+ to <1.5MB and preventing GPU memory overflow.

## Difficulty
Intermediate

## Dependencies
- `@gltf-transform/cli`: `^3.10.0`
- `gltfjsx`: `^6.5.0`
- `@react-three/drei`: `^9.105.0` or `^10.0.0`

## When to Use
- Whenever loading external 3D models (products, characters, vehicles, hardware devices) onto the web.
- When model loading latency or mobile Safari memory crashes must be eliminated.

## When NOT to Use
- Procedural geometries generated via Three.js code (spheres, cubes, noise planes).

## Implementation Strategy
1. **Asset Optimization CLI**:
   - Dedup identical materials: `npx @gltf-transform/cli dedup input.glb temp.glb`
   - Weld duplicate vertices: `npx @gltf-transform/cli weld temp.glb temp.glb --tolerance 0.0005`
   - Resize textures to max 1024 or 2048: `npx @gltf-transform/cli resize temp.glb temp.glb --width 1024 --height 1024`
   - Convert textures to WebP: `npx @gltf-transform/cli webp temp.glb temp.glb --quality 85`
   - Compress geometry with Draco: `npx @gltf-transform/cli draco temp.glb output.glb`
2. **React Component Generation**:
   - Run `npx gltfjsx output.glb -t -s` to generate a typed, declarative component.
3. **Preload & Suspense**:
   - Call `useGLTF.preload('/output.glb')` at module root.
   - Wrap `<primitive object={scene} />` in `<Suspense fallback={<ModelLoader />}>`.

## Example Code Pattern
```tsx
'use client';

import { Suspense } from 'react';
import { useGLTF, Center, Float } from '@react-three/drei';

export function ProductModel() {
  const { scene } = useGLTF('/models/product-optimized.glb');
  return (
    <Float speed={1.5} rotationIntensity={0.5}>
      <Center>
        <primitive object={scene} scale={2} />
      </Center>
    </Float>
  );
}

// Preload triggers download immediately before component mounts
useGLTF.preload('/models/product-optimized.glb');
```

## Performance Cost
- Reduces network transfer payload by 80-95%.
- Drastically lowers GPU texture VRAM consumption (a 1K texture consumes ~5.5MB VRAM vs ~89MB for 4K).

## Mobile Behavior
- Prevents mobile Safari tabs from crashing due to the browser's strict WebGL memory limit (~200MB).

## Accessibility Concerns
- Screen readers cannot inspect 3D geometry; provide an HTML companion with complete product specifications.

## Source Repository
- [`giuucmp/aether-boilerplate`](file:///c:/Users/USER/frontend%20work/frontend-intelligence/sources/aether-boilerplate.md)
- [`pmndrs/react-three-fiber`](file:///c:/Users/USER/frontend%20work/frontend-intelligence/sources/react-three-fiber-ecosystem.md)
