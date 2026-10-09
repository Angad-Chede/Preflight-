# Pattern: Unified RequestAnimationFrame (RAF) Manager

## Problem Statement
When high-end websites combine smooth scrolling (Lenis), timeline animation (GSAP), custom cursors, and 3D scenes (Three.js), having each library run its own independent `requestAnimationFrame` loop creates **micro-stutter, frame contention, and clock desynchronization**. If Lenis updates on frame tick $N$, but GSAP evaluates on tick $N+1$, pinned elements will visibly shudder or jump out of alignment.

---

## Architectural Solution
Establish a **single master ticker** (typically powered by GSAP's optimized ticker or a centralized singleton) that drives Lenis, Three.js, and custom physics in an explicit, deterministic sequence:
1. Scroll Position Evaluation (Lenis)
2. ScrollTrigger Synchronization (`ScrollTrigger.update()`)
3. Physics / Mouse Lerping
4. WebGL Render Execution (`renderer.render()`)

```
+--------------------------------------------------------+
| Master RAF Ticker (e.g. gsap.ticker)                   |
|                                                        |
|   1. Lenis.raf(time)           -> Virtual Scroll Delta |
|   2. ScrollTrigger.update()     -> Pinned Coordinates  |
|   3. Cursor / Spring Lerps      -> Spatial Positions   |
|   4. Three.js / R3F Render      -> GPU Frame Buffer    |
+--------------------------------------------------------+
```

---

## Production Implementation (TypeScript / Next.js)

```ts
// lib/raf-manager.ts
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type FrameCallback = (time: number, delta: number) => void;

class UnifiedRafManager {
  private static instance: UnifiedRafManager;
  private lenis: Lenis | null = null;
  private customCallbacks: Set<FrameCallback> = new Set();
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): UnifiedRafManager {
    if (!UnifiedRafManager.instance) {
      UnifiedRafManager.instance = new UnifiedRafManager();
    }
    return UnifiedRafManager.instance;
  }

  public init(lenisInstance?: Lenis) {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    if (lenisInstance) {
      this.lenis = lenisInstance;
      // Connect Lenis to ScrollTrigger
      this.lenis.on('scroll', ScrollTrigger.update);
    }

    // Disable GSAP lag smoothing to ensure frame-accurate sync
    gsap.ticker.lagSmoothing(0);

    // Master RAF loop binding
    gsap.ticker.add((time: number, deltaTime: number, frame: number) => {
      // 1. Advance smooth scroll
      if (this.lenis) {
        this.lenis.raf(time * 1000);
      }

      // 2. Execute custom registered physics or render callbacks
      this.customCallbacks.forEach((cb) => cb(time, deltaTime));
    });
  }

  public register(callback: FrameCallback): () => void {
    this.customCallbacks.add(callback);
    return () => {
      this.customCallbacks.delete(callback);
    };
  }

  public destroy() {
    this.customCallbacks.clear();
    if (this.lenis) {
      this.lenis.destroy();
      this.lenis = null;
    }
    this.isInitialized = false;
  }
}

export const rafManager = UnifiedRafManager.getInstance();
```

---

## React Integration Hook

```tsx
// hooks/useFrameSubscription.ts
'use client';

import { useEffect } from 'react';
import { rafManager } from '@/lib/raf-manager';

export function useFrameSubscription(callback: (time: number, delta: number) => void) {
  useEffect(() => {
    const unsubscribe = rafManager.register(callback);
    return () => unsubscribe();
  }, [callback]);
}
```

---

## Key Benefits
- **Zero Jitter**: Eliminates tearing between DOM scroll and 3D camera matrices.
- **CPU Preservation**: Only one RAF listener registered with the browser window.
- **Deterministic Order**: Guarantees scroll position updates before rendering begins.
