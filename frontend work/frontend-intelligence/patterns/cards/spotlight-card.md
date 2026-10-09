# Pattern: Spotlight Card (Linear / Apple Style)

## Problem Statement
Creating interactive cards whose borders and background surfaces reveal a subtle, cursor-following flashlight or glow (popularized by Linear.app and Apple) without rendering heavy Canvas or WebGL textures.

---

## Architectural Solution
1. Track mouse coordinates inside `onMouseMove`.
2. Write relative pixel coordinates to CSS custom properties:
   `card.style.setProperty('--mouse-x', `${x}px`);`
   `card.style.setProperty('--mouse-y', `${y}px`);`
3. Use a pseudo-element or absolute child div with a radial gradient:
   `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(99, 102, 241, 0.15), transparent 40%)`.
4. Apply CSS `mask-composite: exclude` for border-only spotlight effects.

---

## Production Implementation

```tsx
// components/cards/SpotlightCard.tsx
'use client';

import { useRef } from 'react';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
}

export function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(99, 102, 241, 0.15)',
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`group relative overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900/60 p-8 backdrop-blur-md transition-colors hover:border-neutral-700 ${className}`}
    >
      {/* Background Radial Glow */}
      <div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), ${spotlightColor}, transparent 40%)`,
        }}
      />

      {/* Border Spotlight Glow */}
      <div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(350px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(129, 140, 248, 0.4), transparent 40%)`,
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
          padding: '1px',
        }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
}
```

---

## Key Benefits
- **Zero Dependencies**: Pure CSS custom properties and React.
- **High Performance**: Renders natively on the GPU compositor.
- **Modular**: Can be dropped around any arbitrary child component.
