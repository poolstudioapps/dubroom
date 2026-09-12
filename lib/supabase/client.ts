'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

let cached: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Client navigateur. Une seule instance par onglet : Realtime ouvre une
 * websocket, en creer une par composant ferait diverger les abonnements
 * du lobby.
 */
export function supabaseBrowser() {
  if (!cached) {
    cached = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return cached;
}
