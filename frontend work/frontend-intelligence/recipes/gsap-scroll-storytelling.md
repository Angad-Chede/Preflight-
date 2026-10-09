# Recipe: GSAP Scroll Storytelling

## 1. Concept & Architectural Blueprint
Scroll storytelling locks (pins) the user's viewport in place while scrubbing through a multi-stage narrative. Instead of endless vertical scrolling, the user progresses through:
- **Phase 1: Conceptual Intro** — Headline enters, background elements scale up.
- **Phase 2: Exploded / Feature Breakdown** — Content shifts laterally; key components explode outward with callouts.
- **Phase 3: Synthesis & CTA** — Elements coalesce into final product configuration with reveal of action buttons.

---

## 2. Complete Next.js / React Implementation

```tsx
// components/sections/ScrollStorytelling.tsx
'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

export function ScrollStorytelling() {
  const containerRef = useRef<HTMLDivElement>(null);
  const slide1Ref = useRef<HTMLDivElement>(null);
  const slide2Ref = useRef<HTMLDivElement>(null);
  const slide3Ref = useRef<HTMLDivElement>(null);
  const progressBadgeRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: '+=300%', // 3x viewport height pinned scrub duration
          pin: true,
          scrub: 1, // Smooth 1-second lag
          anticipatePin: 1,
        },
      });

      // STAGE 1 -> STAGE 2
      tl.to(slide1Ref.current, {
        opacity: 0,
        y: -50,
        scale: 0.95,
        duration: 1,
      })
      .fromTo(
        slide2Ref.current,
        { opacity: 0, y: 50, scale: 1.05 },
        { opacity: 1, y: 0, scale: 1, duration: 1 },
        '-=0.3'
      )
      .set(progressBadgeRef.current, { innerText: '02 / 03' }, '<')

      // STAGE 2 -> STAGE 3
      .to(slide2Ref.current, {
        opacity: 0,
        y: -50,
        scale: 0.95,
        duration: 1,
      }, '+=0.5')
      .fromTo(
        slide3Ref.current,
        { opacity: 0, y: 50, scale: 1.05 },
        { opacity: 1, y: 0, scale: 1, duration: 1 },
        '-=0.3'
      )
      .set(progressBadgeRef.current, { innerText: '03 / 03' }, '<');
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      className="relative h-screen w-full overflow-hidden bg-neutral-950 text-white flex items-center justify-center p-8 select-none"
    >
      {/* Top Narrative Stage Counter */}
      <div className="absolute top-8 left-8 z-20 flex items-center gap-3">
        <span
          ref={progressBadgeRef}
          className="font-mono text-xs uppercase tracking-widest text-indigo-400"
        >
          01 / 03
        </span>
        <span className="text-xs text-neutral-500 font-mono">| Architecture Protocol</span>
      </div>

      {/* Stage 1: The Core Problem */}
      <div
        ref={slide1Ref}
        className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center max-w-4xl mx-auto"
      >
        <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">Phase 01: Inception</span>
        <h2 className="mt-4 text-5xl md:text-7xl font-light tracking-tight">
          Monolithic Systems Are Fracturing
        </h2>
        <p className="mt-6 max-w-xl text-neutral-400 text-lg">
          Legacy frontend architectures incur massive bundle payloads, uncoordinated frame loops, and high runtime latency.
        </p>
      </div>

      {/* Stage 2: The Breakthrough */}
      <div
        ref={slide2Ref}
        style={{ opacity: 0 }}
        className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center max-w-4xl mx-auto"
      >
        <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">Phase 02: Synthesis</span>
        <h2 className="mt-4 text-5xl md:text-7xl font-light tracking-tight">
          Unified Render Synchronicity
        </h2>
        <p className="mt-6 max-w-xl text-neutral-400 text-lg">
          By locking physics, DOM reflows, and WebGL rasterization into a deterministic master ticker, latency drops to near zero.
        </p>
      </div>

      {/* Stage 3: The Climax / Activation */}
      <div
        ref={slide3Ref}
        style={{ opacity: 0 }}
        className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center max-w-4xl mx-auto"
      >
        <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">Phase 03: Equilibrium</span>
        <h2 className="mt-4 text-5xl md:text-7xl font-light tracking-tight">
          Total Creative Autonomy
        </h2>
        <p className="mt-6 max-w-xl text-neutral-400 text-lg">
          Zero frame jitter. Instantaneous response. Accessible to every device and human.
        </p>
        <button className="mt-8 rounded-full bg-indigo-600 px-8 py-4 font-medium text-white shadow-lg shadow-indigo-600/30 hover:scale-105 transition-transform">
          Begin Migration
        </button>
      </div>
    </section>
  );
}
```

---

## 3. Performance & Mobile Safeguards
- **Absolute Positioning of Stages**: Layers occupy the same viewport space (`absolute inset-0`) so transformations don't trigger CSS layout reflows.
- **Duration Spacing**: The `+=0.5` delay between stages gives the user a "rest beat" during scroll where content remains fully visible before advancing.
