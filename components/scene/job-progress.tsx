'use client';

import { Check, CircleDashed, Loader2 } from 'lucide-react';

import { Alert, Progress } from '@/components/ui';
import { INGEST_STEPS, RENDER_STEPS } from '@/config/constants';
import { t } from '@/config/strings';
import type { JobState } from '@/lib/data';
import { cn } from '@/lib/utils';

/**
 * Progression detaillee, etape par etape.
 *
 * Ce niveau de detail est un besoin produit, pas un ornement : sans lui,
 * cinq minutes de pipeline ressemblent a un plantage (PRD §6.1). Le cas
 * « aucun worker ne tourne » a son propre message, sinon l'hote croit que
 * c'est casse alors qu'il a juste oublie de lancer son PC (PRD §12.1).
 */
export function JobProgress({
  state,
  kind,
}: {
  state: JobState | undefined;
  kind: 'ingest' | 'render';
}) {
  const job = state?.job ?? null;
  const steps = kind === 'ingest' ? INGEST_STEPS : RENDER_STEPS;
  const labels: Record<string, string> =
    kind === 'ingest' ? t.ingest.steps : t.render.steps;

  const currentIndex = job?.step
    ? (steps as readonly string[]).indexOf(job.step)
    : -1;

  const waitingForWorker =
    job?.status === 'queued' && !state?.workerOnline;

  return (
    <div className="space-y-4">
      {waitingForWorker ? (
        <Alert tone="warn">
          <p className="font-medium">
            {kind === 'ingest' ? t.ingest.queued : t.render.queued}
          </p>
          <p className="mt-1 text-xs opacity-80">{t.ingest.queuedHelp}</p>
        </Alert>
      ) : null}

      <Progress
        value={job?.progress ?? 0}
        indeterminate={job?.status === 'queued'}
      />

      <ol className="space-y-1.5">
        {steps.map((step, index) => {
          const done = currentIndex > index || job?.status === 'done';
          const active = currentIndex === index && job?.status === 'running';
          return (
            <li
              key={step}
              className={cn(
                'flex items-center gap-2 text-sm',
                done && 'text-text-muted',
                active && 'text-text',
                !done && !active && 'text-text-faint',
              )}
            >
              {done ? (
                <Check className="h-4 w-4 text-ok" aria-hidden />
              ) : active ? (
                <Loader2 className="h-4 w-4 animate-spin text-link" aria-hidden />
              ) : (
                <CircleDashed className="h-4 w-4" aria-hidden />
              )}
              {labels[step] ?? step}
            </li>
          );
        })}
      </ol>

      {job?.error ? <Alert tone="danger">{job.error}</Alert> : null}
    </div>
  );
}
