import type { HomeDemo, HomeDemoLine } from '@/lib/home-demo-types';
import { supabaseServer } from '@/lib/supabase/server';

/** L'identifiant d'une video YouTube, quelle que soit la forme du lien. */
function identifiantYoutube(url: string): string | null {
  const m = /(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/)([\w-]{11})/.exec(url);
  return m?.[1] ?? null;
}

interface Brut {
  source_url?: string;
  duration_ms?: number;
  characters?: { key: string; name: string; color: string }[];
  lines?: {
    start: number;
    end: number;
    text: string;
    character: string;
    words: { w: string; start_ms: number; end_ms: number }[] | null;
  }[];
}

/**
 * La scene de demonstration, ou rien.
 *
 * Rien n'est une reponse valable : sans scene designee, ou si la base ne
 * repond pas, la vitrine retombe sur sa demonstration ecrite. L'accueil
 * ne doit jamais echouer parce qu'une decoration n'a pas pu se charger.
 */
export async function loadHomeDemo(): Promise<HomeDemo | null> {
  try {
    const db = await supabaseServer();
    const { data, error } = await db.rpc('home_demo');
    if (error || !data) return null;

    const brut = data as Brut;
    const videoId = brut.source_url ? identifiantYoutube(brut.source_url) : null;
    if (!videoId || !brut.lines?.length) return null;

    const lines: HomeDemoLine[] = brut.lines.map((l) => ({
      start: l.start,
      end: l.end,
      text: l.text,
      character: l.character,
      // Une replique sans horodatage par mot se lit d'un bloc : on la
      // traite comme un seul mot qui dure toute la replique.
      words: l.words?.length ? l.words : [{ w: l.text, start_ms: l.start, end_ms: l.end }],
    }));

    return {
      videoId,
      durationMs: brut.duration_ms ?? 0,
      characters: brut.characters ?? [],
      lines,
    };
  } catch {
    return null;
  }
}
