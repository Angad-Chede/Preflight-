# Technique: Three.js Core Architecture & Memory Lifecycle

## Technique Name
Three.js Core Architecture & Memory Lifecycle

## Purpose
Establishes robust WebGL scene graph management, memory disposal contracts, context loss handling, and lighting budgets in vanilla Three.js and React environments.

## Difficulty
Advanced

## Dependencies
- `three`: `^0.160.0` or higher
- `@types/three`: `^0.160.0`

## When to Use
- Custom WebGL canvas pipelines, procedural shader meshes, and 3D product configurations.
- Low-level scene graph management where direct control over geometry buffer attributes and materials is required.

## When NOT to Use
- Standard 2D UI designs that can be achieved with HTML and CSS.
- When React Three Fiber is already in use (use declarative R3F components instead).

## Implementation Strategy
1. **The Single Canvas Rule**: Maintain exactly 1 WebGLRenderer per application viewport.
2. **Strict GPU Memory Disposal**: JavaScript garbage collection does not free GPU textures, geometries, or render targets. Always call `.dispose()` on geometries, materials, textures, and render targets inside component cleanup handlers.
3. **Handle WebGL Context Loss**: Attach event listeners for `webglcontextlost` and `webglcontextrestored`.
4. **Color Space Standard**: Set `renderer.outputColorSpace = THREE.SRGBColorSpace;`.

## Example Code Pattern
```ts
// lib/three-cleanup.ts
import * as THREE from 'three';

export function disposeHierarchy(root: THREE.Object3D) {
  root.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();

      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((mat) => disposeMaterial(mat));
        } else {
          disposeMaterial(mesh.material);
        }
      }
    }
  });
}

function disposeMaterial(material: THREE.Material) {
  material.dispose();
  // Dispose attached textures
  for (const key of Object.keys(material)) {
    const value = (material as any)[key];
    if (value && typeof value === 'object' && 'minFilter' in value) {
      (value as THREE.Texture).dispose();
    }
  }
}
```

## Performance Cost
- WebGL contexts consume significant VRAM. Failure to call `.dispose()` results in browser memory leaks, thermal throttling, and eventual tab crashes.

## Mobile Behavior
- Clamping Device Pixel Ratio is critical: `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))`. Never allow DPR > 1.5 on mobile GPUs.

## Accessibility Concerns
- Screen readers cannot interpret pixels rendered inside a `<canvas>`. Always provide an adjacent semantic HTML companion tree with `aria-hidden="true"` on the canvas.

## Source Repository
- [`pmndrs/react-three-fiber`](file:///c:/Users/USER/frontend%20work/frontend-intelligence/sources/react-three-fiber-ecosystem.md)
- [`giuucmp/aether-boilerplate`](file:///c:/Users/USER/frontend%20work/frontend-intelligence/sources/aether-boilerplate.md)
