'use client';

import { Pause, Play } from 'lucide-react';
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
        Les quatre legendes occupent la meme case.
        Elles n'ont pas la meme longueur : un titre sur deux lignes et un
        autre sur trois, et le bloc changeait de hauteur a chaque vue —
        les pastilles et tout ce qui suit sautaient. Empilees dans une
        seule case de grille, la case prend la hauteur de la plus haute
        et n'en bouge plus, quelle que soit la langue ou la largeur.
        Aucune hauteur ecrite en dur : ce serait juste aujourd'hui, en
        francais, et faux des la premiere traduction.

        Les inactives restent en place mais `invisible` : elles tiennent
        la hauteur sans etre lues par une synthese vocale, que
        `visibility: hidden` ecarte deja de l'arbre d'accessibilite.

        La region vivante porte le texte, pas l'illustration : c'est lui
        qui change et qu'une synthese vocale doit relire. Atomique, sinon
        seule la phrase modifiee est annoncee, hors de son titre.
      */}
      <div className="grid text-center" aria-live="polite" aria-atomic>
        {slides.map((slide, i) => {
          const actif = i === index;
          return (
            <div
              key={slide.title}
              className={cn(
                'col-start-1 row-start-1 space-y-2',
                actif ? 'visible' : 'invisible',
              )}
              aria-hidden={!actif}
              inert={!actif ? true : undefined}
            >
              <p className="text-xs font-bold uppercase tracking-widest text-text-faint">
                Étape {i + 1} sur {slides.length}
              </p>
              <h3
                key={actif ? `on-${i}` : `off-${i}`}
                className={cn(
                  'signage text-2xl sm:text-3xl',
                  actif && !reduced && 'animate-fade-in',
                )}
                style={{ textShadow: 'none' }}
              >
                {slide.title}
              </h3>
              <p className="mx-auto max-w-prose text-sm leading-relaxed text-text-muted">
                {slide.body}
              </p>
            </div>
          );
        })}
      </div>

      {/*
        Les pastilles, et rien d'autre.
        Les deux fleches disaient « precedent » et « suivant » a cote de
        quatre points qui disaient deja ou l'on est et permettaient d'y
        aller directement. Trois facons de faire la meme chose sous un
        seul carrousel, c'est deux de trop : restent les points, qui sont
        aussi le seul des trois a montrer la longueur du parcours.
      */}
      <div className="flex items-center justify-center gap-1">
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
              className="group flex h-10 w-10 items-center justify-center"
            >
              <span
                className={cn(
                  'rounded-full border-2 border-border-strong transition-all',
                  i === index
                    ? 'h-3 w-7 bg-accent'
                    : 'h-3 w-3 bg-surface-sunken group-hover:w-5 group-hover:bg-border-strong',
                )}
              />
            </button>
          ))}
        </div>

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
