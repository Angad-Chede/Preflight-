# Motion (Framer Motion) Component Orchestration

## 1. What the Technique Is
Motion (formerly Framer Motion) is a declarative animation and gesture library for React. It features an automated FLIP (First, Last, Invert, Play) layout projection engine (`layout` and `layoutId`), physics-based spring models, enter/exit lifecycle coordination via `<AnimatePresence>`, and intuitive gesture handlers (`whileHover`, `whileTap`, `whileDrag`).

---

## 2. When to Use It
- Component-level state transitions (modals opening, accordion folding, tab switching, dropdowns).
- Morphing shared elements across differing layout positions using `layoutId`.
- Micro-interactions, gestures, and tactile spring feedback on buttons, cards, and toggles.
- Unmounting/exit animations where elements must complete an exit transition before removal from the React DOM tree.

---

## 3. When NOT to Use It
- Pinned, multi-section scroll storytelling spanning 3,000+ pixels of document depth (GSAP ScrollTrigger is vastly superior in performance and timeline control for complex pinned scrubbing).
- Direct frame-by-frame 3D mesh matrix updates in Three.js (use `useFrame` directly).
- Performance-critical canvas or particle pipelines.

---

## 4. Implementation Pattern
1. Configure global motion preferences at the application root via `<MotionConfig reducedMotion="user">`.
2. Extract reusable spring presets into a centralized design token file rather than re-declaring ad-hoc transition objects.
3. Use `AnimatePresence mode="wait"` for sequential route or tab switches to ensure the outgoing component completely exits before the incoming component mounts.
4. Use `layoutId` on identically keyed elements across conditional branches to achieve fluid element morphing.

---

## 5. React / Next.js Example

```tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Item {
  id: string;
  title: string;
  category: string;
  details: string;
}

const ITEMS: Item[] = [
  { id: '1', title: 'Neural Compute Core', category: 'Hardware', details: 'Sub-millisecond inference matrix with zero memory degradation.' },
  { id: '2', title: 'Quantum Encryption Node', category: 'Security', details: 'Post-quantum cryptographic key distribution network.' },
  { id: '3', title: 'Lattice Telemetry', category: 'Analytics', details: 'Distributed edge analytics operating at petabyte throughput.' },
];

const springTransition = {
  type: 'spring',
  stiffness: 450,
  damping: 35,
};

export function MorphingCardGrid() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const activeItem = ITEMS.find((i) => i.id === selectedId);

  return (
    <div className="relative min-h-[500px] p-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {ITEMS.map((item) => (
          <motion.div
            key={item.id}
            layoutId={`card-container-${item.id}`}
            onClick={() => setSelectedId(item.id)}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 backdrop-blur-sm"
          >
            <motion.span
              layoutId={`card-category-${item.id}`}
              className="text-xs font-mono uppercase tracking-wider text-indigo-400"
            >
              {item.category}
            </motion.span>
            <motion.h4
              layoutId={`card-title-${item.id}`}
              className="mt-2 text-xl font-medium text-white"
            >
              {item.title}
            </motion.h4>
            <p className="mt-4 text-sm text-neutral-400">Click to expand details</p>
          </motion.div>
        ))}
      </div>

      {/* Expanded Modal Overlay */}
      <AnimatePresence>
        {activeItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedId(null)}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                layoutId={`card-container-${activeItem.id}`}
                transition={springTransition}
                className="pointer-events-auto w-full max-w-lg rounded-3xl border border-neutral-700 bg-neutral-900 p-8 shadow-2xl"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <motion.span
                      layoutId={`card-category-${activeItem.id}`}
                      className="text-xs font-mono uppercase tracking-wider text-indigo-400"
                    >
                      {activeItem.category}
                    </motion.span>
                    <motion.h3
                      layoutId={`card-title-${activeItem.id}`}
                      className="mt-1 text-2xl font-bold text-white"
                    >
                      {activeItem.title}
                    </motion.h3>
                  </div>
                  <button
                    onClick={() => setSelectedId(null)}
                    className="rounded-full bg-neutral-800 p-2 text-neutral-400 hover:text-white"
                    aria-label="Close dialog"
                  >
                    ✕
                  </button>
                </div>

                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.15 }}
                  className="mt-6 text-neutral-300 leading-relaxed"
                >
                  {activeItem.details}
                </motion.p>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
```

---

## 6. Dependencies
- `framer-motion`: `^11.0.0` or `motion`: `^11.0.0`

---

## 7. Performance Considerations
- **Avoid layout thrashing**: When using `layout` or `layoutId`, Motion calculates bounding boxes using FLIP. Avoid placing `layout` on hundreds of deeply nested children simultaneously; place it on high-level boundary elements.
- **Hardware Acceleration**: Motion maps layout differences into GPU `transform: translate3d(...)` and `scale3d(...)` under the hood. Avoid changing border-radius during layout morphs unless necessary, as border-radius can force layer re-rasterization.

---

## 8. Mobile Considerations
- Gesture handlers like `whileHover` are automatically ignored on pure touch devices, but `whileTap` provides instant responsive touch feedback.
- Disable drag gestures that conflict with vertical page scroll unless `dragDirectionLock` is configured.

---

## 9. Accessibility Considerations
- Wrap top-level providers in `<MotionConfig reducedMotion="user">`. Motion will automatically switch layout animations from spatial spring transitions to instant coordinate snaps or gentle opacity dissolves.
- Modal dialogues rendered via `AnimatePresence` must trap keyboard focus, provide `aria-modal="true"`, and listen for `Escape` key events.

---

## 10. Common Mistakes
1. **Missing `key` in `<AnimatePresence>` children**: Failing to assign a unique `key` prevents Motion from knowing which element is entering vs exiting.
2. **Conditional unmount without AnimatePresence**: Running `isActive && <motion.div exit={{ opacity: 0 }} />` without wrapping in `<AnimatePresence>` results in immediate unmounting with zero exit animation.
3. **Overusing `layout` prop**: Putting `layout` indiscriminately on every single paragraph, span, and div in a list causes expensive layout calculations on every state tick.

---

## 11. Related Patterns
- `motion-primitives.md`
- `gsap-vs-motion-decision-matrix.md`
- `hover-and-micro-interactions.md`

---

## 12. Source References
- [Motion Primitives Teardown](../sources/motion-primitives.md)
- [Official Docs Synthesis: Motion](../sources/official-docs-synthesis.md)
- Motion Official Docs: https://motion.dev/
