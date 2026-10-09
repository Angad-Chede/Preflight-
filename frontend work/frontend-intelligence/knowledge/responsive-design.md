# Technique: Responsive WebGL & Adaptive Device Tiering

## Technique Name
Responsive WebGL & Adaptive Device Tiering

## Purpose
Ensures that visually intensive, 3D-driven websites adapt fluidly across screen geometries (ultrawide monitors, tablets, vertical smartphones) and gracefully downgrade graphical fidelity on lower-tier hardware without breaking layout or interactivity.

## Difficulty
Advanced

## Dependencies
- `react`: `^18.0.0` or `^19.0.0`
- `@react-three/fiber`: `^8.0.0` or `^9.0.0`

## When to Use
- Every production WebGL project intended for general public audiences.
- Projects needing dynamic camera framing that keeps 3D models centered regardless of screen aspect ratio.

## When NOT to Use
- Standard static websites lacking WebGL or complex graphics.

## Implementation Strategy
1. **Dynamic Camera FOV Compensation**:
   - Widescreen 16:9 displays have a wide aspect ratio (>1).
   - Vertical mobile displays have a narrow aspect ratio (<1).
   - Invert FOV or increase camera Z-distance dynamically when aspect < 1 to prevent 3D subjects from getting cropped off screen edges:
     `camera.fov = baseFov + Math.max(0, (1 - aspect) * 25);`
2. **The 3-Tier Hardware Degradation Model**:
   - **Tier 1 (High)**: Full 3D scene + postprocessing Bloom/Noise + DPR 1.5.
   - **Tier 2 (Low)**: Simplified WebGL + postprocessing disabled + DPR 1.0.
   - **Tier 3 (Off)**: Zero-JS CSS animated artwork or WebP video poster.
3. **Touch vs Pointer Handling**:
   - Replace continuous cursor parallax on touchscreens with gentle autonomous oscillation or discrete tap gestures.

## Example Code Pattern
```tsx
'use client';

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

export function ResponsiveCameraRig({ baseFov = 45 }: { baseFov?: number }) {
  const { camera, size } = useThree();

  useEffect(() => {
    const aspect = size.width / size.height;
    const pCamera = camera as THREE.PerspectiveCamera;

    if (aspect < 1) {
      // Narrow portrait screen: widen FOV to preserve framing
      pCamera.fov = baseFov + (1 - aspect) * 22;
    } else {
      pCamera.fov = baseFov;
    }

    pCamera.updateProjectionMatrix();
  }, [camera, size, baseFov]);

  return null;
}
```

## Performance Cost
- Updating camera projection matrix is fast and only occurs during window resize events.
- Device tiering saves 100% of WebGL GPU memory on budget mobile devices.

## Mobile Behavior
- Guarantees 3D objects never get cropped off the sides of narrow smartphone displays.
- Touchscreens effortlessly display the appropriate visual fidelity tier.

## Accessibility Concerns
- Always pair 3D canvases with semantic HTML headings and descriptions so content is accessible on any device.

## Source Repository
- [`MuhammedAlii/high-end`](file:///c:/Users/USER/frontend%20work/frontend-intelligence/sources/high-end.md)
- [`giuucmp/aether-boilerplate`](file:///c:/Users/USER/frontend%20work/frontend-intelligence/sources/aether-boilerplate.md)
