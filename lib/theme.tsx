'use client';

import { createContext, useContext } from 'react';

import type { Theme } from '@/config/theme';
import { DEFAULT_THEME, THEME_COOKIE, THEME_MAX_AGE } from '@/config/theme';

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
}
