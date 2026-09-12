'use client';

import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';

import { Button, Card } from '@/components/ui';
import { useSceneCtx } from '@/components/scene-page';
import { setVoiceFx } from '@/lib/actions';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export interface VoiceFx {
  reverb: number;
  pitch: number;
  tune: number;
}

export const FX_NEUTRE: VoiceFx = { reverb: 0, pitch: 0, tune: 0 };

/**
 * Les reglages tout faits.
 *
 * Ils ne remplacent pas les curseurs, ils donnent un point de depart.
 * Personne ne sait ce que valent « quarante de reverbe et deux
 * demi-tons » avant de l'avoir entendu ; « dessin anime », si.
 */
const PRESETS: {
  cle: keyof ReturnType<typeof useT>['studio']['fxPresets'];
  fx: VoiceFx;
}[] = [
  { cle: 'dry', fx: { reverb: 0, pitch: 0, tune: 0 } },
  { cle: 'room', fx: { reverb: 35, pitch: 0, tune: 0 } },
  { cle: 'cathedral', fx: { reverb: 85, pitch: 0, tune: 0 } },
  { cle: 'cartoon', fx: { reverb: 15, pitch: 5, tune: 0 } },
  { cle: 'deep', fx: { reverb: 20, pitch: -5, tune: 0 } },
  { cle: 'cover', fx: { reverb: 45, pitch: 0, tune: 90 } },
];

/**
 * La console de voix.
 *
 * Des curseurs verticaux, comme une tranche de table de mixage : on
 * pousse, on entend. Des molettes auraient pris moins de place mais on
 * ne lit pas une molette d'un coup d'oeil, et pendant une seance on
 * regarde l'ecran, pas ses reglages.
 *
 * Rien n'est applique a l'enregistrement : la prise reste brute en
 * reserve et les effets sont poses au mixage. On peut donc changer
 * d'avis jusqu'au rendu, et revenir a la voix nue sans avoir rien perdu.
 */
export function VoiceConsole() {
  const t = useT();
  const { session, me } = useSceneCtx();

  const [fx, setFx] = useState<VoiceFx>({
    reverb: me?.fx_reverb ?? 0,
    pitch: me?.fx_pitch ?? 0,
    tune: me?.fx_tune ?? 0,
  });

  /*
   * Le profil arrive apres le premier rendu : sans cela les curseurs
   * restent a zero alors que la base dit autre chose.
   *
   * Les trois valeurs seules dans les dependances, et surtout pas `me` :
   * cet objet est refait a chaque rafraichissement de la scene — et il y
   * en a un a chaque prise envoyee par n'importe qui. L'effet repartait
   * alors en plein geste et ramenait le curseur sous le doigt a sa
   * valeur d'avant.
   */
  const {
    fx_reverb: reverbServeur,
    fx_pitch: pitchServeur,
    fx_tune: tuneServeur,
  } = me ?? {};
  useEffect(() => {
    if (reverbServeur === undefined) return;
    setFx({
      reverb: reverbServeur ?? 0,
      pitch: pitchServeur ?? 0,
      tune: tuneServeur ?? 0,
    });
  }, [reverbServeur, pitchServeur, tuneServeur]);

  const enregistre = useMutation({
    mutationFn: (next: VoiceFx) => setVoiceFx(session.id, next),
  });

  /** Bouge tout de suite, ecrit quand on lache. */
  function pousse(next: Partial<VoiceFx>) {
    setFx((courant) => ({ ...courant, ...next }));
  }
  function pose(next: VoiceFx) {
    setFx(next);
    enregistre.mutate(next);
  }

  const actif = fx.reverb > 0 || fx.pitch !== 0 || fx.tune > 0;

  return (
    <Card variant="plate" className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <SlidersHorizontal className="h-4 w-4 text-text-muted" aria-hidden />
          {t.studio.fxTitle}
        </h2>
        {actif ? (
          <Button size="sm" variant="ghost" onClick={() => pose(FX_NEUTRE)}>
            {t.studio.fxReset}
          </Button>
        ) : null}
      </div>

      {/* ── Les trois tranches ────────────────────────────────────── */}
      <div className="flex justify-between gap-2">
        <Fader
          label={t.studio.fxReverb}
          value={fx.reverb}
          min={0}
          max={100}
          suffix=" %"
          onInput={(v) => pousse({ reverb: v })}
          onCommit={(v) => pose({ ...fx, reverb: v })}
        />
        <Fader
          label={t.studio.fxPitch}
          value={fx.pitch}
          min={-12}
          max={12}
          suffix=""
          format={(v) => (v > 0 ? `+${v}` : String(v))}
          onInput={(v) => pousse({ pitch: v })}
          onCommit={(v) => pose({ ...fx, pitch: v })}
        />
        <Fader
          label={t.studio.fxTune}
          value={fx.tune}
          min={0}
          max={100}
          suffix=" %"
          onInput={(v) => pousse({ tune: v })}
          onCommit={(v) => pose({ ...fx, tune: v })}
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map(({ cle, fx: valeurs }) => {
          const choisi =
            fx.reverb === valeurs.reverb &&
            fx.pitch === valeurs.pitch &&
            fx.tune === valeurs.tune;
          return (
            <button
              key={cle}
              type="button"
              aria-pressed={choisi}
              onClick={() => pose(valeurs)}
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

      <p className="text-xs leading-relaxed text-text-faint">{t.studio.fxHelp}</p>
    </Card>
  );
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
  suffix,
  format,
  onInput,
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  format?: (v: number) => string;
  onInput: (v: number) => void;
  onCommit: (v: number) => void;
}) {
  return (
    <label className="flex flex-1 flex-col items-center gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
        {label}
      </span>

      <span className="flex h-28 w-10 items-center justify-center">
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          aria-label={label}
          onChange={(e) => onInput(Number(e.target.value))}
          onPointerUp={(e) => onCommit(Number(e.currentTarget.value))}
          onKeyUp={(e) => onCommit(Number(e.currentTarget.value))}
          // Une rotation d'un quart de tour : la piste reste la piste,
          // la poignee reste la poignee, et tout le comportement natif
          // suit. La largeur devient la hauteur, d'ou le `w-28`.
          className="w-28 origin-center -rotate-90"
        />
      </span>

      <span className="tabular-nums text-xs font-bold">
        {format ? format(value) : value}
        {suffix}
      </span>
    </label>
  );
}
