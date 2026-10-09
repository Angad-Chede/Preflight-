# Custom Cursor & Magnetic Interactions

## 1. What the Technique Is
Custom cursor and magnetic interactions replace or supplement the standard OS pointer with a hardware-accelerated visual follower. Magnetic elements detect pointer proximity within a bounding radius and pull their visual position toward the cursor using spring physics or linear interpolation (lerp).

---

## 2. When to Use It
- Creative agency portfolios, luxury fashion showcases, and experimental design studios.
- Interactive galleries where the cursor displays contextual cues ("DRAG", "VIEW", "EXPLORE", "CLOSE").
- Primary call-to-action (CTA) buttons that demand tactile, magnetic gravity.

---

## 3. When NOT to Use It
- Enterprise SaaS platforms, data-heavy dashboards, forms, spreadsheets, or utility tools.
- Touchscreen devices (smartphones, tablets) where mouse coordinates do not exist.
- Websites targeted at users with severe motor impairments or low vision (unless seamlessly disabled via user preference).

---

## 4. Implementation Pattern
1. **Device Detection**: Check `window.matchMedia('(pointer: fine)').matches`. If the user has a coarse pointer (finger/touch), do not render the custom cursor.
2. **Decoupled Position Lerping**: Update raw mouse coordinates in a lightweight `pointermove` listener. Interpolate the visual cursor's position inside a continuous RAF loop using `current += (target - current) * factor`.
3. **Magnetic Pull**: Calculate element center `(cx, cy)`. When the cursor enters the element's bounding box, offset the element's position by `(cursorX - cx) * strength` (typically `strength: 0.3 - 0.5`). On pointer leave, snap back with a high-stiffness spring.
4. **Mix-Blend-Mode**: Use `mix-blend-mode: difference` with `bg-white` over dark and light backgrounds to maintain automatic contrast inversion.

---

## 5. React / Next.js Example

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [cursorText, setCursorText] = useState('');
  const [cursorVariant, setCursorVariant] = useState<'default' | 'hover' | 'text'>('default');

  useEffect(() => {
    // Only enable on precise pointing devices
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const cursor = cursorRef.current;
    if (!cursor) return;

    const mouse = { x: -100, y: -100 };
    const pos = { x: -100, y: -100 };
    const speed = 0.18; // Lerp factor

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;

      // Detect cursor triggers from hovered elements
      const target = (e.target as HTMLElement).closest('[data-cursor]');
      if (target) {
        const type = target.getAttribute('data-cursor');
        const text = target.getAttribute('data-cursor-text') || '';
        setCursorVariant(type as any);
        setCursorText(text);
      } else {
        setCursorVariant('default');
        setCursorText('');
      }
    };

    window.addEventListener('pointermove', onMouseMove);

    const ticker = gsap.ticker.add(() => {
      pos.x += (mouse.x - pos.x) * speed;
      pos.y += (mouse.y - pos.y) * speed;

      gsap.set(cursor, {
        x: pos.x,
        y: pos.y,
      });
    });

    return () => {
      window.removeEventListener('pointermove', onMouseMove);
      gsap.ticker.remove(ticker);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className={`pointer-events-none fixed top-0 left-0 z-50 flex items-center justify-center rounded-full -translate-x-1/2 -translate-y-1/2 transition-transform duration-200 ease-out will-change-transform ${
        cursorVariant === 'hover'
          ? 'h-16 w-16 bg-white mix-blend-difference'
          : cursorVariant === 'text'
          ? 'h-20 w-20 bg-indigo-600 text-white font-mono text-xs tracking-wider'
          : 'h-4 w-4 bg-white mix-blend-difference'
      }`}
    >
      {cursorText && <span>{cursorText}</span>}
    </div>
  );
}

// Reusable Magnetic Button Component
export function MagneticButton({ children }: { children: React.ReactNode }) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = buttonRef.current;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const distanceX = (e.clientX - centerX) * 0.35;
    const distanceY = (e.clientY - centerY) * 0.35;

    gsap.to(btn, {
      x: distanceX,
      y: distanceY,
      duration: 0.3,
      ease: 'power2.out',
    });
  };

  const handleMouseLeave = () => {
    gsap.to(buttonRef.current, {
      x: 0,
      y: 0,
      duration: 0.7,
      ease: 'elastic.out(1, 0.4)',
    });
  };

  return (
    <button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      data-cursor="hover"
      className="relative rounded-full border border-neutral-700 bg-neutral-900 px-8 py-4 text-sm font-medium text-white transition-colors hover:border-neutral-500 will-change-transform"
    >
      {children}
    </button>
  );
}
```

---

## 6. Dependencies
- `gsap`: `^3.12.0`

---

## 7. Performance Considerations
- **`pointer-events: none` (Critical)**: If the custom cursor does not have `pointer-events: none`, it hovers directly under the user's mouse and blocks all clicks to the underlying DOM elements!
- **CSS `translate` vs `gsap.set`**: Mutate `transform: translate3d(...)` via GPU rather than changing `top` or `left` properties which trigger layout recalculations.

---

## 8. Mobile Considerations
- **Touch Detection**: Do not mount or render the custom cursor DOM node if `window.matchMedia('(pointer: coarse)').matches` or `!window.matchMedia('(pointer: fine)').matches`.
- Remove magnetic hover offsets on touch interfaces to prevent buttons from remaining displaced after a tap.

---

## 9. Accessibility Considerations
- Never hide the native system cursor (`cursor: none`) without ensuring the custom cursor is 100% stable, responsive, and visible against both light and dark backgrounds.
- If the user prefers reduced motion, disable the lag/lerp so the custom cursor tracks at 1:1 speed or fallback to the native OS pointer.

---

## 10. Common Mistakes
1. **Trapping mouse events**: Forgetting `pointer-events: none` on the cursor container, which breaks every button and link on the page.
2. **Failing to cancel RAF**: Not removing ticker callbacks on unmount, consuming CPU cycles indefinitely in the background.
3. **Hard snapping on leave**: Using `duration: 0` on mouse leave instead of an elastic or smooth ease, which causes the magnetic button to jerk abruptly back to origin.

---

## 11. Related Patterns
- `magnetic-element-hook.md`
- `magnetic-cursor.md`
- `hover-and-micro-interactions.md`

---

## 12. Source References
- [High-End Repository Teardown](../sources/high-end.md)
- [AETHER Boilerplate Teardown](../sources/aether-boilerplate.md)
