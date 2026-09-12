import { cookies, headers } from 'next/headers';

import { fr } from '@/config/locales/fr';
import type { Dictionary, Locale } from '@/config/i18n';
import { LOCALE_COOKIE, resolveLocale } from '@/config/i18n';
import type { Theme } from '@/config/theme';
import { THEME_COOKIE, resolveTheme } from '@/config/theme';

/**
 * Le dictionnaire, cote serveur.
 *
 * Les langues sont importees dynamiquement : une page rendue en francais
 * n'embarque pas les neuf autres. Le francais, lui, est importe
 * statiquement puisqu'il sert de secours a toutes les autres.
 */
const loaders: Record<Exclude<Locale, 'fr'>, () => Promise<{ default: Dictionary }>> = {
  en: () => import('@/config/locales/en').then((m) => ({ default: m.en })),
  es: () => import('@/config/locales/es').then((m) => ({ default: m.es })),
  de: () => import('@/config/locales/de').then((m) => ({ default: m.de })),
  it: () => import('@/config/locales/it').then((m) => ({ default: m.it })),
  pt: () => import('@/config/locales/pt').then((m) => ({ default: m.pt })),
  ja: () => import('@/config/locales/ja').then((m) => ({ default: m.ja })),
  ko: () => import('@/config/locales/ko').then((m) => ({ default: m.ko })),
  zh: () => import('@/config/locales/zh').then((m) => ({ default: m.zh })),
  ru: () => import('@/config/locales/ru').then((m) => ({ default: m.ru })),
};

/** Quelle langue pour cette requete. */
export async function currentLocale(): Promise<Locale> {
  const [jar, head] = await Promise.all([cookies(), headers()]);
  return resolveLocale(
    jar.get(LOCALE_COOKIE)?.value,
    head.get('accept-language') ?? undefined,
  );
}

/** Les textes de cette requete. */
export async function getDictionary(locale?: Locale): Promise<Dictionary> {
  const target = locale ?? (await currentLocale());
  if (target === 'fr') return fr;
  try {
    return (await loaders[target]()).default;
  } catch {
    // Une langue absente ou cassee ne doit pas rendre le site blanc.
    return fr;
  }
}

/** La peau demandee par cette requete. */
export async function currentTheme(): Promise<Theme> {
  const jar = await cookies();
  return resolveTheme(jar.get(THEME_COOKIE)?.value);
}
