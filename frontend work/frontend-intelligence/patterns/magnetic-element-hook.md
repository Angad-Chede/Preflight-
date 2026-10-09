# Pattern: Reusable Magnetic Element Hook (`useMagnetic`)

## Problem Statement
Creating magnetic buttons, badges, and icons manually requires repeating bounding box math, pointer distance calculations, GSAP elastic tweens, and touch device detection across dozens of UI components. A haphazard implementation risks displaced buttons sticking in offset positions on mobile screens or breaking keyboard focus.

---

## Architectural Solution
Encapsulate all magnetic physics into a clean, reusable React hook: `useMagnetic`.
- Checks for fine pointer precision (`window.matchMedia('(pointer: fine)').matches`). If touch device, completely bypasses calculations.
- Normalizes distance from element center with configurable magnetic attraction strength (`strength: 0.1 - 0.5`).
- On mouse leave, fires an elastic spring ease (`elastic.out(1, 0.4)`) returning the element precisely to `(0, 0)`.
- Returns an element ref and mouse event handlers that can be spread onto any DOM button or anchor.

---

## Production Implementation

```tsx
// hooks/useMagnetic.ts
'use client';

import { useRef, useCallback, useEffect } from 'react';
import gsap from 'gsap';

interface UseMagneticOptions {
  strength?: number;      // Magnetic pull factor (0.1 to 0.6)
  springDuration?: number; // Return spring duration in seconds
  ease?: string;          // GSAP return easing
}

export function useMagnetic<T extends HTMLElement = HTMLButtonElement>({
  strength = 0.35,
  springDuration = 0.8,
  ease = 'elastic.out(1, 0.35)',
}: UseMagneticOptions = {}) {
  const ref = useRef<T>(null);
  const isFinePointer = useRef(true);

  useEffect(() => {
    isFinePointer.current = window.matchMedia('(pointer: fine)').matches;
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<T>) => {
      if (!isFinePointer.current || !ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - centerX) * strength;
      const deltaY = (e.clientY - centerY) * strength;

      gsap.to(ref.current, {
        x: deltaX,
        y: deltaY,
        duration: 0.25,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    },
    [strength]
  );

  const handleMouseLeave = useCallback(() => {
    if (!isFinePointer.current || !ref.current) return;

    gsap.to(ref.current, {
      x: 0,
      y: 0,
      duration: springDuration,
      ease,
      overwrite: 'auto',
    });
  }, [springDuration, ease]);

  return {
    ref,
    magneticProps: {
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave,
    },
  };
}
```

---

## Usage in Components

```tsx
'use client';

import { useMagnetic } from '@/hooks/useMagnetic';

export function MagneticCTA() {
  const { ref, magneticProps } = useMagnetic<HTMLButtonElement>({
    strength: 0.4,
    springDuration: 0.9,
  });

  return (
    <button
      ref={ref}
      {...magneticProps}
      className="relative rounded-full bg-indigo-600 px-8 py-4 font-semibold text-white shadow-xl shadow-indigo-600/25 transition-colors hover:bg-indigo-500 will-change-transform"
    >
      Launch System
    </button>
  );
}
```

---

## Key Benefits
- **Zero Boilerplate**: Drop onto any component with `{ ref, magneticProps }`.
- **Touch Safe**: Automatically inactive on iPhones, iPads, and Android screens.
- **Natural Tactility**: GSAP elastic physics provides authentic physical gravity.
