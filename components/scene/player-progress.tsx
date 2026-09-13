'use client';

import { useT } from '@/lib/i18n';
import { Badge, Progress } from '@/components/ui';
import { useSessionProgress } from '@/lib/data';
import { cn } from '@/lib/utils';

/**
 * Ou en est chacun, en direct.
 *
 * La liste existait en deux exemplaires — un dans la colonne de
 * reglages, un sur l'ecran d'attente — et les deux ne disaient pas la
 * meme chose : l'une montrait les autres, l'autre aussi, et aucune ne
 * montrait celui qui regarde. On ne savait donc jamais si on etait soi
 * meme en retard.
 *
 * Elle est ici une seule fois, montre tout le monde, se met a jour a
 * chaque prise envoyee par n'importe qui, et se lit d'un coup d'oeil :
 * une ligne, une barre, un etat.
 */
export function PlayerProgressList({
  sessionId,
  myParticipantId,
  className,
  action,
  waiting,
}: {
  sessionId: string;
  myParticipantId: string | null;
  className?: string;
  /** Ce que l'hote peut faire sur la ligne d'un joueur, s'il peut. */
  action?: (row: PlayerRow) => React.ReactNode;
  /** Qui est sur l'ecran d'attente. Absent : on ne l'affiche pas. */
  waiting?: Set<string>;
}) {
  const t = useT();
  const progress = useSessionProgress(sessionId);

  const rows = (progress.data ?? []).filter((row) => !row.is_kicked);
  if (rows.length === 0) return null;

  return (
    <ul className={cn('space-y-2', className)}>
      {rows.map((row) => {
        const moi = row.participant_id === myParticipantId;
        const fini = row.total > 0 && row.done >= row.total;
        return (
          <li key={row.participant_id} className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0 truncate">
                <span className={cn('truncate', moi && 'font-bold')}>
                  {row.display_name}
                </span>
                {moi ? (
                  <span className="ml-1 text-xs text-text-faint">{t.studio.you}</span>
                ) : null}
                {row.is_host ? (
                  <span className="ml-1 text-xs text-text-faint">
                    {t.studio.hostTag}
                  </span>
                ) : null}
                {waiting ? (
                  <span
                    className={cn(
                      'ml-2 inline-flex items-center gap-1 text-xs',
                      waiting.has(row.participant_id) ? 'font-bold text-ok-ink' : 'text-text-faint',
                    )}
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        waiting.has(row.participant_id) ? 'bg-ok' : 'bg-border-strong',
                      )}
                      aria-hidden
                    />
                    {waiting.has(row.participant_id) ? t.studio.waitPresent : t.studio.waitAway}
                  </span>
                ) : null}
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                <span className="tabular-nums text-xs text-text-faint">
                  {row.done} / {row.total}
                </span>
                <Badge tone={fini ? 'ok' : 'neutral'}>
                  {row.total === 0
                    ? t.studio.stateVo
                    : fini
                      ? t.studio.stateDone
                      : t.studio.stateRecording}
                </Badge>
                {action?.(row)}
              </span>
            </div>
            <Progress
              value={row.total > 0 ? (row.done / row.total) * 100 : 100}
              className="h-2"
            />
          </li>
        );
      })}
    </ul>
  );
}

export interface PlayerRow {
  participant_id: string;
  display_name: string;
  is_host: boolean;
  is_kicked: boolean;
  is_ready: boolean;
  done: number;
  total: number;
}
