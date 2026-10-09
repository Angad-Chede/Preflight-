# Technique: Route Transitions & Curtain Orchestration

## Technique Name
Route Transitions & Curtain Orchestration

## Purpose
Coordinates smooth, cinematic route switches in Next.js App Router without white flashes or abrupt DOM swaps by orchestrating exit animations, frozen states, and curtain reveals.

## Difficulty
Intermediate to Advanced

## Dependencies
- `next`: `^14.0.0` or `^15.0.0` or `^16.0.0`
- `gsap`: `^3.12.0`
- `framer-motion`: `^11.0.0` or `^12.0.0`

## When to Use
- Award-style creative agency sites, design portfolios, and immersive brand campaigns.
- Websites featuring continuous audio playback or global WebGL canvases that must not flicker during page changes.

## When NOT to Use
- Standard enterprise SaaS dashboards, e-commerce checkout flows, or documentation sites where sub-100ms instant page changes are expected.
- When `prefers-reduced-motion` is active.

## Implementation Strategy
1. **The Intercepted Link Pattern**:
   - Intercept link clicks via a custom `TransitionLink` component.
   - Play an exit curtain animation (e.g. curved SVG path or polygon wipe).
   - Once the viewport is 100% covered, trigger `router.push(href)`.
   - Reset scroll position (`window.scrollTo(0, 0)`).
   - Play the entrance reveal animation, sliding the curtain away to expose the new page.
2. **`template.tsx` vs `layout.tsx`**:
   - Use `layout.tsx` for persistent chrome (audio players, canvas wrappers).
   - Use `template.tsx` for per-route entrance animations that remount on navigation.

## Example Code Pattern
```tsx
'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';

export function useCurtainRouter() {
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const curtainRef = useRef<HTMLDivElement>(null);

  const navigate = (href: string) => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    const curtain = curtainRef.current;
    if (!curtain) {
      router.push(href);
      return;
    }

    // Step 1: Slide Curtain Up to Cover Viewport
    gsap.timeline({
      onComplete: () => {
        // Step 2: Route Change behind full cover
        router.push(href);
        window.scrollTo(0, 0);

        // Step 3: Reveal Incoming Route
        setTimeout(() => {
          gsap.to(curtain, {
            yPercent: -100,
            duration: 0.7,
            ease: 'power3.inOut',
            onComplete: () => {
              gsap.set(curtain, { yPercent: 100 });
              setIsTransitioning(false);
            },
          });
        }, 150);
      },
    })
    .set(curtain, { yPercent: 100 })
    .to(curtain, { yPercent: 0, duration: 0.6, ease: 'power3.inOut' });
  };

  return { navigate, curtainRef, isTransitioning };
}
```

## Performance Cost
- Kept lightweight by keeping transitions under 600ms.
- Set `display: none` or pointer-events: none when the curtain is at rest to eliminate GPU compositor overhead.

## Mobile Behavior
- Native mobile swipe-back gestures bypass custom JS handlers; ensure page state recovers gracefully if interrupted.

## Accessibility Concerns
- Always retain standard `href` attributes on `<a>` tags so search crawlers and middle-click new tab functionality remain intact.
- Skip transition animation when `prefers-reduced-motion` is enabled.

## Source Repository
- [`giuucmp/aether-boilerplate`](file:///c:/Users/USER/frontend%20work/frontend-intelligence/sources/aether-boilerplate.md)
- [`MuhammedAlii/high-end`](file:///c:/Users/USER/frontend%20work/frontend-intelligence/sources/high-end.md)
