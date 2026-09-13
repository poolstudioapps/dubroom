'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { supabaseBrowser } from '@/lib/supabase/client';

export type NotificationKind =
  | 'render_started'
  | 'render_done'
  | 'render_expiring'
  | 'render_deleted'
  | 'pack_like'
  | 'comment';

export interface NotificationItem {
  id: string;
  kind: NotificationKind;
  /** Le code de la scene, pour les notifications de montage. */
  session_code: string | null;
  pack_id: string | null;
  profile_id: string | null;
  /** Combien d'evenements regroupes sur cette ligne. */
  count: number;
  /** Les derniers auteurs, le plus recent d'abord. */
  actors: string[];
  data: { title?: string; code?: string; minutes?: number; reply?: boolean };
  created_at: string;
  read_at: string | null;
}

const cle = (userId: string | null) => ['notifications', userId ?? 'none'] as const;

/**
 * Les notifications du compte, tenues a jour en direct.
 *
 * La base les ecrit elle-meme — montage lance ou termine, video bientot
 * supprimee, like, commentaire — et les pousse par le canal temps reel :
 * la cloche change sans recharger la page.
 */
export function useNotifications(userId: string | null) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: cle(userId),
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabaseBrowser().rpc as any)('list_notifications', {
        p_limit: 30,
      });
      if (error) throw error;
      return (data ?? []) as NotificationItem[];
    },
  });

  useEffect(() => {
    if (!userId) return;
    const db = supabaseBrowser();
    const canal = db
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => void qc.invalidateQueries({ queryKey: cle(userId) }),
      )
      .subscribe();
    return () => {
      void db.removeChannel(canal);
    };
  }, [userId, qc]);

  return query;
}

export async function markNotificationsRead(): Promise<void> {
  const { error } = await supabaseBrowser().rpc('mark_notifications_read');
  if (error) throw error;
}

export function invalidateNotifications(qc: ReturnType<typeof useQueryClient>, userId: string | null) {
  return qc.invalidateQueries({ queryKey: cle(userId) });
}
