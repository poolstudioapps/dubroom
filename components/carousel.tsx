'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

export interface Slide {
  title: string;
  body: string;
  /** Illustration dessinee en SVG : rien a charger, tout suit le theme. */
  art: React.ReactNode;
}

const INTERVAL_MS = 6_000;

/**
 * Carrousel de presentation.
 *
 * Sans dependance : une bibliotheque ferait ici dix fois le poids du
 * besoin. Il s'arrete des que quelqu'un le survole, le focalise ou
 * interagit — un defilement qui continue pendant qu'on lit est la
 * premiere raison pour laquelle on deteste les carrousels. Il respecte
 * aussi `prefers-reduced-motion`.
 */
export function Carousel({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced.current) setPaused(true);
  }, []);

  const go = useCallback(
    (next: number) => setIndex((next + slides.length) % slides.length),
    [slides.length],
  );

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const timer = window.setInterval(() => go(index + 1), INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [index, paused, go, slides.length]);

  const current = slides[index];
  if (!current) return null;

  return (
    <section
      className="space-y-4"
      aria-roledescription="carrousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(reduced.current)}
      onFocusCapture={() => setPaused(true)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(index + 1);
        if (e.key === 'ArrowLeft') go(index - 1);
      }}
    >
      <div className="grid items-center gap-6 md:grid-cols-[1fr_1.1fr]">
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-text-faint">
            {index + 1} / {slides.length}
          </p>
          <h2 className="signage text-3xl" style={{ textShadow: 'none' }}>
            {current.title}
          </h2>
          <p className="max-w-prose text-sm leading-relaxed text-text-muted">
            {current.body}
          </p>
        </div>

        <div
          className="overflow-hidden rounded-card border-2 border-bezel-dark bg-stage"
          aria-live="polite"
        >
          {current.art}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          {slides.map((slide, i) => (
            <button
              key={slide.title}
              type="button"
              aria-label={`Aller à « ${slide.title} »`}
              aria-current={i === index}
              onClick={() => go(i)}
              className={cn(
                'h-3 w-3 rounded-full border-2 border-border-strong transition-colors',
                i === index ? 'bg-accent' : 'bg-surface-sunken hover:bg-surface',
              )}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Précédent"
            onClick={() => go(index - 1)}
            className="btn-3d flex h-9 w-9 items-center justify-center bg-surface-raised [--btn-lip:var(--color-border-strong)]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Suivant"
            onClick={() => go(index + 1)}
            className="btn-3d flex h-9 w-9 items-center justify-center bg-surface-raised [--btn-lip:var(--color-border-strong)]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
