# Recipe: High-Performance WebGL Shader Background

## 1. Concept & Architectural Blueprint
A WebGL shader background adds subtle ambient life and depth to dark-mode landing pages without consuming high CPU/GPU resources:
- **Procedural Aurora / Fluid Noise**: Custom fragment shader computing simplex noise and chromatic gradient interpolation entirely on the GPU.
- **Single Fullscreen Quad**: Renders a single flat plane (`planeGeometry args={[2, 2]}`) with normalized device coordinates (`-1` to `+1`). Zero complex geometry vertices.
- **Battery & Performance Guardrails**: Clamps DPR to `1.0`, caps framerate updates or slows down `uTime` factor, and falls back to a CSS radial gradient on low-power devices.

---

## 2. Complete Next.js / React Implementation

```tsx
// components/background/WebGLAuroraBackground.tsx
'use client';

import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const AuroraShader = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec2 uResolution;
    varying vec2 vUv;

    // Fast 2D Hash & Noise
    vec2 hash(vec2 p) {
      p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
      return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
    }

    float noise(in vec2 p) {
      const float K1 = 0.366025404;
      const float K2 = 0.211324865;
      vec2 i = floor(p + (p.x + p.y) * K1);
      vec2 a = p - i + (i.x + i.y) * K2;
      vec2 o = (a.x > a.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec2 b = a - o + K2;
      vec2 c = a - 1.0 + 2.0 * K2;
      vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
      vec3 n = h * h * h * h * vec3(dot(a, hash(i)), dot(b, hash(i + o)), dot(c, hash(i + 1.0)));
      return dot(n, vec3(70.0));
    }

    void main() {
      vec2 uv = vUv;
      float time = uTime * 0.15;

      // Layered noise for fluid aurora plasma
      float n1 = noise(uv * 3.0 + vec2(time * 0.5, time * 0.2));
      float n2 = noise(uv * 6.0 - vec2(time * 0.3, n1 * 0.5));
      float plasma = n1 * 0.6 + n2 * 0.4;

      // Color Palette: Deep Obsidian, Cosmic Violet, and Electric Cyan
      vec3 deepBase = vec3(0.03, 0.03, 0.06);
      vec3 violet = vec3(0.18, 0.12, 0.38);
      vec3 cyan = vec3(0.12, 0.35, 0.55);

      vec3 color = mix(deepBase, violet, smoothstep(-0.5, 0.5, plasma));
      color = mix(color, cyan, smoothstep(0.1, 0.8, plasma));

      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

function ShaderQuad() {
  const materialRef = useRef<THREE.ShaderMaterial>(null!);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
    }),
    []
  );

  useFrame((state) => {
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={AuroraShader.vertexShader}
        fragmentShader={AuroraShader.fragmentShader}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

export function WebGLAuroraBackground({ children }: { children?: React.ReactNode }) {
  const [shouldRenderWebGL, setShouldRenderWebGL] = useState(true);

  useEffect(() => {
    // Disable WebGL on battery-saver or very weak devices
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isVeryWeak = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
    if (prefersReducedMotion || isVeryWeak) {
      setShouldRenderWebGL(false);
    }
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-neutral-950 text-white overflow-hidden">
      {/* Background Layer */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {shouldRenderWebGL ? (
          <Canvas
            dpr={1} // Strict DPR 1 to maximize fillrate performance
            gl={{ powerPreference: 'low-power', antialias: false, depth: false }}
          >
            <ShaderQuad />
          </Canvas>
        ) : (
          // CSS Fallback Gradient
          <div className="h-full w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-neutral-950 to-neutral-950" />
        )}
      </div>

      {/* Content Layer */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
```

---

## 3. Performance & Mobile Safeguards
- **DPR = 1**: WebGL backgrounds do not need sharp sub-pixel antialiasing because noise is naturally soft. Clamping DPR to 1 saves up to 75% GPU fillrate workload.
- **`depthTest: false` & `depthWrite: false`**: Eliminates depth buffer memory allocation and read/write operations.
- **`powerPreference: 'low-power'`**: Instructs the operating system to render on integrated GPUs rather than firing power-hungry discrete GPUs on laptops.
