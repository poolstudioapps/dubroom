'use client';

import { useEffect, useState } from 'react';

/** En deçà, on rogne les bandes plutôt que de faire défiler la page. */
export const SHORT_VIEWPORT_PX = 860;

/**
 * La fenetre est-elle courte ?
 *
 * Le studio doit tenir d'un seul ecran. Sur un portable de 1366×768, la
 * bande rythmo et la forme d'onde a leur taille normale ne laissent plus
 * rien a l'image. Plutot que de faire defiler — impensable pendant une
 * prise — on les rogne un peu.
 *
 * Mesure reelle plutot que media query : c'est la hauteur disponible qui
 * compte, et elle change quand le navigateur affiche sa barre de
 * telechargement ou qu'on sort du plein ecran.
 */
export function useShortViewport(threshold = SHORT_VIEWPORT_PX): boolean {
  const [short, setShort] = useState(false);

  useEffect(() => {
    const update = () => setShort(window.innerHeight < threshold);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [threshold]);

  return short;
}
