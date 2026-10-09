# Recipe: 3D Product Showcase

## 1. Concept & Architectural Blueprint
An interactive e-commerce product showcase built on React Three Fiber, featuring:
- **Interactive 360 Orbit & Damping**: Smooth rotation controls locked within safe viewing angles.
- **Dynamic Material / Color Variant Switching**: Instant state-driven PBR material color shifts.
- **Exploded View Toggle**: Tweening component sub-assemblies outward along radial vectors.
- **World-Space Hotspot Annotations (`<Html>`)**: 3D spatial beacons that reveal technical specifications.
- **Camera Viewport Bookmarks**: Smooth camera transitions to preset focus angles (Front, Side, Detail).

---

## 2. Complete Next.js / React Implementation

```tsx
// components/showcase/ProductShowcase.tsx
'use client';

import { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

const COLOR_VARIANTS = [
  { name: 'Obsidian Black', hex: '#18181b', metalness: 0.9, roughness: 0.2 },
  { name: 'Titanium Silver', hex: '#e2e8f0', metalness: 0.95, roughness: 0.1 },
  { name: 'Deep Indigo', hex: '#3730a3', metalness: 0.85, roughness: 0.25 },
];

function ProductAssembly({
  color,
  isExploded,
}: {
  color: string;
  isExploded: boolean;
}) {
  const topShellRef = useRef<THREE.Mesh>(null!);
  const coreRef = useRef<THREE.Mesh>(null!);
  const baseRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    // Animate exploded positions via lerp
    const targetTopY = isExploded ? 1.2 : 0.4;
    const targetBaseY = isExploded ? -1.2 : -0.4;

    topShellRef.current.position.y += (targetTopY - topShellRef.current.position.y) * delta * 6;
    baseRef.current.position.y += (targetBaseY - baseRef.current.position.y) * delta * 6;
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Top Outer Shell */}
      <mesh ref={topShellRef} position={[0, 0.4, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 0.3, 64]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.15} />

        {/* Hotspot Annotation */}
        <Html position={[1.4, 0, 0]} center>
          <div className="rounded-full bg-neutral-900/90 px-3 py-1 text-[11px] font-mono text-indigo-300 border border-neutral-700 backdrop-blur-md shadow-lg pointer-events-none whitespace-nowrap">
            Ionized Bezel
          </div>
        </Html>
      </mesh>

      {/* Internal Electronic Core */}
      <mesh ref={coreRef} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.9, 0.9, 0.5, 64]} />
        <meshStandardMaterial color="#09090b" emissive="#6366f1" emissiveIntensity={0.5} roughness={0.4} />
      </mesh>

      {/* Base Chassis */}
      <mesh ref={baseRef} position={[0, -0.4, 0]}>
        <cylinderGeometry args={[1.15, 1.15, 0.3, 64]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.15} />
      </mesh>
    </group>
  );
}

export function ProductShowcase() {
  const [selectedColor, setSelectedColor] = useState(COLOR_VARIANTS[0]);
  const [isExploded, setIsExploded] = useState(false);
  const controlsRef = useRef<any>(null);

  const setCameraView = (view: 'front' | 'top' | 'isometric') => {
    if (!controlsRef.current) return;
    const camera = controlsRef.current.object;

    const targets = {
      front: { x: 0, y: 0, z: 4.5 },
      top: { x: 0, y: 5, z: 0.1 },
      isometric: { x: 3.5, y: 3, z: 3.5 },
    };

    const targetPos = targets[view];
    gsap.to(camera.position, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 1.2,
      ease: 'power3.inOut',
      onUpdate: () => controlsRef.current.update(),
    });
  };

  return (
    <div className="relative h-[650px] w-full rounded-3xl overflow-hidden bg-neutral-950 text-white border border-neutral-800">
      {/* 3D Canvas */}
      <Canvas camera={{ position: [3, 2.5, 3.5], fov: 45 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 10]} intensity={1.8} />
        <Environment preset="studio" />

        <ProductAssembly color={selectedColor.hex} isExploded={isExploded} />

        <ContactShadows position={[0, -1.8, 0]} opacity={0.6} scale={8} blur={2.5} far={4} />

        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          minDistance={2.5}
          maxDistance={7}
          maxPolarAngle={Math.PI / 2 + 0.1}
          dampingFactor={0.05}
        />
      </Canvas>

      {/* Floating Interactive Controls Panel */}
      <div className="absolute top-6 left-6 z-10 flex flex-col gap-4">
        <div>
          <span className="font-mono text-xs uppercase text-indigo-400">Specimen 01</span>
          <h2 className="text-2xl font-bold tracking-tight">Audio Matrix Core</h2>
        </div>

        {/* Color Palette Switcher */}
        <div className="flex items-center gap-2 rounded-full bg-neutral-900/80 p-1.5 border border-neutral-800 backdrop-blur-md">
          {COLOR_VARIANTS.map((v) => (
            <button
              key={v.name}
              onClick={() => setSelectedColor(v)}
              style={{ backgroundColor: v.hex }}
              className={`h-7 w-7 rounded-full border transition-transform ${
                selectedColor.name === v.name ? 'scale-110 border-white' : 'border-neutral-600 hover:scale-105'
              }`}
              aria-label={`Select ${v.name}`}
            />
          ))}
        </div>
      </div>

      {/* Floating Action Bar (Bottom) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 rounded-full border border-neutral-800 bg-neutral-900/80 px-4 py-2 backdrop-blur-md">
        <button
          onClick={() => setIsExploded(!isExploded)}
          className={`rounded-full px-4 py-1.5 font-mono text-xs font-medium transition-colors ${
            isExploded ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          {isExploded ? 'Assemble' : 'Exploded View'}
        </button>

        <div className="h-4 w-px bg-neutral-700" />

        <button onClick={() => setCameraView('front')} className="font-mono text-xs text-neutral-400 hover:text-white">
          Front
        </button>
        <button onClick={() => setCameraView('isometric')} className="font-mono text-xs text-neutral-400 hover:text-white">
          Iso
        </button>
        <button onClick={() => setCameraView('top')} className="font-mono text-xs text-neutral-400 hover:text-white">
          Top
        </button>
      </div>
    </div>
  );
}
```

---

## 3. Performance & Mobile Safeguards
- **Clamped OrbitControls**: Clamping `minDistance` and `maxDistance` ensures the user cannot zoom inside geometries or scroll out to infinity.
- **Lerped Exploded Offsets**: Moving assembly parts via frame-rate independent exponential interpolation (`delta * 6`) guarantees silky smooth movement on both 60Hz and 120Hz displays.
