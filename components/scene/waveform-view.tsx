'use client';

import { useEffect, useRef } from 'react';

import { t } from '@/config/strings';
import type { TakeAnalysis } from '@/lib/audio/waveform';
import type { ClipRow } from '@/lib/supabase/database.types';

/**
 * Forme d'onde de la prise, avec la zone de parole en surbrillance et les
 * marges en grise (PRD §11.5). Le joueur doit voir qu'il deborde, pas le
 * decouvrir au rendu.
 */
export function WaveformView({
  analysis,
  clip,
  height = 72,
}: {
  analysis: TakeAnalysis | null;
  clip: ClipRow;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const windowMs = clip.window_end_ms - clip.window_start_ms;
  const speechStartRatio = (clip.speech_start_ms - clip.window_start_ms) / windowMs;
  const speechEndRatio = (clip.speech_end_ms - clip.window_start_ms) / windowMs;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // Marges : tout ce qui n'est pas la zone de parole.
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(0, 0, width * speechStartRatio, height);
    ctx.fillRect(
      width * speechEndRatio,
      0,
      width * (1 - speechEndRatio),
      height,
    );

    ctx.fillStyle = 'rgba(255,255,255,0.09)';
    ctx.fillRect(
      width * speechStartRatio,
      0,
      width * (speechEndRatio - speechStartRatio),
      height,
    );

    if (!analysis) return;

    const middle = height / 2;
    const buckets = analysis.peaks.length;
    const barWidth = width / buckets;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';

    for (let i = 0; i < buckets; i += 1) {
      const amplitude = (analysis.peaks[i] ?? 0) * (height / 2 - 2);
      ctx.fillRect(
        i * barWidth,
        middle - amplitude,
        Math.max(1, barWidth - 0.5),
        amplitude * 2,
      );
    }
  }, [analysis, height, speechStartRatio, speechEndRatio]);

  return (
    <div className="space-y-1">
      <canvas
        ref={canvasRef}
        style={{ height }}
        className="w-full rounded-lg border border-border bg-surface-sunken"
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
