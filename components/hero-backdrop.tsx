'use client';

import { useEffect, useRef, useState } from 'react';

import { useLiveTheme } from '@/lib/theme';

/**
 * La video plein cadre derriere l'accueil, pour la peau cinema.
 *
 * Elle montre le geste avant qu'on ait lu une ligne : quelqu'un qui
 * double, casque sur les oreilles. C'est ce que font les sites dont la
 * peau s'inspire, et c'est ce qui se comprend le plus vite.
 *
 * Rendue par un composant et non cachee en CSS : une balise `video` en
 * `display: none` peut quand meme etre telechargee, et les deux autres
 * peaux n'ont rien a faire de quelques megaoctets de film.
 *
 * Trois cas ou elle cede la place a une image fixe : le mouvement reduit
 * demande par le systeme, l'economie de donnees, et une lecture
 * automatique refusee. Dans les trois, la premiere image du film tient
 * le meme role sans rien couter.
 */
export function HeroBackdrop() {
  const theme = useLiveTheme();
  const ref = useRef<HTMLVideoElement>(null);
  const [fixe, setFixe] = useState(false);

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
  }, [theme, fixe]);

  if (theme !== 'cinema') return null;

  return (
    <div className="hero-fond" aria-hidden>
      {fixe ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/video/hero-cinema.jpg" alt="" />
      ) : (
        <video
          ref={ref}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/video/hero-cinema.jpg"
        >
          {/*
            Un seul format. Le WebM compresse pesait plus lourd que le MP4
            a qualite egale, et Chrome l'aurait pris en premier.
          */}
          <source src="/video/hero-cinema.mp4" type="video/mp4" />
        </video>
      )}
    </div>
  );
}
