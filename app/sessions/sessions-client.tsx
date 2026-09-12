'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { AppShell } from '@/components/app-shell';
import { GuestListCard } from '@/components/guest-list-card';
import { PasswordCard } from '@/components/password-card';
import { StatusBadge } from '@/components/status-badge';
import { Alert, Button, Card, Dialog, Input, Progress, Spinner } from '@/components/ui';
import { STORAGE_QUOTA_BYTES, STORAGE_WARN_RATIO } from '@/config/constants';
import { formatBytes, formatDuration, t } from '@/config/strings';
import { deleteSession, joinSession } from '@/lib/actions';
import { queryKeys, useMySessions, useStorageUsage } from '@/lib/data';
import { humanizeError } from '@/lib/errors';
import type { SessionRow } from '@/lib/supabase/database.types';
import { normalizeSessionCode } from '@/lib/utils';

export function SessionsClient({
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

  return (
    <AppShell className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="signage text-3xl" style={{ textShadow: 'none' }}>
            {t.sessions.title}
          </h1>
          <p className="text-sm text-text-faint">
            {t.sessions.storageUsed(
              formatBytes(used),
              formatBytes(STORAGE_QUOTA_BYTES),
            )}
          </p>
        </div>
        <Button variant="primary" onClick={() => router.push('/sessions/new')}>
          <Plus className="h-4 w-4" aria-hidden />
          {t.sessions.create}
        </Button>
      </div>

      <Progress value={Math.round(ratio * 100)} />
      {ratio >= STORAGE_WARN_RATIO ? (
        <Alert tone="warn">{t.sessions.storageWarning}</Alert>
      ) : null}

      {error ? <Alert tone="danger">{error}</Alert> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-3">
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
              className="max-w-40 font-mono tracking-[0.3em] uppercase"
            />
            <Button
              type="submit"
              loading={join.isPending}
              disabled={code.length < 6}
            >
              Rejoindre
            </Button>
          </form>
        </Card>

        <PasswordCard />
      </div>

      <GuestListCard />

      <section className="space-y-2">
        {sessions.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-text-faint">
            <Spinner />
            {t.common.loading}
          </div>
        ) : null}

        {sessions.data?.length === 0 ? (
          <p className="text-sm text-text-faint">{t.sessions.empty}</p>
        ) : null}

        {sessions.data?.map((session) => (
          <Card
            key={session.id}
            className="flex flex-wrap items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
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
              <Button
                size="icon"
                variant="ghost"
                aria-label={t.common.delete}
                onClick={() => setPendingDelete(session)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </section>

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
