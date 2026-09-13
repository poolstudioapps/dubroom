'use client';

import { useEffect, useState } from 'react';

import { useT } from '@/lib/i18n';
import { Alert, Progress, Spinner } from '@/components/ui';

import type { JobState } from '@/lib/data';

/**
 * L'attente, en une seule barre.
 *
 * Elle listait les six etapes du traitement : recuperation, encodage,
 * extraction, separation, transcription, decoupage. C'etait la vue du
 * developpeur, pas celle du joueur. Personne n'a besoin de savoir qu'on
 * telecharge quoi que ce soit, ni ce qu'est un mux, et cette liste
 * posait plus de questions qu'elle n'en reglait : que se passe-t-il si
 * « separation » dure trois minutes ? Est-ce normal ?
 *
 * Reste ce qui sert vraiment a patienter : ou on en est, et combien de
 * temps ca prend encore. La phrase du bas change au fil de l'avancement,
 * sans jamais nommer l'operation en cours.
 *
 * Un cas garde son message a lui : quand aucun worker ne tourne, l'hote
 * doit savoir qu'il a oublie de lancer son PC, sinon il croit que c'est
 * casse (PRD §12.1).
 */
export function JobProgress({
  state,
  kind,
}: {
  state: JobState | undefined;
  kind: 'ingest' | 'render';
}) {
  const t = useT();
  const job = state?.job ?? null;

  const progress = job?.progress ?? 0;
  const queued = job?.status === 'queued';

  /*
   * L'alerte « aucun worker » attend dix secondes, pas plus.
   *
   * Le worker du PC interroge la file toutes les deux secondes : une
   * tache tout juste creee n'a simplement pas encore ete vue, et le dire
   * aussitot ferait clignoter l'alerte a chaque import. Au-dela, c'est
   * que personne n'a lance le script, et il faut le dire vite. Une
   * minute avait ete accordee du temps ou le worker demarrait dans le
   * nuage ; ce n'est plus le cas.
   */
  const attenteS = job?.created_at
    ? (Date.now() - new Date(job.created_at).getTime()) / 1000
    : 0;
  const waitingForWorker = queued && !state?.workerOnline && attenteS > 10;

  // Le temps ecoule sert a la derniere phrase : au-dela de ce qu'on avait
  // annonce, mieux vaut le reconnaitre que laisser croire a un blocage.
  const elapsed = useElapsedSeconds(job?.status === 'running');

  const message = queued
    ? t.progress.queued
    : progress >= 90
      ? t.progress.almost
      : elapsed > 240
        ? t.progress.longer
        : t.progress.working;

  return (
    <div className="space-y-3">
      {waitingForWorker ? (
        <Alert tone="warn">
          <p className="font-medium">
            {kind === 'ingest' ? t.ingest.queued : t.render.queued}
          </p>
          <p className="mt-1 text-xs opacity-80">{t.ingest.queuedHelp}</p>
        </Alert>
      ) : null}

      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="flex items-center gap-2 font-bold">
          <Spinner />
          {kind === 'ingest' ? t.progress.preparing : t.progress.rendering}
        </span>
        {!queued ? (
          <span className="tabular-nums text-text-faint">{Math.round(progress)} %</span>
        ) : null}
      </div>

      <Progress value={progress} indeterminate={queued} />

      <p className="text-xs leading-relaxed text-text-faint">{message}</p>

      {job?.error ? <Alert tone="danger">{job.error}</Alert> : null}
    </div>
  );
}

/** Secondes ecoulees depuis que le traitement a demarre. */
function useElapsedSeconds(running: boolean): number {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!running) {
      setSeconds(0);
      return;
    }
    const started = Date.now();
    const timer = window.setInterval(
      () => setSeconds(Math.round((Date.now() - started) / 1000)),
      5_000,
    );
    return () => window.clearInterval(timer);
  }, [running]);

  return seconds;
}
