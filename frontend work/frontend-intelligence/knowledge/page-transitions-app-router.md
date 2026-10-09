# Page Transitions in Next.js App Router

## 1. What the Technique Is
Page transitions in Next.js App Router coordinate exit animations for outgoing routes and entrance animations for incoming routes. Because Next.js App Router unmounts the previous page immediately upon route change by default, achieving seamless Awwwards-style transitions requires **frozen route wrappers** or **curtain wipe overlays** synchronized with Next.js navigation events.

---

## 2. When to Use It
- Award-winning creative agency sites, high-end design portfolios, brand campaigns.
- Websites featuring continuous music/audio or persistent 3D WebGL backgrounds that must not unmount across route navigation.
- Experiences demanding seamless visual continuity between pages.

---

## 3. When NOT to Use It
- Standard enterprise web apps, e-commerce checkout funnels, documentation sites.
- Where fast navigation latency (<100ms) is the primary user priority.
- Highly dynamic apps where preserving stale page state leads to data inconsistencies.

---

## 4. Implementation Pattern
In Next.js App Router:
- **`layout.tsx`**: Persists across route changes; state is preserved, and it does **not** re-render on navigation.
- **`template.tsx`**: Re-mounts on every route change, creating a fresh instance ideal for entrance animations.
- **The Curtain Overlay Pattern (Recommended for App Router)**:
  1. User clicks an internal navigation link.
  2. Prevent immediate navigation; play an exit transition (e.g. SVG curtain wipe / fullscreen clip-path).
  3. On animation completion, trigger `router.push(href)`.
  4. Next.js loads the incoming route behind the curtain.
  5. The curtain plays its reveal animation, exposing the newly rendered page.

---

## 5. React / Next.js Example

```tsx
'use client';

import { createContext, useContext, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';

interface TransitionContextType {
  navigateTo: (href: string) => void;
}

const TransitionContext = createContext<TransitionContextType>({
  navigateTo: () => {},
});

export function usePageTransition() {
  return useContext(TransitionContext);
}

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const curtainRef = useRef<HTMLDivElement>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const navigateTo = (href: string) => {
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
        // Step 2: Route Change
        router.push(href);

        // Step 3: Reveal Incoming Page after navigation
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
        }, 200);
      },
    })
    .set(curtain, { yPercent: 100 })
    .to(curtain, {
      yPercent: 0,
      duration: 0.6,
      ease: 'power3.inOut',
    });
  };

  return (
    <TransitionContext.Provider value={{ navigateTo }}>
      {children}

      {/* Fullscreen Transition Curtain */}
      <div
        ref={curtainRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-neutral-950 translate-y-full will-change-transform"
      >
        <span className="text-sm font-mono uppercase tracking-widest text-indigo-400">
          Loading Experience...
        </span>
      </div>
    </TransitionContext.Provider>
  );
}

// Custom Transition Link Component
export function TransitionLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { navigateTo } = usePageTransition();

  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        navigateTo(href);
      }}
      className={className}
    >
      {children}
    </a>
  );
}
```

### Template-based Entrance Animation (`template.tsx`):
```tsx
// app/template.tsx
'use client';

import { motion } from 'framer-motion';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.6 }}
    >
      {children}
    </motion.div>
  );
}
```

---

## 6. Dependencies
- `next`: `^14.0.0` or `^15.0.0`
- `gsap`: `^3.12.0`
- `framer-motion`: `^11.0.0`

---

## 7. Performance Considerations
- **Do not artificially delay routes too long**: Keep total exit duration under 500-600ms. Excessively long transitions frustrate users.
- **Scroll restoration**: Call `window.scrollTo(0, 0)` or trigger `lenis.scrollTo(0, { immediate: true })` before revealing the incoming route so users don't start midway down the new page.

---

## 8. Mobile Considerations
- On mobile devices, native browser swipe-back gestures bypass custom JS click handlers. Always handle fallback state gracefully so pages are never stuck beneath the curtain.

---

## 9. Accessibility Considerations
- Always include standard `href` attributes on links so middle-click, open in new tab, and search engine crawlers function correctly.
- Provide `aria-live="polite"` announcements when page navigation completes.
- Skip transitions if `prefers-reduced-motion: reduce` is enabled.

---

## 10. Common Mistakes
1. **Using standard `<Link>` and expecting exit animations**: Native Next.js `<Link>` immediately swaps DOM nodes. An exit animation requires programmatic routing via `router.push()` or custom route interceptors.
2. **Forgetting scroll reset**: Navigating to a new page while maintaining the previous page's scroll position leaves the user at the bottom of the new page.
3. **Z-index traps**: Curtain overlays with lower z-index than sticky headers or modals, causing elements to poke through during transitions.

---

## 11. Related Patterns
- `clip-path-and-mask-transitions.md`
- `page-transition-system.md`
- `aether-boilerplate.md`

---

## 12. Source References
- [AETHER Boilerplate Teardown](../sources/aether-boilerplate.md)
- Next.js Documentation on Routing & Templates: https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts
