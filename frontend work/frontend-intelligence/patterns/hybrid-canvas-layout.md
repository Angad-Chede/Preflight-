# Pattern: Hybrid Canvas Layout Architecture

## Problem Statement
Award-winning web experiences frequently demand that 3D objects interact with or track alongside scrollable DOM elements (e.g. text cards, bento grids, buttons). Developers often make the mistake of creating multiple `<Canvas>` components throughout the page. This destroys browser performance because each `<Canvas>` allocates a separate WebGL context, quickly exceeding the browser's hard limit of 8-16 contexts and crashing the page.

---

## Architectural Solution
The **Hybrid Canvas Layout** pattern establishes:
1. **One Global Fixed Canvas**: An absolute/fixed fullscreen `<Canvas>` layer pinned to the background viewport (`z-index: 0`, `pointer-events: none`).
2. **Co-located React Trees (`tunnel-rat`)**: Developers declare 3D objects *inside* their local page components alongside semantic HTML. The 3D elements are tunneled into the global Canvas without triggering context recreation.
3. **Pointer-Events Pass-Through**: The canvas layer ignores mouse events by default (`pointer-events: none`). Interactive 3D objects enable pointer events explicitly, or DOM overlay elements manage user interaction directly.

```
+--------------------------------------------------------------+
| ROOT VIEWPORT                                                |
|                                                              |
|   [ Fixed WebGL Canvas ] (position: fixed, inset: 0, z: 0)  |
|   |-- Single WebGL Context                                   |
|   |-- Ambient Lighting / Environment                         |
|   |-- <webglTunnel.Out />  <-------------------+            |
|                                                |             |
|   [ Scrollable DOM Content ] (relative, z: 10) |             |
|   |-- Section 1: Hero Text                     |             |
|   |   |-- <webglTunnel.In> (Tunnels 3D Model) -+             |
|   |-- Section 2: Features                      |             |
|   |   |-- <webglTunnel.In> (Tunnels 3D Orb) ---+             |
+--------------------------------------------------------------+
```

---

## Production Implementation

### 1. Tunnel Portal Initialization
```ts
// lib/webgl-tunnel.ts
import tunnel from 'tunnel-rat';

export const webglTunnel = tunnel();
```

### 2. Root Layout Canvas Setup
```tsx
// components/layout/HybridRootLayout.tsx
'use client';

import { Canvas } from '@react-three/fiber';
import { webglTunnel } from '@/lib/webgl-tunnel';
import { Preload } from '@react-three/drei';

export function HybridRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full bg-neutral-950 text-white">
      {/* 1. Global Master Canvas */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{ powerPreference: 'high-performance', antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} />

          {/* Renders all tunneled 3D components from any route/page */}
          <webglTunnel.Out />

          <Preload all />
        </Canvas>
      </div>

      {/* 2. Scrollable Semantic HTML */}
      <main className="relative z-10 pointer-events-auto">
        {children}
      </main>
    </div>
  );
}
```

### 3. Co-located Feature Component
```tsx
// components/sections/ProductHighlight.tsx
'use client';

import { webglTunnel } from '@/lib/webgl-tunnel';
import { Float } from '@react-three/drei';

export function ProductHighlight() {
  return (
    <section className="relative min-h-screen flex items-center justify-between px-12 py-24">
      {/* DOM Content */}
      <div className="max-w-xl">
        <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">Hybrid Architecture</span>
        <h2 className="mt-2 text-5xl font-light">Co-located 3D & DOM</h2>
        <p className="mt-4 text-neutral-400">
          This HTML copy lives directly alongside its 3D mesh in the source code, but renders into the single master WebGL canvas.
        </p>
      </div>

      {/* Tunneled 3D Mesh */}
      <webglTunnel.In>
        <Float speed={2} rotationIntensity={1} floatIntensity={1.2}>
          <mesh position={[2, 0, 0]}>
            <octahedronGeometry args={[1.5, 0]} />
            <meshStandardMaterial color="#4f46e5" metalness={0.9} roughness={0.15} />
          </mesh>
        </Float>
      </webglTunnel.In>
    </section>
  );
}
```

---

## Key Benefits
- **Zero Context Loss**: 1 Canvas across the entire application lifecycle.
- **Developer Experience (DX)**: 3D logic and HTML copy stay in the same React component file.
- **Uncompromised SEO & Accessibility**: The DOM remains semantic HTML, easily indexed by Googlebot and read by screen readers.
