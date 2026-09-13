'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

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
 *
 * L'ouverture se fait en trois temps qui se chevauchent : la hauteur se
 * deplie, un filet de couleur descend le long de la question, puis la
 * reponse glisse en place. Le « + » tourne en « × ». Ceux qui ont demande
 * moins d'animations au systeme voient la reponse s'ouvrir d'un coup.
 */
export function FaqList({ items }: { items: readonly { q: string; a: string }[] }) {
  const [ouverte, setOuverte] = useState<string | null>(null);

  return (
    <ul className="panel divide-y divide-border overflow-hidden">
      {items.map((item) => {
        const open = ouverte === item.q;
        return (
          <li
            key={item.q}
            className={cn(
              'relative transition-colors duration-300',
              // Le filet d'accent, qui descend a l'ouverture.
              'before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:origin-top before:bg-accent',
              'before:transition-transform before:duration-500 before:ease-[cubic-bezier(0.22,1,0.36,1)]',
              'motion-reduce:before:transition-none',
              open ? 'bg-surface before:scale-y-100' : 'before:scale-y-0',
            )}
          >
            <h3>
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOuverte(open ? null : item.q)}
                className={cn(
                  'group flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-bold',
                  'transition-colors hover:bg-surface',
                )}
              >
                <span className="flex-1">{item.q}</span>
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300',
                    'ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none',
                    open
                      ? 'rotate-45 border-accent bg-accent text-accent-ink'
                      : 'border-border-strong text-text-faint group-hover:border-accent group-hover:text-text',
                  )}
                  aria-hidden
                >
                  <Plus className="h-4 w-4" />
                </span>
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
                'grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                'motion-reduce:transition-none',
                open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
              )}
            >
              <div className="overflow-hidden">
                <p
                  className={cn(
                    'px-4 pb-4 pr-14 text-sm leading-relaxed text-text-muted',
                    'transition-[opacity,transform,filter] ease-out motion-reduce:transition-none',
                    open
                      ? 'translate-y-0 opacity-100 blur-0 delay-100 duration-500'
                      : '-translate-y-3 opacity-0 blur-[2px] duration-200',
                  )}
                >
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
