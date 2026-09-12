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

/** En deca, on est sur un telephone : la colonne laterale passe dessous. */
export const NARROW_VIEWPORT_PX = 1024;

/**
 * L'ecran est-il etroit ?
 *
 * Le studio est concu pour tenir d'un seul tenant, sans defilement : sur
 * un ordinateur c'est ce qui evite de perdre le bouton d'arret au milieu
 * d'une prise. Sur un telephone, la meme regle donne l'inverse — l'image
 * se retrouve ecrasee a quatre pixels de haut pour faire tenir le reste,
 * et on double a l'aveugle.
 *
 * En dessous de cette largeur, la page redevient une page : elle defile,
 * l'image garde son format, et c'est la barre de transport qui reste
 * collee en bas.
 *
 * Mesure reelle plutot que media query, comme pour la hauteur : les deux
 * decisions se prennent au meme endroit et doivent se lire pareil.
 */
export function useNarrowViewport(threshold = NARROW_VIEWPORT_PX): boolean {
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const update = () => setNarrow(window.innerWidth < threshold);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [threshold]);

  return narrow;
}
