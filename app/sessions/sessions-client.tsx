'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { KeyRound, Plus, Trash2, UserPlus } from 'lucide-react';

import { AppShell } from '@/components/app-shell';
import { GuestListCard } from '@/components/guest-list-card';
import { PasswordCard } from '@/components/password-card';
import { StatusBadge } from '@/components/status-badge';
import {
  Alert,
  Button,
  Card,
  Dialog,
  Disclosure,
  Input,
  Progress,
  Spinner,
} from '@/components/ui';
import { STORAGE_QUOTA_BYTES, STORAGE_WARN_RATIO } from '@/config/constants';
import { formatBytes, formatDuration, t } from '@/config/strings';
import { deleteSession, joinSession } from '@/lib/actions';
import { queryKeys, useMySessions, useStorageUsage } from '@/lib/data';
import { humanizeError } from '@/lib/errors';
import type { SessionRow } from '@/lib/supabase/database.types';
import { normalizeSessionCode } from '@/lib/utils';

/**
 * L'ecran d'accueil de l'application connectee.
 *
 * L'ordre a ete revu : ce qu'on vient chercher ici, ce sont ses scenes.
 * Elles etaient sous trois panneaux de reglages — mot de passe, liste
 * d'invites, jauge de stockage — qu'on ouvre trois fois par an. Ces
 * reglages sont desormais dans un tiroir, ferme par defaut.
 */
export function SessionsClient({
  userId,
  displayName,
}: {
  userId: string;
  displayName: string;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const sessions = useMySessions();
  const usage = useStorageUsage();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SessionRow | null>(null);

  const join = useMutation({
    mutationFn: () => joinSession(normalizeSessionCode(code), displayName),
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

  const used = usage.data ?? 0;
  const ratio = used / STORAGE_QUOTA_BYTES;
  const crowded = ratio >= STORAGE_WARN_RATIO;

  return (
    <AppShell className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="signage text-3xl" style={{ textShadow: 'none' }}>
          {t.sessions.title}
        </h1>
        <Button variant="primary" onClick={() => router.push('/sessions/new')}>
          <Plus className="h-4 w-4" aria-hidden />
          {t.sessions.create}
        </Button>
      </div>

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {crowded ? <Alert tone="warn">{t.sessions.storageWarning}</Alert> : null}

      {/* Les scenes, d'abord : c'est pour elles qu'on vient. */}
      <section className="space-y-2">
        {sessions.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-text-faint">
            <Spinner />
            {t.common.loading}
          </div>
        ) : null}

        {sessions.isSuccess && sessions.data.length === 0 ? (
          <Card className="space-y-2 text-center">
            <p className="text-sm text-text-muted">{t.sessions.empty}</p>
            <Button variant="primary" onClick={() => router.push('/sessions/new')}>
              <Plus className="h-4 w-4" aria-hidden />
              {t.sessions.create}
            </Button>
          </Card>
        ) : null}

        {sessions.data?.map((session) => (
          <Card
            key={session.id}
            className="flex flex-wrap items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/s/${session.code}`}
                  className="truncate font-bold hover:text-link hover:underline"
                >
                  {session.title ?? 'Scène sans titre'}
                </Link>
                <StatusBadge status={session.status} />
              </div>
              <p className="mt-0.5 text-xs text-text-faint">
                <span className="font-mono uppercase">{session.code}</span>
                {session.duration_ms ? ` · ${formatDuration(session.duration_ms)}` : ''}
                {session.render_size_bytes
                  ? ` · ${formatBytes(session.render_size_bytes)}`
                  : ''}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => router.push(`/s/${session.code}`)}>
                {t.sessions.open}
              </Button>
              {session.host_id === userId ? (
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`${t.common.delete} — ${session.title ?? session.code}`}
                  onClick={() => setPendingDelete(session)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </Button>
              ) : null}
            </div>
          </Card>
        ))}
      </section>

      {/* Rejoindre : c'est une action, pas un reglage. Elle reste visible. */}
      <Card className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <h2 className="text-sm font-bold">{t.sessions.joinByCode}</h2>
          <form
            className="flex flex-wrap gap-2"
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
              className="max-w-40 font-mono uppercase tracking-[0.3em]"
            />
            <Button type="submit" loading={join.isPending} disabled={code.length < 6}>
              {t.sessions.join}
            </Button>
          </form>
        </div>
      </Card>

      {/* Les reglages, dans un tiroir. Ouvert d'office si le disque se remplit. */}
      <div className="space-y-3">
        <Disclosure
          title={t.auth.passwordSectionTitle}
          icon={<KeyRound className="h-4 w-4" aria-hidden />}
        >
          <PasswordCard bare />
        </Disclosure>

        <Disclosure
          title={t.guests.title}
          icon={<UserPlus className="h-4 w-4" aria-hidden />}
        >
          <GuestListCard bare />
        </Disclosure>

        <Disclosure
          title={t.sessions.storageTitle}
          hint={t.sessions.storageUsed(
            formatBytes(used),
            formatBytes(STORAGE_QUOTA_BYTES),
          )}
          defaultOpen={crowded}
        >
          <Progress value={Math.round(ratio * 100)} />
          <p className="text-xs leading-relaxed text-text-faint">
            {t.sessions.storageHelp}
          </p>
        </Disclosure>
      </div>

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
