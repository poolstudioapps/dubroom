'use client';

import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useEffect, useId } from 'react';

import {
  BUCKET_RENDERS,
  BUCKET_SOURCES,
  JOB_POLL_INTERVAL_MS,
  SIGNED_URL_TTL_S,
  WORKER_STALE_MS,
} from '@/config/constants';
import { supabaseBrowser } from '@/lib/supabase/client';
import type {
  CharacterRow,
  ClipRow,
  JobRow,
  LineRow,
  ParticipantRow,
  SessionRow,
  TakeRow,
} from '@/lib/supabase/database.types';

export interface SceneData {
  session: SessionRow;
  participants: ParticipantRow[];
  characters: CharacterRow[];
  lines: LineRow[];
  clips: ClipRow[];
  me: ParticipantRow | null;
}

/**
 * Un nom de canal qui n'appartient qu'a ce montage.
 *
 * Supabase indexe ses canaux par leur nom : deux composants qui
 * demandent `progress:<id>` recoivent le meme objet, et le second se
 * voit refuser ses ecoutes avec « cannot add postgres_changes callbacks
 * after subscribe() ». L'exception part d'un effet, donc React demonte
 * tout l'arbre : la page devient un fond vide.
 *
 * C'est exactement ce qui arrivait a la fin des prises, ou la colonne de
 * reglages et l'ecran d'attente demandent tous deux l'avancement. Le
 * suffixe rend le nom unique, et chaque abonne a le sien.
 */
function useChannelName(prefix: string, sessionId: string): string {
  const unique = useId();
  return `${prefix}:${sessionId}:${unique}`;
}

const keys = {
  scene: (id: string) => ['scene', id] as const,
  job: (id: string) => ['job', id] as const,
  takes: (id: string) => ['takes', id] as const,
  media: (id: string) => ['media', id] as const,
  render: (id: string) => ['render', id] as const,
  sessions: ['sessions'] as const,
  progress: (id: string) => ['progress', id] as const,
  storage: ['storage-usage'] as const,
};

async function fetchScene(sessionId: string, userId: string): Promise<SceneData> {
  const db = supabaseBrowser();

  const [session, participants, characters, lines, clips] = await Promise.all([
    db.from('sessions').select('*').eq('id', sessionId).single(),
    db.from('participants').select('*').eq('session_id', sessionId).order('created_at'),
    db.from('characters').select('*').eq('session_id', sessionId).order('sort_order'),
    db.from('lines').select('*').eq('session_id', sessionId).order('start_ms'),
    db.from('clips').select('*').eq('session_id', sessionId).order('idx'),
  ]);

  const error =
    session.error ??
    participants.error ??
    characters.error ??
    lines.error ??
    clips.error;
  if (error) throw error;

  const people = (participants.data ?? []) as ParticipantRow[];
  return {
    session: session.data as unknown as SessionRow,
    participants: people,
    characters: (characters.data ?? []) as CharacterRow[],
    lines: (lines.data ?? []) as LineRow[],
    clips: (clips.data ?? []) as ClipRow[],
    me: people.find((p) => p.user_id === userId) ?? null,
  };
}

/**
 * Donnees completes d'une scene, tenues a jour par Realtime.
 *
 * Un seul canal pour toute la page : Supabase limite le nombre de canaux
 * simultanes, et un abonnement par table rendrait le lobby bavard pour
 * rien. A chaque evenement on invalide, React Query refetch.
 */
export function useScene(sessionId: string, userId: string) {
  const qc = useQueryClient();
  const channelName = useChannelName('scene', sessionId);

  useEffect(() => {
    const db = supabaseBrowser();
    const channel = db
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${sessionId}`,
        },
        () => invalidateScene(qc, sessionId),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `session_id=eq.${sessionId}`,
        },
        () => invalidateScene(qc, sessionId),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'characters',
          filter: `session_id=eq.${sessionId}`,
        },
        () => invalidateScene(qc, sessionId),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          void qc.invalidateQueries({ queryKey: keys.job(sessionId) });
          invalidateScene(qc, sessionId);
        },
      )
      .subscribe();

    return () => {
      void db.removeChannel(channel);
    };
  }, [qc, sessionId, channelName]);

  return useQuery({
    queryKey: keys.scene(sessionId),
    // Le code n'est pas encore resolu en identifiant : interroger la base
    // avec une chaine vide provoquerait une erreur de cast uuid.
    enabled: !!sessionId,
    queryFn: () => fetchScene(sessionId, userId),
  });
}

export function invalidateScene(qc: QueryClient, sessionId: string) {
  void qc.invalidateQueries({ queryKey: keys.scene(sessionId) });
}

export function invalidateTakes(qc: QueryClient, sessionId: string) {
  void qc.invalidateQueries({ queryKey: keys.takes(sessionId) });
}

// ── Job en cours et presence du worker (PRD §12.1) ────────────────────

export interface JobState {
  job: JobRow | null;
  /** Vrai si un worker a donne signe de vie recemment. */
  workerOnline: boolean;
}

export function useJobState(sessionId: string, enabled = true) {
  return useQuery({
    queryKey: keys.job(sessionId),
    enabled,
    // Realtime couvre les changements de job ; ce poll est le filet pour
    // le heartbeat du worker, qui n'est pas dans la publication.
    refetchInterval: JOB_POLL_INTERVAL_MS,
    queryFn: async (): Promise<JobState> => {
      const db = supabaseBrowser();
      const [jobs, workers] = await Promise.all([
        db
          .from('jobs')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false })
          .limit(1),
        db
          .from('workers')
          .select('last_seen_at')
          .order('last_seen_at', { ascending: false })
          .limit(1),
      ]);
      if (jobs.error) throw jobs.error;

      const lastSeen = (workers.data as { last_seen_at: string }[] | null)?.[0]
        ?.last_seen_at;
      const workerOnline =
        !!lastSeen && Date.now() - new Date(lastSeen).getTime() < WORKER_STALE_MS;

      return { job: (jobs.data?.[0] as JobRow | undefined) ?? null, workerOnline };
    },
  });
}

// ── Prises ────────────────────────────────────────────────────────────

export function useTakes(sessionId: string, clipIds: string[]) {
  const qc = useQueryClient();
  const channelName = useChannelName('takes', sessionId);

  useEffect(() => {
    const db = supabaseBrowser();
    const channel = db
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'takes' }, () =>
        invalidateTakes(qc, sessionId),
      )
      .subscribe();
    return () => {
      void db.removeChannel(channel);
    };
  }, [qc, sessionId, channelName]);

  return useQuery({
    queryKey: keys.takes(sessionId),
    enabled: clipIds.length > 0,
    queryFn: async () => {
      const db = supabaseBrowser();
      const { data, error } = await db
        .from('takes')
        .select('*')
        .in('clip_id', clipIds)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as TakeRow[];
    },
  });
}

// ── URL signees (PRD §14) ─────────────────────────────────────────────

export interface MediaUrls {
  video: string | null;
  music: string | null;
}

export function useMediaUrls(session: SessionRow | undefined) {
  return useQuery({
    queryKey: keys.media(session?.id ?? 'none'),
    enabled: !!session?.video_path,
    // Les URL signees expirent : on les renouvelle avant la fin.
    staleTime: (SIGNED_URL_TTL_S - 120) * 1000,
    refetchInterval: (SIGNED_URL_TTL_S - 120) * 1000,
    queryFn: async (): Promise<MediaUrls> => {
      const db = supabaseBrowser();
      // Le fond servi au navigateur est la version compressee : le WAV
      // de reference ne quitte jamais Supabase que vers le worker.
      const musicPath = session!.stem_music_preview_path ?? session!.stem_music_path;

      const paths = [session!.video_path, musicPath].filter(Boolean) as string[];

      const { data, error } = await db.storage
        .from(BUCKET_SOURCES)
        .createSignedUrls(paths, SIGNED_URL_TTL_S);
      if (error) throw error;

      const byPath = new Map(
        (data ?? []).map((d) => [d.path ?? '', d.signedUrl ?? null]),
      );
      return {
        video: byPath.get(session!.video_path ?? '') ?? null,
        music: byPath.get(musicPath ?? '') ?? null,
      };
    },
  });
}

/**
 * L'adresse signee d'un rendu.
 *
 * `format` choisit entre la version d'origine et celle recadree pour les
 * ecrans tenus a la verticale. Les deux ont leur propre cle de cache :
 * une seule adresse pour les deux fichiers aurait servi le mauvais des
 * qu'on passe de l'un a l'autre.
 */
export function useRenderUrl(
  session: SessionRow | undefined,
  format: 'large' | 'vertical' = 'large',
) {
  const chemin =
    format === 'vertical' ? session?.render_vertical_path : session?.render_path;
  const suffixe = format === 'vertical' ? ' (9x16)' : '';

  return useQuery({
    queryKey: [...keys.render(session?.id ?? 'none'), format],
    enabled: !!chemin,
    staleTime: (SIGNED_URL_TTL_S - 120) * 1000,
    queryFn: async () => {
      const db = supabaseBrowser();
      const { data, error } = await db.storage
        .from(BUCKET_RENDERS)
        .createSignedUrl(chemin!, SIGNED_URL_TTL_S, {
          download: `${session!.title ?? 'dubup'}${suffixe}.mp4`,
        });
      if (error) throw error;
      return data.signedUrl;
    },
  });
}

// ── Liste des scenes et espace consomme (PRD §13.3) ───────────────────

export function useMySessions() {
  return useQuery({
    queryKey: keys.sessions,
    queryFn: async () => {
      const db = supabaseBrowser();
      const { data, error } = await db
        .from('sessions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as SessionRow[];
    },
  });
}

export function useStorageUsage() {
  return useQuery({
    queryKey: keys.storage,
    queryFn: async () => {
      const db = supabaseBrowser();
      const { data, error } = await db.rpc('storage_usage');
      if (error) throw error;
      return Number(data ?? 0);
    },
  });
}

// ── Avancement des joueurs (PRD §11.7) ────────────────────────────────

export interface PlayerProgressRow {
  participant_id: string;
  display_name: string;
  is_host: boolean;
  is_kicked: boolean;
  is_ready: boolean;
  done: number;
  total: number;
}

/**
 * Compteurs par joueur, calcules cote base : les prises des autres
 * restent invisibles avant le rendu, mais l'ecran d'attente peut quand
 * meme dire qui en est ou.
 */
export function useSessionProgress(sessionId: string) {
  const qc = useQueryClient();
  const channelName = useChannelName('progress', sessionId);

  useEffect(() => {
    const db = supabaseBrowser();
    const channel = db
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'takes' }, () => {
        void qc.invalidateQueries({ queryKey: keys.progress(sessionId) });
      })
      .subscribe();
    return () => {
      void db.removeChannel(channel);
    };
  }, [qc, sessionId, channelName]);

  return useQuery({
    queryKey: keys.progress(sessionId),
    refetchInterval: JOB_POLL_INTERVAL_MS * 5,
    queryFn: async () => {
      const db = supabaseBrowser();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (db.rpc as any)('session_progress', {
        p_session_id: sessionId,
      });
      if (error) throw error;
      return (data ?? []) as PlayerProgressRow[];
    },
  });
}

export const queryKeys = keys;
