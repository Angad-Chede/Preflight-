# Pattern: Safe GSAP ScrollTrigger Lifecycle & Cleanup Wrapper

## Problem Statement
In React 18 and 19, StrictMode mounts, unmounts, and re-mounts components in development mode to catch side effects. In Next.js App Router, soft route navigation unmounts components dynamically. If GSAP ScrollTrigger instances are initialized inside raw `useEffect` without scoped teardowns, they create:
1. **Ghost Triggers**: ScrollTriggers listening to old unmounted DOM coordinates.
2. **Double Spacers**: Pinned triggers that inject duplicate `pin-spacer` divs into the DOM.
3. **Severe Memory Leaks**: Thousands of event listeners accumulating across route switches.

---

## Architectural Solution
Implement a **Scoped ScrollTrigger Lifecycle Pattern**:
- Utilize GSAP's official `@gsap/react` `useGSAP()` hook or an encapsulated `useScrollAnimation()` wrapper.
- All selectors and tweens are automatically scoped to a container `ref`.
- When the component unmounts, `ctx.revert()` is called, which completely resets transformed CSS styles to their original inline state, removes all pin spacers, and unregisters ScrollTrigger listeners.

---

## Production Implementation

```tsx
// hooks/useScrollAnimation.ts
'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

type AnimationCallback = (context: gsap.Context) => void;

interface UseScrollAnimationOptions {
  dependencies?: React.DependencyList;
  revertOnUpdate?: boolean;
}

export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>(
  animationCallback: AnimationCallback,
  options: UseScrollAnimationOptions = {}
) {
  const containerRef = useRef<T>(null);

  useGSAP(
    (context) => {
      // Execute the animation definitions inside the scoped context
      animationCallback(context);

      // Refresh ScrollTrigger calculations after initial execution
      ScrollTrigger.refresh();
    },
    {
      scope: containerRef,
      dependencies: options.dependencies || [],
      revertOnUpdate: options.revertOnUpdate ?? true,
    }
  );

  return containerRef;
}
```

---

## Usage in Components

```tsx
'use client';

import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import gsap from 'gsap';

export function CleanScrollSection() {
  const containerRef = useScrollAnimation<HTMLDivElement>(() => {
    // All selectors like '.card' are strictly scoped to this container!
    gsap.from('.card', {
      y: 80,
      opacity: 0,
      stagger: 0.2,
      duration: 1,
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
    });
  });

  return (
    <div ref={containerRef} className="py-24 px-8">
      <div className="grid grid-cols-3 gap-6">
        <div className="card h-40 bg-neutral-900 border border-neutral-800 rounded-2xl" />
        <div className="card h-40 bg-neutral-900 border border-neutral-800 rounded-2xl" />
        <div className="card h-40 bg-neutral-900 border border-neutral-800 rounded-2xl" />
      </div>
    </div>
  );
}
```

---

## Key Benefits
- **Strict Mode Safe**: Mounts and unmounts clean without orphaned pin spacers or phantom trigger points.
- **Next.js Route Transition Safe**: Guaranteed cleanup during App Router page swaps.
- **Scoped Selectors**: Avoids global class name collisions (`.card` only targets cards inside this component).
