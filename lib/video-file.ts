import { MAX_SOURCE_FILE_BYTES, MAX_VIDEO_DURATION_MS } from '@/config/constants';

/**
 * Les controles d'un fichier video, avant tout envoi.
 *
 * Partages par l'import d'une nouvelle scene et par le depart d'un pack
 * avec sa propre video : deux copies avaient deja commence a diverger,
 * l'une acceptant deux gigaoctets que le stockage refusait ensuite.
 */

/**
 * Le seul format accepte : le MP4.
 *
 * Le worker savait tout convertir, et on acceptait donc tout. Mais un
 * pack rejoue avec un MP4 ouvre son lobby des l'envoi termine, quand un
 * MKV ou un MOV fait demarrer un GPU pour une conversion d'une minute ou
 * deux. Une seule regle, dite partout : MP4. Le `.mov` n'en fait pas
 * partie — c'est un autre conteneur, que Firefox ne lit pas, et celui des
 * iPhone contient le plus souvent du HEVC que Chrome ne lit pas non plus.
 */
const EXTENSIONS_MP4 = /\.(mp4|m4v)$/i;

/** Ce que propose le selecteur de fichiers. */
export const VIDEO_ACCEPT = 'video/mp4,.mp4,.m4v';

/** Un MP4, a son extension ou a son type. */
export function isVideoFile(file: File): boolean {
  return EXTENSIONS_MP4.test(file.name) || file.type === 'video/mp4';
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

/** Au-dela, on ne lit pas la boite `moov` : ce n'est pas une scene courte. */
const MOOV_MAX_OCTETS = 16 * 1024 * 1024;

async function octets(file: File, debut: number, fin: number): Promise<Uint8Array> {
  return new Uint8Array(await file.slice(debut, fin).arrayBuffer());
}

/**
 * La boite `moov` d'un MP4 : la description des pistes, sans les donnees.
 *
 * On suit les boites de premier niveau par leur taille, sans lire ce qu'il
 * y a entre : les images (`mdat`) peuvent peser des dizaines de mega-octets,
 * et y chercher des mots de quatre lettres donnerait de faux positifs.
 */
async function boiteMoov(file: File): Promise<Uint8Array | null> {
  let position = 0;
  let premiere = true;
  while (position + 8 <= file.size) {
    const entete = await octets(file, position, Math.min(file.size, position + 16));
    const vue = new DataView(entete.buffer, entete.byteOffset, entete.byteLength);
    let taille = vue.getUint32(0);
    const type = String.fromCharCode(entete[4]!, entete[5]!, entete[6]!, entete[7]!);
    if (premiere && type !== 'ftyp') return null;
    premiere = false;

    let longueurEntete = 8;
    if (taille === 1) {
      if (entete.byteLength < 16) return null;
      taille = Number(vue.getBigUint64(8));
      longueurEntete = 16;
    } else if (taille === 0) {
      taille = file.size - position;
    }
    if (taille < longueurEntete) return null;

    if (type === 'moov') {
      return taille > MOOV_MAX_OCTETS ? null : octets(file, position, position + taille);
    }
    position += taille;
  }
  return null;
}

function contient(donnees: Uint8Array, mot: string): number {
  const cible = Array.from(mot, (c) => c.charCodeAt(0));
  for (let i = 0; i + cible.length <= donnees.length; i += 1) {
    let ok = true;
    for (let j = 0; j < cible.length; j += 1) {
      if (donnees[i + j] !== cible[j]) {
        ok = false;
        break;
      }
    }
    if (ok) return i;
  }
  return -1;
}

/**
 * Ce fichier se lit-il tel quel, dans tous les navigateurs ?
 *
 * Vrai pour un MP4 en H.264 8 bits (profils Baseline, Main ou High), avec
 * un son AAC ou sans son : ce que lisent Chrome, Safari et Firefox, sur
 * ordinateur comme sur telephone, et ce que le montage final recopie sans
 * rien reencoder. Une scene de pack peut alors partir sans le worker.
 *
 * Tout le reste passe par la conversion : le HEVC des iPhone, qu'un
 * Chrome sous Windows ne lit pas, l'AV1, le VP9, le 10 bits, le son AC-3
 * des films, et tout ce qui n'est pas un MP4. On lit les pistes decrites
 * dans le fichier plutot que l'extension : un `.mp4` peut contenir
 * n'importe quoi. Dans le doute, la reponse est non — le worker, lui, sait
 * tout lire.
 */
export async function lisibleTelleQuelle(file: File): Promise<boolean> {
  try {
    const mp4 = /\.(mp4|m4v)$/i.test(file.name) || file.type === 'video/mp4';
    if (!mp4 || file.size > MAX_SOURCE_FILE_BYTES) return false;

    const moov = await boiteMoov(file);
    if (!moov) return false;

    const refuses = ['hvc1', 'hev1', 'dvh1', 'dvhe', 'av01', 'vp08', 'vp09', 'mp4v', 'ac-3', 'ec-3', 'Opus', 'fLaC', 'alac', 'lpcm', 'sowt', 'twos'];
    if (refuses.some((code) => contient(moov, code) >= 0)) return false;

    const avcC = contient(moov, 'avcC');
    if (avcC < 0) return false;
    // configurationVersion, puis le profil : 66 Baseline, 77 Main, 100 High.
    const profil = moov[avcC + 5];
    if (profil !== 66 && profil !== 77 && profil !== 100) return false;

    return true;
  } catch {
    return false;
  }
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
