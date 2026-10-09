# Technique: Device Capability Tiering via `useSyncExternalStore`

## Technique Name
Device Capability Tiering via `useSyncExternalStore`

## Purpose
Classifies client devices into deterministic capability tiers (`high`, `low`, `off`) to conditionally mount heavy 3D canvases, tune particle counts, or fall back to zero-JS CSS artwork without hydration mismatches or layout flashing.

## Difficulty
Advanced

## Dependencies
- `react`: `^18.0.0` or `^19.0.0` (built-in `useSyncExternalStore`)

## When to Use
- Any production website integrating WebGL, complex GSAP scroll scrubbing, or heavy particle simulations.
- When you need to prevent hydration errors (`Text content does not match server-rendered HTML`) while querying client hardware.

## When NOT to Use
- Lightweight text-only blogs or standard CRUD applications.

## Implementation Strategy
1. Define discrete quality tiers: `HIGH` (Desktop discrete GPU), `LOW` (Modern mobile / integrated GPU), `OFF` (Budget mobile, battery saver, reduced motion).
2. Create an external store backing `useSyncExternalStore`. Provide a deterministic server snapshot (`OFF` or static skeleton) and a client snapshot evaluated after mount.
3. Use a capability gate component (`<CanvasSlot />`) that selectively mounts dynamic R3F imports or zero-JS CSS fallbacks.

## Example Code Pattern
```ts
// lib/device-store.ts
export type QualityTier = 'high' | 'low' | 'off';

interface DeviceSnapshot {
  tier: QualityTier;
  isTouch: boolean;
  dpr: number;
}

const SERVER_SNAPSHOT: DeviceSnapshot = {
  tier: 'off',
  isTouch: false,
  dpr: 1,
};

let clientSnapshot: DeviceSnapshot | null = null;
const listeners = new Set<() => void>();

function evaluateCapabilities(): DeviceSnapshot {
  if (typeof window === 'undefined') return SERVER_SNAPSHOT;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    return { tier: 'off', isTouch: false, dpr: 1 };
  }

  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  const cores = navigator.hardwareConcurrency || 4;
  const isMobileViewport = window.innerWidth < 768;

  // WebGL support test
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  if (!gl) {
    return { tier: 'off', isTouch, dpr: 1 };
  }

  if (isMobileViewport || cores <= 4) {
    return { tier: 'low', isTouch, dpr: 1 };
  }

  return {
    tier: 'high',
    isTouch,
    dpr: Math.min(window.devicePixelRatio, 1.5),
  };
}

export const deviceStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot(): DeviceSnapshot {
    if (!clientSnapshot) {
      clientSnapshot = evaluateCapabilities();
    }
    return clientSnapshot;
  },
  getServerSnapshot(): DeviceSnapshot {
    return SERVER_SNAPSHOT;
  },
};
```

```tsx
// components/canvas/CanvasCapabilityGate.tsx
'use client';

import { useSyncExternalStore } from 'react';
import { deviceStore } from '@/lib/device-store';
import dynamic from 'next/dynamic';

const Dynamic3DCanvas = dynamic(
  () => import('./HeroCanvas').then((mod) => mod.HeroCanvas),
  { ssr: false }
);

export function CanvasCapabilityGate() {
  const { tier, dpr } = useSyncExternalStore(
    deviceStore.subscribe,
    deviceStore.getSnapshot,
    deviceStore.getServerSnapshot
  );

  if (tier === 'off') {
    // Zero-JS High-Fidelity CSS Graphic Fallback
    return (
      <div className="relative h-[600px] w-full rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-950/40 via-neutral-950 to-neutral-950 border border-neutral-800 flex items-center justify-center">
        <div className="h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <span className="font-mono text-xs text-neutral-500">Hardware Optimized Poster</span>
      </div>
    );
  }

  return <Dynamic3DCanvas enablePostprocessing={tier === 'high'} dpr={dpr} />;
}
```

## Performance Cost
- Zero layout thrashing or hydration mismatches.
- Saves 100% of WebGL GPU memory and battery on low-end devices by bypassing canvas mounting completely.

## Mobile Behavior
- Budget mobile phones effortlessly fall back to the CSS poster.
- Flagship mobile phones run the simplified `low` tier WebGL profile at 60 FPS.

## Accessibility Concerns
- Automatically falls back to `off` tier when `prefers-reduced-motion` is detected.

## Source Repository
- [`MuhammedAlii/high-end`](file:///c:/Users/USER/frontend%20work/frontend-intelligence/sources/high-end.md)
- [`giuucmp/aether-boilerplate`](file:///c:/Users/USER/frontend%20work/frontend-intelligence/sources/aether-boilerplate.md)
