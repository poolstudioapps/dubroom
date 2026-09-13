'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

import { useT } from '@/lib/i18n';
import { characterColorVar } from '@/config/constants';

import { cn } from '@/lib/utils';

interface Choice {
  id: string;
  name: string;
  color: string;
}

/**
 * A qui appartient cette replique.
 *
 * Le cas courant de cet ecran, et de loin, c'est « cette ligne n'est pas
 * du bon personnage ». Il passait par : cocher la case, remonter en haut
 * de colonne, trouver une liste deroulante apparue entre-temps, choisir.
 * Quatre gestes et une decouverte, pour une correction qu'on fait vingt
 * fois de suite.
 *
 * Ici, le nom du personnage est affiche sur la replique, et c'est lui
 * qu'on clique. Un geste, au bon endroit, et on voit sans survoler a qui
 * chaque ligne est attribuee.
 */
export function CharacterPicker({
  value,
  choices,
  onPick,
  compact,
  placeholder,
  dropUp,
  ariaLabel,
  title,
}: {
  value: Choice | undefined;
  choices: Choice[];
  onPick: (characterId: string) => void;
  compact?: boolean;
  /** Ce qu'on lit quand rien n'est choisi : le libelle d'une action. */
  placeholder?: string;
  /** Le nom de l'action quand le libelle visible n'est qu'un signe. */
  ariaLabel?: string;
  title?: string;
  /**
   * La liste s'ouvre vers le haut. Pour un bouton pose en bas de l'ecran,
   * comme la barre de selection : vers le bas, elle sortait de la fenetre.
   */
  dropUp?: boolean;
}) {
  const t = useT();

  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const tint = characterColorVar(value?.color ?? '');

  return (
    <div ref={root} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={
          ariaLabel ??
          (value
            ? `${t.prepare.assignedTo} ${value.name}. ${t.prepare.changeCharacter}`
            : (placeholder ?? t.prepare.changeCharacter))
        }
        title={title}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          // Largeur fixe, et non « au plus » : c'est elle qui aligne les
          // horodatages et les textes d'une ligne a l'autre. En largeur
          // libre, chaque replique commencait a une abscisse differente et
          // la colonne devenait illisible.
          'inline-flex items-center gap-1.5 rounded-full border-2 border-border-strong bg-surface-raised py-0.5 pl-1.5 pr-1 text-xs font-bold transition-colors hover:border-select hover:bg-surface',
          placeholder ? 'px-2.5' : compact ? 'w-24' : 'w-32',
        )}
      >
        {value || !placeholder ? (
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: tint }}
            aria-hidden
          />
        ) : null}
        <span className="truncate">{value?.name ?? placeholder ?? '…'}</span>
        <ChevronDown className="h-3 w-3 shrink-0 text-text-faint" aria-hidden />
      </button>

      {open ? (
        <ul
          role="listbox"
          className={cn(
            'absolute left-0 z-30 max-h-64 w-48 overflow-y-auto rounded-2xl border border-border bg-surface-raised py-1 shadow-[0_24px_48px_-16px_rgb(0_0_0/0.8)]',
            dropUp ? 'bottom-full mb-2' : 'mt-1',
          )}
        >
          {choices.map((choice) => (
            <li key={choice.id}>
              <button
                type="button"
                role="option"
                aria-selected={choice.id === value?.id}
                onClick={() => {
                  setOpen(false);
                  if (choice.id !== value?.id) onPick(choice.id);
                }}
                className="flex w-full items-center gap-2 px-2.5 py-2 text-left text-sm font-bold hover:bg-surface"
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: characterColorVar(choice.color) }}
                  aria-hidden
                />
                <span className="flex-1 truncate">{choice.name}</span>
                {choice.id === value?.id ? (
                  <Check className="h-3.5 w-3.5 shrink-0 text-ok" aria-hidden />
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
