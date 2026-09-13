import fs from 'node:fs/promises';
import path from 'node:path';

import {
  BUCKET_SOURCES,
  CLIP_MARGIN_MS,
  CLIP_MAX_MS,
  CLIP_MERGE_GAP_MS,
  LINE_SPLIT_SILENCE_MS,
  characterColorToken,
} from '../../../config/constants.ts';
import {
  groupWordsIntoLines,
  spansFromEnvelope,
  speakersInOrder,
} from '../../../lib/segmentation.ts';
import { config } from '../config.ts';
import { computeEnvelope } from '../lib/envelope.ts';
import { SystemError, UserError } from '../errors.ts';
import { db, getSession, setJobStep, updateSession, type Job } from '../lib/db.ts';
import {
  downmixForStt,
  encodeBackingPreview,
  encodeStemLossless,
  extractAudio,
  normalize,
  probe,
} from '../lib/ffmpeg.ts';
import * as storage from '../lib/storage.ts';
import { transcribe } from '../lib/scribe.ts';
import { separate } from '../separation/index.ts';
import * as ytdlp from '../lib/ytdlp.ts';
import type { ScopedLog } from '../log.ts';

/**
 * Pipeline d'ingestion (PRD §6).
 *
 * Six etapes atomiques, chacune avec un statut visible cote client. Le
 * decoupage en etapes n'est pas cosmetique : sans retour visuel detaille,
 * cinq minutes de traitement passent pour un plantage.
 */
export async function runIngest(job: Job, workDir: string, logger: ScopedLog) {
  const session = await getSession(job.session_id);
  const progress = (step: string) => (pct: number) =>
    void setJobStep(job.id, step, pct).catch(() => undefined);

  // ── 1. Acquisition ──────────────────────────────────────────────────
  await setJobStep(job.id, 'download', 0);
  let sourcePath: string;

  if (session.source_type === 'youtube') {
    if (!session.source_ref) throw new UserError('Aucun lien YouTube fourni.');
    await ytdlp.inspect(session.source_ref);
    sourcePath = await ytdlp.download(
      session.source_ref,
      workDir,
      progress('download'),
    );
  } else {
    if (!session.upload_path) {
      throw new UserError('Aucun fichier source n’a été reçu.');
    }
    sourcePath = path.join(workDir, path.basename(session.upload_path));
    await storage.download(BUCKET_SOURCES, session.upload_path, sourcePath);
    progress('download')(100);
  }
  logger.info('source acquise', { step: 'download', file: sourcePath });

  // Garde-fous avant tout traitement lourd.
  const info = await probe(sourcePath);
  if (info.audioStreamCount > 1) {
    logger.warn('plusieurs pistes audio : la première sera doublée', {
      step: 'download',
      tracks: info.audioStreamCount,
    });
  }

  // ── 2. Normalisation ────────────────────────────────────────────────
  await setJobStep(job.id, 'encode', 0);
  const workMp4 = path.join(workDir, 'work.mp4');
  await normalize(sourcePath, workMp4, info.durationMs, progress('encode'));

  const videoPath = `${session.id}/work.mp4`;
  await storage.upload(BUCKET_SOURCES, videoPath, workMp4, 'video/mp4');
  await updateSession(session.id, {
    video_path: videoPath,
    duration_ms: info.durationMs,
  });
  logger.info('vidéo normalisée', { step: 'encode', durationMs: info.durationMs });

  // ── 3. Extraction audio ─────────────────────────────────────────────
  await setJobStep(job.id, 'extract', 0);
  const audioWav = path.join(workDir, 'audio.wav');
  await extractAudio(workMp4, audioWav);
  await setJobStep(job.id, 'extract', 100);

  // ── 4. Separation ───────────────────────────────────────────────────
  await setJobStep(job.id, 'separate', 0);
  const sepDir = path.join(workDir, 'sep');
  const { voicePath, musicPath } = await separate(
    audioWav,
    sepDir,
    progress('separate'),
    logger,
  );

  // Les stems partent compresses : un WAV de scene longue depasse la
  // taille qu'accepte le stockage. Voir `encodeStemLossless`.
  const voiceFlac = path.join(sepDir, 'voice.flac');
  const musicFlac = path.join(sepDir, 'music.flac');
  await encodeStemLossless(voicePath, voiceFlac);
  await encodeStemLossless(musicPath, musicFlac);

  const voiceRemote = `${session.id}/voice.flac`;
  const musicRemote = `${session.id}/music.flac`;
  await storage.upload(BUCKET_SOURCES, voiceRemote, voiceFlac, 'audio/flac');
  await storage.upload(BUCKET_SOURCES, musicRemote, musicFlac, 'audio/flac');

  // Le studio consomme la preview, jamais le WAV.
  const previewLocal = path.join(sepDir, 'music-preview.m4a');
  const previewRemote = `${session.id}/music-preview.m4a`;
  await encodeBackingPreview(musicPath, previewLocal);
  await storage.upload(BUCKET_SOURCES, previewRemote, previewLocal, 'audio/mp4');

  // Enveloppe de la voix d'origine : elle dit au joueur quand l'acteur
  // parle, sans lui faire telecharger le stem (PRD §13.3).
  const envelope = await computeEnvelope(voicePath, workDir);

  await updateSession(session.id, {
    stem_voice_path: voiceRemote,
    stem_music_path: musicRemote,
    stem_music_preview_path: previewRemote,
    voice_peaks: envelope.peaks,
    voice_peaks_hz: envelope.hz,
  });
  logger.info('stems produits', { step: 'separate' });

  // ── Scene issue d'une recette ───────────────────────────────────────
  //
  // Les personnages et les repliques ont deja ete copies depuis le pack
  // au moment de la creation de la session. On ne rappelle donc pas
  // Scribe : c'est la partie payante, et surtout c'est le texte que
  // l'hote d'origine avait corrige a la main. Le refaire le perdrait.
  if (session.from_pack_id) {
    await setJobStep(job.id, 'transcribe', 100);
    await setJobStep(job.id, 'segment', 0);

    const { data: clipCount, error: clipError } = await db.rpc('recompute_clips', {
      p_session_id: session.id,
      p_gap_ms: CLIP_MERGE_GAP_MS,
      p_margin_ms: CLIP_MARGIN_MS,
      p_max_ms: CLIP_MAX_MS,
    });
    if (clipError) {
      throw new SystemError(`Découpage en clips impossible : ${clipError.message}`);
    }
    await setJobStep(job.id, 'segment', 100);

    // La preparation a deja ete faite une fois : on va droit au lobby.
    await updateSession(session.id, { status: 'lobby' });
    logger.info('scène reconstituée depuis une recette', {
      step: 'segment',
      packId: session.from_pack_id,
      clips: Number(clipCount ?? 0),
    });
    return;
  }

  // ── Mode chanson ────────────────────────────────────────────────────
  //
  // On ne transcrit pas une reprise : la reconnaissance rend des
  // syllabes etirees pour un cout par minute sans contrepartie, et celui
  // qui reprend une chanson en connait les paroles. Ce qu'il faut
  // savoir, c'est quand entrer — et l'enveloppe qu'on vient de calculer
  // le dit deja. Une seule voix est creee ; l'hote la scindera sur
  // l'ecran de preparation s'ils sont deux a chanter.
  if (session.is_song) {
    await setJobStep(job.id, 'transcribe', 100);
    await setJobStep(job.id, 'segment', 0);

    const spans = spansFromEnvelope(
      new Uint8Array(Buffer.from(envelope.peaks, 'base64')),
      envelope.hz,
    );

    await db.from('characters').delete().eq('session_id', session.id);
    const { data: voix, error: voixError } = await db
      .from('characters')
      .insert({
        session_id: session.id,
        speaker_key: 'song_0',
        name: 'Voix',
        color: characterColorToken(0),
        sort_order: 0,
      })
      .select('id')
      .single();
    if (voixError || !voix) {
      throw new SystemError(`Création de la voix impossible : ${voixError?.message}`);
    }

    if (spans.length > 0) {
      const { error: lineError } = await db.from('lines').insert(
        spans.map((span) => ({
          session_id: session.id,
          character_id: voix.id as string,
          start_ms: span.startMs,
          end_ms: span.endMs,
          text: '',
          words: [],
        })),
      );
      if (lineError) {
        throw new SystemError(
          `Insertion des entrées impossible : ${lineError.message}`,
        );
      }
    }

    const { error: songClipError } = await db.rpc('recompute_clips', {
      p_session_id: session.id,
      p_gap_ms: CLIP_MERGE_GAP_MS,
      p_margin_ms: CLIP_MARGIN_MS,
      p_max_ms: CLIP_MAX_MS,
    });
    if (songClipError) {
      throw new SystemError(`Découpage en clips impossible : ${songClipError.message}`);
    }

    await setJobStep(job.id, 'segment', 100);
    await updateSession(session.id, { status: 'prepping' });
    logger.info('reprise découpée à l’enveloppe', {
      step: 'segment',
      entrees: spans.length,
    });

    if (session.upload_path) {
      await db.storage.from(BUCKET_SOURCES).remove([session.upload_path]);
      await updateSession(session.id, { upload_path: null });
    }
    await fs.rm(path.join(workDir, 'voice-raw'), { force: true });
    return;
  }

  // ── 5. Transcription et diarisation ─────────────────────────────────
  await setJobStep(job.id, 'transcribe', 10);
  // Scribe tourne sur le stem voix, pas sur l'audio complet : le taux de
  // reconnaissance y est nettement meilleur (PRD §6.4).
  const sttWav = path.join(workDir, 'audio_16k.wav');
  await downmixForStt(voicePath, sttWav);
  const words = await transcribe(sttWav, workDir, logger);
  await setJobStep(job.id, 'transcribe', 90);

  // ── 6. Decoupage ────────────────────────────────────────────────────
  await setJobStep(job.id, 'segment', 0);
  const draftLines = groupWordsIntoLines(words, LINE_SPLIT_SILENCE_MS);
  const speakers = speakersInOrder(draftLines);

  /*
   * Reprise apres crash : on repart d'une table propre plutot que de
   * dupliquer personnages et repliques (PRD §18, jobs idempotents).
   *
   * Les noms deja donnes sont releves avant d'effacer, et rendus a qui
   * de droit par leur `speaker_key`. Sans cela, une scene reprise depuis
   * une recette de la communaute perdait « Donnie » et « Léo » pour
   * « Personnage 1 » et « Personnage 2 » : tout le travail de
   * l'hote d'origine, efface par une reprise technique.
   */
  const { data: anciens } = await db
    .from('characters')
    .select('speaker_key, name')
    .eq('session_id', session.id);
  const nomConnu = new Map(
    (anciens ?? [])
      .filter((row) => typeof row.name === 'string' && row.name.trim() !== '')
      .map((row) => [row.speaker_key as string, row.name as string]),
  );

  await db.from('characters').delete().eq('session_id', session.id);

  const { data: inserted, error: charError } = await db
    .from('characters')
    .insert(
      speakers.map((speaker, index) => ({
        session_id: session.id,
        speaker_key: speaker,
        name: nomConnu.get(speaker) ?? `Personnage ${index + 1}`,
        color: characterColorToken(index),
        sort_order: index,
      })),
    )
    .select('id, speaker_key');
  if (charError) {
    throw new SystemError(
      `Insertion des personnages impossible : ${charError.message}`,
    );
  }

  const characterBySpeaker = new Map(
    (inserted ?? []).map((row) => [row.speaker_key as string, row.id as string]),
  );

  const { error: lineError } = await db.from('lines').insert(
    draftLines.map((line) => ({
      session_id: session.id,
      character_id: characterBySpeaker.get(line.speaker)!,
      start_ms: line.startMs,
      end_ms: line.endMs,
      text: line.text,
      words: line.words,
    })),
  );
  if (lineError) {
    throw new SystemError(`Insertion des répliques impossible : ${lineError.message}`);
  }

  // Le decoupage en clips vit en SQL : une seule implementation, rejouee
  // a l'identique apres chaque correction de l'hote (PRD §9.4).
  const { data: clipCount, error: clipError } = await db.rpc('recompute_clips', {
    p_session_id: session.id,
    p_gap_ms: CLIP_MERGE_GAP_MS,
    p_margin_ms: CLIP_MARGIN_MS,
    p_max_ms: CLIP_MAX_MS,
  });
  if (clipError) {
    throw new SystemError(`Découpage en clips impossible : ${clipError.message}`);
  }

  await setJobStep(job.id, 'segment', 100);
  logger.info('découpage terminé', {
    step: 'segment',
    characters: speakers.length,
    lines: draftLines.length,
    clips: Number(clipCount ?? 0),
  });

  // Le fichier brut d'upload a fait son office : il ne sert plus a rien.
  if (session.upload_path) {
    await db.storage.from(BUCKET_SOURCES).remove([session.upload_path]);
    await updateSession(session.id, { upload_path: null });
  }

  await updateSession(session.id, { status: 'prepping' });
  await fs.rm(path.join(workDir, 'voice-raw'), { force: true });
}
