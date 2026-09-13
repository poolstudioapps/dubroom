'use client';

import { useQuery } from '@tanstack/react-query';

import { AppError, humanizeError } from '@/lib/errors';
import { supabaseBrowser } from '@/lib/supabase/client';

async function rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabaseBrowser().rpc as any)(fn, args);
  if (error) throw new AppError('RPC_FAILED', humanizeError(error));
  return data as T;
}

/** Ce qu'un profil public dit d'un createur. Voir `get_creator_profile`. */
export interface CreatorProfile {
  user_id: string;
  display_name: string;
  avatar_path: string | null;
  member_since: string;
  is_me: boolean;
  pack_count: number;
  up_total: number;
  down_total: number;
  /** Scenes ayant recu au moins `cert_min_up` avis positifs. */
  packs_10up: number;
  certified: boolean;
  certified_via: 'packs' | 'votes' | null;
  cert_packs_goal: number;
  cert_min_up: number;
  cert_votes_goal: number;
  comment_count: number;
}

export const profileHref = (userId: string) => `/u/${userId}`;

export const creatorKey = (userId: string) => ['creator', userId] as const;

export function useCreatorProfile(userId: string | null | undefined) {
  return useQuery({
    queryKey: creatorKey(userId ?? ''),
    enabled: !!userId,
    staleTime: 30_000,
    queryFn: () => rpc<CreatorProfile>('get_creator_profile', { p_user_id: userId }),
  });
}

export interface Moderation {
  banned: boolean;
  warning_count: number;
  warnings: { id: string; excerpt: string; created_at: string }[];
}

export const moderationKey = ['moderation'] as const;

/** Suspension et avertissements non lus de la personne connectee. */
export function useMyModeration() {
  return useQuery({
    queryKey: moderationKey,
    staleTime: 60_000,
    queryFn: () => rpc<Moderation>('my_moderation'),
  });
}

export function acknowledgeWarnings() {
  return rpc('acknowledge_warnings');
}
