'use client';

import {
  BUCKET_SOURCES,
  CLIP_MARGIN_MS,
  CLIP_MAX_MS,
  CLIP_MERGE_GAP_MS,
} from '@/config/constants';
import { deleteSession, uploadSourceAndEnqueue } from '@/lib/actions';
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
  /** Etiquettes normalisees, sans diese : `starwars`, `kaamelott`. */
  tags: string[];
  author_name: string;
  author_avatar: string | null;
  /** Son auteur, ou un administrateur. */
  can_edit: boolean;
  comment_count: number;
  author_id: string;
  /** L'auteur est un createur certifie. */
  author_certified: boolean;
  /** Derniere retouche de la fiche par son createur, ou `null`. */
  edited_at: string | null;
}

/** La page d'une scene du catalogue. */
export function packHref(packId: string): string {
  return `/communaute/${packId}`;
}

export const PACK_TAGS_MAX = 10;

/**
 * Une etiquette telle que la base la gardera.
 *
 * La meme regle qu'en base (`app_normaliser_tags`), appliquee a la
 * frappe : on voit tout de suite que « #Star Wars » deviendra
 * « starwars », au lieu de le decouvrir apres publication.
 */
export function normaliserTag(brut: string): string | null {
  const tag = brut
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_-]+/gu, '')
    .slice(0, 30);
  return tag.length >= 2 ? tag : null;
}

/**
 * Les genres du catalogue. L'ordre est celui des listes deroulantes.
 *
 * Il melange deux questions — de quel genre, et de quelle sorte d'oeuvre
 * — et c'est assume : personne ne cherche « une comedie » sans savoir
 * s'il veut un film ou un anime, et un catalogue d'amis n'a pas assez de
 * lignes pour supporter deux menus.
 *
 * Aucun nom de studio ni de franchise : « Animation » couvre ce qu'on
 * range d'ordinaire sous un nom propre, sans emprunter celui de
 * personne.
 */
export const PACK_GENRES = [
  'action',
  'comedie',
  'drame',
  'animation',
  'anime',
  'serie',
  'super_heros',
  'science_fiction',
  'horreur',
  'jeu_video',
  'chanson',
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
  'fr',
  'en',
  'es',
  'de',
  'it',
  'pt',
  'ja',
  'ko',
  'zh',
  'ru',
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
 * Le catalogue vieillit lentement.
 *
 * Une scene y entre quand quelqu'un publie, c'est-a-dire rarement. Le
 * relire a chaque retour d'onglet et a chaque navigation ajoutait un
 * aller-retour avant l'affichage, plusieurs fois par minute, pour une
 * liste qui n'avait pas bouge. Deux minutes de fraicheur, et la
 * publication invalide le cache de toute facon.
 */
export const PACKS_QUERY = {
  queryKey: ['packs'] as const,
  queryFn: listPacks,
  staleTime: 120_000,
  refetchOnWindowFocus: false,
};

export interface PackLine {
  start_ms: number;
  end_ms: number;
  text: string;
  characterName: string;
  characterColor: string;
}

/**
 * Les repliques d'un pack, telles qu'elles seront a dire.
 *
 * Sert a une seule chose, et elle compte : montrer le texte avant de
 * s'engager. Une scene du catalogue arrive avec la transcription de
 * quelqu'un d'autre, qui a pu la corriger, la tronquer, ou y mettre
 * n'importe quoi. On la lit, puis on decide de la reprendre ou de tout
 * refaire.
 *
 * Lecture directe plutot que fonction serveur : les politiques laissent
 * deja tout invite lire le catalogue, et il n'y a rien de plus a
 * verifier ici.
 */
export async function listPackLines(packId: string): Promise<PackLine[]> {
  const { data, error } = await supabaseBrowser()
    .from('pack_lines')
    .select('start_ms, end_ms, text, is_deleted, pack_characters (name, color)')
    .eq('pack_id', packId)
    .order('start_ms', { ascending: true });
  if (error) throw new AppError('PACK_LINES_FAILED', humanizeError(error));

  type Row = {
    start_ms: number;
    end_ms: number;
    text: string | null;
    is_deleted: boolean;
    pack_characters: { name: string; color: string } | null;
  };

  return ((data ?? []) as unknown as Row[])
    .filter((row) => !row.is_deleted)
    .map((row) => ({
      start_ms: row.start_ms,
      end_ms: row.end_ms,
      text: row.text ?? '',
      characterName: row.pack_characters?.name ?? '',
      characterColor: row.pack_characters?.color ?? 'character-1',
    }));
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

/**
 * Demarre une scene depuis un pack, avec la video apportee par le joueur.
 *
 * Une recette ne garde que le lien : il faut retrouver la video. Le
 * telechargement automatique passe par le PC de l'hote, parce que YouTube
 * refuse les serveurs. Ici, le joueur apporte le fichier : la scene part
 * en import ordinaire, que le worker en ligne traite sans attendre
 * personne, et la preparation du pack — personnages, repliques corrigees
 * — est reprise telle quelle.
 *
 * La scene nait en brouillon, sans tache : la tache n'entre en file
 * qu'une fois le fichier arrive, sinon le worker partirait chercher un
 * fichier absent. Si l'envoi echoue, le brouillon est retire plutot que
 * de trainer dans « Mes scenes ».
 */
export async function startFromPackWithFile(
  pack: Pack,
  file: File,
  displayName: string,
  onProgress?: (pct: number) => void,
): Promise<SessionRow> {
  let session: SessionRow | null = null;
  for (let attempt = 0; attempt < 5 && !session; attempt += 1) {
    try {
      session = await rpc<SessionRow>('start_from_pack_file', {
        p_pack_id: pack.id,
        p_code: generateSessionCode(),
        p_display_name: displayName,
        p_gap_ms: CLIP_MERGE_GAP_MS,
        p_margin_ms: CLIP_MARGIN_MS,
        p_max_ms: CLIP_MAX_MS,
      });
    } catch (error) {
      if (!humanizeError(error).includes('déjà pris')) throw error;
    }
  }
  if (!session) throw new AppError('CODE_COLLISION', 'Impossible de générer un code libre.');

  try {
    await uploadSourceAndEnqueue(session, file, onProgress);
  } catch (error) {
    await deleteSession(session).catch(() => undefined);
    throw error;
  }
  return session;
}

/** Retire un pack : les fichiers d'abord, la fiche ensuite. */
export async function deletePack(pack: Pack): Promise<void> {
  const db = supabaseBrowser();

  // Une recette garde desormais ses pistes audio : on les retire aussi.
  const folder = `packs/${pack.id}`;
  const { data } = await db.storage.from(BUCKET_SOURCES).list(folder, { limit: 100 });
  const files = (data ?? []).map((file) => `${folder}/${file.name}`);
  if (files.length > 0) await db.storage.from(BUCKET_SOURCES).remove(files);

  await rpc('delete_pack', { p_pack_id: pack.id });
}

/** Ce qu'on renseigne en publiant, et qu'on peut retoucher ensuite. */
export interface PackFacets {
  title: string;
  /**
   * Le lien d'ou vient l'extrait : YouTube ou n'importe quel site.
   * Obligatoire : c'est l'apercu de la fiche, et c'est la que les autres
   * recuperent la video pour rejouer la scene.
   */
  sourceUrl: string;
  sourceLang: string;
  genre: PackGenre | '';
  tags: string[];
}

/** La meme regle qu'en base (`app_lien_valide`). */
export function lienValide(url: string): boolean {
  const lien = url.trim();
  return lien.length <= 500 && /^https?:\/\/[^\s/$.?#][^\s]*$/i.test(lien);
}

/** Retoucher une scene publiee : son auteur, ou un administrateur. */
export function setPackFacets(packId: string, facets: PackFacets) {
  return rpc('set_pack_facets', {
    p_pack_id: packId,
    p_title: facets.title,
    p_source_lang: facets.sourceLang,
    p_genre: facets.genre,
    p_tags: facets.tags,
    p_source_url: facets.sourceUrl.trim(),
  });
}

/** La fiche d'un pack en cours de creation, gardee sur sa scene. */
export interface PackDraft {
  source_url: string;
  genre: PackGenre | null;
  tags: string[];
}

export function setPackDraft(sessionId: string, facets: PackFacets) {
  return rpc('set_pack_draft', {
    p_session_id: sessionId,
    p_source_url: facets.sourceUrl.trim(),
    p_genre: facets.genre || null,
    p_tags: facets.tags,
  });
}

/** Voter sur une scene. Revoter la meme valeur retire le vote. */
export function votePack(packId: string, value: 1 | -1) {
  return rpc<number>('vote_pack', { p_pack_id: packId, p_value: value });
}

/**
 * Publie une scene terminee dans la communaute.
 *
 * Titre, lien, langue et genre sont obligatoires, la base le verifie
 * aussi. Seuls le lien et le decoupage partent : jamais la video.
 */
export function publishRecipePack(sessionId: string, facets: PackFacets) {
  return rpc<string>('publish_recipe_pack', {
    p_session_id: sessionId,
    p_title: facets.title,
    p_source_lang: facets.sourceLang,
    p_genre: facets.genre,
    p_tags: facets.tags,
    p_source_url: facets.sourceUrl.trim(),
  });
}

// ── Commentaires ─────────────────────────────────────────────────────

export interface PackComment {
  id: string;
  /** Le commentaire auquel celui-ci repond, ou `null` pour un premier niveau. */
  parent_id: string | null;
  body: string;
  created_at: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  author_certified: boolean;
  is_mine: boolean;
  can_delete: boolean;
  /** Ni le sien, ni deja signale par moi. */
  can_report: boolean;
  score: number;
  up_count: number;
  down_count: number;
  my_vote: number;
}

/** Ou vit un fil de commentaires : sous une scene, ou sur un profil. */
export type CommentTarget = { kind: 'pack'; id: string } | { kind: 'profile'; id: string };

export const commentsKey = (target: CommentTarget) =>
  ['comments', target.kind, target.id] as const;

export function listComments(target: CommentTarget): Promise<PackComment[]> {
  return target.kind === 'pack'
    ? rpc<PackComment[]>('list_pack_comments', { p_pack_id: target.id })
    : rpc<PackComment[]>('list_profile_comments', { p_user_id: target.id });
}

export function addComment(target: CommentTarget, body: string, parentId: string | null = null) {
  return target.kind === 'pack'
    ? rpc<string>('add_pack_comment', { p_pack_id: target.id, p_body: body, p_parent_id: parentId })
    : rpc<string>('add_profile_comment', { p_user_id: target.id, p_body: body, p_parent_id: parentId });
}

/** Au cinquieme signalement, le commentaire disparait. */
export function reportComment(commentId: string) {
  return rpc<{ removed: boolean; reports: number }>('report_comment', { p_comment_id: commentId });
}

export function deletePackComment(commentId: string) {
  return rpc('delete_pack_comment', { p_comment_id: commentId });
}

/** Revoter la meme valeur retire le vote, comme pour les scenes. */
export function votePackComment(commentId: string, value: 1 | -1) {
  return rpc<number>('vote_pack_comment', { p_comment_id: commentId, p_value: value });
}
