# Recipe: Complete Smooth Scroll Website Architecture

## 1. Concept & Architectural Blueprint
This recipe provides the end-to-end foundation for building an Awwwards-caliber smooth-scrolling website in Next.js App Router:
- **Lenis Smooth Scroll Engine**: Normalizes inertial scrolling physics across Windows, macOS, trackpads, and wheels.
- **GSAP ScrollTrigger Master Ticker**: Direct link between Lenis and ScrollTrigger with zero duplicate RAF loops.
- **Scroll Direction Aware Floating Navbar**: Automatically hides when scrolling down to maximize viewport immersion; smoothly slides back into view when scrolling up.
- **Top Scroll Progress Indicator**: Hardware-accelerated progress bar tracking reading completion.

---

## 2. Complete Next.js / React Implementation

### Step 1: Smooth Scroll Layout Provider
```tsx
// components/providers/SmoothScrollProvider.tsx
'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Respect user motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 1.5,
    });
    lenisRef.current = lenis;

    // Connect Lenis to ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    // Bind GSAP master ticker
    const updateTicker = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(updateTicker);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return <>{children}</>;
}
```

### Step 2: Scroll Direction Aware Navbar & Progress Bar
```tsx
// components/navigation/SmoothNavbar.tsx
'use client';

import { useState, useEffect } from 'react';

export function SmoothNavbar() {
  const [isVisible, setIsVisible] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      
      // Calculate progress percentage
      if (maxScroll > 0) {
        setScrollProgress((currentScrollY / maxScroll) * 100);
      }

      // Hide when scrolling down past 100px, reveal when scrolling up
      if (currentScrollY > 100 && currentScrollY > lastScrollY) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Top Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-neutral-900">
        <div
          className="h-full bg-indigo-500 transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Floating Auto-Hiding Navbar */}
      <header
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-5xl rounded-full border border-neutral-800 bg-neutral-950/70 px-6 py-3 backdrop-blur-md transition-all duration-300 ${
          isVisible ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm font-bold tracking-wider text-white">
            ARCHETYPE
          </span>

          <nav className="hidden md:flex items-center gap-8 text-sm text-neutral-400">
            <a href="#about" className="hover:text-white transition-colors">Philosophy</a>
            <a href="#works" className="hover:text-white transition-colors">Selected Works</a>
            <a href="#services" className="hover:text-white transition-colors">Capabilities</a>
          </nav>

          <button className="rounded-full bg-white px-5 py-2 text-xs font-semibold text-neutral-950 transition-transform hover:scale-105 active:scale-95">
            Connect
          </button>
        </div>
      </header>
    </>
  );
}
```

### Step 3: Example Page Structure
```tsx
// app/page.tsx
import { SmoothScrollProvider } from '@/components/providers/SmoothScrollProvider';
import { SmoothNavbar } from '@/components/navigation/SmoothNavbar';

export default function SmoothScrollPage() {
  return (
    <SmoothScrollProvider>
      <SmoothNavbar />

      <main className="bg-neutral-950 text-white min-h-screen">
        {/* Section 1 */}
        <section className="h-screen flex items-center justify-center p-8">
          <h1 className="text-6xl md:text-8xl font-light text-center">
            UNIFIED INERTIA
          </h1>
        </section>

        {/* Section 2 */}
        <section id="about" className="h-screen flex items-center justify-center bg-neutral-900/40 p-8">
          <div className="max-w-2xl text-center">
            <h2 className="text-4xl font-light">Sub-pixel Scroll Dynamics</h2>
            <p className="mt-4 text-neutral-400">
              Synchronized Lenis virtual momentum eliminating all scroll tearing and frame stutter.
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section id="works" className="h-screen flex items-center justify-center p-8">
          <h2 className="text-4xl font-light">Precision Storytelling</h2>
        </section>
      </main>
    </SmoothScrollProvider>
  );
}
```

---

## 3. Performance & Mobile Safeguards
- **Passive Scroll Listeners**: Use `{ passive: true }` on window scroll listeners so browser main thread scrolling is never blocked.
- **Lag Smoothing Zero**: `gsap.ticker.lagSmoothing(0)` guarantees GSAP will never desync from Lenis during heavy DOM paint operations.
