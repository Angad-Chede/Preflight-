# React Three Fiber Ecosystem — Deep Source Extraction

## 1. README Inspection
- **Tagline**: A React renderer for Three.js.
- **Positioning**: Declarative, component-based 3D scene architecture with zero abstraction overhead. Every JSX element maps 1:1 to an underlying Three.js class.
- **Core Ecosystem Suite**:
  - `@react-three/fiber`: The core custom React reconciler.
  - `@react-three/drei`: Official collection of tested helpers, shaders, and controls.
  - `@react-three/postprocessing`: Declarative postprocessing pipeline.
  - `tunnel-rat`: Portals for bridging DOM hierarchy with 3D canvas hierarchy.

---

## 2. package.json Inspection
```json
{
  "name": "@react-three/fiber",
  "version": "9.8.1",
  "dependencies": {
    "its-fine": "^1.2.5",
    "react-reconciler": "^0.31.0",
    "scheduler": "^0.25.0",
    "suspend-react": "^0.1.5",
    "three": "^0.170.0",
    "zustand": "^5.0.0"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "three": ">=0.133"
  }
}
```

---

## 3. Source Structure Inspection
```
react-three-fiber/
├── packages/
│   ├── fiber/
│   │   ├── src/
│   │   │   ├── core/           # reconciler, renderer, loop, store, events
│   │   │   ├── hooks/          # useFrame, useThree, useLoader, useGraph
│   │   │   └── web/            # Canvas component, pointer event bindings
│   │   └── package.json
│   ├── drei/                   # Float, Center, Html, Environment, ContactShadows
│   └── postprocessing/         # EffectComposer, Bloom, Vignette, ChromaticAberration
```

---

## 4. Major Technologies
- **Custom React Reconciler (`react-reconciler`)**: Directly mutates Three.js scene graph instances instead of HTML DOM nodes.
- **Zustand Root Store**: Manages camera, clock, renderer, scene, viewport, and size state internally.
- **React Concurrent Mode**: Fiber prioritizes UI thread interactions over 3D frame work.

---

## 5. Reusable Patterns
1. **Zero-Reconciler `useFrame` Pattern**: Mutating mutable `ref.current` values directly inside `useFrame`, completely bypassing React component diffing and re-renders.
2. **The Tunnel-Rat Portal Pattern**: Co-locating 3D meshes inside regular DOM page components, portaling them to a single fixed viewport-level `<Canvas>`.
3. **Suspense Boundaries for Asynchronous Assets**: Automatic integration with React Suspense for GLTF models and textures.

---

## 6. Animation Techniques
- Frame-rate independent delta scaling: `mesh.rotation.x += delta * speed`.
- Spring-based camera motion via Drei abstractions (`<CameraControls>`, `<Float>`).

---

## 7. 3D / WebGL Techniques
- Direct Three.js class instantiation in JSX (`<mesh>`, `<boxGeometry>`, `<meshStandardMaterial>`).
- Raycast pointer event routing: Translating 2D screen mouse clicks into 3D mesh `onClick` events.

---

## 8. Performance Techniques
- **Automatic Resource Disposal**: Unmounting JSX nodes automatically calls `.dispose()` on geometries and materials, eliminating GPU memory leaks.
- **`<Canvas frameloop="demand">`**: Render loop sleeps at 0% CPU until `invalidate()` is called.
- **Clamped DPR**: `<Canvas dpr={[1, 1.5]}>` limits resolution to save GPU fillrate.

---

## 9. Responsive / Mobile Techniques
- Responsive viewport hook (`useThree((state) => state.viewport)`) providing physical 3D world units matching screen boundaries.
- Native touch event routing for mobile WebGL interaction.

---

## 10. Accessibility Techniques
- Projecting real semantic HTML with ARIA tags into 3D world coordinates via Drei's `<Html>` component.

---

## 11. Dependencies
- `three`, `react-reconciler`, `zustand`, `suspend-react`.

---

## 12. Implementation Tradeoffs
- **Declarative Ergonomics vs Direct WebGL**: R3F adds minimal overhead (~15KB reconciler), but eliminates 90% of boilerplate code, memory leak bugs, and DOM synchronization headaches of vanilla Three.js.
