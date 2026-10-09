# Text Animations & Kinetic Typography Choreography

## 1. What the Technique Is
Text animation choreography encompasses splitting typography into structural tokens (lines, words, characters) and executing coordinated reveals—such as vertical translations masked by `overflow: hidden` parent containers, staggered character opacity rises, or scroll-scrubbed reading highlights.

---

## 2. When to Use It
- Hero section editorial headlines and brand manifestos.
- Section transition statements and high-impact callouts.
- Storytelling paragraphs where sentences highlight as the user scrolls through the narrative.

---

## 3. When NOT to Use It
- Long body copy, documentation, privacy policies, or legal terms.
- Low-contrast microcopy or UI form labels.
- When `prefers-reduced-motion: reduce` is active.
- Dynamic data that rapidly refreshes (e.g. live stock tickers, chat feeds).

---

## 4. Implementation Pattern
1. **The Masked Line Slide Pattern**: Each line of text is wrapped in an outer container with `overflow: hidden`. The inner text element animates from `transform: translateY(110%)` to `translateY(0%)`. This creates a crisp, razor-sharp entrance without clipping artifacts.
2. **Accessible DOM Preservation**: When splitting text into individual spans for character/word animations, ensure screen readers do not read fragmented characters one-by-one. Use `aria-hidden="true"` on the split tokens and provide the full sentence in a screen-reader-only element (`sr-only`) or `aria-label`.
3. **Scroll-Scrubbed Reading Highlight**: Render text with a dim base color (e.g. `neutral-600`), and animate words or characters to bright white (`neutral-100`) as the scroll progress passes each word's vertical threshold.

---

## 5. React / Next.js Example

```tsx
'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

interface MaskedHeadlineProps {
  lines: string[];
}

export function MaskedHeadline({ lines }: MaskedHeadlineProps) {
  const containerRef = useRef<HTMLHeadingElement>(null);
  const fullText = lines.join(' ');

  useGSAP(
    () => {
      const lineElements = containerRef.current?.querySelectorAll('.line-inner');
      if (!lineElements || lineElements.length === 0) return;

      gsap.fromTo(
        lineElements,
        {
          yPercent: 120,
          rotateZ: 3,
        },
        {
          yPercent: 0,
          rotateZ: 0,
          duration: 1.2,
          ease: 'power3.out',
          stagger: 0.15,
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <h2
      ref={containerRef}
      className="text-4xl sm:text-6xl md:text-7xl font-light tracking-tight text-white"
      aria-label={fullText}
    >
      <span className="sr-only">{fullText}</span>
      {lines.map((line, idx) => (
        <span key={idx} className="block overflow-hidden py-1" aria-hidden="true">
          <span className="line-inner block will-change-transform">
            {line}
          </span>
        </span>
      ))}
    </h2>
  );
}

// Scroll-scrubbed paragraph reading highlight
export function ScrollReadingParagraph({ text }: { text: string }) {
  const containerRef = useRef<HTMLParagraphElement>(null);
  const words = text.split(' ');

  useGSAP(
    () => {
      const wordElements = containerRef.current?.querySelectorAll('.word');
      if (!wordElements) return;

      gsap.fromTo(
        wordElements,
        { color: '#52525b', opacity: 0.4 },
        {
          color: '#ffffff',
          opacity: 1,
          stagger: 0.1,
          ease: 'none',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 75%',
            end: 'bottom 45%',
            scrub: 0.5,
          },
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <p
      ref={containerRef}
      className="max-w-3xl text-2xl md:text-4xl font-light leading-relaxed text-zinc-600"
      aria-label={text}
    >
      <span className="sr-only">{text}</span>
      {words.map((word, idx) => (
        <span key={idx} className="word inline-block mr-2" aria-hidden="true">
          {word}
        </span>
      ))}
    </p>
  );
}
```

---

## 6. Dependencies
- `gsap`: `^3.12.0`
- `@gsap/react`: `^2.1.0`

---

## 7. Performance Considerations
- **Avoid Layout Recalculations**: Use `yPercent: 120` rather than `y: "120px"`. Percentages on transforms are GPU hardware-accelerated.
- **Do not split 1,000 words into 1,000 separate DOM spans**: This bloats DOM nodes, increases memory pressure, and causes painting bottlenecks. Limit splitting to high-visibility editorial headings and focal quotes.

---

## 8. Mobile Considerations
- On small screens, text wraps across more lines than on desktop. Using fixed array line splits like `lines={["Title Line 1", "Line 2"]}` can look awkward if line lengths don't match mobile screen widths.
- Test wrapping behavior with responsive typography classes (`text-3xl sm:text-5xl`).

---

## 9. Accessibility Considerations
- **Screen Reader Protection (Mandatory)**: Splitting `"HERO"` into `<span>H</span><span>E</span><span>R</span><span>O</span>` can cause screen readers to announce "H, E, R, O" instead of "Hero". Always attach `aria-hidden="true"` to animated tokens and render an un-split `<span className="sr-only">HERO</span>`.
- Check `prefers-reduced-motion` and render static text with 0ms transition.

---

## 10. Common Mistakes
1. **Clipping descenders**: Letters with descenders (`g`, `y`, `p`, `j`) get cut off at the bottom of the mask. Always add `padding-bottom` (e.g., `py-1` or `pb-2`) to the outer mask wrapper.
2. **Missing whitespace in word splits**: Forgetting `mr-2` or an explicit non-breaking space between split words causes all words to collide into a continuous unbroken string.
3. **Screen reader degradation**: Splitting text into raw spans without ARIA labels, creating broken auditory experiences for assistive tech.

---

## 11. Related Patterns
- `gsap-timelines-scrolltrigger.md`
- `accessibility-reduced-motion.md`
- `cinematic-hero.md`

---

## 12. Source References
- [High-End Repository Teardown](../sources/high-end.md)
- [AETHER Boilerplate Teardown](../sources/aether-boilerplate.md)
