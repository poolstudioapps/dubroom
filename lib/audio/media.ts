'use client';

/**
 * Positionner un media avant de le lire.
 *
 * Deux pieges, tous deux invisibles a la lecture du code et bien reels a
 * l'usage :
 *
 *  - ecrire `currentTime` avant que les metadonnees soient chargees est
 *    sans effet. Le navigateur ne leve rien, il ignore simplement la
 *    demande, et la lecture part de zero ;
 *  - meme une fois les metadonnees la, le saut est ASYNCHRONE. Appeler
 *    `play()` dans la foulee joue les premieres frames a l'ancienne
 *    position.
 *
 * Sur ce produit, ces deux details decident du calage d'une prise :
 * l'enregistrement demarre au meme instant que la lecture, et tout le
 * mixage suppose que la prise commence exactement a `window_start_ms`.
 * D'ou ces attentes explicites, avec un delai de garde pour ne jamais
 * bloquer le studio si un evenement ne vient pas.
 */

const GUARD_MS = 4_000;
const SEEK_TOLERANCE_S = 0.02;

function once(
  element: HTMLMediaElement,
  event: string,
  timeoutMs = GUARD_MS,
): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      element.removeEventListener(event, finish);
      window.clearTimeout(timer);
      resolve();
    };
    const timer = window.setTimeout(finish, timeoutMs);
    element.addEventListener(event, finish);
  });
}

/** Attend que la duree et les pistes soient connues. */
export async function whenReady(element: HTMLMediaElement): Promise<void> {
  if (element.readyState >= HTMLMediaElement.HAVE_METADATA) return;
  // `load()` relance le chargement si la source vient d'etre posee.
  if (element.networkState === HTMLMediaElement.NETWORK_EMPTY) element.load();
  await once(element, 'loadedmetadata');
}

/** Positionne, puis attend que le saut ait reellement eu lieu. */
export async function seekTo(
  element: HTMLMediaElement,
  seconds: number,
): Promise<void> {
  await whenReady(element);
  if (Math.abs(element.currentTime - seconds) <= SEEK_TOLERANCE_S) return;
  const settled = once(element, 'seeked');
  element.currentTime = seconds;
  await settled;
}

/**
 * Positionne plusieurs medias au meme instant et n'en rend la main que
 * lorsque tous y sont. C'est ce qui garantit que l'image et le stem de
 * fond demarrent ensemble.
 */
export async function seekAll(
  elements: (HTMLMediaElement | null | undefined)[],
  seconds: number,
): Promise<void> {
  await Promise.all(
    elements.filter((el): el is HTMLMediaElement => !!el).map((el) => seekTo(el, seconds)),
  );
}
