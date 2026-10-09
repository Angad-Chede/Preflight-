# GSAP vs. Motion (Framer Motion) Decision Matrix

## 1. What the Technique Is
Choosing between **GSAP (GreenSock)** and **Motion (Framer Motion)** is one of the most critical architectural decisions on a modern frontend project. They operate under fundamentally different paradigms:
- **GSAP**: An imperative, timeline-based animation engine optimized for high-performance sequence choreography, scroll pinning, raw transforms, and WebGL property bridging.
- **Motion**: A declarative, React-native reconciler-aligned library optimized for component lifecycle transitions, shared element morphs (`layoutId`), gesture physics, and UI state binding.

---

## 2. Definitive Comparison Matrix

| Capability / Scenario | Use GSAP | Use Motion | Rationale |
| :--- | :---: | :---: | :--- |
| **Scroll-Driven Storytelling (Scrubbing)** | **PRIMARY** | Fallback | GSAP ScrollTrigger has superior sub-pixel pinning, scrub interpolation, and lag smoothing. |
| **Pinned Horizontal Scroll Tracks** | **PRIMARY** | Avoid | GSAP handles pin spacer DOM calculations and dynamic resizing flawlessly. |
| **Shared Layout Morphs (`layoutId`)** | Avoid | **PRIMARY** | Motion's FLIP projection engine morphs components between differing DOM parents out-of-the-box. |
| **Exit Animations (`AnimatePresence`)** | Difficult | **PRIMARY** | Motion holds unmounting React components in memory until exit animations resolve. |
| **Complex Choreography (10+ elements)** | **PRIMARY** | Complex | GSAP Timelines allow precise relative timing (`<`, `+=0.2`, labels) across independent nodes. |
| **Three.js / WebGL Property Tweens** | **PRIMARY** | Avoid | GSAP directly tweens raw JS objects, Vector3, Quaternions, and custom shader uniforms. |
| **Micro-Interactions (Hover, Tap, Drag)** | Verbose | **PRIMARY** | Motion provides declarative props: `whileHover`, `whileTap`, `whileDrag`, `dragConstraints`. |
| **Split Text / Character Staggers** | **PRIMARY** | Verbose | GSAP staggers arrays of DOM elements with zero React state overhead. |
| **Accordion / Height: Auto Transitions** | Needs measurement | **PRIMARY** | Motion animates to `height: "auto"` natively without manual bounding rect calculation. |
| **React Server Components (RSC) Friendliness** | Client only (`useGSAP`) | Client only (`'use client'`) | Both require client boundaries; Motion requires wrapping components in `motion.*`. |

---

## 3. The Hybrid Coexistence Architecture
High-end production web applications do **not** choose one exclusively; they assign them distinct operational boundaries:

```
+-------------------------------------------------------------+
| Application Root                                            |
|                                                             |
|   +-------------------------------------------------------+ |
|   | MACRO LEVEL: GSAP + ScrollTrigger + Lenis            | |
|   | - Smooth scroll synchronization                       | |
|   | - Pinned full-screen storytelling sections            | |
|   | - WebGL 3D camera and object choreography             | |
|   | - Global cursor follower position loop                | |
|   +-------------------------------------------------------+ |
|                              |                              |
|                              v                              |
|   +-------------------------------------------------------+ |
|   | MICRO LEVEL: Motion (Framer Motion)                   | |
|   | - Navbars, modals, slide-out drawers, tooltips        | |
|   | - Tab indicators with layoutId                        | |
|   | - Button tap/spring feedback                          | |
|   | - Form validation state transitions                   | |
|   +-------------------------------------------------------+ |
+-------------------------------------------------------------+
```

---

## 4. Architectural Rules of Thumb

### Rule 1: "Is it pinned or tied to scroll position?"
- **YES** -> **GSAP ScrollTrigger**. Motion's `useScroll` is adequate for simple progress bars, but struggles with multi-stage pinned viewports, anticipate pinning, and horizontal tracks.

### Rule 2: "Does it mount/unmount based on React state?"
- **YES** -> **Motion (`AnimatePresence`)**. Orchestrating clean React component unmounting in GSAP requires manual state deferral and custom promise hooks.

### Rule 3: "Does it bridge to Three.js or Canvas?"
- **YES** -> **GSAP**. GSAP tweens arbitrary objects: `gsap.to(camera.position, { z: 5 })`. Motion is strictly tied to DOM elements and SVG nodes.

### Rule 4: "Does an element physically change shape or location across state?"
- **YES** -> **Motion (`layoutId`)**. Writing manual FLIP logic in GSAP for dynamic React list reordering is hundreds of lines of error-prone code.

---

## 5. React Integration Example: Hybrid Orchestration

```tsx
'use client';

import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

export function HybridShowcase() {
  const scrollSectionRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const [activeTab, setActiveTab] = useState<'specs' | 'features'>('specs');

  // MACRO LAYER: GSAP handles pinned scroll scrub
  useGSAP(
    () => {
      gsap.fromTo(
        headlineRef.current,
        { scale: 0.8, opacity: 0.2 },
        {
          scale: 1.2,
          opacity: 1,
          scrollTrigger: {
            trigger: scrollSectionRef.current,
            start: 'top top',
            end: '+=150%',
            pin: true,
            scrub: true,
          },
        }
      );
    },
    { scope: scrollSectionRef }
  );

  return (
    <div ref={scrollSectionRef} className="relative h-screen w-full bg-neutral-950 p-8 text-white flex flex-col justify-between">
      <h1 ref={headlineRef} className="text-6xl font-light text-center my-auto">
        HYBRID ORCHESTRATION
      </h1>

      {/* MICRO LAYER: Motion handles interactive tabs & spring transitions */}
      <div className="z-10 mx-auto w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4 backdrop-blur-md">
        <div className="flex gap-2 rounded-xl bg-neutral-950 p-1">
          {(['specs', 'features'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="relative flex-1 py-2 text-xs uppercase tracking-wider font-mono text-neutral-400"
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute inset-0 rounded-lg bg-neutral-800"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className={`relative z-10 ${activeTab === tab ? 'text-white font-bold' : ''}`}>
                {tab}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 min-h-[80px]">
          <AnimatePresence mode="wait">
            <motion.p
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="text-sm text-neutral-400"
            >
              {activeTab === 'specs'
                ? 'Architecture: Multi-threaded engine with 120 FPS frame budget and sub-1ms paint latency.'
                : 'Features: Context-aware pins, dynamic layout FLIP projection, and zero-runtime overhead.'}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
```

---

## 6. Bundle Size Impact
- **GSAP core + ScrollTrigger**: ~28KB (gzipped). Tree-shakeable by importing only needed plugins.
- **Motion (Framer Motion)**: ~32KB (gzipped). Can be reduced using `LazyMotion` and `domAnimation` features (~16KB).
- **Both combined**: ~60KB (gzipped). Well within acceptable performance budgets for high-end creative websites when appropriately code-split.

---

## 7. Related Patterns
- `gsap-timelines-scrolltrigger.md`
- `motion-framer-orchestration.md`
- `award-style-landing-page.md`
