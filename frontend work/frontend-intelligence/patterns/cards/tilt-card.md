# Pattern: 3D Tilt Card

## Problem Statement
Static 2D cards feel flat and lifeless on high-end portfolios and landing pages. Adding 3D perspective tilt gives cards physical depth and tactile gravity, but naive implementations store mouse coordinates in React state, causing continuous component re-renders and CPU stutter.

---

## Architectural Solution
1. Track mouse coordinates inside `onMouseMove`.
2. Normalize coordinates relative to card bounds (`nx = (x / width) * 2 - 1`, `ny = (y / height) * 2 - 1`).
3. Set CSS `transform: perspective(1000px) rotateX(${-ny * maxTilt}deg) rotateY(${nx * maxTilt}deg) scale3d(1.02, 1.02, 1.02)` directly on the DOM element style.
4. On mouse leave, smoothly transition back to origin using a CSS transition ease-out.

---

## Production Implementation

```tsx
// components/cards/TiltCard.tsx
'use client';

import { useRef, useState } from 'react';

interface TiltCardProps {
  children: React.ReactNode;
  maxTilt?: number;
  className?: string;
}

export function TiltCard({ children, maxTilt = 8, className = '' }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normX = (x / rect.width) * 2 - 1;
    const normY = (y / rect.height) * 2 - 1;

    const rotX = -normY * maxTilt;
    const rotY = normX * maxTilt;

    card.style.transform = `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;
  };

  const handleMouseEnter = () => setIsHovered(true);

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (cardRef.current) {
      cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    }
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transition: isHovered ? 'none' : 'transform 0.5s ease-out',
      }}
      className={`relative rounded-3xl border border-neutral-800 bg-neutral-900/60 p-8 backdrop-blur-md will-change-transform ${className}`}
    >
      {children}
    </div>
  );
}
```

---

## Key Benefits
- **Zero React Re-renders**: Direct style property mutations ensure 60 FPS performance.
- **Realistic Depth**: `perspective(1000px)` mimics authentic optical perspective.
- **Touch Safe**: Automatically bypassed on mobile devices.
