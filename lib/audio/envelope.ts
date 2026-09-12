'use client';

/**
 * Lecture de l'enveloppe de la voix d'origine, calculee par le worker et
 * transportee avec les metadonnees de la scene (un octet par intervalle,
 * en base64). Aucune requete supplementaire, aucun stem televerse.
 */

const cache = new Map<string, Uint8Array>();

export function decodeEnvelope(base64: string | null | undefined): Uint8Array | null {
  if (!base64) return null;

  const cached = cache.get(base64);
  if (cached) return cached;

  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    cache.set(base64, bytes);
    return bytes;
  } catch {
    return null;
  }
}

/**
 * Ramene l'enveloppe a `buckets` colonnes sur une fenetre temporelle.
 * On garde le maximum de chaque intervalle plutot qu'une moyenne : une
 * attaque breve doit rester visible, c'est elle qui donne le depart.
 */
export function sliceEnvelope(
  envelope: Uint8Array,
  hz: number,
  startMs: number,
  endMs: number,
  buckets: number,
): number[] {
  const out = new Array<number>(buckets).fill(0);
  if (hz <= 0 || endMs <= startMs) return out;

  const spanMs = endMs - startMs;
  for (let i = 0; i < buckets; i += 1) {
    const from = startMs + (spanMs * i) / buckets;
    const to = startMs + (spanMs * (i + 1)) / buckets;

    const fromIndex = Math.max(0, Math.floor((from / 1000) * hz));
    const toIndex = Math.min(envelope.length, Math.ceil((to / 1000) * hz));

    let peak = 0;
    for (let j = fromIndex; j < toIndex; j += 1) {
      const value = envelope[j] ?? 0;
      if (value > peak) peak = value;
    }
    out[i] = peak / 255;
  }
  return out;
}
