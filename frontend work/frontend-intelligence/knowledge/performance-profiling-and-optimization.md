# Performance Profiling & Optimization Architecture

## 1. What the Technique Is
Performance profiling and optimization is the disciplined audit of CPU execution, GPU fragment/vertex fillrate, draw calls, JavaScript bundle footprints, and memory leaks. In high-end creative web development, stunning visual fidelity must never compromise 60/120 FPS render loops, sub-2-second Time to Interactive (TTI), or stable Core Web Vitals (LCP, CLS, INP).

---

## 2. When to Use It
- Every production deployment.
- Whenever frame rate drops below 60 FPS on mid-tier test hardware.
- When memory usage steadily climbs over time (indicating a memory leak).

---

## 3. When NOT to Use It
- Premature micro-optimizations that damage code readability before verifying bottlenecks through Chrome DevTools Performance and Memory profilers.

---

## 4. Implementation Pattern
1. **Draw Call Budget**:
   - Keep total WebGL draw calls under **50-100 per frame** on mobile, and under **200** on desktop.
   - Combine geometries via `BufferGeometryUtils.mergeGeometries` or use `InstancedMesh`.
2. **GPU Texture Memory Formula**:
   - `Texture Memory (Bytes) = Width * Height * 4 bytes (RGBA) * 1.33 (Mipmaps)`
   - *Example*: A single 4096x4096 texture = `4096 * 4096 * 4 * 1.33 = ~89.2 MB` of uncompressed VRAM!
   - Downscaling to 1024x1024 = `1024 * 1024 * 4 * 1.33 = ~5.5 MB` (a 94% reduction in GPU VRAM).
3. **Next.js Bundle Splitting**:
   - Never import Three.js, GSAP, or heavy canvas scenes in initial Server Components or standard page root.
   - Use dynamic imports with `ssr: false`:
     `const Scene = dynamic(() => import('@/components/Scene'), { ssr: false, loading: () => <Skeleton /> });`
4. **Chrome DevTools Profiling Flow**:
   - Performance Tab: Look for "Long Tasks" (>50ms) during scroll.
   - Rendering Tab: Enable "Paint flashing" and "FPS meter".
   - Memory Tab: Take Heap Snapshots before and after route navigation to catch detached DOM nodes or un-disposed WebGL buffers.

---

## 5. React / Next.js Example (Lazy-Loading & Profiling Monitor)

```tsx
'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// 1. Code-splitting: Scene bundle loaded strictly on-demand after initial page paint
const HeavyThreeScene = dynamic(
  () => import('./HeavyThreeScene').then((mod) => mod.HeavyThreeScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[500px] w-full items-center justify-center rounded-2xl bg-neutral-900 border border-neutral-800">
        <span className="text-sm font-mono text-neutral-500 animate-pulse">Initializing 3D Pipeline...</span>
      </div>
    ),
  }
);

// 2. Dev-Only Lightweight Performance HUD
export function PerformanceHUD() {
  const [fps, setFps] = useState(60);
  const [memoryMB, setMemoryMB] = useState<number | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const measure = () => {
      frameCount++;
      const now = performance.now();
      if (now >= lastTime + 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;

        // Chrome-specific heap memory
        if ((performance as any).memory) {
          setMemoryMB(Math.round((performance as any).memory.usedJSHeapSize / 1048576));
        }
      }
      animId = requestAnimationFrame(measure);
    };

    animId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(animId);
  }, []);

  if (process.env.NODE_ENV === 'production') return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-950/90 px-3 py-1.5 font-mono text-xs text-neutral-300 backdrop-blur-md">
      <span className={fps < 50 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
        {fps} FPS
      </span>
      {memoryMB !== null && <span className="text-neutral-500">| {memoryMB} MB Heap</span>}
    </div>
  );
}

export function OptimizedPerformanceContainer() {
  return (
    <section className="relative my-12">
      <HeavyThreeScene />
      <PerformanceHUD />
    </section>
  );
}
```

---

## 6. Dependencies
- `next/dynamic`
- Standard Web APIs (`performance.now()`)

---

## 7. Performance Considerations
- **Interaction to Next Paint (INP)**: Ensure scroll handlers and pointer events do not block the main thread for >50ms. Debounce or pass updates through a decoupled RAF ticker.
- **Tree Shaking GSAP**: Always import directly: `import { gsap } from 'gsap'` and `import { ScrollTrigger } from 'gsap/ScrollTrigger'`. Do not import monolithic bundles.

---

## 8. Mobile Considerations
- Mobile devices throttle aggressive CPU bursts to prevent heat buildup. Avoid spike-heavy synchronous calculations during page initialization.
- Use `requestIdleCallback()` or `setTimeout(..., 100)` for secondary non-critical animation setups.

---

## 9. Accessibility Considerations
- Faster websites directly benefit assistive technologies. Heavy DOM reflows and frozen main threads make screen readers lag and become unresponsive.

---

## 10. Common Mistakes
1. **Importing Three.js at Root**: Including `import * as THREE from 'three'` in the root layout bundle forces every visitor to download 600KB+ before First Contentful Paint (FCP).
2. **Ignoring Texture Mipmaps**: Disabling mipmaps causes severe texture aliasing/shimmering when viewing models at shallow angles and increases GPU memory traffic.
3. **Unbounded Animation Tickers**: Starting an animation ticker that continues computing mathematical updates even when the component is scrolled far out of the viewport. Use `ScrollTrigger` or `IntersectionObserver` to pause offscreen render loops.

---

## 11. Related Patterns
- `responsive-dpr-monitor.md`
- `unified-raf-manager.md`
- `threejs-scene-architecture.md`

---

## 12. Source References
- Google Web Vitals Documentation: https://web.dev/vitals/
- Chrome DevTools Memory Profiling Guide
- Three.js Manual: Performance Guidelines
