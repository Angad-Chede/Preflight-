# Technique: Unified Scroll Architecture & Parallax Choreography

## Technique Name
Unified Scroll Architecture & Parallax Choreography

## Purpose
Coordinates smooth inertial scroll momentum, GSAP ScrollTrigger scrubbing, parallax depth layers, and velocity tracking under a single unified clock without frame tearing or jitter.

## Difficulty
Advanced

## Dependencies
- `lenis`: `^1.1.14`
- `gsap`: `^3.12.5`
- `@gsap/react`: `^2.1.1`

## When to Use
- Award-style creative agency sites, luxury editorial storytelling, and portfolio showcases.
- Pages synchronizing DOM scroll positions with WebGL 3D camera tracks or background shaders.
- Parallax depth compositions where background, midground, and foreground translate at differing speeds.

## When NOT to Use
- Content-heavy documentation sites, administration dashboards, or code editors.
- When `prefers-reduced-motion: reduce` is detected.

## Implementation Strategy
1. **Single Master Clock**: Lenis must run with `autoRaf: false`. Connect Lenis to ScrollTrigger with `lenis.on('scroll', ScrollTrigger.update)`. Bind `lenis.raf(time * 1000)` into `gsap.ticker.add()`. Set `gsap.ticker.lagSmoothing(0)`.
2. **Velocity Parallax**: Calculate parallax offsets proportionally using scroll velocity:
   `y: (targetY - currentY) * speedFactor`.
3. **Modal Scroll Freezing**: Call `lenis.stop()` when fullscreen modals or navigation menus open, and `lenis.start()` on close.

## Example Code Pattern
```tsx
'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

export function MultiLayerParallax() {
  const container = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const midRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Parallax depth speeds
      gsap.to(bgRef.current, {
        yPercent: 30,
        ease: 'none',
        scrollTrigger: { trigger: container.current, scrub: true },
      });

      gsap.to(midRef.current, {
        yPercent: -20,
        ease: 'none',
        scrollTrigger: { trigger: container.current, scrub: true },
      });

      gsap.to(fgRef.current, {
        yPercent: -50,
        ease: 'none',
        scrollTrigger: { trigger: container.current, scrub: true },
      });
    },
    { scope: container }
  );

  return (
    <section ref={container} className="relative h-[120vh] w-full overflow-hidden bg-neutral-950 text-white">
      <div ref={bgRef} className="absolute inset-0 bg-cover bg-center opacity-30 will-change-transform" style={{ backgroundImage: 'url(/stars.webp)' }} />
      <div ref={midRef} className="absolute inset-0 flex items-center justify-center will-change-transform">
        <h2 className="text-8xl font-bold tracking-tight text-neutral-800">EXPANSION</h2>
      </div>
      <div ref={fgRef} className="relative z-10 flex h-full flex-col justify-center items-center text-center p-8 will-change-transform">
        <span className="font-mono text-xs uppercase text-indigo-400">Deep Space Architecture</span>
        <h3 className="text-5xl font-light mt-2">Zero-Latency Storytelling</h3>
      </div>
    </section>
  );
}
```

## Performance Cost
- Utilizing `yPercent` over direct pixel `top` ensures GPU hardware composite layer acceleration.
- Single RAF loop prevents duplicate timer interrupts and CPU frame thrashing.

## Mobile Behavior
- By default, Lenis does not smooth touch scroll (`smoothTouch: false`), preserving native smartphone momentum flick behavior while maintaining ScrollTrigger position updates.

## Accessibility Concerns
- Parallax transforms can trigger severe nausea in users with vestibular disorders. If `prefers-reduced-motion` is enabled, set all parallax translation values to `0`.

## Source Repository
- [`giuucmp/aether-boilerplate`](file:///c:/Users/USER/frontend%20work/frontend-intelligence/sources/aether-boilerplate.md)
- [`MuhammedAlii/high-end`](file:///c:/Users/USER/frontend%20work/frontend-intelligence/sources/high-end.md)
