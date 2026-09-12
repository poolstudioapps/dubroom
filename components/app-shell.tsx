'use client';

import { AccountMenu } from '@/components/account-menu';
import { Footer } from '@/components/footer';
import { SiteHeader } from '@/components/site-header';
import { TvSet } from '@/components/tv-set';
import { cn } from '@/lib/utils';

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
  fill,
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
  const width = wide ? 'max-w-[110rem]' : 'max-w-5xl';

  return (
    <div
      className={cn(
        'flex flex-col items-center px-3 sm:px-6',
        fill ? 'h-dvh overflow-hidden py-2' : 'min-h-dvh py-4 sm:py-6',
      )}
    >
      <div className={cn('flex w-full flex-col', width, fill && 'min-h-0 flex-1')}>
        <SiteHeader signedIn right={<AccountMenu />} className={fill ? 'mb-2' : undefined} />

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
    </div>
  );
}
