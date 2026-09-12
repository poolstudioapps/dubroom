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
  /** 'media' = fichiers conserves ; 'url' = recette, tout est refait. */
  kind: 'media' | 'url';
  source_url: string | null;
  description: string | null;
  duration_ms: number;
  character_count: number;
  line_count: number;
  size_bytes: number;
  created_at: string;
  is_mine: boolean;
  /** Somme des avis. C'est elle qui ordonne le catalogue. */
  score: number;
  up_count: number;
  down_count: number;
  /** Mon propre avis : 1, -1, ou 0 si je n'ai pas vote. */
  my_vote: number;
  /** Langue parlee dans l'extrait, code ISO 639-1, ou `null` si inconnue. */
  source_lang: string | null;
  genre: PackGenre;
  characters: PackCharacter[];
}

/** Les genres du catalogue. L'ordre est celui des listes deroulantes. */
export const PACK_GENRES = [
  'action',
  'comedie',
  'drame',
  'animation',
  'science_fiction',
  'horreur',
  'documentaire',
  'autre',
] as const;

export type PackGenre = (typeof PACK_GENRES)[number];

/**
 * Les langues qu'on propose a la publication.
 *
 * Celles des dialogues, pas celles de l'interface : ce sont deux
 * questions differentes, et on double un extrait anglais depuis une
 * interface francaise tous les jours.
 */
export const PACK_LANGS = [
  'fr', 'en', 'es', 'de', 'it', 'pt', 'ja', 'ko', 'zh', 'ru',
] as const;

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

  // Une recette n'a rien dans Storage : seule la fiche est a retirer.
  if (pack.kind === 'media') {
    const folder = `packs/${pack.id}`;
    const { data } = await db.storage.from(BUCKET_SOURCES).list(folder, { limit: 100 });
    const files = (data ?? []).map((file) => `${folder}/${file.name}`);
    if (files.length > 0) await db.storage.from(BUCKET_SOURCES).remove(files);
  }

  await rpc('delete_pack', { p_pack_id: pack.id });
}

/** Renseigner les criteres d'une scene publiee. */
export function setPackFacets(
  packId: string,
  facets: { sourceLang?: string | null; genre?: PackGenre },
) {
  return rpc('set_pack_facets', {
    p_pack_id: packId,
    p_source_lang: facets.sourceLang === undefined ? null : (facets.sourceLang ?? ''),
    p_genre: facets.genre ?? null,
  });
}

/** Voter sur une scene. Revoter la meme valeur retire le vote. */
export function votePack(packId: string, value: 1 | -1) {
  return rpc<number>('vote_pack', { p_pack_id: packId, p_value: value });
}

export function setKeepAsPack(sessionId: string, keep: boolean) {
  return rpc('set_keep_as_pack', { p_session_id: sessionId, p_keep: keep });
}

/**
 * Publie une scene venue d'un lien, apres coup.
 *
 * Possible meme une fois le rendu produit : une recette ne contient que
 * le lien et la preparation, et tous deux survivent a la purge.
 */
export function publishRecipePack(
  sessionId: string,
  input: { title?: string; sourceLang?: string; genre?: PackGenre } = {},
) {
  return rpc<string>('publish_recipe_pack', {
    p_session_id: sessionId,
    p_title: input.title ?? null,
    p_source_lang: input.sourceLang ?? null,
    p_genre: input.genre ?? null,
  });
}
