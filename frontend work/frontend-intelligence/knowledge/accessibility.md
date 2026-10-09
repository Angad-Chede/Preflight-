# Technique: Accessibility & Vestibular Safety Engineering

## Technique Name
Accessibility & Vestibular Safety Engineering

## Purpose
Guarantees that high-end motion graphics, 3D scenes, custom cursors, and kinetic typography remain completely accessible to users with vestibular disorders, motor impairments, low vision, and assistive technology (screen readers and keyboard navigation).

## Difficulty
Intermediate

## Dependencies
- CSS Media Queries (Built-in)
- `framer-motion`: `^11.0.0` or `gsap`: `^3.12.0`

## When to Use
- **Mandatory on every single web application and landing page.**

## When NOT to Use
- Never. Accessibility is a fundamental baseline engineering requirement.

## Implementation Strategy
1. **The Three-Tier Motion Guard**:
   - **CSS**: `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; } }`
   - **React / Motion**: Wrap app root with `<MotionConfig reducedMotion="user">`.
   - **GSAP / Three.js**: Query `window.matchMedia('(prefers-reduced-motion: reduce)')`. When true, stop continuous camera rotation and scrubbed parallax offsets.
2. **Accessible WebGL Companion DOM**:
   - WebGL `<canvas>` elements cannot be read by screen readers.
   - Attach `aria-hidden="true"` to the canvas and place an un-hidden semantic HTML companion structure adjacent to the canvas with headings, descriptions, and feature lists.
3. **Keyboard Focus Rings**:
   - Never suppress focus rings with `outline: none` without providing an alternative `:focus-visible` ring.

## Example Code Pattern
```tsx
'use client';

import { useEffect, useState } from 'react';

export function useReducedMotionGuard() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(query.matches);

    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    query.addEventListener('change', listener);
    return () => query.removeEventListener('change', listener);
  }, []);

  return reducedMotion;
}
```

## Performance Cost
- Respecting reduced motion improves performance for users who need it by eliminating CPU and GPU animation workloads.

## Mobile Behavior
- Both iOS ("Reduce Motion") and Android ("Remove animations") map directly to this setting.

## Accessibility Concerns
- Completely eliminates motion sickness, vertigo, and cognitive overload.
- Ensures WCAG 2.2 Level AA compliance for contrast, keyboard focus, and vestibular safety.

## Source Repository
- [`giuucmp/aether-boilerplate`](file:///c:/Users/USER/frontend%20work/frontend-intelligence/sources/aether-boilerplate.md)
- [`MuhammedAlii/high-end`](file:///c:/Users/USER/frontend%20work/frontend-intelligence/sources/high-end.md)
