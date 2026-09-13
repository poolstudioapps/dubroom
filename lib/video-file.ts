import { MAX_SOURCE_FILE_BYTES, MAX_VIDEO_DURATION_MS } from '@/config/constants';

/**
 * Les controles d'un fichier video, avant tout envoi.
 *
 * Partages par l'import d'une nouvelle scene et par le depart d'un pack
 * avec sa propre video : deux copies avaient deja commence a diverger,
 * l'une acceptant deux gigaoctets que le stockage refusait ensuite.
 */

/**
 * Les extensions video qu'on reconnait, meme sans type declare.
 *
 * Le worker convertit tout ce que ffmpeg sait lire : le format d'origine
 * n'a pas d'importance. Mais un navigateur ne donne pas de type a un
 * `.mkv`, un `.mts` ou un `.flv`, et les refuser sur ce seul critere
 * faisait croire qu'il fallait un MP4.
 */
const EXTENSIONS_VIDEO =
  /\.(mp4|m4v|mkv|mov|webm|avi|wmv|asf|flv|f4v|mpe?g|mpe|m2v|ts|mts|m2ts|3gp|3g2|ogv|vob|mxf|dv|divx|rm|rmvb)$/i;

/** Ce que propose le selecteur de fichiers. */
export const VIDEO_ACCEPT =
  'video/*,.mkv,.avi,.wmv,.asf,.flv,.f4v,.mts,.m2ts,.ts,.3gp,.3g2,.ogv,.vob,.mxf,.dv,.divx,.rm,.rmvb';

/** Une video, a son type ou a son extension. */
export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/') || EXTENSIONS_VIDEO.test(file.name);
}

/**
 * Lit la duree d'un fichier video sans le televerser (PRD §6.2).
 *
 * Bornee dans le temps : un navigateur qui ne sait pas decoder le format
 * ne declenche parfois ni `loadedmetadata` ni `error`, et la promesse
 * restait suspendue — le bouton d'import ne s'activait jamais.
 */
export function probeDurationMs(file: File, timeoutMs = 8000): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    let fini = false;

    const conclure = (valeur: number | null) => {
      if (fini) return;
      fini = true;
      window.clearTimeout(minuteur);
      URL.revokeObjectURL(url);
      resolve(valeur);
    };
    const minuteur = window.setTimeout(() => conclure(null), timeoutMs);

    video.preload = 'metadata';
    video.onloadedmetadata = () =>
      conclure(Number.isFinite(video.duration) ? video.duration * 1000 : null);
    video.onerror = () => conclure(null);
    video.src = url;
  });
}

export type VideoFileProblem = 'wrongType' | 'tooLarge' | 'tooLong';

/**
 * Ce qui empeche d'importer ce fichier, ou `null`, et sa duree si on a pu
 * la lire.
 *
 * Une duree illisible n'est pas un refus : le worker la mesurera, et
 * bloquer un fichier valide parce que le navigateur ne sait pas le lire
 * serait pire que de laisser passer.
 */
export async function checkVideoFile(
  file: File,
): Promise<{ problem: VideoFileProblem | null; durationMs: number | null }> {
  if (!isVideoFile(file)) return { problem: 'wrongType', durationMs: null };
  if (file.size > MAX_SOURCE_FILE_BYTES) return { problem: 'tooLarge', durationMs: null };
  const durationMs = await probeDurationMs(file);
  if (durationMs && durationMs > MAX_VIDEO_DURATION_MS) {
    return { problem: 'tooLong', durationMs };
  }
  return { problem: null, durationMs };
}
