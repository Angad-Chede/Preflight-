# Lattice Drift — Deep Source Extraction

## 1. README Inspection
- **Tagline**: Interactive Generative Mathematical Lattices & Wave Displacement.
- **Positioning**: Real-time interactive WebGL experience exploring cursor-reactive wave distortion across large-scale instanced geometric matrices with damped camera physics.
- **Visual Aesthetic**: High-contrast dark techno-minimalism, precision geometric prisms, undulating water-like impulse ripples.

---

## 2. package.json Inspection
```json
{
  "name": "lattice-drift",
  "version": "1.0.0",
  "dependencies": {
    "three": "^0.162.0",
    "simplex-noise": "^4.0.1",
    "vite": "^5.1.0"
  }
}
```

---

## 3. Source Structure Inspection
```
lattice-drift/
├── src/
│   ├── core/
│   │   ├── Renderer.ts          # WebGLRenderer with powerPreference: high-performance
│   │   ├── Camera.ts            # Perspective camera with responsive FOV calculation
│   │   └── InputManager.ts      # Pointer delta, velocity tracking & normalization
│   ├── physics/
│   │   └── SpringDamp.ts        # Second-order exponential damping math
│   ├── graphics/
│   │   ├── LatticeGrid.ts       # THREE.InstancedMesh (3,600 prisms) + matrix setup
│   │   └── WaveShader.ts        # onBeforeCompile vertex shader injection for wave ripple
│   └── main.ts                  # App coordinator & requestAnimationFrame loop
```

---

## 4. Major Technologies
- **Three.js Core**: `THREE.InstancedMesh`, `THREE.BoxGeometry`, `THREE.MeshStandardMaterial`.
- **GLSL Shader Injection (`onBeforeCompile`)**: Injecting procedural wave equations directly into standard PBR materials without rewriting lighting shaders from scratch.
- **Custom Spring/Damping Math**: Second-order exponential decay algorithms.

---

## 5. Reusable Patterns
1. **Instanced Lattice Matrix Layout**: Initializing 3,600 instances in a single draw call with pre-calculated static positions and dummy transform matrices.
2. **`onBeforeCompile` Material Patching**: Injecting custom GLSL ripple wave equations into Three.js's standard `MeshStandardMaterial`, preserving physical lighting while adding custom wave mathematics.
3. **Exponential Camera Damping**: `current += (target - current) * (1 - Math.exp(-speed * dt))` providing smooth, luxurious camera floating.

---

## 6. Animation Techniques
- Cursor-reactive impulse ripples: Mouse position and speed create a decaying radial sinusoidal wave radiating outward across the grid.
- Damped tilt response to cursor coordinates.

---

## 7. 3D / WebGL Techniques
- **`THREE.InstancedMesh` with Dynamic Vertex Displacement**: Matrix instances positioned on CPU once; heights displaced dynamically in vertex shader.
- **Normal Matrix Recalculation**: Adjusting vertex normals in shader so undulating waves catch directional lighting accurately.

---

## 8. Performance Techniques
- Single draw call for 3,600 geometric objects.
- Wave calculations run on GPU parallel cores instead of CPU JavaScript array loops.
- Device Pixel Ratio clamped strictly to `Math.min(window.devicePixelRatio, 1.5)`.

---

## 9. Responsive / Mobile Techniques
- Responsive grid dimensions: Reducing from 60x60 (3,600 instances) to 30x30 (900 instances) on small screens.
- Touch gesture translation: Mapping touch drag deltas to virtual cursor impulses.

---

## 10. Accessibility Techniques
- Motion sensitivity toggle: Disables cursor wave impulses and camera tilt, locking lattice into a calm, static geometric plane.

---

## 11. Dependencies
- `three`, `simplex-noise`.

---

## 12. Implementation Tradeoffs
- **`onBeforeCompile` Fragility**: Injects string replacements into Three.js internal shader chunks. Very powerful and preserves standard lighting, but can break across major Three.js version upgrades if internal chunk names change.
