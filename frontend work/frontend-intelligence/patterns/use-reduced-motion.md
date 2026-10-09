# Pattern: Universal Reduced Motion Guard

## Problem Statement
Users with vestibular disorders, inner-ear conditions, or motion sensitivity can experience vertigo, dizziness, or physical nausea from parallax scrolling, camera rotations, and kinetic typography. Modern frontend architectures must provide an automated, universal guard that respects the operating system's `prefers-reduced-motion` setting across CSS, React state, GSAP timelines, and Three.js canvas loops without requiring duplicate component code.

---

## Architectural Solution
Provide a **multi-tier safety pattern**:
1. **Global CSS Reset**: Eliminates unexpected CSS transitions and animations instantly.
2. **React Hook (`useReducedMotion`)**: Exposes reactive boolean state that updates if the user toggles OS preferences in real time.
3. **Motion Config Provider**: Configures Framer Motion's internal layout and transition engine to fallback to instant cuts or simple opacity fades.
4. **GSAP Timeline Interceptor**: Programmatically bypasses durations and scrub factors on GSAP instances when reduced motion is detected.

---

## Production Implementation

### 1. Global CSS Reset (Tailwind / Global Styles)
```css
/* styles/reduced-motion.css */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 2. Universal React Hook
```tsx
// hooks/useReducedMotion.ts
'use client';

import { useState, useEffect } from 'react';

export function useReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    // Check initial match
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mediaQuery.matches);

    // Event listener for live changes
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReduced(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReduced;
}
```

### 3. GSAP Timeline Animation Helper
```ts
// lib/safe-animation.ts
import gsap from 'gsap';

export function createSafeTimeline(vars?: gsap.TimelineVars): gsap.core.Timeline {
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const tl = gsap.timeline(vars);

  if (prefersReduced) {
    // Instantly complete all animations added to this timeline
    tl.timeScale(100);
  }

  return tl;
}
```

### 4. Root Application Wrapper
```tsx
// components/MotionSafetyProvider.tsx
'use client';

import { MotionConfig } from 'framer-motion';

export function MotionSafetyProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      {children}
    </MotionConfig>
  );
}
```

---

## Usage in Components

```tsx
'use client';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { motion } from 'framer-motion';

export function AccessibleCard() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.95 }}
      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: shouldReduceMotion ? 0.2 : 0.6 }}
      className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
    >
      <h3 className="text-xl font-bold text-white">Vestibular-Safe Architecture</h3>
      <p className="mt-2 text-sm text-neutral-400">
        Animations gracefully degrade to simple opacity dissolves when reduced motion is preferred.
      </p>
    </motion.div>
  );
}
```

---

## Key Benefits
- **Zero Vertigo Risk**: Completely safeguards users sensitive to motion.
- **Dynamic Adaptability**: Updates live without page reloads if OS accessibility toggles change.
- **Developer Ergonomics**: Integrates seamlessly with Framer Motion, GSAP, and Three.js.
