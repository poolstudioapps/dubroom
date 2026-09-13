/**
 * La console de voix, rejouee dans le navigateur.
 *
 * Les effets ne sont poses qu'au mixage, par ffmpeg, et « Ma prise »
 * faisait entendre la voix brute : on reglait une reverbe sans l'entendre,
 * et on la decouvrait au rendu. On rejoue donc ici la meme chaine, dans le
 * meme ordre, sur la prise decodee :
 *
 *   justesse et hauteur → gain → reverberation
 *
 * La reverberation et le gain sont ceux du mixage, a l'echantillon pres
 * (voir `worker/src/lib/mixgraph.ts`). La hauteur est une approximation :
 * le mixage utilise `rubberband`, ici on repose les grains de voix a la
 * maniere de la correction de justesse du worker. L'oreille s'y retrouve,
 * et c'est ce qui compte pour choisir un reglage.
 *
 * Rien ne tourne en continu : on calcule un tampon quand on appuie sur
 * lecture ou qu'on lache un curseur, et on le joue.
 */

/** Frequence de travail. Assez pour la voix, deux fois moins cher que 48 kHz. */
export const ECOUTE_HZ = 32_000;

export interface VoiceSettings {
  /** 0 a 100. */
  reverb: number;
  /** Demi-tons, -12 a +12. */
  pitch: number;
  /** 0 a 100. */
  tune: number;
  /** Decibels, -12 a +12. */
  gainDb: number;
}

/** Les trois reflexions du mixage, a pleine intensite. */
const REVERB_ECHOS = [
  { ms: 47, decroissance: 0.5 },
  { ms: 71, decroissance: 0.32 },
  { ms: 103, decroissance: 0.2 },
] as const;

/** Pas d'analyse, en echantillons a `ECOUTE_HZ`. */
const SAUT = 256;
/** Fenetre de detection, sur le signal decime par deux. */
const FENETRE = 512;
const F0_MIN = 80;
const F0_MAX = 1000;
const SEUIL_RMS = 0.004;
const SEUIL_CLARTE = 0.35;

/** Decode une prise en mono, a la frequence de travail. */
export async function decoderPrise(blob: Blob): Promise<Float32Array> {
  const donnees = await blob.arrayBuffer();
  // Un contexte hors ligne decode ET reechantillonne a sa propre frequence.
  const ctx = new OfflineAudioContext(1, 1, ECOUTE_HZ);
  const audio = await ctx.decodeAudioData(donnees);
  if (audio.numberOfChannels === 1) return audio.getChannelData(0).slice();

  const mono = new Float32Array(audio.length);
  for (let c = 0; c < audio.numberOfChannels; c += 1) {
    const canal = audio.getChannelData(c);
    for (let i = 0; i < mono.length; i += 1) mono[i]! += canal[i]! / audio.numberOfChannels;
  }
  return mono;
}

export interface AnalyseHauteur {
  /** Periode par fenetre, en echantillons ; 0 si la fenetre n'est pas voisee. */
  periodes: Float32Array;
  /** Rapport entre la note juste la plus proche et la note chantee. */
  justesse: Float32Array;
}

/**
 * La hauteur de la voix, fenetre par fenetre.
 *
 * C'est la partie chere : on la fait une fois par prise, en rendant la
 * main au navigateur regulierement pour que les curseurs restent fluides.
 * La detection travaille sur le signal decime par deux, ce qui divise le
 * cout par quatre sans rien changer a la voix humaine.
 */
export async function analyserHauteur(
  samples: Float32Array,
  signal?: AbortSignal,
): Promise<AnalyseHauteur> {
  const hzD = ECOUTE_HZ / 2;
  const decime = new Float32Array(Math.floor(samples.length / 2));
  for (let i = 0; i < decime.length; i += 1) {
    decime[i] = (samples[2 * i]! + samples[2 * i + 1]!) / 2;
  }

  const nombre = Math.max(1, Math.ceil(samples.length / SAUT));
  const periodes = new Float32Array(nombre);
  const justesse = new Float32Array(nombre).fill(1);
  const correlation = new Float32Array(Math.ceil(hzD / F0_MIN) + 2);

  for (let k = 0; k < nombre; k += 1) {
    if (k % 80 === 0) {
      await new Promise((r) => setTimeout(r, 0));
      if (signal?.aborted) throw new DOMException('Analyse interrompue', 'AbortError');
    }
    const debut = (k * SAUT) / 2;
    if (debut + FENETRE > decime.length) break;

    const hz = detecter(decime, debut, hzD, correlation);
    if (!hz) continue;
    periodes[k] = ECOUTE_HZ / hz;
    const note = 440 * Math.pow(2, Math.round(12 * Math.log2(hz / 440)) / 12);
    justesse[k] = note / hz;
  }

  return { periodes, justesse };
}

function detecter(
  d: Float32Array,
  debut: number,
  hz: number,
  correlation: Float32Array,
): number {
  let energie = 0;
  for (let i = 0; i < FENETRE; i += 1) energie += d[debut + i]! * d[debut + i]!;
  if (Math.sqrt(energie / FENETRE) < SEUIL_RMS) return 0;

  const lagMin = Math.floor(hz / F0_MAX);
  const lagMax = Math.min(Math.ceil(hz / F0_MIN), FENETRE / 2);
  let maximum = 0;
  for (let lag = lagMin - 1; lag <= lagMax + 1; lag += 1) {
    let produit = 0;
    let e1 = 0;
    let e2 = 0;
    for (let i = 0; i < FENETRE - lag; i += 1) {
      const a = d[debut + i]!;
      const b = d[debut + i + lag]!;
      produit += a * b;
      e1 += a * a;
      e2 += b * b;
    }
    const v = produit / Math.sqrt(e1 * e2 + 1e-12);
    correlation[lag] = v;
    if (lag >= lagMin && lag <= lagMax && v > maximum) maximum = v;
  }
  if (maximum < SEUIL_CLARTE) return 0;

  // Le premier sommet franc, pas le plus haut : le plus haut tombe souvent
  // sur l'octave du dessous, ce qui ferait chanter faux la correction.
  const seuil = Math.max(SEUIL_CLARTE, maximum * 0.9);
  for (let lag = lagMin; lag <= lagMax; lag += 1) {
    const v = correlation[lag]!;
    if (v >= seuil && v >= correlation[lag - 1]! && v >= correlation[lag + 1]!) {
      const avant = correlation[lag - 1]!;
      const apres = correlation[lag + 1]!;
      const den = avant - 2 * v + apres;
      const fraction = Math.abs(den) > 1e-9 ? (0.5 * (avant - apres)) / den : 0;
      return hz / (lag + Math.max(-0.5, Math.min(0.5, fraction)));
    }
  }
  return 0;
}

/**
 * Repose les grains de voix a un nouvel ecartement.
 *
 * Meme principe que la correction de justesse du worker : l'entree est
 * lue a son rythme, et c'est l'intervalle entre deux grains poses en
 * sortie qui fait la hauteur. La duree ne bouge donc pas.
 */
function transposer(
  entree: Float32Array,
  analyse: AnalyseHauteur,
  demiTons: number,
  force: number,
): Float32Array {
  const n = entree.length;
  const sortie = new Float32Array(n);
  const poids = new Float32Array(n);
  const transposition = Math.pow(2, demiTons / 12);
  const nombre = analyse.periodes.length;

  const periodeA = (index: number): { p: number; r: number } => {
    const k = Math.max(0, Math.min(nombre - 1, Math.round(index / SAUT)));
    const periode = analyse.periodes[k]!;
    if (periode <= 0) return { p: SAUT, r: 1 };
    let juste = force > 0 ? Math.pow(analyse.justesse[k]!, force) : 1;
    // Au-dela d'un demi-ton et demi, la detection s'est trompee d'octave.
    if (juste > 1.09 || juste < 0.917) juste = 1;
    return { p: periode, r: juste * transposition };
  };

  const reperes: number[] = [];
  for (let t = 0; t < n; ) {
    reperes.push(Math.round(t));
    t += periodeA(t).p;
  }

  let idx = 0;
  for (let tOut = 0; tOut < n; ) {
    const { p, r } = periodeA(tOut);
    while (
      idx + 1 < reperes.length &&
      Math.abs(reperes[idx + 1]! - tOut) <= Math.abs(reperes[idx]! - tOut)
    ) {
      idx += 1;
    }

    // Des grains de deux periodes, quel que soit l'ecartement. Les
    // allonger pour boucher les trous en descendant recollait des
    // periodes entieres bout a bout : la voix ressortait a sa hauteur.
    const demi = Math.max(2, Math.round(p));
    const longueur = demi * 2;
    const centreEntree = reperes[idx]!;
    const centreSortie = Math.round(tOut);

    for (let i = 0; i < longueur; i += 1) {
      const source = centreEntree - demi + i;
      const cible = centreSortie - demi + i;
      if (source < 0 || source >= n || cible < 0 || cible >= n) continue;
      const fenetre = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (longueur - 1));
      sortie[cible]! += entree[source]! * fenetre;
      poids[cible]! += fenetre;
    }

    tOut += Math.max(1, p / r);
  }

  /*
   * On ne divise que la ou les grains se chevauchent a plus de un.
   *
   * En montant, ils s'empilent et la voix gonflerait. En descendant, ils
   * s'espacent et laissent de courts creux : ce sont eux qui font
   * entendre la note plus grave. Les combler avec l'entree — ce que fait
   * la correction de justesse, ou l'ecartement bouge a peine — y
   * reinjectait la hauteur d'origine.
   */
  for (let i = 0; i < n; i += 1) {
    const w = poids[i]!;
    if (w > 1) sortie[i] = sortie[i]! / w;
  }
  return sortie;
}

/** A-t-on besoin de l'analyse de hauteur pour ces reglages ? */
export function demandeAnalyse(s: VoiceSettings): boolean {
  return s.pitch !== 0 || s.tune > 0;
}

/**
 * La prise telle que le mixage la posera, effets compris.
 *
 * `analyse` peut manquer tant qu'elle se calcule : on rend alors la voix
 * sans changement de hauteur, avec le gain et la reverberation.
 */
export function rendreVoix(
  brut: Float32Array,
  analyse: AnalyseHauteur | null,
  s: VoiceSettings,
): Float32Array {
  let voix = brut;
  if (demandeAnalyse(s) && analyse) {
    voix = transposer(brut, analyse, s.pitch, Math.min(1, s.tune / 100));
  }

  const gain = Math.pow(10, (s.gainDb || 0) / 20);
  const part = Math.min(1, Math.max(0, s.reverb) / 100);

  if (part === 0) {
    if (gain === 1) return voix;
    const sortie = new Float32Array(voix.length);
    for (let i = 0; i < voix.length; i += 1) sortie[i] = voix[i]! * gain;
    return sortie;
  }

  // `aecho=1:sortie:47|71|103:d1|d2|d3`, comme au mixage.
  const echos = REVERB_ECHOS.map((e) => ({
    decalage: Math.round((e.ms / 1000) * ECOUTE_HZ),
    niveau: e.decroissance * part,
  }));
  const niveauSortie = 1 / Math.sqrt(1 + echos.reduce((s2, e) => s2 + e.niveau * e.niveau, 0));
  const queue = echos[echos.length - 1]!.decalage;
  const sortie = new Float32Array(voix.length + queue);
  for (let i = 0; i < sortie.length; i += 1) {
    let v = i < voix.length ? voix[i]! : 0;
    for (const e of echos) {
      const j = i - e.decalage;
      if (j >= 0 && j < voix.length) v += voix[j]! * e.niveau;
    }
    sortie[i] = v * niveauSortie * gain;
  }
  return sortie;
}

/** Une cle stable pour ne pas recalculer deux fois le meme reglage. */
export function cleReglages(s: VoiceSettings): string {
  return `${s.reverb}|${s.pitch}|${s.tune}|${s.gainDb}`;
}
