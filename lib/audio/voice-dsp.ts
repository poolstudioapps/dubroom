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
 * echantillons en entree, des echantillons en sortie.
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

/** La prise avec ses effets : pitch, puis reverb. */
export function traiterVoix(entree: Float32Array, sampleRate: number, fx: VoiceFx): Float32Array {
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

/**
 * Une vraie reverberation : huit filtres en peigne amortis, puis quatre
 * passe-tout, la structure de Freeverb.
 *
 * Les trois echos d'avant sonnaient comme un tuyau. Ici le curseur agrandit
 * la salle — une queue plus longue, un retard initial plus grand — et monte
 * la part de son reflechi. Le niveau du son reflechi est cale sur celui de
 * la voix, ce qui tient la reverb audible a bas reglage sans jamais noyer
 * la voix a fond.
 */
export function reverberer(x: Float32Array, sampleRate: number, montant: number): Float32Array {
  const part = clamp(montant, 0, 100) / 100;
  if (part <= 0 || x.length === 0) return x;

  const echelle = sampleRate / 44100;
  const salle = 0.8 + 0.17 * part;
  const amorti = 0.3 - 0.12 * part;
  const preDelai = Math.round(sampleRate * (0.01 + 0.03 * part));
  const queue = Math.round(sampleRate * (0.5 + 2.5 * part));
  const total = x.length + preDelai + queue;

  const peignes = PEIGNES.map((l) => ({
    tampon: new Float32Array(Math.max(1, Math.round(l * echelle))),
    i: 0,
    filtre: 0,
  }));
  const passes = PASSE_TOUT.map((l) => ({
    tampon: new Float32Array(Math.max(1, Math.round(l * echelle))),
    i: 0,
  }));

  const humide = new Float32Array(total);
  for (let t = 0; t < total; t += 1) {
    const s = t - preDelai;
    const entree = s >= 0 && s < x.length ? x[s]! * 0.015 : 0;

    let somme = 0;
    for (const p of peignes) {
      const lu = p.tampon[p.i]!;
      p.filtre = lu * (1 - amorti) + p.filtre * amorti;
      p.tampon[p.i] = entree + p.filtre * salle;
      p.i = p.i + 1 === p.tampon.length ? 0 : p.i + 1;
      somme += lu;
    }
    for (const p of passes) {
      const lu = p.tampon[p.i]!;
      const sortie = -somme + lu;
      p.tampon[p.i] = somme + lu * 0.5;
      p.i = p.i + 1 === p.tampon.length ? 0 : p.i + 1;
      somme = sortie;
    }
    humide[t] = somme;
  }

  // Le son reflechi a la meme energie moyenne que la voix, puis dose.
  let energieVoix = 0;
  for (let i = 0; i < x.length; i += 1) energieVoix += x[i]! * x[i]!;
  let energieHumide = 0;
  for (let i = 0; i < total; i += 1) energieHumide += humide[i]! * humide[i]!;
  const egalise =
    energieHumide > 1e-12 ? Math.sqrt(energieVoix / x.length / (energieHumide / total)) : 0;
  const niveauHumide = egalise * (0.25 + 0.75 * Math.pow(part, 0.8)) * 0.95;
  const niveauSec = 1 - 0.35 * part;

  const sortie = new Float32Array(total);
  let crete = 0;
  for (let t = 0; t < total; t += 1) {
    const v = (t < x.length ? x[t]! * niveauSec : 0) + humide[t]! * niveauHumide;
    sortie[t] = v;
    crete = Math.max(crete, Math.abs(v));
  }
  if (crete > 0.99) {
    const reduction = 0.99 / crete;
    for (let t = 0; t < total; t += 1) sortie[t] = sortie[t]! * reduction;
  }
  return sortie;
}
