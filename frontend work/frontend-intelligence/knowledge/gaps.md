# Knowledge Base Audit & Future Research Gaps (`gaps.md`)

## Overview
This document represents an honest architectural audit of `frontend-intelligence`. While the knowledge base comprehensively covers production-grade WebGL, GSAP, Lenis, Motion, and Next.js App Router patterns, the following cutting-edge areas represent emerging topics for ongoing research and future documentation sprints.

---

## 1. WebGPU & WGSL Compute Pipelines
- **Status**: Emerging Web Standard (Chrome 113+, Safari 18+).
- **The Gap**: Three.js currently supports WebGL2 as its primary production backend, with experimental `WebGPURenderer` in active development.
- **Why It Matters**: WebGPU allows running **compute shaders** directly on the GPU. Instead of being capped at 10,000 - 50,000 particles, WebGPU can simulate **1,000,000+ interactive particles with GPU-based flocking algorithms (Boids) or fluid physics** at 120 FPS.
- **Research Questions**:
  1. How stable is `@react-three/fiber` with Three.js's new `three/webgpu` renderer in React 19?
  2. What is the optimal fallback strategy when a user visits on a browser lacking WebGPU support?
  3. How should WGSL compute shader code be organized and bundled inside Next.js?

---

## 2. Browser Native View Transitions API vs. Orchestrated Curtains
- **Status**: Native W3C Standard (`document.startViewTransition()`).
- **The Gap**: Next.js App Router is actively evolving its first-class integration with browser View Transitions.
- **Why It Matters**: Native View Transitions capture before-and-after screenshots of elements at the compositor level, executing cross-fade and morph animations with zero JavaScript animation library overhead.
- **Research Questions**:
  1. How does native `view-transition-name` interact with Lenis smooth scroll and pinned GSAP ScrollTrigger instances?
  2. Can native View Transitions completely replace Framer Motion `layoutId` for multi-page route navigation?
  3. How to handle cross-browser inconsistencies in browsers without full cross-document view transition support.

---

## 3. OffscreenCanvas & Web Worker Render Loops
- **Status**: Production Web API.
- **The Gap**: Moving Three.js rendering off the main browser thread.
- **Why It Matters**: On the main thread, heavy JavaScript tasks (e.g. JSON parsing, React reconciliation, analytics trackers) can block the thread for 50-100ms, causing 3D animations to drop frames. `OffscreenCanvas` allows Three.js to run inside a dedicated Web Worker, guaranteeing an unbroken 60/120 FPS even if the main thread is 100% frozen.
- **Research Questions**:
  1. How does React Three Fiber reconciler communicate across Web Worker boundaries?
  2. How can DOM scroll and pointer events be streamed into the worker with sub-millisecond serialization latency?
  3. What are the memory transfer costs of passing textures to the worker via `ImageBitmap`?

---

## 4. Web Audio API & 3D Spatial Audio Synchronization
- **Status**: Production Web API.
- **The Gap**: High-end award-winning sites (AETHER, Active Theory) pair 3D motion with real-time soundscapes, hover chimes, and audio-reactive shaders.
- **Why It Matters**: Sound accounts for 50% of emotional immersion on cinematic websites.
- **Research Questions**:
  1. How to pipe `AnalyserNode` frequency FFT data into GLSL shader uniforms (`uAudioFrequency`) without garbage collection stalls.
  2. How to position `PannerNode` objects in 3D space matching Three.js camera and listener coordinates.
  3. Best practices for progressive audio asset preloading and user consent / autoplay policies.

---

## 5. Hierarchical Level-of-Detail (LOD) & Massive Scene Streaming
- **Status**: Three.js `THREE.LOD` and 3D Gaussian Splatting.
- **The Gap**: Handling enormous 3D environments (architectural virtual tours, digital twins) exceeding 200MB in geometry.
- **Why It Matters**: Standard `useGLTF` downloads the entire model upfront. Massive scenes require progressive geometric octrees and texture streaming based on camera distance.
- **Research Questions**:
  1. Implementing Gaussian Splatting (`@mkkellogg/gaussian-splats-3d`) inside React Three Fiber.
  2. Automating multi-resolution mesh decimation pipelines in `gltf-transform`.

---

## 6. Physics Simulation via Rapier 3D in React
- **Status**: Active Ecosystem (`@react-three/rapier`).
- **The Gap**: Rigid-body physics, realistic collision gravity, ragdolls, and tactile friction in web 3D.
- **Why It Matters**: Adding physical collision reactions to floating elements or interactive cursor collisions creates visceral user delight.
- **Research Questions**:
  1. How to prevent Rapier WASM physics steps from consuming CPU cycles when objects come to rest (sleeping rigid bodies).
  2. Syncing physics colliders with DOM overlay elements.

---

## 📋 Research Action Plan
When extending `frontend-intelligence` in subsequent phases:
1. Benchmark WebGPU in Three.js r170+ with Vite and Next.js.
2. Develop a proof-of-concept for `OffscreenCanvas` Web Worker 3D rendering.
3. Formulate an audio-visual synchronizer recipe uniting Web Audio API FFT with procedural vertex shaders.
