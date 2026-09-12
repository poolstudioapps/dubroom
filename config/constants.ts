/**
 * Source unique de tous les seuils du produit (PRD §18).
 * Aucune de ces valeurs ne doit etre recopiee ailleurs dans le code,
 * ni cote front, ni cote worker.
 */

// ── Decoupage (PRD §6.5) ───────────────────────────────────────────────
/** Silence au-dela duquel deux mots d'un meme locuteur forment deux repliques. */
export const LINE_SPLIT_SILENCE_MS = 700;
/** Ecart en dessous duquel deux repliques consecutives fusionnent en un clip. */
export const CLIP_MERGE_GAP_MS = 3_000;
/** Marge de respiration ajoutee avant et apres la fenetre de parole d'un clip. */
export const CLIP_MARGIN_MS = 2_000;

// ── Garde-fous d'ingestion (PRD §6.2) ──────────────────────────────────
export const MAX_VIDEO_DURATION_MS = 600_000; // 10 min
export const MAX_UPLOAD_BYTES = 2_147_483_648; // 2 Go

// ── Studio (PRD §11) ───────────────────────────────────────────────────
/** Bornes du reglage de latence micro, en ms. */
export const MIC_OFFSET_MIN_MS = -300;
export const MIC_OFFSET_MAX_MS = 300;
export const MIC_OFFSET_STEP_MS = 10;
/** Volume par defaut du stem fond pendant l'enregistrement (0..1). */
export const DEFAULT_BACKING_VOLUME = 0.6;
/** Position horizontale de la tete de lecture de la bande rythmo (0..1). */
export const RYTHMO_PLAYHEAD_RATIO = 0.35;
/** Largeur temporelle visible de la bande rythmo, en ms. */
export const RYTHMO_WINDOW_MS = 6_000;
/** Cle localStorage du miroir de mic_offset_ms. */
export const MIC_OFFSET_STORAGE_KEY = 'dubroom.micOffsetMs';
/** Debit vise pour l'encodage des prises. */
export const TAKE_AUDIO_BITS_PER_SECOND = 96_000;
/** Nombre de colonnes de la forme d'onde affichee. */
export const WAVEFORM_BUCKETS = 480;
/**
 * Fenetre de fin de prise inspectee pour detecter un debordement :
 * si le joueur parle encore quand l'enregistrement se coupe, sa phrase
 * est tronquee et il faut le lui dire avant le rendu (PRD §11.5).
 */
export const TAKE_TAIL_CHECK_MS = 250;
/** Au-dessus de ce niveau RMS, on considere qu'il y a du signal. */
export const TAKE_SILENCE_RMS = 0.02;
/**
 * Derive toleree entre la video et le stem de fond avant resynchronisation.
 * La bande rythmo, elle, suit `video.currentTime` sans intermediaire.
 */
export const AUDIO_SYNC_TOLERANCE_MS = 80;

// ── Codes de session (PRD §10.1) ───────────────────────────────────────
/** Alphabet sans caracteres ambigus (ni I, ni O, ni 0, ni 1). */
export const SESSION_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const SESSION_CODE_LENGTH = 6;

// ── File d'attente et worker (PRD §12.1) ───────────────────────────────
/** Au-dela, le front considere qu'aucun worker ne tourne. */
export const WORKER_STALE_MS = 60_000;
/** Periode de rafraichissement des ecrans d'attente. */
export const JOB_POLL_INTERVAL_MS = 2_000;

// ── Stockage (PRD §13.3) ───────────────────────────────────────────────
/** Plafond du plan gratuit Supabase. */
export const STORAGE_QUOTA_BYTES = 1_073_741_824; // 1 Go
/** Seuil d'alerte sur l'espace consomme. */
export const STORAGE_WARN_RATIO = 0.8;
/** Duree de validite des URL signees. */
export const SIGNED_URL_TTL_S = 900; // 15 min

// ── Buckets Storage ────────────────────────────────────────────────────
export const BUCKET_SOURCES = 'sources';
export const BUCKET_TAKES = 'takes';
export const BUCKET_RENDERS = 'renders';

// ── Personnages ────────────────────────────────────────────────────────
/**
 * Tokens semantiques de couleur (PRD §7 : jamais de hex en base).
 * La valeur reelle est resolue par `characterColorVar()` cote front.
 */
export const CHARACTER_COLOR_TOKENS = [
  'character-1',
  'character-2',
  'character-3',
  'character-4',
  'character-5',
  'character-6',
  'character-7',
  'character-8',
] as const;

export type CharacterColorToken = (typeof CHARACTER_COLOR_TOKENS)[number];

/**
 * Les memes couleurs, en dur.
 *
 * Le canvas ne comprend pas les variables CSS : il faut les resoudre, et
 * cette resolution peut echouer — feuille pas encore appliquee, contexte
 * detache, navigateur recalcitrant. Sans repli par personnage, tout le
 * monde retombait sur une seule couleur, voire sur le noir par defaut du
 * canvas : le texte disparaissait. Ces valeurs doivent rester identiques
 * a celles de globals.css.
 */
export const CHARACTER_COLOR_FALLBACK: Record<string, string> = {
  'character-1': '#4da3ff',
  'character-2': '#3ddc84',
  'character-3': '#ffd23f',
  'character-4': '#ff5cb8',
  'character-5': '#35e0e0',
  'character-6': '#ff8a3d',
  'character-7': '#b07cff',
  'character-8': '#b8e534',
};

export function characterColorToken(index: number): CharacterColorToken {
  const token = CHARACTER_COLOR_TOKENS[index % CHARACTER_COLOR_TOKENS.length];
  // CHARACTER_COLOR_TOKENS n'est jamais vide : le fallback n'existe que pour le typage.
  return token ?? 'character-1';
}

/** Variable CSS correspondant a un token de couleur de personnage. */
export function characterColorVar(token: string): string {
  return `var(--color-${token})`;
}

// ── Etapes de job, pour l'affichage de progression (PRD §6.1, §13.1) ──
export const INGEST_STEPS = [
  'download',
  'encode',
  'extract',
  'separate',
  'transcribe',
  'segment',
] as const;

export const RENDER_STEPS = ['fetch', 'mix', 'mux', 'upload', 'purge'] as const;

export type IngestStep = (typeof INGEST_STEPS)[number];
export type RenderStep = (typeof RENDER_STEPS)[number];
