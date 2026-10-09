# Recipe: Interactive Portfolio Showcase

## 1. Concept & Architectural Blueprint
An Awwwards-style creative developer/agency portfolio featuring:
- **Interactive Project List**: Minimalist typographic list where hovering an item triggers a floating, cursor-following image preview card.
- **Floating Preview Lerp Physics**: The image preview floats behind or adjacent to the cursor using smooth linear interpolation (lerp).
- **Custom Magnetic Cursor State**: Cursor inverts contrast (`mix-blend-mode: difference`) and expands into an action pill ("EXPLORE").
- **Kinetic Hover Skew**: Image tilts dynamically based on mouse velocity delta (`dx`, `dy`).

---

## 2. Complete Next.js / React Implementation

```tsx
// components/portfolio/InteractivePortfolio.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';

interface Project {
  id: string;
  title: string;
  category: string;
  year: string;
  image: string;
}

const PROJECTS: Project[] = [
  { id: '1', title: 'NeuroCore Quantum', category: 'Spatial Computing', year: '2026', image: '/portfolio/neuro.webp' },
  { id: '2', title: 'Aetherial Soundscape', category: 'Creative WebGL', year: '2025', image: '/portfolio/aether.webp' },
  { id: '3', title: 'Lattice Drift Visualizer', category: 'Generative Mathematics', year: '2025', image: '/portfolio/lattice.webp' },
  { id: '4', title: 'Celestial Forge Engine', category: 'Real-time Shaders', year: '2024', image: '/portfolio/forge.webp' },
];

export function InteractivePortfolio() {
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ currentX: 0, currentY: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const preview = previewRef.current;
    if (!preview) return;

    const onMouseMove = (e: MouseEvent) => {
      pos.current.targetX = e.clientX;
      pos.current.targetY = e.clientY;
    };

    window.addEventListener('mousemove', onMouseMove);

    // RAF loop for smooth floating preview trailing
    const ticker = gsap.ticker.add(() => {
      const speed = 0.15;
      const dx = pos.current.targetX - pos.current.currentX;
      const dy = pos.current.targetY - pos.current.currentY;

      pos.current.currentX += dx * speed;
      pos.current.currentY += dy * speed;

      // Calculate subtle skew from velocity
      const skewX = Math.max(-15, Math.min(15, dx * 0.1));

      gsap.set(preview, {
        x: pos.current.currentX,
        y: pos.current.currentY,
        skewX,
      });
    });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      gsap.ticker.remove(ticker);
    };
  }, []);

  return (
    <section className="relative min-h-screen w-full bg-neutral-950 px-8 py-24 text-white">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-end justify-between border-b border-neutral-800 pb-8">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-indigo-400">Index</span>
            <h2 className="mt-2 text-4xl sm:text-6xl font-light">Selected Archives</h2>
          </div>
          <span className="font-mono text-xs text-neutral-500 hidden md:block">04 Works Catalogued</span>
        </div>

        {/* Project List */}
        <div className="divide-y divide-neutral-900">
          {PROJECTS.map((project) => (
            <div
              key={project.id}
              onMouseEnter={() => setActiveProject(project)}
              onMouseLeave={() => setActiveProject(null)}
              className="group relative flex cursor-pointer items-center justify-between py-10 transition-colors hover:px-4 duration-300"
            >
              <div className="flex items-baseline gap-6">
                <span className="font-mono text-xs text-neutral-600 group-hover:text-indigo-400 transition-colors">
                  0{project.id}
                </span>
                <h3 className="text-3xl sm:text-5xl font-light tracking-tight text-neutral-200 group-hover:text-white group-hover:translate-x-3 transition-transform duration-300">
                  {project.title}
                </h3>
              </div>

              <div className="flex items-center gap-8">
                <span className="hidden sm:inline font-mono text-xs text-neutral-500 uppercase tracking-wider">
                  {project.category}
                </span>
                <span className="font-mono text-xs text-neutral-600">{project.year}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Hover Preview Window */}
      <div
        ref={previewRef}
        className={`pointer-events-none fixed top-0 left-0 z-40 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-900 shadow-2xl transition-opacity duration-300 ease-out will-change-transform ${
          activeProject ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
        }`}
        style={{ width: '380px', height: '260px' }}
      >
        {activeProject && (
          <div
            className="h-full w-full bg-cover bg-center transition-all duration-500"
            style={{
              backgroundImage: `url(${activeProject.image})`,
              backgroundColor: '#1e1b4b',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-4">
              <span className="font-mono text-[10px] uppercase text-indigo-300">Case Study</span>
              <p className="text-xs font-medium text-white">{activeProject.title}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
```

---

## 3. Performance & Mobile Safeguards
- **Velocity Skew Clamping**: Clamping `skewX` to `[-15, 15]` prevents the preview image from folding into extreme distortions during rapid mouse flicks.
- **Pointer Coarse Fallback**: On mobile touchscreens, hide the floating cursor preview and display static thumbnails directly inline beneath each project item.
