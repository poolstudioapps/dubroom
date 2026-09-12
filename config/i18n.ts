import type { fr } from './locales/fr';

/**
 * Les langues du produit.
 *
 * Le francais est la reference : c'est lui qui donne le type, et toute
 * autre langue doit en fournir exactement les memes cles. Une traduction
 * incomplete ne compile pas, ce qui vaut mieux qu'une phrase francaise
 * surgissant au milieu d'une page anglaise.
 */
export const LOCALES = {
  fr: 'Français',
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  ja: '日本語',
  ko: '한국어',
  zh: '中文',
  ru: 'Русский',
} as const;

export type Locale = keyof typeof LOCALES;

/**
 * Elargit les types litteraux du dictionnaire de reference.
 *
 * `fr` est declare `as const`, ce qui donne a chaque texte son type
 * litteral : sans cet elargissement, une autre langue devrait dire
 * exactement « Accueil » pour compiler. On garde en revanche la forme
 * exacte des fonctions, qui portent le nombre et le type des arguments :
 * c'est la que se cachent les vraies erreurs de traduction.
 */
type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : // eslint-disable-next-line @typescript-eslint/no-explicit-any
        T extends (...args: any[]) => any
        ? T
        : T extends readonly (infer U)[]
          ? readonly Widen<U>[]
          : { [K in keyof T]: Widen<T[K]> };

export type Dictionary = Widen<typeof fr>;

export const DEFAULT_LOCALE: Locale = 'fr';

/** Le cookie retient le choix. Un an : ce n'est pas une decision qu'on refait. */
export const LOCALE_COOKIE = 'dubroom.locale';
export const LOCALE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && value in LOCALES;
}

/**
 * Quelle langue servir.
 *
 * Le choix explicite l'emporte toujours. Sinon on lit l'entete du
 * navigateur, en respectant l'ordre de preference et les qualites : une
 * personne qui a mis l'espagnol avant le francais doit avoir l'espagnol,
 * meme si les deux sont dans la liste.
 */
export function resolveLocale(
  cookieValue: string | undefined,
  acceptLanguage: string | undefined,
): Locale {
  if (isLocale(cookieValue)) return cookieValue;

  const wanted = (acceptLanguage ?? '')
    .split(',')
    .map((part) => {
      const [tag = '', ...params] = part.trim().split(';');
      const q = params
        .map((p) => p.trim())
        .find((p) => p.startsWith('q='))
        ?.slice(2);
      return { tag: tag.toLowerCase(), q: q ? Number(q) : 1 };
    })
    .filter((entry) => entry.tag && Number.isFinite(entry.q))
    .sort((a, b) => b.q - a.q);

  for (const { tag } of wanted) {
    // « fr-CA » compte pour « fr » : on ne distingue pas les variantes.
    const base = tag.split('-')[0];
    if (isLocale(base)) return base;
  }

  return DEFAULT_LOCALE;
}
