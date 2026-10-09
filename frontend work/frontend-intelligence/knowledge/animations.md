# Technique: Animation Selection & Orchestration

## Technique Name
Animation Selection & Orchestration

## Purpose
Establishes a principled decision framework and implementation standard for animations in modern web applications, ensuring animations enhance usability, visual hierarchy, and tactile feedback without harming frame rate or accessibility.

## Difficulty
Intermediate

## Dependencies
- CSS Transitions & Animations (Built-in)
- `framer-motion`: `^11.0.0` or `motion`: `^11.0.0`
- `gsap`: `^3.12.0`
- `@gsap/react`: `^2.1.0`

## When to Use
- Communicating system state (loading, success, error, active selection).
- Guiding user attention to primary focal points and calls to action.
- Creating continuous spatial continuity during layout changes or route transitions.
- Providing tactile physics feedback on user gestures (hover, tap, drag).

## When NOT to Use
- Decorative animation that delays user task completion (e.g., forcing a user to wait 3 seconds for a form button to animate in).
- Continuous looping animations that distract from reading long-form content.
- When `prefers-reduced-motion: reduce` is enabled.

## Implementation Strategy
Follow the **Tiered Technology Selection Rule**:
1. **Tier 1 (CSS Transitions)**: Use for single-state CSS property transitions (hover color changes, opacity fades, border highlights). Zero JavaScript overhead.
2. **Tier 2 (Motion / Framer Motion)**: Use for component lifecycle transitions (`AnimatePresence`), spring physics, micro-gestures (`whileHover`, `whileTap`), and shared layout morphing (`layoutId`).
3. **Tier 3 (GSAP)**: Use for complex multi-stage timelines, coordinate scrubbing linked to document scroll, SVG line orchestration, and Three.js object tweens.

## Example Code Pattern
```tsx
// Reusable Animation Preset Tokens (Framer Motion)
export const MOTION_PRESETS = {
  springSnappy: { type: 'spring', stiffness: 400, damping: 30 },
  springBouncy: { type: 'spring', stiffness: 350, damping: 20 },
  springSubtle: { type: 'spring', stiffness: 180, damping: 24 },
  easeEditorial: [0.16, 1, 0.3, 1] as const,
};

// Composable motion container
import { motion } from 'framer-motion';

export function StaggerFadeContainer({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.12, delayChildren: 0.1 },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: MOTION_PRESETS.easeEditorial } },
      }}
    >
      {children}
    </motion.div>
  );
}
```

## Performance Cost
- Transform and opacity animations run on GPU compositor threads with 0ms layout recalculation cost.
- Animating `height`, `width`, `top`, `left`, `margin`, or `padding` forces CPU layout reflows on every frame.

## Mobile Behavior
- Micro-interactions like `whileHover` are automatically ignored on touchscreens, while `whileTap` responds instantly to touch start.
- Avoid large-area scale transforms that trigger memory spikes on low-tier mobile devices.

## Accessibility Concerns
- Universal reduced-motion check is mandatory. Wrap root with `<MotionConfig reducedMotion="user">`.
- Animated transitions must never hide focus rings on interactive elements.

## Source Repository
- [`itsjwill/motion-primitives-website`](file:///c:/Users/USER/frontend%20work/frontend-intelligence/sources/motion-primitives.md)
- [`MuhammedAlii/high-end`](file:///c:/Users/USER/frontend%20work/frontend-intelligence/sources/high-end.md)
