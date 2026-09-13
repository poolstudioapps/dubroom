'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { useT } from '@/lib/i18n';
import { AppShell } from '@/components/app-shell';
import { PendingRenders } from '@/components/pending-renders';
import { StatusBadge } from '@/components/status-badge';
import { Alert, Button, Card, Dialog, Input, Spinner } from '@/components/ui';
import { STORAGE_QUOTA_BYTES, STORAGE_WARN_RATIO } from '@/config/constants';
import { formatBytes, formatDuration } from '@/config/strings';
import { useMyProfile } from '@/lib/profile';
import { deleteSession, joinSession } from '@/lib/actions';
import { queryKeys, useMySessions, useStorageUsage } from '@/lib/data';
import { humanizeError } from '@/lib/errors';
import type { SessionRow } from '@/lib/supabase/database.types';
import { normalizeSessionCode } from '@/lib/utils';

/**
 * Mes scenes.
 *
 * La page ne fait plus qu'une chose : lister ses scenes et en rejoindre
 * une. Le mot de passe, la liste d'invites et la jauge de stockage ont
 * rejoint « Mon compte », ou on va les chercher quand on les cherche.
 */
export function SessionsClient({
  userId,
  displayName,
}: {
  userId: string;
  displayName: string;
}) {
  const t = useT();

  const router = useRouter();
  const qc = useQueryClient();
  const sessions = useMySessions();
  const profile = useMyProfile();
  const usage = useStorageUsage();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SessionRow | null>(null);

  const join = useMutation({
    mutationFn: () =>
      joinSession(
        normalizeSessionCode(code),
        profile.data?.display_name ?? displayName,
      ),
    onSuccess: (session) => router.push(`/s/${session.code}`),
    onError: (e) => setError(humanizeError(e)),
  });

  const remove = useMutation({
    mutationFn: (session: SessionRow) => deleteSession(session),
    onSuccess: () => {
      setPendingDelete(null);
      void qc.invalidateQueries({ queryKey: queryKeys.sessions });
      void qc.invalidateQueries({ queryKey: queryKeys.storage });
    },
    onError: (e) => setError(humanizeError(e)),
  });

  const crowded = (usage.data ?? 0) / STORAGE_QUOTA_BYTES >= STORAGE_WARN_RATIO;

  return (
    <AppShell className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="titre text-3xl">
          {t.sessions.title}
        </h1>
        <Button variant="primary" onClick={() => router.push('/sessions/new')}>
          <Plus className="h-4 w-4" aria-hidden />
          {t.sessions.create}
        </Button>
      </div>

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {crowded ? <Alert tone="warn">{t.sessions.storageWarning}</Alert> : null}

      {/* Les montages qui tournent sans nous : on les retrouve ici. */}
      <PendingRenders />

      {/* Les scenes, d'abord : c'est pour elles qu'on vient. */}
      <section className="space-y-3">
        {sessions.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-text-faint">
            <Spinner />
            {t.common.loading}
          </div>
        ) : null}

        {sessions.isSuccess && sessions.data.length === 0 ? (
          <Card className="space-y-3 py-8 text-center">
            <p className="text-sm text-text-muted">{t.sessions.empty}</p>
            <Button variant="primary" onClick={() => router.push('/sessions/new')}>
              <Plus className="h-4 w-4" aria-hidden />
              {t.sessions.create}
            </Button>
          </Card>
        ) : null}

        {/* Une liste, pas une pile de cadres : un filet sous chaque
            rangee suffit a les separer. */}
        <div className={sessions.data?.length ? 'panel px-4' : undefined}>
          {sessions.data?.map((session) => (
            // Le titre tient sur une ligne et les actions ne passent jamais
            // dessous : un titre long renvoyait « Ouvrir » a la ligne, et
            // la liste perdait sa colonne de boutons sur telephone.
            <div key={session.id} className="row flex items-center gap-3 px-1 py-3">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/s/${session.code}`}
                  className="block truncate font-bold hover:text-link hover:underline"
                  title={session.title ?? undefined}
                >
                  {session.title ?? t.common.untitled}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-faint">
                  <StatusBadge status={session.status} />
                  <span>
                    <span className="font-mono uppercase">{session.code}</span>
                    {session.duration_ms
                      ? ` · ${formatDuration(session.duration_ms)}`
                      : ''}
                    {session.render_size_bytes
                      ? ` · ${formatBytes(session.render_size_bytes)}`
                      : ''}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <Button size="sm" onClick={() => router.push(`/s/${session.code}`)}>
                  {t.sessions.open}
                </Button>
                {/* Sans corbeille, une case vide garde « Ouvrir » aligne
                    sur les autres rangees. */}
                {session.host_id === userId ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`${t.common.delete} : ${session.title ?? session.code}`}
                    onClick={() => setPendingDelete(session)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </Button>
                ) : (
                  <span className="h-9 w-9" aria-hidden />
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Rejoindre : c'est une action, pas un reglage. Elle reste visible. */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-sm font-bold">{t.sessions.joinByCode}</h2>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              join.mutate();
            }}
          >
            <Input
              value={code}
              onChange={(e) => setCode(normalizeSessionCode(e.target.value))}
              placeholder={t.sessions.codePlaceholder}
              maxLength={6}
              aria-label={t.sessions.joinByCode}
              className="min-w-0 flex-1 font-mono uppercase tracking-[0.3em] sm:w-40 sm:flex-none"
            />
            <Button type="submit" loading={join.isPending} disabled={code.length < 6}>
              {t.sessions.join}
            </Button>
          </form>
        </div>
      </Card>

      <Dialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title={t.sessions.deleteConfirmTitle}
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
        {t.sessions.deleteConfirmBody}
      </Dialog>
    </AppShell>
  );
}
