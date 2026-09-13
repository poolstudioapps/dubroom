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

/** Les trois reflexions de la reverberation, a pleine intensite. */
const REVERB_ECHOS = [
  { ms: 47, decroissance: 0.5 },
  { ms: 71, decroissance: 0.32 },
  { ms: 103, decroissance: 0.2 },
] as const;

export interface TakePlacement {
  /** Index de l'entree ffmpeg correspondante. */
  inputIndex: number;
  /** Instant d'apparition dans la scene, en ms. */
  delayMs: number;
  /** Nombre de ms a retirer en tete quand le decalage rend `delayMs` negatif. */
  trimHeadMs: number;
  /**
   * Correction de niveau, en decibels.
   *
   * Elle rapproche la prise du volume qu'avait la voix d'origine a cet
   * endroit : un joueur qui parle loin du micro ne doit pas disparaitre
   * sous la musique, et celui qui hurle dedans ne doit pas ecraser la
   * scene. Zero laisse la prise telle quelle.
   */
  gainDb?: number;
  /** Reverberation, 0 a 100. */
  reverb?: number;
  /** Transposition en demi-tons, -12 a +12. */
  pitch?: number;
}

export interface VoSegment {
  startMs: number;
  endMs: number;
}

export interface MixGraphInput {
  /** Index de l'entree du stem de fond. Toujours 0. */
  musicInput: number;
  /**
   * Index de l'entree qui porte la bande son d'origine, ou null s'il n'y
   * a aucune VO a conserver.
   *
   * C'etait le stem de voix separee ; c'est desormais le fichier
   * d'origine. La ou personne ne double, il n'y a rien a reconstruire, et
   * une separation rendue telle quelle s'entend.
   */
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
  effets: { gainDb?: number; reverb?: number; pitch?: number } = {},
): TakePlacement {
  const total = windowStartMs + takeOffsetMs + micOffsetMs;
  return {
    inputIndex,
    delayMs: Math.max(0, Math.round(total)),
    trimHeadMs: total < 0 ? Math.round(-total) : 0,
    ...effets,
  };
}

/**
 * La chaine d'effets d'une prise, dans l'ordre ou l'on branche.
 *
 * L'ordre n'est pas decoratif. La hauteur passe en premier parce qu'elle
 * travaille sur la voix seule ; le niveau ensuite, pour que la mesure
 * faite sur la prise brute reste valable ; la reverberation en dernier,
 * parce qu'une salle s'ajoute autour d'une voix deja reglee, jamais
 * avant.
 */
function chaineEffets(take: TakePlacement): string {
  const etapes: string[] = [];

  if (take.pitch && take.pitch !== 0) {
    // `rubberband` attend un rapport de frequences, pas des demi-tons.
    const ratio = Math.pow(2, take.pitch / 12);
    etapes.push(`rubberband=pitch=${ratio.toFixed(5)}`);
  }

  if (take.gainDb && Math.abs(take.gainDb) >= 0.5) {
    etapes.push(`volume=${take.gainDb.toFixed(1)}dB`);
  }

  if (take.reverb && take.reverb > 0) {
    /*
     * Une reverberation en trois reflexions.
     *
     * ffmpeg n'a pas de reverbe a convolution utilisable sans fichier
     * d'empreinte ; trois echos rapproches et decroissants en donnent
     * l'essentiel — la queue et la sensation de volume — pour rien. Le
     * curseur pilote la part de son reflechi, de la voix seche a la
     * grande salle.
     *
     * La voix directe passe a plein niveau. `aecho` multiplie TOUT le
     * signal par son gain de sortie, voix comprise : l'ancien reglage
     * (0,25 a 0,7) faisait perdre jusqu'a douze decibels a une prise des
     * qu'on touchait au curseur. Le gain de sortie ne compense plus que
     * l'energie ajoutee par les echos.
     *
     * Le studio rejoue exactement cette chaine a l'ecoute
     * (`lib/audio/voice-fx.ts`) : garder les deux en accord.
     */
    const part = Math.min(1, take.reverb / 100);
    const echos = REVERB_ECHOS.map((e) => e.decroissance * part);
    const sortie = 1 / Math.sqrt(1 + echos.reduce((s, d) => s + d * d, 0));
    etapes.push(
      `aecho=1:${sortie.toFixed(3)}:${REVERB_ECHOS.map((e) => e.ms).join('|')}:` +
        echos.map((d) => d.toFixed(3)).join('|'),
    );
  }

  return etapes.length > 0 ? `${etapes.join(',')},` : '';
}

export function buildMixGraph(input: MixGraphInput): string {
  const lines: string[] = [];
  const garderVo = input.voiceInput !== null && input.voSegments.length > 0;

  /*
   * Le lit musical se tait pendant la VO.
   *
   * Les passages non doubles sont pris dans la bande son d'origine, qui
   * contient deja sa musique. Sans cette coupure on entendrait la
   * musique deux fois, une fois nette et une fois separee, decalees de
   * rien du tout — ce qui sonne comme un flanger.
   *
   * La coupure est un cran a l'interieur du segment, pour qu'elle tombe
   * pendant le fondu de la VO et non a coté.
   */
  let bed = `[${input.musicInput}:a]`;
  if (garderVo) {
    const fenetres = input.voSegments
      .map((s) => {
        const duree = Math.max(1, s.endMs - s.startMs) / 1000;
        const fade = Math.min(VO_FADE_S, duree / 4);
        return `between(t,${seconds(s.startMs + fade * 1000)},${seconds(s.endMs - fade * 1000)})`;
      })
      .join('+');
    lines.push(`[${input.musicInput}:a]volume=0:enable='${fenetres}'[bed];`);
    bed = '[bed]';
  }

  const mixLabels: string[] = [bed];

  // ── Reinjection de la VO ────────────────────────────────────────────
  // Une entree ffmpeg ne peut etre consommee qu'une fois : il faut
  // dupliquer explicitement la source, une branche par replique.
  if (garderVo) {
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
    const trim =
      take.trimHeadMs > 0
        ? `atrim=start=${seconds(take.trimHeadMs)},asetpts=PTS-STARTPTS,`
        : '';
    lines.push(
      `[${take.inputIndex}:a]${trim}${chaineEffets(take)}` +
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
