'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { CHARACTER_COLOR_FALLBACK, characterColorVar } from '@/config/constants';
import type { HomeDemo, HomeDemoLine } from '@/lib/home-demo-types';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/**
 * La bande rythmo, en vitrine.
 *
 * La video de la scene tourne en boucle et le texte de la preparation
 * defile sous la tete de lecture, cale sur elle, exactement comme dans le
 * studio. Sans scene, elle retombe sur une demonstration ecrite, sans
 * video, qui ne peut pas manquer.
 */
export function HeroRythmo({ demo }: { demo?: HomeDemo | null }) {
  return demo ? <DemoScene demo={demo} /> : <DemoEcrite />;
}

// ══════════════════════════════════════════════════════════════════════
// La vraie scene
// ══════════════════════════════════════════════════════════════════════

/**
 * La vitesse de defilement : deux cents pixels par seconde.
 *
 * C'est a peu pres la largeur qu'occupe une phrase dite a vitesse
 * normale, en corps de lecture. Plus lent, les repliques rapides se
 * chevauchent ; plus vite, la bande n'en montre qu'un morceau.
 */
const PX_PAR_MS = 0.2;
/** Ce qu'on dessine autour de l'instant : le reste est hors cadre. */
const AVANT_MS = 4500;
const APRES_MS = 2500;

/**
 * Le fondu enchaine de la boucle : une seconde au noir en fin de scene,
 * une seconde pour en sortir au debut.
 */
const FONDU_MS = 1000;

function DemoScene({ demo }: { demo: HomeDemo }) {
  const t = useT();
  const videoRef = useRef<HTMLVideoElement>(null);
  const pisteRef = useRef<HTMLDivElement>(null);
  const voileRef = useRef<HTMLDivElement>(null);

  const [fixe, setFixe] = useState(false);
  const [maintenant, setMaintenant] = useState(demo.lines[0]?.start ?? 0);

  const personnages = useMemo(
    () => new Map(demo.characters.map((c) => [c.key, c])),
    [demo.characters],
  );

  // ── La lecture ─────────────────────────────────────────────────────
  // La video est servie par le site : ni lecteur tiers, ni boutons a
  // masquer, ni dependance a une mise en ligne qui peut disparaitre.
  useEffect(() => {
    const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const economie =
      (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
        ?.saveData === true;
    if (reduit || economie) {
      setFixe(true);
      return;
    }

    const video = videoRef.current;
    if (!video) return;
    // Muet par le code en plus de l'attribut : React ne rend pas `muted`
    // cote serveur, et sans lui aucun navigateur ne lance la lecture seul.
    video.muted = true;
    const essai = video.play();
    // Mode economie d'energie, lecture automatique refusee : l'image fixe
    // prend la place plutot qu'un cadre noir.
    essai?.catch(() => setFixe(true));
  }, []);

  // ── Sans lecture : la bande reste posee sur la premiere replique ─────
  useEffect(() => {
    if (fixe && pisteRef.current) {
      pisteRef.current.style.transform = `translate3d(${-maintenant * PX_PAR_MS}px, 0, 0)`;
    }
  }, [fixe, maintenant]);

  // ── L'horloge ──────────────────────────────────────────────────────
  // Une seule boucle pour toute la vie du composant : elle ne depend pas
  // de l'etat qu'elle met a jour, sinon elle se relancerait a chaque fois.
  useEffect(() => {
    if (fixe) return;

    let image = 0;
    let dernierEtat = 0;
    const boucle = (instant: number) => {
      image = requestAnimationFrame(boucle);
      const video = videoRef.current;
      if (!video) return;

      const ms = video.currentTime * 1000;
      const duree =
        Number.isFinite(video.duration) && video.duration > 0
          ? video.duration * 1000
          : demo.durationMs;

      // Noir tant que rien ne joue, puis une seconde pour en sortir ; une
      // seconde pour y retourner avant que la boucle ne reparte.
      const demarree = video.readyState >= 2 && (ms > 0 || !video.paused);
      let voile = 1;
      if (demarree) {
        const entree = 1 - ms / FONDU_MS;
        const sortie = (ms - (duree - FONDU_MS)) / FONDU_MS;
        voile = Math.min(1, Math.max(0, entree, sortie));
      }
      if (voileRef.current) voileRef.current.style.opacity = voile.toFixed(3);

      if (pisteRef.current) {
        pisteRef.current.style.transform = `translate3d(${-ms * PX_PAR_MS}px, 0, 0)`;
      }
      // Le texte se deplace a chaque image ; ce qui est dessine, lui, n'a
      // besoin d'etre revu que quelques fois par seconde.
      if (instant - dernierEtat > 160) {
        dernierEtat = instant;
        setMaintenant(ms);
      }
    };
    image = requestAnimationFrame(boucle);
    return () => cancelAnimationFrame(image);
  }, [fixe, demo.durationMs]);

  const visibles = demo.lines.filter(
    (l) => l.end >= maintenant - APRES_MS && l.start <= maintenant + AVANT_MS,
  );
  const courante =
    demo.lines.find((l) => l.start <= maintenant && l.end >= maintenant) ??
    demo.lines.find((l) => l.start > maintenant) ??
    demo.lines[0];
  const perso = courante ? personnages.get(courante.character) : undefined;

  return (
    <div
      className="vitrine-rythmo relative overflow-hidden rounded-card border-2 border-bezel-dark bg-stage"
      role="img"
      aria-label={t.home.rythmoLabel}
    >
      {/* La scene, deja recadree en 21/9 et sans son. */}
      <div className="demo-video aspect-[21/9]">
        {fixe ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={demo.posterSrc}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              src={demo.videoSrc}
              muted
              loop
              playsInline
              autoPlay
              preload="auto"
              disablePictureInPicture
              disableRemotePlayback
              aria-hidden
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            />
            {/* Le voile : son opacite est reglee a chaque image par
                l'horloge, jamais par une transition, pour suivre la video
                exactement. */}
            <div
              ref={voileRef}
              className="pointer-events-none absolute inset-0 bg-black"
              style={{ opacity: 1 }}
              aria-hidden
            />
          </>
        )}
      </div>

      {/* La bande. La tete de lecture est fixe, c'est le texte qui passe. */}
      <div className="relative h-16 overflow-hidden border-t-2 border-bezel-dark bg-stage-raised/40 sm:h-20">
        <div className="absolute inset-y-0 left-1/2">
          <div ref={pisteRef} className="relative h-full" style={{ willChange: 'transform' }}>
            {visibles.map((ligne) => (
              <Replique
                key={`${ligne.start}-${ligne.end}`}
                ligne={ligne}
                couleur={characterColorVar(personnages.get(ligne.character)?.color ?? 'character-1')}
                passee={ligne.end < maintenant}
              />
            ))}
          </div>
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
          style={{
            backgroundColor: characterColorVar(perso?.color ?? 'character-1'),
          }}
          aria-hidden
        />
        <span className="text-xs font-bold uppercase tracking-wide text-stage-faint">
          {t.home.youDub}
        </span>
        <span className="truncate text-sm font-bold text-stage-text">{perso?.name}</span>
      </div>
    </div>
  );
}

/**
 * Une replique posee sur la bande, a sa place dans le temps.
 *
 * Elle occupe exactement la duree ou elle est dite. Si le texte ne tient
 * pas dans cette largeur, il est comprime, comme sur une vraie bande
 * rythmo : une replique rapide se lit serree, une replique lente
 * s'etale. Le chevauchement, lui, n'arrive jamais.
 */
function Replique({
  ligne,
  couleur,
  passee,
}: {
  ligne: HomeDemoLine;
  couleur: string;
  passee: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const largeur = Math.max(28, (ligne.end - ligne.start) * PX_PAR_MS);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'none';
    const naturelle = el.scrollWidth;
    const echelle = naturelle > largeur ? largeur / naturelle : 1;
    el.style.transform = `scaleX(${echelle})`;
  }, [ligne.text, largeur]);

  return (
    <span
      className="absolute top-1/2 -translate-y-1/2"
      style={{ left: ligne.start * PX_PAR_MS, width: largeur }}
    >
      <span
        ref={ref}
        className={cn(
          'inline-block origin-left whitespace-nowrap font-bold text-[clamp(0.95rem,2vw,1.3rem)] transition-opacity duration-500',
          passee && 'opacity-40',
        )}
        style={{ color: couleur }}
      >
        {ligne.text}
      </span>
    </span>
  );
}

// ══════════════════════════════════════════════════════════════════════
// La demonstration ecrite, en repli
// ══════════════════════════════════════════════════════════════════════

/*
 * Les couleurs des trois voix du repli.
 *
 * Le texte, lui, vient du dictionnaire : c'est une page d'accueil lue en
 * dix langues, et un extrait fige en francais y detonnait. Les repliques
 * sont ecrites pour l'occasion, comme les personnages qui les disent.
 */
const VOIX = ['character-1', 'character-4', 'character-2'] as const;

const STEP_MS = 3200;

/**
 * Dessinee en CSS, sans video ni image : rien a charger, et elle suit le
 * theme. Elle s'arrete si la personne a demande moins d'animation.
 */
function DemoEcrite() {
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

  // Le repli explicite n'est pas de la superstition : l'acces indexe est
  // verifie par le compilateur, et un tableau vide rendrait `undefined`.
  const repliques = t.home.demoLines;
  const line = repliques[index] ?? repliques[0] ?? { name: '', text: '' };
  const voix = VOIX[index % VOIX.length] ?? VOIX[0];
  const color = CHARACTER_COLOR_FALLBACK[voix] ?? '#4da3ff';

  return (
    <div
      className="vitrine-rythmo relative overflow-hidden rounded-card border-2 border-bezel-dark bg-stage"
      role="img"
      aria-label={t.home.rythmoLabel}
    >
      <div className="aspect-[16/7] bg-gradient-to-b from-stage-raised/70 to-stage" />

      <div className="relative border-t-2 border-bezel-dark bg-stage-raised/40 py-5">
        <div
          key={index}
          className={still ? '' : 'animate-rythmo-slide'}
          style={{ willChange: 'transform' }}
        >
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

      <div className="flex items-center gap-2 border-t-2 border-bezel-dark px-4 py-2.5">
        <span
          className="h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden
        />
        <span className="text-xs font-bold uppercase tracking-wide text-stage-faint">
          {t.home.youDub}
        </span>
        <span className="text-sm font-bold text-stage-text">{line.name}</span>
      </div>
    </div>
  );
}
