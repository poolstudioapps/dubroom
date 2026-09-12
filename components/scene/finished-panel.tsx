'use client';

import { ArrowLeft, PartyPopper } from 'lucide-react';

import { Badge, Button, Card, Progress, Spinner } from '@/components/ui';
import { t } from '@/config/strings';
import { useSessionProgress } from '@/lib/data';

/**
 * Ecran d'attente du joueur (PRD §11.7).
 *
 * Il n'existait que dans la colonne laterale, donc discret au moment
 * precis ou l'on veut savoir si on a bien fini. Ici il prend toute la
 * place : ce que j'ai enregistre est en securite, voila qui on attend,
 * et je peux revenir refaire une prise tant que le rendu n'est pas lance.
 */
export function FinishedPanel({
  sessionId,
  myParticipantId,
  onBack,
}: {
  sessionId: string;
  myParticipantId: string;
  onBack: () => void;
}) {
  const progress = useSessionProgress(sessionId);

  const rows = (progress.data ?? []).filter((row) => !row.is_kicked);
  const others = rows.filter((row) => row.participant_id !== myParticipantId);
  const waiting = others.filter((row) => row.done < row.total);
  const everyoneDone = rows.length > 0 && rows.every((row) => row.done >= row.total);

  return (
    <Card className="space-y-5 py-8 text-center">
      <PartyPopper className="mx-auto h-10 w-10 text-ok" aria-hidden />

      <div className="space-y-1">
        <h2 className="signage text-2xl" style={{ textShadow: 'none' }}>
          {t.studio.finishedTitle}
        </h2>
        <p className="mx-auto max-w-md text-sm text-text-muted">
          {t.studio.allTakesSaved}
        </p>
      </div>

      <div className="mx-auto max-w-md space-y-2 text-left">
        <h3 className="text-sm font-bold">
          {others.length === 0
            ? t.studio.soloScene
            : waiting.length > 0
              ? t.studio.waitingFor
              : everyoneDone
                ? t.studio.everyoneDone
                : t.studio.othersDone}
        </h3>

        {progress.isLoading ? <Spinner /> : null}

        {others.map((row) => (
          <div key={row.participant_id} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="truncate">
                {t.studio.playerProgress(row.display_name, row.done, row.total)}
              </span>
              <Badge tone={row.done >= row.total ? 'ok' : 'neutral'}>
                {row.done >= row.total ? 'Fini' : 'En cours'}
              </Badge>
            </div>
            <Progress
              value={row.total > 0 ? (row.done / row.total) * 100 : 0}
              className="h-2"
            />
          </div>
        ))}

        {others.length === 0 ? (
          <p className="text-xs text-text-faint">{t.studio.soloHint}</p>
        ) : null}
      </div>

      <Button variant="secondary" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t.studio.backToClips}
      </Button>
    </Card>
  );
}
