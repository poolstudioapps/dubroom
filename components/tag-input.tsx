'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

import { useT } from '@/lib/i18n';
import { PACK_TAGS_MAX, normaliserTag } from '@/lib/packs';
import { cn } from '@/lib/utils';

/**
 * Un champ d'etiquettes.
 *
 * On tape, et une espace, une virgule ou Entree pose l'etiquette. Elle
 * apparait telle que la base la gardera — « #Star Wars » devient
 * `#starwars` sous les yeux — plutot qu'apres publication. Retour arriere
 * dans un champ vide retire la derniere, comme partout ailleurs.
 */
export function TagInput({
  id,
  value,
  onChange,
  className,
}: {
  id?: string;
  value: string[];
  onChange: (next: string[]) => void;
  className?: string;
}) {
  const t = useT();
  const [brouillon, setBrouillon] = useState('');
  const plein = value.length >= PACK_TAGS_MAX;

  function ajouter(texte: string) {
    const suivants = [...value];
    for (const morceau of texte.split(/[\s,;]+/)) {
      const tag = normaliserTag(morceau);
      if (tag && !suivants.includes(tag) && suivants.length < PACK_TAGS_MAX) {
        suivants.push(tag);
      }
    }
    if (suivants.length !== value.length) onChange(suivants);
    setBrouillon('');
  }

  return (
    <div
      className={cn(
        'ui-input flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-sm border-2 border-border-strong bg-screen px-2 py-1.5 text-sm text-text',
        'shadow-[inset_0_2px_4px_0_rgb(0_0_0/0.18)] focus-within:border-bezel',
        className,
      )}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-0.5 rounded-full bg-select/15 py-0.5 pl-2 pr-0.5 text-xs font-bold text-select"
        >
          #{tag}
          <button
            type="button"
            aria-label={t.community.tagRemove(tag)}
            onClick={() => onChange(value.filter((v) => v !== tag))}
            className="rounded-full p-0.5 hover:bg-select/25"
          >
            <X className="h-3 w-3" aria-hidden />
          </button>
        </span>
      ))}

      {plein ? null : (
        <input
          id={id}
          value={brouillon}
          enterKeyHint="done"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          onChange={(e) => {
            const texte = e.target.value;
            if (/[\s,;]$/.test(texte)) ajouter(texte);
            else setBrouillon(texte);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              ajouter(brouillon);
            } else if (e.key === 'Backspace' && brouillon === '' && value.length > 0) {
              onChange(value.slice(0, -1));
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            ajouter(`${brouillon} ${e.clipboardData.getData('text')}`);
          }}
          onBlur={() => {
            if (brouillon) ajouter(brouillon);
          }}
          placeholder={value.length === 0 ? t.community.tagsPlaceholder : ''}
          className="min-w-[8rem] flex-1 bg-transparent px-1 py-0.5 outline-none placeholder:italic placeholder:text-text-faint"
        />
      )}
    </div>
  );
}
