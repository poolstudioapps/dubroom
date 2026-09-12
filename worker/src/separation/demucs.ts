import fs from 'node:fs/promises';
import path from 'node:path';

import { TIMEOUTS, config } from '../config.ts';
import { SystemError } from '../errors.ts';
import { resample48k } from '../lib/ffmpeg.ts';
import { run } from '../lib/run.ts';
import type { ScopedLog } from '../log.ts';
import type { SeparationResult } from './index.ts';

/** Paliers de repli quand la memoire lache (PRD §20.7). */
const SEGMENT_FALLBACKS = [5, 3];

const MEMORY_ERRORS = [
  'CUDA out of memory',
  'out of memory',
  'DefaultCPUAllocator',
  'Killed',
];

function isMemoryError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return MEMORY_ERRORS.some((needle) => message.includes(needle));
}

async function exists(file: string): Promise<boolean> {
  try {
    const stat = await fs.stat(file);
    return stat.size > 0;
  } catch {
    return false;
  }
}

async function runDemucs(
  inputWav: string,
  outDir: string,
  segment: number,
  onProgress: (pct: number) => void,
): Promise<void> {
  await run(
    config.python,
    [
      '-m', 'demucs',
      // Deux stems seulement (voix / reste) : c'est exactement ce dont
      // on a besoin, et c'est plus rapide que la separation en quatre.
      '--two-stems=vocals',
      '-n', config.demucsModel,
      '--device', config.demucsDevice,
      '-j', config.demucsJobs,
      '--segment', String(segment),
      '--filename', '{stem}.{ext}',
      '-o', outDir,
      inputWav,
    ],
    {
      timeoutMs: TIMEOUTS.demucs,
      onStderr: (chunk) => {
        // Demucs ecrit sa progression sur stderr, sous forme de barre
        // avec des \r. On parse au mieux et on se rabat sur une
        // progression indeterminee si le format change.
        const matches = chunk.match(/(\d+(?:\.\d+)?)%/g);
        const last = matches?.[matches.length - 1];
        if (last) {
          const pct = Number(last.replace('%', ''));
          if (Number.isFinite(pct)) onProgress(Math.min(99, Math.round(pct)));
        }
      },
    },
  );
}

/**
 * Separation de reference (PRD §20.7).
 *
 * L'arborescence de sortie n'est pas celle qu'on attend : le
 * sous-dossier au nom du modele est toujours cree, meme avec
 * `--filename`. On la construit depuis DEMUCS_MODEL et on verifie que
 * les deux fichiers sont bien la avant de continuer.
 */
export async function separateWithDemucs(
  inputWav: string,
  outDir: string,
  onProgress: (pct: number) => void,
  logger: ScopedLog,
): Promise<SeparationResult> {
  await fs.mkdir(outDir, { recursive: true });

  const segments = [Number(config.demucsSegment) || 7, ...SEGMENT_FALLBACKS];
  let lastError: unknown = null;

  for (const segment of segments) {
    try {
      logger.info('demucs', { segment, device: config.demucsDevice });
      await runDemucs(inputWav, outDir, segment, onProgress);
      lastError = null;
      break;
    } catch (error) {
      lastError = error;
      if (!isMemoryError(error)) throw error;
      // Manquer de memoire est le mode d'echec le plus frequent :
      // on retente avec un segment plus court avant d'abandonner.
      logger.warn('mémoire insuffisante, segment réduit', { segment });
    }
  }
  if (lastError) throw lastError;

  const modelDir = path.join(outDir, config.demucsModel);
  const vocals = path.join(modelDir, 'vocals.wav');
  const noVocals = path.join(modelDir, 'no_vocals.wav');

  if (!(await exists(vocals)) || !(await exists(noVocals))) {
    throw new SystemError(
      `Demucs n'a pas produit les deux stems attendus dans ${modelDir}.`,
    );
  }

  // Demucs rend du 44,1 kHz quand l'entree l'est. Sans reechantillonnage
  // en 48 kHz, le mixage derive progressivement sur toute la scene.
  const voicePath = path.join(outDir, 'voice.wav');
  const musicPath = path.join(outDir, 'music.wav');
  await resample48k(vocals, voicePath);
  await resample48k(noVocals, musicPath);

  return { voicePath, musicPath };
}
