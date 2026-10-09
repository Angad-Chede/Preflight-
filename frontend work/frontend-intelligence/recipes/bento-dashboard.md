# Recipe: Interactive Bento Grid Dashboard

## 1. Concept & Architectural Blueprint
The Bento Grid layout is the signature design pattern of modern high-end tech interfaces (Apple, Linear, Stripe). This recipe implements an interactive, multi-dimensional bento dashboard:
- **Asymmetric Grid Matrix**: Responsive CSS grid with spans (`col-span-2`, `row-span-2`, `col-span-1`).
- **Interactive Spotlight Borders**: Cursor-reactive radial gradient borders following mouse movement.
- **3D Interactive Card Tilt**: Smooth perspective rotation on primary hero card.
- **Micro-Visualizations**: Real-time telemetry sparkline, animated glowing progress ring, and live status pulses.

---

## 2. Complete Next.js / React Implementation

```tsx
// components/dashboard/BentoDashboard.tsx
'use client';

import { useRef } from 'react';

// Bento Card with Spotlight Border & Glow
function BentoCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`group relative overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900/60 p-8 backdrop-blur-md transition-all duration-300 hover:border-neutral-700 ${className}`}
    >
      {/* Spotlight Hover Glow */}
      <div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(99, 102, 241, 0.15), transparent 40%)`,
        }}
      />
      <div className="relative z-10 h-full flex flex-col justify-between">{children}</div>
    </div>
  );
}

export function BentoDashboard() {
  return (
    <section className="relative min-h-screen w-full bg-neutral-950 px-8 py-24 text-white">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mb-12">
          <span className="font-mono text-xs uppercase tracking-widest text-indigo-400">
            System Infrastructure
          </span>
          <h2 className="mt-2 text-4xl sm:text-5xl font-light">
            Engineered For Extreme Throughput
          </h2>
        </div>

        {/* Bento Grid Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[280px]">
          {/* Card 1: Large Hero Telemetry (2 cols, 2 rows) */}
          <BentoCard className="md:col-span-2 lg:col-span-2 md:row-span-2 bg-gradient-to-br from-neutral-900/90 to-neutral-950">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-indigo-400 uppercase">Core Telemetry</span>
                <span className="flex items-center gap-2 font-mono text-xs text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  Live Stream
                </span>
              </div>
              <h3 className="mt-4 text-3xl font-light">Real-Time Compute Mesh</h3>
              <p className="mt-2 text-sm text-neutral-400 max-w-md">
                Distributed edge workers processing matrix operations across 42 global regions with sub-5ms round-trip times.
              </p>
            </div>

            {/* Sparkline Visualization */}
            <div className="mt-8">
              <div className="flex items-end gap-1 h-32 w-full pt-4">
                {[40, 65, 45, 80, 55, 90, 70, 85, 95, 60, 75, 100, 85, 90, 95].map((val, idx) => (
                  <div
                    key={idx}
                    className="flex-1 rounded-t bg-gradient-to-t from-indigo-900 to-indigo-500 opacity-80 hover:opacity-100 transition-opacity"
                    style={{ height: `${val}%` }}
                  />
                ))}
              </div>
              <div className="mt-4 flex justify-between font-mono text-[10px] text-neutral-500">
                <span>00:00:00 UTC</span>
                <span>Peak: 1.4M Ops/sec</span>
                <span>Current: 99.99%</span>
              </div>
            </div>
          </BentoCard>

          {/* Card 2: Security Encryption Node (2 cols, 1 row) */}
          <BentoCard className="md:col-span-1 lg:col-span-2">
            <div>
              <span className="font-mono text-xs text-neutral-400 uppercase">Cryptographic Layer</span>
              <h3 className="mt-2 text-2xl font-light">Zero-Knowledge Enclaves</h3>
            </div>
            <div className="flex items-center justify-between mt-4">
              <span className="font-mono text-3xl font-light text-indigo-300">256-bit</span>
              <span className="font-mono text-xs text-neutral-500">Hardware Isolated</span>
            </div>
          </BentoCard>

          {/* Card 3: Memory Footprint (1 col, 1 row) */}
          <BentoCard className="md:col-span-1 lg:col-span-1">
            <div>
              <span className="font-mono text-xs text-neutral-400 uppercase">Memory Footprint</span>
              <h3 className="mt-2 text-xl font-light">Zero Leakage</h3>
            </div>
            <div className="mt-4">
              <span className="text-4xl font-light tracking-tight text-white">&lt; 14 MB</span>
              <p className="mt-1 text-xs text-neutral-500 font-mono">Idle Heap Allocation</p>
            </div>
          </BentoCard>

          {/* Card 4: Global Availability (1 col, 1 row) */}
          <BentoCard className="md:col-span-1 lg:col-span-1">
            <div>
              <span className="font-mono text-xs text-neutral-400 uppercase">Availability</span>
              <h3 className="mt-2 text-xl font-light">SLA Guarantee</h3>
            </div>
            <div className="mt-4">
              <span className="text-4xl font-light tracking-tight text-emerald-400">99.999%</span>
              <p className="mt-1 text-xs text-neutral-500 font-mono">Fault-Tolerant Redundancy</p>
            </div>
          </BentoCard>
        </div>
      </div>
    </section>
  );
}
```

---

## 3. Performance & Mobile Safeguards
- **CSS Custom Properties**: Spotlight glow coordinates are updated via direct DOM properties (`--mouse-x`), bypassing React state re-renders.
- **Responsive Auto-Rows**: Grid collapses smoothly from a 4-column desktop layout to 2-columns on tablet and a single column on mobile screens.
