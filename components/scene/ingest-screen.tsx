'use client';

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { JobProgress } from '@/components/scene/job-progress';
import { useSceneCtx } from '@/components/scene-page';
import { Alert, Button, Card } from '@/components/ui';
import { t } from '@/config/strings';
import { enqueueIngest } from '@/lib/actions';
import { useJobState } from '@/lib/data';
import { humanizeError } from '@/lib/errors';

export function IngestScreen() {
  const { session, isHost, refetch } = useSceneCtx();
  const jobState = useJobState(session.id);
  const [error, setError] = useState<string | null>(null);

  const retry = useMutation({
    mutationFn: () => enqueueIngest(session.id, session.upload_path),
    onSuccess: () => refetch(),
    onError: (e) => setError(humanizeError(e)),
  });

  // Les joueurs peuvent arriver avant que l'hote ait fini de preparer :
  // ils n'ont rien a faire ici, autant le dire.
  if (session.status === 'prepping' && !isHost) {
    return (
      <Card className="mx-auto max-w-lg space-y-2">
        <h1 className="text-lg font-semibold">{session.title ?? t.ingest.title}</h1>
        <p className="text-sm text-text-muted">
          L’hôte met au point les personnages. Le lobby s’ouvrira dans un instant.
        </p>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-lg space-y-5">
      <header>
        <h1 className="text-lg font-semibold">{session.title ?? t.ingest.title}</h1>
        <p className="text-sm text-text-faint">{t.ingest.subtitle}</p>
      </header>

      <JobProgress state={jobState.data} kind="ingest" />

      {session.status === 'ingest_failed' ? (
        <div className="space-y-2">
          <Alert tone="danger">{t.ingest.failed}</Alert>
          {isHost ? (
            <Button
              variant="primary"
              loading={retry.isPending}
              onClick={() => {
                setError(null);
                retry.mutate();
              }}
            >
              {t.ingest.retry}
            </Button>
          ) : null}
        </div>
      ) : null}

      {error ? <Alert tone="danger">{error}</Alert> : null}
    </Card>
  );
}
