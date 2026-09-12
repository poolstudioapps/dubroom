import type { SessionStatus } from '@/lib/supabase/database.types';

/** Ecran canonique d'une session, deduit de son statut (PRD §8). */
export type SceneScreen = 'ingest' | 'prepare' | 'lobby' | 'studio' | 'render' | 'result';

export function screenForStatus(
  status: SessionStatus,
  isHost: boolean,
): SceneScreen {
  switch (status) {
    case 'draft':
    case 'ingest_queued':
    case 'ingesting':
    case 'ingest_failed':
      return 'ingest';
    case 'prepping':
      // Les joueurs n'ont rien a faire sur l'ecran de preparation :
      // ils patientent sur l'ecran d'ingestion, qui sait aussi dire
      // « l'hote prepare la scene ».
      return isHost ? 'prepare' : 'ingest';
    case 'lobby':
      return 'lobby';
    case 'recording':
      return 'studio';
    case 'render_queued':
    case 'rendering':
    case 'render_failed':
      return 'render';
    case 'done':
      return 'result';
  }
}

export function sceneHref(code: string, screen: SceneScreen): string {
  return `/s/${code}/${screen}`;
}
