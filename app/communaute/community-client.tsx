'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useT } from '@/lib/i18n';
import { AppShell } from '@/components/app-shell';
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
import { Alert, Button, Card, Dialog, Spinner } from '@/components/ui';
import { PACKS_QUERY, deletePack, startFromPack, type Pack } from '@/lib/packs';
import { humanizeError } from '@/lib/errors';
import { useMyProfile } from '@/lib/profile';
import { cn } from '@/lib/utils';

/**
 * Le catalogue des scenes preparees.
 *
 * Reserve aux invites, comme le reste du produit : ce sont des extraits
 * d'oeuvres protegees, et c'est le caractere prive de l'usage qui rend
 * l'exercice tenable (PRD §14). Il n'y a donc ni recherche publique, ni
 * partage vers l'exterieur, ni indexation.
 *
 * La meme page sert « Mes packs », restreinte a ce que j'ai publie :
 * deux listes dessinees separement auraient diverge des la premiere
 * retouche.
 */
export function CommunityClient({
  displayName,
  scope = 'all',
}: {
  displayName: string;
  scope?: 'all' | 'mine';
}) {
  const t = useT();

  const router = useRouter();
  const qc = useQueryClient();
  const profile = useMyProfile();
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Pack | null>(null);
  /**
   * Quelle scene demarre.
   *
   * L'etat de la mutation est commun a toutes les cartes : s'y fier
   * faisait tourner les dix boutons pour un seul clic.
   */
  const [startingId, setStartingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<PackFilter>(EMPTY_FILTER);
  const [sort, setSort] = useState<PackSort>(DEFAULT_SORT);

  const packs = useQuery(PACKS_QUERY);

  const start = useMutation({
    mutationFn: (pack: Pack) =>
      startFromPack(pack.id, profile.data?.display_name ?? displayName),
    onSuccess: (session) => router.push(`/s/${session.code}/lobby`),
    onError: (e) => {
      setStartingId(null);
      setError(humanizeError(e));
    },
  });

  const remove = useMutation({
    mutationFn: (pack: Pack) => deletePack(pack),
    onSuccess: () => {
      setPendingDelete(null);
      void qc.invalidateQueries({ queryKey: ['packs'] });
    },
    onError: (e) => setError(humanizeError(e)),
  });

  // Deux etages : ce que la page montre par principe, puis ce que les
  // criteres laissent passer. Le premier decide si le catalogue est vide,
  // le second s'il faut elargir les criteres. Les deux messages different.
  const mine = (packs.data ?? []).filter((pack) => scope === 'all' || pack.is_mine);
  const visible = sortPacks(
    mine.filter((pack) => matchesFilter(pack, filter)),
    sort,
  );
  const strings = scope === 'mine' ? t.myPacks : t.community;

  return (
    <AppShell className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="max-w-2xl space-y-2">
          <h1 className="titre text-3xl sm:text-4xl">{strings.title}</h1>
          <p className="text-sm leading-relaxed text-text-muted">{strings.subtitle}</p>
        </div>
        {visible.length > 0 ? (
          <p className="text-sm font-semibold text-text-faint">
            {strings.sceneCount(visible.length)}
          </p>
        ) : null}
      </header>

      {error ? <Alert tone="danger">{error}</Alert> : null}

      {packs.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-text-faint">
          <Spinner />
          {t.common.loading}
        </div>
      ) : null}

      {mine.length > 1 ? (
        <PackFilters
          packs={mine}
          value={filter}
          onChange={setFilter}
          sort={sort}
          onSortChange={setSort}
        />
      ) : null}

      {packs.isSuccess && mine.length === 0 ? (
        <Card className="space-y-2 py-8 text-center">
          <h2 className="text-sm font-bold">{strings.emptyTitle}</h2>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-text-muted">
            {strings.emptyBody}
          </p>
        </Card>
      ) : null}

      {mine.length > 0 && visible.length === 0 ? (
        <Card className="space-y-2 py-8 text-center">
          <h2 className="text-sm font-bold">{t.community.filterNoMatch}</h2>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-text-muted">
            {t.community.filterNoMatchBody}
          </p>
        </Card>
      ) : null}

      {/* Une grille de catalogue, pas une pile de fiches. */}
      <ul className={cn('grid gap-4 sm:gap-5', packGridClass(visible.length))}>
        {visible.map((pack) => (
          <PackCard
            key={pack.id}
            pack={pack}
            showMine={scope === 'all'}
            starting={startingId === pack.id}
            locked={startingId !== null && startingId !== pack.id}
            onPlay={() => {
              setError(null);
              setStartingId(pack.id);
              start.mutate(pack);
            }}
            onDelete={pack.is_mine ? () => setPendingDelete(pack) : undefined}
          />
        ))}
      </ul>

      {visible.length > 0 ? (
        <div className="space-y-1 border-t border-border pt-4 text-xs leading-relaxed text-text-faint">
          <p>{t.community.voteHelp}</p>
          <p>{t.community.recipeHelp}</p>
        </div>
      ) : null}

      <Dialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title={t.community.removeTitle}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingDelete(null)}>
              {t.common.cancel}
            </Button>
            <Button
              variant="danger"
              loading={remove.isPending}
              onClick={() => pendingDelete && remove.mutate(pendingDelete)}
            >
              {t.common.delete}
            </Button>
          </>
        }
      >
        {t.community.removeBody}
      </Dialog>
    </AppShell>
  );
}
