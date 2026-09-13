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
import { db, getSession, setJobStep, updateSession, type Job, type Session } from '../lib/db.ts';
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
export async function runIngest(
  job: Job,
  workDir: string,
  logger: ScopedLog,
): Promise<'relais' | void> {
  const session = await getSession(job.session_id);
  const progress = (step: string) => (pct: number) =>
    void setJobStep(job.id, step, pct).catch(() => undefined);
  const workMp4 = path.join(workDir, 'work.mp4');

  /*
   * Une preparation YouTube deja telechargee repart du stockage.
   *
   * La video normalisee est mise en ligne des la fin du telechargement :
   * si la preparation echoue ensuite et se relance, on ne retelecharge
   * pas. Reserve aux liens : un fichier importe peut etre remplace entre
   * deux essais, et la video d'un essai precedent ne serait plus la sienne.
   */
  const reprise =
    session.source_type === 'youtube' && !!session.video_path && !!session.duration_ms;

  /*
   * La video et le son avancent en meme temps.
   *
   * La normalisation de l'image (CPU) et la separation des voix (GPU) ne
   * dependent pas l'une de l'autre : les enchainer faisait attendre la
   * separation une trentaine de secondes pour rien. Le son est donc tire
   * directement de la source, sur la meme piste que la video normalisee,
   * et l'encodage tourne pendant ce temps.
   */
  let encodage: Promise<void> = Promise.resolve();
  let sourceAudio = workMp4;

  if (reprise) {
    await setJobStep(job.id, 'download', 0);
    await storage.download(BUCKET_SOURCES, session.video_path!, workMp4);
    await setJobStep(job.id, 'encode', 100);
    logger.info('vidéo reprise du stockage', { step: 'encode' });
  } else {
    // ── 1. Acquisition ────────────────────────────────────────────────
    await setJobStep(job.id, 'download', 0);
    let sourcePath: string;

    if (session.source_type === 'youtube') {
      if (!session.source_ref) throw new UserError('Aucun lien YouTube fourni.');
      if (config.role === 'cloud') {
        // La base ne devrait jamais le confier ici : c'est un filet.
        throw new SystemError('Téléchargement YouTube confié au worker Google.');
      }
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

    // ── 2. Normalisation, en arriere-plan ─────────────────────────────
    // Sa progression n'est pas remontee : l'etape affichee est celle de
    // la separation, qui avance en meme temps.
    await setJobStep(job.id, 'encode', 0);
    encodage = (async () => {
      await normalize(sourcePath, workMp4, info.durationMs, () => undefined);

      const videoPath = `${session.id}/work.mp4`;
      await storage.upload(BUCKET_SOURCES, videoPath, workMp4, 'video/mp4');
      await updateSession(session.id, {
        video_path: videoPath,
        duration_ms: info.durationMs,
      });
      logger.info('vidéo normalisée', { step: 'encode', durationMs: info.durationMs });
    })();
    // Attendue plus bas ; ici on evite seulement qu'un echec precoce soit
    // signale comme une promesse rejetee sans gestionnaire.
    encodage.catch(() => undefined);
    sourceAudio = sourcePath;
    // Plus de relais vers Google apres le telechargement : une scene
    // YouTube reste sur ce PC de bout en bout (migration
    // 20260926090000_youtube_worker_local).
  }

  // ── Le son d'un pack, deja separe ───────────────────────────────────
  //
  // Un pack garde desormais les deux pistes de sa scene d'origine. Les
  // recopier dans la scene evite toute la separation : il ne reste que
  // l'image du joueur a normaliser, qui tourne deja en arriere-plan.
  if (session.from_pack_id) {
    const sons = await sonsDuPack(session.from_pack_id);
    if (sons) {
      await setJobStep(job.id, 'extract', 100);
      await setJobStep(job.id, 'separate', 0);
      await reprendreSonsDuPack(sons, session.id, workDir);
      await setJobStep(job.id, 'separate', 100);
      logger.info('sons repris du pack', { step: 'separate', packId: session.from_pack_id });

      await encodage;
      await terminerDepuisPack(job, session, logger);
      return;
    }
  }

  // ── 3. Extraction audio ─────────────────────────────────────────────
  await setJobStep(job.id, 'extract', 0);
  const audioWav = path.join(workDir, 'audio.wav');
  await extractAudio(sourceAudio, audioWav, true);
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

  // La video doit etre en ligne avant que la scene n'avance.
  await encodage;

  // ── Scene issue d'une recette ───────────────────────────────────────
  //
  // Les personnages et les repliques ont deja ete copies depuis le pack
  // au moment de la creation de la session. On ne rappelle donc pas
  // Scribe : c'est la partie payante, et surtout c'est le texte que
  // l'hote d'origine avait corrige a la main. Le refaire le perdrait.
  if (session.from_pack_id) {
    // Le pack n'avait pas encore ses pistes : celles qu'on vient de
    // separer serviront au prochain groupe. Un echec n'arrete rien.
    try {
      await garderSonsDansPack(session.from_pack_id, session.id, envelope);
    } catch (error) {
      logger.warn('pistes non gardées dans le pack', {
        step: 'separate',
        detail: error instanceof Error ? error.message : String(error),
      });
    }
    await terminerDepuisPack(job, session, logger);
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
  // La langue choisie a la creation ; le francais pour les scenes d'avant.
  // Scribe accepte le code a deux lettres aussi bien qu'a trois.
  const words = await transcribe(sttWav, workDir, logger, session.source_lang ?? 'fra');
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

// ── Scenes issues d'un pack ───────────────────────────────────────────

interface SonsDuPack {
  stem_voice_path: string;
  stem_music_path: string;
  stem_music_preview_path: string | null;
  voice_peaks: string | null;
  voice_peaks_hz: number | null;
}

/** Les pistes gardees par un pack, s'il en a. */
async function sonsDuPack(packId: string): Promise<SonsDuPack | null> {
  const { data, error } = await db
    .from('packs')
    .select('stem_voice_path, stem_music_path, stem_music_preview_path, voice_peaks, voice_peaks_hz')
    .eq('id', packId)
    .maybeSingle();
  if (error || !data?.stem_voice_path || !data?.stem_music_path) return null;
  return data as SonsDuPack;
}

/**
 * Recopie les pistes du pack dans le dossier de la scene.
 *
 * Copiees et non pointees : la scene vit et se purge a son rythme, le pack
 * au sien. L'apercu du fond sonore et l'enveloppe de la voix sont refaits
 * s'ils manquent au pack.
 */
async function reprendreSonsDuPack(sons: SonsDuPack, sessionId: string, workDir: string) {
  const voix = `${sessionId}/voice.flac`;
  const musique = `${sessionId}/music.flac`;
  const apercu = `${sessionId}/music-preview.m4a`;

  await storage.copy(BUCKET_SOURCES, sons.stem_voice_path, voix);
  await storage.copy(BUCKET_SOURCES, sons.stem_music_path, musique);

  if (sons.stem_music_preview_path) {
    await storage.copy(BUCKET_SOURCES, sons.stem_music_preview_path, apercu);
  } else {
    const musiqueLocale = path.join(workDir, 'music.flac');
    const apercuLocal = path.join(workDir, 'music-preview.m4a');
    await storage.download(BUCKET_SOURCES, sons.stem_music_path, musiqueLocale);
    await encodeBackingPreview(musiqueLocale, apercuLocal);
    await storage.upload(BUCKET_SOURCES, apercu, apercuLocal, 'audio/mp4');
  }

  let peaks = sons.voice_peaks;
  let hz = sons.voice_peaks_hz;
  if (!peaks) {
    const voixLocale = path.join(workDir, 'voice.flac');
    await storage.download(BUCKET_SOURCES, sons.stem_voice_path, voixLocale);
    const enveloppe = await computeEnvelope(voixLocale, workDir);
    peaks = enveloppe.peaks;
    hz = enveloppe.hz;
  }

  await updateSession(sessionId, {
    stem_voice_path: voix,
    stem_music_path: musique,
    stem_music_preview_path: apercu,
    voice_peaks: peaks,
    voice_peaks_hz: hz,
  });
}

/**
 * Garde dans le pack les pistes qu'on vient de separer pour lui.
 *
 * Les packs publies avant qu'on garde le son n'en ont pas : le premier
 * groupe qui en rejoue un paie la separation, les suivants non.
 */
async function garderSonsDansPack(
  packId: string,
  sessionId: string,
  envelope: { peaks: string; hz: number },
) {
  const { data } = await db
    .from('packs')
    .select('stem_music_path, voice_peaks')
    .eq('id', packId)
    .maybeSingle();
  if (!data || data.stem_music_path) return;

  const base = `packs/${packId}`;
  await storage.copy(BUCKET_SOURCES, `${sessionId}/voice.flac`, `${base}/voice.flac`);
  await storage.copy(BUCKET_SOURCES, `${sessionId}/music.flac`, `${base}/music.flac`);
  await storage.copy(BUCKET_SOURCES, `${sessionId}/music-preview.m4a`, `${base}/music-preview.m4a`);

  const { error } = await db
    .from('packs')
    .update({
      stem_voice_path: `${base}/voice.flac`,
      stem_music_path: `${base}/music.flac`,
      stem_music_preview_path: `${base}/music-preview.m4a`,
      ...(data.voice_peaks ? {} : { voice_peaks: envelope.peaks, voice_peaks_hz: envelope.hz }),
    })
    .eq('id', packId);
  if (error) throw new SystemError(`Pistes du pack non enregistrées : ${error.message}`);
}

/** La preparation d'un pack a deja ete faite : decoupage, puis droit au lobby. */
async function terminerDepuisPack(job: Job, session: Session, logger: ScopedLog) {
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

  // Une scene de pack arrive par un fichier importe : ce fichier a fait
  // son office, comme pour n'importe quel import.
  if (session.upload_path) {
    await db.storage.from(BUCKET_SOURCES).remove([session.upload_path]);
    await updateSession(session.id, { upload_path: null });
  }

  await updateSession(session.id, { status: 'lobby' });
  logger.info('scène reconstituée depuis une recette', {
    step: 'segment',
    packId: session.from_pack_id,
    clips: Number(clipCount ?? 0),
  });
}
