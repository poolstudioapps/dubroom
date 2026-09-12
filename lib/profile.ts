'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AppError, humanizeError } from '@/lib/errors';
import { supabaseBrowser } from '@/lib/supabase/client';

export const BUCKET_AVATARS = 'avatars';

/** Deux mega-octets : la limite est aussi posee sur le bucket. */
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export interface Profile {
  user_id: string;
  display_name: string;
  avatar_path: string | null;
  created_at: string;
  updated_at: string;
  /** Quand cette personne a accepte les conditions, ou `null` si jamais. */
  terms_accepted_at: string | null;
  /** La version acceptee, sous forme de date. Voir `config/terms.ts`. */
  terms_version: string | null;
}

async function rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabaseBrowser().rpc as any)(fn, args);
  if (error) throw new AppError('RPC_FAILED', humanizeError(error));
  return data as T;
}

export const profileKeys = {
  me: ['profile', 'me'] as const,
  avatar: (path: string | null) => ['profile', 'avatar', path] as const,
  packCount: ['profile', 'pack-count'] as const,
};

/** Le profil courant, cree au premier passage par la fonction serveur. */
export function useMyProfile() {
  return useQuery({
    queryKey: profileKeys.me,
    queryFn: () => rpc<Profile>('get_my_profile'),
    staleTime: 60_000,
  });
}

/**
 * Combien de packs j'ai publies.
 *
 * Un seul nombre, pas la liste : la barre d'onglets a besoin de savoir
 * s'il faut afficher l'onglet, pas de son contenu.
 */
export function useMyPackCount(enabled = true) {
  return useQuery({
    queryKey: profileKeys.packCount,
    // Les pages publiques montent la meme barre d'onglets. Sans ce
    // garde-fou, un visiteur non connecte declenchait un appel qui ne
    // pouvait que echouer, sur chaque page legale.
    enabled,
    queryFn: () => rpc<number>('my_pack_count'),
    staleTime: 60_000,
  });
}

/**
 * L'URL signee d'une photo de profil.
 *
 * Le bucket est prive : sans signature, rien ne s'affiche. La signature
 * dure une heure et la requete est mise en cache sur le chemin, donc une
 * grille de dix joueurs ne signe pas dix fois la meme photo.
 */
export function useAvatarUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: profileKeys.avatar(path ?? null),
    enabled: !!path,
    staleTime: 50 * 60_000,
    queryFn: async () => {
      if (!path) return null;
      const { data, error } = await supabaseBrowser()
        .storage.from(BUCKET_AVATARS)
        .createSignedUrl(path, 3600);
      if (error) return null;
      return data.signedUrl;
    },
  });
}

/**
 * Inscrit l'acceptation des conditions au profil.
 *
 * Le profil revenant de la fonction est pose directement dans le cache :
 * sans cela, la carte qui bloque l'entree se redessinerait a l'identique
 * le temps d'une nouvelle lecture, et on croirait que le clic n'a pas
 * pris.
 */
export function useAcceptTerms() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (version: string) =>
      rpc<Profile>('accept_terms', { p_version: version }),
    onSuccess: (profile) => qc.setQueryData(profileKeys.me, profile),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { displayName?: string; avatarPath?: string | null }) =>
      rpc<Profile>('update_my_profile', {
        p_display_name: input.displayName ?? null,
        // `null` ne touche a rien, `''` retire la photo : la distinction
        // est portee jusqu'a la fonction SQL.
        p_avatar_path: input.avatarPath === undefined ? null : (input.avatarPath ?? ''),
      }),
    onSuccess: (profile) => {
      qc.setQueryData(profileKeys.me, profile);
      void qc.invalidateQueries({ queryKey: ['scene'] });
    },
  });
}

/**
 * Envoie une photo et la rattache au profil.
 *
 * Le nom de fichier porte l'horodatage : remplacer une photo par une
 * autre du meme nom laissait l'ancienne en cache du navigateur, et on
 * croyait que l'envoi avait echoue.
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  if (!AVATAR_TYPES.includes(file.type)) {
    throw new AppError('BAD_TYPE', 'Format accepté : PNG, JPEG ou WebP.');
  }
  if (file.size > AVATAR_MAX_BYTES) {
    throw new AppError('TOO_BIG', 'La photo ne doit pas dépasser 2 Mo.');
  }

  const extension =
    file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${userId}/${Date.now()}.${extension}`;

  const { error } = await supabaseBrowser()
    .storage.from(BUCKET_AVATARS)
    .upload(path, file, { contentType: file.type, upsert: true });
  if (error) throw new AppError('UPLOAD_FAILED', humanizeError(error));

  return path;
}

/** Retire les anciennes photos, pour ne pas accumuler. */
export async function pruneAvatars(userId: string, keep: string | null) {
  const db = supabaseBrowser();
  const { data } = await db.storage.from(BUCKET_AVATARS).list(userId, { limit: 50 });
  const stale = (data ?? [])
    .map((file) => `${userId}/${file.name}`)
    .filter((full) => full !== keep);
  if (stale.length > 0) await db.storage.from(BUCKET_AVATARS).remove(stale);
}

/**
 * Les photos d'un groupe de joueurs, en une requete.
 *
 * Une photo n'a d'interet que si les autres la voient : elle sert a
 * reconnaitre qui est dans le lobby. La politique de lecture autorise
 * tout invite a lire les profils, il n'y a donc pas de fonction dediee.
 */
export function useProfilesOf(userIds: string[]) {
  const ids = [...new Set(userIds)].sort();
  return useQuery({
    queryKey: ['profiles', ids.join(',')],
    enabled: ids.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabaseBrowser()
        .from('profiles')
        .select('user_id, display_name, avatar_path')
        .in('user_id', ids);
      const byUser = new Map<
        string,
        { display_name: string; avatar_path: string | null }
      >();
      for (const row of (data ?? []) as Profile[]) {
        byUser.set(row.user_id, {
          display_name: row.display_name,
          avatar_path: row.avatar_path,
        });
      }
      return byUser;
    },
  });
}
