'use client';

import { useEffect, useRef, type RefObject } from 'react';

import { RYTHMO_PLAYHEAD_RATIO, RYTHMO_WINDOW_MS } from '@/config/constants';
import { resolveCharacterColor, resolveCssColor } from '@/lib/canvas-colors';
import type { CharacterRow, ClipRow, LineRow } from '@/lib/supabase/database.types';

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
  clip,
  height = 132,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  lines: LineRow[];
  characters: CharacterRow[];
  activeCharacterId: string | null;
  clip?: ClipRow | null;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Les couleurs sont resolues une fois : le canvas n'accepte pas les
    // variables CSS, il les ignore silencieusement et dessine en noir.
    const colorOf = new Map(
      characters.map((c) => [c.id, resolveCharacterColor(c.color)]),
    );
    const guideColor = resolveCssColor('var(--color-text-faint)', '#8a8a99');
    const playheadColor = resolveCssColor('var(--color-accent)', '#ff8159');

    const visible = lines.filter((line) => !line.is_deleted);
    let frame = 0;

    const draw = () => {
      frame = requestAnimationFrame(draw);

      const video = videoRef.current;
      const dpr = window.devicePixelRatio || 1;
      const cssWidth = canvas.clientWidth;
      const cssHeight = height;
      if (cssWidth === 0) return;

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

      const activeRowY = cssHeight * 0.46;
      const otherRowY = cssHeight * 0.84;

      // Zone de parole du clip : une bande claire derriere le texte, pour
      // qu'on voie arriver son tour avant d'avoir a lire les mots.
      if (clip) {
        const zoneStart = toX(clip.speech_start_ms);
        const zoneEnd = toX(clip.speech_end_ms);
        if (zoneEnd > 0 && zoneStart < cssWidth) {
          ctx.fillStyle = resolveCssColor('var(--color-surface-raised)', '#2a2a35');
          ctx.globalAlpha = 0.55;
          ctx.fillRect(zoneStart, 0, Math.max(2, zoneEnd - zoneStart), cssHeight);
          ctx.globalAlpha = 1;

          ctx.strokeStyle = guideColor;
          ctx.globalAlpha = 0.5;
          ctx.lineWidth = 1;
          for (const x of [zoneStart, zoneEnd]) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, cssHeight);
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
        }
      }

      ctx.textBaseline = 'alphabetic';

      for (const line of visible) {
        if (line.end_ms < startMs || line.start_ms > endMs) continue;

        const isActive = line.character_id === activeCharacterId;
        const y = isActive ? activeRowY : otherRowY;
        const color = colorOf.get(line.character_id) ?? guideColor;

        ctx.font = isActive
          ? '700 30px ui-sans-serif, system-ui, sans-serif'
          : '500 15px ui-sans-serif, system-ui, sans-serif';

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
                ? 0.4
                : 0.9
            : isPast
              ? 0.2
              : 0.38;

          // Le mot est comprime pour tenir dans sa duree : c'est ce qui
          // fait qu'on peut lire au rythme du texte sans le devancer.
          const natural = ctx.measureText(word.w).width;
          const scale = natural > slot ? slot / natural : 1;
          ctx.translate(x, y);
          ctx.scale(scale, 1);
          ctx.fillText(word.w, 0, 0);
          ctx.restore();

          // Le mot sous la tete de lecture est souligne : c'est le repere
          // qu'on suit des yeux quand on parle.
          if (isActive && isCurrent) {
            ctx.save();
            ctx.fillStyle = color;
            ctx.fillRect(x, y + 7, Math.min(slot, natural * scale), 3);
            ctx.restore();
          }
        }
      }

      // Tete de lecture.
      ctx.strokeStyle = playheadColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 4);
      ctx.lineTo(playheadX, cssHeight - 4);
      ctx.stroke();
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [videoRef, lines, characters, activeCharacterId, clip, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ height }}
      className="w-full rounded-lg border border-border bg-surface-sunken"
      aria-hidden
    />
  );
}
