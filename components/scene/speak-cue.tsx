'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

import { useT } from '@/lib/i18n';
import { characterColorVar } from '@/config/constants';
import type { CharacterRow, ClipRow } from '@/lib/supabase/database.types';
import { cn } from '@/lib/utils';

type Phase = 'idle' | 'waiting' | 'speaking' | 'done';

/**
 * Qui je double, et quand j'entre.
 *
 * Le nom du personnage restait discret en tete de page, alors que c'est
 * la seule information dont on a besoin en permanence pendant une prise.
 * Il est ici en grand, dans sa couleur, avec le decompte avant l'entree —
 * les deux secondes de marge du PRD §11.4 tiennent lieu de depart, encore
 * faut-il les voir passer.
 */
export function SpeakCue({
  character,
  clip,
  videoRef,
  active,
}: {
  character: CharacterRow;
  clip: ClipRow;
  videoRef: RefObject<HTMLVideoElement | null>;
  active: boolean;
}) {
  const t = useT();

  const [phase, setPhase] = useState<Phase>('idle');
  const [countdownMs, setCountdownMs] = useState(0);
  const lastPhase = useRef<Phase>('idle');

  useEffect(() => {
    if (!active) {
      setPhase('idle');
      lastPhase.current = 'idle';
      return;
    }

    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      const nowMs = (videoRef.current?.currentTime ?? 0) * 1000;

      let next: Phase;
      if (nowMs < clip.speech_start_ms) next = 'waiting';
      else if (nowMs <= clip.speech_end_ms) next = 'speaking';
      else next = 'done';

      if (next !== lastPhase.current) {
        lastPhase.current = next;
        setPhase(next);
      }
      if (next === 'waiting') {
        setCountdownMs(Math.max(0, clip.speech_start_ms - nowMs));
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, clip.speech_start_ms, clip.speech_end_ms, videoRef]);

  const color = characterColorVar(character.color);
  // Meme couleur, assombrie : vive sur la scene noire, lisible ici.
  const inkColor = `color-mix(in oklch, ${color} 72%, black)`;

  return (
    <div
      className="flex items-center gap-3 rounded-card border px-3 py-2 sm:px-4 sm:py-3"
      style={{
        borderColor: phase === 'speaking' ? color : 'var(--color-border)',
        backgroundColor:
          phase === 'speaking'
            ? `color-mix(in oklch, ${color} 18%, transparent)`
            : 'var(--color-surface)',
      }}
    >
      <span
        className="h-8 w-1.5 shrink-0 rounded-full sm:h-10"
        style={{ backgroundColor: color }}
        aria-hidden
      />

      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wide text-text-faint">
          {t.studio.youAreDubbing}
        </p>
        <p
          className="truncate text-lg leading-tight font-bold sm:text-xl"
          style={{ color: inkColor }}
        >
          {character.name}
        </p>
      </div>

      {/*
        Hauteur fixe : le decompte tient sur deux lignes (un libelle et
        les secondes) et les autres phases sur une seule. Sans elle, le
        bloc grandissait a l'entree en zone de parole et l'image
        au-dessus perdait quelques pixels au milieu de la prise.
      */}
      <div
        className="flex h-10 shrink-0 flex-col justify-center text-right sm:h-12"
        aria-live="polite"
      >
        {phase === 'waiting' ? (
          <>
            <p className="text-[11px] uppercase tracking-wide text-text-faint">
              {t.studio.cueIn}
            </p>
            <p className="font-mono text-2xl leading-tight tabular-nums">
              {(countdownMs / 1000).toFixed(1)}&nbsp;s
            </p>
          </>
        ) : (
          <p
            className={cn(
              'text-2xl leading-tight font-bold',
              phase === 'speaking' && 'text-record',
              phase === 'done' && 'text-text-faint',
              phase === 'idle' && 'text-text-faint',
            )}
          >
            {phase === 'speaking'
              ? t.studio.cueNow
              : phase === 'done'
                ? t.studio.cueDone
                : t.studio.cueIdle}
          </p>
        )}
      </div>
    </div>
  );
}
