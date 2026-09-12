'use client';

import {
  TAKE_SILENCE_RMS,
  TAKE_TAIL_CHECK_MS,
  WAVEFORM_BUCKETS,
} from '@/config/constants';

export interface TakeAnalysis {
  /** Amplitude normalisee par colonne, entre 0 et 1. */
  peaks: number[];
  durationMs: number;
  /**
   * Le joueur parlait encore quand l'enregistrement s'est coupe : sa
   * phrase est tronquee, il faut le signaler avant le rendu (PRD §11.5).
   */
  truncated: boolean;
}

let ctx: AudioContext | null = null;

function audioContext(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

/** Decode une prise et en tire de quoi dessiner et avertir. */
export async function analyzeTake(blob: Blob): Promise<TakeAnalysis> {
  const buffer = await blob.arrayBuffer();
  const audio = await audioContext().decodeAudioData(buffer);
  const samples = audio.getChannelData(0);
  const durationMs = audio.duration * 1000;

  const bucketSize = Math.max(1, Math.floor(samples.length / WAVEFORM_BUCKETS));
  const peaks: number[] = [];
  let maximum = 0;

  for (let i = 0; i < WAVEFORM_BUCKETS; i += 1) {
    const start = i * bucketSize;
    let sum = 0;
    let count = 0;
    for (let j = start; j < start + bucketSize && j < samples.length; j += 1) {
      const value = samples[j] ?? 0;
      sum += value * value;
      count += 1;
    }
    const rms = count > 0 ? Math.sqrt(sum / count) : 0;
    peaks.push(rms);
    if (rms > maximum) maximum = rms;
  }

  // On normalise pour l'affichage, mais la detection de troncature se
  // fait sur le niveau brut : une prise entierement faible ne doit pas
  // se retrouver artificiellement « chaude » en fin de fichier.
  const tailSamples = Math.min(
    samples.length,
    Math.round((TAKE_TAIL_CHECK_MS / 1000) * audio.sampleRate),
  );
  let tailSum = 0;
  for (let i = samples.length - tailSamples; i < samples.length; i += 1) {
    const value = samples[i] ?? 0;
    tailSum += value * value;
  }
  const tailRms = tailSamples > 0 ? Math.sqrt(tailSum / tailSamples) : 0;

  return {
    peaks: maximum > 0 ? peaks.map((p) => p / maximum) : peaks,
    durationMs,
    truncated: tailRms > TAKE_SILENCE_RMS,
  };
}
