# Technique: Lenis Smooth Scrolling Engine

## Technique Name
Lenis Smooth Scrolling Engine

## Purpose
Normalizes wheel, trackpad, and keyboard scroll events into smooth, physics-driven inertia across browsers and operating systems without hijacking native browser accessibility.

## Difficulty
Intermediate

## Dependencies
- `lenis`: `^1.1.14` or higher

## When to Use
- Editorial showcases, creative landing pages, and WebGL-synchronized experiences.
- Websites featuring GSAP scrubbed timelines where standard wheel steps produce visible stutter.

## When NOT to Use
- High-density admin panels, dashboards, spreadsheets, or forms.
- When `prefers-reduced-motion` is active.

## Implementation Strategy
1. **Initialize as a Singleton in Root Layout**: Run with `autoRaf: false` so a centralized RAF ticker drives it.
2. **Programmatic Anchor Navigation**: Use `lenis.scrollTo('#section', { offset: -80, duration: 1.5 })` for smooth link jumps.
3. **Modal Trapping**: Call `lenis.stop()` when opening dialogs, drawers, or mobile menus. Call `lenis.start()` upon dismissal.

## Example Code Pattern
```tsx
'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

export function useLenisController() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
      infinite: false,
    });

    lenisRef.current = lenis;

    let animId: number;
    const raf = (time: number) => {
      lenis.raf(time);
      animId = requestAnimationFrame(raf);
    };
    animId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(animId);
      lenis.destroy();
    };
  }, []);

  return lenisRef;
}
```

## Performance Cost
- Extremely lightweight (~6KB gzipped).
- Calculates momentum virtually and translates window position without modifying DOM tree hierarchies.

## Mobile Behavior
- Leaves mobile touch scroll native by default (`touchMultiplier: 1.5` or `smoothTouch: false`), ensuring iOS/Android flick momentum feels natural.

## Accessibility Concerns
- Preserves native keyboard navigation (`Space`, `Page Down`, Arrow keys).
- Respects `prefers-reduced-motion` by destroying instance or passing `duration: 0`.

## Source Repository
- [`giuucmp/aether-boilerplate`](file:///c:/Users/USER/frontend%20work/frontend-intelligence/sources/aether-boilerplate.md)
- [`MuhammedAlii/high-end`](file:///c:/Users/USER/frontend%20work/frontend-intelligence/sources/high-end.md)
