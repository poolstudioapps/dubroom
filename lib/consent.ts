'use client';

import { LOCALE_COOKIE, LOCALE_MAX_AGE } from '@/config/i18n';

/**
 * Le consentement aux cookies.
 *
 * Deux familles seulement, parce que le site n'en utilise pas d'autres :
 *
 *  - ESSENTIELS : la session de connexion et ce cookie-ci, qui retient le
 *    choix. Sans eux le site ne fonctionne pas ; ils ne se refusent pas ;
 *  - PREFERENCES : ce qui se souvient de toi d'une visite a l'autre — la
 *    langue choisie, la derniere adresse de connexion, les reglages du
 *    studio. Refusees, ces choses marchent le temps de la visite puis
 *    s'oublient.
 *
 * Ni mesure d'audience, ni publicite, ni reseau social : il n'y a rien
 * d'autre a demander. Tant que personne n'a choisi, les preferences
 * sont refusees : rien n'est garde avant un oui.
 */

export const CONSENT_COOKIE = 'dubup.consent';
/** Six mois, puis on redemande. */
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 182;
const VERSION = 'v1';

/** Ce que les preferences gardent dans le navigateur, hors cookies. */
export const PREFERENCE_STORAGE_KEYS = [
  'dubup.lastEmail',
  'dubup.loginMode',
  'dubup.micOffsetEverywhere',
  'dubup.keepFx',
  'dubup.fxPerso',
  'dubup.micOffsetMs',
  'dubup.micDevice',
  'dubup.outputDevice',
  'dubroom.lastEmail',
  'dubroom.loginMode',
  'dubroom.micOffsetMs',
] as const;

/** Annonce qu'un choix vient d'etre fait. */
export const CONSENT_EVENT = 'dubup:consent';
/** Demande l'ouverture du panneau de reglages, depuis n'importe ou. */
export const COOKIE_SETTINGS_EVENT = 'dubup:cookies';

export interface Consent {
  preferences: boolean;
  decidedAt: number;
}

function lireCookie(nom: string): string | null {
  if (typeof document === 'undefined') return null;
  const trouve = document.cookie.split('; ').find((c) => c.startsWith(`${nom}=`));
  return trouve ? decodeURIComponent(trouve.slice(nom.length + 1)) : null;
}

/** Le choix enregistre, ou `null` si personne n'a encore repondu. */
export function readConsent(): Consent | null {
  const brut = lireCookie(CONSENT_COOKIE);
  const [version, prefs, date] = (brut ?? '').split('.');
  if (version !== VERSION || (prefs !== 'p1' && prefs !== 'p0')) return null;
  return { preferences: prefs === 'p1', decidedAt: Number(date) || 0 };
}

export function preferencesAllowed(): boolean {
  return readConsent()?.preferences === true;
}

/**
 * Enregistre le choix, et l'applique tout de suite.
 *
 * Refuser efface ce que les preferences avaient deja garde : la langue
 * reste celle de la visite en cours, mais son cookie redevient un cookie
 * de session, qui disparait a la fermeture du navigateur.
 */
export function writeConsent(preferences: boolean): void {
  const valeur = `${VERSION}.${preferences ? 'p1' : 'p0'}.${Date.now()}`;
  document.cookie = `${CONSENT_COOKIE}=${valeur};path=/;max-age=${CONSENT_MAX_AGE};samesite=lax`;

  const langue = lireCookie(LOCALE_COOKIE);
  if (langue) {
    document.cookie = preferences
      ? `${LOCALE_COOKIE}=${langue};path=/;max-age=${LOCALE_MAX_AGE};samesite=lax`
      : `${LOCALE_COOKIE}=${langue};path=/;samesite=lax`;
  }

  if (!preferences) {
    try {
      for (const cle of PREFERENCE_STORAGE_KEYS) window.localStorage.removeItem(cle);
    } catch {
      // Stockage indisponible : il n'y a rien a effacer.
    }
  }

  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: preferences }));
}

/** Garde une preference, seulement si on y a consenti. */
export function rememberPreference(cle: (typeof PREFERENCE_STORAGE_KEYS)[number], valeur: string) {
  if (!preferencesAllowed()) return;
  try {
    window.localStorage.setItem(cle, valeur);
  } catch {
    // Stockage indisponible : la preference vaut pour cette visite.
  }
}

/** Relit une preference ; rien tant qu'on n'y a pas consenti. */
export function recallPreference(cle: string): string | null {
  if (!preferencesAllowed()) return null;
  try {
    return window.localStorage.getItem(cle);
  } catch {
    return null;
  }
}

/** Le cookie de langue, persistant ou de session selon le consentement. */
export function localeCookie(locale: string): string {
  return preferencesAllowed()
    ? `${LOCALE_COOKIE}=${locale};path=/;max-age=${LOCALE_MAX_AGE};samesite=lax`
    : `${LOCALE_COOKIE}=${locale};path=/;samesite=lax`;
}

export function openCookieSettings(): void {
  window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT));
}
