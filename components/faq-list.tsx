'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * La foire aux questions, en accordeon.
 *
 * Elle etait une grille de cartes ouvertes : douze reponses etalees,
 * deux colonnes, et un mur de texte au bas de l'accueil que personne ne
 * lit. Une question a laquelle on n'a pas pense ne merite pas la place
 * de sa reponse. Repliee, la liste se parcourt d'un coup d'oeil, et on
 * n'ouvre que ce qui nous concerne.
 *
 * Deux precautions qui ne se voient pas :
 *
 *  - la reponse reste dans le document meme repliee, simplement cachee.
 *    C'est ce qui la laisse lisible par les moteurs et par une recherche
 *    dans la page, la ou un rendu conditionnel l'aurait fait
 *    disparaitre — et cette page existe en bonne partie pour ca ;
 *  - une seule ouverte a la fois. Tout ouvrir revient a la grille
 *    d'avant, en plus haut.
 */
export function FaqList({ items }: { items: readonly { q: string; a: string }[] }) {
  const [ouverte, setOuverte] = useState<string | null>(null);

  return (
    <ul className="panel divide-y divide-border overflow-hidden">
      {items.map((item) => {
        const open = ouverte === item.q;
        return (
          <li key={item.q}>
            <h3>
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOuverte(open ? null : item.q)}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-bold',
                  'transition-colors hover:bg-surface',
                  open && 'bg-surface',
                )}
              >
                <span className="flex-1">{item.q}</span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 text-text-faint transition-transform duration-200',
                    open && 'rotate-180',
                  )}
                  aria-hidden
                />
              </button>
            </h3>

            {/*
              La reponse est toujours la, et c'est une grille de hauteur
              nulle qui la replie. `hidden` l'aurait retiree du document,
              donc de ce qu'un moteur lit et de ce qu'une recherche dans
              la page trouve.
            */}
            <div
              className={cn(
                'grid transition-[grid-template-rows] duration-200 ease-out',
                open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
              )}
            >
              <div className="overflow-hidden">
                <p className="px-4 pb-4 text-sm leading-relaxed text-text-muted">
                  {item.a}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
