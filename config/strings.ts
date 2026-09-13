/**
 * Point d'entree des textes.
 *
 * `t` reste exporte tel quel : le francais est la langue de reference et
 * la valeur par defaut du rendu serveur. Les autres langues passent par
 * le fournisseur d'i18n, qui distribue le meme objet traduit.
 */

import { fr } from './locales/fr';

export const APP_NAME = 'Dubblers';
export const APP_TAGLINE = 'Le studio de doublage entre amis.';

export const t = fr;

/** Formate une duree en ms vers `m:ss`. */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Formate un timecode en ms vers `m:ss.d`. */
export function formatTimecode(ms: number): string {
  const total = Math.max(0, ms);
  const m = Math.floor(total / 60000);
  const s = Math.floor((total % 60000) / 1000);
  const d = Math.floor((total % 1000) / 100);
  return `${m}:${String(s).padStart(2, '0')}.${d}`;
}

/** Formate un poids d'octets en unite lisible. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  const units = ['Ko', 'Mo', 'Go', 'To'];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[i]}`;
}
