'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AppError, humanizeError } from '@/lib/errors';
import { supabaseBrowser } from '@/lib/supabase/client';

/**
 * Les roles, cote interface.
 *
 * La base decide : un membre qui force l'ecran n'obtient qu'un refus
 * (`ADMIN_ONLY`). L'interface, elle, n'affiche que ce qui marchera, pour
 * ne pas proposer un chemin qui echouerait au bout.
 *
 * - `owner` : les proprietaires du projet, qui nomment les administrateurs ;
 * - `admin` : peut creer une scene depuis un lien YouTube, via le worker
 *   du PC de l'hote ;
 * - `user` : importe ses videos, tout est traite en ligne.
 */
export type Role = 'user' | 'admin' | 'owner' | 'none';

export interface Member {
  email: string;
  role: Role;
  has_account: boolean;
  display_name: string | null;
}

async function rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabaseBrowser().rpc as any)(fn, args);
  if (error) throw new AppError('RPC_FAILED', humanizeError(error));
  return data as T;
}

export const roleKeys = {
  me: ['role', 'me'] as const,
  members: ['role', 'members'] as const,
};

export function isAdmin(role: Role | undefined): boolean {
  return role === 'admin' || role === 'owner';
}

/** Mon role. Il change rarement : cinq minutes de fraicheur suffisent. */
export function useMyRole(enabled = true) {
  return useQuery({
    queryKey: roleKeys.me,
    enabled,
    queryFn: () => rpc<Role>('get_my_role'),
    staleTime: 5 * 60_000,
  });
}

/** Les membres et leur role : la base ne repond qu'aux proprietaires. */
export function useMembers(enabled: boolean) {
  return useQuery({
    queryKey: roleKeys.members,
    enabled,
    queryFn: () => rpc<Member[]>('list_members'),
  });
}

export function useSetMemberRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; role: 'user' | 'admin' }) =>
      rpc('set_member_role', { p_email: input.email, p_role: input.role }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: roleKeys.members }),
  });
}
