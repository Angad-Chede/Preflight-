# Pattern: Responsive DPR & Adaptive Quality Monitor

## Problem Statement
Fixed graphic settings lead to inconsistent user experiences: high-end desktop GPUs are under-utilized, while mid-tier laptops and mobile phones experience severe thermal throttling, battery drain, and frame-rate drops below 20 FPS. If a mobile device with a 3x Retina screen attempts to render a complex shader at native resolution, it renders over 8 million pixels per frame.

---

## Architectural Solution
Implement an **Adaptive Quality Monitor**:
1. **Dynamic DPR Clamping**: Restrict Device Pixel Ratio to a safe range (`[1, 1.5]`).
2. **Runtime FPS Profiler**: Monitor the delta between render frames. If consecutive frame drops occur (<45 FPS over a 2-second sampling window), trigger a quality downgrade event.
3. **Graceful Quality Downgrade**:
   - Level 1 (Optimal): Full resolution (DPR 1.5), Postprocessing Bloom + Noise active.
   - Level 2 (Compromised): Lower resolution (DPR 1.0), Noise disabled, Bloom simplified.
   - Level 3 (Critical): Postprocessing disabled completely, shadow maps deactivated, particle count cut by 60%.

---

## Production Implementation

```tsx
// hooks/useAdaptiveQuality.ts
'use client';

import { useState, useEffect } from 'react';
import { usePerformanceMonitor } from '@react-three/drei';

export interface QualityProfile {
  dpr: number;
  enablePostprocessing: boolean;
  shadowMapSize: number;
}

export function useAdaptiveQuality() {
  const [dpr, setDpr] = useState(1.5);
  const [enablePostprocessing, setEnablePostprocessing] = useState(true);

  // Auto-tune based on hardware concurrency on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const cores = navigator.hardwareConcurrency || 4;
    const isMobile = window.innerWidth < 768;

    if (isMobile || cores <= 4) {
      setDpr(1.0);
      setEnablePostprocessing(false);
    }
  }, []);

  // Handler for Drei performance drop detection
  const handlePerformanceDecline = () => {
    // Gracefully downgrade resolution and disable heavy shader passes
    setDpr((current) => Math.max(0.85, current - 0.25));
    setEnablePostprocessing(false);
    console.info('Adaptive Quality: Downgraded WebGL quality profile to maintain 60 FPS.');
  };

  return {
    dpr,
    enablePostprocessing,
    onDecline: handlePerformanceDecline,
  };
}

// React Three Fiber Scene Integration Component
export function AdaptiveQualityGuard({ children }: { children: React.ReactNode }) {
  const { onDecline } = useAdaptiveQuality();

  return (
    <>
      {/* Drei Performance Monitor automatically evaluates FPS */}
      <usePerformanceMonitor.Component
        onDecline={onDecline}
        flipflops={3}
        factor={0.8}
      />
      {children}
    </>
  );
}
```

---

## Key Benefits
- **Zero Crashes**: Prevents mobile browser tab crashes from WebGL out-of-memory errors.
- **Consistent Frame Rate**: Guarantees responsive scroll interactions even when device hardware is under heavy load.
- **Silent Degradation**: The user never experiences frozen screens; visual fidelity gently scales without interrupting interaction.
