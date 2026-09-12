import { config } from '../config.ts';
import type { ScopedLog } from '../log.ts';
import { separateWithDemucs } from './demucs.ts';
import { separateWithElevenLabs } from './elevenlabs.ts';

/**
 * Interface unique de separation de sources (PRD lot 0).
 *
 * Tout le pipeline ne connait que `voicePath` et `musicPath`. Basculer
 * d'une methode a l'autre ne doit toucher qu'a ce fichier — et en
 * pratique, qu'a la variable SEPARATION_MODE.
 *
 * Le stem voix n'est jamais jete : il sert a reinjecter la VO des
 * personnages non doubles au mixage (PRD §12.3).
 */
export interface SeparationResult {
  voicePath: string;
  musicPath: string;
}

export type SeparationFn = (
  inputWav: string,
  outDir: string,
  onProgress: (pct: number) => void,
  logger: ScopedLog,
) => Promise<SeparationResult>;

export async function separate(
  inputWav: string,
  outDir: string,
  onProgress: (pct: number) => void,
  logger: ScopedLog,
): Promise<SeparationResult> {
  const impl: SeparationFn =
    config.separationMode === 'elevenlabs'
      ? separateWithElevenLabs
      : separateWithDemucs;

  logger.info('séparation', { mode: config.separationMode });
  return impl(inputWav, outDir, onProgress, logger);
}
