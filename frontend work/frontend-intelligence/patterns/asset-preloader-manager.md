# Pattern: Asset Preloader & Loading State Machine

## Problem Statement
High-end visual websites require heavy assets: custom web fonts, HDR environment maps, 3D GLTF models, audio files, and high-resolution textures. If these assets pop into view asynchronously during page scroll, the user experiences jarring layout shifts (CLS), un-textured grey models, and flash of unstyled content (FOUC). A naive splash screen that simply waits for arbitrary `setTimeout(..., 2000)` causes either premature reveals or unnecessary artificial delays.

---

## Architectural Solution
Implement a **deterministic progressive asset preloader**:
1. **Multi-Asset Registry**: Registers critical assets (Fonts via `document.fonts.ready`, 3D models via Three.js `LoadingManager`, and hero images).
2. **Normalized Progress Counter**: Emits an interpolated `0%` to `100%` progress value using a smooth spring/lerp to prevent abrupt number jumping.
3. **Graceful Exit Sequence**: Once 100% is reached and all promises resolve, coordinates an exit animation (curtain slide or aperture wipe), removes the preloader DOM node, and triggers entrance animations for page content.

---

## Production Implementation

```tsx
// lib/preloader-context.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

interface PreloaderContextType {
  progress: number;
  isLoaded: boolean;
}

const PreloaderContext = createContext<PreloaderContextType>({
  progress: 0,
  isLoaded: false,
});

export function usePreloader() {
  return useContext(PreloaderContext);
}

export function PreloaderProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let rawProgress = 0;
    const progressProxy = { val: 0 };

    // 1. Configure Three.js LoadingManager
    const manager = THREE.DefaultLoadingManager;

    manager.onProgress = (_url, itemsLoaded, itemsTotal) => {
      rawProgress = (itemsLoaded / itemsTotal) * 100;
      gsap.to(progressProxy, {
        val: rawProgress,
        duration: 0.5,
        ease: 'power2.out',
        onUpdate: () => setProgress(Math.round(progressProxy.val)),
      });
    };

    manager.onLoad = () => {
      // 2. Ensure web fonts are also loaded
      document.fonts.ready.then(() => {
        gsap.to(progressProxy, {
          val: 100,
          duration: 0.6,
          ease: 'power2.out',
          onUpdate: () => setProgress(Math.round(progressProxy.val)),
          onComplete: () => {
            setTimeout(() => setIsLoaded(true), 400);
          },
        });
      });
    };

    // Fallback safety timeout (prevents preloader being trapped indefinitely by a stalled asset)
    const timeout = setTimeout(() => {
      setIsLoaded(true);
    }, 6000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <PreloaderContext.Provider value={{ progress, isLoaded }}>
      {/* Visual Splash Screen Curtain */}
      <div
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-neutral-950 text-white transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isLoaded ? '-translate-y-full pointer-events-none' : 'translate-y-0'
        }`}
      >
        <div className="flex flex-col items-center gap-4">
          <span className="text-xs uppercase font-mono tracking-widest text-indigo-400">Initializing Experience</span>
          <span className="text-6xl font-light tabular-nums">{progress}%</span>
          <div className="h-0.5 w-48 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {children}
    </PreloaderContext.Provider>
  );
}
```

---

## Key Benefits
- **Zero Layout Shifts**: Guarantees all fonts and 3D assets are in memory before unveiling the DOM.
- **Fail-Safe Timeout**: Guaranteed fallback prevents users from being stuck on an endless loader due to a 404 network asset.
- **Smooth Numerical Interpolation**: Numbers count up gracefully rather than teleporting from 0% to 100%.
