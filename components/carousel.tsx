'use client';

import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

export interface Slide {
  title: string;
  body: string;
  art: React.ReactNode;
}

const INTERVAL_MS = 5_500;

/**
 * Carrousel de presentation.
 *
 * Sans dependance : une bibliotheque ferait ici dix fois le poids du
 * besoin.
 *
 * Deux choses ont change, et la premiere explique la seconde.
 *
 * Il s'arretait au survol. C'est un reflexe de bon eleve — un defilement
 * qui continue pendant qu'on lit agace — sauf qu'ici le carrousel occupe
 * le milieu de la page : la souris s'y pose sans y penser, et le
 * carrousel restait fige. Il ne defile donc plus que sur demande
 * explicite : le bouton de pause, ou le fait de toucher l'ecran. Une
 * personne qui veut lire tranquillement a un bouton pour ca, ce qui vaut
 * mieux qu'un comportement qu'elle n'a pas demande et ne comprend pas.
 *
 * Et les vues sont desormais empilees sur une seule colonne, centrees,
 * illustration puis texte. En deux colonnes, la partie gauche etait
 * ancree et seule l'image changeait : on ne voyait pas que c'etait un
 * carrousel.
 *
 * `prefers-reduced-motion` reste respecte : plus de defilement
 * automatique, plus de glissement, on passe d'une vue a l'autre a la
 * main.
 */
export function Carousel({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  /** Arret demande : par le bouton, par un doigt, ou par le systeme. */
  const [stopped, setStopped] = useState(false);
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

  const running = !stopped && slides.length > 1;

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
      onTouchStart={() => setStopped(true)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(index + 1);
        if (e.key === 'ArrowLeft') go(index - 1);
      }}
      className="mx-auto max-w-2xl space-y-5"
    >
      {/*
        Le glissement se joue sur une piste large de toutes les vues,
        qu'on decale d'une largeur a chaque pas. C'est ce qui donne le
        mouvement lateral qu'on attend d'un carrousel : un fondu sur
        place ne se lit pas comme un defilement.
      */}
      <div className="overflow-hidden rounded-card border-2 border-bezel-dark bg-stage">
        <div
          className={cn(
            'flex',
            !reduced && 'transition-transform duration-500 ease-out',
          )}
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((slide, i) => (
            <div
              key={slide.title}
              className="w-full shrink-0"
              // Les vues hors champ sont retirees du parcours au clavier
              // et de la lecture d'ecran : sinon la tabulation traverse
              // quatre illustrations invisibles.
              aria-hidden={i !== index}
              inert={i !== index ? true : undefined}
            >
              {slide.art}
            </div>
          ))}
        </div>
      </div>

      {/*
        La region vivante porte le texte, pas l'illustration : c'est lui
        qui change et qu'une synthese vocale doit relire. Atomique, sinon
        seule la phrase modifiee est annoncee, hors de son titre.
      */}
      <div className="space-y-2 text-center" aria-live="polite" aria-atomic>
        <p className="text-xs font-bold uppercase tracking-widest text-text-faint">
          Étape {index + 1} sur {slides.length}
        </p>
        <h3
          key={index}
          className={cn(
            'signage text-2xl sm:text-3xl',
            !reduced && 'animate-fade-in',
          )}
          style={{ textShadow: 'none' }}
        >
          {current.title}
        </h3>
        <p className="mx-auto max-w-prose text-sm leading-relaxed text-text-muted">
          {current.body}
        </p>
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          aria-label="Étape précédente"
          onClick={() => go(index - 1)}
          className="btn-3d flex h-10 w-10 items-center justify-center bg-surface-raised [--btn-lip:var(--color-border-strong)]"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>

        {/*
          La pastille visible fait douze pixels, mais la zone cliquable en
          fait trente-deux : un point de six pixels de large est une cible
          qu'on rate, au doigt comme a la souris.
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
                  'rounded-full border-2 border-border-strong transition-all',
                  i === index ? 'h-3 w-6 bg-accent' : 'h-3 w-3 bg-surface-sunken',
                )}
              />
            </button>
          ))}
        </div>

        <button
          type="button"
          aria-label="Étape suivante"
          onClick={() => go(index + 1)}
          className="btn-3d flex h-10 w-10 items-center justify-center bg-surface-raised [--btn-lip:var(--color-border-strong)]"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>

        {slides.length > 1 ? (
          <button
            type="button"
            aria-label={stopped ? 'Reprendre le défilement' : 'Arrêter le défilement'}
            onClick={() => setStopped((value) => !value)}
            className="ml-1 flex h-10 w-10 items-center justify-center rounded-lg text-text-faint transition-colors hover:bg-surface hover:text-text"
          >
            {stopped ? (
              <Play className="h-4 w-4" aria-hidden />
            ) : (
              <Pause className="h-4 w-4" aria-hidden />
            )}
          </button>
        ) : null}
      </div>
    </section>
  );
}
