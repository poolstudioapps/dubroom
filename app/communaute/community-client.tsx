'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Clapperboard, Trash2 } from 'lucide-react';

import { AppShell } from '@/components/app-shell';
import { UrlPreview } from '@/components/url-preview';
import { Alert, Badge, Button, Card, Dialog, Spinner } from '@/components/ui';
import { characterColorVar } from '@/config/constants';
import { formatBytes, formatDuration, t } from '@/config/strings';
import { deletePack, listPacks, startFromPack, type Pack } from '@/lib/packs';
import { humanizeError } from '@/lib/errors';
import { useMyProfile } from '@/lib/profile';

/**
 * Le catalogue des scenes preparees.
 *
 * Reserve aux invites, comme le reste du produit : ce sont des extraits
 * d'oeuvres protegees, et c'est le caractere prive de l'usage qui rend
 * l'exercice tenable (PRD §14). Il n'y a donc ni recherche publique, ni
 * partage vers l'exterieur, ni indexation.
 */
export function CommunityClient({
  displayName,
  scope = 'all',
}: {
  displayName: string;
  /** 'mine' : la meme page, restreinte a ce que j'ai publie. */
  scope?: 'all' | 'mine';
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const profile = useMyProfile();
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Pack | null>(null);
  /**
   * Quelle scene est en train de demarrer.
   *
   * L'etat de la mutation est commun a toutes les cartes : s'y fier
   * faisait tourner les dix boutons pour un seul clic, et laissait croire
   * qu'on avait lance dix scenes.
   */
  const [startingId, setStartingId] = useState<string | null>(null);

  const packs = useQuery({ queryKey: ['packs'], queryFn: listPacks });

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

  const visible = (packs.data ?? []).filter(
    (pack) => scope === 'all' || pack.is_mine,
  );
  const count = visible.length;
  const strings = scope === 'mine' ? t.myPacks : t.community;

  return (
    <AppShell className="space-y-6">
      <header className="space-y-1">
        <h1 className="signage text-3xl" style={{ textShadow: 'none' }}>
          {strings.title}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-text-muted">
          {strings.subtitle}
        </p>
        {count > 0 ? (
          <p className="text-xs font-bold uppercase tracking-widest text-text-faint">
            {strings.sceneCount(count)}
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

      {packs.isSuccess && count === 0 ? (
        <Card className="space-y-2">
          <h2 className="text-sm font-bold">{strings.emptyTitle}</h2>
          <p className="text-sm leading-relaxed text-text-muted">
            {strings.emptyBody}
          </p>
        </Card>
      ) : null}

      <ul className="grid gap-4 md:grid-cols-2">
        {visible.map((pack) => (
          <li key={pack.id} className="flex">
            <Card className="flex w-full flex-col gap-3">
              {pack.kind === 'url' && pack.source_url ? (
                <UrlPreview url={pack.source_url} title={pack.title} />
              ) : null}

              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-bold leading-snug">{pack.title}</h2>
                  <div className="flex shrink-0 flex-wrap justify-end gap-1">
                    <Badge tone={pack.kind === 'url' ? 'neutral' : 'warn'}>
                      {pack.kind === 'url'
                        ? t.community.kindRecipe
                        : t.community.kindMedia}
                    </Badge>
                    {pack.is_mine && scope === 'all' ? (
                      <Badge tone="accent">{t.community.mine}</Badge>
                    ) : null}
                  </div>
                </div>
                <p className="text-xs text-text-faint">
                  {formatDuration(pack.duration_ms)} ·{' '}
                  {t.community.characterCount(pack.character_count)} ·{' '}
                  {t.community.lineCount(pack.line_count)}
                  {pack.kind === 'media' ? ` · ${formatBytes(pack.size_bytes)}` : ''}
                </p>
                <p className="text-xs leading-relaxed text-text-faint">
                  {pack.kind === 'url' ? t.community.recipeHelp : t.community.mediaHelp}
                </p>
              </div>

              <ul className="flex flex-wrap gap-1.5">
                {pack.characters.map((character) => (
                  <li
                    key={character.name}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-surface-raised px-2 py-0.5 text-xs font-bold"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: characterColorVar(character.color) }}
                      aria-hidden
                    />
                    {character.name}
                  </li>
                ))}
              </ul>

              <div className="mt-auto flex items-center gap-2 pt-1">
                <Button
                  variant="primary"
                  className="flex-1"
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
                {pack.is_mine ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`${t.community.remove} — ${pack.title}`}
                    onClick={() => setPendingDelete(pack)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </Button>
                ) : null}
              </div>
            </Card>
          </li>
        ))}
      </ul>

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
