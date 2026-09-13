'use client';

import { useEffect, useRef, useState } from 'react';

/** Les films de fond, et l'image fixe qui les remplace au besoin. */
const FILMS = {
  /** Quelqu'un qui double, casque sur les oreilles. */
  cinema: { video: '/video/hero-cinema.mp4', image: '/video/hero-cinema.jpg' },
  /** Une bande d'amis qui rit devant l'ecran. */
  communaute: { video: '/video/communaute.mp4', image: '/video/communaute.jpg' },
  /** Quelqu'un qui prepare une scene, concentre devant son ecran. */
  guides: { video: '/video/guides.mp4', image: '/video/guides.jpg' },
} as const;

/**
 * La video plein cadre derriere les pages de presentation.
 *
 * Elle montre le geste avant qu'on ait lu une ligne : quelqu'un qui
 * double, casque sur les oreilles. La communaute a la sienne, des amis
 * qui rient sur un canape : c'est ce qu'on vient y chercher.
 *
 * Trois cas ou elle cede la place a une image fixe : le mouvement reduit
 * demande par le systeme, l'economie de donnees, et une lecture
 * automatique refusee. Dans les trois, une image du film tient le meme
 * role sans rien couter.
 */
export function HeroBackdrop({ variant = 'cinema' }: { variant?: keyof typeof FILMS }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [fixe, setFixe] = useState(false);
  const film = FILMS[variant];

  useEffect(() => {
    const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const economie =
      (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
        ?.saveData === true;
    setFixe(reduit || economie);
  }, []);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    // `muted` pose par le code en plus de l'attribut : certains navigateurs
    // mobiles ne tiennent compte que de la propriete pour autoriser la
    // lecture automatique.
    video.muted = true;
    video.play().catch(() => setFixe(true));
  }, [fixe]);

  return (
    <div className="hero-fond" aria-hidden>
      {fixe ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={film.image} alt="" />
      ) : (
        <video
          ref={ref}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={film.image}
        >
          {/*
            Un seul format. Le WebM compresse pesait plus lourd que le MP4
            a qualite egale, et Chrome l'aurait pris en premier.
          */}
          <source src={film.video} type="video/mp4" />
        </video>
      )}
    </div>
  );
}
