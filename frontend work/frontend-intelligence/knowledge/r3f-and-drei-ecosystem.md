# React Three Fiber (R3F) & Drei Ecosystem Architecture

## 1. What the Technique Is
React Three Fiber (R3F) is a declarative React renderer for Three.js. `@react-three/drei` is the official companion library containing a comprehensive collection of tested, performance-tuned abstractions, helpers, shaders, and controls (e.g., `<Float>`, `<Center>`, `<Html>`, `<Text>`, `<Billboard>`, `<Environment>`). Together with `tunnel-rat`, they enable seamless hybrid applications bridging the React DOM and WebGL scenes.

---

## 2. When to Use It
- Any 3D feature built inside a modern React or Next.js application.
- When 3D elements require interactive HTML tooltips or annotations projected in 3D world space.
- Projects needing declarative scene layout, automatic memory cleanup, and ergonomic hook integration (`useFrame`, `useThree`).

---

## 3. When NOT to Use It
- Non-React codebases (Vanilla JS, Svelte, Vue, or Angular projects).
- Pure computation WebGL pipelines (GPGPU data analysis) that do not benefit from component hierarchy.

---

## 4. Implementation Pattern
1. **The Drei Toolkit Core Primitives**:
   - `<Float>`: Adds smooth procedural floating bobbing and rotational oscillation without writing manual math.
   - `<Center>`: Automatically calculates bounding boxes of arbitrary models and centers them at `[0, 0, 0]`.
   - `<Html>`: Projects real HTML DOM elements into 3D space, automatically scaling and occluding behind 3D geometry.
   - `<Billboard>`: Automatically rotates meshes to always face the camera (useful for tags, labels, and 2D sprite particle effects).
2. **`useFrame` Priority System**:
   - `useFrame((state, delta) => {}, priority)`: Priority `0` renders by default. Passing negative or positive priorities allows fine-grained execution ordering (e.g. updating physics before rendering, or running manual postprocessing passes).

---

## 5. React / Next.js Example (Annotated 3D Component)

```tsx
'use client';

import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Center, Float, Html, Billboard } from '@react-three/drei';

function InteractiveHotspot({ position, label }: { position: [number, number, number]; label: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <group position={position}>
      {/* 3D Hotspot Beacon */}
      <mesh onClick={() => setIsOpen(!isOpen)}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#6366f1" emissive="#818cf8" emissiveIntensity={2} />
      </mesh>

      {/* Projected HTML Annotation with Occlusion */}
      <Html
        position={[0, 0.15, 0]}
        center
        distanceFactor={6}
        occlude="blending" // Occludes naturally behind 3D geometry
      >
        <div className="relative pointer-events-auto">
          {isOpen ? (
            <div className="flex flex-col gap-1 rounded-xl border border-neutral-700 bg-neutral-900/90 p-3 shadow-xl backdrop-blur-md text-white w-48 animate-in fade-in zoom-in-95">
              <span className="text-xs font-mono uppercase text-indigo-400">Spec Detail</span>
              <p className="text-xs text-neutral-300">{label}</p>
              <button
                onClick={() => setIsOpen(false)}
                className="mt-1 text-[10px] text-neutral-500 hover:text-white"
              >
                Close
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsOpen(true)}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600/80 text-white text-xs font-bold hover:scale-110 transition-transform shadow-md"
              aria-label="View Annotation"
            >
              +
            </button>
          )}
        </div>
      </Html>
    </group>
  );
}

function HeroObjectWithAnnotations() {
  return (
    <Float speed={1.8} rotationIntensity={0.6} floatIntensity={1}>
      <Center>
        <mesh>
          <torusGeometry args={[1.2, 0.4, 32, 100]} />
          <meshStandardMaterial color="#1e1e24" metalness={0.9} roughness={0.15} />
        </mesh>

        {/* Spatial Annotations */}
        <InteractiveHotspot position={[1.4, 0.5, 0]} label="Aerospace Grade Titanium Alloy Chassis" />
        <InteractiveHotspot position={[-1.4, -0.4, 0]} label="Sub-atomic Quantum Resonator" />
      </Center>
    </Float>
  );
}

export function AnnotatedCanvas() {
  return (
    <div className="relative h-[600px] w-full rounded-3xl overflow-hidden bg-neutral-950">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 10]} intensity={1.5} />
        <HeroObjectWithAnnotations />
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
- **`<Html>` Occlusion Cost**: Using `occlude="blending"` or `occlude={[ref1, ref2]}` performs raycasting from the camera to the element on every frame. If you have 50+ hotspots, raycasting can create CPU bottlenecks. Limit interactive `<Html>` hotspots to 3-6 per scene.
- **`dpr` Clamping**: Always specify `<Canvas dpr={[1, 1.5]}>`.
- **Event Handling**: R3F raycasts mouse events (`onClick`, `onPointerOver`) across the scene. Add `raycast={null}` on background meshes that don't need pointer events to eliminate unnecessary raycasting tests.

---

## 8. Mobile Considerations
- Hotspots using `<Html>` must have minimum tap target dimensions (at least 44x44px) on touch screens.
- Disable auto-rotation when user is interacting with an open HTML tooltip.

---

## 9. Accessibility Considerations
- HTML elements projected via `<Html>` exist in the actual DOM tree. Ensure they retain semantic buttons, keyboard tab indices, and ARIA labels.
- Keyboard users can `Tab` directly to Drei `<Html>` annotations and activate them via `Enter` or `Space`.

---

## 10. Common Mistakes
1. **Calling `setState` in `useFrame`**: Triggers infinite React render cascades. Always mutate properties directly via `ref.current`.
2. **Missing `makeDefault` on Camera or Controls**: When using multiple camera setups or controls, forgetting `makeDefault` prevents Drei helpers from discovering the active camera.
3. **Placing `<Canvas>` in non-relative containers with 0 height**: A Canvas with no parent height will render at `0px` tall and appear completely invisible.

---

## 11. Related Patterns
- `interactive-3d-hero.md`
- `3d-product-showcase.md`
- `react-three-fiber-ecosystem.md`

---

## 12. Source References
- [React Three Fiber Ecosystem Teardown](../sources/react-three-fiber-ecosystem.md)
- Drei Documentation: https://github.com/pmndrs/drei
