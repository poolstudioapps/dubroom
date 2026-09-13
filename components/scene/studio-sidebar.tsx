'use client';

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Clapperboard, UserMinus } from 'lucide-react';

import { useT } from '@/lib/i18n';
import { PlayerProgressList } from '@/components/scene/player-progress';
import { useSceneCtx } from '@/components/scene-page';
import { SelectMenu } from '@/components/select-menu';
import { Alert, Button, Card, Dialog, Progress } from '@/components/ui';

import { enqueueRender, kickParticipant, reassignCharacter } from '@/lib/actions';
import { useSessionProgress } from '@/lib/data';
import { humanizeError } from '@/lib/errors';
import type { ParticipantRow } from '@/lib/supabase/database.types';

/**
 * La colonne de droite du studio.
 *
 * Elle portait trois reglages de son a part — calage automatique,
 * decalage micro, calibrage — qui valaient pour toutes les prises a la
 * fois. Le calage est desormais toujours actif, et le decalage se regle
 * prise par prise dans la console de voix, avec tout le reste du son. Il
 * reste ici l'avancement du groupe et le lancement du montage.
 */
export function StudioSidebar({
  backing,
  onBacking,
  done,
  total,
  voiceConsole,
  devices,
}: {
  backing: number;
  onBacking: (value: number) => void;
  done: number;
  total: number;
  /** La console de la prise affichee, sur ordinateur. */
  voiceConsole?: React.ReactNode;
  /** Le choix du micro et de la sortie, en tete : il se fait avant la prise. */
  devices?: React.ReactNode;
}) {
  const t = useT();

  const { session, characters, participants, me, isHost, refetch } = useSceneCtx();
  const progress = useSessionProgress(session.id);

  const [error, setError] = useState<string | null>(null);
  const [pendingKick, setPendingKick] = useState<ParticipantRow | null>(null);

  const act = useMutation({
    mutationFn: (fn: () => Promise<unknown>) => fn(),
    onSuccess: () => {
      setPendingKick(null);
      refetch();
      void progress.refetch();
    },
    onError: (e) => setError(humanizeError(e)),
  });

  const rows = (progress.data ?? []).filter((row) => !row.is_kicked);
  const others = rows.filter((row) => row.participant_id !== me?.id);
  const waiting = others.filter((row) => row.done < row.total);
  // « Tout le monde a fini » ne regardait que les autres : le message
  // s'affichait a un joueur qui n'avait pas enregistre une seule prise.
  const everyoneDone = rows.length > 0 && rows.every((row) => row.done >= row.total);
  const missing = rows.reduce((sum, row) => sum + (row.total - row.done), 0);
  const iAmDone = total > 0 && done === total;

  return (
    <aside className="space-y-4">
      {devices}

      {/*
        Le fond sonore vit dans la console, sous le decalage. Sans console
        — pas de role, ou toutes les prises faites — il garde sa carte.
      */}
      {voiceConsole ? null : (
        <Card className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span>{t.studio.backingVolume}</span>
            <span className="text-text-faint">{Math.round(backing * 100)} %</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={backing}
            onChange={(e) => onBacking(Number(e.target.value))}
            className="w-full"
            aria-label={t.studio.backingVolume}
          />
        </Card>
      )}

      {/*
        La console de la prise, sur ordinateur. Sur telephone elle vit sous
        les commandes, la ou l'on vient d'ecouter ce qu'on a enregistre,
        d'ou le `hidden` ici.
      */}
      {voiceConsole ? <div className="hidden lg:block">{voiceConsole}</div> : null}

      <Card className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>{t.studio.myClips}</span>
          <span className="text-text-faint">
            {done} / {total}
          </span>
        </div>
        <Progress value={total > 0 ? (done / total) * 100 : 0} />

        {iAmDone ? (
          <div className="space-y-1 pt-1">
            <p className="text-sm font-bold">{t.studio.finishedTitle}</p>
            <p className="text-xs text-text-faint">{t.studio.finishedBody}</p>
          </div>
        ) : null}
      </Card>

      {/*
        Tout le groupe, soi compris, et en direct. La liste ne montrait
        que les autres : on ne savait donc pas si on etait soi-meme celui
        qu'on attend.
      */}
      <Card className="space-y-2">
        <h2 className="text-sm font-bold">
          {others.length === 0
            ? t.studio.soloScene
            : waiting.length > 0
              ? t.studio.waitingFor
              : everyoneDone
                ? t.studio.everyoneDone
                : t.studio.othersDone}
        </h2>

        <PlayerProgressList
          sessionId={session.id}
          myParticipantId={me?.id ?? null}
          action={(row) =>
            isHost && row.participant_id !== me?.id && row.done < row.total ? (
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                aria-label={t.studio.kick}
                title={t.studio.kick}
                onClick={() =>
                  setPendingKick(
                    participants.find((p) => p.id === row.participant_id) ?? null,
                  )
                }
              >
                <UserMinus className="h-3.5 w-3.5" />
              </Button>
            ) : null
          }
        />

        {others.length === 0 ? (
          <p className="text-xs text-text-faint">{t.studio.soloHint}</p>
        ) : null}
      </Card>

      {isHost ? (
        <Card className="space-y-3">
          <Button
            variant="primary"
            className="w-full"
            disabled={missing > 0}
            loading={act.isPending}
            onClick={() => {
              setError(null);
              act.mutate(() => enqueueRender(session.id));
            }}
          >
            <Clapperboard className="h-4 w-4" aria-hidden />
            {t.studio.launchRender}
          </Button>
          {missing > 0 ? <Alert tone="warn">{t.studio.renderBlocked}</Alert> : null}
          <p className="text-xs text-text-faint">{t.create.shareLater}</p>
        </Card>
      ) : null}

      {error ? <Alert tone="danger">{error}</Alert> : null}

      <Dialog
        open={!!pendingKick}
        onClose={() => setPendingKick(null)}
        title={t.studio.kick}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingKick(null)}>
              {t.common.cancel}
            </Button>
            <Button
              variant="danger"
              loading={act.isPending}
              onClick={() =>
                pendingKick && act.mutate(() => kickParticipant(pendingKick.id))
              }
            >
              {t.studio.kick}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p>{pendingKick ? t.studio.kickConfirm(pendingKick.display_name) : ''}</p>

          <div className="space-y-1.5">
            <p className="text-xs text-text-faint">{t.studio.reassignInstead}</p>
            {characters
              .filter((c) => c.assigned_to === pendingKick?.id)
              .map((character) => (
                <div key={character.id} className="flex items-center gap-2">
                  <span className="flex-1 truncate text-sm">{character.name}</span>
                  <SelectMenu
                    variant="compact"
                    label={t.studio.reassign(character.name)}
                    value=""
                    placeholder={t.studio.pickPlayer}
                    options={participants
                      .filter((p) => !p.is_kicked && p.id !== pendingKick?.id)
                      .map((p) => ({ value: p.id, label: p.display_name }))}
                    onChange={(target) => {
                      if (target) act.mutate(() => reassignCharacter(character.id, target));
                    }}
                  />
                </div>
              ))}
          </div>
        </div>
      </Dialog>
    </aside>
  );
}
