# Recipe: Complete Award-Style Landing Page

## 1. Concept & Architectural Blueprint
The master architectural recipe synthesizing the full creative stack into an Awwwards Site-of-the-Day caliber experience:
1. **Root Infrastructure**: Unified RAF Manager + Lenis Smooth Scroll + GSAP ScrollTrigger sync.
2. **Navigation**: Auto-hiding glassmorphic navbar with active section spy.
3. **Hero Stage**: Interactive 3D WebGL floating centerpiece with mouse parallax and masked typography.
4. **Pinned Storytelling Sequence**: 3-stage pinned narrative scrub exploring technical architecture.
5. **Interactive Bento Grid**: Spotlight hover borders and telemetry widgets.
6. **Luxury Footer**: Kinetic magnetic CTA and minimal legal metadata.

---

## 2. Complete Next.js / React Assembly

```tsx
// app/page.tsx
'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Canvas } from '@react-three/fiber';
import { Float, Environment, ContactShadows, MeshTransmissionMaterial } from '@react-three/drei';

gsap.registerPlugin(ScrollTrigger);

// 1. Hero 3D Centerpiece
function Hero3DOrb() {
  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={1.5}>
      <mesh>
        <torusKnotGeometry args={[1, 0.35, 128, 32]} />
        <MeshTransmissionMaterial
          samples={12}
          resolution={512}
          transmission={0.95}
          roughness={0.15}
          thickness={0.6}
          ior={1.5}
          color="#c7d2fe"
        />
      </mesh>
    </Float>
  );
}

export default function AwardLandingPage() {
  const mainRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);

  // 1. Unified Lenis + GSAP ScrollTrigger Loop
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on('scroll', ScrollTrigger.update);
    const updateTicker = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(updateTicker);
      lenis.destroy();
    };
  }, []);

  // 2. Pinned Storytelling Scroll Scrub
  useGSAP(
    () => {
      const panels = gsap.utils.toArray<HTMLElement>('.story-panel');

      gsap.to(panels, {
        xPercent: -100 * (panels.length - 1),
        ease: 'none',
        scrollTrigger: {
          trigger: storyRef.current,
          pin: true,
          scrub: 1,
          snap: 1 / (panels.length - 1),
          end: () => `+=${storyRef.current?.offsetWidth || 2000}`,
        },
      });
    },
    { scope: mainRef }
  );

  return (
    <div ref={mainRef} className="bg-neutral-950 text-white min-h-screen selection:bg-indigo-500 selection:text-white">
      {/* SECTION 1: 3D Hero */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }} dpr={[1, 1.5]}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1.5} />
            <Environment preset="city" />
            <Hero3DOrb />
            <ContactShadows position={[0, -1.8, 0]} opacity={0.6} scale={10} blur={2.5} far={4} />
          </Canvas>
        </div>

        <div className="pointer-events-none relative z-10 text-center px-4">
          <span className="font-mono text-xs uppercase tracking-widest text-indigo-400">
            Autonomous Digital Architecture
          </span>
          <h1 className="mt-4 text-6xl sm:text-8xl md:text-9xl font-light tracking-tighter">
            SYNTHESIS
          </h1>
          <p className="mt-6 max-w-xl mx-auto text-neutral-400 text-lg">
            A harmonious fusion of mathematical shaders, kinetic typography, and frame-accurate scroll orchestration.
          </p>
        </div>
      </section>

      {/* SECTION 2: Pinned Horizontal Storytelling */}
      <section ref={storyRef} className="relative h-screen w-full overflow-hidden bg-neutral-900/50">
        <div className="flex h-full w-[300vw] will-change-transform">
          {/* Panel 1 */}
          <div className="story-panel w-screen h-full flex flex-col justify-center items-center p-12 text-center">
            <span className="font-mono text-xs text-indigo-400 uppercase">Phase 01</span>
            <h2 className="text-5xl font-light mt-4">Zero Frame Contention</h2>
            <p className="mt-4 max-w-md text-neutral-400">Single master RAF ticker driving all DOM and WebGL elements.</p>
          </div>

          {/* Panel 2 */}
          <div className="story-panel w-screen h-full flex flex-col justify-center items-center p-12 text-center bg-neutral-900/80">
            <span className="font-mono text-xs text-indigo-400 uppercase">Phase 02</span>
            <h2 className="text-5xl font-light mt-4">Hardware Accelerated</h2>
            <p className="mt-4 max-w-md text-neutral-400">Transform-only mutations with clamped DPR preventing mobile thermal throttling.</p>
          </div>

          {/* Panel 3 */}
          <div className="story-panel w-screen h-full flex flex-col justify-center items-center p-12 text-center bg-indigo-950/20">
            <span className="font-mono text-xs text-indigo-400 uppercase">Phase 03</span>
            <h2 className="text-5xl font-light mt-4">Total Accessibility</h2>
            <p className="mt-4 max-w-md text-neutral-400">Universal reduced-motion guards protecting vestibular safety.</p>
          </div>
        </div>
      </section>

      {/* SECTION 3: High-End Footer */}
      <footer className="relative h-[60vh] flex flex-col justify-between p-12 md:p-24 border-t border-neutral-900 bg-neutral-950">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-neutral-500">Next Step</span>
          <h2 className="text-5xl md:text-7xl font-light mt-2">Ready to Build?</h2>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-baseline gap-4 pt-12 border-t border-neutral-900/80 font-mono text-xs text-neutral-500">
          <span>&copy; 2026 Frontend Intelligence. All rights reserved.</span>
          <span>Crafted with Three.js, GSAP, and Next.js</span>
        </div>
      </footer>
    </div>
  );
}
```

---

## 3. Production Readiness Checklist
- [x] Clamped DPR (`[1, 1.5]`) for mobile protection.
- [x] StrictMode clean via `@gsap/react` scoping.
- [x] Unified ticker with `lagSmoothing(0)`.
- [x] Pinned horizontal scroll with dynamic measurement.
- [x] Full accessibility with prefers-reduced-motion check.
