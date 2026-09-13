'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

import { useT } from '@/lib/i18n';
import {
  MIC_OFFSET_DRAG_MAX_MS,
  MIC_OFFSET_STEP_MS,
  WAVEFORM_BUCKETS,
  WAVEFORM_EXTRA_MS,
} from '@/config/constants';

import { decodeEnvelope, sliceEnvelope } from '@/lib/audio/envelope';
import type { TakeAnalysis } from '@/lib/audio/waveform';
import { resolveCharacterColor, resolveCssColor } from '@/lib/canvas-colors';
import type { ClipRow } from '@/lib/supabase/database.types';
import { cn } from '@/lib/utils';

/**
 * Forme d'onde du clip (PRD §11.5).
 *
 * Elle repond a trois questions, d'ou les deux traces et le geste :
 *
 * - « quand dois-je parler ? » — l'enveloppe de la voix d'origine, en
 *   creux derriere, montre le debit de l'acteur avant meme d'avoir
 *   enregistre quoi que ce soit ;
 * - « ma prise tombe-t-elle juste ? » — la prise, par-dessus, posee a
 *   l'endroit exact ou le mixage la mettra ;
 * - « et si elle tombe a cote ? » — on l'attrape et on la fait glisser.
 *   C'est le decalage micro de la console, regle a l'oeil au lieu d'un
 *   curseur : les deux restent synchronises.
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
  takeStartMs = null,
  offsetMs = 0,
  draggable = false,
  onOffsetInput,
  onOffsetCommit,
}: {
  analysis: TakeAnalysis | null;
  clip: ClipRow;
  videoRef: RefObject<HTMLVideoElement | null>;
  voicePeaks: string | null;
  voicePeaksHz: number | null;
  characterColor: string;
  height?: number;
  /**
   * Ou tombe le debut de la prise dans la fenetre, en ms, hors decalage
   * micro. `null` : on ne sait pas encore, la prise s'etale sur la bande.
   */
  takeStartMs?: number | null;
  /** Le decalage micro de la prise, en ms. */
  offsetMs?: number;
  /** La prise peut etre deplacee a la souris ou au doigt. */
  draggable?: boolean;
  onOffsetInput?: (value: number) => void;
  onOffsetCommit?: (value: number) => void;
}) {
  const t = useT();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Lus par la boucle de dessin a chaque image : le glisse ne relance rien.
  const offsetRef = useRef(offsetMs);
  offsetRef.current = offsetMs;
  const debutRef = useRef(takeStartMs);
  debutRef.current = takeStartMs;
  const glisse = useRef<{ x: number; depart: number; valeur: number } | null>(null);
  const [enGlisse, setEnGlisse] = useState<number | null>(null);

  const windowMs = Math.max(1, clip.window_end_ms - clip.window_start_ms);
  // La vue deborde des marges du clip : une prise que le calage a posee
  // loin se voit, et s'attrape, meme hors de la fenetre.
  const vueDebutMs = Math.max(0, clip.window_start_ms - WAVEFORM_EXTRA_MS);
  const vueMs = Math.max(1, clip.window_end_ms + WAVEFORM_EXTRA_MS - vueDebutMs);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const speechStartRatio = (clip.speech_start_ms - vueDebutMs) / vueMs;
    const speechEndRatio = (clip.speech_end_ms - vueDebutMs) / vueMs;
    const fenetreDebutRatio = (clip.window_start_ms - vueDebutMs) / vueMs;
    const fenetreFinRatio = (clip.window_end_ms - vueDebutMs) / vueMs;

    const envelope = decodeEnvelope(voicePeaks);
    const original =
      envelope && voicePeaksHz
        ? sliceEnvelope(
            envelope,
            voicePeaksHz,
            vueDebutMs,
            vueDebutMs + vueMs,
            WAVEFORM_BUCKETS,
          )
        : null;
    /*
     * La voix d'origine, normalisee sur sa propre crete.
     *
     * L'enveloppe est celle du stem entier : sur une scene mixee bas, ou
     * sur une replique chuchotee, elle n'occupait qu'un filet au milieu
     * de la bande et on ne voyait pas ou tombaient les mots. On l'etire
     * pour que sa crete touche presque les bords. Une fenetre quasi
     * silencieuse n'est pas etiree : on grossirait du souffle.
     */
    let crete = 0;
    for (const valeur of original ?? []) crete = Math.max(crete, valeur ?? 0);
    const echelle = crete > 0.02 ? 0.94 / crete : 1;

    const charColor = resolveCharacterColor(characterColor);
    const takeColor = resolveCssColor('var(--color-stage-text)', '#f2f2f5');
    const zoneColor = resolveCssColor('var(--color-stage-raised)', '#2a2a35');
    const playheadColor = resolveCssColor('var(--color-accent)', '#e9c46a');

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

      // La fenetre du clip, a peine eclairee : ce qui deborde reste sombre,
      // mais la prise peut y etre posee.
      ctx.fillStyle = zoneColor;
      ctx.globalAlpha = 0.22;
      ctx.fillRect(
        width * fenetreDebutRatio,
        0,
        width * (fenetreFinRatio - fenetreDebutRatio),
        height,
      );

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
          ctx.lineTo(x, middle - Math.min(1, (original[i] ?? 0) * echelle) * (middle - 3));
        }
        for (let i = original.length - 1; i >= 0; i -= 1) {
          const x = (i / original.length) * width;
          ctx.lineTo(x, middle + Math.min(1, (original[i] ?? 0) * echelle) * (middle - 3));
        }
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Prise du joueur, par-dessus, en barres, a sa place.
      if (analysis) {
        const debut = debutRef.current;
        const decalage = glisse.current?.valeur ?? offsetRef.current;
        const fenetreX = fenetreDebutRatio * width;
        const x0 = debut === null ? fenetreX : fenetreX + ((debut + decalage) / vueMs) * width;
        const largeur =
          debut === null
            ? (windowMs / vueMs) * width
            : (Math.max(1, analysis.durationMs) / vueMs) * width;
        const buckets = analysis.peaks.length;
        const barWidth = largeur / buckets;
        ctx.fillStyle = takeColor;
        ctx.globalAlpha = glisse.current ? 1 : 0.9;
        for (let i = 0; i < buckets; i += 1) {
          const x = x0 + i * barWidth;
          if (x + barWidth < 0 || x > width) continue;
          const amplitude = (analysis.peaks[i] ?? 0) * (middle - 3);
          ctx.fillRect(x, middle - amplitude, Math.max(1, barWidth - 0.5), amplitude * 2);
        }
        ctx.globalAlpha = 1;
      }

      // Tete de lecture, uniquement quand on est dans la fenetre du clip.
      const nowMs = (videoRef.current?.currentTime ?? 0) * 1000;
      const ratio = (nowMs - vueDebutMs) / vueMs;
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
  }, [analysis, clip, height, videoRef, voicePeaks, voicePeaksHz, characterColor, windowMs, vueDebutMs, vueMs]);

  const actif = draggable && !!analysis && takeStartMs !== null;

  function borne(v: number) {
    const arrondi = Math.round(v / MIC_OFFSET_STEP_MS) * MIC_OFFSET_STEP_MS;
    return Math.max(-MIC_OFFSET_DRAG_MAX_MS, Math.min(MIC_OFFSET_DRAG_MAX_MS, arrondi));
  }

  function terminer() {
    const g = glisse.current;
    glisse.current = null;
    setEnGlisse(null);
    if (g && g.valeur !== g.depart) onOffsetCommit?.(g.valeur);
  }

  return (
    <div className="min-w-0 space-y-1">
      {/*
        `min-w-0` n'est pas decoratif. Un canvas est un element remplace :
        sa largeur intrinseque est celle de son attribut `width`, que l'on
        fixe ici a la largeur affichee multipliee par la densite de
        l'ecran. Sur un telephone a deux pixels par point, cet attribut
        vaut donc le double — et comme un enfant de grille refuse par
        defaut de descendre sous sa largeur intrinseque, la colonne
        s'elargissait d'autant, ce qui elargissait le canvas, et ainsi de
        suite. L'ecran du studio finissait deux fois trop large, rogne par
        le cadre du poste.

        Le glisse n'est qu'un raccourci : le curseur « Décalage micro » de
        la console reste le controle accessible au clavier.
      */}
      <canvas
        ref={canvasRef}
        style={{ height }}
        className={cn(
          'block w-full min-w-0 max-w-full rounded-xl border border-border bg-stage',
          actif && 'cursor-grab touch-none',
          enGlisse !== null && 'cursor-grabbing border-accent',
        )}
        aria-hidden
        onPointerDown={(e) => {
          if (!actif) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          glisse.current = { x: e.clientX, depart: offsetMs, valeur: offsetMs };
          setEnGlisse(offsetMs);
        }}
        onPointerMove={(e) => {
          const g = glisse.current;
          if (!g) return;
          const largeur = e.currentTarget.clientWidth || 1;
          const valeur = borne(g.depart + ((e.clientX - g.x) / largeur) * vueMs);
          if (valeur === g.valeur) return;
          g.valeur = valeur;
          setEnGlisse(valeur);
          onOffsetInput?.(valeur);
        }}
        onPointerUp={terminer}
        onPointerCancel={terminer}
      />
      <div className="flex justify-between gap-2 text-[10px] text-text-faint">
        <span>{t.studio.margin}</span>
        <span className={cn('truncate', enGlisse !== null && 'font-bold text-accent')}>
          {enGlisse !== null
            ? `${enGlisse > 0 ? '+' : ''}${enGlisse} ms`
            : actif
              ? t.studio.dragHint
              : t.studio.speechZone}
        </span>
        <span>{t.studio.margin}</span>
      </div>
    </div>
  );
}
