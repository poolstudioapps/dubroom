/**
 * Recalage de la voix sur les notes justes.
 *
 * ffmpeg sait transposer (`rubberband`) mais pas corriger : transposer,
 * c'est deplacer toutes les notes du meme intervalle, alors que corriger
 * c'est ramener chaque note a la plus proche de la gamme. La difference
 * est exactement ce qu'on entend dans une reprise : le premier rend la
 * voix grave ou aigue, le second la rend juste — et, pousse a fond,
 * donne le timbre metallique qu'on cherche sur un refrain.
 *
 * L'algorithme est le classique, en trois temps :
 *
 *  1. DETECTER. Autocorrelation sur une fenetre : on cherche le decalage
 *     qui ressemble le plus au signal lui-meme, c'est la periode. Limite
 *     a la voix humaine, 80 a 1000 Hz.
 *  2. VISER. La note juste la plus proche, en demi-tons depuis La 440.
 *     La force melange entre la note chantee et la note visee : a 40 on
 *     corrige un peu, a 100 on colle.
 *  3. DEPLACER. Chaque grain est reechantillonne par le rapport voulu et
 *     replace au meme endroit, fenetre de Hann et recouvrement de trois
 *     quarts. Le grain change de hauteur, la duree ne bouge pas.
 *
 * Les passages non voises — consonnes, souffle, silences — sortent
 * intacts : les corriger produirait des sifflements sur les « s ».
 */

const TAILLE = 1024;
const SAUT = TAILLE / 4;
const F0_MIN = 80;
const F0_MAX = 1000;
/** En deca, la fenetre est du souffle ou du silence : on n'y touche pas. */
const SEUIL_RMS = 0.004;
/** Confiance minimale de l'autocorrelation pour croire a une note. */
const SEUIL_CLARTE = 0.35;

/** Fenetre de Hann, calculee une fois. */
const HANN = (() => {
  const w = new Float32Array(TAILLE);
  for (let i = 0; i < TAILLE; i += 1) {
    w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (TAILLE - 1));
  }
  return w;
})();

/**
 * La frequence fondamentale d'une fenetre, ou `null` si elle n'en a pas.
 *
 * Autocorrelation normalisee : on compare le signal a lui-meme decale.
 * Le premier maximum franc au-dela du decalage nul donne la periode. La
 * valeur de ce maximum sert de mesure de confiance — un bruit ne
 * ressemble a rien, pas meme a lui-meme.
 */
export function detecterF0(
  trame: Float32Array,
  sampleRate: number,
): { hz: number; clarte: number } | null {
  let energie = 0;
  for (let i = 0; i < trame.length; i += 1) energie += trame[i]! * trame[i]!;
  const rms = Math.sqrt(energie / trame.length);
  if (rms < SEUIL_RMS) return null;

  const decalageMin = Math.floor(sampleRate / F0_MAX);
  const decalageMax = Math.min(trame.length - 1, Math.ceil(sampleRate / F0_MIN));

  const correlation = new Float32Array(decalageMax + 1);
  let maximum = 0;

  for (let lag = decalageMin; lag <= decalageMax; lag += 1) {
    let somme = 0;
    let normeA = 0;
    let normeB = 0;
    for (let i = 0; i + lag < trame.length; i += 1) {
      const a = trame[i]!;
      const b = trame[i + lag]!;
      somme += a * b;
      normeA += a * a;
      normeB += b * b;
    }
    const norme = Math.sqrt(normeA * normeB);
    const valeur = norme > 0 ? somme / norme : 0;
    correlation[lag] = valeur;
    if (valeur > maximum) maximum = valeur;
  }

  if (maximum < SEUIL_CLARTE) return null;

  /*
   * La periode la plus courte, pas la mieux notee.
   *
   * Une voix est pleine d'harmoniques, et le signal se ressemble tout
   * autant a une periode qu'a deux ou trois. Prendre simplement le
   * maximum faisait donc entendre 453 Hz comme 151 : une octave et une
   * quinte trop bas, et la correction envoyait la note a l'autre bout du
   * clavier. On retient le premier sommet franc en partant des periodes
   * courtes, ce qui est la vraie fondamentale.
   */
  const seuil = maximum * 0.9;
  let meilleur = -1;
  for (let lag = decalageMin + 1; lag < decalageMax; lag += 1) {
    const v = correlation[lag]!;
    if (v >= seuil && v >= correlation[lag - 1]! && v >= correlation[lag + 1]!) {
      meilleur = lag;
      break;
    }
  }
  if (meilleur < 0) return null;

  /*
   * Un decalage est un nombre entier d'echantillons, donc une hauteur
   * par paliers : a 440 Hz et 44 100 Hz d'echantillonnage, un cran vaut
   * dix Hz. On interpole sur les trois points autour du sommet pour
   * retrouver la fraction, sans quoi la correction viserait juste a
   * partir d'une mesure fausse.
   */
  const avant = correlation[meilleur - 1]!;
  const ici = correlation[meilleur]!;
  const apres = correlation[meilleur + 1]!;
  const denominateur = avant - 2 * ici + apres;
  const fraction =
    Math.abs(denominateur) > 1e-9 ? (0.5 * (avant - apres)) / denominateur : 0;
  const periode = meilleur + Math.max(-0.5, Math.min(0.5, fraction));

  return { hz: sampleRate / periode, clarte: ici };
}

/** La note juste la plus proche, en Hz. La 440 comme reference. */
export function noteLaPlusProche(hz: number): number {
  const demiTons = Math.round(12 * Math.log2(hz / 440));
  return 440 * Math.pow(2, demiTons / 12);
}

/**
 * Applique le recalage a un signal mono.
 *
 * `force` va de 0 — on ne touche a rien — a 1, ou chaque note est posee
 * exactement sur la sienne. Rend un nouveau tableau ; l'entree n'est pas
 * modifiee.
 *
 * La methode est celle des studios : on decoupe la voix en grains longs
 * de deux periodes, et on les REPOSE plus serres pour monter, plus
 * espaces pour descendre. C'est l'ecartement des grains qui fait la
 * hauteur, et le fait de lire l'entree a son propre rythme qui conserve
 * la duree.
 *
 * Une premiere version reechantillonnait chaque grain sur place, ce qui
 * semble revenir au meme et ne marche pas : tous les grains repartant du
 * meme endroit, la somme retrouvait la periode de depart et la voix
 * ressortait inchangee. Ce qui compte n'est pas le contenu du grain,
 * c'est l'intervalle qui separe deux grains.
 */
export function autotune(
  entree: Float32Array,
  sampleRate: number,
  force: number,
): Float32Array {
  const melange = Math.max(0, Math.min(1, force));
  if (melange === 0) return entree;

  const n = entree.length;
  const sortie = new Float32Array(n);
  const poids = new Float32Array(n);
  const trame = new Float32Array(TAILLE);

  // ── 1. La hauteur, fenetre par fenetre ──────────────────────────────
  // Mesuree une fois pour toutes : la detection est la partie chere, et
  // la boucle de synthese repasse plusieurs fois au meme endroit.
  const nombre = Math.max(1, Math.ceil(n / SAUT));
  const periodes = new Float32Array(nombre);
  const rapports = new Float32Array(nombre);

  for (let k = 0; k < nombre; k += 1) {
    const debut = Math.min(k * SAUT, Math.max(0, n - TAILLE));
    if (debut + TAILLE > n) break;
    for (let i = 0; i < TAILLE; i += 1) trame[i] = entree[debut + i]!;

    const trouve = detecterF0(trame, sampleRate);
    if (!trouve) continue;

    const cible = noteLaPlusProche(trouve.hz);
    const rapport = Math.pow(cible / trouve.hz, melange);
    // Au-dela d'un demi-ton et demi, la detection s'est trompee
    // d'octave : corriger la ferait chanter faux pour de bon.
    if (rapport > 1.09 || rapport < 0.917) continue;

    periodes[k] = sampleRate / trouve.hz;
    rapports[k] = rapport;
  }

  /*
   * Deux horloges, et c'est tout le sujet.
   *
   * La premiere marque l'ENTREE : un repere par periode, cale sur la
   * voix. La seconde parcourt la SORTIE et avance d'une periode divisee
   * par le rapport voulu. A chaque repere de sortie on va chercher le
   * repere d'entree le plus proche dans le temps, et on y prend un grain.
   *
   * Confondre les deux — lire la ou l'on ecrit — laissait la voix
   * exactement comme elle etait : chaque grain rapportait la phase de
   * son origine, et la somme retrouvait la periode de depart. C'est en
   * decollant la lecture du placement que la hauteur change, et c'est en
   * les faisant avancer au meme rythme moyen que la duree ne bouge pas.
   */
  const periodeA = (index: number): { p: number; r: number } => {
    const k = Math.max(0, Math.min(nombre - 1, Math.round(index / SAUT)));
    const periode = periodes[k]!;
    return periode > 0 ? { p: periode, r: rapports[k]! } : { p: SAUT, r: 1 };
  };

  // ── 2. Les reperes de l'entree, un par periode ──────────────────────
  const reperes: number[] = [];
  for (let t = 0; t < n;) {
    reperes.push(Math.round(t));
    t += periodeA(t).p;
  }

  // ── 3. Les grains, reposes au nouvel ecartement ─────────────────────
  let idx = 0;
  for (let tOut = 0; tOut < n;) {
    const { p, r } = periodeA(tOut);

    // Le repere d'entree le plus proche de l'instant courant. Le
    // pointeur ne recule jamais : les deux horloges avancent ensemble.
    while (
      idx + 1 < reperes.length &&
      Math.abs(reperes[idx + 1]! - tOut) <= Math.abs(reperes[idx]! - tOut)
    ) {
      idx += 1;
    }

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

    // C'est ici que la hauteur se joue : des grains plus serres sonnent
    // plus aigu, plus espaces plus grave.
    tOut += Math.max(1, p / r);
  }

  // Le recouvrement n'est pas uniforme quand l'ecartement change : on
  // divise par la somme des fenetres reellement posees, sinon la voix
  // ondulerait en volume au rythme des grains.
  for (let i = 0; i < n; i += 1) {
    const w = poids[i]!;
    sortie[i] = w > 1e-6 ? sortie[i]! / w : entree[i]!;
  }

  return sortie;
}
