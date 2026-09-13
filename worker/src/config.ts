import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

export const WORKER_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

dotenv.config({ path: path.join(WORKER_ROOT, '.env'), quiet: true });

const isWindows = process.platform === 'win32';

function str(name: string, fallback = ''): string {
  return process.env[name]?.trim() || fallback;
}

function int(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
}

/** Une variable qui contient plusieurs valeurs, virgules ou retours a la ligne. */
function liste(name: string): string[] {
  return str(name)
    .split(/[,\n]/)
    .map((valeur) => valeur.trim())
    .filter(Boolean);
}

/**
 * Resout un chemin de binaire. Tout passe par les variables
 * d'environnement : `.exe` n'apparait nulle part ailleurs que dans le
 * bootstrap et le `.env`, pour que le meme code tourne sur un VPS Linux
 * sans modification (PRD §20.1.10).
 */
function binary(name: string, fallbackName: string): string {
  const configured = str(name);
  if (configured) {
    return path.isAbsolute(configured)
      ? configured
      : path.resolve(WORKER_ROOT, configured);
  }
  return path.join(
    WORKER_ROOT,
    'bin',
    isWindows ? `${fallbackName}.exe` : fallbackName,
  );
}

export const config = {
  supabaseUrl: str('SUPABASE_URL'),
  supabaseServiceKey: str('SUPABASE_SERVICE_ROLE_KEY'),
  elevenLabsKey: str('ELEVENLABS_API_KEY'),

  separationMode: str('SEPARATION_MODE', 'demucs') as 'demucs' | 'elevenlabs',

  workerId: str('WORKER_ID', os.hostname()),

  /*
   * Deux workers se partagent la file, et ne prennent pas la meme chose.
   *
   * `cloud` est l'image Cloud Run. YouTube refuse ses adresses : elle ne
   * prend jamais une tache qui doit telecharger depuis YouTube, et fait
   * tout le reste — fichiers importes, suite des preparations YouTube une
   * fois la video en ligne, rendus.
   *
   * `local` est le PC de l'hote. Il prend tout de suite ce que lui seul
   * peut faire : telecharger. Le reste, il le laisse a Google pendant
   * `cloudGraceSeconds`, puis le prend lui-meme si personne ne l'a fait.
   * C'est le filet quand Google est eteint ou en panne.
   */
  role: (str('WORKER_ROLE', 'local') === 'cloud' ? 'cloud' : 'local') as
    | 'local'
    | 'cloud',
  /**
   * Delai laisse a Google avant que le PC ne prenne sa place.
   *
   * Deux minutes et demie couvrent le demarrage d'un job Cloud Run avec
   * GPU, image comprise. A zero, le PC fait tout lui-meme et ne passe
   * jamais le relais — le fonctionnement d'avant.
   */
  cloudGraceSeconds: int('CLOUD_GRACE_SECONDS', 150),
  workDir: path.isAbsolute(str('WORK_DIR', './work'))
    ? str('WORK_DIR')
    : path.resolve(WORKER_ROOT, str('WORK_DIR', './work')),

  ffmpeg: binary('FFMPEG_PATH', 'ffmpeg'),
  ffprobe: binary('FFPROBE_PATH', 'ffprobe'),
  ytdlp: binary('YTDLP_PATH', 'yt-dlp'),
  /**
   * Clients YouTube a essayer, separes par des virgules.
   *
   * Vide depuis une connexion domestique : le client par defaut y passe
   * sans encombre. Renseigne dans un centre de donnees, ou YouTube
   * oppose son controle anti-robot aux adresses d'hebergeurs.
   */
  ytdlpClients: str('YTDLP_CLIENTS'),
  /**
   * Sorties a essayer pour joindre YouTube, dans l'ordre.
   *
   * YouTube ne juge pas la requete mais l'adresse qui l'emet. Celles de
   * Cloud Run sont connues comme appartenant a un hebergeur, et le
   * controle anti-robot les refuse sans appel. Un intermediaire preste
   * son adresse le temps du telechargement.
   *
   * La liste compte parce que la reputation se calcule adresse par
   * adresse et change sans prevenir : sur dix intermediaires eprouves le
   * meme soir, un seul a livre la video. Le worker les essaie donc l'un
   * apres l'autre, et finit par une tentative directe — la seule qui
   * marche depuis le PC d'un hote, ou aucun intermediaire n'est reglé.
   *
   * Separateur : la virgule, ou un retour a la ligne.
   */
  ytdlpProxies: liste('YTDLP_PROXIES'),
  /**
   * Jeton d'API Webshare, qui donne la liste courante des intermediaires.
   *
   * Preferable a une liste ecrite en dur : le fournisseur renouvelle ses
   * adresses, et une liste figee se perime en silence. Facultatif — sans
   * lui, seules `YTDLP_PROXIES` et la connexion directe sont essayees.
   */
  webshareToken: str('WEBSHARE_TOKEN'),

  python: str('PYTHON_PATH', isWindows ? 'python' : 'python3'),
  demucsModel: str('DEMUCS_MODEL', 'htdemucs'),
  demucsDevice: str('DEMUCS_DEVICE', 'cpu'),
  demucsJobs: str('DEMUCS_JOBS', '2'),
  demucsSegment: str('DEMUCS_SEGMENT', '7'),

  maxVideoDurationMs: int('MAX_VIDEO_DURATION_MS', 300_000),
  maxUploadBytes: int('MAX_UPLOAD_BYTES', 2_147_483_648),
  pollIntervalMs: int('JOB_POLL_INTERVAL_MS', 2_000),

  /*
   * Deux facons de vivre, et elles s'excluent.
   *
   * Sur le PC de l'hote, le worker attend indefiniment : la fenetre
   * reste ouverte et les scenes partent quand elles arrivent.
   *
   * Dans un job Cloud Run, attendre est exactement ce qu'il ne faut pas
   * faire — un job se doit de finir, et on paye le GPU tant qu'il tourne.
   * Il travaille donc tant qu'il y a a faire, puis s'arrete des que la
   * file reste vide un moment. La tache suivante relancera un job.
   */
  exitWhenIdle: str('EXIT_WHEN_IDLE') === '1',
  idleExitPolls: int('IDLE_EXIT_POLLS', 5),

  /*
   * Le controle d'environnement suppose une installation faite par
   * `start.bat` : des binaires dans `worker/bin`, un Python a cote. Dans
   * une image, tout cela vient du `Dockerfile` et se trouve ailleurs.
   */
  skipEnvCheck: str('SKIP_ENV_CHECK') === '1',
  maxAttempts: int('JOB_MAX_ATTEMPTS', 3),
  staleMinutes: int('JOB_STALE_MINUTES', 10),
  maxConcurrentJobs: int('MAX_CONCURRENT_JOBS', 1),
  workRetentionDays: int('WORK_RETENTION_DAYS', 7),
} as const;

/** Timeouts par outil (PRD §20.2). */
export const TIMEOUTS = {
  ffprobe: 60_000,
  encode: 15 * 60_000,
  extract: 10 * 60_000,
  mix: 20 * 60_000,
  mux: 10 * 60_000,
  ytdlp: 5 * 60_000,
  demucs: 30 * 60_000,
  api: 10 * 60_000,
} as const;

export function assertConfig(): void {
  const required: [string, string][] = [
    ['SUPABASE_URL', config.supabaseUrl],
    ['SUPABASE_SERVICE_ROLE_KEY', config.supabaseServiceKey],
    // Scribe est utilise quel que soit le mode de separation, la cle
    // ElevenLabs est donc toujours requise.
    ['ELEVENLABS_API_KEY', config.elevenLabsKey],
  ];

  const missing = required.filter(([, value]) => !value).map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(
      `Configuration incomplete. Renseigne ${[...new Set(missing)].join(', ')} dans worker/.env`,
    );
  }
}
