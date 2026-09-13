'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Check, SlidersHorizontal } from 'lucide-react';

import { Alert, Button, Card, Spinner } from '@/components/ui';
import {
  MIC_OFFSET_MAX_MS,
  MIC_OFFSET_MIN_MS,
  MIC_OFFSET_STEP_MS,
} from '@/config/constants';
import type { VoiceSettings } from '@/lib/audio/voice-fx';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/** Tout ce qui se regle sur une prise. */
export interface TakeSettings extends VoiceSettings {
  /** Decalage micro, en ms, ajoute au calage automatique. */
  micOffsetMs: number;
}

export const FX_NEUTRE = { reverb: 0, pitch: 0, tune: 0 } as const;

/**
 * Les reglages tout faits.
 *
 * Ils ne remplacent pas les curseurs, ils donnent un point de depart.
 * Personne ne sait ce que valent « quarante de reverbe et deux
 * demi-tons » avant de l'avoir entendu ; « dessin anime », si.
 */
const PRESETS: {
  cle: keyof ReturnType<typeof useT>['studio']['fxPresets'];
  fx: { reverb: number; pitch: number; tune: number };
}[] = [
  { cle: 'dry', fx: { reverb: 0, pitch: 0, tune: 0 } },
  { cle: 'room', fx: { reverb: 35, pitch: 0, tune: 0 } },
  { cle: 'cathedral', fx: { reverb: 85, pitch: 0, tune: 0 } },
  { cle: 'cartoon', fx: { reverb: 15, pitch: 5, tune: 0 } },
  { cle: 'deep', fx: { reverb: 20, pitch: -5, tune: 0 } },
  { cle: 'cover', fx: { reverb: 45, pitch: 0, tune: 90 } },
];

/**
 * La console de voix : tous les reglages de son de la prise affichee.
 *
 * Une tranche de table de mixage — volume, reverbe, hauteur, justesse —
 * puis le calage. Tout s'entend tout de suite dans « Ma prise » : le
 * studio rejoue la chaine du mixage a chaque curseur lache. Rien n'est
 * applique a l'enregistrement, qui reste brut : on peut tout changer
 * jusqu'au rendu.
 *
 * Chaque reglage vaut pour une prise. Le volume et le decalage peuvent
 * s'etendre a toutes ses prises, parce qu'un micro trop bas ou en retard
 * l'est sur toute la scene ; les effets, eux, se choisissent replique par
 * replique.
 *
 * Sans prise, la console regle la prochaine : les curseurs repartent de
 * zero a chaque replique, et ce qu'on y pose s'applique des
 * l'enregistrement.
 *
 * Le composant ne garde aucun etat : le studio les tient, parce que c'est
 * lui qui joue la prise et qui sait quand elle change.
 */
export function VoiceConsole({
  value,
  hasTake,
  computing,
  error,
  onInput,
  onCommit,
  offsetEverywhere,
  onOffsetEverywhere,
  onGainEverywhere,
  gainEverywhere,
}: {
  value: TakeSettings;
  hasTake: boolean;
  /** L'ecoute avec effets est en cours de calcul. */
  computing: boolean;
  error: string | null;
  /** Le curseur bouge : affichage seulement. */
  onInput: (partial: Partial<TakeSettings>) => void;
  /** Le curseur est lache : on enregistre, et l'ecoute suit. */
  onCommit: (partial: Partial<TakeSettings>) => void;
  offsetEverywhere: boolean;
  onOffsetEverywhere: (next: boolean) => void;
  onGainEverywhere: () => void;
  gainEverywhere: 'idle' | 'pending' | 'done';
}) {
  const t = useT();
  const actif = value.reverb > 0 || value.pitch !== 0 || value.tune > 0 || value.gainDb !== 0;
  const decalage = useValidation((v: number) => onCommit({ micOffsetMs: v }));

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <SlidersHorizontal className="h-4 w-4 text-text-muted" aria-hidden />
          {t.studio.fxTitle}
        </h2>
        {actif ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onCommit({ ...FX_NEUTRE, gainDb: 0 })}
          >
            {t.studio.fxReset}
          </Button>
        ) : null}
      </div>

      {/* Une ligne d'etat de hauteur fixe : rien ne saute quand elle change. */}
      <p className="flex min-h-4 items-center gap-1.5 text-xs text-text-faint" role="status">
        {computing ? (
          <>
            <Spinner className="h-3 w-3" />
            {t.studio.fxComputing}
          </>
        ) : hasTake ? null : (
          t.studio.fxPending
        )}
      </p>

      {/* ── La tranche ─────────────────────────────────────────────── */}
      <div className="flex justify-between gap-1">
        <Fader
          label={t.studio.fxGain}
          value={value.gainDb}
          min={-12}
          max={12}
          step={0.5}
          format={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)} dB`}
          onInput={(v) => onInput({ gainDb: v })}
          onCommit={(v) => onCommit({ gainDb: v })}
        />
        <Fader
          label={t.studio.fxReverb}
          value={value.reverb}
          min={0}
          max={100}
          format={(v) => `${v} %`}
          onInput={(v) => onInput({ reverb: v })}
          onCommit={(v) => onCommit({ reverb: v })}
        />
        <Fader
          label={t.studio.fxPitch}
          value={value.pitch}
          min={-12}
          max={12}
          format={(v) => (v > 0 ? `+${v}` : String(v))}
          onInput={(v) => onInput({ pitch: v })}
          onCommit={(v) => onCommit({ pitch: v })}
        />
        <Fader
          label={t.studio.fxTune}
          value={value.tune}
          min={0}
          max={100}
          format={(v) => `${v} %`}
          onInput={(v) => onInput({ tune: v })}
          onCommit={(v) => onCommit({ tune: v })}
        />
      </div>

      <Button
        size="sm"
        variant="ghost"
        className="w-full"
        loading={gainEverywhere === 'pending'}
        onClick={onGainEverywhere}
      >
        {gainEverywhere === 'done' ? <Check className="h-3.5 w-3.5 text-ok" aria-hidden /> : null}
        {gainEverywhere === 'done' ? t.studio.fxGainAppliedAll : t.studio.fxGainApplyAll}
      </Button>

      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map(({ cle, fx }) => {
          const choisi =
            value.reverb === fx.reverb && value.pitch === fx.pitch && value.tune === fx.tune;
          return (
            <button
              key={cle}
              type="button"
              aria-pressed={choisi}
              onClick={() => onCommit(fx)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs font-bold transition-colors',
                choisi
                  ? 'border-select bg-select/15 text-select'
                  : 'border-border-strong text-text-muted hover:bg-surface',
              )}
            >
              {t.studio.fxPresets[cle]}
            </button>
          );
        })}
      </div>

      {/* ── Le calage ──────────────────────────────────────────────── */}
      <div className="space-y-1.5 border-t border-border pt-3">
        <div className="flex items-center justify-between text-sm">
          <label htmlFor="decalage-micro" className="font-bold">
            {t.studio.micOffset}
          </label>
          <span className="tabular-nums text-text-faint">
            {value.micOffsetMs > 0 ? '+' : ''}
            {value.micOffsetMs} ms
          </span>
        </div>
        <input
          id="decalage-micro"
          type="range"
          min={MIC_OFFSET_MIN_MS}
          max={MIC_OFFSET_MAX_MS}
          step={MIC_OFFSET_STEP_MS}
          value={value.micOffsetMs}
          onChange={(e) => {
            const v = Number(e.target.value);
            onInput({ micOffsetMs: v });
            decalage.plusTard(v);
          }}
          onPointerUp={(e) => decalage.maintenant(Number(e.currentTarget.value))}
          onKeyUp={(e) => decalage.maintenant(Number(e.currentTarget.value))}
          className="w-full touch-none"
        />
        <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-text-muted">
          <input
            type="checkbox"
            checked={offsetEverywhere}
            onChange={(e) => onOffsetEverywhere(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-select)]"
          />
          {t.studio.micOffsetEverywhere}
        </label>
        <p className="text-xs leading-relaxed text-text-faint">{t.studio.micOffsetHelp}</p>
      </div>

      {error ? <Alert tone="danger">{error}</Alert> : null}

      <p className="text-xs leading-relaxed text-text-faint">{t.studio.fxHelp}</p>
    </Card>
  );
}

/**
 * Quand un curseur doit-il enregistrer sa valeur ?
 *
 * Il le faisait au seul relachement du pointeur, et c'est ce qui rendait
 * la console muette : lache en dehors du curseur tourne, ou au doigt
 * quand le navigateur prenait le geste pour un defilement, le relachement
 * n'arrivait jamais au curseur. Rien n'etait enregistre, rien ne
 * s'entendait, et une seule prise en base avait jamais eu un effet.
 *
 * On valide donc de trois facons : au relachement quand il arrive, au
 * clavier, et de toute facon un tiers de seconde apres le dernier
 * mouvement. Une meme valeur n'est jamais envoyee deux fois.
 */
function useValidation(onCommit: (v: number) => void) {
  const minuteur = useRef<number | null>(null);
  const derniere = useRef<number | null>(null);
  const rappel = useRef(onCommit);
  rappel.current = onCommit;

  useEffect(
    () => () => {
      if (minuteur.current !== null) window.clearTimeout(minuteur.current);
    },
    [],
  );

  const maintenant = useCallback((v: number) => {
    if (minuteur.current !== null) {
      window.clearTimeout(minuteur.current);
      minuteur.current = null;
    }
    if (derniere.current === v) return;
    derniere.current = v;
    rappel.current(v);
  }, []);

  const plusTard = useCallback(
    (v: number) => {
      if (minuteur.current !== null) window.clearTimeout(minuteur.current);
      minuteur.current = window.setTimeout(() => maintenant(v), 320);
    },
    [maintenant],
  );

  return { maintenant, plusTard };
}

/**
 * Un curseur vertical, comme sur une tranche.
 *
 * `input[type=range]` tourne d'un quart de tour : c'est le meme controle
 * que partout ailleurs — au clavier, au doigt, au lecteur d'ecran — et
 * pas un glisser-deposer maison qui n'aurait su que la souris.
 */
function Fader({
  label,
  value,
  min,
  max,
  step = 1,
  format,
  onInput,
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format: (v: number) => string;
  onInput: (v: number) => void;
  onCommit: (v: number) => void;
}) {
  const valider = useValidation(onCommit);

  return (
    <label className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
      <span className="max-w-full truncate text-[11px] font-bold uppercase tracking-wide text-text-muted">
        {label}
      </span>

      <span className="flex h-28 w-10 items-center justify-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-label={label}
          onChange={(e) => {
            const v = Number(e.target.value);
            onInput(v);
            valider.plusTard(v);
          }}
          onPointerUp={(e) => valider.maintenant(Number(e.currentTarget.value))}
          onKeyUp={(e) => valider.maintenant(Number(e.currentTarget.value))}
          // Une rotation d'un quart de tour : la piste reste la piste,
          // la poignee reste la poignee, et tout le comportement natif
          // suit. La largeur devient la hauteur, d'ou le `w-28`. Sans
          // `touch-none`, un glisse vertical au doigt faisait defiler la
          // page au lieu de bouger le curseur.
          className="w-28 origin-center -rotate-90 touch-none"
        />
      </span>

      <span className="whitespace-nowrap text-xs font-bold tabular-nums">{format(value)}</span>
    </label>
  );
}
