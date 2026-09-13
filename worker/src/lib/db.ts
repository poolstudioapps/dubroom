import { createClient } from '@supabase/supabase-js';

import { config } from '../config.ts';
import { SystemError } from '../errors.ts';

/**
 * Client Supabase du worker (PRD §20.10).
 *
 * La cle service contourne RLS. Elle ne quitte jamais cette machine.
 * Le worker ne fait jamais confiance au client : toute ecriture de
 * statut de session ou de job passe par ici (PRD §18).
 */
export const db = createClient(config.supabaseUrl, config.supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export interface Job {
  id: string;
  session_id: string;
  type: 'ingest' | 'render';
  status: 'queued' | 'running' | 'done' | 'failed';
  step: string | null;
  progress: number;
  attempts: number;
  error: string | null;
}

export interface Session {
  id: string;
  code: string;
  host_id: string;
  title: string | null;
  status: string;
  source_type: 'upload' | 'youtube';
  source_ref: string | null;
  upload_path: string | null;
  video_path: string | null;
  stem_voice_path: string | null;
  stem_music_path: string | null;
  duration_ms: number | null;
  render_path: string | null;
  render_size_bytes: number | null;
  voice_peaks: string | null;
  voice_peaks_hz: number | null;
  keep_as_pack: boolean;
  from_pack_id: string | null;
  is_song: boolean;
  /** Langue parlee, choisie a la creation (ISO 639-1), ou `null`. */
  source_lang: string | null;
}

/**
 * Reclame un job en file. `null` s'il n'y a rien a faire (PRD §7.2).
 *
 * Le role decide de ce que la base accepte de rendre : voir `config.role`
 * et la migration `worker_hybride`.
 */
export async function claimJob(): Promise<Job | null> {
  const { data, error } = await db.rpc('claim_job', {
    p_worker_id: config.workerId,
    p_max_attempts: config.maxAttempts,
    p_role: config.role,
    p_grace_seconds: config.role === 'local' ? config.cloudGraceSeconds : 0,
  });
  if (error) throw new SystemError(`claim_job a échoué : ${error.message}`);

  // `RETURNS jobs` qui rend NULL arrive ici en objet dont tous les champs
  // sont nuls, pas en `null` : PostgREST serialise la ligne composite
  // avant de constater qu'elle est vide. Sans ce test, une file vide
  // ressemblerait a un job et la boucle partirait en vrille.
  const job = data as Job | null;
  return job?.id ? job : null;
}

/** Heartbeat hors reclamation, pour que le front sache qu'on est la. */
export async function heartbeat(): Promise<void> {
  const { error } = await db
    .from('workers')
    .upsert(
      { id: config.workerId, last_seen_at: new Date().toISOString() },
      { onConflict: 'id' },
    );
  if (error) throw new SystemError(`Heartbeat impossible : ${error.message}`);
}

export async function requeueStaleJobs(): Promise<number> {
  const { data, error } = await db.rpc('requeue_stale_jobs', {
    p_stale_minutes: config.staleMinutes,
  });
  if (error) throw new SystemError(`requeue_stale_jobs a échoué : ${error.message}`);
  return Number(data ?? 0);
}

export async function getSession(sessionId: string): Promise<Session> {
  const { data, error } = await db
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();
  if (error || !data) {
    throw new SystemError(`Session introuvable : ${sessionId} (${error?.message})`);
  }
  return data as Session;
}

export async function updateSession(
  sessionId: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const { error } = await db.from('sessions').update(patch).eq('id', sessionId);
  if (error)
    throw new SystemError(`Mise à jour de session impossible : ${error.message}`);
}

export async function setJobStep(
  jobId: string,
  step: string,
  progress: number,
): Promise<void> {
  const { error } = await db
    .from('jobs')
    .update({ step, progress: Math.max(0, Math.min(100, Math.round(progress))) })
    .eq('id', jobId);
  if (error) throw new SystemError(`Mise à jour de job impossible : ${error.message}`);
}

export async function finishJob(jobId: string): Promise<void> {
  const { error } = await db
    .from('jobs')
    .update({
      status: 'done',
      progress: 100,
      error: null,
      finished_at: new Date().toISOString(),
    })
    .eq('id', jobId);
  if (error) throw new SystemError(`Clôture de job impossible : ${error.message}`);
}

/**
 * Rend un job a la file pour qu'un autre worker le continue.
 *
 * L'essai n'est pas compte : passer le relais n'est pas echouer, et trois
 * relais auraient sinon epuise les tentatives d'une scene qui n'a jamais
 * rate. Le retour en file reveille Google par le declencheur de la base.
 */
export async function handOffJob(job: Job): Promise<void> {
  const { error } = await db
    .from('jobs')
    .update({
      status: 'queued',
      claimed_by: null,
      step: null,
      progress: 0,
      error: null,
      started_at: null,
      attempts: Math.max(0, job.attempts - 1),
    })
    .eq('id', job.id)
    .eq('status', 'running');
  if (error) throw new SystemError(`Passage de relais impossible : ${error.message}`);
}

export async function failJob(jobId: string, message: string): Promise<void> {
  await db
    .from('jobs')
    .update({ status: 'failed', error: message, finished_at: new Date().toISOString() })
    .eq('id', jobId);
}
