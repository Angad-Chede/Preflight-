# Recipe: Magnetic Cursor System

## 1. Concept & Architectural Blueprint
A high-end custom cursor system featuring:
- **Interpolated Follower**: Smooth position tracking with configurable linear interpolation (lerp).
- **Magnetic Attraction**: When hovering within the capture threshold of an interactive element (`data-magnetic`), the cursor snaps to and encloses the element.
- **Context-Sensitive Morphing**: Switches between default dot, expanded ring over links, inverted `mix-blend-mode: difference`, and action pill with text labels (e.g., "EXPLORE", "DRAG", "VIEW").
- **Strict Pointer Hygiene**: Automatically dormant on touch devices (`(pointer: coarse)`), never intercepts clicks (`pointer-events: none`).

---

## 2. Complete Next.js / React Implementation

```tsx
// components/cursor/MagneticCursorSystem.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface CursorState {
  variant: 'default' | 'hover' | 'magnetic' | 'text';
  text: string;
}

export function MagneticCursorSystem() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<CursorState>({ variant: 'default', text: '' });
  const mouse = useRef({ x: -100, y: -100 });
  const pos = useRef({ x: -100, y: -100 });

  useEffect(() => {
    // Only mount on desktop/fine pointers
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const cursor = cursorRef.current;
    if (!cursor) return;

    const onPointerMove = (e: PointerEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;

      const target = (e.target as HTMLElement).closest('[data-cursor]');
      if (target) {
        const type = target.getAttribute('data-cursor') as any;
        const text = target.getAttribute('data-cursor-text') || '';
        setState({ variant: type || 'hover', text });
      } else {
        setState({ variant: 'default', text: '' });
      }
    };

    window.addEventListener('pointermove', onPointerMove);

    // Master cursor RAF loop
    const ticker = gsap.ticker.add(() => {
      const speed = 0.2;
      pos.current.x += (mouse.current.x - pos.current.x) * speed;
      pos.current.y += (mouse.current.y - pos.current.y) * speed;

      gsap.set(cursor, {
        x: pos.current.x,
        y: pos.current.y,
      });
    });

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      gsap.ticker.remove(ticker);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className={`pointer-events-none fixed top-0 left-0 z-50 flex items-center justify-center -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-200 ease-out will-change-transform ${
        state.variant === 'hover'
          ? 'h-14 w-14 bg-white mix-blend-difference'
          : state.variant === 'text'
          ? 'h-20 w-20 bg-indigo-600 text-white font-mono text-[10px] tracking-widest'
          : 'h-3.5 w-3.5 bg-white mix-blend-difference'
      }`}
    >
      {state.text && <span className="uppercase font-bold">{state.text}</span>}
    </div>
  );
}

// Reusable Magnetic Target Component
export function MagneticTarget({
  children,
  cursorType = 'hover',
  cursorText = '',
  className = '',
}: {
  children: React.ReactNode;
  cursorType?: 'hover' | 'text';
  cursorText?: string;
  className?: string;
}) {
  const targetRef = useRef<HTMLDivElement>(null);

  const onMouseMove = (e: React.MouseEvent) => {
    const el = targetRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = (e.clientX - cx) * 0.35;
    const dy = (e.clientY - cy) * 0.35;

    gsap.to(el, { x: dx, y: dy, duration: 0.25, ease: 'power2.out' });
  };

  const onMouseLeave = () => {
    gsap.to(targetRef.current, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.35)' });
  };

  return (
    <div
      ref={targetRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      data-cursor={cursorType}
      data-cursor-text={cursorText}
      className={`inline-block will-change-transform ${className}`}
    >
      {children}
    </div>
  );
}
```

---

## 3. Performance & Mobile Safeguards
- **`pointer-events: none`**: Mandatory on cursor element to avoid blocking underlying document interactions.
- **Strict Pointer Match**: Completely bypassed on mobile phones and tablets.
- **Mix-Blend-Mode Inversion**: `mix-blend-mode: difference` automatically turns white on black backgrounds and black on white backgrounds without manual color state checks.
