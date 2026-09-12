'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Clapperboard } from 'lucide-react';

import {
  DEFAULT_SORT,
  EMPTY_FILTER,
  PackFilters,
  matchesFilter,
  sortPacks,
  type PackFilter,
  type PackSort,
} from '@/components/pack-filters';
import { Alert, Badge, Button, Card, Spinner } from '@/components/ui';
import { characterColorVar } from '@/config/constants';
import { formatDuration } from '@/config/strings';
import { humanizeError } from '@/lib/errors';
import { useT } from '@/lib/i18n';
import { PACKS_QUERY, startFromPack, type Pack } from '@/lib/packs';
import { useMyProfile } from '@/lib/profile';

/**
 * Partir d'une scene deja preparee, depuis l'ecran de creation.
 *
 * Le catalogue existait deja, mais dans un autre onglet. Quelqu'un qui
 * veut jouer commence par « Nouvelle scene » et y trouvait deux
 * reponses : un fichier, un lien. La troisieme, de loin la plus rapide
 * puisqu'il n'y a rien a preparer, se trouvait ailleurs et n'etait donc
 * jamais choisie.
 *
 * La liste est volontairement courte ici : les scenes les mieux notees,
 * avec les memes criteres que le catalogue. Qui veut tout voir a
 * l'onglet Communaute, et le lien y mene.
 */
export function PackSourcePicker({ displayName }: { displayName: string }) {
  const t = useT();
  const router = useRouter();
  const profile = useMyProfile();
  const [filter, setFilter] = useState<PackFilter>(EMPTY_FILTER);
  const [sort, setSort] = useState<PackSort>(DEFAULT_SORT);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const tous = packs.data ?? [];
  const visibles = sortPacks(
    tous.filter((pack) => matchesFilter(pack, filter)),
    sort,
  );

  if (packs.isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-text-faint">
        <Spinner />
        {t.common.loading}
      </div>
    );
  }

  if (tous.length === 0) {
    return (
      <Card className="space-y-2 py-6 text-center">
        <h2 className="text-sm font-bold">{t.community.emptyTitle}</h2>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-text-muted">
          {t.community.emptyBody}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error ? <Alert tone="danger">{error}</Alert> : null}

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
        <p className="py-4 text-center text-sm text-text-muted">
          {t.community.filterNoMatch}
        </p>
      ) : null}

      <ul className="panel divide-y divide-border px-4">
        {visibles.map((pack) => (
          <li
            key={pack.id}
            className="flex flex-wrap items-center justify-between gap-3 py-3"
          >
            <div className="min-w-0 space-y-1">
              <p className="font-bold leading-snug">{pack.title}</p>
              <p className="text-xs text-text-faint">
                {formatDuration(pack.duration_ms)} ·{' '}
                {t.community.characterCount(pack.character_count)} ·{' '}
                {t.community.lineCount(pack.line_count)}
              </p>
              <ul className="flex flex-wrap items-center gap-1.5">
                {pack.characters.map((character) => (
                  <li
                    key={character.name}
                    className="inline-flex items-center gap-1.5 rounded-full bg-surface-sunken px-2 py-0.5 text-xs font-bold"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: characterColorVar(character.color) }}
                      aria-hidden
                    />
                    {character.name}
                  </li>
                ))}
                <li>
                  <Badge>{t.community.genreNames[pack.genre]}</Badge>
                </li>
              </ul>
            </div>

            <Button
              variant="primary"
              loading={startingId === pack.id}
              disabled={startingId !== null && startingId !== pack.id}
              onClick={() => {
                setError(null);
                setStartingId(pack.id);
                start.mutate(pack);
              }}
            >
              <Clapperboard className="h-4 w-4" aria-hidden />
              {t.community.play}
            </Button>
          </li>
        ))}
      </ul>

      <p className="text-xs leading-relaxed text-text-faint">{t.create.packHelp}</p>
    </div>
  );
}
