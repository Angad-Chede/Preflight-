# Technique: GSAP 3 Core & ScrollTrigger Architecture

## Technique Name
GSAP 3 Core & ScrollTrigger Architecture

## Purpose
Provides deterministic, high-performance timeline sequencing, sub-pixel scroll scrubbing, viewport pinning, and WebGL object manipulation with complete React StrictMode lifecycle management.

## Difficulty
Advanced

## Dependencies
- `gsap`: `^3.12.5`
- `@gsap/react`: `^2.1.1`

## When to Use
- Pinned viewport sections (horizontal scroll portfolios, 3D camera staging, sticky comparison cards).
- Complex choreographed timelines with 5+ interdependent animations and relative delays (`<`, `+=0.2`, labels).
- Animating non-DOM properties (Three.js `Vector3`, `Euler`, custom GLSL shader uniforms, canvas pixel arrays).
- High-precision scroll-linked progress bars, scrubbed video playback, and velocity-reactive marquees.

## When NOT to Use
- Simple UI dropdowns, modal enter/exit animations, or accordions (prefer Framer Motion `AnimatePresence`).
- Basic button hover states (prefer CSS transitions).
- Text reordering or FLIP animations across varying DOM trees (prefer Motion `layoutId`).

## Implementation Strategy
1. **Always use `@gsap/react` `useGSAP()`**: Scope all animations to a container ref. This ensures all tweens and ScrollTriggers are automatically reverted on component unmount, preventing ghost triggers in React 18/19 StrictMode.
2. **Lag Smoothing Configuration**: Set `gsap.ticker.lagSmoothing(0)` when pairing with smooth scroll engines (Lenis) so GSAP does not skip frames during scroll.
3. **Pinning Hygiene**: Configure `anticipatePin: 1` on pinned sections to eliminate layout jumps.
4. **Invalidate on Refresh**: Use `invalidateOnRefresh: true` on dynamic coordinate functions to recalculate dimensions on screen resize.

## Example Code Pattern
```tsx
'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

export function PinnedSequence() {
  const container = useRef<HTMLDivElement>(null);
  const card1 = useRef<HTMLDivElement>(null);
  const card2 = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container.current,
          start: 'top top',
          end: '+=200%',
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });

      tl.to(card1.current, { scale: 0.8, opacity: 0, duration: 1 })
        .fromTo(card2.current, { y: 100, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, '-=0.5');
    },
    { scope: container }
  );

  return (
    <div ref={container} className="relative h-screen w-full bg-neutral-950 text-white flex items-center justify-center">
      <div ref={card1} className="absolute text-5xl font-light">ACT I: THE MONOLITH</div>
      <div ref={card2} className="absolute text-5xl font-light">ACT II: THE SYNTHESIS</div>
    </div>
  );
}
```

## Performance Cost
- Minimal footprint (~28KB gzipped).
- Mutates CSS `transform: translate3d(...)` directly on the DOM element without triggering React reconciliation or DOM tree re-renders.

## Mobile Behavior
- Use `ScrollTrigger.config({ ignoreMobileResize: true })` to prevent abrupt jumps when mobile browser address bars collapse during vertical scrolling.

## Accessibility Concerns
- Always verify `prefers-reduced-motion`. If enabled, complete timeline immediately or skip pinning.

## Source Repository
- [`MuhammedAlii/high-end`](file:///c:/Users/USER/frontend%20work/frontend-intelligence/sources/high-end.md)
- [`giuucmp/aether-boilerplate`](file:///c:/Users/USER/frontend%20work/frontend-intelligence/sources/aether-boilerplate.md)
- [`mudgalz/threejs-motion`](file:///c:/Users/USER/frontend%20work/frontend-intelligence/sources/threejs-motion.md)
