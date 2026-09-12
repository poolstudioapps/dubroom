'use client';

import Link from 'next/link';
import * as React from 'react';

import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/**
 * La phrase a cocher, avec ses deux liens.
 *
 * Le texte est un gabarit — « J'ai lu et j'accepte les {terms} et la
 * {privacy}. » — decoupe ici. Ecrire la phrase en trois morceaux mis
 * bout a bout aurait impose l'ordre des mots du francais aux dix
 * langues : le japonais et le coreen placent le verbe a la fin, le
 * chinois colle les liens l'un a l'autre. Avec un gabarit, chaque langue
 * met les liens ou elle veut.
 *
 * La case est une vraie case a cocher, enveloppee dans son libelle :
 * toute la phrase devient cliquable, sauf les deux liens qui gardent
 * leur propre role.
 */
export function TermsConsent({
  checked,
  onChange,
  id = 'terms-consent',
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  id?: string;
  className?: string;
}) {
  const t = useT();

  const liens: Record<string, { href: string; label: string }> = {
    terms: { href: '/conditions', label: t.terms.linkTerms },
    privacy: { href: '/confidentialite', label: t.terms.linkPrivacy },
  };

  // Le decoupage garde les marqueurs, qui sont les indices impairs.
  const morceaux = t.terms.consent.split(/\{(terms|privacy)\}/);

  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-lg p-1 text-sm leading-relaxed text-text-muted',
        className,
      )}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-accent)]"
      />
      <span>
        {morceaux.map((morceau, index) => {
          const lien = liens[morceau];
          if (index % 2 === 1 && lien) {
            return (
              <Link
                key={index}
                href={lien.href}
                target="_blank"
                // Le lien ouvre un onglet : cliquer « conditions » au
                // milieu d'un formulaire ne doit pas faire perdre
                // l'adresse qu'on vient de taper.
                onClick={(e) => e.stopPropagation()}
                className="font-bold text-link underline underline-offset-4"
              >
                {lien.label}
              </Link>
            );
          }
          return <React.Fragment key={index}>{morceau}</React.Fragment>;
        })}
      </span>
    </label>
  );
}
