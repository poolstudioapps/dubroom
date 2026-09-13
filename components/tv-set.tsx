import { cn } from '@/lib/utils';

/**
 * Le plateau : la zone ou se pose le contenu de chaque ecran.
 *
 * Rien a dessiner — le contenu est directement dans la salle, sur le
 * fond du site —, seulement de la mise en page : la respiration au-dessus
 * et au-dessous, et la facon dont le plateau occupe la hauteur.
 */
export function TvSet({
  children,
  slim,
  fill,
  grow,
}: {
  children: React.ReactNode;
  /** Moins de respiration, pour les ecrans larges du studio. */
  slim?: boolean;
  /**
   * Occuper la hauteur restante au lieu de la reclamer.
   *
   * Sert au studio : pendant une prise, tout doit tenir a l'ecran d'un
   * seul coup. Faire defiler pour retrouver le bouton d'arret, c'est
   * rater la fin de la replique.
   */
  fill?: boolean;
  /**
   * Prendre au moins la hauteur libre, sans s'y limiter.
   *
   * Le contraire de `fill` : le contenu peut depasser et la page defile,
   * mais un contenu court ne laisse plus le pied de page remonter.
   */
  grow?: boolean;
}) {
  return (
    <div className={cn('flex flex-col', fill ? 'min-h-0 flex-1' : grow && 'flex-1')}>
      <div
        className={cn(
          'relative flex min-w-0 flex-1 flex-col',
          slim ? 'py-4' : 'py-5 sm:py-8',
          fill && 'min-h-0',
        )}
      >
        <div className={cn('relative', fill && 'flex min-h-0 flex-1 flex-col')}>{children}</div>
      </div>
    </div>
  );
}
