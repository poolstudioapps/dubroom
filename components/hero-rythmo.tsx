'use client';

import { useEffect, useRef, useState } from 'react';

import { CHARACTER_COLOR_FALLBACK } from '@/config/constants';
import { useT } from '@/lib/i18n';

/** Ce que verrait quelqu'un en train de doubler, en boucle. */
/*
 * Des repliques courtes, et c'est une contrainte, pas un gout : la bande
 * fait la largeur d'une colonne d'accueil. Une phrase longue sortait du
 * cadre et se lisait comme un defaut d'affichage, alors que c'est
 * justement la premiere chose que voit un visiteur.
 */
/*
 * Les couleurs des trois voix de la vitrine.
 *
 * Le texte, lui, vient du dictionnaire : c'est une page d'accueil lue en
 * dix langues, et un extrait fige en francais y detonnait. Les repliques
 * sont ecrites pour l'occasion, comme les personnages qui les disent.
 */
const VOIX = ['character-1', 'character-4', 'character-2'] as const;

const STEP_MS = 3200;

/**
 * La bande rythmo, en vitrine.
 *
 * L'accueil montrait quatre schemas fixes. Or ce qui se raconte mal et se
 * comprend d'un coup d'oeil, c'est precisement ca : du texte colore qui
 * defile sous une tete de lecture, et qu'on lit en parlant. Autant le
 * montrer en mouvement des la premiere seconde.
 *
 * Dessinee en CSS, sans video ni image : rien a charger, et elle suit le
 * theme. Elle s'arrete si la personne a demande moins d'animation.
 */
export function HeroRythmo() {
  const t = useT();
  const [index, setIndex] = useState(0);
  const [still, setStill] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStill(true);
      return;
    }
    timer.current = window.setInterval(
      () => setIndex((i) => (i + 1) % VOIX.length),
      STEP_MS,
    );
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, []);

  // La replique vient du dictionnaire, la couleur de la liste locale :
  // les deux sont indexees par le meme rang.
  // Le repli explicite n'est pas de la superstition : l'acces indexe est
  // verifie par le compilateur, et un tableau vide rendrait `undefined`.
  const repliques = t.home.demoLines;
  const line = repliques[index] ?? repliques[0] ?? { name: '', text: '' };
  const voix = VOIX[index % VOIX.length] ?? VOIX[0];
  const color = CHARACTER_COLOR_FALLBACK[voix] ?? '#4da3ff';

  return (
    <div
      className="relative overflow-hidden rounded-card border-2 border-bezel-dark bg-stage"
      role="img"
      aria-label={t.home.rythmoLabel}
    >
      {/* Le cadre image, suggere par un simple aplat plus clair. */}
      <div className="flex aspect-[16/7] items-end justify-center bg-gradient-to-b from-stage-raised/70 to-stage px-4 pb-3">
        <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-stage-faint">
          {t.home.originalScene}
        </span>
      </div>

      {/* La bande. La tete de lecture est fixe, c'est le texte qui passe. */}
      <div className="relative border-t-2 border-bezel-dark bg-stage-raised/40 py-5">
        <div
          key={index}
          className={still ? '' : 'animate-rythmo-slide'}
          style={{ willChange: 'transform' }}
        >
          {/*
            La taille suit la largeur disponible. La bande occupe une
            colonne d'accueil, dont la largeur depend du poste de
            television qui l'entoure : une taille fixe finissait toujours
            par rogner une lettre d'un cote ou de l'autre.
          */}
          <p
            className="whitespace-nowrap px-2 text-center font-bold text-[clamp(0.85rem,2.1vw,1.3rem)]"
            style={{ color }}
          >
            {line.text}
          </p>
        </div>

        <span
          className="pointer-events-none absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-accent"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent"
          aria-hidden
        />
      </div>

      {/* Qui parle, en clair : c'est la question qu'on se pose en doublant. */}
      <div className="flex items-center gap-2 border-t-2 border-bezel-dark px-4 py-2.5">
        <span
          className="h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden
        />
        <span className="text-xs font-bold uppercase tracking-wide text-stage-faint">
          tu doubles
        </span>
        <span className="text-sm font-bold text-stage-text">{line.name}</span>
      </div>
    </div>
  );
}
