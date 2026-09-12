import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { SESSION_CODE_ALPHABET, SESSION_CODE_LENGTH } from '@/config/constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Code de session a 6 caracteres, sans caracteres ambigus (PRD §10.1).
 * L'unicite est garantie par la contrainte en base, pas ici : l'appelant
 * reessaie sur conflit.
 */
export function generateSessionCode(): string {
  const bytes = new Uint8Array(SESSION_CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let code = '';
  for (const byte of bytes) {
    code += SESSION_CODE_ALPHABET[byte % SESSION_CODE_ALPHABET.length];
  }
  return code;
}

/** Normalise une saisie de code : majuscules, sans espaces ni tirets. */
export function normalizeSessionCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Nom affiche par defaut, deduit de l'adresse e-mail. */
export function displayNameFromEmail(email: string | undefined | null): string {
  if (!email) return 'Invité';
  const local = email.split('@')[0] ?? 'Invité';
  const cleaned = local.replace(/[._-]+/g, ' ').trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
