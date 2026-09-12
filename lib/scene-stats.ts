import type {
  CharacterRow,
  ClipRow,
  LineRow,
  TakeRow,
} from '@/lib/supabase/database.types';

export interface CharacterStats {
  lineCount: number;
  clipCount: number;
  /** Somme des durees de parole, marges exclues. */
  speakMs: number;
  /** Replique la plus longue : la meilleure pour identifier une voix. */
  longestLine: LineRow | null;
}

export function statsByCharacter(
  characters: CharacterRow[],
  lines: LineRow[],
  clips: ClipRow[],
): Map<string, CharacterStats> {
  const map = new Map<string, CharacterStats>();
  for (const character of characters) {
    map.set(character.id, {
      lineCount: 0,
      clipCount: 0,
      speakMs: 0,
      longestLine: null,
    });
  }

  for (const line of lines) {
    // Une replique supprimee ne compte ni en temps de parole ni en clips :
    // seule sa VO sera reinjectee au mixage.
    if (line.is_deleted) continue;
    const stats = map.get(line.character_id);
    if (!stats) continue;
    stats.lineCount += 1;
    stats.speakMs += Math.max(0, line.end_ms - line.start_ms);
    const duration = line.end_ms - line.start_ms;
    const bestDuration = stats.longestLine
      ? stats.longestLine.end_ms - stats.longestLine.start_ms
      : -1;
    if (duration > bestDuration) stats.longestLine = line;
  }

  for (const clip of clips) {
    const stats = map.get(clip.character_id);
    if (stats) stats.clipCount += 1;
  }

  return map;
}

/** Clips d'un joueur, tous personnages confondus, dans l'ordre de passage. */
export function clipsForParticipant(
  participantId: string,
  characters: CharacterRow[],
  clips: ClipRow[],
): ClipRow[] {
  const mine = new Set(
    characters.filter((c) => c.assigned_to === participantId).map((c) => c.id),
  );
  return clips
    .filter((clip) => mine.has(clip.character_id))
    .sort((a, b) => a.window_start_ms - b.window_start_ms);
}

/** Prise retenue par clip. */
export function selectedTakeByClip(takes: TakeRow[]): Map<string, TakeRow> {
  const map = new Map<string, TakeRow>();
  for (const take of takes) {
    if (take.is_selected) map.set(take.clip_id, take);
  }
  return map;
}

export interface PlayerProgress {
  participantId: string;
  done: number;
  total: number;
}

/** Avancement de chaque joueur : clips valides / clips assignes. */
export function progressByParticipant(
  characters: CharacterRow[],
  clips: ClipRow[],
  takes: TakeRow[],
): Map<string, PlayerProgress> {
  const selected = selectedTakeByClip(takes);
  const result = new Map<string, PlayerProgress>();

  for (const clip of clips) {
    const character = characters.find((c) => c.id === clip.character_id);
    if (!character?.assigned_to) continue;

    const entry = result.get(character.assigned_to) ?? {
      participantId: character.assigned_to,
      done: 0,
      total: 0,
    };
    entry.total += 1;
    if (selected.has(clip.id)) entry.done += 1;
    result.set(character.assigned_to, entry);
  }

  return result;
}
