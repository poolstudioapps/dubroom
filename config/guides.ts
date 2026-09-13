// En relatif : le worker compile aussi ce dossier, sans l'alias `@/`.
import { GUIDE_VIDEO_HREF } from './constants';

/**
 * Les guides du centre d'aide.
 *
 * Le guide d'import a sa propre page, plus riche, parce que c'est lui
 * qu'on vient chercher quand une scene du catalogue ne demarre pas. Les
 * autres partagent un gabarit : une adresse, une illustration, et leur
 * texte dans les dictionnaires, sous `guides`.
 */
export const GUIDE_ARTICLES = {
  'bien-enregistrer': { cle: 'studio', image: '/illustrations/cinema/art-rythmo.webp', cta: '/sessions/new' },
  'preparer-la-scene': { cle: 'prepare', image: '/illustrations/cinema/art-characters.webp', cta: '/sessions/new' },
  'publier-un-pack': { cle: 'publish', image: '/illustrations/cinema/art-render.webp', cta: '/communaute' },
  'devenir-certifie': { cle: 'certify', image: '/illustrations/cinema/art-certification.webp', cta: '/communaute' },
} as const;

export type GuideSlug = keyof typeof GUIDE_ARTICLES;
export type GuideCle = (typeof GUIDE_ARTICLES)[GuideSlug]['cle'];

export function isGuideSlug(slug: string): slug is GuideSlug {
  return slug in GUIDE_ARTICLES;
}

/** Tous les guides dans l'ordre du centre d'aide, import compris. */
export const GUIDE_ORDER = [
  { href: GUIDE_VIDEO_HREF, cle: 'video', image: '/illustrations/cinema/art-import.webp' },
  { href: '/guide/preparer-la-scene', cle: 'prepare', image: GUIDE_ARTICLES['preparer-la-scene'].image },
  { href: '/guide/bien-enregistrer', cle: 'studio', image: GUIDE_ARTICLES['bien-enregistrer'].image },
  { href: '/guide/publier-un-pack', cle: 'publish', image: GUIDE_ARTICLES['publier-un-pack'].image },
  { href: '/guide/devenir-certifie', cle: 'certify', image: GUIDE_ARTICLES['devenir-certifie'].image },
] as const;

export const CERTIFICATION_GUIDE_HREF = '/guide/devenir-certifie';
