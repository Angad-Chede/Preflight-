# Pattern: Bento Card (Asymmetric Grid Tile)

## Problem Statement
Modern dashboards and feature grids demand asymmetric layout tiles with integrated telemetry, status badges, and interactive spotlight borders that seamlessly reflow across mobile, tablet, and desktop viewports.

---

## Architectural Solution
1. Pair CSS Grid auto-rows (`grid-cols-1 md:grid-cols-3 lg:grid-cols-4 auto-rows-[280px]`) with column/row spans (`col-span-2`, `row-span-2`).
2. Encapsulate spotlight borders and internal telemetry components (sparklines, uptime badges, progress meters) inside reusable tiles.
3. Handle responsive reflow by dropping spans to `col-span-1` on mobile screens.

---

## Production Implementation

```tsx
// components/cards/BentoCard.tsx
'use client';

import { SpotlightCard } from './SpotlightCard';

interface BentoMetricCardProps {
  category: string;
  title: string;
  metric: string;
  subtext: string;
  status?: 'active' | 'warning' | 'idle';
  className?: string;
}

export function BentoMetricCard({
  category,
  title,
  metric,
  subtext,
  status = 'active',
  className = '',
}: BentoMetricCardProps) {
  return (
    <SpotlightCard className={`flex flex-col justify-between ${className}`}>
      <div>
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs uppercase text-indigo-400">{category}</span>
          {status === 'active' && (
            <span className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              Live
            </span>
          )}
        </div>
        <h4 className="mt-2 text-xl font-light text-white">{title}</h4>
      </div>

      <div className="mt-6">
        <span className="text-4xl font-light tracking-tight text-white">{metric}</span>
        <p className="mt-1 font-mono text-xs text-neutral-500">{subtext}</p>
      </div>
    </SpotlightCard>
  );
}
```

---

## Key Benefits
- **Composable**: Integrates seamlessly with the Bento Dashboard recipe.
- **Consistent Visual Language**: Leverages shared spotlight glow and dark-mode styling.
- **Responsive**: Adapts gracefully to all screen dimensions.
