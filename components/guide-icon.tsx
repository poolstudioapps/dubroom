import { cn } from '@/lib/utils';

/** Les icones des guides et de la communaute, dans `public/icones/guide-*.png`. */
export type GuideIconName =
  | 'import'
  | 'script'
  | 'micro'
  | 'partage'
  | 'casque'
  | 'oreille'
  | 'cible'
  | 'console'
  | 'sablier'
  | 'telechargement'
  | 'ampoule'
  | 'lien'
  | 'chrono'
  | 'fichier'
  | 'clap'
  | 'fiche';

/**
 * Une icone de la salle : un objet noir et or, rendu puis detoure.
 *
 * Elles remplacent les pictogrammes au trait la ou ils servaient de decor
 * — etapes, astuces, « Bon à savoir » — et ou ils juraient avec les
 * icones en volume de l'accueil. Les pictogrammes restent dans les
 * boutons, ou ils sont un signe et non une image.
 */
export function GuideIcon({ nom, className }: { nom: GuideIconName; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/icones/guide-${nom}.png`}
      alt=""
      aria-hidden
      width={96}
      height={96}
      loading="lazy"
      decoding="async"
      className={cn('select-none object-contain', className)}
    />
  );
}
