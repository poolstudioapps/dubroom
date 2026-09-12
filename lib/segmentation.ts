import { LINE_SPLIT_SILENCE_MS } from '../config/constants';

/**
 * Regroupement des mots en repliques (PRD §6.5).
 *
 * Cote clips, le decoupage vit en SQL (`recompute_clips`) parce qu'il est
 * rejoue a chaque correction de l'hote. Cote repliques, il n'est calcule
 * qu'une fois, a l'ingestion : il vit donc ici, et le worker est son seul
 * appelant.
 */

export interface TimedWord {
  text: string;
  startMs: number;
  endMs: number;
  speaker: string;
}

export interface DraftLine {
  speaker: string;
  startMs: number;
  endMs: number;
  text: string;
  words: { w: string; start_ms: number; end_ms: number }[];
}

export function groupWordsIntoLines(
  words: TimedWord[],
  silenceMs: number = LINE_SPLIT_SILENCE_MS,
): DraftLine[] {
  const lines: DraftLine[] = [];
  let current: DraftLine | null = null;

  for (const word of words) {
    const breaks =
      !current ||
      current.speaker !== word.speaker ||
      word.startMs - current.endMs > silenceMs;

    if (breaks) {
      if (current) lines.push(current);
      current = {
        speaker: word.speaker,
        startMs: word.startMs,
        endMs: word.endMs,
        text: word.text,
        words: [{ w: word.text, start_ms: word.startMs, end_ms: word.endMs }],
      };
      continue;
    }

    // `breaks` couvre deja le cas `current === null`, mais l'analyse de
    // flot ne le voit pas a travers le `continue`.
    if (!current) continue;
    const line: DraftLine = current;
    line.endMs = Math.max(line.endMs, word.endMs);
    line.text = `${line.text} ${word.text}`;
    line.words.push({ w: word.text, start_ms: word.startMs, end_ms: word.endMs });
  }

  if (current) lines.push(current);
  return lines;
}

/**
 * Ordre d'apparition des locuteurs. Les personnages sont crees dans cet
 * ordre et nommes « Personnage 1 », « Personnage 2 »… (PRD §20.8).
 */
export function speakersInOrder(lines: DraftLine[]): string[] {
  const seen: string[] = [];
  for (const line of lines) {
    if (!seen.includes(line.speaker)) seen.push(line.speaker);
  }
  return seen;
}
