'use client';

import { useMutation } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Check, Copy, Play } from 'lucide-react';

import { useSceneCtx } from '@/components/scene-page';
import { Alert, Badge, Button, Card, Spinner } from '@/components/ui';
import { characterColorVar } from '@/config/constants';
import { formatDuration, t } from '@/config/strings';
import {
  assignCharacter,
  setCharacterReleased,
  setReady,
  startRecording,
  unassignCharacter,
} from '@/lib/actions';
import { useMediaUrls } from '@/lib/data';
import { humanizeError } from '@/lib/errors';
import { statsByCharacter } from '@/lib/scene-stats';

export function LobbyScreen() {
  const { session, characters, lines, clips, participants, me, isHost, refetch } =
    useSceneCtx();
  const media = useMediaUrls(session);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<'link' | 'code' | null>(null);

  const stats = useMemo(
    () => statsByCharacter(characters, lines, clips),
    [characters, lines, clips],
  );

  const act = useMutation({
    mutationFn: (fn: () => Promise<unknown>) => fn(),
    onSuccess: () => refetch(),
    onError: (e) => setError(humanizeError(e)),
  });

  const run = (fn: () => Promise<unknown>) => {
    setError(null);
    act.mutate(fn);
  };

  async function copy(kind: 'link' | 'code') {
    const value =
      kind === 'code'
        ? session.code
        : `${window.location.origin}/s/${session.code}`;
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1500);
  }

  const activePlayers = participants.filter((p) => !p.is_kicked);
  const unassigned = characters.filter((c) => !c.assigned_to && !c.is_released);
  const notReady = activePlayers.filter((p) => !p.is_ready);
  const canStart = unassigned.length === 0 && notReady.length === 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-4">
        <header className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">
            {session.title ?? t.lobby.title}
          </h1>
          <p className="text-sm text-text-faint">{t.lobby.watchOriginal}</p>
        </header>

        <div className="overflow-hidden rounded-card border border-border bg-black">
          {media.data?.video ? (
            <video
              src={media.data.video}
              controls
              playsInline
              preload="none"
              className="aspect-video w-full"
            />
          ) : (
            <div className="flex aspect-video items-center justify-center">
              <Spinner />
            </div>
          )}
        </div>

        <section className="space-y-2">
          <h2 className="text-sm font-medium">{t.lobby.characters}</h2>
          {characters.map((character) => {
            const stat = stats.get(character.id);
            const owner = participants.find((p) => p.id === character.assigned_to);
            const isMine = character.assigned_to === me?.id;

            return (
              <Card
                key={character.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: characterColorVar(character.color) }}
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{character.name}</p>
                    <p className="text-xs text-text-faint">
                      {t.lobby.clipCount(stat?.clipCount ?? 0)} ·{' '}
                      {formatDuration(stat?.speakMs ?? 0)} de parole
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {character.is_released ? (
                    <Badge tone="neutral">{t.lobby.releasedBadge}</Badge>
                  ) : owner ? (
                    <Badge tone={isMine ? 'accent' : 'neutral'}>
                      {t.lobby.takenBy(owner.display_name)}
                    </Badge>
                  ) : (
                    <Badge tone="warn">{t.lobby.free}</Badge>
                  )}

                  {isMine ? (
                    <Button
                      size="sm"
                      onClick={() => run(() => unassignCharacter(character.id))}
                    >
                      {t.lobby.dropCharacter}
                    </Button>
                  ) : !character.assigned_to && !character.is_released ? (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => run(() => assignCharacter(character.id))}
                    >
                      {t.lobby.takeCharacter}
                    </Button>
                  ) : null}

                  {isHost && !character.assigned_to ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        run(() =>
                          setCharacterReleased(character.id, !character.is_released),
                        )
                      }
                    >
                      {character.is_released
                        ? t.lobby.unrelease
                        : t.lobby.releaseCharacter}
                    </Button>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </section>
      </div>

      <aside className="order-first space-y-4 lg:order-none">
        <Card className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs text-text-faint">{t.lobby.shareCode}</p>
            <div className="flex items-center gap-2">
              <code className="taped relative flex-1 rounded-sm border-2 border-border-strong bg-screen py-3 text-center font-display text-3xl tracking-[0.2em] shadow-[inset_0_2px_4px_rgb(0_0_0/0.15)]">
                {session.code}
              </code>
              <Button
                size="icon"
                variant="ghost"
                aria-label={t.common.copy}
                onClick={() => void copy('code')}
              >
                {copied === 'code' ? (
                  <Check className="h-4 w-4 text-ok" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => void copy('link')}
          >
            {copied === 'link' ? (
              <Check className="h-4 w-4 text-ok" aria-hidden />
            ) : (
              <Copy className="h-4 w-4" aria-hidden />
            )}
            {t.lobby.shareLink}
          </Button>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-sm font-medium">{t.lobby.players}</h2>
          <ul className="space-y-1.5">
            {activePlayers.map((player) => (
              <li
                key={player.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="truncate">
                  {player.display_name}
                  {player.is_host ? (
                    <span className="ml-1 text-xs text-text-faint">(hôte)</span>
                  ) : null}
                </span>
                <Badge tone={player.is_ready ? 'ok' : 'neutral'}>
                  {player.is_ready ? t.lobby.readyBadge : t.lobby.waitingBadge}
                </Badge>
              </li>
            ))}
          </ul>

          <Button
            variant={me?.is_ready ? 'secondary' : 'primary'}
            className="w-full"
            onClick={() => run(() => setReady(session.id, !me?.is_ready))}
          >
            {me?.is_ready ? t.lobby.notReady : t.lobby.ready}
          </Button>
        </Card>

        {isHost ? (
          <Card className="space-y-3">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              disabled={!canStart}
              loading={act.isPending}
              onClick={() => run(() => startRecording(session.id))}
            >
              <Play className="h-4 w-4" aria-hidden />
              {t.lobby.start}
            </Button>

            {unassigned.length > 0 ? (
              <Alert tone="warn">{t.lobby.startBlockedCharacters}</Alert>
            ) : null}
            {notReady.length > 0 ? (
              <Alert tone="warn">{t.lobby.startBlockedReady}</Alert>
            ) : null}
          </Card>
        ) : (
          <p className="text-xs text-text-faint">{t.lobby.hostOnly}</p>
        )}

        {error ? <Alert tone="danger">{error}</Alert> : null}
      </aside>
    </div>
  );
}
