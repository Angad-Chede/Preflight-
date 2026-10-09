# AGENT.md — Frontend Intelligence Operating Manual for Coding Agents

## 1. Mission & Purpose
This repository (`frontend-intelligence`) is a curated engineering knowledge base derived from production-grade, award-winning open-source repositories and official framework documentation.

**Your Role as an Agent**:
Before implementing any visually complex website, you must inspect [`frontend-intelligence/README.md`](file:///c:/Users/USER/frontend%20work/frontend-intelligence/README.md) and use the knowledge base selectively. Do not build basic MVPs. Build state-of-the-art, visually stunning, accessible, and high-performance digital experiences.

---

## 2. Frontend Intelligence Rules (Task-Based Reading Guide)

Use the knowledge base selectively according to the task at hand:

### If the task involves animation
Read:
- [knowledge/animations.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/animations.md)
- [knowledge/gsap.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/gsap.md)
- [knowledge/scroll.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/scroll.md)

### If the task involves smooth scrolling
Read:
- [knowledge/lenis.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/lenis.md)
- [knowledge/scroll.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/scroll.md)

### If the task involves 3D
Read:
- [knowledge/threejs.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/threejs.md)
- [knowledge/r3f.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/r3f.md)
- [knowledge/3d-models.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/3d-models.md)

### If the task involves shaders
Read:
- [knowledge/shaders.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/shaders.md)
- [knowledge/threejs.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/threejs.md)

### If the task involves page transitions
Read:
- [knowledge/transitions.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/transitions.md)
- [knowledge/gsap.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/gsap.md)

### If the task involves interactive cards
Read:
- [patterns/cards/](file:///c:/Users/USER/frontend%20work/frontend-intelligence/patterns/cards/)
- [knowledge/interactions.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/interactions.md)

### If the task involves a cinematic landing page
Read:
- [recipes/cinematic-hero.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/recipes/cinematic-hero.md)
- [recipes/award-style-landing-page.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/recipes/award-style-landing-page.md)
- [knowledge/animations.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/animations.md)
- [knowledge/scroll.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/scroll.md)
- [knowledge/typography.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/typography.md)

### If the task involves a 3D product
Read:
- [recipes/3d-product-showcase.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/recipes/3d-product-showcase.md)
- [knowledge/threejs.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/threejs.md)
- [knowledge/r3f.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/r3f.md)
- [knowledge/3d-models.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/3d-models.md)
- [knowledge/performance.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/performance.md)

### If the task involves mobile
Always read:
- [knowledge/responsive-design.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/responsive-design.md)
- [knowledge/performance.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/performance.md)
- [knowledge/accessibility.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/accessibility.md)

---

## 3. Technology Selection & Design Principles

### Technology Selection:
Do not automatically use every technology. Choose the simplest technology that produces the desired result:
- **CSS**: Use when CSS is sufficient.
- **Motion**: Use for simple UI animation, component mounting/unmounting, and micro-gestures.
- **GSAP**: Use when complex timelines, sequencing, scroll choreography, or advanced motion control is required.
- **Lenis**: Use when smooth scrolling materially improves the experience.
- **Three.js / R3F**: Use only when 3D/WebGL materially improves the experience.
- **Shaders**: Use only when the visual effect genuinely requires GPU rendering.
- Avoid unnecessary animation.
- Avoid animation that harms readability, usability, accessibility, or performance.

### Design Principles:
Prioritize in order:
1. **Typography**
2. **Layout**
3. **Spacing**
4. **Visual hierarchy**
5. **Interaction design**
6. **Motion**
7. **3D / WebGL**

*Do not use effects to compensate for poor design.*

### Performance:
Every heavy visual feature must consider:
- lazy loading
- dynamic imports
- GPU cost
- mobile fallback
- asset size
- texture size
- model size
- frame rate (60 FPS budget)
- reduced motion
- memory usage

*Never add a large 3D scene to the initial bundle without considering loading strategy.*

### Code Quality:
Prefer:
- reusable components
- clear separation of concerns
- TypeScript
- composable animation utilities
- centralized animation configuration
- responsive behavior
- accessible interactions

*Do not copy entire implementations from reference repositories unless their license permits it and copying is genuinely appropriate. Use reference repositories as engineering references rather than design templates.*

---

## 4. Directory Navigation Map

```
frontend-intelligence/
├── README.md               # Overview, rapid discovery index, and taxonomy
├── RULES.md                # Codified frontend intelligence rules
├── AGENT.md                # (This file) Agent operating manual & benchmark answers
│
├── sources/                # 8 Deep 12-point architectural extractions
├── knowledge/              # 28 Deep engineering specifications (Standard Schema)
│   ├── animations.md
│   ├── gsap.md
│   ├── scroll.md
│   ├── lenis.md
│   ├── threejs.md
│   ├── r3f.md
│   ├── 3d-models.md
│   ├── shaders.md
│   ├── transitions.md
│   ├── interactions.md
│   ├── typography.md
│   ├── performance.md
│   ├── responsive-design.md
│   ├── accessibility.md
│   ├── ...
│   └── gaps.md
│
├── patterns/               # Reusable architectural patterns, hooks, & cards suite
│   ├── cards/              # tilt-card.md, spotlight-card.md, bento-card.md
│   ├── unified-raf-manager.md
│   ├── use-reduced-motion.md
│   ├── hybrid-canvas-layout.md
│   ├── asset-preloader-manager.md
│   ├── responsive-dpr-monitor.md
│   ├── magnetic-element-hook.md
│   └── scroll-trigger-cleanup-hook.md
│
└── recipes/                # 12 Production-ready copy-paste component recipes
    ├── cinematic-hero.md
    ├── interactive-3d-hero.md
    ├── smooth-scroll-website.md
    ├── gsap-scroll-storytelling.md
    ├── 3d-product-showcase.md
    ├── interactive-portfolio.md
    ├── webgl-background.md
    ├── magnetic-cursor.md
    ├── premium-navbar.md
    ├── page-transition-system.md
    ├── bento-dashboard.md
    └── award-style-landing-page.md
```

---

## 5. Direct Answers to Benchmark Architectural Questions

### Q1: "What is the best way to create a cinematic hero?"
- **Answer**: Combine a full-bleed background media layer (video or WebGL) with pinned GSAP ScrollTrigger scrubbing (`anticipatePin: 1`). Dolly the background media (`scale: 1.25, filter: brightness(0.4)`) while fading out layered typography (`y: -120, opacity: 0`). Provide an ambient audio toggle respecting browser autoplay policies and add an editorial film grain overlay.
- **Reference**: [Recipe: Cinematic Hero](file:///c:/Users/USER/frontend%20work/frontend-intelligence/recipes/cinematic-hero.md)

### Q2: "How should I combine Lenis and ScrollTrigger?"
- **Answer**: Never run dual independent RAF loops. Instantiate Lenis with `autoRaf: false`, pipe `lenis.on('scroll', ScrollTrigger.update)`, bind `lenis.raf(time * 1000)` into `gsap.ticker.add()`, and crucially set `gsap.ticker.lagSmoothing(0)` to prevent desynchronization during frame spikes.
- **Reference**: [Knowledge: Lenis](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/lenis.md) & [Pattern: Unified RAF Manager](file:///c:/Users/USER/frontend%20work/frontend-intelligence/patterns/unified-raf-manager.md)

### Q3: "How do I add a Three.js product model?"
- **Answer**: Compress the GLB asset using `@gltf-transform/cli` with Draco or Meshopt and resize textures to max 1024/2048. Generate typed JSX via `npx gltfjsx model.glb -t -s`. Load inside R3F using `useGLTF('/model.glb')` wrapped in `<Suspense fallback={<Loader />}>`. Preload using `useGLTF.preload('/model.glb')`. Pair with `<Environment preset="studio" />` and `<ContactShadows />`.
- **Reference**: [Knowledge: 3D Models](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/3d-models.md) & [Recipe: 3D Product Showcase](file:///c:/Users/USER/frontend%20work/frontend-intelligence/recipes/3d-product-showcase.md)

### Q4: "Should this section use GSAP or Motion?"
- **Answer**: Refer to the definitive matrix. Use **GSAP** for pinned multi-stage scroll storytelling, coordinate scrubbing, and Three.js object tweens. Use **Motion** for component unmounting (`AnimatePresence`), layout morphs (`layoutId`), accordions (`height: auto`), and micro-gestures (`whileHover`, `whileTap`). In modern apps, use both in a hybrid architecture.
- **Reference**: [Knowledge: GSAP vs Motion Matrix](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/gsap-vs-motion-decision-matrix.md)

### Q5: "How can I create a WebGL background without destroying mobile performance?"
- **Answer**: Render a single flat fullscreen quad (`planeGeometry args={[2, 2]}`) in R3F with `gl={{ powerPreference: 'low-power', antialias: false, depth: false }}`. Force `dpr={1}`. Evaluate procedural 2D simplex noise inside the fragment shader. If on mobile data saver or weak devices (`hardwareConcurrency < 4`), fall back to a CSS radial gradient and do not mount the WebGL canvas.
- **Reference**: [Recipe: WebGL Background](file:///c:/Users/USER/frontend%20work/frontend-intelligence/recipes/webgl-background.md) & [Knowledge: Responsive Design](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/responsive-design.md)

### Q6: "How do I implement a magnetic button?"
- **Answer**: Use the reusable `useMagnetic` hook. Query `(pointer: fine)` to bypass touch screens. On mouse move over the button, calculate the delta from element center to pointer, and tween `x: deltaX * 0.35, y: deltaY * 0.35` with GSAP `duration: 0.25`. On mouse leave, tween back to origin with `ease: 'elastic.out(1, 0.35)', duration: 0.7`.
- **Reference**: [Pattern: Magnetic Element Hook](file:///c:/Users/USER/frontend%20work/frontend-intelligence/patterns/magnetic-element-hook.md) & [Recipe: Magnetic Cursor](file:///c:/Users/USER/frontend%20work/frontend-intelligence/recipes/magnetic-cursor.md)

### Q7: "How do I build an Awwwards-style page transition?"
- **Answer**: In Next.js App Router, intercept internal link navigation with a custom transition handler. Animate an organic curved SVG path or clip-path curtain over the viewport (`duration: 0.6s`). When fully covered, call `router.push(href)` and `window.scrollTo(0, 0)`. Then slide the curtain upward away (`duration: 0.8s`), revealing the incoming route.
- **Reference**: [Recipe: Page Transition System](file:///c:/Users/USER/frontend%20work/frontend-intelligence/recipes/page-transition-system.md) & [Knowledge: Transitions](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/transitions.md)

### Q8: "How should I lazy-load a heavy R3F scene?"
- **Answer**: Dynamically import the 3D scene component using `next/dynamic` with `ssr: false`:
  ```tsx
  const CanvasScene = dynamic(() => import('@/components/CanvasScene'), {
    ssr: false,
    loading: () => <Skeleton />,
  });
  ```
  Wrap async GLTF assets in `<Suspense>`, use `<Canvas frameloop="demand">` if not continuously animated, and clamp DPR to `[1, 1.5]`.
- **Reference**: [Knowledge: Performance](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/performance.md)
