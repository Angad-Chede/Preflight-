# Hover & Micro-Interactions: 3D Tilt & Spotlight Borders

## 1. What the Technique Is
Hover micro-interactions enhance static UI cards with responsive physical depth. Key techniques include:
- **3D Card Tilt**: Calculating normalized mouse coordinates relative to the card's bounding box and rotating along the X and Y axes via CSS `perspective` and `transform: rotateX(...) rotateY(...)`.
- **Spotlight Border / Radial Glow**: Tracking mouse coordinates and exposing CSS custom variables (`--mouse-x`, `--mouse-y`) to render a smooth radial gradient flashlight effect along the borders and background of cards.

---

## 2. When to Use It
- Modern SaaS feature grids, bento boxes, pricing tables, and project cards.
- Interactive dashboard widgets and portfolio tiles.
- Premium UI elements seeking tactile depth without loading heavy 3D WebGL scenes.

---

## 3. When NOT to Use It
- Dense administrative tables or data grids with dozens of small cells.
- Mobile screens where mouse hover does not exist.
- Low-contrast environments where glow effects impede legibility.

---

## 4. Implementation Pattern
1. Attach `onMouseMove` to the parent container.
2. Calculate relative coordinates:
   - `x = e.clientX - rect.left`
   - `y = e.clientY - rect.top`
   - Normalized: `nx = (x / rect.width) * 2 - 1` (-1 to +1)
   - Normalized: `ny = (y / rect.height) * 2 - 1` (-1 to +1)
3. For 3D Tilt: Rotate X by `-ny * maxTilt` and Rotate Y by `nx * maxTilt`.
4. For Spotlight: Update CSS variables `--mouse-x: ${x}px` and `--mouse-y: ${y}px`.

---

## 5. React / Next.js Example

```tsx
'use client';

import { useRef, useState } from 'react';

interface SpotlightCardProps {
  children: React.ReactNode;
  maxTilt?: number;
}

export function SpotlightTiltCard({ children, maxTilt = 10 }: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transformStyle, setTransformStyle] = useState('');
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Spotlight gradient position update
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);

    // 3D Tilt calculation
    const normX = (x / rect.width) * 2 - 1;
    const normY = (y / rect.height) * 2 - 1;

    const rotateX = -normY * maxTilt;
    const rotateY = normX * maxTilt;

    setTransformStyle(`perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`);
  };

  const handleMouseEnter = () => setOpacity(1);

  const handleMouseLeave = () => {
    setOpacity(0);
    setTransformStyle('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: transformStyle,
        transition: transformStyle.includes('scale3d(1, 1, 1)') ? 'transform 0.5s ease-out' : 'none',
      }}
      className="group relative rounded-3xl border border-neutral-800 bg-neutral-900/60 p-8 backdrop-blur-md will-change-transform overflow-hidden"
    >
      {/* Spotlight Radial Background Glow */}
      <div
        className="pointer-events-none absolute -inset-px rounded-3xl transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(99, 102, 241, 0.15), transparent 40%)`,
        }}
      />

      {/* Spotlight Border Glow */}
      <div
        className="pointer-events-none absolute -inset-px rounded-3xl transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(350px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(129, 140, 248, 0.4), transparent 40%)`,
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
          padding: '1px',
        }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
}
```

---

## 6. Dependencies
- Zero external libraries required (pure CSS custom properties + React).

---

## 7. Performance Considerations
- **Set CSS Variables Directly on the DOM Node**: Notice `card.style.setProperty('--mouse-x', ...)` is called directly rather than updating React component state. Calling `setState` on every mouse pixel movement forces dozens of React reconciliations per second, whereas CSS variables update paint directly.
- **`will-change: transform`**: Informs the browser compositor to isolate the card into its own GPU texture layer.

---

## 8. Mobile Considerations
- Touch devices trigger `onMouseEnter` on initial tap, which can leave cards frozen at tilted angles until tapped elsewhere.
- Use `@media (hover: hover) and (pointer: fine)` media queries or disable tilt state when `window.matchMedia('(pointer: coarse)').matches`.

---

## 9. Accessibility Considerations
- Card content must retain high contrast regardless of spotlight glow position.
- Keyboard navigation (`focus-visible`) should reveal a dedicated focus ring outline independent of mouse hover state.
- Respect `prefers-reduced-motion` by disabling 3D rotation transforms.

---

## 10. Common Mistakes
1. **Storing mouse pixels in `useState`**: Storing `[mouseX, setMouseX] = useState(0)` causes the card and its entire child subtree to re-render 60 times a second.
2. **Missing `perspective`**: Rotating in 3D without `perspective(1000px)` in the transform string results in flat isometric shearing rather than genuine 3D perspective depth.
3. **Inverted X/Y rotation**: Tilting the card towards the top of the mouse requires *negative* rotation on the X-axis (`-normY`). Using positive values causes the card to tilt away from the mouse.

---

## 11. Related Patterns
- `bento-dashboard.md`
- `cursor-and-magnetic-interactions.md`
- `motion-primitives.md`

---

## 12. Source References
- [Motion Primitives Teardown](../sources/motion-primitives.md)
- [High-End Repository Teardown](../sources/high-end.md)
