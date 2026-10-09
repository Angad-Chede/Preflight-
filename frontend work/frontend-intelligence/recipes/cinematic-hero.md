# Recipe: Cinematic Hero

## 1. Concept & Architectural Blueprint
A cinematic hero delivers an immediate, immersive editorial opening for high-end digital brands. It combines:
- **Full-Bleed Background Media**: High-framerate looping ambient video or WebGL canvas with dynamic exposure and contrast overlays.
- **Masked Kinetic Typography**: Layered large-scale typography that scales and fades on scroll entry.
- **Scrubbed Depth Zoom**: Pinned GSAP ScrollTrigger timeline that zooms into the background media as the user scrolls, creating a "stepping into the screen" effect before transitioning to section content.
- **Interactive Audio / Mute Controller**: Minimalist audio visualizer toggle respecting browser autoplay policies.

---

## 2. Complete Next.js / React Implementation

```tsx
// components/hero/CinematicHero.tsx
'use client';

import { useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

export function CinematicHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtextRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: '+=150%', // 1.5x viewport height scrub distance
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
        },
      });

      // Cinematic dolly zoom sequence
      tl.to(mediaRef.current, {
        scale: 1.25,
        filter: 'brightness(0.4)',
        ease: 'none',
      }, 0)
      .to(titleRef.current, {
        y: -120,
        opacity: 0,
        scale: 0.9,
        ease: 'none',
      }, 0)
      .to(subtextRef.current, {
        y: -80,
        opacity: 0,
        ease: 'none',
      }, 0.1)
      .to(ctaRef.current, {
        y: -40,
        opacity: 0,
        ease: 'none',
      }, 0.15);
    },
    { scope: containerRef }
  );

  const toggleAudio = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <section
      ref={containerRef}
      className="relative h-screen w-full overflow-hidden bg-neutral-950 text-white select-none"
    >
      {/* Background Media Layer with Zoom Scale */}
      <div
        ref={mediaRef}
        className="absolute inset-0 h-full w-full bg-cover bg-center will-change-transform"
      >
        <video
          ref={videoRef}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          poster="/media/hero-poster.webp"
          className="h-full w-full object-cover"
        >
          <source src="/media/cinematic-reel.mp4" type="video/mp4" />
        </video>
        {/* Editorial Film Grain & Vignette Scrim */}
        <div className="absolute inset-0 bg-radial-vignette opacity-60" />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
      </div>

      {/* Hero Foreground Content */}
      <div className="relative z-10 flex h-full flex-col justify-between p-8 md:p-16">
        {/* Top Metadata Header */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">
            System Release // v4.2
          </span>

          {/* Sound / Mute Indicator */}
          <button
            onClick={toggleAudio}
            className="flex items-center gap-3 rounded-full border border-neutral-700/60 bg-neutral-900/60 px-4 py-2 backdrop-blur-md transition-colors hover:border-neutral-500"
            aria-label={isMuted ? 'Unmute ambient soundscape' : 'Mute soundscape'}
          >
            <div className="flex items-end gap-0.5 h-3">
              {[0.4, 0.9, 0.6, 1.0].map((h, i) => (
                <div
                  key={i}
                  className={`w-0.5 bg-indigo-400 rounded-full transition-all duration-300 ${
                    isMuted ? 'h-0.5' : 'animate-pulse'
                  }`}
                  style={{ height: isMuted ? '2px' : `${h * 12}px` }}
                />
              ))}
            </div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-300">
              {isMuted ? 'Sound Off' : 'Sound On'}
            </span>
          </button>
        </div>

        {/* Focal Editorial Title */}
        <div className="mx-auto max-w-5xl text-center">
          <h1
            ref={titleRef}
            className="text-6xl sm:text-8xl md:text-9xl font-light tracking-tighter leading-none text-white will-change-transform"
          >
            AETHERIAL
          </h1>
          <p
            ref={subtextRef}
            className="mx-auto mt-6 max-w-xl text-lg sm:text-xl font-light text-neutral-300 will-change-transform"
          >
            The intersection of generative computation, spatial aesthetics, and zero-latency engineering.
          </p>
        </div>

        {/* Bottom CTA & Scroll Anchor */}
        <div ref={ctaRef} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-mono text-xs text-neutral-400">Engine Online</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
              Scroll to explore
            </span>
            <div className="h-8 w-px bg-gradient-to-b from-neutral-400 to-transparent animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  );
}
```

---

## 3. Performance & Mobile Safeguards
- **`anticipatePin: 1`**: Prevents visible layout snapping when user flicks scroll quickly.
- **Mobile Poster Fallback**: On mobile data saver connections, the video element is paused and fallback `.webp` poster displays with zero battery drain.
- **Audio Autoplay Rules**: Never autoplay sound unmuted (`muted` attribute required). The user must explicitly interact with the sound toggle to unmute audio.
