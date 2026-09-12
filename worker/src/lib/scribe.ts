import fs from 'node:fs/promises';
import path from 'node:path';

import { TIMEOUTS, config } from '../config.ts';
import { SystemError, UserError } from '../errors.ts';
import type { ScopedLog } from '../log.ts';

const ENDPOINT = 'https://api.elevenlabs.io/v1/speech-to-text';

/** Format interne. Le reste du pipeline ne connait que celui-ci. */
export interface Word {
  text: string;
  startMs: number;
  endMs: number;
  speaker: string;
}

/**
 * Adaptateur de la reponse Scribe (PRD §20.8).
 *
 * Isole volontairement : les noms de champs de l'API peuvent changer, et
 * la reponse brute du premier appel est ecrite dans WORK_DIR pour qu'on
 * puisse ajuster ici, une fois, sans toucher au reste.
 */
export function parseScribeResponse(payload: unknown): Word[] {
  const root = payload as {
    words?: {
      text?: string;
      word?: string;
      start?: number;
      end?: number;
      start_time?: number;
      end_time?: number;
      type?: string;
      speaker_id?: string;
      speaker?: string;
    }[];
  };

  const raw = root.words;
  if (!Array.isArray(raw)) {
    throw new SystemError(
      'Réponse Scribe inattendue : aucun tableau `words`. Voir scribe-raw.json dans WORK_DIR.',
    );
  }

  const words: Word[] = [];
  for (const entry of raw) {
    // Les entrees `spacing` (et `audio_event`) ne sont pas des mots :
    // elles n'ont rien a faire dans la bande rythmo.
    if (entry.type && entry.type !== 'word') continue;

    const text = (entry.text ?? entry.word ?? '').trim();
    if (!text) continue;

    const start = entry.start ?? entry.start_time;
    const end = entry.end ?? entry.end_time;
    if (typeof start !== 'number' || typeof end !== 'number') continue;

    words.push({
      text,
      // Les temps arrivent en secondes flottantes.
      startMs: Math.round(start * 1000),
      endMs: Math.round(end * 1000),
      speaker: entry.speaker_id ?? entry.speaker ?? 'speaker_0',
    });
  }

  if (words.length === 0) {
    throw new UserError(
      'Aucune parole détectée dans cette scène. Vérifie que la piste audio contient bien des dialogues.',
    );
  }

  return words.sort((a, b) => a.startMs - b.startMs);
}

/**
 * Transcription et diarisation.
 *
 * On ne contraint pas `num_speakers` : mieux vaut que la diarisation
 * eclate un personnage en deux que l'inverse. Fusionner deux locuteurs
 * dans l'ecran de preparation est un clic ; scinder un locuteur mal
 * fusionne est penible (PRD §6.4).
 */
export async function transcribe(
  audioPath: string,
  workDir: string,
  logger: ScopedLog,
  languageCode = 'fra',
): Promise<Word[]> {
  const buffer = await fs.readFile(audioPath);

  const form = new FormData();
  form.append(
    'file',
    new Blob([new Uint8Array(buffer)], { type: 'audio/wav' }),
    path.basename(audioPath),
  );
  form.append('model_id', 'scribe_v1');
  form.append('diarize', 'true');
  form.append('timestamps_granularity', 'word');
  form.append('tag_audio_events', 'false');
  if (languageCode) form.append('language_code', languageCode);

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
    throw new SystemError('Appel Scribe impossible', { cause: error });
  } finally {
    clearTimeout(timer);
  }

  const text = await response.text();

  // Trace brute systematique : c'est elle qui permet de corriger
  // l'adaptateur si l'API a bouge, sans deviner.
  const rawPath = path.join(workDir, 'scribe-raw.json');
  await fs.writeFile(rawPath, text, 'utf8').catch(() => undefined);

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new UserError('La clé ElevenLabs est refusée. Vérifie worker/.env.');
    }
    if (response.status === 429) {
      throw new SystemError('Quota ElevenLabs atteint, nouvelle tentative plus tard.');
    }
    throw new SystemError(`Scribe a répondu ${response.status} : ${text.slice(0, 500)}`);
  }

  logger.info('transcription reçue', { bytes: text.length, raw: rawPath });
  return parseScribeResponse(JSON.parse(text));
}
