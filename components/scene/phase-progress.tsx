'use client';

import { Progress, Spinner } from '@/components/ui';

/**
 * La barre d'avancement d'une scene, partout la meme.
 *
 * Un titre, un pourcentage, une seule barre, et ce qui se passe en ce
 * moment en dessous. L'envoi de la video et la preparation l'utilisent
 * toutes deux, avec la meme echelle : l'une s'arrete ou l'autre reprend.
 */
export function PhaseProgress({
  titre,
  phase,
  valeur,
  note,
}: {
  titre: string;
  phase: string;
  valeur: number;
  note?: string | null;
}) {
  const arrondi = Math.round(Math.max(0, Math.min(100, valeur)));

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="flex min-w-0 items-center gap-2 font-bold">
          <Spinner />
          <span className="truncate">{titre}</span>
        </span>
        <span className="shrink-0 tabular-nums text-text-faint">{arrondi} %</span>
      </div>

      <Progress value={arrondi} />

      <p className="text-sm font-medium text-text-muted" aria-live="polite">
        {phase}
      </p>
      {note ? <p className="text-xs leading-relaxed text-text-faint">{note}</p> : null}
    </div>
  );
}
