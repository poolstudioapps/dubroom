'use client';

import { createContext, useContext } from 'react';

import { de } from '@/config/locales/de';
import { en } from '@/config/locales/en';
import { es } from '@/config/locales/es';
import { fr } from '@/config/locales/fr';
import { it } from '@/config/locales/it';
import { ja } from '@/config/locales/ja';
import { ko } from '@/config/locales/ko';
import { pt } from '@/config/locales/pt';
import { ru } from '@/config/locales/ru';
import { zh } from '@/config/locales/zh';
import type { Dictionary, Locale } from '@/config/i18n';
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALE_MAX_AGE } from '@/config/i18n';

/**
 * Les dictionnaires disponibles cote client.
 *
 * Ils sont importes statiquement, et c'est un choix contraint : un
 * dictionnaire contient des fonctions — pluriels, gabarits a trous — et
 * une fonction ne traverse pas la frontiere serveur/client, qui
 * serialise. Seul le code de langue la traverse ; le dictionnaire est
 * retrouve ici.
 *
 * Le prix est la taille du paquet : chaque langue ajoutee y est
 * embarquee. A partir d'une demi-douzaine, il faudra sortir les
 * fonctions des dictionnaires pour en faire des donnees pures, et les
 * charger a la demande.
 */
const DICTIONARIES: Record<Locale, Dictionary> = {
  fr,
  en,
  es,
  de,
  it,
  pt,
  ja,
  ko,
  zh,
  ru,
};

/**
 * Distribution des textes cote client.
 *
 * La langue est decidee une fois, sur le serveur, d'apres le cookie ou
 * l'entete du navigateur. Le rendu serveur et le rendu client
 * s'accordent donc des la premiere image, sans clignotement.
 *
 * La valeur par defaut est le francais : un composant monte hors du
 * fournisseur affiche du texte plutot que de planter.
 */
const Ctx = createContext<{ t: Dictionary; locale: Locale }>({
  t: fr,
  locale: DEFAULT_LOCALE,
});

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const value = { t: DICTIONARIES[locale] ?? fr, locale };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Les textes, dans la langue courante. */
export function useT(): Dictionary {
  return useContext(Ctx).t;
}

/** La langue courante, pour ce qui doit la connaitre. */
export function useLocale(): Locale {
  return useContext(Ctx).locale;
}

/**
 * Change de langue.
 *
 * Un rechargement franc plutot qu'un rafraichissement React : le
 * dictionnaire est choisi sur le serveur, il faut donc que le serveur
 * revoie la requete avec le nouveau cookie.
 */
export function setLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${LOCALE_MAX_AGE};samesite=lax`;
  window.location.reload();
}
