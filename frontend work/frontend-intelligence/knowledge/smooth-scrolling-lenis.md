# Smooth Scrolling with Lenis & GSAP ScrollTrigger

## 1. What the Technique Is
Smooth scrolling is the interpolation of the native viewport scroll position using a physics-driven easing function. Lenis (created by Studio Freight / Darkroom Engineering) calculates virtual momentum scroll and smoothly translates the viewport coordinates while preserving native keyboard navigation, screen reader accessibility, and browser history restoration.

---

## 2. When to Use It
- Award-winning, editorial, luxury, or portfolio landing pages with heavy scroll storytelling.
- Projects synchronizing DOM scroll positions with WebGL 3D scenes or parallax depth layers.
- Sites with GSAP ScrollTrigger scrubbed timelines where standard abrupt wheel ticks produce visible stepping or stutter.

---

## 3. When NOT to Use It
- High-density data applications, dashboards, admin panels, or code editors.
- Heavy e-commerce checkout flows or form-heavy workflows where users need immediate, instantaneous scroll response.
- Users who have requested `prefers-reduced-motion: reduce`.

---

## 4. Implementation Pattern
1. Instantiate a single global Lenis instance within a top-level client provider or layout.
2. Bind Lenis's `scroll` event to `ScrollTrigger.update()`.
3. Add `lenis.raf()` to GSAP's centralized `ticker` to avoid dual independent `requestAnimationFrame` loops.
4. Disable GSAP's `lagSmoothing(0)` to prevent desynchronization during temporary CPU stalls.
5. Provide a cleanup function removing ticker callbacks and destroying the Lenis instance upon unmount.

---

## 5. React / Next.js Example

```tsx
'use client';

import { createContext, useContext, useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const LenisContext = createContext<Lenis | null>(null);

export function useLenis() {
  return useContext(LenisContext);
}

interface SmoothScrollProviderProps {
  children: React.ReactNode;
}

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Respect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      infinite: false,
    });

    lenisRef.current = lenis;

    // 1. Pipe Lenis scroll events directly into GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    // 2. Drive Lenis updates via GSAP master ticker
    const tickerUpdate = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerUpdate);

    // 3. Disable lag smoothing to prevent visual desync
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tickerUpdate);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return (
    <LenisContext.Provider value={lenisRef.current}>
      {children}
    </LenisContext.Provider>
  );
}
```

---

## 6. Dependencies
- `lenis`: `^1.1.0` or higher
- `gsap`: `^3.12.0` or higher
- `@gsap/react`: `^2.1.0` or higher

---

## 7. Performance Considerations
- **Avoid Dual RAFs**: Never call `requestAnimationFrame` manually while GSAP ticker is running. Run Lenis exclusively inside GSAP's ticker.
- **ScrollTrigger Refresh**: Whenever asynchronous content (e.g. images, remote fonts, dynamic accordions) modifies page height, call `ScrollTrigger.refresh()`.
- **CSS `overflow` conflicts**: Avoid applying `overflow: hidden` on `<body>` without stopping Lenis; use `lenis.stop()` when opening full-screen modals to prevent background scrolling.

---

## 8. Mobile Considerations
- Touch devices often handle momentum scrolling natively with high fidelity. Lenis provides `smoothTouch: false` by default, which is recommended unless you specifically require continuous WebGL camera sync across mobile swipes.
- Set `touchMultiplier: 1.5 - 2.0` if touch smoothing is explicitly enabled.

---

## 9. Accessibility Considerations
- Check `window.matchMedia('(prefers-reduced-motion: reduce)')`. If active, do not initialize smooth scroll, or initialize with `duration: 0`.
- Preserve standard browser keyboard scrolling (`Space`, `Page Down`, Arrow keys). Lenis maintains native keyboard navigation by default.

---

## 10. Common Mistakes
1. **Running multiple Lenis instances**: Spawning multiple instances causes competing scroll position overrides and runaway CPU utilization.
2. **Forgetting to stop Lenis in modals**: Users opening an overlay dialog will continue scrolling the underlying background page unless `lenis.stop()` is triggered.
3. **Leaving `lagSmoothing` enabled in GSAP**: This causes GSAP to skip frames during heavy script execution while Lenis continues, causing pinned sections to jump out of alignment.

---

## 11. Related Patterns
- `unified-raf-manager.md`
- `gsap-timelines-scrolltrigger.md`
- `hybrid-canvas-layout.md`

---

## 12. Source References
- [AETHER Boilerplate Teardown](../sources/aether-boilerplate.md)
- [Official Docs Synthesis: Lenis & GSAP](../sources/official-docs-synthesis.md)
- Lenis GitHub: https://github.com/darkroomengineering/lenis
