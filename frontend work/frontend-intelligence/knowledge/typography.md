# Technique: Kinetic Typography & SplitText Reveals

## Technique Name
Kinetic Typography & SplitText Reveals

## Purpose
Transforms static editorial typography into dynamic, cinematic narrative statements via masked line slides, character staggers, word-by-word scroll highlighting, and cyberpunk text scrambling.

## Difficulty
Intermediate

## Dependencies
- `gsap`: `^3.12.5`
- `@gsap/react`: `^2.1.1`

## When to Use
- Hero headlines, brand manifestos, and section introduction titles.
- Storytelling paragraphs where words light up as the reader scrolls.
- Cyberpunk or sci-fi tech reveals (text decode scramble).

## When NOT to Use
- Dense body copy, legal terms, documentation, or user input fields.
- Rapidly updating live data feeds.

## Implementation Strategy
1. **The Masked Line Slide Pattern**:
   - Wrap each line of text in an outer container with `overflow: hidden`.
   - Animate the inner line element from `yPercent: 120` to `yPercent: 0` with an editorial easing curve (`power3.out`).
2. **Screen Reader Safety**:
   - Never expose fragmented character spans to screen readers without an un-split `sr-only` fallback. Always attach `aria-hidden="true"` to animated tokens and render the complete sentence in `<span className="sr-only">`.
3. **Scroll Reading Highlight**:
   - Split paragraph text into word spans with a dimmed base color (`neutral-600`), tweening them to white (`#ffffff`) as scroll progresses.

## Example Code Pattern
```tsx
'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

export function MaskedEditorialTitle({ lines }: { lines: string[] }) {
  const container = useRef<HTMLHeadingElement>(null);
  const fullText = lines.join(' ');

  useGSAP(
    () => {
      const lineEls = container.current?.querySelectorAll('.line-inner');
      if (!lineEls) return;

      gsap.fromTo(
        lineEls,
        { yPercent: 120, rotateZ: 2 },
        {
          yPercent: 0,
          rotateZ: 0,
          duration: 1.2,
          ease: 'power3.out',
          stagger: 0.15,
          scrollTrigger: {
            trigger: container.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    },
    { scope: container }
  );

  return (
    <h2 ref={container} className="text-6xl md:text-8xl font-light text-white tracking-tight" aria-label={fullText}>
      <span className="sr-only">{fullText}</span>
      {lines.map((line, idx) => (
        <span key={idx} className="block overflow-hidden py-1" aria-hidden="true">
          <span className="line-inner block will-change-transform">{line}</span>
        </span>
      ))}
    </h2>
  );
}
```

## Performance Cost
- Animating `yPercent` utilizes GPU hardware transform layers.
- Avoid splitting documents with over 200 words into individual DOM spans to prevent DOM bloat.

## Mobile Behavior
- Ensure responsive font sizing classes (`text-4xl md:text-7xl`) are used so long lines don't wrap awkwardly across small mobile viewports.

## Accessibility Concerns
- Screen reader accessibility is paramount. Using `aria-hidden="true"` on the split tokens and providing `<span className="sr-only">` prevents screen readers from announcing words letter-by-letter.
- Bypass animations if `prefers-reduced-motion` is active.

## Source Repository
- [`MuhammedAlii/high-end`](file:///c:/Users/USER/frontend%20work/frontend-intelligence/sources/high-end.md)
- [`itsjwill/motion-primitives-website`](file:///c:/Users/USER/frontend%20work/frontend-intelligence/sources/motion-primitives.md)
