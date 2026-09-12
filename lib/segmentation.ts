/**
 * Regroupement des mots en repliques (PRD §6.5).
 *
 * Cote clips, le decoupage vit en SQL (`recompute_clips`) parce qu'il est
 * rejoue a chaque correction de l'hote. Cote repliques, il n'est calcule
 * qu'une fois, a l'ingestion : il vit donc ici, et le worker est son seul
 * appelant.
 *
 * Ce fichier n'importe RIEN, et c'est deliberé. Il est lu par deux
 * mondes qui ne resolvent pas les chemins de la meme facon : le
 * compilateur de l'application, qui accepte une importation sans
 * extension, et le worker dans son conteneur, qui la refuse. Une seule
 * ligne `import ... from '../config/constants'` a suffi a faire tomber
 * le worker au demarrage, avec une erreur qui ne designait pas la vraie
 * cause. Le seuil de silence est donc passe par l'appelant, qui lui sait
 * ou vivent les constantes.
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
  /** Silence a partir duquel deux mots ne sont plus la meme replique. */
  silenceMs: number,
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

/**
 * Decoupe une enveloppe en passages chantes.
 *
 * Le mode chanson ne passe pas par la transcription : sur une voix
 * chantee, la reconnaissance rend surtout des syllabes etirees et des
 * onomatopees, pour un cout par minute qui n'a aucune contrepartie —
 * celui qui reprend une chanson connait les paroles.
 *
 * Reste a savoir QUAND chanter, et l'enveloppe le dit deja : elle mesure
 * l'energie de la voix separee, vingt fois par seconde. Un passage
 * au-dessus du seuil est un passage chante ; un creux assez long le
 * termine.
 *
 * Les repliques rendues n'ont pas de texte, et c'est normal : la bande
 * rythmo montrera la place a tenir et le moment d'entrer, sans mots.
 */
export interface VoicedSpan {
  startMs: number;
  endMs: number;
}

export function spansFromEnvelope(
  peaks: Uint8Array,
  hz: number,
  options: {
    /** Part du maximum au-dela de laquelle on considere qu'on chante. */
    seuil?: number;
    /** Creux minimal pour couper, en ms. */
    silenceMs?: number;
    /** Passage trop court pour valoir une entree, en ms. */
    minimumMs?: number;
  } = {},
): VoicedSpan[] {
  const { seuil = 0.12, silenceMs = 700, minimumMs = 400 } = options;
  if (hz <= 0 || peaks.length === 0) return [];

  const msParPas = 1000 / hz;
  const plancher = 255 * seuil;
  const creuxMax = Math.round(silenceMs / msParPas);

  const spans: VoicedSpan[] = [];
  let debut = -1;
  let creux = 0;

  for (let i = 0; i < peaks.length; i += 1) {
    const chante = (peaks[i] ?? 0) >= plancher;

    if (chante) {
      if (debut < 0) debut = i;
      creux = 0;
      continue;
    }

    if (debut < 0) continue;
    creux += 1;
    // On ne coupe pas au premier silence : une respiration au milieu
    // d'une phrase chantee ne fait pas deux entrees.
    if (creux >= creuxMax) {
      spans.push({
        startMs: Math.round(debut * msParPas),
        endMs: Math.round((i - creux + 1) * msParPas),
      });
      debut = -1;
      creux = 0;
    }
  }

  if (debut >= 0) {
    spans.push({
      startMs: Math.round(debut * msParPas),
      endMs: Math.round(peaks.length * msParPas),
    });
  }

  return spans.filter((s) => s.endMs - s.startMs >= minimumMs);
}
