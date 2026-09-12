'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

import { Footer } from '@/components/footer';
import { SiteHeader } from '@/components/site-header';
import { TvSet } from '@/components/tv-set';
import { Button } from '@/components/ui';
import { t } from '@/config/strings';
import { supabaseBrowser } from '@/lib/supabase/client';
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
}: {
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
}) {
  const router = useRouter();
  const width = wide ? 'max-w-[110rem]' : 'max-w-5xl';

  async function signOut() {
    await supabaseBrowser().auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh flex-col items-center px-3 py-4 sm:px-6 sm:py-6">
      <div className={cn('w-full', width)}>
        {/*
          Sur telephone le libelle du bouton disparait : sans `aria-label`
          il n'aurait plus de nom du tout, l'icone etant decorative.
        */}
        <SiteHeader
          right={
            <Button
              variant="secondary"
              size="sm"
              onClick={signOut}
              aria-label={t.auth.signOut}
            >
              <LogOut className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">{t.auth.signOut}</span>
            </Button>
          }
        />

        <TvSet slim={wide}>
          <main className={cn('min-h-[26rem]', className)}>{children}</main>
        </TvSet>

        <Footer />
      </div>
    </div>
  );
}
