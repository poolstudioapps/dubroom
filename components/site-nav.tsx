'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Library, Clapperboard, Package } from 'lucide-react';

import { t } from '@/config/strings';
import { useMyPackCount } from '@/lib/profile';
import { cn } from '@/lib/utils';

/**
 * Le libelle court n'est pas le premier mot du long : « Mes scènes »
 * donnait « Mes », qui ne designe rien. Il est ecrit a la main.
 */
const TABS = [
  { href: '/', label: t.nav.home, short: t.nav.homeShort, icon: Home, exact: true },
  { href: '/sessions', label: t.nav.sessions, short: t.nav.sessionsShort, icon: Clapperboard, exact: false },
  { href: '/communaute', label: t.nav.community, short: t.nav.communityShort, icon: Library, exact: false },
] as const;

/** Le dernier onglet, qui n'apparait que si on a quelque chose dedans. */
const MY_PACKS = {
  href: '/mes-packs',
  label: t.nav.myPacks,
  short: t.nav.myPacksShort,
  icon: Package,
  exact: false,
} as const;

/**
 * Onglets du site.
 *
 * Quatre destinations au plus, et la quatrieme n'est la que si elle a du
 * contenu : « Mes packs » ouvrirait sinon sur une page vide, ce qui donne
 * l'impression d'avoir perdu quelque chose. Tant qu'elle n'a rien, c'est
 * l'accueil qui propose d'en creer un.
 *
 * Les ecrans d'une scene n'y figurent pas — on y entre par une scene,
 * jamais par la barre.
 *
 * Les onglets passent a la ligne plutot que de pousser la page hors de
 * l'ecran : le quatrieme ne rentrait pas en largeur telephone, et faisait
 * deborder tout le site de soixante-quinze pixels.
 */
export function SiteNav({ signedIn }: { signedIn?: boolean }) {
  const pathname = usePathname();
  const packs = useMyPackCount(!!signedIn);

  const tabs = [
    ...TABS,
    ...((packs.data ?? 0) > 0 ? [MY_PACKS] : []),
  ];

  return (
    <nav className="flex flex-wrap gap-1" aria-label="Navigation principale">
      {tabs.map((tab) => {
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
              'inline-flex items-center gap-2 rounded-t-lg border-2 border-b-0 px-3 py-2 text-xs font-bold uppercase tracking-wide transition-colors sm:text-sm',
              active
                ? 'border-bezel-dark bg-screen text-text'
                : 'border-transparent bg-bezel-dark/50 text-[oklch(0.85_0.05_260)] hover:bg-bezel-dark',
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.short}</span>
          </Link>
        );
      })}
    </nav>
  );
}
