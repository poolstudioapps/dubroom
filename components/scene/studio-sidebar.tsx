'use client';

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Clapperboard, UserMinus, Wand2 } from 'lucide-react';

import { useT } from '@/lib/i18n';
import { PlayerProgressList } from '@/components/scene/player-progress';
import { VoiceConsole } from '@/components/scene/voice-console';
import { useSceneCtx } from '@/components/scene-page';
import { SelectMenu } from '@/components/select-menu';
import { Alert, Button, Card, Dialog, Progress, Toggle } from '@/components/ui';
import {
  MIC_OFFSET_MAX_MS,
  MIC_OFFSET_MIN_MS,
  MIC_OFFSET_STEP_MS,
  MIC_OFFSET_STORAGE_KEY,
} from '@/config/constants';

import {
  enqueueRender,
  kickParticipant,
  reassignCharacter,
  setMicOffset,
} from '@/lib/actions';
import { calibrateMicOffset } from '@/lib/audio/calibration';
import { setKeepAsPack } from '@/lib/packs';
import { useSessionProgress } from '@/lib/data';
import { humanizeError } from '@/lib/errors';
import type { ParticipantRow, TakeRow } from '@/lib/supabase/database.types';

export function StudioSidebar({
  backing,
  onBacking,
  micOffset,
  onMicOffset,
  autoAlign,
  onAutoAlign,
  done,
  total,
  take,
}: {
  backing: number;
  onBacking: (value: number) => void;
  micOffset: number;
  onMicOffset: (value: number) => void;
  autoAlign: boolean;
  onAutoAlign: (value: boolean) => void;
  done: number;
  total: number;
  /** La prise du clip affiche : c'est elle que la console regle. */
  take?: TakeRow | null;
}) {
  const t = useT();

  const { session, characters, participants, me, isHost, refetch } = useSceneCtx();
  const progress = useSessionProgress(session.id);

  const [error, setError] = useState<string | null>(null);
  const [calibrationMsg, setCalibrationMsg] = useState<string | null>(null);
  const [pendingKick, setPendingKick] = useState<ParticipantRow | null>(null);

  const persistOffset = useMutation({
    mutationFn: (value: number) => setMicOffset(session.id, value),
    onError: (e) => setError(humanizeError(e)),
  });

  const calibrate = useMutation({
    mutationFn: calibrateMicOffset,
    onSuccess: (value) => {
      applyOffset(value);
      setCalibrationMsg(t.studio.calibrationDone(value));
    },
    onError: () => setCalibrationMsg(t.studio.calibrationFailed),
  });

  const act = useMutation({
    mutationFn: (fn: () => Promise<unknown>) => fn(),
    onSuccess: () => {
      setPendingKick(null);
      refetch();
      void progress.refetch();
    },
    onError: (e) => setError(humanizeError(e)),
  });

  function applyOffset(value: number) {
    onMicOffset(value);
    window.localStorage.setItem(MIC_OFFSET_STORAGE_KEY, String(value));
    persistOffset.mutate(value);
  }

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
      <Card variant="plate" className="space-y-4">
        <div className="space-y-1.5">
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
        </div>

        {/*
          Le calage automatique passe avant le reglage manuel : il traite
          le meme probleme, mieux et sans rien demander. Le curseur reste
          pour qui veut reprendre la main.
        */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-bold">{t.studio.autoAlign}</span>
            <Toggle
              checked={autoAlign}
              onChange={onAutoAlign}
              label={t.studio.autoAlign}
            />
          </div>
          <p className="text-xs leading-relaxed text-text-faint">
            {t.studio.autoAlignHelp}
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span>{t.studio.micOffset}</span>
            <span className="text-text-faint">{micOffset} ms</span>
          </div>
          <input
            type="range"
            min={MIC_OFFSET_MIN_MS}
            max={MIC_OFFSET_MAX_MS}
            step={MIC_OFFSET_STEP_MS}
            value={micOffset}
            onChange={(e) => onMicOffset(Number(e.target.value))}
            onPointerUp={(e) => applyOffset(Number(e.currentTarget.value))}
            onKeyUp={(e) => applyOffset(Number(e.currentTarget.value))}
            className="w-full"
            aria-label={t.studio.micOffset}
          />
          <p className="text-xs text-text-faint">{t.studio.micOffsetHelp}</p>

          <Button
            size="sm"
            variant="ghost"
            className="w-full"
            loading={calibrate.isPending}
            onClick={() => {
              setCalibrationMsg(null);
              calibrate.mutate();
            }}
          >
            <Wand2 className="h-3.5 w-3.5" aria-hidden />
            {calibrate.isPending ? t.studio.calibrating : t.studio.calibrate}
          </Button>
          {calibrationMsg ? (
            <p className="text-xs text-text-muted">{calibrationMsg}</p>
          ) : null}
        </div>
      </Card>

      {/*
        La console de la prise, sur ordinateur : juste apres les reglages
        techniques. Sur telephone elle vit sous les commandes, la ou l'on
        vient d'ecouter ce qu'on a enregistre, d'ou le `hidden` ici.
      */}
      <div className="hidden lg:block">
        <VoiceConsole take={take ?? null} />
      </div>

      <Card variant="plate" className="space-y-2">
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
      <Card variant="plate" className="space-y-2">
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
        <Card variant="plate" className="space-y-3">
          {/* Sans lien d'origine, il n'y a rien a partager : on le dit
            plutot que d'afficher une case qui refuserait de se cocher. */}
          {session.source_ref ? (
            <div className="flex items-start gap-3">
              <Toggle
                checked={session.keep_as_pack}
                onChange={(next) => act.mutate(() => setKeepAsPack(session.id, next))}
                label={t.community.keepLabel}
                disabled={!!session.from_pack_id}
              />
              <div className="space-y-0.5">
                <p className="text-sm font-bold">{t.community.keepLabel}</p>
                <p className="text-xs text-text-faint">{t.create.keepHelpUrl}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-text-faint">{t.create.keepHelpUpload}</p>
          )}

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
