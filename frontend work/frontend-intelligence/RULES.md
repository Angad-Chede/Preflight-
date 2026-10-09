# Frontend Intelligence Rules

Before implementing a visually complex website, inspect `frontend-intelligence/README.md`.

Use the knowledge base selectively.

---

## Task-Based Reading Guide

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

## Technology Selection Principles

Do not automatically use every technology.

Choose the simplest technology that produces the desired result:
- **CSS**: Use when CSS is sufficient.
- **Motion (Framer Motion)**: Use for simple UI animation, component mounting/unmounting, and micro-gestures.
- **GSAP**: Use when complex timelines, sequencing, scroll choreography, or advanced motion control is required.
- **Lenis**: Use when smooth scrolling materially improves the experience.
- **Three.js / R3F**: Use only when 3D/WebGL materially improves the experience.
- **Shaders**: Use only when the visual effect genuinely requires GPU rendering.

Avoid unnecessary animation.
Avoid animation that harms readability, usability, accessibility, or performance.

---

## Design Principles

Prioritize in order:
1. **Typography**
2. **Layout**
3. **Spacing**
4. **Visual hierarchy**
5. **Interaction design**
6. **Motion**
7. **3D / WebGL**

**Do not use effects to compensate for poor design.**

---

## Performance Standards

Every heavy visual feature must consider:
- Lazy loading
- Dynamic imports
- GPU cost
- Mobile fallback
- Asset size
- Texture size
- Model size
- Frame rate (60 FPS budget)
- Reduced motion
- Memory usage

**Never add a large 3D scene to the initial bundle without considering loading strategy.**

---

## Code Quality Standards

Prefer:
- Reusable components
- Clear separation of concerns
- TypeScript
- Composable animation utilities
- Centralized animation configuration
- Responsive behavior
- Accessible interactions

Do not copy entire implementations from reference repositories unless their license permits it and copying is genuinely appropriate.

Use reference repositories as engineering references rather than design templates.
