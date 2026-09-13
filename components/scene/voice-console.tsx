'use client';

import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';

import { Alert, Button, Card } from '@/components/ui';
import { setTakeFx } from '@/lib/actions';
import { humanizeError } from '@/lib/errors';
import { useT } from '@/lib/i18n';
import type { TakeRow } from '@/lib/supabase/database.types';
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
 * La console de voix, pour la prise affichee.
 *
 * Elle reglait autrefois le joueur entier : une reverbe choisie pour une
 * replique chantee s'etendait a toutes les autres. Elle regle maintenant
 * une prise, celle du clip en cours, et rien d'autre.
 *
 * Des curseurs verticaux, comme une tranche de table de mixage. Rien
 * n'est applique a l'enregistrement : la prise reste brute en reserve et
 * les effets sont poses au mixage. On peut donc les ajouter apres coup,
 * les changer, ou revenir a la voix nue sans avoir rien perdu.
 */
export function VoiceConsole({ take }: { take: TakeRow | null }) {
  const t = useT();
  const [fx, setFx] = useState<VoiceFx>(FX_NEUTRE);
  const [erreur, setErreur] = useState<string | null>(null);

  /*
   * Se recaler sur la prise, et seulement quand elle change vraiment.
   *
   * Des valeurs primitives dans les dependances, jamais l'objet : la
   * liste des prises est rechargee a chaque envoi de n'importe quel
   * joueur, et un objet neuf ramenait le curseur sous le doigt a sa
   * valeur d'avant en plein geste.
   */
  const id = take?.id;
  const reverbServeur = take?.fx_reverb;
  const pitchServeur = take?.fx_pitch;
  const tuneServeur = take?.fx_tune;
  useEffect(() => {
    setFx({
      reverb: reverbServeur ?? 0,
      pitch: pitchServeur ?? 0,
      tune: tuneServeur ?? 0,
    });
    setErreur(null);
  }, [id, reverbServeur, pitchServeur, tuneServeur]);

  const enregistre = useMutation({
    mutationFn: (next: VoiceFx) => {
      if (!id) throw new Error('Aucune prise');
      return setTakeFx(id, next);
    },
    onMutate: () => setErreur(null),
    onError: (e) => setErreur(humanizeError(e)),
  });

  /** Bouge tout de suite, ecrit quand on lache. */
  function pousse(next: Partial<VoiceFx>) {
    setFx((courant) => ({ ...courant, ...next }));
  }
  function pose(next: VoiceFx) {
    setFx(next);
    enregistre.mutate(next);
  }

  // Pas de prise, pas d'effet a regler : on le dit au lieu d'offrir des
  // curseurs qui n'agiraient sur rien.
  if (!take) {
    return (
      <Card variant="plate" className="space-y-2">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <SlidersHorizontal className="h-4 w-4 text-text-muted" aria-hidden />
          {t.studio.fxTitle}
        </h2>
        <p className="text-xs leading-relaxed text-text-faint">{t.studio.fxNoTake}</p>
      </Card>
    );
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

      {erreur ? <Alert tone="danger">{erreur}</Alert> : null}

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
