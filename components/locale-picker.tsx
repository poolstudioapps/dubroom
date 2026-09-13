'use client';

import { Languages } from 'lucide-react';

import { SelectMenu } from '@/components/select-menu';
import { LOCALES, type Locale } from '@/config/i18n';
import { setLocale, useLocale } from '@/lib/i18n';

const OPTIONS = Object.entries(LOCALES).map(([value, label]) => ({
  value: value as Locale,
  label,
}));

/**
 * Le choix de la langue, dans le pied de page.
 *
 * Le meme menu que partout ailleurs : la liste native s'ouvrait en gris
 * et bleu sous un site noir et or. Chaque langue est ecrite dans son
 * propre alphabet, et le menu se pilote au clavier comme le natif.
 *
 * Le choix est garde dans un cookie et la page se recharge : le
 * dictionnaire est choisi sur le serveur, il faut donc qu'il revoie la
 * requete.
 */
export function LocalePicker() {
  const locale = useLocale();

  return (
    <SelectMenu
      variant="bare"
      label="Langue"
      value={locale}
      options={OPTIONS}
      onChange={(next) => setLocale(next)}
      icon={<Languages className="h-4 w-4 shrink-0" aria-hidden />}
      className="min-h-11 rounded-lg border border-bezel-dark/70 bg-bezel/40 px-3 text-sm font-bold text-[oklch(0.92_0.06_200)]"
    />
  );
}
