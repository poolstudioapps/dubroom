'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { CHARACTER_COLOR_FALLBACK, characterColorVar } from '@/config/constants';
import type { HomeDemo, HomeDemoLine } from '@/lib/home-demo-types';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/**
 * La bande rythmo, en vitrine.
 *
 * Deux formes. Quand une scene est designee pour l'accueil, la vitrine la
 * joue : la video tourne en boucle et le texte de la preparation defile
 * sous la tete de lecture, cale sur elle, exactement comme dans le
 * studio. Sinon, ou si quoi que ce soit echoue, elle retombe sur une
 * demonstration ecrite, sans video, qui ne peut pas manquer.
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

interface LecteurYt {
  getCurrentTime(): number;
  mute(): void;
  playVideo(): void;
  destroy(): void;
}

interface EspaceYt {
  Player: new (cible: HTMLElement, options: Record<string, unknown>) => LecteurYt;
  PlayerState: { PLAYING: number };
}

declare global {
  interface Window {
    YT?: EspaceYt;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let promesseApi: Promise<EspaceYt> | null = null;

/** Le script du lecteur YouTube, charge une seule fois pour la page. */
function chargerApiYoutube(): Promise<EspaceYt> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (promesseApi) return promesseApi;
  promesseApi = new Promise((resoudre, rejeter) => {
    const precedent = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      precedent?.();
      if (window.YT) resoudre(window.YT);
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => {
      promesseApi = null;
      rejeter(new Error('Lecteur YouTube indisponible'));
    };
    document.head.appendChild(script);
  });
  return promesseApi;
}

function DemoScene({ demo }: { demo: HomeDemo }) {
  const t = useT();
  const cibleRef = useRef<HTMLDivElement>(null);
  const pisteRef = useRef<HTMLDivElement>(null);
  const lecteurRef = useRef<LecteurYt | null>(null);
  /**
   * La derniere heure lue sur le lecteur, et l'instant ou on l'a lue.
   *
   * `getCurrentTime` n'avance que par paliers de quelques centaines de
   * millisecondes : le texte sautait par a-coups. Entre deux paliers, on
   * prolonge donc a partir de l'horloge de l'ecran.
   */
  const horloge = useRef({ ms: demo.lines[0]?.start ?? 0, a: 0, lecture: false });

  const [fixe, setFixe] = useState(false);
  const [enLecture, setEnLecture] = useState(false);
  const [maintenant, setMaintenant] = useState(demo.lines[0]?.start ?? 0);

  const personnages = useMemo(
    () => new Map(demo.characters.map((c) => [c.key, c])),
    [demo.characters],
  );

  // ── Le lecteur ─────────────────────────────────────────────────────
  useEffect(() => {
    const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const economie =
      (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
        ?.saveData === true;
    if (reduit || economie) {
      setFixe(true);
      return;
    }

    let annule = false;
    // Apres la premiere peinture : le lecteur pese son poids, et le titre
    // de la page n'a pas a l'attendre.
    const depart = window.setTimeout(() => {
      chargerApiYoutube()
        .then((YT) => {
          if (annule || !cibleRef.current) return;
          lecteurRef.current = new YT.Player(cibleRef.current, {
            host: 'https://www.youtube-nocookie.com',
            videoId: demo.videoId,
            playerVars: {
              autoplay: 1,
              mute: 1,
              controls: 0,
              disablekb: 1,
              fs: 0,
              iv_load_policy: 3,
              loop: 1,
              playlist: demo.videoId,
              modestbranding: 1,
              playsinline: 1,
              rel: 0,
            },
            events: {
              // Muet par le code en plus du parametre : c'est ce qui
              // autorise la lecture automatique, et certains navigateurs
              // ne regardent que l'appel.
              onReady: (e: { target: LecteurYt }) => {
                e.target.mute();
                e.target.playVideo();
              },
              onStateChange: (e: { data: number }) => {
                const lecture = e.data === YT.PlayerState.PLAYING;
                horloge.current.lecture = lecture;
                horloge.current.a = performance.now();
                if (lecture) setEnLecture(true);
              },
            },
          });
        })
        .catch(() => setFixe(true));
    }, 500);

    return () => {
      annule = true;
      window.clearTimeout(depart);
      lecteurRef.current?.destroy();
      lecteurRef.current = null;
    };
  }, [demo.videoId]);

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
      const lecteur = lecteurRef.current;
      const h = horloge.current;

      if (lecteur && typeof lecteur.getCurrentTime === 'function') {
        const lu = lecteur.getCurrentTime() * 1000;
        const prolonge = h.lecture ? h.ms + (instant - h.a) : h.ms;
        // Un nouveau palier, ou un vrai saut — la boucle qui repart a zero.
        if (Math.abs(lu - prolonge) > 180 || (lu !== h.ms && !h.lecture)) {
          h.ms = lu;
          h.a = instant;
        }
      }

      const ms = h.lecture ? h.ms + (instant - h.a) : h.ms;
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
  }, [fixe]);

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
      {/* La scene. Le cadre est plus large que la video : les bandes noires
          du film tombent hors champ. */}
      <div className="demo-video aspect-[21/9]">
        {!fixe ? <div ref={cibleRef} /> : null}
        {/* L'affiche tient la place tant que le film ne joue pas. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://i.ytimg.com/vi/${demo.videoId}/hqdefault.jpg`}
          alt=""
          referrerPolicy="no-referrer"
          className={cn('demo-affiche', enLecture && 'opacity-0')}
        />
        <span className="absolute inset-x-0 bottom-2 text-center text-[0.65rem] font-bold uppercase tracking-[0.2em] text-stage-faint [text-shadow:0_1px_6px_rgb(0_0_0/0.8)]">
          {t.home.originalScene}
        </span>
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
      <div className="flex aspect-[16/7] items-end justify-center bg-gradient-to-b from-stage-raised/70 to-stage px-4 pb-3">
        <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-stage-faint">
          {t.home.originalScene}
        </span>
      </div>

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
