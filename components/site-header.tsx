'use client';

import Link from 'next/link';

import { HeaderActions } from '@/components/header-actions';
import { SiteNav } from '@/components/site-nav';
import { APP_NAME } from '@/config/strings';
import { useT } from '@/lib/i18n';

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
  const t = useT();

  return (
    <header
      className={[
        // Les espaces se resserrent sur telephone : chaque pixel rendu
        // ici rapproche le bouton d'enregistrement du premier ecran.
        'mb-2 flex w-full flex-wrap items-end gap-x-4 gap-y-2 sm:mb-3 sm:gap-y-3',
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
        className="signage site-logo order-1 rounded-sm text-xl text-[oklch(0.85_0.12_200)] sm:text-3xl"
      >
        {APP_NAME}
      </Link>
      <div className="order-3 w-full sm:order-2 sm:w-auto">
        <SiteNav signedIn={signedIn} />
      </div>
      {/*
        Sans compte, la place de droite porte l'entree : c'est la qu'on la
        cherche. La facade se visite librement ; c'est jouer qui demande un
        compte, et le dire au moment ou l'on clique vaut mieux que de
        fermer la porte d'emblee.
      */}
      <div className="order-2 ml-auto flex items-center gap-2 sm:order-3">
        <HeaderActions signedIn={!!signedIn} />
        {right ?? (
          <Link
            href="/login"
            className="btn-3d btn-primary inline-flex h-11 items-center gap-2 bg-accent px-5 text-sm font-semibold uppercase tracking-wide text-accent-ink [--btn-lip:var(--color-accent-ink)] hover:bg-accent-hover"
          >
            {t.auth.signIn}
          </Link>
        )}
      </div>
    </header>
  );
}
