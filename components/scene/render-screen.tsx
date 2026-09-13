'use client';

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Clock, House, Plus, RotateCcw, TriangleAlert } from 'lucide-react';

import { useT } from '@/lib/i18n';
import { LinkButton } from '@/components/link-button';
import { JobProgress } from '@/components/scene/job-progress';
import { useSceneCtx } from '@/components/scene-page';
import { Alert, Button, Card } from '@/components/ui';

import { enqueueRender } from '@/lib/actions';
import { useJobState } from '@/lib/data';
import { humanizeError } from '@/lib/errors';

/**
 * Le montage, puis son issue.
 *
 * En echec, la barre de progression disparait. Elle restait figee a
 * quatre-vingt-cinq pour cent, avec « Montage en cours » au-dessus et
 * deux messages d'erreur dessous : l'ecran disait a la fois que ca
 * avancait et que c'etait rate. Il ne dit plus qu'une chose, ce qui s'est
 * passe, et ce qu'on peut faire.
 */
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

  const echec = session.status === 'render_failed';
  const detail = jobState.data?.job?.error ?? null;

  return (
    <Card className="mx-auto max-w-lg space-y-5">
      <header>
        <h1 className="titre text-2xl">{echec ? t.render.failedTitle : t.render.title}</h1>
        <p className="text-sm text-text-faint">{t.render.frozen}</p>
      </header>

      {echec ? (
        <div className="space-y-4">
          <div className="flex gap-3 rounded-card border border-danger/40 bg-danger/10 p-4">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden />
            <div className="space-y-1 text-sm">
              <p className="font-bold">{t.render.failed}</p>
              <p className="text-text-muted">
                {isHost ? t.render.failedHost : t.render.failedGuest}
              </p>
            </div>
          </div>

          {isHost && detail ? (
            <details className="text-xs text-text-faint">
              <summary className="cursor-pointer select-none">{t.render.failedDetail}</summary>
              <p className="mt-1 break-words">{detail}</p>
            </details>
          ) : null}

          {isHost ? (
            <Button
              variant="primary"
              loading={retry.isPending}
              onClick={() => {
                setError(null);
                retry.mutate();
              }}
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              {t.render.retry}
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-5">
          <JobProgress
            state={jobState.data}
            kind="render"
            // Une scene YouTube se monte sur le PC de l'hote, et seulement la.
            needsLocal={session.source_type === 'youtube'}
          />

          {/*
            Le montage tourne sans personne : inutile de rester devant la
            barre. On le dit, on dit ou retrouver la scene, et on propose
            la suite plutot qu'une attente.
          */}
          <div className="space-y-3 rounded-card border border-border bg-surface-sunken p-4">
            <p className="flex gap-2 text-sm leading-relaxed text-text-muted">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
              {t.render.backgroundNotice}
            </p>
            <div className="flex flex-wrap gap-2">
              <LinkButton href="/sessions/new">
                <Plus className="h-4 w-4" aria-hidden />
                {t.render.ctaNewScene}
              </LinkButton>
              <LinkButton href="/" variant="secondary">
                <House className="h-4 w-4" aria-hidden />
                {t.render.ctaHome}
              </LinkButton>
            </div>
          </div>
        </div>
      )}

      {error ? <Alert tone="danger">{error}</Alert> : null}
    </Card>
  );
}
