# Recipe: Premium Glassmorphic Navbar

## 1. Concept & Architectural Blueprint
A luxury floating navigation header featuring:
- **Glassmorphic Surface**: Frosted acrylic backdrop blur (`backdrop-blur-xl bg-neutral-950/60 border border-neutral-800/80`).
- **Scroll Direction Awareness**: Auto-hides on downward scroll past 120px to maximize reading space; smoothly glides back on upward scroll.
- **Magnetic Tab Indicator (`layoutId`)**: Animated active pill that slides between links using Framer Motion spring physics.
- **IntersectionObserver Active Spy**: Automatically highlights the section currently in view.

---

## 2. Complete Next.js / React Implementation

```tsx
// components/navigation/PremiumNavbar.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { id: 'hero', label: 'Overview' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'features', label: 'Capabilities' },
  { id: 'showcase', label: 'Showcase' },
];

export function PremiumNavbar() {
  const [activeSection, setActiveSection] = useState('hero');
  const [isVisible, setIsVisible] = useState(true);

  // 1. Scroll Direction Handler (Hide down, show up)
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const onScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 120 && currentScrollY > lastScrollY) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // 2. Active Section Spy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-40% 0px -40% 0px' }
    );

    NAV_ITEMS.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <header
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-24 opacity-0 pointer-events-none'
      }`}
    >
      <nav className="flex items-center gap-1 rounded-full border border-neutral-800/80 bg-neutral-950/75 p-1.5 shadow-2xl backdrop-blur-xl">
        {/* Brand Monogram */}
        <a
          href="#hero"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 border border-neutral-700 text-white font-mono text-xs font-bold mr-1"
        >
          AG
        </a>

        {/* Links with Sliding Active Pill */}
        <div className="flex items-center">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => setActiveSection(item.id)}
                className={`relative px-4 py-2 text-xs font-medium transition-colors ${
                  isActive ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-indicator"
                    className="absolute inset-0 rounded-full bg-neutral-800/90 shadow-sm border border-neutral-700/50"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </a>
            );
          })}
        </div>

        {/* CTA Button */}
        <a
          href="#contact"
          className="ml-2 rounded-full bg-indigo-600 px-4 py-2 font-mono text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition-transform hover:scale-105 active:scale-95"
        >
          Engage
        </a>
      </nav>
    </header>
  );
}
```

---

## 3. Performance & Mobile Safeguards
- **IntersectionObserver Root Margin**: Setting `rootMargin: '-40% 0px -40% 0px'` ensures the active spy triggers when the section enters the focal middle 20% of the screen.
- **Hardware Compositing**: Fixed navigation bar with backdrop blur is promoted to GPU layer via `translate-x-1/2`.
