'use client';

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { useT } from '@/lib/i18n';
import { JobProgress } from '@/components/scene/job-progress';
import { useSceneCtx } from '@/components/scene-page';
import { Alert, Button, Card } from '@/components/ui';

import { enqueueRender } from '@/lib/actions';
import { useJobState } from '@/lib/data';
import { humanizeError } from '@/lib/errors';

export function RenderScreen() {
  const t = useT();

  const { session, isHost, refetch } = useSceneCtx();
  const jobState = useJobState(session.id);
  const [error, setError] = useState<string | null>(null);

  const retry = useMutation({
    mutationFn: () => enqueueRender(session.id),
    onSuccess: () => refetch(),
    onError: (e) => setError(humanizeError(e)),
  });

  return (
    <Card className="mx-auto max-w-lg space-y-5">
      <header>
        <h1 className="titre text-2xl">
          {t.render.title}
        </h1>
        <p className="text-sm text-text-faint">{t.render.frozen}</p>
      </header>

      <JobProgress state={jobState.data} kind="render" />

      {session.status === 'render_failed' ? (
        <div className="space-y-2">
          <Alert tone="danger">{t.render.failed}</Alert>
          {isHost ? (
            <Button
              variant="primary"
              loading={retry.isPending}
              onClick={() => {
                setError(null);
                retry.mutate();
              }}
            >
              {t.render.retry}
            </Button>
          ) : null}
        </div>
      ) : null}

      {error ? <Alert tone="danger">{error}</Alert> : null}
    </Card>
  );
}
