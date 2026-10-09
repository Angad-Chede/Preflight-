# WebGL Fluid Distortion & Interactive Image Effects

## 1. What the Technique Is
WebGL fluid and distortion effects apply dynamic optical refraction to 2D textures, imagery, and background surfaces. Common implementations include:
- **Liquid Image Hover Distortion**: Using a custom fragment shader that displaces UV texture coordinates based on a 2D noise map or interactive mouse ripple vector.
- **Mouse Trail Canvas Texture (Ping-Pong / FBO)**: Drawing an offscreen 2D canvas with mouse trails or using WebGL Framebuffer Objects (FBO) to pass mouse velocity ripples into the fragment shader.
- **Raymarching / Signed Distance Functions (SDF)**: Rendering organic metaballs and fluid blobs mathematically on a flat quad.

---

## 2. When to Use It
- Portfolio project showcases where hovering an image reveals a fluid water ripple or glass refraction.
- Creative brand hero banners with organic liquid backgrounds.
- High-impact interactive banners where the cursor feels like running a finger through liquid mercury.

---

## 3. When NOT to Use It
- Standard content-heavy editorial articles or e-commerce catalog grids with 50+ images visible simultaneously.
- When the website must run flawlessly on budget Android devices or battery saver modes.

---

## 4. Implementation Pattern
1. **The UV Displacement Pattern**:
   - Pass the primary texture (`uTexture`) and a noise texture or mouse displacement map (`uDisplacement`) to a custom fragment shader.
   - In GLSL: Sample the displacement map to get an offset vector: `vec2 offset = texture2D(uDisplacement, vUv).rg * 2.0 - 1.0;`
   - Offset the main texture coordinates: `vec4 color = texture2D(uTexture, vUv + offset * uIntensity);`
2. **Smooth Cursor Inertia**:
   - Track cursor speed/velocity. When the mouse stops, dampen the displacement intensity smoothly using exponential decay.

---

## 5. React / Next.js Example (Liquid Hover Image)

```tsx
'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';

const LiquidDistortionShader = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D uTexture;
    uniform float uTime;
    uniform vec2 uMouse;
    uniform float uHover;
    varying vec2 vUv;

    // Simplex 2D noise
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
    float snoise(vec2 v){
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy) );
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m ;
      m = m*m ;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    void main() {
      vec2 uv = vUv;
      
      // Calculate distance to mouse
      float dist = distance(uv, uMouse);
      float mouseInfluence = smoothstep(0.4, 0.0, dist) * uHover;

      // Noise wave ripple
      float noise = snoise(uv * 6.0 + uTime * 1.5);
      vec2 distortedUv = uv + vec2(noise * 0.04 * mouseInfluence);

      // Separate RGB channels for chromatic liquid refraction
      float r = texture2D(uTexture, distortedUv + vec2(0.005 * mouseInfluence, 0.0)).r;
      float g = texture2D(uTexture, distortedUv).g;
      float b = texture2D(uTexture, distortedUv - vec2(0.005 * mouseInfluence, 0.0)).b;

      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `,
};

function LiquidImageMesh({ imageUrl }: { imageUrl: string }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  const texture = useLoader(THREE.TextureLoader, imageUrl);

  const uniforms = useMemo(
    () => ({
      uTexture: { value: texture },
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uHover: { value: 0 },
    }),
    [texture]
  );

  useFrame((state, delta) => {
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    // Smooth damp hover intensity
    const targetHover = (meshRef.current as any).isHovered ? 1.0 : 0.0;
    materialRef.current.uniforms.uHover.value +=
      (targetHover - materialRef.current.uniforms.uHover.value) * (1 - Math.exp(-8 * delta));
  });

  const onPointerMove = (e: any) => {
    if (e.uv) {
      materialRef.current.uniforms.uMouse.value.set(e.uv.x, e.uv.y);
    }
  };

  return (
    <mesh
      ref={meshRef}
      onPointerOver={() => { (meshRef.current as any).isHovered = true; }}
      onPointerOut={() => { (meshRef.current as any).isHovered = false; }}
      onPointerMove={onPointerMove}
    >
      <planeGeometry args={[3, 2, 32, 32]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={LiquidDistortionShader.vertexShader}
        fragmentShader={LiquidDistortionShader.fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

export function LiquidImageCanvas({ imageUrl }: { imageUrl: string }) {
  return (
    <div className="relative h-[400px] w-full rounded-2xl overflow-hidden bg-neutral-900">
      <Canvas camera={{ position: [0, 0, 2.5] }} dpr={[1, 1.5]}>
        <LiquidImageMesh imageUrl={imageUrl} />
      </Canvas>
    </div>
  );
}
```

---

## 6. Dependencies
- `@react-three/fiber`: `^8.15.0`
- `three`: `^0.160.0`

---

## 7. Performance Considerations
- **Procedural Simplex Noise vs Texture Map**: Evaluating 2D simplex noise in a fragment shader is fast and requires zero image texture download overhead.
- **Aspect Ratio Matching**: Ensure plane geometry dimensions match the texture aspect ratio (e.g. `args={[3, 2]}` for a 3:2 aspect ratio) to avoid image stretching.

---

## 8. Mobile Considerations
- On mobile devices, pointer hover events do not exist. You can drive `uMouse` using touch gestures (`onTouchMove`) or replace mouse interaction with continuous gentle autonomous wave oscillation.

---

## 9. Accessibility Considerations
- If `prefers-reduced-motion` is active, set `uHover.value = 0` and bypass shader distortion, rendering the image as a standard static quad.

---

## 10. Common Mistakes
1. **Unclamped texture UV coordinates**: Heavy displacement can push UV coordinates beyond `0.0` and `1.0`. Ensure texture wrapping is set to `THREE.ClampToEdgeWrapping` or clamp UV in shader.
2. **Missing aspect ratio compensation**: Stretches the distortion into an ellipse when the canvas is not square.
3. **Instantiating new Canvas for every grid thumbnail**: Rendering 12 fluid thumbnails in 12 separate Canvases causes context loss. Use a single Canvas with an offscreen scissor test or render only the active hovered item.

---

## 11. Related Patterns
- `webgl-background.md`
- `threejs-materials-and-shaders.md`
- `interactive-portfolio.md`

---

## 12. Source References
- [Lattice Drift Teardown](../sources/lattice-drift.md)
- Inigo Quilez GLSL Shader Articles: https://iquilezles.org/
