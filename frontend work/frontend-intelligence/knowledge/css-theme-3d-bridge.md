# Technique: CSS Design System to WebGL Theme Bridge

## Technique Name
CSS Design System to WebGL Theme Bridge

## Purpose
Dynamically extracts CSS custom property variables (`--accent`, `--surface`, `--foreground`) from `:root` or Tailwind CSS v4 `@theme` and pipes them as reactive `THREE.Color` instances into WebGL materials and lights, ensuring 3D scenes adapt to brand color shifts and dark/light mode toggles.

## Difficulty
Intermediate

## Dependencies
- `three`: `^0.160.0`
- `@react-three/fiber`: `^8.0.0` or `^9.0.0`

## When to Use
- White-label boilerplates, client templates, and multi-tenant applications.
- Sites supporting dark/light mode switches where 3D lighting and emissive materials must match the theme.
- When brand tokens should be declared in one central place (`globals.css`).

## When NOT to Use
- Photorealistic physically-based architectural renderings where real-world material constants (gold, copper, glass) must not change with UI themes.

## Implementation Strategy
1. Create a helper utility that inspects `getComputedStyle(document.documentElement)`.
2. Clean CSS values (handling hex, rgb, or hsl).
3. Provide a hook or subscription that notifies Three.js materials when theme attributes (`data-theme="light|dark"`) change via MutationObserver.

## Example Code Pattern
```ts
// lib/theme-colors.ts
import * as THREE from 'three';

export function getThemeColor(varName: string, fallback = '#ffffff'): THREE.Color {
  if (typeof window === 'undefined') return new THREE.Color(fallback);

  const style = getComputedStyle(document.documentElement);
  const rawValue = style.getPropertyValue(varName).trim();

  if (!rawValue) return new THREE.Color(fallback);

  // Return Three.js Color object
  return new THREE.Color(rawValue);
}
```

```tsx
// components/canvas/ThemedOrb.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { getThemeColor } from '@/lib/theme-colors';
import * as THREE from 'three';

export function ThemedOrb() {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null!);
  const [accentColor, setAccentColor] = useState(() => getThemeColor('--accent', '#6366f1'));

  useEffect(() => {
    // Listen for theme attribute mutations on <html>
    const observer = new MutationObserver(() => {
      setAccentColor(getThemeColor('--accent', '#6366f1'));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  useFrame(() => {
    // Smoothly lerp material color towards the active theme color
    if (materialRef.current) {
      materialRef.current.color.lerp(accentColor, 0.08);
    }
  });

  return (
    <mesh>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial ref={materialRef} metalness={0.8} roughness={0.2} />
    </mesh>
  );
}
```

## Performance Cost
- Negligible: `getComputedStyle` is called only on theme change events, never inside the per-frame render loop.

## Mobile Behavior
- Identical across desktop and mobile.

## Accessibility Concerns
- Guarantees 3D objects maintain sufficient contrast against the active UI background in both dark and light modes.

## Source Repository
- [`giuucmp/aether-boilerplate`](file:///c:/Users/USER/frontend%20work/frontend-intelligence/sources/aether-boilerplate.md)
