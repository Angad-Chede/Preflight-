# Patterns: Interactive Cards Architecture

## Overview
Interactive cards are fundamental primitives for modern product interfaces, feature showcases, bento dashboards, and portfolio galleries. This pattern suite extracts the three core high-end card techniques:

1. [**3D Tilt Card (`tilt-card.md`)**](file:///c:/Users/USER/frontend%20work/frontend-intelligence/patterns/cards/tilt-card.md) — Perspective rotation tracking pointer coordinates with damping.
2. [**Spotlight Card (`spotlight-card.md`)**](file:///c:/Users/USER/frontend%20work/frontend-intelligence/patterns/cards/spotlight-card.md) — Cursor-following radial gradient borders and backgrounds via CSS custom properties.
3. [**Bento Card (`bento-card.md`)**](file:///c:/Users/USER/frontend%20work/frontend-intelligence/patterns/cards/bento-card.md) — Asymmetric grid tile combining spotlight borders with telemetry visualizations.

---

## Shared Architecture Principles
- **No `setState` on Mouse Move**: Mouse coordinates are written directly to CSS custom properties (`--mouse-x`, `--mouse-y`) on DOM elements, bypassing React component reconciliation.
- **Hardware Acceleration**: Card rotation utilizes `perspective(1000px) rotateX(...) rotateY(...)` on GPU compositor layers.
- **Touchscreen Bypass**: Inactive when `(pointer: coarse)` is detected, preventing sticky hover states on smartphones.
