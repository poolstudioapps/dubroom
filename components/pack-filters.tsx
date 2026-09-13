'use client';

import { ChevronDown, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { PACK_GENRES, type Pack, type PackGenre } from '@/lib/packs';
import { cn } from '@/lib/utils';

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
 * Une barre de pastilles plutot qu'un formulaire : quatre libelles en
 * capitales au-dessus de quatre grands champs prenaient plus de place
 * que la premiere rangee de scenes, pour des criteres qu'on touche
 * rarement. Le critere en cours d'usage se distingue des autres.
 *
 * Le tri est a part, a droite : filtrer retire des scenes, trier n'en
 * retire aucune. Les melanger ferait chercher un filtre disparu la ou il
 * n'a jamais ete.
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

  // Sur telephone, une seule rangee qui defile de cote : quatre pastilles
  // empilees occupaient tout le premier ecran avant la moindre scene.
  return (
    <div className="-mx-3 flex items-center gap-2 overflow-x-auto px-3 pb-1.5 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [&>*]:shrink-0">
      {langs.length > 1 ? (
        <FilterPill
          label={t.community.filterLang}
          value={value.lang}
          onChange={(lang) => onChange({ ...value, lang })}
          options={[
            { value: '', label: t.community.filterAll },
            ...langs.map((code) => ({
              value: code,
              label: t.community.langNames[code] ?? code,
            })),
          ]}
        />
      ) : null}

      {genres.length > 1 ? (
        <FilterPill
          label={t.community.filterGenre}
          value={value.genre}
          onChange={(genre) => onChange({ ...value, genre })}
          options={[
            { value: '' as const, label: t.community.filterAllGenres },
            ...genres.map((g) => ({ value: g, label: t.community.genreNames[g] ?? g })),
          ]}
        />
      ) : null}

      <FilterPill
        label={t.community.filterCast}
        value={value.cast}
        onChange={(cast) => onChange({ ...value, cast })}
        options={[
          { value: '' as const, label: t.community.filterAnyCast },
          ...(['solo', 'duo', 'small', 'large'] as const).map((k) => ({
            value: k,
            label: t.community.castBuckets[k] ?? k,
          })),
        ]}
      />

      <FilterPill
        label={t.community.filterLength}
        value={value.length}
        onChange={(length) => onChange({ ...value, length })}
        options={[
          { value: '' as const, label: t.community.filterAnyLength },
          ...(['short', 'medium', 'long'] as const).map((k) => ({
            value: k,
            label: t.community.lengthBuckets[k] ?? k,
          })),
        ]}
      />

      {active ? (
        <Button size="sm" variant="ghost" onClick={() => onChange(EMPTY_FILTER)}>
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          {t.community.filterReset}
        </Button>
      ) : null}

      <div className="sm:ml-auto">
        <FilterPill
          label={t.community.sort.label}
          value={sort}
          onChange={onSortChange}
          neutral
          options={PACK_SORTS.map((key) => ({ value: key, label: t.community.sort[key] }))}
        />
      </div>
    </div>
  );
}

/**
 * Une pastille qui s'ouvre sur une liste.
 *
 * Le `select` du systeme couvre toute la pastille, invisible : on garde
 * la roulette native sur telephone, le clavier et le lecteur d'ecran,
 * et c'est la pastille entiere qui se touche — pas seulement le mot.
 */
function FilterPill<V extends string>({
  label,
  value,
  options,
  onChange,
  neutral,
}: {
  label: string;
  value: V;
  options: { value: V; label: string }[];
  onChange: (next: V) => void;
  /** Le tri a toujours une valeur : il ne s'allume pas comme un filtre. */
  neutral?: boolean;
}) {
  const current = options.find((option) => option.value === value)?.label ?? '';

  return (
    <label className={cn('filtre', !neutral && value !== '' && 'filtre-actif')}>
      <span className="filtre-nom">{label}</span>
      <span className="filtre-valeur">{current}</span>
      <ChevronDown className="filtre-chevron h-3.5 w-3.5 shrink-0" aria-hidden />
      <select
        value={value}
        aria-label={label}
        onChange={(e) => onChange(e.target.value as V)}
        className="filtre-select"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
