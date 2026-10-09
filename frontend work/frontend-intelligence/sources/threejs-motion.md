# ThreeJS Motion — Deep Source Extraction

## 1. README Inspection
- **Tagline**: Scroll-Driven 3D Transformations & Timeline Orchestration.
- **Positioning**: Bridge between GreenSock Animation Platform (GSAP 3 / ScrollTrigger) and Three.js 3D properties, choreographing object transforms, camera paths, and custom shader uniforms across document scroll depth.
- **Key Challenges Solved**: Eliminating spaghetti code in `tick()` loops, avoiding gimbal lock during 3D rotations, and frame-accurate timeline scrubbing.

---

## 2. package.json Inspection
```json
{
  "name": "threejs-motion",
  "version": "1.0.0",
  "dependencies": {
    "three": "^0.160.0",
    "gsap": "^3.12.5",
    "@gsap/react": "^2.1.1",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  }
}
```

---

## 3. Source Structure Inspection
```
threejs-motion/
├── src/
│   ├── bridge/
│   │   ├── ObjectTween.ts       # GSAP tween bindings for THREE.Vector3 & Euler
│   │   ├── QuaternionTween.ts   # Slerp quaternion interpolation via proxy objects
│   │   └── UniformTween.ts      # Direct tweening of ShaderMaterial uniforms
│   ├── choreography/
│   │   ├── CameraPath.ts        # CatmullRomCurve3 camera track + lookAt tween
│   │   └── ModelTimeline.ts     # Multi-stage scrubbed timeline
│   └── components/
│       ├── MotionCanvas.tsx     # React wrapper linking GSAP context with Three scene
│       └── StorySection.tsx     # Pinned scroll container
```

---

## 4. Major Technologies
- **Three.js**: Object3D hierarchy, PerspectiveCamera, CatmullRomCurve3, Quaternions.
- **GSAP 3 & ScrollTrigger**: Timeline sequencing, coordinate scrubbing, lag smoothing.
- **React & `@gsap/react`**: Component lifecycle coordination.

---

## 5. Reusable Patterns
1. **The Quaternion Proxy Bridge**: Tweening an arbitrary numeric proxy `{ progress: 0 }` and using `THREE.Quaternion.slerpQuaternions(start, end, proxy.progress)` in `onUpdate`, completely preventing gimbal lock.
2. **Camera Spline Scrubbing**: Defining a `CatmullRomCurve3` 3D spline and scrubbing `camera.position.copy(curve.getPointAt(progress))` via ScrollTrigger.
3. **Direct Uniform Tweening**: Animating custom shader values (`material.uniforms.uProgress.value`) seamlessly within GSAP timelines.

---

## 6. Animation Techniques
- Coordinated multi-axis camera choreography: Simultaneous camera translation and opposite subject rotation creating high-end editorial parallax.
- Timeline label staging: Chaining acts via `<` and relative delay offsets.

---

## 7. 3D / WebGL Techniques
- **Curve-Driven Camera Paths**: `curve.getPointAt(t)` for cinematic tracking shots.
- **Spherical Linear Interpolation (Slerp)**: Smooth rotational arcs across 3D orientations.

---

## 8. Performance Techniques
- No React state changes during scroll scrubbing.
- Tweens mutate Three.js native object properties in place.
- ScrollTrigger debounce on window resize.

---

## 9. Responsive / Mobile Techniques
- Responsive camera Z-distance adjustment based on window aspect ratio.
- Clamping scrub duration on touch screens.

---

## 10. Accessibility Techniques
- Respects `prefers-reduced-motion` by snapping timeline directly to end positions or rendering static orthographic views.

---

## 11. Dependencies
- `three`, `gsap`, `@gsap/react`.

---

## 12. Implementation Tradeoffs
- **Euler vs Quaternion**: Direct Euler angle tweens (`mesh.rotation.y = Math.PI`) are simpler to write, but flip unpredictably when animating multiple axes simultaneously. Quaternions require proxy math but guarantee rock-solid rotations.
