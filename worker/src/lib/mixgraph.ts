/**
 * Construction du filtergraph de mixage (PRD §12.2 et §12.3).
 *
 * Fonction pure : elle ne touche ni au disque ni a la base. C'est
 * volontaire — c'est la piece la plus facile a casser du worker, et la
 * seule qu'on puisse verifier en lisant sa sortie.
 *
 * Quatre points, chacun casse le rendu s'il est rate :
 *  1. `normalize=0` — sinon amix divise le gain par le nombre d'entrees
 *     et vingt prises deviennent inaudibles.
 *  2. `adelay=X:all=1` et non `adelay=X|X` — les prises sont mono, la
 *     syntaxe a pipes suppose de connaitre le nombre de canaux.
 *  3. `duration=first` — le mix doit faire exactement la duree du fond,
 *     sinon une prise qui deborde allonge l'audio par rapport a l'image.
 *  4. `loudnorm` AVANT `alimiter` — l'inverse annulerait le travail du
 *     limiteur, qui doit rester le dernier maillon.
 */

/** Fondu applique aux bords d'un segment de VO reinjecte, en secondes. */
const VO_FADE_S = 0.05;

export interface TakePlacement {
  /** Index de l'entree ffmpeg correspondante. */
  inputIndex: number;
  /** Instant d'apparition dans la scene, en ms. */
  delayMs: number;
  /** Nombre de ms a retirer en tete quand le decalage rend `delayMs` negatif. */
  trimHeadMs: number;
}

export interface VoSegment {
  startMs: number;
  endMs: number;
}

export interface MixGraphInput {
  /** Index de l'entree du stem de fond. Toujours 0. */
  musicInput: number;
  /** Index de l'entree du stem voix, ou null si aucune VO a reinjecter. */
  voiceInput: number | null;
  /** Repliques dont la VO doit etre conservee (personnages liberes, repliques supprimees). */
  voSegments: VoSegment[];
  takes: TakePlacement[];
}

function seconds(ms: number): string {
  return (ms / 1000).toFixed(3);
}

/**
 * Calcule le placement d'une prise.
 *
 * Le decalage total peut etre negatif si le clip commence au tout debut
 * de la scene et que le joueur a regle un `mic_offset_ms` negatif :
 * `adelay` n'accepte pas de valeur negative, on rogne alors la tete de
 * la prise d'autant.
 */
export function placeTake(
  windowStartMs: number,
  takeOffsetMs: number,
  micOffsetMs: number,
  inputIndex: number,
): TakePlacement {
  const total = windowStartMs + takeOffsetMs + micOffsetMs;
  return {
    inputIndex,
    delayMs: Math.max(0, Math.round(total)),
    trimHeadMs: total < 0 ? Math.round(-total) : 0,
  };
}

export function buildMixGraph(input: MixGraphInput): string {
  const lines: string[] = [];
  const mixLabels: string[] = [`[${input.musicInput}:a]`];

  // ── Reinjection de la VO ────────────────────────────────────────────
  // Une entree ffmpeg ne peut etre consommee qu'une fois : il faut
  // dupliquer explicitement le stem voix, une branche par replique.
  if (input.voiceInput !== null && input.voSegments.length > 0) {
    const count = input.voSegments.length;
    const splitOutputs = input.voSegments.map((_, i) => `[vsrc${i}]`).join('');
    lines.push(`[${input.voiceInput}:a]asplit=${count}${splitOutputs};`);

    input.voSegments.forEach((segment, i) => {
      const durationMs = Math.max(1, segment.endMs - segment.startMs);
      // Le fondu ne peut pas etre plus long que le quart du segment,
      // sinon les deux fondus se recouvrent et la replique disparait.
      const fade = Math.min(VO_FADE_S, durationMs / 1000 / 4);
      const fadeOutStart = Math.max(0, durationMs / 1000 - fade);

      lines.push(
        `[vsrc${i}]atrim=start=${seconds(segment.startMs)}:end=${seconds(segment.endMs)},` +
          `asetpts=PTS-STARTPTS,` +
          `aresample=48000,aformat=channel_layouts=stereo,` +
          `afade=t=in:st=0:d=${fade.toFixed(3)},` +
          `afade=t=out:st=${fadeOutStart.toFixed(3)}:d=${fade.toFixed(3)},` +
          // adelay est en millisecondes ; atrim et afade en secondes.
          // Melanger les deux est l'erreur classique.
          `adelay=${Math.round(segment.startMs)}:all=1[vo${i}];`,
      );
      mixLabels.push(`[vo${i}]`);
    });
  }

  // ── Prises des joueurs ──────────────────────────────────────────────
  input.takes.forEach((take, i) => {
    const trim = take.trimHeadMs > 0 ? `atrim=start=${seconds(take.trimHeadMs)},asetpts=PTS-STARTPTS,` : '';
    lines.push(
      `[${take.inputIndex}:a]${trim}` +
        `aresample=48000,aformat=channel_layouts=stereo,` +
        `adelay=${take.delayMs}:all=1[t${i}];`,
    );
    mixLabels.push(`[t${i}]`);
  });

  // ── Somme ───────────────────────────────────────────────────────────
  // Les prises peuvent se chevaucher librement, entre elles et entre
  // personnages : c'est le comportement voulu, jamais une troncature.
  lines.push(
    `${mixLabels.join('')}amix=inputs=${mixLabels.length}:normalize=0:duration=first[mixed];`,
  );
  lines.push(`[mixed]loudnorm=I=-16:TP=-1.5:LRA=11,alimiter=limit=0.97[out]`);

  return lines.join('\n');
}
