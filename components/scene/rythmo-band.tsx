'use client';

import { useEffect, useRef, type RefObject } from 'react';

import {
  RYTHMO_PLAYHEAD_RATIO,
  RYTHMO_WINDOW_MS,
  characterColorVar,
} from '@/config/constants';
import type { CharacterRow, LineRow } from '@/lib/supabase/database.types';

/**
 * Bande rythmo (PRD §11.3).
 *
 * Le texte defile de droite a gauche sous une tete de lecture fixe ; un
 * mot passe exactement sous elle a son `start_ms`.
 *
 * Le point critique est la source de temps : on lit `video.currentTime` a
 * chaque frame. Un compteur independant deriverait de la video au bout de
 * quelques dizaines de secondes, et le joueur enregistrerait a cote.
 */
export function RythmoBand({
  videoRef,
  lines,
  characters,
  activeCharacterId,
  height = 96,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  lines: LineRow[];
  characters: CharacterRow[];
  activeCharacterId: string | null;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colorOf = new Map(
      characters.map((c) => [c.id, characterColorVar(c.color)]),
    );

    let frame = 0;

    const draw = () => {
      frame = requestAnimationFrame(draw);

      const video = videoRef.current;
      const dpr = window.devicePixelRatio || 1;
      const cssWidth = canvas.clientWidth;
      const cssHeight = height;

      if (canvas.width !== Math.round(cssWidth * dpr)) {
        canvas.width = Math.round(cssWidth * dpr);
        canvas.height = Math.round(cssHeight * dpr);
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssWidth, cssHeight);

      const nowMs = (video?.currentTime ?? 0) * 1000;
      const pxPerMs = cssWidth / RYTHMO_WINDOW_MS;
      const playheadX = cssWidth * RYTHMO_PLAYHEAD_RATIO;
      const toX = (ms: number) => playheadX + (ms - nowMs) * pxPerMs;

      const startMs = nowMs - playheadX / pxPerMs;
      const endMs = nowMs + (cssWidth - playheadX) / pxPerMs;

      const activeRowY = cssHeight * 0.4;
      const otherRowY = cssHeight * 0.78;

      for (const line of lines) {
        if (line.is_deleted) continue;
        if (line.end_ms < startMs || line.start_ms > endMs) continue;

        const isActive = line.character_id === activeCharacterId;
        const y = isActive ? activeRowY : otherRowY;
        const color = colorOf.get(line.character_id) ?? 'currentColor';

        ctx.font = isActive
          ? '600 22px ui-sans-serif, system-ui, sans-serif'
          : '400 14px ui-sans-serif, system-ui, sans-serif';

        const words =
          line.words.length > 0
            ? line.words
            : // Repli si la granularite au mot manque : on etale le texte
              // sur la duree de la replique.
              [{ w: line.text, start_ms: line.start_ms, end_ms: line.end_ms }];

        for (const word of words) {
          const x = toX(word.start_ms);
          const slot = Math.max(2, (word.end_ms - word.start_ms) * pxPerMs);
          if (x > cssWidth || x + slot < 0) continue;

          const isPast = word.end_ms < nowMs;
          const isCurrent = word.start_ms <= nowMs && word.end_ms >= nowMs;

          ctx.save();
          ctx.fillStyle = color;
          ctx.globalAlpha = isActive
            ? isCurrent
              ? 1
              : isPast
                ? 0.35
                : 0.85
            : isPast
              ? 0.15
              : 0.3;

          // Le mot est comprime pour tenir dans sa duree : c'est ce qui
          // fait qu'on peut lire au rythme du texte sans le devancer.
          const natural = ctx.measureText(word.w).width;
          const scale = natural > slot ? slot / natural : 1;
          ctx.translate(x, y);
          ctx.scale(scale, 1);
          ctx.fillText(word.w, 0, 0);
          ctx.restore();
        }
      }

      // Tete de lecture.
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 6);
      ctx.lineTo(playheadX, cssHeight - 6);
      ctx.stroke();
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [videoRef, lines, characters, activeCharacterId, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ height }}
      className="w-full rounded-lg border border-border bg-surface-sunken"
      aria-hidden
    />
  );
}
