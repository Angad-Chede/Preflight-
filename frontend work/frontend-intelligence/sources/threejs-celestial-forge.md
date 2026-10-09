# ThreeJS Celestial Forge — Deep Source Extraction

## 1. README Inspection
- **Tagline**: Procedural Cosmic Visualization & Shader Forge.
- **Positioning**: Real-time generative celestial visualizer leveraging procedural GLSL mathematics, custom Fresnel emissive materials, dynamic star particle fields, and an UnrealBloom postprocessing pipeline.
- **Core Visual Pillars**: High-intensity plasma cores, solar flare arc deformation, stellar dust fields, and camera orbit staging.

---

## 2. package.json Inspection
```json
{
  "name": "threejs-celestial-forge",
  "version": "1.0.0",
  "dependencies": {
    "three": "^0.160.0",
    "postprocessing": "^6.34.0",
    "simplex-noise": "^4.0.1",
    "vite": "^5.0.0"
  }
}
```

---

## 3. Source Structure Inspection
```
celestial-forge/
├── src/
│   ├── core/
│   │   ├── Engine.ts            # Scene, Camera, WebGLRenderer, Resize handling
│   │   ├── Postprocessing.ts    # EffectComposer, Selective UnrealBloomPass
│   │   └── Clock.ts             # Precision delta time manager
│   ├── shaders/
│   │   ├── core.vert.glsl       # 3D simplex noise vertex displacement
│   │   ├── fresnel.frag.glsl    # View-direction rim Fresnel + HDR color multipliers
│   │   └── flare.frag.glsl      # Dynamic plasma solar turbulence
│   ├── objects/
│   │   ├── CelestialCore.ts     # Icosahedron geometry + custom ShaderMaterial
│   │   ├── StarField.ts         # BufferGeometry with 50,000 points & GPU twinkle
│   │   └── OrbitRing.ts         # Additive-blended particle accretion disk
│   └── main.ts                  # Application entry point
```

---

## 4. Major Technologies
- **Three.js Core (r160+)**: Scene graph, camera controls, buffer geometries.
- **Custom GLSL Vertex & Fragment Shaders**: Procedural 3D Simplex noise, Fresnel equations.
- **Postprocessing Library**: `EffectComposer`, `UnrealBloomPass`.
- **Vite**: Ultra-fast shader HMR with `vite-plugin-glsl`.

---

## 5. Reusable Patterns
1. **Procedural Geometry over Heavy 3D Meshes**: Mathematical noise inside vertex shaders displaces simple icosahedrons, avoiding multi-megabyte 3D model downloads.
2. **Selective Bloom with HDR Colors**: Outputting fragment colors with values `> 1.0` (e.g. `vec3(finalColor * 3.5)`) and setting `bloomThreshold: 0.9` ensures only emissive cores glow while dark space remains pitch black.
3. **GPU Particle Twinkling**: Modulating particle sizes and opacities via `sin(uTime * speed + seed)` inside the fragment shader rather than modifying CPU buffers.

---

## 6. Animation Techniques
- Autonomous procedural turbulence: Passing elapsed `uTime` to vertex shaders for continuous organic undulation without CPU cycles.
- Smooth camera orbit with damped mouse dragging.

---

## 7. 3D / WebGL Techniques
- **View-Angle Fresnel Reflection**: `float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), power);`
- **Additive Blending Accretion Disk**: `blending: THREE.AdditiveBlending, depthWrite: false` for ethereal plasma rings.

---

## 8. Performance Techniques
- **Zero BufferAttribute updates in CPU loop**: Position arrays remain static in GPU VRAM; all animations occur in shader memory.
- **`multisampling: 0` on Bloom Composer**: Mitigates memory spikes on high-resolution screens.

---

## 9. Responsive / Mobile Techniques
- Clamp DPR to `1.0 - 1.5`.
- Dynamic particle count throttling: Mobile detection cuts starfield from 50,000 to 10,000 particles.

---

## 10. Accessibility Techniques
- Photosensitivity guard: Ensuring plasma oscillations never strobe at frequencies between 3Hz and 30Hz.
- Full reduced-motion bypass stopping camera rotation and slowing shader wave frequencies.

---

## 11. Dependencies
- `three`, `postprocessing`, `simplex-noise`.

---

## 12. Implementation Tradeoffs
- **UnrealBloomPass Fillrate Cost**: Full-screen bloom requires multiple blur downsample passes. Highly demanding on low-power mobile GPUs; must be bypassed on mobile tiers.
