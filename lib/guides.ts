import type { GUIDE_ORDER } from '@/config/guides';
import type { Dictionary } from '@/config/i18n';

/**
 * Le titre, le resume et la duree d'un guide, qu'il ait sa propre page
 * — le guide d'import — ou le gabarit commun.
 */
export function ficheGuide(t: Dictionary, cle: (typeof GUIDE_ORDER)[number]['cle']) {
  if (cle === 'video') {
    return {
      titre: t.guide.metaTitle,
      resume: t.guideHub.videoGuideSummary,
      duree: t.guideHub.readingTime,
    };
  }
  const g = t.guides[cle];
  return { titre: g.title, resume: g.summary, duree: g.readingTime };
}
