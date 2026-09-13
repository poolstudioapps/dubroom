'use client';

import { createContext, useContext, useEffect, useState } from 'react';

import type { Theme } from '@/config/theme';
import { DEFAULT_THEME, THEME_COOKIE, THEME_MAX_AGE, isTheme } from '@/config/theme';
import { clearColorCache } from '@/lib/canvas-colors';

/**
 * La peau courante, cote client.
 *
 * Comme pour la langue, seul le nom traverse la frontiere : le serveur
 * le pose sur `<html>` des le premier rendu, ce qui evite de voir la
 * peau par defaut clignoter avant la bonne.
 */
const Ctx = createContext<Theme>(DEFAULT_THEME);

export function ThemeProvider({
  theme,
  children,
}: {
  theme: Theme;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={theme}>{children}</Ctx.Provider>;
}

export function useTheme(): Theme {
  return useContext(Ctx);
}

/**
 * Change de peau.
 *
 * L'attribut est pose tout de suite pour que le changement soit
 * instantane, et le cookie ecrit pour que le serveur rende la meme chose
 * au prochain chargement. Pas de rechargement : tout est en CSS, il n'y
 * a rien a redemander au serveur.
 */
export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.cookie = `${THEME_COOKIE}=${theme};path=/;max-age=${THEME_MAX_AGE};samesite=lax`;
  // Les couleurs deja resolues pour les canvas sont celles de l'ancienne
  // peau : sans cela la bande rythmo garderait sa tete de lecture verte
  // jusqu'au prochain chargement.
  clearColorCache();
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: theme }));
}

/** Annonce qu'une peau vient d'etre choisie, sans navigation. */
export const THEME_EVENT = 'dubup:theme';

/**
 * La peau reellement affichee.
 *
 * `useTheme` donne celle du rendu serveur, qui ne change qu'a la
 * navigation suivante. Ce qui doit suivre un changement tout de suite —
 * le film de l'accueil, les illustrations — lit donc l'attribut de la
 * page et ecoute l'annonce.
 */
export function useLiveTheme(): Theme {
  const initiale = useTheme();
  const [theme, setLocale] = useState<Theme>(initiale);

  useEffect(() => {
    const lire = () => {
      const valeur = document.documentElement.dataset.theme;
      if (isTheme(valeur)) setLocale(valeur);
    };
    lire();
    window.addEventListener(THEME_EVENT, lire);
    return () => window.removeEventListener(THEME_EVENT, lire);
  }, []);

  return theme;
}
