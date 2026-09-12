'use client';

import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
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
 * besoin.
 *
 * Il s'arrete des que quelqu'un le survole, le focalise ou y touche — un
 * defilement qui continue pendant qu'on lit est la premiere raison pour
 * laquelle on deteste les carrousels. Il respecte `prefers-reduced-motion`,
 * et le bouton de pause rend l'arret explicite : sur telephone, ni survol
 * ni focus ne permettent de le suspendre.
 */
export function Carousel({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  /** Arret demande par l'utilisateur : il survit au depart de la souris. */
  const [stopped, setStopped] = useState(false);
  /** Suspension passagere : survol, focus, doigt sur l'ecran. */
  const [hovered, setHovered] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);
    if (query.matches) setStopped(true);
  }, []);

  const go = useCallback(
    (next: number) => setIndex((next + slides.length) % slides.length),
    [slides.length],
  );

  const running = !stopped && !hovered && slides.length > 1;

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => go(index + 1), INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [index, running, go]);

  const current = slides[index];
  if (!current) return null;

  return (
    <section
      aria-roledescription="carrousel"
      aria-label="Comment ça marche"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={() => setHovered(false)}
      onTouchStart={() => setStopped(true)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(index + 1);
        if (e.key === 'ArrowLeft') go(index - 1);
      }}
      className="space-y-4"
    >
      {/*
        La region vivante porte le texte, pas l'illustration : c'est le
        titre et le corps qui changent, et c'est eux qu'une synthese vocale
        doit relire. Elle est atomique, sinon seule la phrase modifiee est
        annoncee, hors de son titre.
      */}
      <div
        className="grid items-center gap-6 md:grid-cols-[1fr_1.1fr]"
        aria-live="polite"
        aria-atomic
      >
        <div key={index} className={cn('space-y-3', !reduced && 'animate-fade-in')}>
          <p className="text-xs font-bold uppercase tracking-widest text-text-faint">
            Étape {index + 1} sur {slides.length}
          </p>
          <h3 className="signage text-2xl sm:text-3xl" style={{ textShadow: 'none' }}>
            {current.title}
          </h3>
          <p className="max-w-prose text-sm leading-relaxed text-text-muted">
            {current.body}
          </p>
        </div>

        <div
          key={`art-${index}`}
          className={cn(
            'overflow-hidden rounded-card border-2 border-bezel-dark bg-stage',
            !reduced && 'animate-fade-in',
          )}
        >
          {current.art}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {/*
          La pastille visible fait douze pixels, mais la zone cliquable en
          fait trente : un point de six pixels de large est une cible qu'on
          rate, au doigt comme a la souris.
        */}
        <div className="flex">
          {slides.map((slide, i) => (
            <button
              key={slide.title}
              type="button"
              aria-label={`Étape ${i + 1} : ${slide.title}`}
              aria-current={i === index ? 'true' : undefined}
              onClick={() => go(i)}
              className="flex h-8 w-8 items-center justify-center"
            >
              <span
                className={cn(
                  'h-3 w-3 rounded-full border-2 border-border-strong transition-colors',
                  i === index ? 'bg-accent' : 'bg-surface-sunken',
                )}
              />
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {slides.length > 1 ? (
            <button
              type="button"
              aria-label={stopped ? 'Reprendre le défilement' : 'Arrêter le défilement'}
              onClick={() => setStopped((value) => !value)}
              className="btn-3d flex h-10 w-10 items-center justify-center bg-surface-raised [--btn-lip:var(--color-border-strong)]"
            >
              {stopped ? (
                <Play className="h-4 w-4" aria-hidden />
              ) : (
                <Pause className="h-4 w-4" aria-hidden />
              )}
            </button>
          ) : null}
          <button
            type="button"
            aria-label="Étape précédente"
            onClick={() => go(index - 1)}
            className="btn-3d flex h-10 w-10 items-center justify-center bg-surface-raised [--btn-lip:var(--color-border-strong)]"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Étape suivante"
            onClick={() => go(index + 1)}
            className="btn-3d flex h-10 w-10 items-center justify-center bg-surface-raised [--btn-lip:var(--color-border-strong)]"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}
