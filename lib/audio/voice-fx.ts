/**
 * La console de voix, rejouee dans le navigateur.
 *
 * « Ma prise » fait entendre la prise avec ses effets, et exactement ceux
 * du rendu : le calcul est le meme des deux cotes (`voice-dsp.ts`). Seul le
 * volume est applique ici a part, parce qu'au mixage il s'ajoute a la
 * correction de niveau mesuree sur la scene.
 *
 * Rien ne tourne en continu : on calcule un tampon quand on appuie sur
 * lecture ou qu'on lache un curseur, et on le joue.
 */

import { traiterVoix } from '@/lib/audio/voice-dsp';

/** Frequence de travail. Assez pour la voix, deux fois moins cher que 48 kHz. */
export const ECOUTE_HZ = 32_000;

export interface VoiceSettings {
  /** 0 a 100. */
  reverb: number;
  /** Demi-tons, -12 a +12. */
  pitch: number;
  /** Ancienne correction de justesse : toujours 0, gardee pour la base. */
  tune: number;
  /** Decibels, -12 a +12. */
  gainDb: number;
}

/** Decode une prise en mono, a la frequence de travail. */
export async function decoderPrise(blob: Blob): Promise<Float32Array> {
  const donnees = await blob.arrayBuffer();
  // Un contexte hors ligne decode ET reechantillonne a sa propre frequence.
  const ctx = new OfflineAudioContext(1, 1, ECOUTE_HZ);
  const audio = await ctx.decodeAudioData(donnees);
  if (audio.numberOfChannels === 1) return audio.getChannelData(0).slice();

  const mono = new Float32Array(audio.length);
  for (let c = 0; c < audio.numberOfChannels; c += 1) {
    const canal = audio.getChannelData(c);
    for (let i = 0; i < mono.length; i += 1) mono[i]! += canal[i]! / audio.numberOfChannels;
  }
  return mono;
}

/** La prise telle que le mixage la posera, effets et volume compris. */
export function rendreVoix(brut: Float32Array, s: VoiceSettings): Float32Array {
  const voix = traiterVoix(brut, ECOUTE_HZ, { pitch: s.pitch, reverb: s.reverb });
  const gain = Math.pow(10, (s.gainDb || 0) / 20);
  if (gain === 1) return voix;
  const sortie = new Float32Array(voix.length);
  for (let i = 0; i < voix.length; i += 1) sortie[i] = voix[i]! * gain;
  return sortie;
}

/** Une cle stable pour ne pas recalculer deux fois le meme reglage. */
export function cleReglages(s: VoiceSettings): string {
  return `${s.reverb}|${s.pitch}|${s.gainDb}`;
}
