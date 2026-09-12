import fs from 'node:fs/promises';
import path from 'node:path';

import { TIMEOUTS, config } from '../config.ts';
import { SystemError, UserError } from '../errors.ts';
import { run } from './run.ts';

export interface Probe {
  durationMs: number;
  audioStreamCount: number;
  hasVideo: boolean;
  width: number | null;
  height: number | null;
}

/** Inspecte la source avant tout traitement (PRD §20.3). */
export async function probe(input: string): Promise<Probe> {
  const { stdout } = await run(
    config.ffprobe,
    ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', input],
    { timeoutMs: TIMEOUTS.ffprobe },
  );

  let parsed: {
    format?: { duration?: string };
    streams?: { codec_type?: string; width?: number; height?: number }[];
  };
  try {
    parsed = JSON.parse(stdout);
  } catch (error) {
    throw new SystemError('Sortie ffprobe illisible', { cause: error });
  }

  const streams = parsed.streams ?? [];
  const video = streams.find((s) => s.codec_type === 'video');
  const audioStreamCount = streams.filter((s) => s.codec_type === 'audio').length;
  const durationMs = Math.round(parseFloat(parsed.format?.duration ?? '0') * 1000);

  if (!video) throw new UserError('Ce fichier ne contient pas de vidéo.');
  if (audioStreamCount === 0) {
    throw new UserError('Ce fichier ne contient pas de piste audio.');
  }
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    throw new UserError('Impossible de lire la durée de ce fichier.');
  }
  if (durationMs > config.maxVideoDurationMs) {
    throw new UserError(
      `Scène trop longue (${Math.round(durationMs / 60000)} min, maximum ${Math.round(
        config.maxVideoDurationMs / 60000,
      )} min).`,
    );
  }

  return {
    durationMs,
    audioStreamCount,
    hasVideo: true,
    width: video.width ?? null,
    height: video.height ?? null,
  };
}

/**
 * Lance ffmpeg en suivant sa progression (PRD §20.4).
 *
 * La sortie est ecrite dans un fichier temporaire puis renommee : un
 * ffmpeg tue en cours de route laisse sinon un MP4 corrompu qui a l'air
 * valide, et le job suivant le reprendrait tel quel.
 */
async function ffmpeg(
  args: string[],
  output: string,
  opts: {
    durationMs?: number;
    onProgress?: (pct: number) => void;
    timeoutMs: number;
  },
): Promise<void> {
  // Le marqueur `.part` s'insere AVANT l'extension : ffmpeg choisit son
  // conteneur d'apres elle, et `mix.wav.part` le laisserait sans format.
  const extension = path.extname(output);
  const temp = `${output.slice(0, output.length - extension.length)}.part${extension}`;
  await fs.rm(temp, { force: true });

  await run(
    config.ffmpeg,
    [
      '-hide_banner',
      '-nostats',
      '-progress',
      'pipe:1',
      ...args,
      // -y sinon ffmpeg attend une confirmation au clavier et le job
      // reste bloque jusqu'au timeout.
      '-y',
      temp,
    ],
    {
      timeoutMs: opts.timeoutMs,
      onStdout: (chunk) => {
        if (!opts.durationMs || !opts.onProgress) return;
        for (const line of chunk.split('\n')) {
          const [key, value] = line.trim().split('=');
          // out_time_us est en microsecondes ; out_time_ms l'est aussi,
          // historiquement, d'ou le choix sans ambiguite.
          if (key === 'out_time_us' && value) {
            const pct = Math.min(
              99,
              Math.round((Number(value) / 1000 / opts.durationMs) * 100),
            );
            if (Number.isFinite(pct) && pct >= 0) opts.onProgress(pct);
          }
        }
      },
    },
  );

  await fs.rename(temp, output);
}

/**
 * Normalisation (PRD §6.2).
 *
 * Le mapping explicite n'est pas optionnel : un rip de film contient
 * souvent plusieurs pistes audio (VF, VO, commentaires) et des
 * sous-titres. Sans lui, ffmpeg en choisit une selon ses heuristiques.
 */
export async function normalize(
  input: string,
  output: string,
  durationMs: number,
  onProgress: (pct: number) => void,
): Promise<void> {
  await ffmpeg(
    [
      '-i', input,
      '-map', '0:v:0',
      '-map', '0:a:0',
      '-sn',
      '-dn',
      '-vf', "scale='min(1280,iw)':-2",
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-crf', '23',
      '-profile:v', 'high',
      '-level', '4.0',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-ar', '48000',
      '-ac', '2',
    ],
    output,
    { durationMs, onProgress, timeoutMs: TIMEOUTS.encode },
  );
}

/** WAV 48 kHz stereo 16 bits, reference pour toute la suite. */
export async function extractAudio(input: string, output: string): Promise<void> {
  await ffmpeg(
    ['-i', input, '-vn', '-acodec', 'pcm_s16le', '-ar', '48000', '-ac', '2'],
    output,
    { timeoutMs: TIMEOUTS.extract },
  );
}

/**
 * Downmix mono 16 kHz, uniquement pour l'envoi a Scribe : six fois plus
 * leger a televerser, sans perte utile pour la reconnaissance. Le stem
 * voix 48 kHz reste la reference pour le mixage (PRD §20.8).
 */
export async function downmixForStt(input: string, output: string): Promise<void> {
  await ffmpeg(['-i', input, '-ac', '1', '-ar', '16000'], output, {
    timeoutMs: TIMEOUTS.extract,
  });
}

/**
 * Version compressee du stem de fond, pour le studio.
 *
 * Le navigateur rejoue ce fichier a chaque prise et a chaque reecoute,
 * pour chaque joueur. Servir le WAV 48 kHz (~35 Mo par minute) viderait
 * les 2 Go de bande passante mensuels en une soiree (PRD §13.3) — alors
 * que l'AAC 96 kbps est indistinguable comme simple repere rythmique.
 * Le WAV reste la reference du mixage.
 */
export async function encodeBackingPreview(
  input: string,
  output: string,
): Promise<void> {
  await ffmpeg(
    ['-i', input, '-c:a', 'aac', '-b:a', '96k', '-ar', '48000', '-ac', '2',
     '-movflags', '+faststart'],
    output,
    { timeoutMs: TIMEOUTS.extract },
  );
}

/** Reechantillonne un stem en 48 kHz stereo (PRD §20.7). */
export async function resample48k(input: string, output: string): Promise<void> {
  await ffmpeg(['-i', input, '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le'], output, {
    timeoutMs: TIMEOUTS.extract,
  });
}

/**
 * Deux orthographes pour la meme chose, selon l'age de ffmpeg :
 * `-filter_complex_script` a ete remplace par `-/filter_complex` et
 * n'existe plus depuis ffmpeg 8. Plutot que de deduire la syntaxe d'un
 * numero de version — qui ne dit rien des builds systeme de Debian ou de
 * Homebrew — on essaie la moderne, et on retombe sur l'ancienne si
 * ffmpeg ne la connait pas. Le resultat est memorise pour la suite.
 */
const FILTER_SCRIPT_FLAGS = ['-/filter_complex', '-filter_complex_script'] as const;
let resolvedFilterFlag: string | null = null;

function isUnknownOption(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('Unrecognized option') ||
    message.includes('Option not found') ||
    message.includes('Unknown option')
  );
}

/**
 * Mixage a partir d'un filtergraph ecrit dans un fichier (PRD §20.5).
 *
 * Avec une vingtaine de clips et autant de segments VO, la ligne de
 * commande depasse les 8191 caracteres de cmd.exe. Le fichier est
 * conserve dans WORK_DIR : c'est la seule piece a conviction exploitable
 * quand un mixage part de travers.
 */
export async function mixWithGraph(
  inputs: string[],
  graph: string,
  graphPath: string,
  output: string,
  durationMs: number,
  onProgress: (pct: number) => void,
): Promise<void> {
  await fs.writeFile(graphPath, graph, 'utf8');

  const candidates = resolvedFilterFlag
    ? [resolvedFilterFlag]
    : [...FILTER_SCRIPT_FLAGS];
  let lastError: unknown = null;

  for (const flag of candidates) {
    try {
      await ffmpeg(
        [
          ...inputs.flatMap((file) => ['-i', file]),
          flag, graphPath,
          '-map', '[out]',
          '-c:a', 'pcm_s16le',
        ],
        output,
        { durationMs, onProgress, timeoutMs: TIMEOUTS.mix },
      );
      resolvedFilterFlag = flag;
      return;
    } catch (error) {
      if (!isUnknownOption(error)) throw error;
      lastError = error;
    }
  }

  throw lastError ?? new SystemError('Aucune syntaxe de filtergraph acceptée par ffmpeg.');
}

/**
 * Mux final (PRD §12.4). La video est copiee sans reencodage : c'est
 * tout l'interet d'avoir normalise a l'ingestion.
 *
 * `-shortest` est un garde-fou : si le mix depasse la video de quelques
 * ms, certains lecteurs affichent un ecran noir en fin de fichier.
 */
export async function muxFinal(
  video: string,
  audio: string,
  output: string,
  durationMs: number,
  onProgress: (pct: number) => void,
): Promise<void> {
  await ffmpeg(
    [
      '-i', video,
      '-i', audio,
      '-map', '0:v:0',
      '-map', '1:a:0',
      '-shortest',
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-movflags', '+faststart',
    ],
    output,
    { durationMs, onProgress, timeoutMs: TIMEOUTS.mux },
  );
}

/** Deux secondes de silence, pour prechauffer Demucs (PRD §20.1.6). */
export async function generateSilence(output: string, seconds = 2): Promise<void> {
  await run(
    config.ffmpeg,
    [
      '-hide_banner',
      '-f', 'lavfi',
      '-i', 'anullsrc=r=44100:cl=stereo',
      '-t', String(seconds),
      '-y', output,
    ],
    { timeoutMs: 60_000 },
  );
}

export function graphPathFor(workDir: string): string {
  return path.join(workDir, 'graph.txt');
}
