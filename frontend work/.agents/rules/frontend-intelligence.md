# Frontend Intelligence Rules

Before implementing a visually complex website, inspect `frontend-intelligence/README.md`.

Use the knowledge base selectively.

## Task-Based Reading Guide

### If the task involves animation
Read:
- frontend-intelligence/knowledge/animations.md
- frontend-intelligence/knowledge/gsap.md
- frontend-intelligence/knowledge/scroll.md

### If the task involves smooth scrolling
Read:
- frontend-intelligence/knowledge/lenis.md
- frontend-intelligence/knowledge/scroll.md

### If the task involves 3D
Read:
- frontend-intelligence/knowledge/threejs.md
- frontend-intelligence/knowledge/r3f.md
- frontend-intelligence/knowledge/3d-models.md

### If the task involves shaders
Read:
- frontend-intelligence/knowledge/shaders.md
- frontend-intelligence/knowledge/threejs.md

### If the task involves page transitions
Read:
- frontend-intelligence/knowledge/transitions.md
- frontend-intelligence/knowledge/gsap.md

### If the task involves interactive cards
Read:
- frontend-intelligence/patterns/cards/
- frontend-intelligence/knowledge/interactions.md

### If the task involves a cinematic landing page
Read:
- frontend-intelligence/recipes/cinematic-hero.md
- frontend-intelligence/recipes/award-style-landing-page.md
- frontend-intelligence/knowledge/animations.md
- frontend-intelligence/knowledge/scroll.md
- frontend-intelligence/knowledge/typography.md

### If the task involves a 3D product
Read:
- frontend-intelligence/recipes/3d-product-showcase.md
- frontend-intelligence/knowledge/threejs.md
- frontend-intelligence/knowledge/r3f.md
- frontend-intelligence/knowledge/3d-models.md
- frontend-intelligence/knowledge/performance.md

### If the task involves mobile
Always read:
- frontend-intelligence/knowledge/responsive-design.md
- frontend-intelligence/knowledge/performance.md
- frontend-intelligence/knowledge/accessibility.md

## Technology Selection
Do not automatically use every technology.
Choose the simplest technology that produces the desired result.
- Use CSS when CSS is sufficient.
- Use Motion for simple UI animation.
- Use GSAP when complex timelines, sequencing, scroll choreography, or advanced motion control is required.
- Use Lenis when smooth scrolling materially improves the experience.
- Use Three.js/R3F only when 3D/WebGL materially improves the experience.
- Use shaders only when the visual effect genuinely requires GPU rendering.
- Avoid unnecessary animation.
- Avoid animation that harms readability, usability, accessibility, or performance.

## Design Principles
Prioritize:
1. Typography
2. Layout
3. Spacing
4. Visual hierarchy
5. Interaction design
6. Motion
7. 3D/WebGL

Do not use effects to compensate for poor design.

## Performance
Every heavy visual feature must consider:
- lazy loading
- dynamic imports
- GPU cost
- mobile fallback
- asset size
- texture size
- model size
- frame rate
- reduced motion
- memory usage

Never add a large 3D scene to the initial bundle without considering loading strategy.

## Code Quality
Prefer:
- reusable components
- clear separation of concerns
- TypeScript
- composable animation utilities
- centralized animation configuration
- responsive behavior
- accessible interactions

Do not copy entire implementations from reference repositories unless their license permits it and copying is genuinely appropriate.
Use the repositories as engineering references rather than design templates.
