'use client';

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { ArrowLeft, Clapperboard, Hourglass, PartyPopper } from 'lucide-react';

import { Avatar } from '@/components/avatar';
import { useSceneCtx } from '@/components/scene-page';
import { Alert, Badge, Button, Card, Progress } from '@/components/ui';
import { characterColorVar } from '@/config/constants';
import { enqueueRender } from '@/lib/actions';
import { useSessionProgress } from '@/lib/data';
import { humanizeError } from '@/lib/errors';
import { useT } from '@/lib/i18n';
import { useProfilesOf } from '@/lib/profile';
import type { CharacterRow } from '@/lib/supabase/database.types';
import { cn } from '@/lib/utils';

/**
 * Ecran d'attente (PRD §11.7).
 *
 * On y arrive par « J'ai terminé », une fois toutes ses prises posees : pas
 * tout seul, pour pouvoir encore refaire la derniere. Il dit quatre
 * choses : ce que j'ai enregistre est en securite, qui double qui, ou en
 * est chacun — y compris qui est deja la, sur cet ecran, a attendre — et a
 * qui est la main.
 *
 * La distribution y est une carte par joueur, avec ses personnages a leur
 * couleur : c'est ce qu'on se demande en attendant le rendu (« c'est toi
 * qui fais Slughorn ? »), et la liste d'avant ne montrait que des noms et
 * des barres.
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
  const { characters, participants, refetch } = useSceneCtx();
  const [error, setError] = useState<string | null>(null);

  const progress = useSessionProgress(sessionId);
  const rows = (progress.data ?? []).filter((row) => !row.is_kicked);
  const everyoneDone = rows.length > 0 && rows.every((row) => row.done >= row.total);
  const absents = rows.filter((row) => !waiting.has(row.participant_id));
  const toutLeMondeLa = absents.length === 0;

  const joueurs = participants.filter((p) => !p.is_kicked);
  const profiles = useProfilesOf(joueurs.map((p) => p.user_id));
  const userIdDe = new Map(joueurs.map((p) => [p.id, p.user_id]));
  const parOrdre = (a: CharacterRow, b: CharacterRow) => a.sort_order - b.sort_order;
  const rolesDe = (participantId: string) =>
    characters.filter((c) => c.assigned_to === participantId && !c.is_released).sort(parOrdre);
  const enVo = characters.filter((c) => c.is_released).sort(parOrdre);

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
    <Card className="flex min-h-0 flex-col gap-6 overflow-y-auto p-5 sm:p-8">
      <header className="flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ok/15 text-ok">
          <PartyPopper className="h-7 w-7" aria-hidden />
        </span>
        <div className="min-w-0 space-y-1">
          <h2 className="titre text-2xl sm:text-3xl">{t.studio.finishedTitle}</h2>
          <p className="text-sm leading-relaxed text-text-muted">{t.studio.waitingSubtitle}</p>
        </div>
      </header>

      {/* ── Qui double qui, et ou en est chacun ─────────────────────── */}
      <section className="space-y-3" aria-labelledby="titre-distribution">
        <h3
          id="titre-distribution"
          className="text-xs font-bold uppercase tracking-widest text-text-faint"
        >
          {t.studio.castTitle}
        </h3>

        <ul className="grid gap-3 sm:grid-cols-2">
          {rows.map((row) => {
            const moi = row.participant_id === myParticipantId;
            const fini = row.total > 0 && row.done >= row.total;
            const present = waiting.has(row.participant_id);
            const roles = rolesDe(row.participant_id);
            const avatar = profiles.data?.get(userIdDe.get(row.participant_id) ?? '')?.avatar_path;

            return (
              <li
                key={row.participant_id}
                className={cn('panel flex flex-col gap-3 p-4', moi && 'ring-2 ring-accent/50')}
              >
                <div className="flex items-center gap-3">
                  <Avatar name={row.display_name} path={avatar} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">
                      {row.display_name}
                      {moi ? (
                        <span className="ml-1 text-xs font-normal text-text-faint">{t.studio.you}</span>
                      ) : null}
                      {row.is_host ? (
                        <span className="ml-1 text-xs font-normal text-text-faint">
                          {t.studio.hostTag}
                        </span>
                      ) : null}
                    </p>
                    <p
                      className={cn(
                        'flex items-center gap-1.5 text-xs',
                        present ? 'font-bold text-ok-ink' : 'text-text-faint',
                      )}
                    >
                      <span
                        className={cn('h-1.5 w-1.5 rounded-full', present ? 'bg-ok' : 'bg-border-strong')}
                        aria-hidden
                      />
                      {present ? t.studio.waitPresent : t.studio.waitAway}
                    </p>
                  </div>
                  <Badge tone={fini ? 'ok' : 'neutral'}>
                    {row.total === 0
                      ? t.studio.stateVo
                      : fini
                        ? t.studio.stateDone
                        : t.studio.stateRecording}
                  </Badge>
                </div>

                {roles.length > 0 ? (
                  <ul className="flex flex-wrap gap-1.5">
                    {roles.map((character) => (
                      <li key={character.id}>
                        <PastillePersonnage character={character} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-text-faint">{t.studio.noRole}</p>
                )}

                {row.total > 0 ? (
                  <div className="mt-auto flex items-center gap-2">
                    <Progress value={(row.done / row.total) * 100} className="h-1.5 flex-1" />
                    <span className="shrink-0 text-xs tabular-nums text-text-faint">
                      {row.done} / {row.total}
                    </span>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>

        {/* Les personnages que personne ne double gardent leur VO : on le
            dit, sinon on les cherche dans les cartes. */}
        {enVo.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 text-xs text-text-faint">
            <span>{t.studio.keptVo}</span>
            {enVo.map((character) => (
              <PastillePersonnage key={character.id} character={character} discret />
            ))}
          </div>
        ) : null}
      </section>

      {/*
        La phrase qui dit a qui est la main. Sans elle, un invite qui a
        fini reste devant un ecran qui ne lui demande rien et se demande
        s'il doit attendre, recharger, ou fermer.
      */}
      <div className="space-y-3">
        <p className="flex items-center gap-2 rounded-card bg-surface-sunken px-4 py-3 text-sm">
          <Hourglass className="h-4 w-4 shrink-0 text-text-faint" aria-hidden />
          <span>{message}</span>
        </p>

        {isHost ? (
          <div className="space-y-2">
            <Button
              className="w-full"
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
      </div>

      <Button variant="ghost" className="self-center" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t.studio.backToClips}
      </Button>
    </Card>
  );
}

/** Un personnage, a sa couleur. */
function PastillePersonnage({ character, discret }: { character: CharacterRow; discret?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-surface-raised px-2.5 py-1 text-xs font-bold text-text',
        discret && 'font-semibold text-text-muted',
      )}
    >
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: characterColorVar(character.color) }}
        aria-hidden
      />
      {character.name}
    </span>
  );
}
