import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';

import { AccountMenu } from '@/components/account-menu';
import { Footer } from '@/components/footer';
import { LinkButton } from '@/components/link-button';
import { SiteHeader } from '@/components/site-header';
import { getDictionary } from '@/lib/i18n-server';
import { currentUser } from '@/lib/supabase/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: t.errors.pageNotFoundTitle, robots: { index: false, follow: false } };
}

/**
 * Une adresse qui ne mene nulle part.
 *
 * La page par defaut du framework, blanche et en anglais, sortait du site
 * au pire moment : quand on est deja perdu. Celle-ci garde l'en-tete, le
 * pied de page et une seule issue, l'accueil.
 */
export default async function NotFound() {
  const [user, t] = await Promise.all([currentUser(), getDictionary()]);

  return (
    <div className="relative isolate flex min-h-dvh flex-col items-center px-3 py-4 sm:px-6 sm:py-6">
      <div className="flex w-full max-w-[min(84rem,94vw)] flex-1 flex-col">
        <SiteHeader signedIn={!!user} right={user ? <AccountMenu /> : undefined} />

        <main className="flex flex-1 items-center justify-center py-12">
          <div className="panel max-w-lg space-y-5 p-8 text-center sm:p-10">
            <p className="font-mono text-sm font-bold tracking-[0.35em] text-accent">404</p>
            <h1 className="titre text-balance text-4xl sm:text-5xl">{t.errors.pageNotFoundTitle}</h1>
            <p className="text-sm leading-relaxed text-text-muted">{t.errors.pageNotFoundBody}</p>
            <LinkButton href="/">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {t.errors.backHome}
            </LinkButton>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
