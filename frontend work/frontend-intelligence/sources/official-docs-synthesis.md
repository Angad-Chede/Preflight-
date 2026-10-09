# Official Documentation Synthesis: The Modern Frontend Creative Stack

## Scope & Coverage
This document synthesizes core guidelines, modern API best practices, breaking changes, and cross-framework integration rules from the official documentation of:
- **GSAP 3 & GSAP ScrollTrigger** (GreenSock)
- **Lenis v1** (Studio Freight / Darkroom Engineering)
- **Three.js** (mrdoob)
- **React Three Fiber (R3F) & Drei** (pmndrs)
- **React Postprocessing** (pmndrs)
- **Motion / Framer Motion v11+**
- **Tailwind CSS v3 / v4**
- **Next.js 14 / 15 (App Router)**

---

## 1. GSAP 3 & ScrollTrigger (Official Standards)

### The Mandatory React Pattern: `gsap.context()` & `useGSAP()`
Since React 18 introduction of StrictMode (double-invoking effects in dev), traditional `useEffect(() => { gsap.to(...) }, [])` creates duplicate animations and orphaned ScrollTrigger instances.
The official standard:
```tsx
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function AnimatedSection() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // All selectors and triggers scoped automatically to container
      gsap.to('.box', {
        x: 100,
        scrollTrigger: {
          trigger: '.box',
          start: 'top 80%',
          end: 'top 20%',
          scrub: true,
        },
      });
    },
    { scope: container }
  ); // Automatically reverts and kills all tweens/triggers on unmount!

  return (
    <div ref={container}>
      <div className="box" />
    </div>
  );
}
```

### Critical Official ScrollTrigger Rules:
1. **Never animate the `trigger` element directly with transforms that affect layout/scroll offset**: Animate a child inside the trigger instead, or you create infinite feedback loops (trigger shifts -> recalculates start -> shifts again).
2. **`anticipatePin`**: When using `pin: true`, set `anticipatePin: 1` to prevent jitter on fast scroll before the pin kicks in.
3. **`fastScrollEnd`**: When scrolling very fast over short scrub triggers, use `fastScrollEnd: true` so the animation snaps to completion rather than lagging behind.
4. **`ScrollTrigger.refresh()`**: Call whenever images load, fonts load, or DOM dimensions mutate.

---

## 2. Lenis v1 (Darkroom Engineering Standard)

### Official Purpose & Integration Philosophy:
Lenis is a **smooth scroll engine** that normalizes wheel, touch, and keyboard scrolling across platforms without hijacking native browser behavior (unlike old rigid smooth-scroll plugins that break keyboard accessibility).

### Official Sync Loop with GSAP:
```ts
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
});

// 1. Connect Lenis scroll events to ScrollTrigger updates
lenis.on('scroll', ScrollTrigger.update);

// 2. Connect GSAP ticker to drive Lenis RAF
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});

// 3. Disable GSAP lag smoothing to avoid lag-spikes desyncing the scroll
gsap.ticker.lagSmoothing(0);
```

### Accessibility & Anchor Handling:
- Respect `prefers-reduced-motion`: When detected, either initialize Lenis with `{ duration: 0 }` or destroy the instance.
- Anchors: Use `lenis.scrollTo('#target', { offset: -80, duration: 1.5 })` for smooth anchor jumping.

---

## 3. Three.js & Memory Management (Official Standards)

### The Geometry & Material Disposal Contract:
Three.js objects live in WebGL GPU memory. JavaScript Garbage Collection **does NOT free GPU memory**.
```ts
// Manual Three.js cleanup:
geometry.dispose();
material.dispose();
texture.dispose();
renderer.dispose();
renderer.forceContextLoss();
```
In R3F, this cleanup is handled automatically for JSX elements, but custom allocated textures or offscreen render targets MUST still be manually disposed in cleanup functions.

### Color Space Standards:
- Three.js modern standard requires `renderer.outputColorSpace = THREE.SRGBColorSpace;` (replacing deprecated `sRGBEncoding`).
- Textures holding color data must specify `texture.colorSpace = THREE.SRGBColorSpace;`. Normal maps and roughness maps MUST remain `THREE.NoColorSpace` (linear).

---

## 4. React Three Fiber & Drei (pmndrs Standards)

### Official Best Practices:
1. **Never allocate objects in `useFrame`**: Creating `new THREE.Vector3()` or `new THREE.Color()` inside a frame loop generates 120 allocations/sec, triggering garbage collection hitches. Allocate scratch variables outside the loop and mutate them with `.copy()` or `.set()`.
2. **`useGLTF` caching & preloading**: `useGLTF` stores loaded assets in a global LRU cache. Preload at top level: `useGLTF.preload('/model.glb')`.
3. **Canvas fallback**: Always supply a `<Suspense fallback={<Loader />}>` boundary inside `<Canvas>` so asynchronous assets suspend cleanly without crashing the tree.
4. **`dpr` control**: `<Canvas dpr={[1, 1.5]}>` clamps mobile rendering to 1.5 DPR, preventing GPU exhaustion on 3x screens.

---

## 5. React Postprocessing (pmndrs Standards)

### Official Pass Ordering & Performance Hierarchy:
Postprocessing executes full-screen quad render passes. Every extra pass costs GPU fillrate.
- Use **`@react-three/postprocessing`** because it bundles compatible effects into a single composite shader pass rather than creating 6 separate render passes.
- Optimal pipeline:
  ```tsx
  <EffectComposer disableNormalPass multisampling={0}>
    <Bloom luminanceThreshold={0.9} mipmapBlur intensity={1.2} />
    <Vignette eskil={false} offset={0.1} darkness={0.8} />
    <Noise opacity={0.02} />
  </EffectComposer>
  ```
- **Rule**: Set `multisampling={0}` when using `mipmapBlur` on Bloom, which saves significant memory on mobile.

---

## 6. Motion / Framer Motion v11+ (Official Standards)

### When to pick Motion over GSAP:
- Motion is ideal for **component state transitions** (`AnimatePresence`, conditional mounts/unmounts).
- **Layout morphing**: `layout` and `layoutId` allow seamless morphing between differing DOM trees.
- **Micro-gestures**: `whileHover`, `whileTap`, `whileDrag`, `dragConstraints`.

### Accessibility:
```tsx
import { MotionConfig } from 'framer-motion';

<MotionConfig reducedMotion="user">
  <App />
</MotionConfig>
```
Setting `reducedMotion="user"` automatically disables transform transitions and converts them to instant updates or gentle opacity fades.

---

## 7. Tailwind CSS v3 / v4 & Next.js App Router (Standards)

### Hardware Acceleration with Tailwind:
- Prefer `transform-gpu` to force layer promotion: `className="transform-gpu translate-y-0"`
- Avoid animating `left`, `top`, `width`, `height`, `margin`, `padding` — these cause CPU layout reflows. Animate only `translate`, `scale`, `rotate`, `opacity`.

### Next.js App Router SSR / Hydration Safety:
- Any component consuming `window`, `document`, GSAP, Lenis, or Three.js MUST include `'use client';` at the very top.
- Heavy 3D Canvas scenes should be imported dynamically with SSR disabled:
  ```tsx
  import dynamic from 'next/dynamic';
  const CanvasScene = dynamic(() => import('@/components/CanvasScene'), { ssr: false });
  ```
