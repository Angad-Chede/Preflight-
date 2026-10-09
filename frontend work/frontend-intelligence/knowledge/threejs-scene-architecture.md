# Three.js & WebGL Scene Architecture

## 1. What the Technique Is
WebGL scene architecture defines how 3D canvases, renderers, scenes, cameras, and animation loops are instantiated, lifecycle-managed, and disposed within modern React applications. Proper scene architecture prevents WebGL context exhaustion (browsers enforce a strict limit of 8-16 simultaneous WebGL contexts), eliminates memory leaks, and orchestrates frame-accurate rendering.

---

## 2. When to Use It
- Any web application integrating 3D models, procedural shaders, particle effects, or interactive WebGL visualizations.
- Full-page creative experiences pairing WebGL depth with DOM content.

---

## 3. When NOT to Use It
- Applications where 2D SVG or lightweight CSS 3D transforms (`perspective`, `rotateY`) can achieve the visual requirement without loading the 600KB+ WebGL runtime.

---

## 4. Implementation Pattern
1. **The Single Canvas Rule**: Never render multiple independent `<Canvas>` elements across different sections of a single page. Use a single fixed fullscreen canvas and position 3D objects relative to DOM scroll proxies (or use R3F View components).
2. **On-Demand Rendering**: For scenes without continuous physics or particles, configure `frameloop="demand"`. Only call `invalidate()` when the user hovers, drags, or triggers a state update. This drops CPU/GPU usage to 0% at rest.
3. **Context Loss Handling**: Listen for `webglcontextlost` and `webglcontextrestored` events on the canvas element.
4. **Lifecycle Disposal**: Explicitly dispose geometries, materials, textures, and render targets upon component unmount.

---

## 5. React / Next.js Example

```tsx
'use client';

import { useRef, useEffect } from 'react';
import * as THREE from 'three';

export function VanillaSceneCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: true,
      alpha: true,
    });

    // Color space and pixel ratio clamping
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // 2. Geometry & Material Allocation
    const geometry = new THREE.IcosahedronGeometry(1.2, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0x4f46e5,
      metalness: 0.8,
      roughness: 0.2,
      wireframe: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Lighting
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    // 3. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width === 0 || height === 0) return;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    });
    resizeObserver.observe(container);

    // 4. WebGL Context Loss Protection
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      console.warn('WebGL Context Lost. Halting render loop.');
    };
    const canvas = renderer.domElement;
    canvas.addEventListener('webglcontextlost', handleContextLost, false);

    // 5. Render Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      const delta = clock.getDelta();
      mesh.rotation.x += delta * 0.3;
      mesh.rotation.y += delta * 0.5;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    // 6. Complete Disposal Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      canvas.removeEventListener('webglcontextlost', handleContextLost);

      // Free GPU memory
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();

      if (container.contains(canvas)) {
        container.removeChild(canvas);
      }
    };
  }, []);

  return <div ref={containerRef} className="relative h-[500px] w-full rounded-2xl overflow-hidden bg-neutral-950" />;
}
```

---

## 6. Dependencies
- `three`: `^0.160.0` or higher
- `@types/three`: `^0.160.0` or higher

---

## 7. Performance Considerations
- **DPR Clamping**: Restrict DPR to `Math.min(window.devicePixelRatio, 1.5)`. High-end smartphones have 3x/4x DPR; running full-screen WebGL at 4x native resolution requires rendering 16x pixels per frame, resulting in severe GPU thermal throttling and frame drops.
- **Power Preference**: Always pass `powerPreference: 'high-performance'` to hint the browser to use discrete GPUs on multi-GPU laptops.

---

## 8. Mobile Considerations
- Mobile devices have tight memory budgets (often <200MB WebGL heap).
- On mobile, disable heavy MSAA antialiasing if postprocessing is active.
- Throttle render frame rates or switch to static fallback previews on low-battery/low-power modes.

---

## 9. Accessibility Considerations
- Always assign `aria-hidden="true"` or `role="img" aria-label="Descriptive explanation of 3D visualization"` to the canvas element.
- Provide DOM fallback text inside or adjacent to the canvas for screen readers.

---

## 10. Common Mistakes
1. **Multiple Canvases on one page**: Instantiating 8 separate `<canvas>` elements across scrolling sections causes browsers to hit WebGL context limits and crash silently.
2. **Neglecting `.dispose()`**: Simply removing a `<canvas>` element from the DOM does not release GPU textures or geometries. They remain stranded in GPU VRAM until the browser tab is closed.
3. **Updating materials every frame**: Modifying material properties that trigger shader recompilation (like changing `material.wireframe` or adding lights) inside the render loop causes massive hitching.

---

## 11. Related Patterns
- `r3f-and-drei-ecosystem.md`
- `hybrid-canvas-layout.md`
- `performance-profiling-and-optimization.md`

---

## 12. Source References
- [React Three Fiber Ecosystem Teardown](../sources/react-three-fiber-ecosystem.md)
- [Official Docs Synthesis: Three.js](../sources/official-docs-synthesis.md)
- Three.js Manual: Disposal of Resources
