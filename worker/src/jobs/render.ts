import fs from 'node:fs/promises';
import path from 'node:path';

import {
  BUCKET_RENDERS,
  BUCKET_SOURCES,
  BUCKET_TAKES,
} from '../../../config/constants.ts';
import { SystemError, UserError } from '../errors.ts';
import { db, getSession, setJobStep, updateSession, type Job } from '../lib/db.ts';
import { graphPathFor, mixWithGraph, muxFinal } from '../lib/ffmpeg.ts';
import { buildMixGraph, placeTake, type VoSegment } from '../lib/mixgraph.ts';
import * as storage from '../lib/storage.ts';
import type { ScopedLog } from '../log.ts';

interface ClipRow {
  id: string;
  character_id: string;
  window_start_ms: number;
}

interface CharacterRow {
  id: string;
  is_released: boolean;
}

interface LineRow {
  character_id: string;
  start_ms: number;
  end_ms: number;
  is_deleted: boolean;
}

interface TakeRow {
  id: string;
  clip_id: string;
  participant_id: string;
  audio_path: string;
  offset_ms: number;
}

/**
 * Moteur de rendu (PRD §12).
 *
 * Cinq etapes : recuperation, mixage, mux, envoi, purge. La purge n'a
 * lieu qu'apres verification que le rendu est bien arrive — purger avant,
 * c'est perdre la session (PRD §13.1).
 */
export async function runRender(job: Job, workDir: string, logger: ScopedLog) {
  const session = await getSession(job.session_id);

  if (!session.video_path || !session.stem_music_path || !session.stem_voice_path) {
    throw new UserError(
      'Les fichiers de cette scène ont été purgés : le rendu n’est plus possible.',
    );
  }

  // ── 1. Recuperation ─────────────────────────────────────────────────
  await setJobStep(job.id, 'fetch', 0);

  const [characters, clips, lines, takes, participants] = await Promise.all([
    db.from('characters').select('id, is_released').eq('session_id', session.id),
    db
      .from('clips')
      .select('id, character_id, window_start_ms')
      .eq('session_id', session.id),
    db
      .from('lines')
      .select('character_id, start_ms, end_ms, is_deleted')
      .eq('session_id', session.id),
    db
      .from('takes')
      .select('id, clip_id, participant_id, audio_path, offset_ms')
      .eq('is_selected', true),
    db
      .from('participants')
      .select('id, mic_offset_ms, is_kicked')
      .eq('session_id', session.id),
  ]);

  const dbError =
    characters.error ?? clips.error ?? lines.error ?? takes.error ?? participants.error;
  if (dbError) throw new SystemError(`Lecture de la scène impossible : ${dbError.message}`);

  const characterRows = (characters.data ?? []) as CharacterRow[];
  const clipRows = (clips.data ?? []) as ClipRow[];
  const lineRows = (lines.data ?? []) as LineRow[];
  const clipIds = new Set(clipRows.map((c) => c.id));
  const takeRows = ((takes.data ?? []) as TakeRow[]).filter((t) => clipIds.has(t.clip_id));

  const micOffsetOf = new Map(
    (participants.data ?? []).map((p) => [
      p.id as string,
      { offset: p.mic_offset_ms as number, kicked: p.is_kicked as boolean },
    ]),
  );
  const releasedCharacters = new Set(
    characterRows.filter((c) => c.is_released).map((c) => c.id),
  );

  // Telechargement des trois fichiers de session, puis des prises.
  const musicLocal = path.join(workDir, 'music.wav');
  const voiceLocal = path.join(workDir, 'voice.wav');
  const videoLocal = path.join(workDir, 'work.mp4');

  await storage.download(BUCKET_SOURCES, session.stem_music_path, musicLocal);
  await storage.download(BUCKET_SOURCES, session.stem_voice_path, voiceLocal);
  await storage.download(BUCKET_SOURCES, session.video_path, videoLocal);
  await setJobStep(job.id, 'fetch', 30);

  const takesDir = path.join(workDir, 'takes');
  await fs.mkdir(takesDir, { recursive: true });

  const usableTakes: { take: TakeRow; local: string; clip: ClipRow }[] = [];
  let fetched = 0;

  for (const take of takeRows) {
    const clip = clipRows.find((c) => c.id === take.clip_id);
    if (!clip) continue;

    // Un joueur exclu voit ses personnages repasser en VO : ses prises
    // sont ignorees, meme si elles existent encore (PRD §11.8).
    const participant = micOffsetOf.get(take.participant_id);
    if (!participant || participant.kicked) continue;
    if (releasedCharacters.has(clip.character_id)) continue;

    const local = path.join(takesDir, `${take.id}.webm`);
    await storage.download(BUCKET_TAKES, take.audio_path, local);
    usableTakes.push({ take, local, clip });

    fetched += 1;
    await setJobStep(
      job.id,
      'fetch',
      30 + Math.round((fetched / Math.max(1, takeRows.length)) * 65),
    );
  }
  logger.info('éléments récupérés', { step: 'fetch', takes: usableTakes.length });

  // ── 2. Mixage ───────────────────────────────────────────────────────
  await setJobStep(job.id, 'mix', 0);

  // VO a conserver : les repliques des personnages liberes, plus toutes
  // les repliques que l'hote a supprimees — dans les deux cas, la voix
  // d'origine doit rester audible a cet endroit (PRD §9.2, §12.3).
  const voSegments: VoSegment[] = lineRows
    .filter((line) => line.is_deleted || releasedCharacters.has(line.character_id))
    .map((line) => ({ startMs: line.start_ms, endMs: line.end_ms }))
    .sort((a, b) => a.startMs - b.startMs);

  const inputs = [musicLocal];
  const voiceInput = voSegments.length > 0 ? inputs.push(voiceLocal) - 1 : null;

  const placements = usableTakes.map(({ take, local, clip }) => {
    const index = inputs.push(local) - 1;
    return placeTake(
      clip.window_start_ms,
      take.offset_ms,
      micOffsetOf.get(take.participant_id)?.offset ?? 0,
      index,
    );
  });

  const graph = buildMixGraph({
    musicInput: 0,
    voiceInput,
    voSegments,
    takes: placements,
  });

  const mixPath = path.join(workDir, 'mix.wav');
  const durationMs = session.duration_ms ?? 0;
  await mixWithGraph(
    inputs,
    graph,
    graphPathFor(workDir),
    mixPath,
    durationMs,
    (pct) => void setJobStep(job.id, 'mix', pct).catch(() => undefined),
  );
  logger.info('mixage terminé', {
    step: 'mix',
    inputs: inputs.length,
    voSegments: voSegments.length,
  });

  // ── 3. Mux final ────────────────────────────────────────────────────
  // La video est copiee sans reencodage, et aucun sous-titre n'est
  // incruste : le MP4 ne contient que l'image d'origine et l'audio
  // remixe (PRD §12.4, §12.5).
  await setJobStep(job.id, 'mux', 0);
  const finalPath = path.join(workDir, 'final.mp4');
  await muxFinal(videoLocal, mixPath, finalPath, durationMs, (pct) =>
    void setJobStep(job.id, 'mux', pct).catch(() => undefined),
  );

  // ── 4. Envoi ────────────────────────────────────────────────────────
  await setJobStep(job.id, 'upload', 0);
  const renderPath = `${session.id}/final.mp4`;
  await storage.upload(BUCKET_RENDERS, renderPath, finalPath, 'video/mp4');

  const size = await storage.verifyUploaded(BUCKET_RENDERS, renderPath);
  await updateSession(session.id, {
    render_path: renderPath,
    render_size_bytes: size,
  });
  await setJobStep(job.id, 'upload', 100);
  logger.info('rendu envoyé', { step: 'upload', bytes: size });

  // ── 5. Purge (PRD §13.1) ────────────────────────────────────────────
  // Seulement maintenant : l'upload est confirme, taille non nulle.
  await setJobStep(job.id, 'purge', 0);
  const removedSources = await storage.removeSessionFolder(BUCKET_SOURCES, session.id);
  const removedTakes = await storage.removeSessionFolder(BUCKET_TAKES, session.id);

  await updateSession(session.id, {
    video_path: null,
    stem_voice_path: null,
    stem_music_path: null,
    stem_music_preview_path: null,
    upload_path: null,
    purged_at: new Date().toISOString(),
    status: 'done',
  });
  await setJobStep(job.id, 'purge', 100);

  logger.info('source purgée', {
    step: 'purge',
    sources: removedSources,
    takes: removedTakes,
  });
}
