'use client';

import {
  BUCKET_SOURCES,
  BUCKET_TAKES,
  CLIP_MARGIN_MS,
  CLIP_MERGE_GAP_MS,
  characterColorToken,
} from '@/config/constants';
import { AppError, humanizeError } from '@/lib/errors';
import { supabaseBrowser } from '@/lib/supabase/client';
import type {
  CharacterRow,
  JobRow,
  SessionRow,
  TakeRow,
} from '@/lib/supabase/database.types';
import { generateSessionCode } from '@/lib/utils';

/*
 * Toutes les mutations passent par les fonctions Postgres du dossier
 * supabase/migrations. Le front ne fait donc jamais d'UPDATE direct sur
 * une colonne de statut : les invariants restent au meme endroit.
 *
 * Les seuils de decoupage sont passes explicitement depuis
 * config/constants.ts — la base ne les connait pas (PRD §18).
 */

async function rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const db = supabaseBrowser();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (db.rpc as any)(fn, args);
  if (error) throw new AppError('RPC_FAILED', humanizeError(error));
  return data as T;
}

// ── Creation et ingestion ─────────────────────────────────────────────

export async function createSession(input: {
  title: string;
  sourceType: 'upload' | 'youtube';
  sourceRef?: string;
  displayName: string;
  keepAsPack?: boolean;
}): Promise<SessionRow> {
  // Le code est tire cote client depuis l'alphabet de constants.ts ;
  // l'unicite est tenue par la contrainte en base, d'ou ces essais.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await rpc<SessionRow>('create_session', {
        p_code: generateSessionCode(),
        p_title: input.title,
        p_source_type: input.sourceType,
        p_source_ref: input.sourceRef ?? null,
        p_display_name: input.displayName,
        p_keep_as_pack: input.keepAsPack ?? false,
      });
    } catch (error) {
      const message = humanizeError(error);
      if (!message.includes('déjà pris')) throw error;
    }
  }
  throw new AppError('CODE_COLLISION', 'Impossible de générer un code libre.');
}

/** Envoie le fichier source dans Storage, puis met le job en file. */
export async function uploadSourceAndEnqueue(
  session: SessionRow,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<JobRow> {
  const db = supabaseBrowser();
  const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
  const path = `${session.id}/upload.${ext}`;

  onProgress?.(0);
  const { error } = await db.storage.from(BUCKET_SOURCES).upload(path, file, {
    upsert: true,
    contentType: file.type || 'video/mp4',
  });
  if (error) throw new AppError('UPLOAD_FAILED', humanizeError(error));
  onProgress?.(100);

  return rpc<JobRow>('enqueue_ingest', {
    p_session_id: session.id,
    p_upload_path: path,
  });
}

export function enqueueIngest(sessionId: string, uploadPath: string | null) {
  return rpc<JobRow>('enqueue_ingest', {
    p_session_id: sessionId,
    p_upload_path: uploadPath,
  });
}

export function joinSession(code: string, displayName: string) {
  return rpc<SessionRow>('join_session', {
    p_code: code,
    p_display_name: displayName,
  });
}

// ── Preparation (PRD §9) ──────────────────────────────────────────────

const segmentation = { p_gap_ms: CLIP_MERGE_GAP_MS, p_margin_ms: CLIP_MARGIN_MS };

export function renameCharacter(characterId: string, name: string) {
  return rpc<CharacterRow>('prep_rename_character', {
    p_character_id: characterId,
    p_name: name,
  });
}

export function updateLineText(lineId: string, text: string) {
  return rpc('prep_update_line_text', { p_line_id: lineId, p_text: text });
}

export function reassignLines(lineIds: string[], characterId: string) {
  return rpc<number>('prep_reassign_lines', {
    p_line_ids: lineIds,
    p_character_id: characterId,
    ...segmentation,
  });
}

export function mergeCharacters(sourceIds: string[], targetId: string) {
  return rpc<CharacterRow>('prep_merge_characters', {
    p_source_ids: sourceIds,
    p_target_id: targetId,
    ...segmentation,
  });
}

export function splitLinesToNewCharacter(
  lineIds: string[],
  name: string,
  colorIndex: number,
) {
  return rpc<CharacterRow>('prep_split_lines', {
    p_line_ids: lineIds,
    p_name: name,
    p_color: characterColorToken(colorIndex),
    ...segmentation,
  });
}

export function deleteLines(lineIds: string[]) {
  return rpc<number>('prep_delete_lines', { p_line_ids: lineIds, ...segmentation });
}

export function restoreLines(lineIds: string[]) {
  return rpc<number>('prep_restore_lines', { p_line_ids: lineIds, ...segmentation });
}

export function deleteCharacter(characterId: string) {
  return rpc('prep_delete_character', {
    p_character_id: characterId,
    ...segmentation,
  });
}

export function openLobby(sessionId: string) {
  return rpc<SessionRow>('open_lobby', { p_session_id: sessionId, ...segmentation });
}

// ── Lobby (PRD §10) ───────────────────────────────────────────────────

export function assignCharacter(characterId: string) {
  return rpc<CharacterRow>('assign_character', { p_character_id: characterId });
}

export function unassignCharacter(characterId: string) {
  return rpc<CharacterRow>('unassign_character', { p_character_id: characterId });
}

export function setCharacterReleased(characterId: string, released: boolean) {
  return rpc<CharacterRow>('set_character_released', {
    p_character_id: characterId,
    p_released: released,
  });
}

export function reassignCharacter(characterId: string, participantId: string) {
  return rpc<CharacterRow>('reassign_character', {
    p_character_id: characterId,
    p_participant_id: participantId,
  });
}

export function setReady(sessionId: string, ready: boolean) {
  return rpc('set_ready', { p_session_id: sessionId, p_ready: ready });
}

export function startRecording(sessionId: string) {
  return rpc<SessionRow>('start_recording', { p_session_id: sessionId });
}

export function kickParticipant(participantId: string) {
  return rpc('kick_participant', { p_participant_id: participantId });
}

// ── Studio (PRD §11) ──────────────────────────────────────────────────

export function setMicOffset(sessionId: string, offsetMs: number) {
  return rpc('set_mic_offset', {
    p_session_id: sessionId,
    p_offset_ms: Math.round(offsetMs),
  });
}

/**
 * Envoie une prise puis l'enregistre. L'ordre compte : si le RPC echoue,
 * un fichier orphelin dans Storage est sans consequence ; l'inverse
 * laisserait une prise pointant vers un fichier absent.
 */
export async function uploadTake(input: {
  sessionId: string;
  participantId: string;
  clipId: string;
  blob: Blob;
  durationMs: number;
}): Promise<TakeRow> {
  const db = supabaseBrowser();
  const name = `${crypto.randomUUID()}.webm`;
  const path = `${input.sessionId}/${input.participantId}/${name}`;

  const { error } = await db.storage.from(BUCKET_TAKES).upload(path, input.blob, {
    contentType: 'audio/webm',
    upsert: false,
  });
  if (error) throw new AppError('UPLOAD_FAILED', humanizeError(error));

  return rpc<TakeRow>('save_take', {
    p_clip_id: input.clipId,
    p_audio_path: path,
    p_duration_ms: Math.round(input.durationMs),
  });
}

export function enqueueRender(sessionId: string) {
  return rpc<JobRow>('enqueue_render', { p_session_id: sessionId });
}

// ── Suppression d'une scene (PRD §13.2) ───────────────────────────────

export async function deleteSession(session: SessionRow): Promise<void> {
  const db = supabaseBrowser();

  // Storage d'abord : une fois la ligne supprimee, les policies qui
  // dependent de `sessions` ne laisseraient plus effacer les objets.
  for (const bucket of [BUCKET_SOURCES, BUCKET_TAKES, 'renders'] as const) {
    const { data } = await db.storage.from(bucket).list(session.id, { limit: 1000 });
    const files = (data ?? []).map((f) => `${session.id}/${f.name}`);
    if (files.length > 0) await db.storage.from(bucket).remove(files);
  }
  // Le bucket `takes` est range par participant : un niveau de plus.
  const { data: takeDirs } = await db.storage
    .from(BUCKET_TAKES)
    .list(session.id, { limit: 1000 });
  for (const dir of takeDirs ?? []) {
    const { data } = await db.storage
      .from(BUCKET_TAKES)
      .list(`${session.id}/${dir.name}`, { limit: 1000 });
    const files = (data ?? []).map((f) => `${session.id}/${dir.name}/${f.name}`);
    if (files.length > 0) await db.storage.from(BUCKET_TAKES).remove(files);
  }

  const { error } = await db.from('sessions').delete().eq('id', session.id);
  if (error) throw new AppError('DELETE_FAILED', humanizeError(error));
}
