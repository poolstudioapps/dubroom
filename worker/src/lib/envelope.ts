import fs from 'node:fs/promises';
import path from 'node:path';

import { TIMEOUTS, config } from '../config.ts';
import { run } from './run.ts';

/**
 * Enveloppe d'amplitude du stem voix.
 *
 * Elle sert au studio a montrer quand l'acteur d'origine parle, pour que
 * le joueur voie son entree arriver. On la calcule ici, une fois, plutot
 * que de servir le WAV au navigateur (PRD §13.3).
 */

/** Intervalles par seconde. 20 Hz suffit a lire un rythme de parole. */
export const ENVELOPE_HZ = 20;

/** Frequence d'echantillonnage intermediaire, volontairement basse. */
const SAMPLE_RATE = 8_000;

export interface Envelope {
  /** Un octet (0-255) par intervalle, encode en base64. */
  peaks: string;
  hz: number;
}

export async function computeEnvelope(
  voiceWav: string,
  workDir: string,
): Promise<Envelope> {
  const rawPath = path.join(workDir, 'voice-envelope.raw');

  // PCM mono 16 bits a 8 kHz : assez pour une enveloppe, et cent fois
  // plus leger a parcourir que le stem complet.
  await run(
    config.ffmpeg,
    [
      '-hide_banner', '-nostats',
      '-i', voiceWav,
      '-ac', '1',
      '-ar', String(SAMPLE_RATE),
      '-f', 's16le',
      '-y', rawPath,
    ],
    { timeoutMs: TIMEOUTS.extract },
  );

  const buffer = await fs.readFile(rawPath);
  const samples = new Int16Array(
    buffer.buffer,
    buffer.byteOffset,
    Math.floor(buffer.byteLength / 2),
  );

  const bucketSize = Math.round(SAMPLE_RATE / ENVELOPE_HZ);
  const bucketCount = Math.ceil(samples.length / bucketSize);
  const peaks = new Uint8Array(bucketCount);

  let maximum = 0;
  const rms = new Float64Array(bucketCount);

  for (let i = 0; i < bucketCount; i += 1) {
    const start = i * bucketSize;
    const end = Math.min(start + bucketSize, samples.length);
    let sum = 0;
    for (let j = start; j < end; j += 1) {
      const value = (samples[j] ?? 0) / 32768;
      sum += value * value;
    }
    const count = Math.max(1, end - start);
    const value = Math.sqrt(sum / count);
    rms[i] = value;
    if (value > maximum) maximum = value;
  }

  // Normalisation sur le maximum de la scene : ce qui compte est le
  // contraste entre parole et silence, pas le niveau absolu.
  const scale = maximum > 0 ? 255 / maximum : 0;
  for (let i = 0; i < bucketCount; i += 1) {
    peaks[i] = Math.min(255, Math.round((rms[i] ?? 0) * scale));
  }

  await fs.rm(rawPath, { force: true });

  return {
    peaks: Buffer.from(peaks).toString('base64'),
    hz: ENVELOPE_HZ,
  };
}
