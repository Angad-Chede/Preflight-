# Clip-Path & Mask Transitions

## 1. What the Technique Is
Clip-path and mask transitions define an element's visible rendering region using geometric polygons, circles, or SVG alpha masks. By animating the coordinate points of a `clip-path` (e.g. `polygon(...)` or `circle(...)`), developers create cinematic geometric wipes, angled curtain reveals, and aperture expansions far superior to plain opacity fades.

---

## 2. When to Use It
- Award-style page transitions (circular wipe opening from clicked button position).
- Full-bleed hero image/video entries.
- Before/after image comparison sliders.
- High-fashion editorial reveals and portfolio project previews.

---

## 3. When NOT to Use It
- Frequent layout changes involving hundreds of continuous small elements.
- When animating complex polygon topologies with mismatched point counts (browser will fail to interpolate points).
- Old legacy browsers lacking full CSS `clip-path` path support.

---

## 4. Implementation Pattern
1. **Identical Point Rule**: For CSS polygon transitions to interpolate smoothly, the starting and ending polygons must contain the **exact same number of coordinate pairs**.
2. **Circular Origin Wipe**: Calculate the clicked button's center `(x, y)` and animate `clip-path: circle(0% at x y)` to `clip-path: circle(150% at x y)` to cover the entire viewport from the click origin.
3. **Hardware Acceleration**: Pair `clip-path` animations with `will-change: clip-path` or render on dedicated composite layers.

---

## 5. React / Next.js Example

```tsx
'use client';

import { useRef, useState } from 'react';
import gsap from 'gsap';

export function CircularApertureReveal() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const triggerReveal = (e: React.MouseEvent<HTMLButtonElement>) => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    // Get click position in viewport coordinates
    const x = e.clientX;
    const y = e.clientY;

    if (!isOpen) {
      // Set initial origin point
      gsap.set(overlay, {
        clipPath: `circle(0px at ${x}px ${y}px)`,
        pointerEvents: 'auto',
      });

      // Animate circular expansion across full screen
      gsap.to(overlay, {
        clipPath: `circle(150vmax at ${x}px ${y}px)`,
        duration: 1.2,
        ease: 'power3.inOut',
        onComplete: () => setIsOpen(true),
      });
    } else {
      // Collapse back to click point
      gsap.to(overlay, {
        clipPath: `circle(0px at ${x}px ${y}px)`,
        duration: 0.9,
        ease: 'power3.inOut',
        onComplete: () => {
          setIsOpen(false);
          gsap.set(overlay, { pointerEvents: 'none' });
        },
      });
    }
  };

  return (
    <div className="relative min-h-[400px] w-full overflow-hidden rounded-3xl bg-neutral-900 p-8">
      <div className="flex flex-col items-start gap-4">
        <h3 className="text-3xl font-light text-white">Aperture Reveal System</h3>
        <p className="max-w-md text-neutral-400">
          Click the button below to expand a full-surface viewport transition radiating from the exact click coordinates.
        </p>
        <button
          onClick={triggerReveal}
          className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-transform hover:scale-105"
        >
          {isOpen ? 'Close Aperture' : 'Trigger Aperture Transition'}
        </button>
      </div>

      {/* Pinned Circular Overlay */}
      <div
        ref={overlayRef}
        style={{ clipPath: 'circle(0px at 50% 50%)' }}
        className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center bg-indigo-950 p-8 text-white will-change-[clip-path]"
      >
        <span className="text-xs uppercase font-mono tracking-widest text-indigo-400">Transition Target</span>
        <h2 className="mt-2 text-4xl md:text-6xl font-bold">New Dimension Unlocked</h2>
        <p className="mt-4 max-w-lg text-center text-indigo-200">
          Engineered via geometric CSS clip-path interpolation with zero document layout thrashing.
        </p>
        <button
          onClick={triggerReveal}
          className="mt-8 rounded-full border border-indigo-400/50 bg-indigo-900/60 px-6 py-3 text-sm font-medium hover:bg-indigo-900"
        >
          Dismiss Viewport
        </button>
      </div>
    </div>
  );
}

// Editorial Diagonal Polygon Reveal
export function DiagonalPolygonReveal({ imageUrl }: { imageUrl: string }) {
  return (
    <div className="group relative h-[450px] w-full overflow-hidden rounded-2xl bg-neutral-950">
      <div
        style={{ backgroundImage: `url(${imageUrl})` }}
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] [clip-path:polygon(0_100%,100%_100%,100%_100%,0_100%)] group-hover:[clip-path:polygon(0_0%,100%_0%,100%_100%,0_100%)] group-hover:scale-105"
      />
      <div className="relative z-10 flex h-full items-end p-8">
        <h4 className="text-2xl font-light text-white drop-shadow-md">Hover to Reveal Editorial Layer</h4>
      </div>
    </div>
  );
}
```

---

## 6. Dependencies
- GSAP `^3.12.0` (optional, can also be driven via pure Tailwind CSS / transitions).

---

## 7. Performance Considerations
- **Polygon Point Complexity**: Avoid animating polygons with more than 8 vertices. Complex SVG paths with hundreds of beziers should use SVG `<clipPath>` nodes or Canvas masks rather than CSS `polygon()`.
- **`vmax` Sizing**: Using `150vmax` for circle radius guarantees the circle fully encloses rectangular screens with extreme aspect ratios (ultrawide monitors or tall mobile screens).

---

## 8. Mobile Considerations
- Calculate coordinates using `e.clientX` or touch event `touches[0].clientX`.
- On mobile devices, circular clip-paths are rendered very efficiently by GPU compositors.

---

## 9. Accessibility Considerations
- If `prefers-reduced-motion` is active, bypass geometric wipes and instantly toggle visibility using simple opacity or direct display flags.
- Ensure the overlay traps focus and supports `Escape` key to close.

---

## 10. Common Mistakes
1. **Mismatched polygon vertex counts**: Animating from `polygon(0 0, 100% 0, 100% 100%, 0 100%)` (4 points) to a 5-point polygon causes CSS transitions to fail silently.
2. **Using `%` instead of `px` or `vmax` in circular origin**: A radius in `%` is relative to width/height, causing elliptical distortion rather than a true circle.
3. **Ignoring `pointer-events`**: Leaving an invisible clipped element with `pointer-events: auto` intercepts clicks meant for elements beneath it.

---

## 11. Related Patterns
- `page-transitions-app-router.md`
- `high-end.md`
- `award-style-landing-page.md`

---

## 12. Source References
- [High-End Repository Teardown](../sources/high-end.md)
- CSS Shapes & Clip-Path Spec (W3C)
