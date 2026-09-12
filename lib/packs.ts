'use client';

import {
  BUCKET_SOURCES,
  CLIP_MARGIN_MS,
  CLIP_MERGE_GAP_MS,
} from '@/config/constants';
import { AppError, humanizeError } from '@/lib/errors';
import { supabaseBrowser } from '@/lib/supabase/client';
import type { SessionRow } from '@/lib/supabase/database.types';
import { generateSessionCode } from '@/lib/utils';

export interface PackCharacter {
  name: string;
  color: string;
}

export interface Pack {
  id: string;
  title: string;
  description: string | null;
  duration_ms: number;
  character_count: number;
  line_count: number;
  size_bytes: number;
  created_at: string;
  is_mine: boolean;
  characters: PackCharacter[];
}

async function rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabaseBrowser().rpc as any)(fn, args);
  if (error) throw new AppError('RPC_FAILED', humanizeError(error));
  return data as T;
}

export function listPacks(): Promise<Pack[]> {
  return rpc<Pack[]>('list_packs');
}

/**
 * Demarre une scene depuis un pack.
 *
 * Rien n'est copie dans Storage : la nouvelle scene pointe vers les
 * fichiers du pack. Le code est tire ici, comme pour une scene ordinaire,
 * et l'unicite est tenue par la contrainte en base — d'ou ces essais.
 */
export async function startFromPack(
  packId: string,
  displayName: string,
): Promise<SessionRow> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await rpc<SessionRow>('start_from_pack', {
        p_pack_id: packId,
        p_code: generateSessionCode(),
        p_display_name: displayName,
        p_gap_ms: CLIP_MERGE_GAP_MS,
        p_margin_ms: CLIP_MARGIN_MS,
      });
    } catch (error) {
      if (!humanizeError(error).includes('déjà pris')) throw error;
    }
  }
  throw new AppError('CODE_COLLISION', 'Impossible de générer un code libre.');
}

/** Retire un pack : les fichiers d'abord, la fiche ensuite. */
export async function deletePack(pack: Pack): Promise<void> {
  const db = supabaseBrowser();
  const folder = `packs/${pack.id}`;

  const { data } = await db.storage.from(BUCKET_SOURCES).list(folder, { limit: 100 });
  const files = (data ?? []).map((file) => `${folder}/${file.name}`);
  if (files.length > 0) await db.storage.from(BUCKET_SOURCES).remove(files);

  await rpc('delete_pack', { p_pack_id: pack.id });
}

export function setKeepAsPack(sessionId: string, keep: boolean) {
  return rpc('set_keep_as_pack', { p_session_id: sessionId, p_keep: keep });
}
