# Recipe: Complete Page Transition System (Next.js App Router)

## 1. Concept & Architectural Blueprint
In modern web experiences, clicking a page link does not trigger an abrupt white screen or instant DOM swap. Instead, it plays an orchestrated transition sequence:
- **Phase 1: Exit Curtain**: An organic curved SVG path or fullscreen clip-path curtain slides up, masking the outgoing page.
- **Phase 2: Route Synchronization**: Next.js executes `router.push(href)` while the screen is completely covered.
- **Phase 3: Entrance Reveal**: The curtain slides away toward the top, revealing the freshly mounted new route.
- **Scroll Position Reset**: Automatically resets scroll coordinates to `(0, 0)` behind the curtain before reveal.

---

## 2. Complete Next.js / React Implementation

```tsx
// components/transitions/PageTransitionSystem.tsx
'use client';

import { createContext, useContext, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import gsap from 'gsap';

interface TransitionContextValue {
  navigateWithTransition: (href: string) => void;
}

const TransitionContext = createContext<TransitionContextValue>({
  navigateWithTransition: () => {},
});

export function useTransitionRouter() {
  return useContext(TransitionContext);
}

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const overlayRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // SVG Curved Path Shapes
  const initialCurve = 'M 0 100 V 100 Q 50 100 100 100 V 100 z';
  const midCurve = 'M 0 100 V 50 Q 50 0 100 50 V 100 z';
  const flatTop = 'M 0 100 V 0 Q 50 0 100 0 V 100 z';

  const navigateWithTransition = (href: string) => {
    if (href === pathname || isAnimating) return;
    setIsAnimating(true);

    const overlay = overlayRef.current;
    const path = pathRef.current;
    if (!overlay || !path) {
      router.push(href);
      return;
    }

    // GSAP Timeline: Curved Wave Enter
    const tl = gsap.timeline({
      onComplete: () => {
        // Swap route behind full cover
        router.push(href);
        window.scrollTo(0, 0);

        // Brief delay for route mount, then reveal
        setTimeout(() => {
          gsap.to(overlay, {
            yPercent: -100,
            duration: 0.8,
            ease: 'power3.inOut',
            onComplete: () => {
              gsap.set(overlay, { yPercent: 0 });
              gsap.set(path, { attr: { d: initialCurve } });
              setIsAnimating(false);
            },
          });
        }, 150);
      },
    });

    tl.set(overlay, { display: 'block' })
      .to(path, {
        attr: { d: midCurve },
        duration: 0.4,
        ease: 'power2.in',
      })
      .to(path, {
        attr: { d: flatTop },
        duration: 0.4,
        ease: 'power2.out',
      });
  };

  return (
    <TransitionContext.Provider value={{ navigateWithTransition }}>
      {children}

      {/* Fullscreen Curved Curtain Overlay */}
      <div
        ref={overlayRef}
        className="pointer-events-none fixed inset-0 z-50 hidden h-screen w-screen overflow-hidden"
      >
        <svg
          className="h-full w-full fill-neutral-950"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path ref={pathRef} d={initialCurve} />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-xs uppercase tracking-widest text-indigo-400 animate-pulse">
            Loading Route...
          </span>
        </div>
      </div>
    </TransitionContext.Provider>
  );
}

// Custom Transition Link
export function TransitionLink({
  href,
  children,
  className = '',
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { navigateWithTransition } = useTransitionRouter();

  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        navigateWithTransition(href);
      }}
      className={className}
    >
      {children}
    </a>
  );
}
```

---

## 3. Performance & Mobile Safeguards
- **`preserveAspectRatio="none"`**: Guarantees the SVG path stretches to cover 100% of viewport width and height across any screen aspect ratio.
- **`display: none` at rest**: Ensures the SVG curtain consumes zero GPU composition memory when not transitioning.
- **Native link fallback**: Keeping native `href` on `<a>` preserves SEO crawlers, middle-click new tab, and right-click copying.
