# frontend-intelligence

> **A local, world-class engineering knowledge base for high-end, award-winning frontend web development.**  
> Derived from deep architectural teardowns of premier open-source creative projects and official framework documentation.

---

## 📜 Frontend Intelligence Rules

Before implementing a visually complex website, inspect this document (`frontend-intelligence/README.md`).

Use the knowledge base selectively.

### Task-Based Reading Guide:
- **If the task involves animation**: Read [knowledge/animations.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/animations.md), [knowledge/gsap.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/gsap.md), and [knowledge/scroll.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/scroll.md).
- **If the task involves smooth scrolling**: Read [knowledge/lenis.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/lenis.md) and [knowledge/scroll.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/scroll.md).
- **If the task involves 3D**: Read [knowledge/threejs.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/threejs.md), [knowledge/r3f.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/r3f.md), and [knowledge/3d-models.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/3d-models.md).
- **If the task involves shaders**: Read [knowledge/shaders.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/shaders.md) and [knowledge/threejs.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/threejs.md).
- **If the task involves page transitions**: Read [knowledge/transitions.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/transitions.md) and [knowledge/gsap.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/gsap.md).
- **If the task involves interactive cards**: Read [patterns/cards/](file:///c:/Users/USER/frontend%20work/frontend-intelligence/patterns/cards/) and [knowledge/interactions.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/interactions.md).
- **If the task involves a cinematic landing page**: Read [recipes/cinematic-hero.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/recipes/cinematic-hero.md), [recipes/award-style-landing-page.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/recipes/award-style-landing-page.md), [knowledge/animations.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/animations.md), [knowledge/scroll.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/scroll.md), and [knowledge/typography.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/typography.md).
- **If the task involves a 3D product**: Read [recipes/3d-product-showcase.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/recipes/3d-product-showcase.md), [knowledge/threejs.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/threejs.md), [knowledge/r3f.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/r3f.md), [knowledge/3d-models.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/3d-models.md), and [knowledge/performance.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/performance.md).
- **If the task involves mobile**: Always read [knowledge/responsive-design.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/responsive-design.md), [knowledge/performance.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/performance.md), and [knowledge/accessibility.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/accessibility.md).

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

## ⚡ Rapid Discovery Index (Agent & Developer Lookup)

| Requirement / Problem Statement | Technique / Technology | Read This Document | Ready-to-Use Recipe |
| :--- | :--- | :--- | :--- |
| **Combine Lenis smooth scroll with GSAP ScrollTrigger** | Unified Master Ticker, `lagSmoothing(0)` | [knowledge/lenis.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/lenis.md) & [knowledge/scroll.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/scroll.md) | [Smooth Scroll Website](file:///c:/Users/USER/frontend%20work/frontend-intelligence/recipes/smooth-scroll-website.md) |
| **Pinned multi-stage scroll storytelling** | GSAP ScrollTrigger scrub, pin spacer math | [knowledge/gsap.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/gsap.md) & [knowledge/scroll.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/scroll.md) | [GSAP Scroll Storytelling](file:///c:/Users/USER/frontend%20work/frontend-intelligence/recipes/gsap-scroll-storytelling.md) |
| **Choose between GSAP and Framer Motion** | Architectural comparison, hybrid setup | [GSAP vs Motion Matrix](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/gsap-vs-motion-decision-matrix.md) | [Award-Style Landing Page](file:///c:/Users/USER/frontend%20work/frontend-intelligence/recipes/award-style-landing-page.md) |
| **Shared-element layout morphs across states** | Framer Motion FLIP projection (`layoutId`) | [knowledge/animations.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/animations.md) | [Premium Navbar](file:///c:/Users/USER/frontend%20work/frontend-intelligence/recipes/premium-navbar.md) |
| **Masked headline slide & reading highlights** | SplitText, overflow hidden, word scrub | [knowledge/typography.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/typography.md) | [Cinematic Hero](file:///c:/Users/USER/frontend%20work/frontend-intelligence/recipes/cinematic-hero.md) |
| **Interactive cards (3D Tilt & Spotlights)** | CSS variables (`--mouse-x`), rotate3d | [patterns/cards/](file:///c:/Users/USER/frontend%20work/frontend-intelligence/patterns/cards/) & [knowledge/interactions.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/interactions.md) | [Bento Dashboard](file:///c:/Users/USER/frontend%20work/frontend-intelligence/recipes/bento-dashboard.md) |
| **Magnetic button with elastic spring physics** | Proximity detection, elastic return ease | [knowledge/interactions.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/interactions.md) & [patterns/magnetic-element-hook.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/patterns/magnetic-element-hook.md) | [Magnetic Cursor](file:///c:/Users/USER/frontend%20work/frontend-intelligence/recipes/magnetic-cursor.md) |
| **Next.js App Router route transitions** | Intercepted router push, curved SVG curtain | [knowledge/transitions.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/transitions.md) & [knowledge/gsap.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/gsap.md) | [Page Transition System](file:///c:/Users/USER/frontend%20work/frontend-intelligence/recipes/page-transition-system.md) |
| **Prevent WebGL context exhaustion & leaks** | Single Canvas rule, `.dispose()` contract | [knowledge/threejs.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/threejs.md) | [Interactive 3D Hero](file:///c:/Users/USER/frontend%20work/frontend-intelligence/recipes/interactive-3d-hero.md) |
| **Co-locate 3D meshes inside DOM components** | Single fixed canvas + `tunnel-rat` portal | [patterns/hybrid-canvas-layout.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/patterns/hybrid-canvas-layout.md) | [Award-Style Landing Page](file:///c:/Users/USER/frontend%20work/frontend-intelligence/recipes/award-style-landing-page.md) |
| **Pass DOM scroll/pointer to GPU with 0 renders** | Non-reactive mutable store (`motionState`) | [knowledge/motion-state-bridge.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/motion-state-bridge.md) | [Interactive 3D Hero](file:///c:/Users/USER/frontend%20work/frontend-intelligence/recipes/interactive-3d-hero.md) |
| **Dynamic camera FOV on mobile & dolly zoom** | Aspect ratio FOV compensation, Vertigo effect | [knowledge/threejs-cameras-and-controls.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/threejs-cameras-and-controls.md) | [3D Product Showcase](file:///c:/Users/USER/frontend%20work/frontend-intelligence/recipes/3d-product-showcase.md) |
| **Photorealistic lighting & soft grounding shadows**| Environment HDR, `<ContactShadows>` | [knowledge/threejs-lighting-and-shadows.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/threejs-lighting-and-shadows.md) | [3D Product Showcase](file:///c:/Users/USER/frontend%20work/frontend-intelligence/recipes/3d-product-showcase.md) |
| **PBR frosted glass transmission & GLSL shaders** | `MeshTransmissionMaterial`, custom shaders | [knowledge/shaders.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/shaders.md) & [knowledge/threejs.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/threejs.md) | [Interactive 3D Hero](file:///c:/Users/USER/frontend%20work/frontend-intelligence/recipes/interactive-3d-hero.md) |
| **Synchronize 3D theme with Tailwind CSS** | Read CSS variables from JS as `THREE.Color` | [knowledge/css-theme-3d-bridge.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/css-theme-3d-bridge.md) | [Interactive 3D Hero](file:///c:/Users/USER/frontend%20work/frontend-intelligence/recipes/interactive-3d-hero.md) |
| **Compress Blender models (<1.5MB)** | `gltf-transform` Draco + WebP automation | [knowledge/3d-models.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/3d-models.md) & [knowledge/model-compression-pipeline.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/model-compression-pipeline.md) | [3D Product Showcase](file:///c:/Users/USER/frontend%20work/frontend-intelligence/recipes/3d-product-showcase.md) |
| **Render 10,000+ objects in 1 draw call** | `THREE.InstancedMesh`, GPU BufferGeometry | [knowledge/instanced-mesh-and-particles.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/instanced-mesh-and-particles.md) | [WebGL Background](file:///c:/Users/USER/frontend%20work/frontend-intelligence/recipes/webgl-background.md) |
| **Cinematic Selective Bloom & lens effects** | `@react-three/postprocessing`, HDR threshold | [knowledge/postprocessing-pipeline.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/postprocessing-pipeline.md) | [Interactive 3D Hero](file:///c:/Users/USER/frontend%20work/frontend-intelligence/recipes/interactive-3d-hero.md) |
| **Liquid image hover ripples & UV distortion** | Simplex noise fragment shader displacement | [knowledge/webgl-fluid-and-distortion.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/webgl-fluid-and-distortion.md) | [Interactive Portfolio](file:///c:/Users/USER/frontend%20work/frontend-intelligence/recipes/interactive-portfolio.md) |
| **Stripe-style fluid canvas mesh gradient** | Low-res 2D canvas + FBM simplex noise | [knowledge/mesh-gradient-fbm.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/mesh-gradient-fbm.md) | [WebGL Background](file:///c:/Users/USER/frontend%20work/frontend-intelligence/recipes/webgl-background.md) |
| **Self-drawing SVG paths & morphing shapes** | `stroke-dashoffset` timelines, morphing | [knowledge/svg-morph-and-path-drawing.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/svg-morph-and-path-drawing.md) | [Cinematic Hero](file:///c:/Users/USER/frontend%20work/frontend-intelligence/recipes/cinematic-hero.md) |
| **Zero-reconciler useFrame mutations** | Ref mutations, Drei `<Float>`, `<Center>`, `<Html>` | [knowledge/r3f.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/r3f.md) | [Interactive 3D Hero](file:///c:/Users/USER/frontend%20work/frontend-intelligence/recipes/interactive-3d-hero.md) |
| **Hardware tier profiling (`high`, `low`, `off`)** | `useSyncExternalStore` device detection | [knowledge/device-capability-tiering.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/device-capability-tiering.md) | [Award-Style Landing Page](file:///c:/Users/USER/frontend%20work/frontend-intelligence/recipes/award-style-landing-page.md) |
| **Mobile WebGL performance & battery fallbacks** | DPR clamping (`[1, 1.5]`), CSS poster fallback | [knowledge/responsive-design.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/responsive-design.md) & [knowledge/performance.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/performance.md) | [WebGL Background](file:///c:/Users/USER/frontend%20work/frontend-intelligence/recipes/webgl-background.md) |
| **Vestibular safety & reduced motion** | Universal CSS, React hook, GSAP interceptor | [knowledge/accessibility.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/accessibility.md) | [Universal Reduced Motion Guard](file:///c:/Users/USER/frontend%20work/frontend-intelligence/patterns/use-reduced-motion.md) |
| **Draw call & texture VRAM profiling** | VRAM formula, Next.js dynamic code splitting | [knowledge/performance.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/knowledge/performance.md) | [Award-Style Landing Page](file:///c:/Users/USER/frontend%20work/frontend-intelligence/recipes/award-style-landing-page.md) |
| **Progressive asset preloading state machine** | Three.js LoadingManager + font readiness lerp | [patterns/asset-preloader-manager.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/patterns/asset-preloader-manager.md) | [Smooth Scroll Website](file:///c:/Users/USER/frontend%20work/frontend-intelligence/recipes/smooth-scroll-website.md) |
| **Safe GSAP cleanup in React StrictMode** | `@gsap/react` `useGSAP()` container scoping | [patterns/scroll-trigger-cleanup-hook.md](file:///c:/Users/USER/frontend%20work/frontend-intelligence/patterns/scroll-trigger-cleanup-hook.md) | [GSAP Scroll Storytelling](file:///c:/Users/USER/frontend%20work/frontend-intelligence/recipes/gsap-scroll-storytelling.md) |

---

## 📁 Repository Directory Structure

```
frontend-intelligence/
├── README.md               # (This file) Rules, rapid discovery index, and directory map
├── RULES.md                # Standalone rules document
├── AGENT.md                # Operating guide & answers to benchmark architectural questions
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
│   ├── cards/              # README.md, tilt-card.md, spotlight-card.md, bento-card.md
│   ├── unified-raf-manager.md
│   ├── use-reduced-motion.md
│   ├── hybrid-canvas-layout.md
│   ├── asset-preloader-manager.md
│   ├── responsive-dpr-monitor.md
│   ├── magnetic-element-hook.md
│   └── scroll-trigger-cleanup-hook.md
│
└── recipes/                # 12 Production-ready end-to-end component recipes
```
