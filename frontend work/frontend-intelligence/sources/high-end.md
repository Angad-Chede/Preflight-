# High-End — Deep Source Extraction

## 1. README Inspection
- **Tagline**: Motion & WebGL Landing Page Architecture.
- **Positioning**: Production-ready foundation for an immersive, scroll-driven landing page: Next.js App Router, Lenis smooth scroll synchronised with GSAP ScrollTrigger, and a React Three Fiber hero with real mobile fallbacks.
- **Priority**: A **strict 60fps frame budget**. Most architectural decisions exist to keep per-frame work out of React's render path.
- **The Core Architecture Decisions**:
  1. Lenis and GSAP share one master clock (`autoRaf: false`, `lagSmoothing: 0`).
  2. Non-reactive per-frame store (`lib/motion-state.ts`) bridging DOM scroll/pointer directly to GPU without React renders.
  3. Capability profile via `useSyncExternalStore` (`DeviceProvider.tsx`).
  4. Capability gate + dynamic import boundary (`HeroCanvasSlot.tsx`).
  5. Typed ShaderMaterial subclasses with shared simplex noise source.

---

## 2. package.json Inspection
```json
{
  "name": "high-end",
  "version": "0.1.0",
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "tailwindcss": "^3.4.4",
    "lenis": "^1.1.14",
    "gsap": "^3.12.5",
    "@gsap/react": "^2.1.1",
    "three": "^0.166.0",
    "@react-three/fiber": "^8.16.8",
    "@react-three/drei": "^9.105.0"
  }
}
```

---

## 3. Source Structure Inspection
```
src/
├── app/
│   ├── layout.tsx              # fonts, metadata, single client boundary
│   ├── page.tsx                # section composition (server component)
│   └── globals.css             # base tokens, mix-blend modes
├── providers/
│   ├── AppProviders.tsx        # composes providers
│   ├── DeviceProvider.tsx      # capability profile via useSyncExternalStore
│   ├── PreloaderProvider.tsx   # coarse load phase (loading → reveal → ready)
│   └── SmoothScrollProvider.tsx # Lenis ⇄ GSAP ticker ⇄ ScrollTrigger sync
├── components/
│   ├── canvas/
│   │   ├── HeroCanvasSlot.tsx  # dynamic import boundary + capability gate
│   │   ├── CanvasFallback.tsx  # zero-JS CSS fallback
│   │   ├── hero/               # HeroExperience, HeroCoffeeBean, CameraRig, SceneLoadReporter
│   │   └── materials/          # CoffeeBeanMaterial.ts (typed ShaderMaterial), glsl/noise.ts
│   ├── sections/               # Hero, ManifestoSection (word scrub), StorySection (pinned scrub), ClosingSection (velocity marquee)
│   ├── motion/                 # RevealText (masked SplitText reveal)
│   └── ui/                     # Preloader, SiteHeader (mix-blend-difference)
├── hooks/
│   ├── useIsVisible.ts         # IntersectionObserver + tab visibility
│   ├── usePointerTracking.ts   # single global pointer listener
│   └── useIsomorphicLayoutEffect.ts
└── lib/
    ├── gsap.ts                 # plugin registration + named eases
    ├── motion-state.ts         # non-reactive per-frame store (DOM → GPU)
    ├── asset-loader.ts         # LoadingManager registry
    ├── device.ts / device-store.ts # capability detection + external store
    └── math.ts                 # lerp, clamp, frame-rate independent damp
```

---

## 4. Major Technologies
- **Next.js App Router**: Server component page composition with targeted client provider boundaries.
- **Lenis 1.x**: Explicit `autoRaf: false` smooth scrolling.
- **GSAP 3 & ScrollTrigger & SplitText**: Scrubbed narrative and horizontal timelines.
- **React Three Fiber & Drei**: Procedural tumbling 3D hero asset.
- **Custom Typed GLSL Shaders**: Subclassed `ShaderMaterial` with Simplex noise.

---

## 5. Reusable Patterns
1. **The Non-Reactive Motion Bridge (`lib/motion-state.ts`)**: A mutable singleton object updated on every pointer and scroll event, read directly by `useFrame` in Three.js without ever touching React state or context.
2. **Capability Profiling via `useSyncExternalStore` (`lib/device-store.ts`)**: Eliminates hydration mismatches when detecting client GPU capabilities and device memory tiers.
3. **The Velocity-Reactive Marquee**: Marquee translation velocity scales proportionally with user scroll speed using GSAP ScrollTrigger velocity proxy.

---

## 6. Animation Techniques
- **Scrubbed Word-by-Word Manifesto Reveal**: GSAP timeline scrubbing opacity and color transitions word-by-word across scroll depth.
- **Pinned Horizontal Story Scrub**: Pinned 100vw section scrolling horizontally across multiple chapters.
- **Velocity-Boosted Marquee**: Marquee speed accelerates when user scrolls fast and decelerates to base speed at rest.

---

## 7. 3D / WebGL Techniques
- **Procedural 3D Mesh with Custom Shader Material**: Generating complex tactile surfaces via vertex noise displacement without heavy GLTF model downloads.
- **CameraRig with Pointer & Scroll Coupling**: Camera position and lookAt target interpolated via exponential damping in `useFrame`.

---

## 8. Performance Techniques
- **`useSyncExternalStore` over `useEffect` state**: Prevents cascading re-renders during device profiling.
- **Zero React per-frame overhead**: Strict ref mutation and mutable motion store.
- **Tab Visibility Throttling (`useIsVisible`)**: Freezes WebGL render loop when user switches browser tabs (`document.visibilityState === 'hidden'`).

---

## 9. Responsive / Mobile Techniques
- **Zero-JS CSS Canvas Fallback**: When low-tier mobile hardware is detected by `DeviceProvider`, the WebGL dynamic import is bypassed completely, rendering an animated CSS graphic.

---

## 10. Accessibility Techniques
- Fixed navigation with `mix-blend-mode: difference` ensures automatic contrast against both light and dark backgrounds.
- Screen-reader safe word splits with intact original text containers.

---

## 11. Dependencies
- `lenis`, `gsap`, `@gsap/react`, `three`, `@react-three/fiber`, `@react-three/drei`.

---

## 12. Implementation Tradeoffs
- **Custom Shader vs GLTF Model**: Procedural shaders load in <5KB and look razor sharp, but require mathematics and GLSL programming rather than visual modeling in Blender.
