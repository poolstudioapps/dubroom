'use client';

import { Languages } from 'lucide-react';

import { LOCALES, type Locale } from '@/config/i18n';
import { setLocale, useLocale } from '@/lib/i18n';

/**
 * Le choix de la langue, dans le pied de page.
 *
 * Un `select` natif plutot qu'un menu maison : c'est le seul endroit du
 * produit ou le controle du systeme vaut mieux que le notre, parce qu'il
 * sait deja afficher dix langues dans dix ecritures, et qu'il est
 * utilisable au clavier et au doigt sans qu'on s'en occupe.
 *
 * Le choix est garde dans un cookie et la page se recharge : le
 * dictionnaire est choisi sur le serveur, il faut donc qu'il revoie la
 * requete.
 */
export function LocalePicker() {
  const locale = useLocale();

  return (
    <label className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-bezel-dark/70 bg-bezel/40 px-3 text-[oklch(0.88_0.06_200)]">
      <Languages className="h-4 w-4 shrink-0" aria-hidden />
      <span className="sr-only">Langue</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="cursor-pointer bg-transparent py-1 pr-1 text-sm font-bold text-[oklch(0.92_0.06_200)] outline-none"
      >
        {Object.entries(LOCALES).map(([code, name]) => (
          <option key={code} value={code} className="bg-surface-raised text-text">
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}
