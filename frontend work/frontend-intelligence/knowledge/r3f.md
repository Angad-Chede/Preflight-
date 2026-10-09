# Technique: React Three Fiber (R3F) & Drei Architecture

## Technique Name
React Three Fiber (R3F) & Drei Architecture

## Purpose
Enables declarative, component-driven 3D scene construction inside React with zero reconciler overhead in the frame loop, automated resource disposal, and access to the tested Drei helper ecosystem.

## Difficulty
Intermediate to Advanced

## Dependencies
- `@react-three/fiber`: `^8.16.0` or `^9.0.0`
- `@react-three/drei`: `^9.105.0` or `^10.0.0`
- `three`: `^0.160.0` or higher

## When to Use
- Building 3D heroes, interactive models, or product configurators inside React / Next.js.
- When 3D objects need to be driven by React props, Zustand stores, or state changes.
- Projects needing declarative scene layout, automatic memory cleanup, and ergonomic hooks (`useFrame`, `useThree`).

## When NOT to Use
- Pure compute pipelines that run offscreen in Web Workers.
- Non-React codebases.

## Implementation Strategy
1. **Zero-Reconciler `useFrame`**: Never call `setState` inside `useFrame`. Mutate object properties via `ref.current` directly.
2. **Drei Helper Suite**:
   - `<Float speed={2} rotationIntensity={1}>`: Smooth bobbing and rotation.
   - `<Center>`: Auto-calculates model bounding box and centers at `(0, 0, 0)`.
   - `<Html occlude>`: Projects real interactive HTML into 3D world space.
   - `<ContactShadows>`: High-performance grounding shadows without expensive shadow map passes.
3. **Suspense Boundaries**: Wrap async loaders in `<Suspense fallback={<Loader />}>`.

## Example Code Pattern
```tsx
'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Center, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';

function FloatingMesh() {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    // Direct mutation: bypasses React reconciler completely
    meshRef.current.rotation.y += delta * 0.4;
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={1.2}>
      <Center>
        <mesh ref={meshRef}>
          <octahedronGeometry args={[1.2, 0]} />
          <meshStandardMaterial color="#6366f1" roughness={0.1} metalness={0.9} />
        </mesh>
      </Center>
    </Float>
  );
}

export function R3FScene() {
  return (
    <div className="relative h-[500px] w-full rounded-2xl overflow-hidden bg-neutral-950">
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ powerPreference: 'high-performance', antialias: true }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} />
        <Environment preset="city" />

        <FloatingMesh />
        <ContactShadows position={[0, -1.5, 0]} opacity={0.6} scale={8} blur={2.5} far={4} />
      </Canvas>
    </div>
  );
}
```

## Performance Cost
- R3F reconciler adds ~15KB to the bundle, but saves hundreds of hours of manual memory cleanup and event raycasting logic.
- Clamping DPR (`dpr={[1, 1.5]}`) prevents fillrate collapse on mobile screens.

## Mobile Behavior
- Clamps DPR to 1.0 on mobile devices.
- Touch events (`onPointerDown`, `onPointerMove`) map seamlessly to 3D meshes.

## Accessibility Concerns
- Use Drei's `<Html>` component to render semantic buttons and screen reader tags co-located in 3D world coordinates.

## Source Repository
- [`pmndrs/react-three-fiber`](file:///c:/Users/USER/frontend%20work/frontend-intelligence/sources/react-three-fiber-ecosystem.md)
- [`giuucmp/aether-boilerplate`](file:///c:/Users/USER/frontend%20work/frontend-intelligence/sources/aether-boilerplate.md)
