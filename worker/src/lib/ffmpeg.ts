import fs from 'node:fs/promises';
import path from 'node:path';

import { TIMEOUTS, config } from '../config.ts';
import { SystemError, UserError } from '../errors.ts';
import { run } from './run.ts';

export interface Probe {
  durationMs: number;
  audioStreamCount: number;
  hasVideo: boolean;
  width: number | null;
  height: number | null;
}

/** Inspecte la source avant tout traitement (PRD §20.3). */
/**
 * Duree d'un fichier audio, ou `null` s'il est illisible.
 *
 * Sert a ecarter les prises vides avant le mixage : un fichier WebM
 * reduit a son entete — cela arrive quand le micro n'a rien rendu — fait
 * echouer ffmpeg, et avec lui tout le rendu de la soiree. Autant le
 * constater ici et passer au suivant.
 */
export async function audioDurationMs(input: string): Promise<number | null> {
  try {
    const { stdout } = await run(
      config.ffprobe,
      [
        '-v',
        'error',
        '-select_streams',
        'a:0',
        '-show_entries',
        'format=duration',
        '-of',
        'default=nw=1:nk=1',
        input,
      ],
      { timeoutMs: TIMEOUTS.ffprobe },
    );
    const ms = Math.round(parseFloat(stdout.trim()) * 1000);
    return Number.isFinite(ms) && ms > 0 ? ms : null;
  } catch {
    return null;
  }
}

export async function probe(input: string): Promise<Probe> {
  const { stdout } = await run(
    config.ffprobe,
    ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', input],
    { timeoutMs: TIMEOUTS.ffprobe },
  );

  let parsed: {
    format?: { duration?: string };
    streams?: { codec_type?: string; width?: number; height?: number }[];
  };
  try {
    parsed = JSON.parse(stdout);
  } catch (error) {
    throw new SystemError('Sortie ffprobe illisible', { cause: error });
  }

  const streams = parsed.streams ?? [];
  const video = streams.find((s) => s.codec_type === 'video');
  const audioStreamCount = streams.filter((s) => s.codec_type === 'audio').length;
  const durationMs = Math.round(parseFloat(parsed.format?.duration ?? '0') * 1000);

  if (!video) throw new UserError('Ce fichier ne contient pas de vidéo.');
  if (audioStreamCount === 0) {
    throw new UserError('Ce fichier ne contient pas de piste audio.');
  }
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    throw new UserError('Impossible de lire la durée de ce fichier.');
  }
  if (durationMs > config.maxVideoDurationMs) {
    throw new UserError(
      `Scène trop longue (${Math.round(durationMs / 60000)} min, maximum ${Math.round(
        config.maxVideoDurationMs / 60000,
      )} min).`,
    );
  }

  return {
    durationMs,
    audioStreamCount,
    hasVideo: true,
    width: video.width ?? null,
    height: video.height ?? null,
  };
}

/**
 * Lance ffmpeg en suivant sa progression (PRD §20.4).
 *
 * La sortie est ecrite dans un fichier temporaire puis renommee : un
 * ffmpeg tue en cours de route laisse sinon un MP4 corrompu qui a l'air
 * valide, et le job suivant le reprendrait tel quel.
 */
async function ffmpeg(
  args: string[],
  output: string,
  opts: {
    durationMs?: number;
    onProgress?: (pct: number) => void;
    timeoutMs: number;
  },
): Promise<void> {
  // Le marqueur `.part` s'insere AVANT l'extension : ffmpeg choisit son
  // conteneur d'apres elle, et `mix.wav.part` le laisserait sans format.
  const extension = path.extname(output);
  const temp = `${output.slice(0, output.length - extension.length)}.part${extension}`;
  await fs.rm(temp, { force: true });

  await run(
    config.ffmpeg,
    [
      '-hide_banner',
      '-nostats',
      '-progress',
      'pipe:1',
      ...args,
      // -y sinon ffmpeg attend une confirmation au clavier et le job
      // reste bloque jusqu'au timeout.
      '-y',
      temp,
    ],
    {
      timeoutMs: opts.timeoutMs,
      onStdout: (chunk) => {
        if (!opts.durationMs || !opts.onProgress) return;
        for (const line of chunk.split('\n')) {
          const [key, value] = line.trim().split('=');
          // out_time_us est en microsecondes ; out_time_ms l'est aussi,
          // historiquement, d'ou le choix sans ambiguite.
          if (key === 'out_time_us' && value) {
            const pct = Math.min(
              99,
              Math.round((Number(value) / 1000 / opts.durationMs) * 100),
            );
            if (Number.isFinite(pct) && pct >= 0) opts.onProgress(pct);
          }
        }
      },
    },
  );

  await fs.rename(temp, output);
}

/**
 * Normalisation (PRD §6.2).
 *
 * Le mapping explicite n'est pas optionnel : un rip de film contient
 * souvent plusieurs pistes audio (VF, VO, commentaires) et des
 * sous-titres. Sans lui, ffmpeg en choisit une selon ses heuristiques.
 */
export async function normalize(
  input: string,
  output: string,
  durationMs: number,
  onProgress: (pct: number) => void,
): Promise<void> {
  await ffmpeg(
    [
      '-i',
      input,
      '-map',
      '0:v:0',
      '-map',
      '0:a:0',
      '-sn',
      '-dn',
      '-vf',
      "scale='min(1280,iw)':-2",
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '23',
      '-profile:v',
      'high',
      '-level',
      '4.0',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-ar',
      '48000',
      '-ac',
      '2',
    ],
    output,
    { durationMs, onProgress, timeoutMs: TIMEOUTS.encode },
  );
}

/** WAV 48 kHz stereo 16 bits, reference pour toute la suite. */
export async function extractAudio(input: string, output: string): Promise<void> {
  await ffmpeg(
    ['-i', input, '-vn', '-acodec', 'pcm_s16le', '-ar', '48000', '-ac', '2'],
    output,
    { timeoutMs: TIMEOUTS.extract },
  );
}

/**
 * Decode une prise en WAV mono, pret pour un traitement fait ici.
 *
 * 44,1 kHz et non 48 : la detection de hauteur travaille par decalages
 * entiers d'echantillons, et descendre la frequence rapproche les crans
 * sans rien couter — la voix ne monte de toute facon pas au-dela de
 * mille hertz.
 */
export async function decodeTakeToWav(input: string, output: string): Promise<void> {
  await ffmpeg(
    ['-i', input, '-vn', '-acodec', 'pcm_s16le', '-ar', '44100', '-ac', '1'],
    output,
    {
      timeoutMs: TIMEOUTS.extract,
    },
  );
}

/**
 * Niveau moyen d'un passage, en decibels, ou `null` s'il est muet.
 *
 * `volumedetect` rend la moyenne quadratique sur ce qu'on lui donne :
 * c'est la mesure qui correspond a ce qu'on entend comme « fort » ou
 * « faible », a la difference du pic, qu'un seul claquement suffit a
 * fausser.
 */
export async function meanVolumeDb(
  input: string,
  startMs?: number,
  endMs?: number,
): Promise<number | null> {
  const decoupe: string[] = [];
  if (startMs !== undefined) decoupe.push('-ss', (startMs / 1000).toFixed(3));
  if (startMs !== undefined && endMs !== undefined) {
    decoupe.push('-t', (Math.max(1, endMs - startMs) / 1000).toFixed(3));
  }

  try {
    const { stderr } = await run(
      config.ffmpeg,
      [
        '-hide_banner',
        '-nostdin',
        ...decoupe,
        '-i',
        input,
        '-map',
        '0:a:0',
        '-af',
        'volumedetect',
        '-f',
        'null',
        '-',
      ],
      { timeoutMs: TIMEOUTS.extract },
    );
    const trouve = stderr.match(/mean_volume:\s*(-?\d+(?:\.\d+)?) dB/);
    if (!trouve) return null;
    const db = Number(trouve[1]);
    // -91 dB est ce que rend volumedetect sur du silence numerique.
    return Number.isFinite(db) && db > -80 ? db : null;
  } catch {
    return null;
  }
}

/**
 * Downmix mono 16 kHz, uniquement pour l'envoi a Scribe : six fois plus
 * leger a televerser, sans perte utile pour la reconnaissance. Le stem
 * voix 48 kHz reste la reference pour le mixage (PRD §20.8).
 */
export async function downmixForStt(input: string, output: string): Promise<void> {
  await ffmpeg(['-i', input, '-ac', '1', '-ar', '16000'], output, {
    timeoutMs: TIMEOUTS.extract,
  });
}

/**
 * Version compressee du stem de fond, pour le studio.
 *
 * Le navigateur rejoue ce fichier a chaque prise et a chaque reecoute,
 * pour chaque joueur. Servir le WAV 48 kHz (~35 Mo par minute) viderait
 * les 2 Go de bande passante mensuels en une soiree (PRD §13.3) — alors
 * que l'AAC 96 kbps est indistinguable comme simple repere rythmique.
 * Le WAV reste la reference du mixage.
 */
export async function encodeBackingPreview(
  input: string,
  output: string,
): Promise<void> {
  await ffmpeg(
    [
      '-i',
      input,
      '-c:a',
      'aac',
      '-b:a',
      '96k',
      '-ar',
      '48000',
      '-ac',
      '2',
      '-movflags',
      '+faststart',
    ],
    output,
    { timeoutMs: TIMEOUTS.extract },
  );
}

/**
 * Stem compresse, pour archivage dans un pack.
 *
 * Un pack conserve la scene preparee pour qu'un autre groupe la rejoue.
 * Garder les stems en WAV coute 59 Mo pour deux minutes, soit dix-sept
 * packs dans le gigaoctet gratuit ; en AAC 128 kbps on tombe a treize, ce
 * qui en met soixante-quinze. Le mixage final reencode de toute facon en
 * AAC : la difference ne s'entend pas sur une piste de fond destinee a
 * etre recouverte de voix.
 */
export async function encodeStemForPack(input: string, output: string): Promise<void> {
  await ffmpeg(
    [
      '-i',
      input,
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-ar',
      '48000',
      '-ac',
      '2',
      '-movflags',
      '+faststart',
    ],
    output,
    { timeoutMs: TIMEOUTS.extract },
  );
}

/**
 * Stem sans perte, pour le stockage de session.
 *
 * Supabase refuse tout objet de plus de 50 Mo, et un WAV 48 kHz stereo
 * pese 192 Ko par seconde : la limite tombait a 4 min 20 de scene, sur
 * un maximum autorise de dix minutes. Autant dire qu'une scene sur deux
 * echouait a l'envoi.
 *
 * Le FLAC divise le poids par pres de quatre — 53 Mo tombent a 14 sur
 * une piste mesuree — sans perdre un echantillon. Ce n'est pas une
 * approximation : les deux decodages rendent la meme empreinte MD5.
 *
 * Cette exactitude est la raison du choix. Le mixage aligne les prises
 * des joueurs au millier de microsecondes pres, et un format a perte
 * comme l'AAC introduit un decalage d'encodage au debut du flux. C'est
 * sans consequence sur une preview qu'on ecoute seule, cela n'en a pas
 * ici.
 */
export async function encodeStemLossless(
  input: string,
  output: string,
): Promise<void> {
  await ffmpeg(
    [
      '-i',
      input,
      '-c:a',
      'flac',
      // Le niveau 8 gagne quelques pourcents sur le 5 par defaut, pour
      // un encodage qui reste bien plus rapide que la separation qui le
      // precede : la depense ne se voit pas.
      '-compression_level',
      '8',
      '-ar',
      '48000',
      '-ac',
      '2',
    ],
    output,
    { timeoutMs: TIMEOUTS.extract },
  );
}

/** Reechantillonne un stem en 48 kHz stereo (PRD §20.7). */
export async function resample48k(input: string, output: string): Promise<void> {
  await ffmpeg(['-i', input, '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le'], output, {
    timeoutMs: TIMEOUTS.extract,
  });
}

/**
 * Deux orthographes pour la meme chose, selon l'age de ffmpeg :
 * `-filter_complex_script` a ete remplace par `-/filter_complex` et
 * n'existe plus depuis ffmpeg 8. Plutot que de deduire la syntaxe d'un
 * numero de version — qui ne dit rien des builds systeme de Debian ou de
 * Homebrew — on essaie la moderne, et on retombe sur l'ancienne si
 * ffmpeg ne la connait pas. Le resultat est memorise pour la suite.
 */
const FILTER_SCRIPT_FLAGS = ['-/filter_complex', '-filter_complex_script'] as const;
let resolvedFilterFlag: string | null = null;

function isUnknownOption(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('Unrecognized option') ||
    message.includes('Option not found') ||
    message.includes('Unknown option')
  );
}

/**
 * Mixage a partir d'un filtergraph ecrit dans un fichier (PRD §20.5).
 *
 * Avec une vingtaine de clips et autant de segments VO, la ligne de
 * commande depasse les 8191 caracteres de cmd.exe. Le fichier est
 * conserve dans WORK_DIR : c'est la seule piece a conviction exploitable
 * quand un mixage part de travers.
 */
export async function mixWithGraph(
  inputs: string[],
  graph: string,
  graphPath: string,
  output: string,
  durationMs: number,
  onProgress: (pct: number) => void,
): Promise<void> {
  await fs.writeFile(graphPath, graph, 'utf8');

  const candidates = resolvedFilterFlag
    ? [resolvedFilterFlag]
    : [...FILTER_SCRIPT_FLAGS];
  let lastError: unknown = null;

  for (const flag of candidates) {
    try {
      await ffmpeg(
        [
          ...inputs.flatMap((file) => ['-i', file]),
          flag,
          graphPath,
          '-map',
          '[out]',
          '-c:a',
          'pcm_s16le',
        ],
        output,
        { durationMs, onProgress, timeoutMs: TIMEOUTS.mix },
      );
      resolvedFilterFlag = flag;
      return;
    } catch (error) {
      if (!isUnknownOption(error)) throw error;
      lastError = error;
    }
  }

  throw (
    lastError ?? new SystemError('Aucune syntaxe de filtergraph acceptée par ffmpeg.')
  );
}

/**
 * Mux final (PRD §12.4). La video est copiee sans reencodage : c'est
 * tout l'interet d'avoir normalise a l'ingestion.
 *
 * `-shortest` est un garde-fou : si le mix depasse la video de quelques
 * ms, certains lecteurs affichent un ecran noir en fin de fichier.
 */
export async function muxFinal(
  video: string,
  audio: string,
  output: string,
  durationMs: number,
  onProgress: (pct: number) => void,
): Promise<void> {
  await ffmpeg(
    [
      '-i',
      video,
      '-i',
      audio,
      '-map',
      '0:v:0',
      '-map',
      '1:a:0',
      '-shortest',
      '-c:v',
      'copy',
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-movflags',
      '+faststart',
    ],
    output,
    { durationMs, onProgress, timeoutMs: TIMEOUTS.mux },
  );
}

/**
 * La meme scene, debout.
 *
 * Un rendu se partage aujourd'hui sur des ecrans tenus a la verticale,
 * et une video 16/9 y occupe un bandeau au milieu de rien. On en tire
 * donc une seconde version au format 9/16, recadree au centre.
 *
 * Recadrer, pas redimensionner : on garde la hauteur entiere et on prend
 * la largeur qu'il faut au milieu de l'image. Une scene de dialogue y
 * survit — les visages sont au centre — mais un plan large y perd ses
 * bords, et c'est la contrepartie assumee du format.
 *
 * L'audio est recopie tel quel : c'est le meme mixage, il n'y a aucune
 * raison de le reencoder une seconde fois.
 *
 * En 720 × 1280, et avec un debit plafonne d'apres la duree. En 1080p a
 * qualite libre, la version verticale pesait deux fois la version large :
 * sur une scene de quatre minutes et demie elle depassait les 50 Mo que
 * le stockage accepte par fichier, et n'etait jamais envoyee. Le plafond
 * vise 46 Mo quelle que soit la duree ; une scene courte reste en
 * qualite pleine, le plafond ne mord que sur les longues.
 */
export async function muxVertical(
  input: string,
  output: string,
  durationMs: number,
  onProgress: (pct: number) => void,
): Promise<void> {
  const TAILLE_VISEE_KBIT = 46 * 8 * 1024;
  const AUDIO_KBPS = 192;
  const secondes = Math.max(1, durationMs / 1000);
  const videoKbps = Math.max(
    500,
    Math.min(4000, Math.floor(TAILLE_VISEE_KBIT / secondes) - AUDIO_KBPS),
  );

  await ffmpeg(
    [
      '-i',
      input,
      '-vf',
      // `min` protege le cas d'une source deja verticale : on ne
      // recadre alors rien, on se contente de la mettre a l'echelle.
      //
      // Le decalage se calcule sur `ow`, la largeur deja retenue, et non
      // en repetant `min(iw,ih*9/16)` : cette virgule-la n'etait pas entre
      // guillemets, ffmpeg y coupait la chaine de filtres, et aucune
      // version verticale n'etait jamais produite.
      "crop='min(iw,ih*9/16)':ih:(iw-ow)/2:0," +
        'scale=720:1280:flags=lanczos:force_original_aspect_ratio=decrease,' +
        'pad=720:1280:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1',
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '23',
      '-maxrate',
      `${videoKbps}k`,
      '-bufsize',
      `${videoKbps * 2}k`,
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'copy',
      '-movflags',
      '+faststart',
    ],
    output,
    { durationMs, onProgress, timeoutMs: TIMEOUTS.mux },
  );
}

/** Deux secondes de silence, pour prechauffer Demucs (PRD §20.1.6). */
export async function generateSilence(output: string, seconds = 2): Promise<void> {
  await run(
    config.ffmpeg,
    [
      '-hide_banner',
      '-f',
      'lavfi',
      '-i',
      'anullsrc=r=44100:cl=stereo',
      '-t',
      String(seconds),
      '-y',
      output,
    ],
    { timeoutMs: 60_000 },
  );
}

export function graphPathFor(workDir: string): string {
  return path.join(workDir, 'graph.txt');
}
