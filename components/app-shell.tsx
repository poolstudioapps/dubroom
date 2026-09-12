'use client';

import { AccountMenu } from '@/components/account-menu';
import { Footer } from '@/components/footer';
import { SiteHeader } from '@/components/site-header';
import { TermsGate } from '@/components/terms-gate';
import { TvSet } from '@/components/tv-set';
import { cn } from '@/lib/utils';
import { useNarrowViewport } from '@/lib/viewport';

/**
 * Le gabarit de l'application connectee : en-tete, poste de television,
 * pied de page.
 *
 * `wide` distingue les ecrans de travail des menus. La preparation et le
 * studio ont besoin de toute la largeur, et recoivent un cadre mince.
 */
export function AppShell({
  children,
  className,
  wide,
  fill: fillDemande,
}: {
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
  /**
   * Tenir exactement dans l'ecran, sans defilement ni pied de page.
   *
   * Reserve au studio : c'est le seul endroit ou l'on agit en temps
   * reel, et ou devoir faire defiler la page coute une prise.
   */
  fill?: boolean;
}) {
  /*
   * Les largeurs suivent l'ecran au lieu d'etre figees.
   *
   * Le cadre restait a 1024 px quelle que soit la dalle : sur un 21/9 de
   * 3440 px cela laissait douze cents pixels de vide de chaque cote, et
   * le poste avait l'air perdu au milieu. Les bornes hautes existent
   * quand meme — un paragraphe de trois mille pixels de large ne se lit
   * pas — mais entre les deux, la page prend la place qu'on lui donne.
   */
  /*
   * Tenir dans l'ecran est une regle d'ordinateur.
   *
   * Sur un telephone, la hauteur disponible ne suffit a rien : forcer le
   * studio a s'y plier ecrasait l'image a quelques pixels pour caser les
   * commandes. En dessous de mille vingt-quatre pixels de large, la page
   * redevient une page qui defile.
   */
  const narrow = useNarrowViewport();
  const fill = fillDemande && !narrow;

  const width = wide ? 'max-w-[min(124rem,96vw)]' : 'max-w-[min(84rem,94vw)]';

  return (
    <div
      className={cn(
        'flex flex-col items-center px-3 sm:px-6',
        fill ? 'h-dvh overflow-hidden py-2' : 'min-h-dvh py-4 sm:py-6',
      )}
    >
      <div className={cn('flex w-full flex-col', width, fill && 'min-h-0 flex-1')}>
        <SiteHeader
          signedIn
          right={<AccountMenu />}
          className={fill ? 'mb-2' : undefined}
        />

        <TvSet slim={wide} fill={fill}>
          <main
            className={cn(
              fill ? 'flex min-h-0 flex-1 flex-col' : 'min-h-[26rem]',
              className,
            )}
          >
            {children}
          </main>
        </TvSet>

        {fill ? null : <Footer />}
      </div>

      {/* Par-dessus tout, et seulement quand il manque une acceptation. */}
      <TermsGate />
    </div>
  );
}
