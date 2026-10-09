# Recipe: Interactive 3D Hero

## 1. Concept & Architectural Blueprint
An interactive 3D hero pairs a dynamic WebGL centerpiece (floating reflective chrome/glass geometry, ambient particle dust, and HDR reflections) with interactive mouse parallax and high-contrast editorial DOM typography.
- **R3F Scene Layer**: Clamped DPR (`[1, 1.5]`), floating physics (`<Float>`), and cursor-reactive camera orientation.
- **DOM Typography Layer**: Clean semantic HTML positioned over the canvas with `pointer-events: none` on the text container, allowing clicks and drags to pass directly into the 3D scene.
- **Lighting & Reflection**: Dynamic `<Environment preset="city" />` combined with soft grounding contact shadows.

---

## 2. Complete Next.js / React Implementation

```tsx
// components/hero/Interactive3DHero.tsx
'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, ContactShadows, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';

// 1. Floating Glass / Chrome Centerpiece
function CenterpieceGeometry() {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state, delta) => {
    meshRef.current.rotation.x += delta * 0.2;
    meshRef.current.rotation.y += delta * 0.3;
  });

  return (
    <Float speed={2} rotationIntensity={1.2} floatIntensity={1.5}>
      <mesh ref={meshRef} position={[0, 0.2, 0]}>
        <torusKnotGeometry args={[1, 0.32, 128, 32]} />
        <MeshTransmissionMaterial
          backside
          samples={12}
          resolution={512}
          transmission={0.95}
          roughness={0.12}
          thickness={0.6}
          ior={1.5}
          chromaticAberration={0.05}
          color="#e0e7ff"
        />
      </mesh>
    </Float>
  );
}

// 2. Ambient Floating Dust Particles (3,000 points)
function FloatingDust() {
  const pointsRef = useRef<THREE.Points>(null!);
  const count = 3000;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      pos[i] = (Math.random() - 0.5) * 12;
    }
    return pos;
  }, [count]);

  useFrame((_, delta) => {
    pointsRef.current.rotation.y += delta * 0.02;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color="#818cf8"
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// 3. Mouse Parallax Rig
function CameraParallaxRig() {
  useFrame((state) => {
    // Smooth camera drift toward mouse position
    state.camera.position.x = THREE.MathUtils.lerp(
      state.camera.position.x,
      state.pointer.x * 0.8,
      0.05
    );
    state.camera.position.y = THREE.MathUtils.lerp(
      state.camera.position.y,
      state.pointer.y * 0.8,
      0.05
    );
    state.camera.lookAt(0, 0, 0);
  });

  return null;
}

export function Interactive3DHero() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-neutral-950 text-white">
      {/* 3D WebGL Canvas Layer */}
      <div className="absolute inset-0 z-0">
        <Canvas
          camera={{ position: [0, 0, 4.5], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{ powerPreference: 'high-performance', antialias: true }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} />
          <Environment preset="city" />

          <CameraParallaxRig />
          <CenterpieceGeometry />
          <FloatingDust />

          <ContactShadows
            position={[0, -1.8, 0]}
            opacity={0.6}
            scale={10}
            blur={2.5}
            far={4}
          />
        </Canvas>
      </div>

      {/* Foreground Semantic DOM Layer */}
      <div className="pointer-events-none relative z-10 flex h-full flex-col justify-between p-8 md:p-16">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-widest text-indigo-400">
            Quantum Graphics Studio
          </span>
          <span className="font-mono text-xs text-neutral-400">FPS: 60 // WebGL 2.0</span>
        </div>

        <div className="max-w-3xl">
          <span className="inline-block rounded-full border border-indigo-500/30 bg-indigo-950/40 px-3 py-1 font-mono text-xs text-indigo-300">
            Spatial Computing 2026
          </span>
          <h1 className="mt-4 text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight">
            SHAPE THE INVISIBLE
          </h1>
          <p className="mt-4 max-w-lg text-lg text-neutral-300">
            Real-time optical refraction, procedural particle fields, and interactive physics engineered for the open web.
          </p>

          <div className="mt-8 flex gap-4 pointer-events-auto">
            <button className="rounded-full bg-indigo-600 px-8 py-4 font-medium text-white shadow-lg shadow-indigo-500/25 transition-transform hover:scale-105 active:scale-95">
              Launch Showcase
            </button>
            <button className="rounded-full border border-neutral-700 bg-neutral-900/60 px-8 py-4 font-medium text-neutral-300 backdrop-blur-md transition-colors hover:border-neutral-500 hover:text-white">
              Read Whitepaper
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-mono text-neutral-500">
          <span>Interact: Move mouse to orbit</span>
          <span>pmndrs / three.js</span>
        </div>
      </div>
    </section>
  );
}
```

---

## 3. Performance & Mobile Safeguards
- **Clamped DPR**: Prevents fillrate bottlenecks on mobile Retina screens.
- **Pass-through DOM**: `pointer-events: none` on the text container ensures cursor movements register directly into R3F's `state.pointer` coordinates without interference.
- **Suspense & Preload**: Wrap with Suspense boundary to prevent UI stutter while textures initialize.
