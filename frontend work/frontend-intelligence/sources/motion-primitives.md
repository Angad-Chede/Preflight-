# Motion Primitives Website — Deep Source Extraction

## 1. README Inspection
- **Tagline**: 155+ free React animation components for Next.js.
- **Positioning**: Open-source alternative to Aceternity UI, Magic UI, and 21st.dev.
- **Key Categories**:
  - Interactive components: macOS Dock, SpotlightCard, BorderBeam, AnimatedTabs, RippleButton, LiquidGlass, Marquee, MorphingText.
  - Backgrounds: Stripe-style Canvas MeshGradient (FBM noise), Aurora, Meteors, FilmGrain, Shader Backgrounds (Noise, Liquid Metal, Wave, Plasma).
  - Premium Effects: Apple iOS LiquidGlass, Linear SpotlightCard, Vercel AnimatedBeam, CursorReveal, ProgressiveBlur.
  - Kinetic Text: TextScramble (cyberpunk decode), SpringText (per-character cursor repulsion), VariableFontText (weight/width axis animation).
  - SVG Suite: SvgPathDraw, SvgMorph, SvgLineOrchestra, SvgGooeyBlob, SvgLiquidMorph, SvgTextPathScroll, feTurbulence glitch & wave distortion.
  - 3D Demos: 6 R3F scenes (gravity well, swarm intelligence, sound fabric, ferrofluid) + 6 Spline scenes.

---

## 2. package.json Inspection
```json
{
  "name": "motion-primitives-website",
  "version": "2.0.0",
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "framer-motion": "^11.3.0",
    "gsap": "^3.12.5",
    "@gsap/react": "^2.1.1",
    "three": "^0.166.0",
    "@react-three/fiber": "^8.16.8",
    "@react-three/drei": "^9.105.0",
    "tailwindcss": "^3.4.4",
    "lucide-react": "^0.400.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.3.0"
  }
}
```

---

## 3. Source Structure Inspection
```
motion-primitives/
├── components/
│   ├── interactive/       # dock, marquee, spotlight-card, magnetic, ripple, animated-tabs, liquid-glass
│   ├── backgrounds/       # mesh-gradient (FBM canvas), aurora, particles, shader-backgrounds, film-grain
│   ├── effects/           # premium-effects: liquid-glass, cursor-reveal, progressive-blur, animated-beam
│   ├── text/              # text-scramble, spring-text, variable-font-text, morphing-text
│   ├── svg/               # animated-svg: path-draw, morph, line-orchestra, gooey-blob, liquid-morph
│   └── 3d/                # r3f demos: gravity-well, swarm, sound-fabric, ferrofluid
├── hooks/                 # useSvgPathDraw, useMousePosition, useSpringPhysics, useInView
└── lib/                   # utils (cn), math, noise algorithms
```

---

## 4. Major Technologies
- **Framer Motion v11**: Component layout projection, springs, gestures.
- **GSAP 3 & ScrollTrigger**: Choreographed SVG line sequences, horizontal scroll scrubbing.
- **Three.js & React Three Fiber**: Interactive 3D particle fields, procedural shaders.
- **Canvas 2D API**: Fractional Brownian Motion (FBM) simplex noise mesh gradients.
- **SVG Filters**: `feTurbulence`, `feDisplacementMap`, `feColorMatrix` gooey metaballs.

---

## 5. Reusable Patterns
1. **Compound Primitive Architecture**: `<Dock><DockIcon /></Dock>` sharing scale springs via React Context.
2. **Shared FLIP Indicators**: `layoutId="active-indicator"` for tab sliding and hover pills.
3. **Cursor Repulsion Fields**: Calculating distance vector from cursor to character spans, pushing characters along inverted vectors with spring return.
4. **Progressive Edge Blur**: Layered CSS `backdrop-filter: blur(...)` with linear-gradient alpha masks to soften scrolling container edges.

---

## 6. Animation Techniques
- Per-character physics: Spreading words into individual `<span>` elements animated via spring offsets.
- Cyberpunk Text Scrambling: Interval loops picking random glyphs (`!<>-_\\/[]{}—=+*^?#________`) and resolving characters left-to-right over elapsed time.
- SVG Stroke Dasharray / Dashoffset tweening for drawing paths on scroll.

---

## 7. 3D / WebGL Techniques
- Procedural particle simulations (gravity wells and swarm vectors) calculated in `useFrame`.
- Canvas 2D FBM noise: Generating multi-octave simplex noise gradients on an offscreen canvas and drawing to the viewport.

---

## 8. Performance Techniques
- CSS variable pointer tracking: Updating `--mouse-x` and `--mouse-y` inline without React state re-renders.
- Offscreen canvas rasterization for noise gradients.
- Clamped framerates on particle canvas loops.

---

## 9. Responsive / Mobile Techniques
- Media query gates: Disabling cursor hover repulsion and spotlight tracking on `(pointer: coarse)`.
- macOS Dock collapses to static scrollable row on mobile screens.

---

## 10. Accessibility Techniques
- Text scramble and split kinetic text preserve un-split content in `<span className="sr-only">` with `aria-hidden="true"` on animated spans.
- Global `<MotionConfig reducedMotion="user">` disables spring repulsion.

---

## 11. Dependencies
- Core: `framer-motion`, `gsap`, `three`, `@react-three/fiber`, `@react-three/drei`.
- Utilities: `clsx`, `tailwind-merge`, `lucide-react`.

---

## 12. Implementation Tradeoffs
- **SVG Filters vs WebGL**: `feTurbulence` filters are lightweight and need no WebGL runtime, but suffer performance drops when applied to large viewport surfaces on Safari.
- **Character Splitting**: Enriching typographic kineticism multiplies DOM nodes; must be restricted to short headlines.
