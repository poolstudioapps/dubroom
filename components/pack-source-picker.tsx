'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { PackCard, packGridClass } from '@/components/pack-card';
import {
  DEFAULT_SORT,
  EMPTY_FILTER,
  PackFilters,
  matchesFilter,
  sortPacks,
  type PackFilter,
  type PackSort,
} from '@/components/pack-filters';
import { PackStartDialog } from '@/components/pack-start-dialog';
import { Card, Spinner } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { PACKS_QUERY, type Pack } from '@/lib/packs';
import { cn } from '@/lib/utils';

/**
 * Partir d'une scene deja preparee, depuis l'ecran de creation.
 *
 * Le catalogue existait deja, mais dans un autre onglet. Quelqu'un qui
 * veut jouer commence par « Nouvelle scene » et y trouvait deux
 * reponses : un fichier, un lien. La troisieme, de loin la plus rapide
 * puisqu'il n'y a rien a preparer, se trouvait ailleurs et n'etait donc
 * jamais choisie.
 *
 * Les cartes sont celles du catalogue, sans le vote, la suppression ni
 * la marque « La tienne » : ici on choisit une scene, on ne juge ni ne
 * range le catalogue. Le choix de la source de la video est le meme que
 * dans le catalogue.
 */
export function PackSourcePicker({ displayName }: { displayName: string }) {
  const t = useT();
  const [filter, setFilter] = useState<PackFilter>(EMPTY_FILTER);
  const [sort, setSort] = useState<PackSort>(DEFAULT_SORT);
  const [aDoubler, setADoubler] = useState<Pack | null>(null);

  const packs = useQuery(PACKS_QUERY);

  const tous = packs.data ?? [];
  const visibles = sortPacks(
    tous.filter((pack) => matchesFilter(pack, filter)),
    sort,
  );

  if (packs.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-text-faint">
        <Spinner />
        {t.common.loading}
      </div>
    );
  }

  if (tous.length === 0) {
    return (
      <Card className="mx-auto max-w-xl space-y-2 py-8 text-center">
        <h2 className="text-sm font-bold">{t.community.emptyTitle}</h2>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-text-muted">
          {t.community.emptyBody}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {tous.length > 1 ? (
        <PackFilters
          packs={tous}
          value={filter}
          onChange={setFilter}
          sort={sort}
          onSortChange={setSort}
        />
      ) : null}

      {visibles.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">
          {t.community.filterNoMatch}
        </p>
      ) : null}

      <ul className={cn('grid gap-4 sm:gap-5', packGridClass(visibles.length))}>
        {visibles.map((pack) => (
          <PackCard
            key={pack.id}
            pack={pack}
            showVote={false}
            showMine={false}
            onPlay={() => setADoubler(pack)}
          />
        ))}
      </ul>

      <p className="mx-auto max-w-2xl text-center text-xs leading-relaxed text-text-faint">
        {t.create.packHelp}
      </p>

      <PackStartDialog
        pack={aDoubler}
        displayName={displayName}
        onClose={() => setADoubler(null)}
      />
    </div>
  );
}
