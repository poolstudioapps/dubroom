'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Home, Library } from 'lucide-react';

import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/*
 * Les destinations sont figees, les libelles non : ils dependent de la
 * langue, donc du rendu. Seules les icones et les adresses vivent hors
 * du composant.
 */
const TABS = [
  { href: '/', icon: Home, exact: true },
  { href: '/communaute', icon: Library, exact: false },
  { href: '/guide', icon: BookOpen, exact: false },
] as const;

/**
 * Onglets du site.
 *
 * Trois lieux, et seulement des lieux : l'accueil, le catalogue, les
 * guides. Les gestes — creer, rejoindre — sont des boutons a cote du
 * compte, et ce qui est a soi — ses scenes, ses packs — vit dans le menu
 * du compte. Melanger les trois dans une meme barre obligeait a lire
 * chaque onglet pour savoir s'il menait quelque part ou s'il faisait
 * quelque chose.
 *
 * Les ecrans d'une scene n'y figurent pas — on y entre par une scene,
 * jamais par la barre.
 */
export function SiteNav(_props: { signedIn?: boolean }) {
  const t = useT();
  const pathname = usePathname();

  /* Le libelle court n'est pas le premier mot du long : il est ecrit a la
     main, pour les telephones. */
  const labels: Record<string, { label: string; short: string }> = {
    '/': { label: t.nav.home, short: t.nav.homeShort },
    '/communaute': { label: t.nav.community, short: t.nav.communityShort },
    '/guide': { label: t.nav.guides, short: t.nav.guidesShort },
  };

  return (
    <nav className="flex flex-wrap gap-1" aria-label={t.nav.mainLabel}>
      {TABS.map((tab) => {
        const active = tab.exact
          ? pathname === tab.href
          : pathname.startsWith(tab.href);
        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'tab inline-flex min-h-9 items-center gap-1.5 px-2.5 py-1.5 text-xs',
              'sm:gap-2 sm:px-3 sm:py-2 sm:text-sm',
              active ? 'tab-on' : 'tab-off',
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">{labels[tab.href]?.label}</span>
            <span className="sm:hidden">{labels[tab.href]?.short}</span>
          </Link>
        );
      })}
    </nav>
  );
}
