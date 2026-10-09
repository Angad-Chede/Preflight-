# Accessibility & `prefers-reduced-motion` Engineering

## 1. What the Technique Is
Accessibility in creative web engineering guarantees that rich visual effects, animations, 3D scenes, and kinetic typography do not trigger nausea, dizziness, or seizures in users with vestibular disorders or photosensitive epilepsy. It also ensures that screen reader users and keyboard-only navigators receive 100% of the site's content and semantic structure.

---

## 2. When to Use It
- **Mandatory on every single production web application.**
- Across all animation libraries: CSS `@media (prefers-reduced-motion)`, GSAP, Framer Motion, and Three.js render loops.

---

## 3. When NOT to Use It
- Never. Accessibility is a fundamental baseline requirement, not an optional feature.

---

## 4. Implementation Pattern
1. **Three-Layer Motion Guard**:
   - **CSS Layer**: `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }`
   - **React/Motion Layer**: Wrap application in `<MotionConfig reducedMotion="user">`.
   - **GSAP / WebGL Layer**: Query `window.matchMedia('(prefers-reduced-motion: reduce)')`. When true, pause camera auto-rotation, disable scrubbed parallax offsets, and instantly resolve timelines.
2. **Accessible 3D Canvas Pairing**:
   - WebGL `<canvas>` elements cannot be read by screen readers.
   - Attach `aria-hidden="true"` to the canvas and place an un-hidden, semantic HTML companion structure adjacent to the canvas with headings, descriptions, and feature lists.
3. **Keyboard Navigation & Focus Trapping**:
   - All interactive controls inside 3D scenes must be mirrored by or bound to keyboard-accessible HTML buttons with visible `:focus-visible` styling.

---

## 5. React / Next.js Example

```tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, MotionConfig } from 'framer-motion';
import gsap from 'gsap';

// Reusable hook for detecting reduced motion across components
export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  return prefersReducedMotion;
}

// Accessible Animation Wrapper
export function AccessibleHero({ title, subtitle }: { title: string; subtitle: string }) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <MotionConfig reducedMotion="user">
      <section className="relative min-h-[500px] flex flex-col justify-center p-8 bg-neutral-950 text-white">
        {/* Semantic Heading with Screen Reader Safety */}
        <motion.h1
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.8, ease: 'easeOut' }}
          className="text-5xl md:text-7xl font-bold tracking-tight"
        >
          {title}
        </motion.h1>

        <motion.p
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.8, delay: reducedMotion ? 0 : 0.2 }}
          className="mt-4 max-w-xl text-lg text-neutral-400"
        >
          {subtitle}
        </motion.p>

        {/* Action Button with focus-visible keyboard ring */}
        <div className="mt-8 flex gap-4">
          <motion.button
            whileHover={reducedMotion ? {} : { scale: 1.04 }}
            whileTap={reducedMotion ? {} : { scale: 0.98 }}
            className="rounded-full bg-indigo-600 px-6 py-3 font-medium text-white shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            Explore Systems
          </motion.button>
        </div>
      </section>
    </MotionConfig>
  );
}
```

---

## 6. Dependencies
- `framer-motion`: `^11.0.0`
- `gsap`: `^3.12.0`

---

## 7. Performance Considerations
- Respecting reduced motion actually **improves performance** for users requesting it, reducing GPU rasterization workloads and CPU layout recalculations to near zero.

---

## 8. Mobile Considerations
- Both iOS ("Reduce Motion" in Accessibility settings) and Android ("Remove animations") expose system-level toggles that map directly to the `(prefers-reduced-motion: reduce)` media query.

---

## 9. Accessibility Checklist for Creative Sites
- [ ] Are all animated headlines readable without animations playing?
- [ ] Does the page remain 100% usable if JavaScript is delayed or fails?
- [ ] Do custom cursors keep keyboard focus rings intact?
- [ ] Is there an un-occluded `:focus-visible` ring on every clickable item?
- [ ] Do 3D canvases have companion semantic HTML describing the scene?
- [ ] Are color contrasts compliant with WCAG AA (4.5:1 for body copy)?

---

## 10. Common Mistakes
1. **Killing accessibility in CSS resets**: Using `* { display: none !important }` hacks or removing outlines with `outline: none` without providing an alternative `:focus-visible` ring.
2. **Trapping screen readers in WebGL**: Providing no HTML alternative to content displayed inside a Three.js canvas.
3. **Ignoring live changes**: Failing to listen to `mediaQuery.addEventListener('change')`, requiring a user to refresh the page if they toggle system accessibility settings.

---

## 11. Related Patterns
- `use-reduced-motion.md`
- `text-animations-choreography.md`
- `motion-framer-orchestration.md`

---

## 12. Source References
- W3C Web Content Accessibility Guidelines (WCAG) 2.2
- MDN Web Docs: `prefers-reduced-motion`
