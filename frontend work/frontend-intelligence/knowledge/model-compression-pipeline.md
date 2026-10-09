# Technique: Automated 3D Model Compression Pipeline (`optimize-model`)

## Technique Name
Automated 3D Model Compression Pipeline

## Purpose
Automates the optimization, geometry decimation, vertex deduplication, and Draco/WebP texture compression of raw Blender `.glb` exports, reducing 40MB+ assets down to <1.5MB for production web delivery.

## Difficulty
Intermediate

## Dependencies
- `@gltf-transform/cli`: `^3.10.0` or higher
- `@gltf-transform/functions`: `^3.10.0`

## When to Use
- Whenever 3D models from Blender, Cinema4D, Maya, or 3D asset stores are prepared for web deployment.
- As a CI/CD pre-commit or build step for creative web projects.

## When NOT to Use
- For models with fewer than 1,000 vertices where Draco decompression WASM overhead exceeds the uncompressed asset size.
- Purely programmatic procedural geometries generated at runtime in Three.js code.

## Implementation Strategy
1. **Deduplication**: Merge identical materials and vertex attributes.
2. **Welding**: Weld duplicate vertices within a tiny tolerance (`0.0001`) to reduce triangle count.
3. **Texture Resizing & WebP Conversion**: Limit max texture resolution to `1024x1024` or `2048x2048`, converting PNG/JPEG to WebP or KTX2.
4. **Draco Geometry Compression**: Quantize positions, normals, and UVs.

## Example Code Pattern
```js
// scripts/optimize-model.mjs
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const inputModel = process.argv[2];
if (!inputModel) {
  console.error('Usage: node scripts/optimize-model.mjs <path-to-model.glb>');
  process.exit(1);
}

const dir = path.dirname(inputModel);
const ext = path.extname(inputModel);
const base = path.basename(inputModel, ext);
const tempModel = path.join(dir, `${base}-temp.glb`);
const outputModel = path.join(dir, `${base}-optimized.glb`);

console.log(`Optimizing: ${inputModel}...`);

try {
  // Step 1: Dedup and Weld vertices
  execSync(`npx @gltf-transform/cli dedup "${inputModel}" "${tempModel}"`, { stdio: 'inherit' });
  execSync(`npx @gltf-transform/cli weld "${tempModel}" "${tempModel}" --tolerance 0.0005`, { stdio: 'inherit' });

  // Step 2: Resize textures to 1024 max and convert to WebP
  execSync(`npx @gltf-transform/cli resize "${tempModel}" "${tempModel}" --width 1024 --height 1024`, { stdio: 'inherit' });
  execSync(`npx @gltf-transform/cli webp "${tempModel}" "${tempModel}" --quality 85`, { stdio: 'inherit' });

  // Step 3: Compress geometry with Draco
  execSync(`npx @gltf-transform/cli draco "${tempModel}" "${outputModel}" --quantize-position 14 --quantize-normal 10`, { stdio: 'inherit' });

  // Cleanup temp file
  if (fs.existsSync(tempModel)) fs.unlinkSync(tempModel);

  const originalSize = (fs.statSync(inputModel).size / 1024 / 1024).toFixed(2);
  const newSize = (fs.statSync(outputModel).size / 1024 / 1024).toFixed(2);
  console.log(`Success! Reduced from ${originalSize}MB to ${newSize}MB.`);
} catch (error) {
  console.error('Optimization failed:', error);
}
```

## Performance Cost
- **Build-Time**: 5-15 seconds per asset.
- **Client Runtime**: Reduces network transfer payload by 85-95%. Draco WASM loader adds ~150KB to the client bundle once.

## Mobile Behavior
- Crucial for mobile: Prevents mobile Safari tabs from crashing due to GPU memory overflow.

## Accessibility Concerns
- Faster load times ensure accessibility for users on constrained cellular networks.

## Source Repository
- [`giuucmp/aether-boilerplate`](file:///c:/Users/USER/frontend%20work/frontend-intelligence/sources/aether-boilerplate.md)
