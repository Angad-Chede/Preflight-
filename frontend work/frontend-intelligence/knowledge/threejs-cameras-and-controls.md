# Three.js Cameras & Cinematic Camera Controls

## 1. What the Technique Is
Camera architecture governs how 3D scenes are projected onto the 2D viewport. Key techniques include:
- **Perspective vs. Orthographic Projections**: Perspective mimics human eyesight with natural vanishing points; Orthographic projects parallel lines without depth foreshortening (ideal for architectural layouts, isometric grids, and technical diagrams).
- **Dynamic FOV Compensation**: Adjusting Field of View (FOV) or camera distance dynamically based on screen aspect ratio so 3D objects don't appear cropped on narrow mobile screens.
- **Cinematic Dolly Zoom (Vertigo Effect)**: Simultaneously moving the camera forward while expanding FOV (or vice-versa), keeping the central subject the exact same size while warping the background perspective.

---

## 2. When to Use It
- Product configurators where the product must remain fully in frame across both ultrawide desktop and tall mobile screens.
- Scroll-driven storytelling with smooth camera pans between focus stages.
- Isometric dashboards or architectural bento grid visualizers.

---

## 3. When NOT to Use It
- Purely flat 2D backgrounds where camera calculations introduce unnecessary complexity.
- User-interactive scenes where unconstrained free camera rotation allows users to get lost inside or under the model.

---

## 4. Implementation Pattern
1. **Responsive FOV Formula**: When screen width shrinks below a certain aspect ratio, increase camera Z distance or calculate FOV dynamically:
   `const fov = 2 * Math.atan(Math.tan((initialFov * Math.PI) / 360) / aspect) * (180 / Math.PI);`
2. **Camera Controls Constraints**: When using `OrbitControls` or `CameraControls`, strictly configure:
   - `minDistance` and `maxDistance` (prevents clipping through models or flying into void).
   - `maxPolarAngle = Math.PI / 2` (prevents camera dipping below ground floor).
   - `enableDamping = true` (delivers smooth inertia rather than mechanical snaps).

---

## 5. React / Next.js Example (with R3F and Drei)

```tsx
'use client';

import { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

function ResponsiveCameraController() {
  const { camera, size } = useThree();

  useEffect(() => {
    const aspect = size.width / size.height;
    // Base FOV tuned for widescreen 16:9
    const baseFov = 45;

    if (aspect < 1) {
      // Portrait / Mobile: widen FOV so 3D model doesn't get cropped
      (camera as THREE.PerspectiveCamera).fov = baseFov + (1 - aspect) * 25;
    } else {
      (camera as THREE.PerspectiveCamera).fov = baseFov;
    }
    camera.updateProjectionMatrix();
  }, [camera, size]);

  return null;
}

// Cinematic Dolly Zoom Hook / Component
function DollyZoomSubject() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const { camera } = useThree();

  useFrame((state) => {
    // Oscillate camera distance
    const time = state.clock.elapsedTime * 0.5;
    const distance = 4 + Math.sin(time) * 2; // oscillates between 2 and 6
    const pCamera = camera as THREE.PerspectiveCamera;

    pCamera.position.z = distance;

    // Fixed subject target height in view
    const visibleHeightAtTarget = 2.0; 
    // Vertigo equation: calculate FOV such that subject height stays constant
    const fovInRad = 2 * Math.atan(visibleHeightAtTarget / (2 * distance));
    pCamera.fov = (fovInRad * 180) / Math.PI;
    pCamera.updateProjectionMatrix();
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#6366f1" roughness={0.2} metalness={0.8} />
    </mesh>
  );
}

export function CinematicCameraViewer() {
  return (
    <div className="relative h-[550px] w-full rounded-2xl overflow-hidden bg-neutral-950">
      <Canvas dpr={[1, 1.5]}>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        <ResponsiveCameraController />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} />

        <DollyZoomSubject />

        <OrbitControls
          enablePan={false}
          enableZoom={false}
          maxPolarAngle={Math.PI / 2 + 0.1}
          minPolarAngle={Math.PI / 4}
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
}
```

---

## 6. Dependencies
- `@react-three/fiber`: `^8.15.0`
- `@react-three/drei`: `^9.90.0`
- `three`: `^0.160.0`

---

## 7. Performance Considerations
- **`updateProjectionMatrix()`**: Only call when camera properties (FOV, aspect, near, far) change. Calling it redundantly every frame when values haven't shifted incurs minor matrix recalculation costs.
- **Frustum Near/Far Planes**: Keep `near` as large as possible (e.g. `0.1` or `1`) and `far` as small as possible (e.g. `100` or `1000`). Setting `near: 0.00001` crushes depth buffer precision, causing severe Z-fighting (textures flickering over each other).

---

## 8. Mobile Considerations
- Orbit controls on mobile touchscreens can intercept vertical page scrolling, trapping the user. Always configure `OrbitControls` with touch action attributes or disable vertical gesture hijacking:
  `className="touch-none"` or use `domElement` container targeting.

---

## 9. Accessibility Considerations
- Users with vestibular disorders can experience nausea from continuous autonomous camera rotations. Allow users to pause rotation via a visible toggle and honor `prefers-reduced-motion`.

---

## 10. Common Mistakes
1. **Unconstrained Orbit Controls**: Allowing the camera to zoom infinitely far or rotate underground, displaying unfinished back-faces or black void.
2. **Ignoring Mobile Aspect Ratio**: Framing a 3D model perfectly on a 1920x1080 desktop monitor, only for mobile users at 390x844 to have 50% of the model cropped off the edges.
3. **Z-Fighting due to extreme near/far**: Setting `near: 0.001` and `far: 100000` causing shimmering artifacts across adjacent surfaces.

---

## 11. Related Patterns
- `threejs-scene-architecture.md`
- `3d-product-showcase.md`
- `interactive-3d-hero.md`

---

## 12. Source References
- [ThreeJS Motion Teardown](../sources/threejs-motion.md)
- [Official Docs Synthesis: Three.js](../sources/official-docs-synthesis.md)
