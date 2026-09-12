import fs from 'node:fs/promises';
import path from 'node:path';

import { BUCKET_SOURCES } from '../../../config/constants.ts';
import { SystemError } from '../errors.ts';
import { db, type Session } from '../lib/db.ts';
import { encodeStemForPack } from '../lib/ffmpeg.ts';
import * as storage from '../lib/storage.ts';
import type { ScopedLog } from '../log.ts';

/**
 * Fabrique une scene preparee reutilisable (PRD §16.2).
 *
 * Le moment est choisi : on le fait pendant le job de rendu, juste avant
 * la purge, parce que tous les fichiers sont deja sur le disque local. Un
 * job separe les re-telechargerait pour rien.
 *
 * Les fichiers sont deposes sous `packs/{id}/`, hors du dossier de la
 * session. La purge de fin de rendu ne balaie que `{session_id}/` : le
 * pack lui echappe par construction, sans exception a maintenir.
 *
 * Les prises des joueurs ne sont jamais copiees. Un pack contient la
 * scene et sa preparation, pas ce que quelqu'un a enregistre.
 */
export async function buildPack(
  session: Session,
  local: { video: string; voice: string; music: string },
  workDir: string,
  logger: ScopedLog,
): Promise<void> {
  const [characters, lines] = await Promise.all([
    db
      .from('characters')
      .select('id, speaker_key, name, color, sort_order')
      .eq('session_id', session.id)
      .order('sort_order'),
    db
      .from('lines')
      .select('character_id, start_ms, end_ms, text, words, is_deleted')
      .eq('session_id', session.id)
      .order('start_ms'),
  ]);

  if (characters.error || lines.error) {
    throw new SystemError(
      `Lecture de la preparation impossible : ${(characters.error ?? lines.error)?.message}`,
    );
  }
  if ((characters.data ?? []).length === 0) {
    logger.warn('pack ignoré : aucun personnage', { step: 'purge' });
    return;
  }

  // Une scene venue d'un lien devient une RECETTE : on garde le lien et
  // la preparation, pas une copie de l'oeuvre. Le pack tombe de 13 Mo a
  // quelques kilo-octets, et le telechargement sera refait a la demande.
  // Une scene venue d'un fichier importe n'a pas de lien : il faut alors
  // conserver les medias, sans quoi elle serait irrecuperable.
  const asRecipe = session.source_type === 'youtube' && !!session.source_ref;

  const { data: pack, error: packError } = await db
    .from('packs')
    .insert({
      created_by: session.host_id,
      title: session.title ?? 'Scène sans titre',
      duration_ms: session.duration_ms ?? 0,
      kind: asRecipe ? 'url' : 'media',
      source_url: asRecipe ? session.source_ref : null,
      source_session_id: session.id,
      // Renseignes juste apres l'envoi pour un pack media : on a besoin
      // de l'identifiant pour construire les chemins.
      video_path: asRecipe ? null : 'pending',
      stem_voice_path: asRecipe ? null : 'pending',
      stem_music_path: asRecipe ? null : 'pending',
      voice_peaks: session.voice_peaks,
      voice_peaks_hz: session.voice_peaks_hz,
      character_count: (characters.data ?? []).length,
      line_count: (lines.data ?? []).filter((l) => !l.is_deleted).length,
    })
    .select('id')
    .single();

  if (packError || !pack) {
    throw new SystemError(`Creation du pack impossible : ${packError?.message}`);
  }

  const packId = pack.id as string;

  let totalBytes = 0;

  if (!asRecipe) {
    const prefix = `packs/${packId}`;

    // Stems compresses : voir encodeStemForPack pour le calcul de poids.
    const voiceOut = path.join(workDir, 'pack-voice.m4a');
    const musicOut = path.join(workDir, 'pack-music.m4a');
    await encodeStemForPack(local.voice, voiceOut);
    await encodeStemForPack(local.music, musicOut);

    const videoPath = `${prefix}/work.mp4`;
    const voicePath = `${prefix}/voice.m4a`;
    const musicPath = `${prefix}/music.m4a`;

    await storage.upload(BUCKET_SOURCES, videoPath, local.video, 'video/mp4');
    await storage.upload(BUCKET_SOURCES, voicePath, voiceOut, 'audio/mp4');
    await storage.upload(BUCKET_SOURCES, musicPath, musicOut, 'audio/mp4');

    const sizes = await Promise.all([
      storage.verifyUploaded(BUCKET_SOURCES, videoPath),
      storage.verifyUploaded(BUCKET_SOURCES, voicePath),
      storage.verifyUploaded(BUCKET_SOURCES, musicPath),
    ]);
    totalBytes = sizes.reduce((sum, n) => sum + n, 0);

    await db
      .from('packs')
      .update({
        video_path: videoPath,
        stem_voice_path: voicePath,
        stem_music_path: musicPath,
        size_bytes: totalBytes,
      })
      .eq('id', packId);

    await fs.rm(voiceOut, { force: true });
    await fs.rm(musicOut, { force: true });
  }

  // Personnages, puis repliques rattachees par leur cle de locuteur.
  const { data: packChars, error: charError } = await db
    .from('pack_characters')
    .insert(
      (characters.data ?? []).map((c) => ({
        pack_id: packId,
        speaker_key: c.speaker_key,
        name: c.name,
        color: c.color,
        sort_order: c.sort_order,
      })),
    )
    .select('id, speaker_key');
  if (charError) {
    throw new SystemError(`Copie des personnages impossible : ${charError.message}`);
  }

  const bySourceId = new Map(
    (characters.data ?? []).map((c) => [c.id as string, c.speaker_key as string]),
  );
  const byKey = new Map(
    (packChars ?? []).map((c) => [c.speaker_key as string, c.id as string]),
  );

  const rows = (lines.data ?? [])
    .map((l) => {
      const key = bySourceId.get(l.character_id as string);
      const target = key ? byKey.get(key) : undefined;
      return target
        ? {
            pack_id: packId,
            pack_character_id: target,
            start_ms: l.start_ms,
            end_ms: l.end_ms,
            text: l.text,
            words: l.words,
            is_deleted: l.is_deleted,
          }
        : null;
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (rows.length > 0) {
    const { error: lineError } = await db.from('pack_lines').insert(rows);
    if (lineError) {
      throw new SystemError(`Copie des repliques impossible : ${lineError.message}`);
    }
  }

  // La scene sait desormais qu'elle a ete publiee : l'ecran de resultat
  // affiche un lien vers le pack au lieu de reproposer la publication.
  await db
    .from('sessions')
    .update({ published_pack_id: packId })
    .eq('id', session.id);

  logger.info('scène conservée dans la communauté', {
    step: 'purge',
    packId,
    nature: asRecipe ? 'recette' : 'médias',
    kilooctets: Math.round(totalBytes / 1024),
  });
}
