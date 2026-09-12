import fs from 'node:fs/promises';
import path from 'node:path';

import { TIMEOUTS, config } from '../config.ts';
import { SystemError, UserError } from '../errors.ts';
import { run } from '../lib/run.ts';
import { resample48k } from '../lib/ffmpeg.ts';
import type { ScopedLog } from '../log.ts';
import type { SeparationResult } from './index.ts';

const ENDPOINT = 'https://api.elevenlabs.io/v1/audio-isolation';

/**
 * Option A du PRD §5.4 : l'API rend la voix isolee, jamais le fond. On
 * reconstruit le fond par soustraction de phase.
 *
 * Limite connue et decisive (PRD §20.9) : si l'API renvoie du MP3, la
 * soustraction ne s'annule jamais proprement et il reste un residu de
 * voix. On demande donc explicitement du PCM, et on le dit dans les logs
 * si on ne l'obtient pas — c'est exactement le critere qui tranche entre
 * cette option et Demucs.
 */
export async function separateWithElevenLabs(
  inputWav: string,
  outDir: string,
  onProgress: (pct: number) => void,
  logger: ScopedLog,
): Promise<SeparationResult> {
  await fs.mkdir(outDir, { recursive: true });
  onProgress(5);

  const buffer = await fs.readFile(inputWav);
  const form = new FormData();
  form.append('audio', new Blob([new Uint8Array(buffer)], { type: 'audio/wav' }), 'audio.wav');
  // Format PCM demande explicitement : sans lui la reponse est un MP3,
  // donc un encodage avec perte, et l'option A est condamnee.
  form.append('output_format', 'pcm_48000');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUTS.api);

  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'xi-api-key': config.elevenLabsKey },
      body: form,
      signal: controller.signal,
    });
  } catch (error) {
    throw new SystemError('Appel Audio Isolation impossible', { cause: error });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const text = await response.text();
    if (response.status === 401 || response.status === 403) {
      throw new UserError('La clé ElevenLabs est refusée. Vérifie worker/.env.');
    }
    throw new SystemError(
      `Audio Isolation a répondu ${response.status} : ${text.slice(0, 400)}`,
    );
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('mpeg') || contentType.includes('mp3')) {
    logger.warn(
      'Audio Isolation a renvoyé du MP3 : la soustraction laissera un résidu de voix. Bascule SEPARATION_MODE=demucs.',
      { contentType },
    );
  }
  onProgress(55);

  const rawVoice = path.join(outDir, 'voice-raw');
  await fs.writeFile(rawVoice, Buffer.from(await response.arrayBuffer()));

  const voicePath = path.join(outDir, 'voice.wav');
  await resample48k(rawVoice, voicePath);
  onProgress(75);

  // Fond = original - voix. Le gain de la voix est inverse puis les deux
  // signaux sont sommes sans normalisation.
  const musicPath = path.join(outDir, 'music.wav');
  await run(
    config.ffmpeg,
    [
      '-hide_banner', '-nostats',
      '-i', inputWav,
      '-i', voicePath,
      '-filter_complex',
      '[1:a]volume=-1[inv];[0:a][inv]amix=inputs=2:normalize=0:duration=first[fond]',
      '-map', '[fond]',
      '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le',
      '-y', musicPath,
    ],
    { timeoutMs: TIMEOUTS.mix },
  );

  onProgress(99);
  return { voicePath, musicPath };
}
