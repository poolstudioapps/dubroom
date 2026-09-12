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
 * L'ordre du catalogue.
 *
 * Les criteres ne disent pas la meme chose et ne servent pas au meme
 * moment. On cherche la mieux notee quand on ne sait pas quoi jouer, la
 * plus recente quand on suit ce que le groupe publie, la plus courte
 * quand il reste vingt minutes avant que tout le monde parte, et le
 * titre quand on sait deja ce qu'on veut.
 */
export const PACK_SORTS = ['popular', 'recent', 'short', 'title'] as const;

export type PackSort = (typeof PACK_SORTS)[number];

/** Ce que la base renvoie deja : inutile de la contredire au premier rendu. */
export const DEFAULT_SORT: PackSort = 'popular';

/**
 * Ordonne une copie de la liste.
 *
 * Copie, parce que `sort` travaille sur place et que la liste vient du
 * cache de requetes : la trier la retournerait aussi pour tous les
 * autres ecrans qui la partagent.
 *
 * Chaque critere a un second rang, sinon deux scenes a egalite
 * changeraient de place a chaque rendu, ce qui se voit et donne
 * l'impression que la page bouge toute seule.
 */
export function sortPacks(packs: Pack[], sort: PackSort): Pack[] {
  const recent = (a: Pack, b: Pack) => b.created_at.localeCompare(a.created_at);

  return [...packs].sort((a, b) => {
    if (sort === 'recent') return recent(a, b);
    if (sort === 'short') return a.duration_ms - b.duration_ms || recent(a, b);
    if (sort === 'title') return a.title.localeCompare(b.title);
    return b.score - a.score || recent(a, b);
  });
}

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
 *
 * Le tri est en tete, et non parmi les criteres : filtrer retire des
 * scenes, trier n'en retire aucune. Les melanger ferait chercher un
 * filtre disparu la ou il n'a jamais ete.
 */
export function PackFilters({
  packs,
  value,
  onChange,
  sort,
  onSortChange,
}: {
  packs: Pack[];
  value: PackFilter;
  onChange: (next: PackFilter) => void;
  sort: PackSort;
  onSortChange: (next: PackSort) => void;
}) {
  const t = useT();

  const langs = [
    ...new Set(packs.map((p) => p.source_lang).filter(Boolean)),
  ].sort() as string[];
  const genres = PACK_GENRES.filter((g) => packs.some((p) => p.genre === g));
  const active = value.lang || value.genre || value.cast || value.length;

  return (
    <div className="flex flex-wrap items-end gap-2">
      <Field label={t.community.sort.label}>
        <Select
          value={sort}
          aria-label={t.community.sort.label}
          onChange={(e) => onSortChange(e.target.value as PackSort)}
        >
          {PACK_SORTS.map((key) => (
            <option key={key} value={key}>
              {t.community.sort[key]}
            </option>
          ))}
        </Select>
      </Field>

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
