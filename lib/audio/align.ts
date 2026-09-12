'use client';

import {
  ALIGN_HZ,
  ALIGN_MAX_LAG_MS,
  ALIGN_MIN_CORRELATION,
  ALIGN_MIN_ENERGY,
} from '@/config/constants';

/**
 * Calage automatique d'une prise sur la voix d'origine.
 *
 * Le probleme, en pratique : deux joueurs qui lisent la meme replique ne
 * partent jamais au meme instant. L'un anticipe, l'autre reagit a ce
 * qu'il voit et arrive systematiquement cent a deux cents millisecondes
 * trop tard. Au mixage, cela s'entend tout de suite, et le reglage
 * manuel demande d'ecouter, d'estimer, de recommencer.
 *
 * On a pourtant les deux courbes : l'enveloppe de la voix d'origine,
 * calculee par le worker et transportee avec la scene, et celle de la
 * prise, qu'on calcule ici. Faire glisser l'une sur l'autre et retenir le
 * decalage qui les superpose le mieux donne la reponse directement.
 *
 * C'est une correlation croisee normalisee, sur les enveloppes
 * d'energie et non sur les echantillons : on cherche a faire coincider
 * des attaques et des silences, pas des formes d'onde. Deux voix
 * differentes ne correlent pas au niveau de l'echantillon ; leurs
 * rythmes, si.
 */

export interface Alignment {
  /**
   * Decalage mesure, en millisecondes. Positif : le joueur est en
   * retard sur l'original, il faut avancer sa prise d'autant.
   */
  lagMs: number;
  /** Qualite du pic de correlation, entre 0 et 1. */
  confidence: number;
  /** Vrai si la mesure est assez sure pour etre appliquee seule. */
  reliable: boolean;
}

let ctx: AudioContext | null = null;
function audioContext(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

/**
 * L'enveloppe d'energie d'une prise, au meme pas que celle de la scene.
 *
 * Racine de la moyenne des carres par intervalle : c'est la mesure qui
 * suit ce que l'oreille appelle « il parle ici ».
 */
export async function envelopeFromBlob(
  blob: Blob,
  hz: number = ALIGN_HZ,
): Promise<Float32Array> {
  const decoded = await audioContext().decodeAudioData(await blob.arrayBuffer());
  const samples = decoded.getChannelData(0);
  const step = Math.max(1, Math.round(decoded.sampleRate / hz));
  const count = Math.floor(samples.length / step);
  const out = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    let sum = 0;
    const start = i * step;
    for (let j = start; j < start + step; j += 1) {
      const value = samples[j] ?? 0;
      sum += value * value;
    }
    out[i] = Math.sqrt(sum / step);
  }
  return out;
}

/**
 * Ramene l'enveloppe de la scene au pas de travail, sur une fenetre.
 *
 * Elle arrive echantillonnee a sa propre frequence et couvre la scene
 * entiere ; on en extrait la portion utile, reechantillonnee.
 */
function resampleOriginal(
  envelope: Uint8Array,
  sourceHz: number,
  fromMs: number,
  count: number,
  hz: number,
): Float32Array {
  const out = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    const tMs = fromMs + (i * 1000) / hz;
    const index = Math.round((tMs / 1000) * sourceHz);
    out[i] = index >= 0 && index < envelope.length ? (envelope[index] ?? 0) / 255 : 0;
  }
  return out;
}

/** Centre et normalise : la correlation devient comparable d'un cas a l'autre. */
function normalize(values: Float32Array): { data: Float32Array; norm: number } {
  let mean = 0;
  for (const value of values) mean += value;
  mean /= values.length || 1;

  const data = new Float32Array(values.length);
  let norm = 0;
  for (let i = 0; i < values.length; i += 1) {
    const centered = (values[i] ?? 0) - mean;
    data[i] = centered;
    norm += centered * centered;
  }
  return { data, norm: Math.sqrt(norm) };
}

/**
 * Cherche le decalage qui superpose le mieux la prise et l'original.
 *
 * @param takeEnvelope enveloppe de la prise, au pas `hz`
 * @param original     enveloppe de la scene entiere, telle que transportee
 * @param originalHz   frequence de cette enveloppe
 * @param placedAtMs   instant de la scene ou commence la prise
 */
export function alignTake(
  takeEnvelope: Float32Array,
  original: Uint8Array,
  originalHz: number,
  placedAtMs: number,
  hz: number = ALIGN_HZ,
): Alignment | null {
  if (takeEnvelope.length < hz / 2 || originalHz <= 0) return null;

  // Une prise silencieuse ne se cale sur rien : mieux vaut ne rien dire
  // que de proposer un decalage tire d'un bruit de fond.
  let energy = 0;
  for (const value of takeEnvelope) energy += value * value;
  if (Math.sqrt(energy / takeEnvelope.length) < ALIGN_MIN_ENERGY) return null;

  const take = normalize(takeEnvelope);
  if (take.norm === 0) return null;

  const maxLagSteps = Math.round((ALIGN_MAX_LAG_MS / 1000) * hz);
  const scores = new Map<number, number>();
  let bestScore = -Infinity;
  let bestLag = 0;
  let secondBest = -Infinity;

  for (let lag = -maxLagSteps; lag <= maxLagSteps; lag += 1) {
    // Le joueur en retard de `lag` pas : sa prise ressemble a l'original
    // pris `lag` pas plus tot.
    const fromMs = placedAtMs - (lag * 1000) / hz;
    const slice = resampleOriginal(
      original,
      originalHz,
      fromMs,
      takeEnvelope.length,
      hz,
    );
    const other = normalize(slice);
    if (other.norm === 0) continue;

    let dot = 0;
    for (let i = 0; i < takeEnvelope.length; i += 1) {
      dot += (take.data[i] ?? 0) * (other.data[i] ?? 0);
    }
    const score = dot / (take.norm * other.norm);
    scores.set(lag, score);

    if (score > bestScore) {
      secondBest = bestScore;
      bestScore = score;
      bestLag = lag;
    } else if (score > secondBest) {
      secondBest = score;
    }
  }

  if (!Number.isFinite(bestScore)) return null;

  /*
   * Le pas de travail fait quarante millisecondes ; s'arreter au pas le
   * plus proche laisse jusqu'a vingt millisecondes d'erreur, ce qui
   * s'entend encore sur une attaque. La vraie pointe de correlation est
   * entre deux pas : une parabole passee par le pic et ses deux voisins
   * la situe, sans calculer un seul pas de plus.
   */
  const gauche = scores.get(bestLag - 1);
  const droite = scores.get(bestLag + 1);
  let affine = bestLag;
  if (gauche !== undefined && droite !== undefined) {
    const denominateur = gauche - 2 * bestScore + droite;
    if (denominateur !== 0) {
      const ecart = (0.5 * (gauche - droite)) / denominateur;
      if (Math.abs(ecart) <= 1) affine = bestLag + ecart;
    }
  }

  const lagMs = Math.round((affine * 1000) / hz);
  // Un pic net se detache du reste. Un pic mou veut dire que plusieurs
  // decalages se valent, et appliquer le premier venu serait un coup de
  // des : on le signale au lieu de l'imposer.
  const margin = Number.isFinite(secondBest) ? bestScore - secondBest : 0;

  return {
    lagMs,
    confidence: Math.max(0, Math.min(1, bestScore)),
    reliable: bestScore >= ALIGN_MIN_CORRELATION && margin >= 0,
  };
}
