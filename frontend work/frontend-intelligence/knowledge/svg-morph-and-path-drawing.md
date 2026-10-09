# Technique: SVG Path Morphing & Drawing Orchestration

## Technique Name
SVG Path Morphing & Drawing Orchestration

## Purpose
Orchestrates animated SVG line drawing (`stroke-dasharray` / `stroke-dashoffset`), dynamic path morphing (`d` attribute interpolation), and SVG filter distortions (`feTurbulence`) for logos, diagrams, and illustrative storytelling.

## Difficulty
Intermediate to Advanced

## Dependencies
- `framer-motion`: `^11.0.0` or `gsap`: `^3.12.0`

## When to Use
- Interactive technical diagrams, circuit boards, architectural schematics.
- Hero logo reveals and brand icons.
- Organic morphing shapes and gooey metaballs.

## When NOT to Use
- 3D models requiring realistic lighting and camera perspective (use Three.js).
- Extremely dense CAD vector files with over 5,000 sub-paths (causes severe browser SVG DOM lag).

## Implementation Strategy
1. **Self-Drawing Paths**: Measure total path length via `path.getTotalLength()`. Set `strokeDasharray = length` and animate `strokeDashoffset` from `length` to `0`.
2. **Path Morphing**: Use Flubber or GSAP MorphSVGPlugin, or Framer Motion path morphing for paths with identical segment topologies.
3. **Choreographed Timelines**: Chain sequential path drawings with GSAP staggered delays.

## Example Code Pattern
```tsx
// components/svg/SvgLineOrchestra.tsx
'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

export function SvgLineOrchestra() {
  const svgRef = useRef<SVGSVGElement>(null);

  useGSAP(
    () => {
      const paths = svgRef.current?.querySelectorAll('path');
      if (!paths) return;

      paths.forEach((path) => {
        const length = path.getTotalLength();
        gsap.set(path, {
          strokeDasharray: length,
          strokeDashoffset: length,
        });
      });

      gsap.to(paths, {
        strokeDashoffset: 0,
        duration: 1.8,
        ease: 'power2.inOut',
        stagger: 0.25,
        scrollTrigger: {
          trigger: svgRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
      });
    },
    { scope: svgRef }
  );

  return (
    <div className="flex justify-center p-12 bg-neutral-950">
      <svg
        ref={svgRef}
        viewBox="0 0 400 200"
        className="w-full max-w-lg stroke-indigo-500 fill-none stroke-[2]"
      >
        <path d="M 50 100 Q 150 20 200 100 T 350 100" />
        <path d="M 50 120 Q 150 40 200 120 T 350 120" strokeOpacity="0.6" />
        <path d="M 50 80 Q 150 0 200 80 T 350 80" strokeOpacity="0.3" />
      </svg>
    </div>
  );
}
```

## Performance Cost
- **GPU / CPU**: SVG path rendering is handled primarily on the CPU in older browser engines, but modern compositors hardware-accelerate simple `stroke-dashoffset` tweens.
- **Filter Overhead**: Heavy `<feTurbulence>` or `<feDisplacementMap>` filters can drop FPS on Safari mobile if applied across fullscreen SVG viewports.

## Mobile Behavior
- Scales seamlessly via SVG `viewBox` across all viewport densities with crisp zero-pixelation rendering.

## Accessibility Concerns
- Animated SVG illustrations should have descriptive `<title>` and `<desc>` elements inside the `<svg>`, or include `role="img" aria-label="Description"`.
- If decorative only, apply `aria-hidden="true"`.

## Source Repository
- [`itsjwill/motion-primitives-website`](file:///c:/Users/USER/frontend%20work/frontend-intelligence/sources/motion-primitives.md)
