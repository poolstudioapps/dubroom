'use client';

import { useEffect, useRef, type RefObject } from 'react';

import { WAVEFORM_BUCKETS } from '@/config/constants';
import { t } from '@/config/strings';
import { decodeEnvelope, sliceEnvelope } from '@/lib/audio/envelope';
import type { TakeAnalysis } from '@/lib/audio/waveform';
import { resolveCharacterColor, resolveCssColor } from '@/lib/canvas-colors';
import type { ClipRow } from '@/lib/supabase/database.types';

/**
 * Forme d'onde du clip (PRD §11.5).
 *
 * Elle repond a deux questions differentes, d'ou les deux traces :
 *
 * - « quand dois-je parler ? » — l'enveloppe de la voix d'origine, en
 *   creux derriere, montre le debit de l'acteur avant meme d'avoir
 *   enregistre quoi que ce soit ;
 * - « ai-je deborde ? » — la prise, par-dessus, avec la zone de parole
 *   en surbrillance et les marges en grise.
 *
 * La tete de lecture suit `video.currentTime`, comme la bande rythmo :
 * une seule source de temps pour tout le studio.
 */
export function WaveformView({
  analysis,
  clip,
  videoRef,
  voicePeaks,
  voicePeaksHz,
  characterColor,
  height = 96,
}: {
  analysis: TakeAnalysis | null;
  clip: ClipRow;
  videoRef: RefObject<HTMLVideoElement | null>;
  voicePeaks: string | null;
  voicePeaksHz: number | null;
  characterColor: string;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const windowMs = clip.window_end_ms - clip.window_start_ms;
    const speechStartRatio =
      (clip.speech_start_ms - clip.window_start_ms) / windowMs;
    const speechEndRatio = (clip.speech_end_ms - clip.window_start_ms) / windowMs;

    const envelope = decodeEnvelope(voicePeaks);
    const original =
      envelope && voicePeaksHz
        ? sliceEnvelope(
            envelope,
            voicePeaksHz,
            clip.window_start_ms,
            clip.window_end_ms,
            WAVEFORM_BUCKETS,
          )
        : null;

    const charColor = resolveCharacterColor(characterColor);
    const takeColor = resolveCssColor('var(--color-stage-text)', '#f2f2f5');
    const zoneColor = resolveCssColor('var(--color-stage-raised)', '#2a2a35');
    const playheadColor = resolveCssColor('var(--color-accent)', '#ff8159');

    let frame = 0;

    const draw = () => {
      frame = requestAnimationFrame(draw);

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      if (width === 0) return;

      if (canvas.width !== Math.round(width * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const middle = height / 2;

      // Zone de parole en clair, marges laissees sombres.
      ctx.fillStyle = zoneColor;
      ctx.globalAlpha = 0.5;
      ctx.fillRect(
        width * speechStartRatio,
        0,
        width * (speechEndRatio - speechStartRatio),
        height,
      );
      ctx.globalAlpha = 1;

      // Voix d'origine, en aplat derriere : le repere de timing.
      if (original) {
        ctx.fillStyle = charColor;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, middle);
        for (let i = 0; i < original.length; i += 1) {
          const x = (i / original.length) * width;
          ctx.lineTo(x, middle - (original[i] ?? 0) * (middle - 3));
        }
        for (let i = original.length - 1; i >= 0; i -= 1) {
          const x = (i / original.length) * width;
          ctx.lineTo(x, middle + (original[i] ?? 0) * (middle - 3));
        }
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Prise du joueur, par-dessus, en barres.
      if (analysis) {
        const buckets = analysis.peaks.length;
        const barWidth = width / buckets;
        ctx.fillStyle = takeColor;
        ctx.globalAlpha = 0.9;
        for (let i = 0; i < buckets; i += 1) {
          const amplitude = (analysis.peaks[i] ?? 0) * (middle - 3);
          ctx.fillRect(
            i * barWidth,
            middle - amplitude,
            Math.max(1, barWidth - 0.5),
            amplitude * 2,
          );
        }
        ctx.globalAlpha = 1;
      }

      // Tete de lecture, uniquement quand on est dans la fenetre du clip.
      const nowMs = (videoRef.current?.currentTime ?? 0) * 1000;
      const ratio = (nowMs - clip.window_start_ms) / windowMs;
      if (ratio >= 0 && ratio <= 1) {
        ctx.strokeStyle = playheadColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(width * ratio, 0);
        ctx.lineTo(width * ratio, height);
        ctx.stroke();
      }
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [analysis, clip, height, videoRef, voicePeaks, voicePeaksHz, characterColor]);

  return (
    <div className="space-y-1">
      <canvas
        ref={canvasRef}
        style={{ height }}
        className="w-full rounded-md border-2 border-bezel-dark bg-stage"
        aria-hidden
      />
      <div className="flex justify-between text-[10px] text-text-faint">
        <span>{t.studio.margin}</span>
        <span>{t.studio.speechZone}</span>
        <span>{t.studio.margin}</span>
      </div>
    </div>
  );
}
