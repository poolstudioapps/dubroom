'use client';

import { useCallback, useEffect, useState } from 'react';

import { recallPreference, rememberPreference } from '@/lib/consent';

export const MIC_DEVICE_KEY = 'dubup.micDevice' as const;
export const OUTPUT_DEVICE_KEY = 'dubup.outputDevice' as const;

/** Les pseudo-entrees de Chrome, doublons de l'entree du systeme. */
const PSEUDO = new Set(['default', 'communications', '']);

/**
 * Le navigateur sait-il envoyer le son vers une sortie choisie ?
 *
 * Chrome, Edge et Firefox oui ; Safari non. Sans cette capacite, le son
 * sort la ou le systeme l'envoie, et le menu de sortie n'est pas propose.
 */
export function outputChoiceSupported(): boolean {
  return typeof HTMLMediaElement !== 'undefined' && 'setSinkId' in HTMLMediaElement.prototype;
}

type AvecSortie = { setSinkId?: (id: string) => Promise<void> };

/**
 * Envoie le son des medias et du contexte audio vers la sortie choisie.
 *
 * Une sortie refusee — debranchee, ou interdite par le navigateur — ne
 * casse rien : le son reste sur la sortie du systeme.
 */
export async function applyOutputDevice(
  deviceId: string,
  elements: (HTMLMediaElement | null | undefined)[],
  contexte?: AudioContext | null,
): Promise<void> {
  if (!outputChoiceSupported()) return;
  const cibles: AvecSortie[] = [
    ...elements.filter((el): el is HTMLMediaElement => !!el),
    ...(contexte ? [contexte as unknown as AvecSortie] : []),
  ];
  await Promise.all(
    cibles.map((cible) =>
      typeof cible.setSinkId === 'function'
        ? cible.setSinkId(deviceId).catch(() => undefined)
        : undefined,
    ),
  );
}

/**
 * Les entrees et sorties audio, et celles qu'on a choisies.
 *
 * Le navigateur ne donne le nom des appareils qu'une fois le micro
 * autorise : avant, la liste existe mais ses libelles sont vides. D'ou
 * `labelled`, et `askPermission` pour les obtenir sans lancer de prise.
 *
 * Le choix est retenu d'une visite a l'autre si l'on a accepte les
 * preferences. Un appareil retenu puis debranche retombe sur celui du
 * systeme au lieu d'afficher un choix qui n'existe plus.
 */
export type AudioDevices = ReturnType<typeof useAudioDevices>;

export function useAudioDevices() {
  const [inputs, setInputs] = useState<MediaDeviceInfo[]>([]);
  const [outputs, setOutputs] = useState<MediaDeviceInfo[]>([]);
  const [micChoisi, setMicChoisi] = useState('');
  const [sortieChoisie, setSortieChoisie] = useState('');
  const [supported, setSupported] = useState(false);

  const refresh = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const tous = await navigator.mediaDevices.enumerateDevices();
    setInputs(tous.filter((d) => d.kind === 'audioinput' && !PSEUDO.has(d.deviceId)));
    setOutputs(tous.filter((d) => d.kind === 'audiooutput' && !PSEUDO.has(d.deviceId)));
  }, []);

  useEffect(() => {
    setMicChoisi(recallPreference(MIC_DEVICE_KEY) ?? '');
    setSortieChoisie(recallPreference(OUTPUT_DEVICE_KEY) ?? '');
    setSupported(outputChoiceSupported());
    void refresh();
    const appareils = navigator.mediaDevices;
    appareils?.addEventListener?.('devicechange', refresh);
    return () => appareils?.removeEventListener?.('devicechange', refresh);
  }, [refresh]);

  const askPermission = useCallback(async () => {
    const flux = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    flux.getTracks().forEach((piste) => piste.stop());
    await refresh();
  }, [refresh]);

  const micId = inputs.some((d) => d.deviceId === micChoisi) ? micChoisi : '';
  const outputId = outputs.some((d) => d.deviceId === sortieChoisie) ? sortieChoisie : '';

  return {
    inputs,
    outputs,
    micId,
    outputId,
    labelled: inputs.some((d) => !!d.label),
    outputSupported: supported,
    refresh,
    askPermission,
    setMicId: (id: string) => {
      setMicChoisi(id);
      rememberPreference(MIC_DEVICE_KEY, id);
    },
    setOutputId: (id: string) => {
      setSortieChoisie(id);
      rememberPreference(OUTPUT_DEVICE_KEY, id);
    },
  };
}
