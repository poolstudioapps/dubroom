'use client';

import { useEffect, useRef, useState } from 'react';

import { useT } from '@/lib/i18n';
import { PhaseProgress } from '@/components/scene/phase-progress';
import { Alert } from '@/components/ui';
import { avancementGlobal, libellePhase } from '@/lib/progress';

import type { JobState } from '@/lib/data';

/**
 * L'attente, en une seule barre.
 *
 * Elle avance d'un bout a l'autre de la preparation au lieu de repartir
 * a zero a chaque etape (voir `lib/progress.ts`), et elle ne recule
 * jamais : une tache rendue a la file — le PC de l'hote qui passe le
 * relais a Google, une reprise apres incident — ne fait pas revenir la
 * barre en arriere.
 *
 * Sous la barre, ce qui se passe, en mots de joueur : le son, les voix,
 * les dialogues. Pas le nom des outils.
 *
 * Un cas garde son message a lui : quand aucun worker ne tourne, l'hote
 * doit savoir qu'il a oublie de lancer son PC, sinon il croit que c'est
 * casse (PRD §12.1).
 */
export function JobProgress({
  state,
  kind,
  needsLocal = false,
  depart = 0,
}: {
  state: JobState | undefined;
  kind: 'ingest' | 'render';
  /** La tache doit telecharger depuis YouTube : seul le PC de l'hote le peut. */
  needsLocal?: boolean;
  /** La part deja faite avant la tache : l'envoi de la video. */
  depart?: number;
}) {
  const t = useT();
  const job = state?.job ?? null;
  const enAttente = !job || job.status === 'queued';

  const brut = job
    ? avancementGlobal(kind, enAttente ? null : job.step, job.progress, depart)
    : depart;

  // Le plus haut atteint pour cette tache : la barre ne recule pas.
  const plusHaut = useRef<{ id: string | null; valeur: number }>({ id: null, valeur: 0 });
  if ((job?.id ?? null) !== plusHaut.current.id) {
    plusHaut.current = { id: job?.id ?? null, valeur: 0 };
  }
  const valeur = Math.max(brut, depart, plusHaut.current.valeur);
  plusHaut.current.valeur = valeur;

  /*
   * L'alerte « aucun worker » n'attend pas le meme temps pour tout.
   *
   * Un telechargement YouTube n'a qu'un worker possible, celui du PC, qui
   * interroge la file toutes les deux secondes : au-dela de dix, c'est que
   * personne n'a lance le script. Le reste part chez Google, qu'il faut
   * d'abord demarrer ; le PC reprend la tache s'il ne s'est rien passe
   * apres deux minutes et demie. L'alerte ne sonne donc qu'une fois ces
   * deux chances passees.
   */
  const reference = job?.queued_at ?? job?.created_at;
  const attenteS = reference ? (Date.now() - new Date(reference).getTime()) / 1000 : 0;
  const seuilS = needsLocal ? 10 : 240;
  const waitingForWorker =
    job?.status === 'queued' && !state?.workerOnline && attenteS > seuilS;

  const elapsed = useElapsedSeconds(job?.status === 'running');
  const note = enAttente
    ? null
    : valeur >= 92
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

      <PhaseProgress
        titre={kind === 'ingest' ? t.progress.preparing : t.progress.rendering}
        phase={libellePhase(t, kind, job?.step ?? null, enAttente)}
        valeur={valeur}
        note={note}
      />

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
