# Technique: Tactile Micro-Interactions & Gestures

## Technique Name
Tactile Micro-Interactions & Gestures

## Purpose
Provides responsive, physical feedback to user inputs (pointer moves, clicks, hovers, taps) via magnetic attraction, 3D perspective card tilting, spotlight radial gradients, and contextual cursor morphing.

## Difficulty
Intermediate

## Dependencies
- Pure CSS Variables & React, or `framer-motion`: `^11.0.0` / `gsap`: `^3.12.0`

## When to Use
- Primary CTA buttons, interactive cards, bento grid tiles, and navigation items.
- Portfolio image preview hovers and interactive galleries.
- Modern SaaS feature grids seeking tactile depth.

## When NOT to Use
- Heavy administrative data tables, dense spreadsheets, or high-volume data-entry forms.
- Touchscreens where hover states cause sticky displaced elements.

## Implementation Strategy
1. **Direct CSS Variables for Spotlights**: Update `--mouse-x` and `--mouse-y` directly on DOM element styles during `onMouseMove`. Never store mouse pixel coordinates in React state.
2. **Magnetic Snapping**: Calculate distance from element center `(e.clientX - centerX) * strength`. Tween back to origin on mouse leave with an elastic ease (`elastic.out(1, 0.35)`).
3. **Pointer Media Query Gate**: Query `window.matchMedia('(pointer: fine)').matches`. If coarse (touchscreen), bypass all magnetic and custom cursor calculations.

## Example Code Pattern
```tsx
'use client';

import { useRef } from 'react';
import gsap from 'gsap';

export function MagneticPill({ children }: { children: React.ReactNode }) {
  const btnRef = useRef<HTMLButtonElement>(null);

  const onMouseMove = (e: React.MouseEvent) => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const btn = btnRef.current;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = (e.clientX - cx) * 0.35;
    const dy = (e.clientY - cy) * 0.35;

    gsap.to(btn, { x: dx, y: dy, duration: 0.25, ease: 'power2.out' });
  };

  const onMouseLeave = () => {
    gsap.to(btnRef.current, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.35)' });
  };

  return (
    <button
      ref={btnRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="rounded-full bg-indigo-600 px-6 py-3 font-medium text-white shadow-lg transition-colors hover:bg-indigo-500 will-change-transform"
    >
      {children}
    </button>
  );
}
```

## Performance Cost
- Updating CSS variables and using GPU transforms (`transform: translate3d(...)`) has zero layout reflow cost.
- Storing mouse coordinates in React state causes 60-120 re-renders per second, crippling CPU performance.

## Mobile Behavior
- Media query check guarantees 100% bypass on mobile phones, keeping tap targets responsive and static.

## Accessibility Concerns
- Buttons must retain high contrast and clear `:focus-visible` keyboard outlines.

## Source Repository
- [`itsjwill/motion-primitives-website`](file:///c:/Users/USER/frontend%20work/frontend-intelligence/sources/motion-primitives.md)
- [`MuhammedAlii/high-end`](file:///c:/Users/USER/frontend%20work/frontend-intelligence/sources/high-end.md)
