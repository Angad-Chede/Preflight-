# GSAP Timelines & ScrollTrigger Architecture

## 1. What the Technique Is
GSAP (GreenSock Animation Platform) paired with its ScrollTrigger plugin allows programmatic, timeline-based animation sequences driven either by trigger entry points (`toggleActions`) or direct scrubbed scroll position (`scrub: true | number`). It provides precise viewport pinning, velocity smoothing, and frame-accurate synchronization across multiple DOM and WebGL elements.

---

## 2. When to Use It
- Multi-step storytelling sequences where elements reveal, transform, and exit as the user scrolls.
- Pinned viewport sections (e.g. horizontal scroll sections, 3D camera staging, sticky comparison panels).
- Complex choreographed timelines involving 5+ coordinated elements with relative delays (`<`, `+=0.2`, `label`).
- Scrubbed interactions requiring custom easing or inertia smoothing.

---

## 3. When NOT to Use It
- Simple hover micro-interactions, dropdown reveals, or toast notifications (prefer CSS transitions or Framer Motion).
- Basic layout animations where DOM elements change position due to state changes (prefer Motion's `layoutId`).
- Environments where bundle size is constrained to absolute minimalism (<10KB budget) and simple CSS `@keyframes` suffice.

---

## 4. Implementation Pattern
1. Always scope GSAP triggers inside `useGSAP()` or `gsap.context()` to guarantee clean unmounting and prevent memory leaks / duplicate triggers in React StrictMode.
2. Structure animations into `gsap.timeline()` instances rather than loose independent tweens.
3. Configure `anticipatePin: 1` on pinned sections to eliminate layout jumping.
4. Use `fastScrollEnd: true` on scrubbed triggers to force animations to snap to their end states during aggressive user flicking.
5. Animate internal container elements rather than the trigger element itself to prevent layout feedback loops.

---

## 5. React / Next.js Example

```tsx
'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

export function HorizontalPinnedShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const track = trackRef.current;
      if (!track) return;

      // Calculate total horizontal travel distance
      const scrollDistance = track.scrollWidth - window.innerWidth;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: () => `+=${scrollDistance}`,
          pin: true,
          scrub: 1, // Smooth 1-second catchup
          anticipatePin: 1,
          invalidateOnRefresh: true, // Recalculates dynamically on viewport resize
        },
      });

      tl.to(track, {
        x: () => -scrollDistance,
        ease: 'none',
      });
    },
    { scope: containerRef }
  );

  return (
    <section ref={containerRef} className="relative h-screen w-full overflow-hidden bg-neutral-950 text-white">
      <div className="absolute top-8 left-8 z-10">
        <span className="text-xs uppercase tracking-widest text-neutral-400">Curated Works</span>
        <h2 className="text-3xl font-light">Engineered Capabilities</h2>
      </div>

      <div ref={trackRef} className="flex h-full items-center gap-8 pl-[20vw] pr-[20vw] will-change-transform">
        {[1, 2, 3, 4, 5].map((item) => (
          <div
            key={item}
            className="flex h-[60vh] w-[45vw] shrink-0 flex-col justify-end rounded-2xl border border-neutral-800 bg-neutral-900/60 p-8 backdrop-blur-md"
          >
            <span className="text-sm font-mono text-indigo-400">0{item} / 05</span>
            <h3 className="text-2xl font-medium mt-2">Interactive Showcase Item {item}</h3>
            <p className="text-sm text-neutral-400 mt-1">
              Scroll-driven multi-stage presentation pinned across viewport depth.
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

---

## 6. Dependencies
- `gsap`: `^3.12.0`
- `@gsap/react`: `^2.1.0`

---

## 7. Performance Considerations
- **Transform Only**: Restrict animated properties to `x`, `y`, `scale`, `rotation`, and `opacity`. Never scrub `width`, `height`, `left`, `top`, or `margin`.
- **`will-change: transform`**: Apply on heavily scrubbed large tracks, but remove or avoid applying to dozens of individual child elements simultaneously.
- **`invalidateOnRefresh: true`**: Crucial when using function-based values (`() => -scrollDistance`) so that window resize events recalculate accurate dimensions without reload.

---

## 8. Mobile Considerations
- Mobile browsers dynamically expand and contract their address bar, altering `window.innerHeight` and causing ScrollTrigger resize recalculations.
- Use `ScrollTrigger.config({ ignoreMobileResize: true })` to suppress unnecessary full refreshes on mobile address-bar collapse.

---

## 9. Accessibility Considerations
- Query `prefers-reduced-motion`. If active, avoid long pinned sections that lock scroll progression. Instead, lay out cards in standard vertical flex/grid order.
- Ensure all interactive elements within pinned or horizontal tracks retain logical `tabIndex` focus order.

---

## 10. Common Mistakes
1. **Animating the trigger**: Modifying the trigger element's position during scroll causes the start/end trigger points to shift in real time, producing rapid infinite flickering.
2. **Missing `scope` or `ctx.revert()`**: Leaving orphaned ScrollTriggers active after navigating to another route in Next.js.
3. **Hardcoded pixel end distances**: Using `end: '+=2000px'` instead of dynamic functions or percentage multipliers causes layout overlap or dead space on varying screen heights.

---

## 11. Related Patterns
- `smooth-scrolling-lenis.md`
- `gsap-scroll-storytelling.md`
- `threejs-motion.md`

---

## 12. Source References
- [High-End Repository Teardown](../sources/high-end.md)
- [Official Docs Synthesis](../sources/official-docs-synthesis.md)
- GSAP Official Docs: https://gsap.com/docs/v3/Plugins/ScrollTrigger/
