import Link from 'next/link';

import { SiteNav } from '@/components/site-nav';
import { APP_NAME } from '@/config/strings';

/**
 * L'en-tete du site : l'enseigne, les onglets, et ce qu'on veut mettre a
 * droite.
 *
 * Les trois gabarits (application, accueil, pages legales) le dessinaient
 * chacun de leur cote, avec deja trois marges differentes. Un seul endroit
 * suffit : ce qui change d'un gabarit a l'autre, c'est la largeur et le
 * bouton de droite, pas l'en-tete.
 */
export function SiteHeader({
  right,
  signedIn,
  className,
}: {
  right?: React.ReactNode;
  signedIn?: boolean;
  className?: string;
}) {
  return (
    <header
      className={[
        'mb-3 flex w-full flex-wrap items-end gap-x-4 gap-y-3',
        className ?? '',
      ].join(' ')}
    >
      {/*
        Sur telephone, les onglets prennent toute la largeur et passent a
        la ligne : l'enseigne et le bouton de droite se partagent alors la
        premiere ligne, au lieu de laisser ce bouton flotter seul dessous.
      */}
      <Link
        href="/"
        className="signage order-1 rounded-sm text-2xl text-[oklch(0.85_0.12_200)] sm:text-3xl"
      >
        {APP_NAME}
      </Link>
      <div className="order-3 w-full sm:order-2 sm:w-auto">
        <SiteNav signedIn={signedIn} />
      </div>
      <div className="order-2 ml-auto sm:order-3">{right}</div>
    </header>
  );
}
