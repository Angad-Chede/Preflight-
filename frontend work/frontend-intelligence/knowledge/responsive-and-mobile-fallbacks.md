# Responsive 3D Behavior & Mobile Fallback Strategies

## 1. What the Technique Is
Responsive 3D and mobile fallback architecture ensures that modern creative websites scale gracefully from $3,000 multi-GPU workstations down to budget smartphones on cellular networks. This involves dynamic Device Pixel Ratio (DPR) throttling, WebGL tier detection, replacing interactive 3D with optimized WebP/MP4 media on low-power devices, and adapting mouse-driven interactions into touch-friendly alternatives.

---

## 2. When to Use It
- Every production web application incorporating WebGL, Three.js, complex GSAP scroll scrubbing, or custom postprocessing.
- Critical for international audiences where mobile device hardware spans wide performance tiers.

---

## 3. When NOT to Use It
- Internal native desktop apps or enterprise tools with strictly guaranteed desktop hardware requirements.

---

## 4. Implementation Pattern
1. **The Three-Tier Hardware Degradation Model**:
   - **Tier 1 (High Desktop)**: Full 3D scene, postprocessing (bloom, vignette, chromatic aberration), dynamic particle fields, DPR 1.5.
   - **Tier 2 (Mid-tier / Modern Mobile)**: 3D scene active, postprocessing disabled, simplified materials, DPR 1.0, particle counts halved.
   - **Tier 3 (Budget Mobile / Low Battery / Reduced Motion)**: 3D canvas replaced with an optimized video/poster image loop or static WebP render; zero WebGL initialized.
2. **Dynamic DPR Clamping**:
   - Never allow `dpr > 1.5` on mobile. High-end devices with 3.0 or 4.0 DPR waste GPU power calculating imperceptible sub-pixels.
3. **Touch vs Pointer Detection**:
   - Use CSS Media queries: `@media (pointer: fine)` for mouse, `@media (pointer: coarse)` for touch.
   - Replace continuous mouse hover tracking with discrete touch gestures or autonomous gentle oscillation.

---

## 5. React / Next.js Example

```tsx
'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import with SSR disabled for heavy 3D canvas
const Interactive3DScene = dynamic(
  () => import('./Interactive3DScene').then((mod) => mod.Interactive3DScene),
  { ssr: false }
);

export function AdaptiveHeroVisual() {
  const [tier, setTier] = useState<'desktop' | 'mobile-webgl' | 'fallback'>('desktop');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const evaluateDeviceTier = () => {
      // 1. Check user preference for reduced motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        setTier('fallback');
        return;
      }

      // 2. Check hardware concurrency and screen width
      const cores = navigator.hardwareConcurrency || 4;
      const isSmallScreen = window.innerWidth < 768;

      // 3. Check for WebGL support
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setTier('fallback');
        return;
      }

      if (isSmallScreen && cores <= 4) {
        // Low-tier mobile: fallback to video
        setTier('fallback');
      } else if (isSmallScreen) {
        // Mid/High-tier mobile: simplified WebGL
        setTier('mobile-webgl');
      } else {
        // Desktop: full fidelity
        setTier('desktop');
      }
    };

    evaluateDeviceTier();
    window.addEventListener('resize', evaluateDeviceTier);
    return () => window.removeEventListener('resize', evaluateDeviceTier);
  }, []);

  if (!isClient) {
    // Initial SSR Skeleton / Poster
    return <div className="h-[600px] w-full rounded-3xl bg-neutral-900 animate-pulse" />;
  }

  return (
    <div className="relative h-[600px] w-full rounded-3xl overflow-hidden bg-neutral-950">
      {tier === 'fallback' ? (
        // Tier 3: High-efficiency muted loop video / poster
        <div className="relative h-full w-full">
          <video
            autoPlay
            loop
            muted
            playsInline
            poster="/media/hero-3d-poster.webp"
            className="h-full w-full object-cover"
          >
            <source src="/media/hero-3d-optimized.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />
        </div>
      ) : (
        // Tier 1 & 2: Dynamic WebGL Scene with adapted fidelity
        <Interactive3DScene enablePostprocessing={tier === 'desktop'} dpr={tier === 'desktop' ? [1, 1.5] : [1, 1]} />
      )}
    </div>
  );
}
```

---

## 6. Dependencies
- `next/dynamic`: built-in
- Standard WebGL context detection

---

## 7. Performance Considerations
- **Battery Preservation**: Running unthrottled WebGL at 120 FPS on modern iPhones drains 1% battery per minute and causes rapid CPU thermal down-clocking. Falling back to an H.264 / AV1 video consumes hardware media decoders at <5% CPU usage.
- **Save Bandwidth**: Serve fallback videos in WebM/MP4 compressed via modern codecs (`crf 28`).

---

## 8. Mobile Considerations
- **Viewport Height Shifts**: Mobile browsers trigger height recalculations as the address bar slides in/out. Use `100dvh` (Dynamic Viewport Height) or fix canvas container heights with aspect-ratio containers (`aspect-video`, `aspect-square`).

---

## 9. Accessibility Considerations
- Fallback video must include `muted playsInline` to prevent autoplay blocking and loud unexpected audio.
- Ensure all important brand messaging or product information is accessible via semantic HTML typography, never trapped inside a WebGL texture.

---

## 10. Common Mistakes
1. **Unconditional WebGL Loading**: Forcing a 40MB 3D scene on an Android phone over 3G cellular data, causing the browser tab to crash or freeze for 15 seconds.
2. **Missing `playsInline` on fallback video**: On iOS Safari, missing `playsInline` causes the video to launch into fullscreen native player on initial load.
3. **Relying exclusively on User-Agent sniffing**: User-Agent strings are spoofed and unreliable. Always use feature detection (`hardwareConcurrency`, `matchMedia`, `WebGL context`).

---

## 11. Related Patterns
- `responsive-dpr-monitor.md`
- `accessibility-reduced-motion.md`
- `interactive-3d-hero.md`

---

## 12. Source References
- [AETHER Boilerplate Teardown](../sources/aether-boilerplate.md)
- [Official Docs Synthesis](../sources/official-docs-synthesis.md)
