/**
 * Les deux peaux du site.
 *
 * `retro` est celle d'origine et reste la peau par defaut : un vieux
 * poste de television, des plaques vissees, des boutons qui s'enfoncent.
 * Elle parle a qui a grandi avec les jeux televises du samedi soir.
 *
 * `modern` vise l'autre bout du public, celui des jeux de soiree en
 * ligne d'aujourd'hui : fond profond, grandes cartes claires tres
 * arrondies, boutons pleins et colores, aucune imitation de matiere.
 *
 * Les deux partagent exactement la meme structure : ce sont les memes
 * jetons qui changent de valeur, et les memes classes de composants qui
 * changent de dessin. Aucun ecran n'est double, sinon les deux peaux
 * divergeraient des la premiere retouche.
 */
export const THEMES = {
  retro: 'retro',
  modern: 'modern',
} as const;

export type Theme = keyof typeof THEMES;

export const DEFAULT_THEME: Theme = 'retro';

/** Un an : ce n'est pas un choix qu'on refait a chaque visite. */
export const THEME_COOKIE = 'dubup.theme';
/** Le meme cookie sous son ancien nom, lu a defaut du nouveau. */
export const LEGACY_THEME_COOKIE = 'dubroom.theme';
export const THEME_MAX_AGE = 60 * 60 * 24 * 365;

export function isTheme(value: string | undefined | null): value is Theme {
  return value === 'retro' || value === 'modern';
}

export function resolveTheme(cookieValue: string | undefined): Theme {
  return isTheme(cookieValue) ? cookieValue : DEFAULT_THEME;
}
