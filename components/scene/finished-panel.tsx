'use client';

import { ArrowLeft, Hourglass, PartyPopper } from 'lucide-react';

import { useT } from '@/lib/i18n';
import { PlayerProgressList } from '@/components/scene/player-progress';
import { Button, Card } from '@/components/ui';

import { useSessionProgress } from '@/lib/data';

/**
 * Ecran d'attente du joueur (PRD §11.7).
 *
 * Il n'existait que dans la colonne laterale, donc discret au moment
 * precis ou l'on veut savoir si on a bien fini. Ici il prend toute la
 * place : ce que j'ai enregistre est en securite, voila qui on attend,
 * et je peux revenir refaire une prise tant que le rendu n'est pas
 * lance.
 *
 * Une chose manquait, et c'etait la plus importante pour un invite :
 * savoir que la suite ne depend plus de lui. La derniere ligne le dit,
 * et elle change selon qui regarde — l'hote, lui, apprend qu'il peut
 * lancer.
 */
export function FinishedPanel({
  sessionId,
  myParticipantId,
  isHost,
  onBack,
}: {
  sessionId: string;
  myParticipantId: string;
  isHost: boolean;
  onBack: () => void;
}) {
  const t = useT();

  const progress = useSessionProgress(sessionId);
  const rows = (progress.data ?? []).filter((row) => !row.is_kicked);
  const everyoneDone = rows.length > 0 && rows.every((row) => row.done >= row.total);

  return (
    <Card className="flex min-h-0 flex-col gap-5 overflow-y-auto py-8 text-center">
      <PartyPopper className="mx-auto h-10 w-10 text-ok" aria-hidden />

      <div className="space-y-1">
        <h2 className="signage text-2xl" style={{ textShadow: 'none' }}>
          {t.studio.finishedTitle}
        </h2>
        <p className="mx-auto max-w-md text-sm text-text-muted">
          {t.studio.allTakesSaved}
        </p>
      </div>

      <div className="mx-auto w-full max-w-md space-y-3 text-left">
        <h3 className="text-xs font-bold uppercase tracking-widest text-text-faint">
          {t.studio.whereEveryoneIs}
        </h3>
        <PlayerProgressList sessionId={sessionId} myParticipantId={myParticipantId} />
      </div>

      {/*
        La phrase qui dit a qui est la main. Sans elle, un invite qui a
        fini reste devant un ecran qui ne lui demande rien et se demande
        s'il doit attendre, recharger, ou fermer.
      */}
      <p className="mx-auto flex max-w-md items-center justify-center gap-2 rounded-card bg-surface-sunken px-4 py-3 text-sm">
        <Hourglass className="h-4 w-4 shrink-0 text-text-faint" aria-hidden />
        <span>
          {isHost
            ? everyoneDone
              ? t.studio.hostCanRender
              : t.studio.stillMissing
            : t.studio.waitingHost}
        </span>
      </p>

      <Button variant="secondary" className="mx-auto" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t.studio.backToClips}
      </Button>
    </Card>
  );
}
