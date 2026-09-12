'use client';

import { Download } from 'lucide-react';

import { useT } from '@/lib/i18n';
import { PublishCard } from '@/components/scene/publish-card';
import { useSceneCtx } from '@/components/scene-page';
import { Card, Spinner } from '@/components/ui';
import { characterColorVar } from '@/config/constants';
import { formatBytes } from '@/config/strings';
import { useRenderUrl } from '@/lib/data';
import { cn } from '@/lib/utils';

export function ResultScreen() {
  const t = useT();

  const { session, characters, participants } = useSceneCtx();
  const url = useRenderUrl(session);

  const nameOf = (participantId: string | null) =>
    participants.find((p) => p.id === participantId)?.display_name ?? null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-1">
        <h1 className="signage text-3xl" style={{ textShadow: 'none' }}>
          {session.title ?? t.result.title}
        </h1>
        <p className="text-sm text-text-faint">{t.result.shareHint}</p>
      </header>

      <div className="overflow-hidden rounded-card border border-border bg-black">
        {url.data ? (
          // Aucun sous-titre incruste, aucune piste de sous-titres :
          // le MP4 ne contient que l'image et l'audio remixe (PRD §12.5).
          <video src={url.data} controls playsInline className="aspect-video w-full" />
        ) : (
          <div className="flex aspect-video items-center justify-center">
            <Spinner />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <a
          href={url.data ?? undefined}
          download
          aria-disabled={!url.data}
          className={cn(
            'btn-3d inline-flex h-12 items-center gap-2 bg-accent px-6 text-sm font-semibold uppercase',
            'tracking-wide text-accent-ink [--btn-lip:var(--color-accent-ink)] hover:bg-accent-hover',
            !url.data && 'pointer-events-none opacity-40',
          )}
        >
          <Download className="h-4 w-4" aria-hidden />
          {t.result.download}
        </a>
        {session.render_size_bytes ? (
          <span className="text-sm text-text-faint">
            {formatBytes(session.render_size_bytes)}
          </span>
        ) : null}
      </div>

      <Card className="space-y-3">
        <h2 className="text-sm font-medium">{t.result.cast}</h2>
        <ul className="space-y-1.5">
          {characters.map((character) => (
            <li key={character.id} className="flex items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: characterColorVar(character.color) }}
                aria-hidden
              />
              <span className="font-medium">{character.name}</span>
              <span className="text-text-faint">
                {character.is_released
                  ? t.result.voiceOriginal
                  : (nameOf(character.assigned_to) ?? t.result.voiceOriginal)}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <PublishCard />

      {session.purged_at ? (
        <p className="text-xs leading-relaxed text-text-faint">
          {t.result.sourcePurged}
        </p>
      ) : null}
    </div>
  );
}
