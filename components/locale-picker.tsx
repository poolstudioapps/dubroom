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
    <label className="inline-flex items-center gap-1.5 text-[oklch(0.82_0.03_300)]">
      <Languages className="h-3.5 w-3.5" aria-hidden />
      <span className="sr-only">Langue</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="cursor-pointer rounded-sm bg-transparent py-1 text-xs font-bold text-[oklch(0.88_0.06_200)] underline underline-offset-4 outline-none"
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
