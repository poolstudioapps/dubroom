'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface SelectMenuOption<V extends string> {
  value: V;
  label: string;
}

interface Placement {
  top: number;
  left: number;
  minWidth: number;
  maxHeight: number;
  /** Ouverte au-dessus du bouton, faute de place en dessous. */
  haut: boolean;
}

/**
 * Un menu deroulant, dessine par le site.
 *
 * Le `select` du systeme ouvre une liste peinte avec les couleurs du
 * systeme — fond gris ou blanc, surlignage bleu — quel que soit le theme,
 * et c'est ce qu'on voyait sous les filtres. Celui-ci garde ce qui faisait
 * la valeur du natif : il se pilote au clavier (fleches, Entree, Echap,
 * initiale), il s'annonce comme une liste de choix, et il se ferme au
 * clic dehors.
 *
 * La liste passe dans la couche superieure du navigateur (`popover`) :
 * ni la rangee de filtres qui defile sur telephone, ni un panneau de verre,
 * ni une fenetre de dialogue ne peuvent la couper ou la recouvrir. Dans
 * une fenetre de dialogue, elle est rattachee a la fenetre, faute de quoi
 * le reste de la page, rendu inerte, ignorerait les clics.
 */
export function SelectMenu<V extends string>({
  value,
  options,
  onChange,
  label,
  prefix,
  placeholder,
  icon,
  variant = 'field',
  align = 'start',
  disabled,
  className,
}: {
  value: V;
  options: readonly SelectMenuOption<V>[];
  onChange: (next: V) => void;
  /** Le nom du menu, lu par les lecteurs d'ecran. */
  label: string;
  /** Un libelle discret devant la valeur, dans les pastilles de filtre. */
  prefix?: string;
  /** Ce qu'on affiche quand aucune option ne correspond a la valeur. */
  placeholder?: string;
  icon?: React.ReactNode;
  variant?: 'field' | 'pill' | 'compact' | 'bare';
  align?: 'start' | 'end';
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();
  const boutonRef = useRef<HTMLButtonElement>(null);
  const listeRef = useRef<HTMLUListElement>(null);
  const [ouvert, setOuvert] = useState(false);
  const [actif, setActif] = useState(0);
  const [place, setPlace] = useState<Placement | null>(null);
  const [conteneur, setConteneur] = useState<Element | null>(null);

  const courant = options.find((option) => option.value === value);

  function ouvrir() {
    setActif(Math.max(0, options.findIndex((option) => option.value === value)));
    setConteneur(boutonRef.current?.closest('dialog') ?? document.body);
    setOuvert(true);
  }

  function fermer() {
    setOuvert(false);
    boutonRef.current?.focus();
  }

  function choisir(index: number) {
    const option = options[index];
    if (option) onChange(option.value);
    fermer();
  }

  // ── La place : sous le bouton, ou au-dessus s'il n'y en a pas ────────
  useLayoutEffect(() => {
    if (!ouvert) return;
    const placer = () => {
      const r = boutonRef.current?.getBoundingClientRect();
      if (!r) return;
      const dessous = window.innerHeight - r.bottom - 12;
      const dessus = r.top - 12;
      const haut = dessous < 220 && dessus > dessous;
      const minWidth = Math.max(r.width, 180);
      const brut = align === 'end' ? r.right - minWidth : r.left;
      setPlace({
        top: haut ? r.top - 6 : r.bottom + 6,
        left: Math.max(8, Math.min(brut, window.innerWidth - minWidth - 8)),
        minWidth,
        maxHeight: Math.min(320, haut ? dessus : dessous),
        haut,
      });
    };
    placer();
    window.addEventListener('resize', placer);
    return () => window.removeEventListener('resize', placer);
  }, [ouvert, align]);

  // Dans la couche superieure, puis le clavier passe a la liste.
  useLayoutEffect(() => {
    const liste = listeRef.current;
    if (!ouvert || !place || !liste) return;
    try {
      if (!liste.matches(':popover-open')) liste.showPopover();
    } catch {
      // Un navigateur sans `popover` affiche la liste en position fixe.
    }
    liste.focus({ preventScroll: true });
  }, [ouvert, place]);

  useEffect(() => {
    if (!ouvert) return;
    listeRef.current
      ?.querySelector<HTMLElement>(`[data-index="${actif}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [ouvert, actif]);

  // ── Fermer : clic dehors, ou la page qui defile sous la liste ────────
  useEffect(() => {
    if (!ouvert) return;
    const dehors = (event: PointerEvent) => {
      const cible = event.target as Node;
      if (listeRef.current?.contains(cible) || boutonRef.current?.contains(cible)) return;
      setOuvert(false);
    };
    const defilement = (event: Event) => {
      if (listeRef.current?.contains(event.target as Node)) return;
      setOuvert(false);
    };
    document.addEventListener('pointerdown', dehors);
    window.addEventListener('scroll', defilement, true);
    return () => {
      document.removeEventListener('pointerdown', dehors);
      window.removeEventListener('scroll', defilement, true);
    };
  }, [ouvert]);

  function clavierListe(event: React.KeyboardEvent) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActif((i) => Math.min(options.length - 1, i + 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActif((i) => Math.max(0, i - 1));
        break;
      case 'Home':
        event.preventDefault();
        setActif(0);
        break;
      case 'End':
        event.preventDefault();
        setActif(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        choisir(actif);
        break;
      case 'Escape':
        // Sans cela, Echap fermerait aussi la fenetre de dialogue autour.
        event.preventDefault();
        event.stopPropagation();
        fermer();
        break;
      case 'Tab':
        setOuvert(false);
        break;
      default:
        // L'initiale : la prochaine option qui commence par cette lettre.
        if (event.key.length === 1) {
          const lettre = event.key.toLocaleLowerCase();
          const depart = actif + 1;
          const tour = [...options.slice(depart), ...options.slice(0, depart)];
          const trouve = tour.findIndex((o) => o.label.toLocaleLowerCase().startsWith(lettre));
          if (trouve >= 0) setActif((depart + trouve) % options.length);
        }
    }
  }

  const declencheur = {
    field:
      'menu-declencheur ui-select flex h-10 w-full items-center justify-between gap-2 rounded-lg border-2 border-border-strong bg-surface-raised px-3 text-left text-sm font-bold',
    pill: 'filtre',
    compact:
      'menu-declencheur ui-select flex h-8 min-w-36 items-center justify-between gap-2 rounded-lg border border-border bg-surface-sunken px-2 text-left text-xs font-semibold',
    bare: 'menu-declencheur inline-flex items-center gap-2',
  }[variant];

  const listeId = `${id}-liste`;

  return (
    <>
      <button
        ref={boutonRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={ouvert}
        aria-controls={ouvert ? listeId : undefined}
        aria-label={prefix ? undefined : label}
        onClick={() => (ouvert ? setOuvert(false) : ouvrir())}
        onKeyDown={(event) => {
          if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
            event.preventDefault();
            ouvrir();
          }
        }}
        className={cn(declencheur, 'disabled:cursor-not-allowed disabled:opacity-50', className)}
      >
        {icon}
        {prefix ? <span className="filtre-nom">{prefix}</span> : null}
        <span className={variant === 'pill' ? 'filtre-valeur' : 'min-w-0 flex-1 truncate'}>
          {courant?.label ?? placeholder ?? ''}
        </span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 opacity-70 transition-transform duration-200',
            variant === 'pill' && 'filtre-chevron',
            ouvert && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {ouvert && place && conteneur
        ? createPortal(
            <ul
              ref={listeRef}
              id={listeId}
              role="listbox"
              popover="manual"
              tabIndex={-1}
              aria-label={label}
              aria-activedescendant={`${id}-option-${actif}`}
              onKeyDown={clavierListe}
              className={cn('menu-choix', place.haut && 'menu-choix-haut')}
              style={{
                top: place.haut ? 'auto' : place.top,
                bottom: place.haut ? window.innerHeight - place.top : 'auto',
                left: place.left,
                right: 'auto',
                minWidth: place.minWidth,
                maxHeight: place.maxHeight,
              }}
            >
              {options.map((option, index) => {
                const choisie = option.value === value;
                return (
                  <li
                    key={option.value}
                    id={`${id}-option-${index}`}
                    data-index={index}
                    role="option"
                    aria-selected={choisie}
                    data-actif={index === actif}
                    onPointerEnter={() => setActif(index)}
                    onClick={() => choisir(index)}
                    className="menu-choix-option"
                  >
                    <span className="truncate">{option.label}</span>
                    {choisie ? (
                      <Check className="h-4 w-4 shrink-0" aria-hidden />
                    ) : (
                      <span className="h-4 w-4 shrink-0" aria-hidden />
                    )}
                  </li>
                );
              })}
            </ul>,
            conteneur,
          )
        : null}
    </>
  );
}
