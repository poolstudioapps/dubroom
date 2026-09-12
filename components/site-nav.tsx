'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Library, Clapperboard } from 'lucide-react';

import { t } from '@/config/strings';
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

/**
 * Onglets du site.
 *
 * Trois destinations, et pas une de plus : au-dela, une navigation
 * devient un menu qu'on lit au lieu d'un chemin qu'on suit. Les ecrans
 * d'une scene n'y figurent pas — on y entre par une scene, jamais par la
 * barre.
 */
export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1" aria-label="Navigation principale">
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
