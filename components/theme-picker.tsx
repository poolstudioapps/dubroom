'use client';

import { useState } from 'react';
import { Sparkles, Tv } from 'lucide-react';

import type { Theme } from '@/config/theme';
import { useT } from '@/lib/i18n';
import { setTheme, useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';

/**
 * Le choix de la peau, dans le pied de page.
 *
 * Deux boutons plutot qu'une liste deroulante : il n'y a que deux
 * reponses, et les voir toutes les deux invite a essayer l'autre. Une
 * liste fermee sur « Rétro » n'aurait jamais rien annonce.
 *
 * Le changement est instantane et sans rechargement : tout tient dans
 * des variables CSS, il n'y a rien a redemander au serveur. Le cookie
 * n'est ecrit que pour que la prochaine visite reparte du bon dessin.
 */
export function ThemePicker() {
  const t = useT();
  const actuel = useTheme();
  // L'etat local fait bouger le bouton tout de suite ; le fournisseur,
  // lui, ne change qu'a la navigation suivante.
  const [choisi, setChoisi] = useState<Theme>(actuel);

  const options: { valeur: Theme; libelle: string; Icone: typeof Tv }[] = [
    { valeur: 'retro', libelle: t.theme.retro, Icone: Tv },
    { valeur: 'modern', libelle: t.theme.modern, Icone: Sparkles },
  ];

  return (
    <div
      role="group"
      aria-label={t.theme.label}
      className="inline-flex items-center gap-1 rounded-lg border border-bezel-dark/70 bg-bezel/40 p-1"
    >
      {options.map(({ valeur, libelle, Icone }) => {
        const actif = choisi === valeur;
        return (
          <button
            key={valeur}
            type="button"
            aria-pressed={actif}
            onClick={() => {
              setChoisi(valeur);
              setTheme(valeur);
            }}
            className={cn(
              'inline-flex min-h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-bold transition-colors',
              actif
                ? 'bg-[oklch(1_0_0/0.92)] text-[oklch(0.25_0.05_300)]'
                : 'text-[oklch(0.88_0.06_200)] hover:bg-[oklch(1_0_0/0.12)]',
            )}
          >
            <Icone className="h-4 w-4 shrink-0" aria-hidden />
            {libelle}
          </button>
        );
      })}
    </div>
  );
}
