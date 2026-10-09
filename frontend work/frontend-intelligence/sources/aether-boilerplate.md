# AETHER Boilerplate — Deep Source Extraction

## 1. README Inspection
- **Tagline**: Award-style Website Boilerplate — reusable starting point for cinematic, "Awwwards-style" client websites.
- **Positioning**: Complete, working demo site (not an empty skeleton) in Next.js 16 + real-time 3D + GSAP scroll animations.
- **Design Language**: Minimal dark editorial: `#0a0a0b`, warm ivory text, hot accent (`#ff4d00`), oversized Fraunces display serif italics, hairline borders, film-grain overlay, pill buttons with uppercase tracking.
- **Core Scripts**:
  - `scripts/new-project.mjs`: Automated re-branding of tokens, package.json, and metadata.
  - `scripts/optimize-model.mjs`: Automated Draco + WebP compression for Blender `.glb` exports.
  - `scripts/generate-covers.mjs`: Procedural SVG artwork generation for case studies.

---

## 2. package.json Inspection
```json
{
  "name": "aether-boilerplate",
  "version": "0.1.0",
  "dependencies": {
    "next": "16.x",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwindcss": "^4.0.0",
    "@gsap/react": "^2.1.2",
    "gsap": "^3.12.5",
    "lenis": "^1.1.14",
    "three": "^0.170.0",
    "@react-three/fiber": "^9.0.0",
    "@react-three/drei": "^10.0.0",
    "framer-motion": "^12.0.0",
    "zustand": "^5.0.0",
    "react-hook-form": "^7.54.0",
    "zod": "^3.24.0"
  }
}
```

---

## 3. Source Structure Inspection
```
aether-boilerplate/
├── app/
│   ├── (marketing)/       # page.tsx, work/page.tsx, about/page.tsx, contact/page.tsx
│   ├── design-system/     # isolated UI component showroom
│   ├── layout.tsx         # fonts, metadata, global chrome
│   └── template.tsx       # per-route enter animation
├── components/
│   ├── ui/                # button, input, textarea, label, badge, dialog (Radix primitives)
│   ├── motion/            # Reveal, SplitTextReveal, ParallaxLayer, Marquee, Magnetic, SmoothScroll
│   ├── three/             # CanvasWrapper, ParticleField, AuroraBlob, HeroScene, ModelViewer, StaticPoster
│   └── layout/            # Preloader, CustomCursor, Navbar, MenuOverlay, Footer, GrainOverlay
├── lib/
│   ├── gsap.ts            # centralized plugin registration & custom easings
│   ├── store.ts           # zustand state (preloader, menu)
│   ├── device.ts          # capability tiers (high / low / off) for 3D
│   ├── theme-colors.ts    # extracts CSS variables from :root so 3D meshes match Tailwind theme
│   └── hooks/             # useLenis, useReducedMotion, useWindowSize
└── scripts/
    ├── optimize-model.mjs # gltf-transform automation for Blender exports
    └── new-project.mjs
```

---

## 4. Major Technologies
- **Next.js 16 (App Router + Turbopack)**: Strict TypeScript.
- **Tailwind CSS v4**: CSS-first `@theme` with inline CSS variables.
- **React Three Fiber 9 & Three.js r170**: Lazy-loaded 3D canvas pipeline.
- **GSAP 3 & ScrollTrigger & SplitText**: Centralized animation engine.
- **Lenis 1.x**: Smooth scroll engine synced with ScrollTrigger.
- **Framer Motion 12**: Menu overlay wipes and route template reveals.
- **Zustand 5**: Global application state.

---

## 5. Reusable Patterns
1. **The CSS Theme-to-3D Bridge (`lib/theme-colors.ts`)**: JavaScript utility reading `getComputedStyle(document.documentElement).getPropertyValue('--accent')` and passing it as a `THREE.Color`, ensuring 3D lighting dynamically inherits the Tailwind design system.
2. **Quality Tier State Machine (`lib/device.ts`)**: Classifying hardware into `high`, `low`, and `off` tiers to selectively mount WebGL or fall back to static image posters.
3. **Automated Asset Optimizer Script (`scripts/optimize-model.mjs`)**: CLI pipeline running `gltf-transform` weld, dedup, draco, and texture compression on raw 3D assets before commit.

---

## 6. Animation Techniques
- **SplitText Entrance Reveals**: Splitting headlines into words/lines, applying `overflow: hidden` line wrappers, and tweening `yPercent: 120` to `0` with custom power eases.
- **Lenis-Driven Scroll Velocity Parallax**: Multiplying layer scroll offsets by velocity multipliers.

---

## 7. 3D / WebGL Techniques
- **`HeroScene` with Lazy Loading**: R3F Canvas isolated in dynamic import, rendering procedural `AuroraBlob` (custom noise shader) and `ParticleField`.
- **`StaticPoster` Fallback**: Zero-JS CSS poster rendered for low-tier devices or during preloader execution.

---

## 8. Performance Techniques
- 3D bundle is code-split and **never included in the initial page bundle**.
- `gsap.ticker.lagSmoothing(0)` prevents scroll desync.
- Strict DPR clamping to 1.5.

---

## 9. Responsive / Mobile Techniques
- `lib/device.ts` hardware concurrency check: Automatically demotes mobile devices to `low` or `off` tiers.
- Mobile navigation switches to a full-screen drawer animated via Framer Motion 12.

---

## 10. Accessibility Techniques
- Complete `useReducedMotion` hook bypassing SplitText and parallax effects.
- Semantic HTML headers with full ARIA labelling for interactive 3D viewer buttons.

---

## 11. Dependencies
- `@gsap/react`, `gsap`, `lenis`, `three`, `@react-three/fiber`, `@react-three/drei`, `framer-motion`, `zustand`, `tailwindcss`.

---

## 12. Implementation Tradeoffs
- **Hybrid GSAP + Framer Motion**: Combines the best of both worlds (GSAP for scroll/3D, Motion for UI menus), adding ~60KB gzipped to bundle size. Well justified for high-end flagship sites.
