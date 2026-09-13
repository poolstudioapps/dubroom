/**
 * Les effets de voix, calcules a l'identique au studio et au rendu.
 *
 * L'ecoute du studio et le mixage du worker utilisaient deux chaines
 * differentes — des grains de voix reposes d'un cote, `rubberband` et
 * `aecho` de l'autre — et on reglait un effet qui ne sonnait pas pareil
 * au rendu. Ce module est la seule implementation : le studio l'appelle
 * sur la prise decodee, le worker sur la prise decodee aussi, et ce qu'on
 * entend dans « Ma prise » est ce qui sort dans la video.
 *
 * Aucune dependance, aucun acces au navigateur ni au disque : des
 * echantillons en entree, des canaux en sortie.
 */

export interface VoiceFx {
  /** Demi-tons, de -12 a +12. */
  pitch: number;
  /** De 0 a 100. */
  reverb: number;
}

export const PITCH_LIMIT = 12;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Faut-il toucher a la prise ? */
export function demandeTraitement(fx: VoiceFx): boolean {
  return Math.round(fx.pitch) !== 0 || fx.reverb > 0;
}

/**
 * La prise avec ses effets : pitch, puis reverb.
 *
 * Un canal sans reverb, deux avec : la voix reste au centre, et c'est la
 * salle autour d'elle qui s'ouvre a gauche et a droite.
 */
export function traiterVoix(entree: Float32Array, sampleRate: number, fx: VoiceFx): Float32Array[] {
  const transposee = transposer(entree, sampleRate, fx.pitch);
  return reverberer(transposee, sampleRate, fx.reverb);
}

// ── Pitch ─────────────────────────────────────────────────────────────

/** Fenetre de Hann periodique : a 50 % de recouvrement, sa somme vaut 1. */
function hann(n: number): Float32Array {
  const w = new Float32Array(n);
  for (let i = 0; i < n; i += 1) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / n);
  return w;
}

/**
 * Allonge ou raccourcit la voix sans changer sa hauteur (WSOLA).
 *
 * On pose des tranches de quarante millisecondes a un rythme regulier en
 * sortie, en les prenant en entree a un autre rythme. Chaque tranche est
 * cherchee autour de sa place theorique la ou elle prolonge le mieux la
 * precedente : c'est ce qui evite les battements et la voix hachee des
 * methodes plus simples.
 */
function etirer(x: Float32Array, sampleRate: number, facteur: number): Float32Array {
  const n = 2 * Math.round((sampleRate * 0.04) / 2);
  const pasSortie = n / 2;
  const pasEntree = pasSortie / facteur;
  const tolerance = Math.round(sampleRate * 0.012);
  const fenetre = hann(n);
  const longueur = Math.max(1, Math.round(x.length * facteur));
  const y = new Float32Array(longueur + n);
  const poids = new Float32Array(longueur + n);

  let precedent = -1;
  for (let k = 0; k * pasSortie < longueur; k += 1) {
    const sortie = k * pasSortie;
    const nominal = Math.min(x.length - 1, Math.round(k * pasEntree));
    let debut = Math.max(0, nominal);

    if (precedent >= 0) {
      const naturel = precedent + pasSortie;
      const bas = Math.max(0, nominal - tolerance);
      const haut = Math.min(x.length - pasSortie, nominal + tolerance);
      if (naturel + pasSortie <= x.length && bas <= haut) {
        let meilleur = -Infinity;
        for (let c = bas; c <= haut; c += 2) {
          let score = 0;
          for (let i = 0; i < pasSortie; i += 3) score += x[naturel + i]! * x[c + i]!;
          if (score > meilleur) {
            meilleur = score;
            debut = c;
          }
        }
      }
    }

    for (let i = 0; i < n; i += 1) {
      const j = debut + i;
      if (j >= x.length) break;
      y[sortie + i]! += x[j]! * fenetre[i]!;
      poids[sortie + i]! += fenetre[i]!;
    }
    precedent = debut;
  }

  for (let i = 0; i < longueur; i += 1) {
    const p = poids[i]!;
    if (p > 0.1) y[i] = y[i]! / p;
  }
  return y.subarray(0, longueur);
}

/** Passe-bas du second ordre, pour ne pas replier les aigus en montant. */
function passeBas(x: Float32Array, sampleRate: number, coupure: number): Float32Array {
  const w0 = (2 * Math.PI * Math.min(coupure, sampleRate * 0.49)) / sampleRate;
  const alpha = Math.sin(w0) / (2 * Math.SQRT1_2);
  const cos = Math.cos(w0);
  const a0 = 1 + alpha;
  const b0 = (1 - cos) / 2 / a0;
  const b1 = (1 - cos) / a0;
  const a1 = (-2 * cos) / a0;
  const a2 = (1 - alpha) / a0;
  const y = new Float32Array(x.length);
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  for (let i = 0; i < x.length; i += 1) {
    const v = x[i]!;
    const s = b0 * v + b1 * x1 + b0 * x2 - a1 * y1 - a2 * y2;
    x2 = x1;
    x1 = v;
    y2 = y1;
    y1 = s;
    y[i] = s;
  }
  return y;
}

/**
 * Change la hauteur de la voix, sans changer sa duree.
 *
 * La voix est d'abord etiree du rapport voulu, puis relue plus vite ou
 * plus lentement : la duree revient a l'identique et la hauteur, elle,
 * a bouge. Tout le signal est transpose, souffles et consonnes compris —
 * c'est ce qui manquait a l'ancienne methode, qui ne deplacait que les
 * sons voises et laissait le reste a sa hauteur.
 */
export function transposer(x: Float32Array, sampleRate: number, demiTons: number): Float32Array {
  const st = clamp(Math.round(demiTons), -PITCH_LIMIT, PITCH_LIMIT);
  if (st === 0 || x.length === 0) return x;
  const rapport = Math.pow(2, st / 12);

  let etire = etirer(x, sampleRate, rapport);
  if (rapport > 1) etire = passeBas(etire, sampleRate, (sampleRate * 0.45) / rapport);

  const sortie = new Float32Array(x.length);
  for (let i = 0; i < sortie.length; i += 1) {
    const position = i * rapport;
    const a = Math.floor(position);
    const f = position - a;
    const v0 = etire[a] ?? 0;
    const v1 = etire[a + 1] ?? v0;
    sortie[i] = v0 + (v1 - v0) * f;
  }
  return sortie;
}

// ── Reverb ────────────────────────────────────────────────────────────

/** Longueurs des filtres en peigne et passe-tout, a 44,1 kHz (Freeverb). */
const PEIGNES = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
const PASSE_TOUT = [556, 441, 341, 225];
/** Le canal droit a des filtres un peu plus longs : c'est ce qui ouvre l'espace. */
const ECART_STEREO = 23;

/**
 * Les premieres reflexions : les murs proches, avant la queue.
 * [delai en ms, gain, canal] — alternees, pour que la salle ait des cotes.
 */
const REFLEXIONS: readonly [number, number, 0 | 1][] = [
  [7, 0.62, 0],
  [11, 0.56, 1],
  [16, 0.48, 0],
  [23, 0.42, 1],
  [31, 0.34, 0],
  [41, 0.28, 1],
  [53, 0.21, 0],
  [67, 0.15, 1],
];

/** Filtre du premier ordre : `passeHaut` retire le grave, sinon le laisse seul. */
function premierOrdre(x: Float32Array, sampleRate: number, coupure: number, passeHaut: boolean) {
  const a = Math.exp((-2 * Math.PI * coupure) / sampleRate);
  const y = new Float32Array(x.length);
  let bas = 0;
  for (let i = 0; i < x.length; i += 1) {
    bas = (1 - a) * x[i]! + a * bas;
    y[i] = passeHaut ? x[i]! - bas : bas;
  }
  return y;
}

function energie(x: Float32Array): number {
  let somme = 0;
  for (let i = 0; i < x.length; i += 1) somme += x[i]! * x[i]!;
  return somme;
}

interface Ligne {
  tampon: Float32Array;
  i: number;
  filtre: number;
}

function lignes(longueurs: number[], ecart: number, echelle: number): Ligne[] {
  return longueurs.map((l) => ({
    tampon: new Float32Array(Math.max(1, Math.round((l + ecart) * echelle))),
    i: 0,
    filtre: 0,
  }));
}

/**
 * Une vraie salle, en stereo.
 *
 * Trois etages. D'abord la voix est adoucie avant d'entrer dans la salle :
 * sans son grave, qui faisait gronder la queue, ni ses sifflantes, qui la
 * rendaient metallique — la voix directe, elle, reste intacte. Puis les
 * premieres reflexions, qui disent la taille de la piece. Enfin la queue,
 * huit filtres en peigne amortis et quatre passe-tout par canal (la
 * structure de Freeverb), le canal droit legerement decale du gauche.
 *
 * L'echelle du curseur a ete divisee par deux : 100 vaut ce que 50 valait
 * dans la premiere version, ou le maximum noyait la voix. Le son reflechi
 * monte en douceur depuis zero, sans marche au premier cran.
 */
export function reverberer(x: Float32Array, sampleRate: number, montant: number): Float32Array[] {
  const p = clamp(montant, 0, 100) / 100;
  if (p <= 0 || x.length === 0) return [x];

  const echelle = sampleRate / 44100;
  const salle = 0.8 + 0.085 * p;
  const amorti = 0.3 - 0.06 * p;
  const preDelai = Math.round(sampleRate * (0.01 + 0.015 * p));

  // La queue dure le temps que les peignes perdent soixante decibels.
  const delaiMoyen = 1350 / 44100;
  const rt60 = (3 * delaiMoyen) / -Math.log10(salle);
  const queue = Math.round(sampleRate * (rt60 + 0.25));
  const total = x.length + preDelai + queue;

  const entree = premierOrdre(premierOrdre(x, sampleRate, 160, true), sampleRate, 6500, false);

  // ── La queue ──
  const peignes = [lignes(PEIGNES, 0, echelle), lignes(PEIGNES, ECART_STEREO, echelle)];
  const passes = [lignes(PASSE_TOUT, 0, echelle), lignes(PASSE_TOUT, ECART_STEREO, echelle)];
  const tardive = [new Float32Array(total), new Float32Array(total)];

  for (let t = 0; t < total; t += 1) {
    const s = t - preDelai;
    const v = s >= 0 && s < x.length ? entree[s]! * 0.015 : 0;
    for (let c = 0; c < 2; c += 1) {
      let somme = 0;
      for (const pg of peignes[c]!) {
        const lu = pg.tampon[pg.i]!;
        pg.filtre = lu * (1 - amorti) + pg.filtre * amorti;
        pg.tampon[pg.i] = v + pg.filtre * salle;
        pg.i = pg.i + 1 === pg.tampon.length ? 0 : pg.i + 1;
        somme += lu;
      }
      for (const pa of passes[c]!) {
        const lu = pa.tampon[pa.i]!;
        const sortie = -somme + lu;
        pa.tampon[pa.i] = somme + lu * 0.5;
        pa.i = pa.i + 1 === pa.tampon.length ? 0 : pa.i + 1;
        somme = sortie;
      }
      tardive[c]![t] = somme;
    }
  }

  // ── Les premieres reflexions, espacees selon la taille de la salle ──
  const precoces = [new Float32Array(total), new Float32Array(total)];
  const espace = 0.7 + 0.6 * p;
  for (const [ms, gain, c] of REFLEXIONS) {
    const d = Math.round((ms * espace * sampleRate) / 1000);
    const cible = precoces[c]!;
    for (let s = 0; s < x.length && s + d < total; s += 1) cible[s + d]! += entree[s]! * gain;
  }

  // ── Le dosage ──
  // Chaque etage est ramene a l'energie moyenne de la voix, puis dose : la
  // reverb garde le meme poids quel que soit le niveau de la prise.
  const voix = energie(x) / x.length;
  const egaliser = (a: Float32Array, b: Float32Array) => {
    const e = (energie(a) + energie(b)) / (2 * total);
    return e > 1e-12 ? Math.sqrt(voix / e) : 0;
  };
  const gainTardive = egaliser(tardive[0]!, tardive[1]!) * 0.88;
  const gainPrecoces = egaliser(precoces[0]!, precoces[1]!) * 0.4;
  const niveauHumide = 0.65 * Math.pow(p, 0.7);
  const niveauSec = 1 - 0.18 * p;

  // La fin de la queue s'eteint en douceur, jamais sur un clic.
  const fondu = Math.min(queue, Math.round(sampleRate * 0.3));

  const sorties = [new Float32Array(total), new Float32Array(total)];
  let crete = 0;
  for (let c = 0; c < 2; c += 1) {
    const out = sorties[c]!;
    const tard = tardive[c]!;
    const tot = precoces[c]!;
    for (let t = 0; t < total; t += 1) {
      const sec = t < x.length ? x[t]! * niveauSec : 0;
      let humide = (tard[t]! * gainTardive + tot[t]! * gainPrecoces) * niveauHumide;
      const avantFin = total - t;
      if (avantFin < fondu) humide *= 0.5 - 0.5 * Math.cos((Math.PI * avantFin) / fondu);
      const v = sec + humide;
      out[t] = v;
      crete = Math.max(crete, Math.abs(v));
    }
  }
  if (crete > 0.99) {
    const reduction = 0.99 / crete;
    for (const out of sorties) for (let t = 0; t < total; t += 1) out[t] = out[t]! * reduction;
  }
  return sorties;
}
