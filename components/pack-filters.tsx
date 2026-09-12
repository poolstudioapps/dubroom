'use client';

import { RotateCcw } from 'lucide-react';

import { Button, Select } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { PACK_GENRES, type Pack, type PackGenre } from '@/lib/packs';

export interface PackFilter {
  lang: string;
  genre: PackGenre | '';
  cast: 'solo' | 'duo' | 'small' | 'large' | '';
  length: 'short' | 'medium' | 'long' | '';
}

export const EMPTY_FILTER: PackFilter = { lang: '', genre: '', cast: '', length: '' };

/**
 * Garde les scenes qui correspondent.
 *
 * Le filtrage se fait ici, sur la liste deja chargee, et non en base :
 * le catalogue d'un groupe d'amis tient en quelques dizaines d'entrees,
 * et un aller-retour reseau a chaque changement de critere rendrait la
 * chose poussive pour rien.
 */
export function matchesFilter(pack: Pack, filter: PackFilter): boolean {
  if (filter.lang && pack.source_lang !== filter.lang) return false;
  if (filter.genre && pack.genre !== filter.genre) return false;

  if (filter.cast) {
    const n = pack.character_count;
    const ok =
      (filter.cast === 'solo' && n <= 1) ||
      (filter.cast === 'duo' && n === 2) ||
      (filter.cast === 'small' && n >= 3 && n <= 4) ||
      (filter.cast === 'large' && n >= 5);
    if (!ok) return false;
  }

  if (filter.length) {
    const minutes = pack.duration_ms / 60_000;
    const ok =
      (filter.length === 'short' && minutes < 1) ||
      (filter.length === 'medium' && minutes >= 1 && minutes <= 3) ||
      (filter.length === 'long' && minutes > 3);
    if (!ok) return false;
  }

  return true;
}

/**
 * Les criteres du catalogue.
 *
 * Quatre, et c'est un plafond assume : la langue parlee, le genre, le
 * nombre de roles et la duree. Ce sont les quatre questions qu'on se
 * pose vraiment quand on est trois dans un salon et qu'il reste une
 * heure. Au-dela, les listes deroulantes restent vides et personne ne
 * s'en sert.
 *
 * Seules les valeurs presentes dans le catalogue sont proposees : une
 * liste de dix langues dont huit ne donnent rien fait perdre du temps a
 * chaque fois.
 */
export function PackFilters({
  packs,
  value,
  onChange,
}: {
  packs: Pack[];
  value: PackFilter;
  onChange: (next: PackFilter) => void;
}) {
  const t = useT();

  const langs = [...new Set(packs.map((p) => p.source_lang).filter(Boolean))].sort() as string[];
  const genres = PACK_GENRES.filter((g) => packs.some((p) => p.genre === g));
  const active = value.lang || value.genre || value.cast || value.length;

  return (
    <div className="flex flex-wrap items-end gap-2">
      {langs.length > 1 ? (
        <Field label={t.community.filterLang}>
          <Select
            value={value.lang}
            aria-label={t.community.filterLang}
            onChange={(e) => onChange({ ...value, lang: e.target.value })}
          >
            <option value="">{t.community.filterAll}</option>
            {langs.map((code) => (
              <option key={code} value={code}>
                {t.community.langNames[code] ?? code}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

      {genres.length > 1 ? (
        <Field label={t.community.filterGenre}>
          <Select
            value={value.genre}
            aria-label={t.community.filterGenre}
            onChange={(e) =>
              onChange({ ...value, genre: e.target.value as PackGenre | '' })
            }
          >
            <option value="">{t.community.filterAllGenres}</option>
            {genres.map((g) => (
              <option key={g} value={g}>
                {t.community.genreNames[g]}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

      <Field label={t.community.filterCast}>
        <Select
          value={value.cast}
          aria-label={t.community.filterCast}
          onChange={(e) =>
            onChange({ ...value, cast: e.target.value as PackFilter['cast'] })
          }
        >
          <option value="">{t.community.filterAnyCast}</option>
          {(['solo', 'duo', 'small', 'large'] as const).map((k) => (
            <option key={k} value={k}>
              {t.community.castBuckets[k]}
            </option>
          ))}
        </Select>
      </Field>

      <Field label={t.community.filterLength}>
        <Select
          value={value.length}
          aria-label={t.community.filterLength}
          onChange={(e) =>
            onChange({ ...value, length: e.target.value as PackFilter['length'] })
          }
        >
          <option value="">{t.community.filterAnyLength}</option>
          {(['short', 'medium', 'long'] as const).map((k) => (
            <option key={k} value={k}>
              {t.community.lengthBuckets[k]}
            </option>
          ))}
        </Select>
      </Field>

      {active ? (
        <Button size="sm" variant="ghost" onClick={() => onChange(EMPTY_FILTER)}>
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          {t.community.filterReset}
        </Button>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="min-w-36 flex-1 space-y-1">
      <span className="text-xs font-bold uppercase tracking-wide text-text-faint">
        {label}
      </span>
      {children}
    </label>
  );
}
