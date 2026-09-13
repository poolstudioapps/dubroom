import type { Dictionary } from '@/config/i18n';

/**
 * L'avancement d'une scene, en une seule barre.
 *
 * Le worker rapporte l'etape en cours et son avancement propre, de 0 a
 * 100 : la barre repartait donc a zero a chaque etape, et l'envoi de la
 * video, sur l'ecran precedent, avait deja la sienne. Trois ou quatre
 * barres qui se remplissent l'une apres l'autre, c'est ne jamais savoir
 * ou l'on en est.
 *
 * Chaque etape recoit ici sa part de la barre, a peu pres a la mesure du
 * temps qu'elle prend, et l'envoi de la video en occupe le debut : la
 * barre de l'ecran d'import s'arrete a 15 %, et celle de la preparation
 * reprend exactement la.
 */

/** La part de la barre consacree a l'envoi de la video, quand il y en a un. */
export const PART_ENVOI = 15;

const ETAPES_PREPARATION = [
  ['download', 8],
  ['encode', 12],
  ['extract', 5],
  ['separate', 35],
  ['transcribe', 25],
  ['segment', 15],
] as const;

const ETAPES_RENDU = [
  ['fetch', 10],
  ['mix', 30],
  ['mux', 45],
  ['upload', 10],
  ['purge', 5],
] as const;

export type JobKind = 'ingest' | 'render';

/**
 * L'avancement global, de `depart` a 100.
 *
 * `depart` est la part deja faite avant la tache : l'envoi de la video,
 * pour une scene importee.
 */
export function avancementGlobal(
  kind: JobKind,
  step: string | null,
  progress: number,
  depart = 0,
): number {
  const etapes = kind === 'ingest' ? ETAPES_PREPARATION : ETAPES_RENDU;
  const rang = etapes.findIndex(([nom]) => nom === step);
  if (rang < 0) return depart;

  let fait = 0;
  for (let i = 0; i < rang; i += 1) fait += etapes[i]?.[1] ?? 0;
  const poids = etapes[rang]?.[1] ?? 0;
  fait += (poids * Math.max(0, Math.min(100, progress))) / 100;

  return depart + (fait * (100 - depart)) / 100;
}

/**
 * Ce qu'on dit de l'etape en cours.
 *
 * Assez precis pour qu'on sache que ca avance et pourquoi c'est long —
 * le son, les voix, les dialogues — sans nommer un encodage ou un
 * multiplexage que personne n'a besoin de connaitre.
 */
export function libellePhase(
  t: Dictionary,
  kind: JobKind,
  step: string | null,
  enAttente: boolean,
): string {
  const p = t.progress.phases;
  if (kind === 'ingest') {
    if (enAttente || !step) return p.queued;
    const noms: Record<string, string> = {
      download: p.download,
      encode: p.encode,
      extract: p.extract,
      separate: p.separate,
      transcribe: p.transcribe,
      segment: p.segment,
    };
    return noms[step] ?? p.queued;
  }

  if (enAttente || !step) return p.renderQueued;
  const noms: Record<string, string> = {
    fetch: p.fetch,
    mix: p.mix,
    mux: p.mux,
    upload: p.uploadRender,
    purge: p.purge,
  };
  return noms[step] ?? p.renderQueued;
}
