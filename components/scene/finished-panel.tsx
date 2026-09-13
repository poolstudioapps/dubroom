'use client';

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { ArrowLeft, Clapperboard, Hourglass, PartyPopper } from 'lucide-react';

import { useT } from '@/lib/i18n';
import { PlayerProgressList } from '@/components/scene/player-progress';
import { useSceneCtx } from '@/components/scene-page';
import { Alert, Button, Card } from '@/components/ui';

import { enqueueRender } from '@/lib/actions';
import { useSessionProgress } from '@/lib/data';
import { humanizeError } from '@/lib/errors';

/**
 * Ecran d'attente (PRD §11.7).
 *
 * On y arrive tout seul des que sa derniere prise est enregistree. Il dit
 * trois choses : ce que j'ai enregistre est en securite, ou en est chacun
 * — y compris qui est deja la, sur cet ecran, a attendre — et a qui est
 * la main.
 *
 * L'hote y lance le rendu. Le bouton ne s'allume en grand que lorsque
 * tout le monde a fini ET attend ici : un joueur qui a fini mais reecoute
 * encore sa derniere prise ne doit pas la voir partir au mixage. Si
 * quelqu'un a fini puis ferme l'onglet, l'hote n'est pas bloque pour
 * autant : il peut lancer sans l'attendre.
 */
export function FinishedPanel({
  sessionId,
  myParticipantId,
  isHost,
  waiting,
  onBack,
}: {
  sessionId: string;
  myParticipantId: string;
  isHost: boolean;
  /** Les joueurs presents sur l'ecran d'attente, par participant. */
  waiting: Set<string>;
  onBack: () => void;
}) {
  const t = useT();
  const { refetch } = useSceneCtx();
  const [error, setError] = useState<string | null>(null);

  const progress = useSessionProgress(sessionId);
  const rows = (progress.data ?? []).filter((row) => !row.is_kicked);
  const everyoneDone = rows.length > 0 && rows.every((row) => row.done >= row.total);
  const absents = rows.filter((row) => !waiting.has(row.participant_id));
  const toutLeMondeLa = absents.length === 0;

  const lancer = useMutation({
    mutationFn: () => enqueueRender(sessionId),
    onSuccess: () => refetch(),
    onError: (e) => setError(humanizeError(e)),
  });

  const message = !isHost
    ? t.studio.waitingHost
    : !everyoneDone
      ? t.studio.stillMissing
      : toutLeMondeLa
        ? t.studio.hostCanRender
        : t.studio.waitSomeAway(absents.map((row) => row.display_name).join(', '));

  return (
    <Card className="flex min-h-0 flex-col gap-5 overflow-y-auto py-8 text-center">
      <PartyPopper className="mx-auto h-10 w-10 text-ok" aria-hidden />

      <div className="space-y-1">
        <h2 className="titre text-2xl">{t.studio.finishedTitle}</h2>
        <p className="mx-auto max-w-md text-sm text-text-muted">{t.studio.allTakesSaved}</p>
      </div>

      <div className="mx-auto w-full max-w-md space-y-3 text-left">
        <h3 className="text-xs font-bold uppercase tracking-widest text-text-faint">
          {t.studio.whereEveryoneIs}
        </h3>
        <PlayerProgressList
          sessionId={sessionId}
          myParticipantId={myParticipantId}
          waiting={waiting}
        />
      </div>

      {/*
        La phrase qui dit a qui est la main. Sans elle, un invite qui a
        fini reste devant un ecran qui ne lui demande rien et se demande
        s'il doit attendre, recharger, ou fermer.
      */}
      <p className="mx-auto flex max-w-md items-center justify-center gap-2 rounded-card bg-surface-sunken px-4 py-3 text-sm">
        <Hourglass className="h-4 w-4 shrink-0 text-text-faint" aria-hidden />
        <span>{message}</span>
      </p>

      {isHost ? (
        <div className="mx-auto flex w-full max-w-md flex-col gap-2">
          <Button
            variant={everyoneDone && toutLeMondeLa ? 'primary' : 'secondary'}
            size="lg"
            disabled={!everyoneDone}
            loading={lancer.isPending}
            onClick={() => {
              setError(null);
              lancer.mutate();
            }}
          >
            <Clapperboard className="h-4 w-4" aria-hidden />
            {everyoneDone && !toutLeMondeLa ? t.studio.launchAnyway : t.studio.launchRender}
          </Button>
          {error ? <Alert tone="danger">{error}</Alert> : null}
        </div>
      ) : null}

      <Button variant="ghost" className="mx-auto" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t.studio.backToClips}
      </Button>
    </Card>
  );
}
