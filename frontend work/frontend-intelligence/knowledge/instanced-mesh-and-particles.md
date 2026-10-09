# InstancedMesh & GPU Particle Systems

## 1. What the Technique Is
InstancedMesh and GPU particle systems render tens of thousands (or millions) of visual objects in a **single GPU draw call**. In standard WebGL, rendering 10,000 individual `THREE.Mesh` instances requires 10,000 distinct CPU-to-GPU draw calls, dropping performance to single-digit FPS. `InstancedMesh` and `THREE.Points` upload geometry once and pass per-instance transformation matrices, colors, or custom attributes directly to the GPU shader.

---

## 2. When to Use It
- Ambient floating dust motes, stars, cosmic particle fields, or neural network nodes.
- High-density repetitive geometric arrays (data grids, audio visualizer bars, terrain lattices).
- Interactive mouse-fluid particle fields dispersing and reforming upon cursor approach.

---

## 3. When NOT to Use It
- Scenes with 3-5 unique, non-repeating complex assets with differing materials.
- When every single object requires independent complex physics colliders computed in JavaScript CPU.

---

## 4. Implementation Pattern
1. **`THREE.InstancedMesh` Pattern**:
   - Allocate `instancedMesh = new THREE.InstancedMesh(geometry, material, count)`.
   - Iterate through items using a temporary `dummy = new THREE.Object3D()`, set `dummy.position`, `dummy.rotation`, `dummy.scale`, update matrix, and call `instancedMesh.setMatrixAt(i, dummy.matrix)`.
   - Set `instancedMesh.instanceMatrix.needsUpdate = true`.
2. **GPU `THREE.Points` with Custom Attribute Pattern**:
   - Create a `BufferGeometry`.
   - Allocate `Float32Array` buffers for positions, random velocity seeds, and sizes.
   - Displace points inside the vertex shader using Simplex / Curl noise driven by `uTime`.

---

## 5. React / Next.js Example (with R3F)

```tsx
'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// 1. High-Performance Floating Dust Field (10,000 Points)
function AmbientDustField({ count = 8000 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null!);

  const [positions, scales] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const scl = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Spread across a 15x15x15 cube volume
      pos[i * 3] = (Math.random() - 0.5) * 15;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 15;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 15;

      scl[i] = Math.random() * 0.8 + 0.2;
    }
    return [pos, scl];
  }, [count]);

  useFrame((state, delta) => {
    // Gentle global drift
    pointsRef.current.rotation.y += delta * 0.03;
    pointsRef.current.rotation.x += delta * 0.015;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-aScale"
          args={[scales, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#a5b4fc"
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// 2. Interactive Instanced Geometric Grid (1,600 Cubes)
function InstancedGrid({ rows = 40, cols = 40 }: { rows?: number; cols?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const count = rows * cols;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    let idx = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = (c - cols / 2) * 0.25;
        const z = (r - rows / 2) * 0.25;
        // Undulating wave height
        const dist = Math.sqrt(x * x + z * z);
        const y = Math.sin(dist * 2.0 - time * 2.5) * 0.4;

        dummy.position.set(x, y, z);
        dummy.scale.setScalar(0.12);
        dummy.updateMatrix();

        meshRef.current.setMatrixAt(idx++, dummy.matrix);
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#4f46e5" metalness={0.9} roughness={0.1} />
    </instancedMesh>
  );
}

export function ParticleShowcaseCanvas() {
  return (
    <div className="relative h-[550px] w-full rounded-2xl overflow-hidden bg-neutral-950">
      <Canvas camera={{ position: [0, 4, 6], fov: 45 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={2} />

        <AmbientDustField />
        <InstancedGrid />
      </Canvas>
    </div>
  );
}
```

---

## 6. Dependencies
- `@react-three/fiber`: `^8.15.0`
- `three`: `^0.160.0`

---

## 7. Performance Considerations
- **`depthWrite: false` on Additive Particles**: Crucial for transparent particles. When `depthWrite: true`, transparent particles write their depth to the Z-buffer and occlude particles behind them, creating dark square bounding artifacts.
- **Draw Call Reduction**: 10,000 points via `THREE.Points` = **1 draw call**. 1,600 instanced cubes = **1 draw call**.
- **CPU Loop Overhead**: If updating thousands of matrix transforms in JavaScript every frame, move the wave math into a custom vertex shader via `onBeforeCompile` to offload the calculations to the GPU.

---

## 8. Mobile Considerations
- Reduce particle count on mobile: Scale from 10,000 particles on desktop down to 2,000 - 3,000 on mobile devices.
- Disable additive blending if high overdraw (thousands of overlapping semi-transparent particles) causes fillrate bottlenecks.

---

## 9. Accessibility Considerations
- Avoid high-frequency strobe animations across particle fields. Maintain gentle, fluid drift rates.
- Disable particle motion when `prefers-reduced-motion` is detected.

---

## 10. Common Mistakes
1. **Forgetting `instanceMatrix.needsUpdate = true`**: Modifying `setMatrixAt()` without setting `needsUpdate = true` will result in the mesh freezing with zero visual changes.
2. **Allocating `new THREE.Object3D()` inside the render loop**: Allocating dummy helper objects inside `useFrame` generates thousands of heap allocations per frame, provoking GC freezes. Allocate one persistent `dummy` outside the loop.
3. **Leaving `depthWrite: true` with transparency**: Produces harsh clipping rectangular boxes around circular particle textures.

---

## 11. Related Patterns
- `lattice-drift.md`
- `threejs-celestial-forge.md`
- `webgl-background.md`

---

## 12. Source References
- [Lattice Drift Teardown](../sources/lattice-drift.md)
- [ThreeJS Celestial Forge Teardown](../sources/threejs-celestial-forge.md)
