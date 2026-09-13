import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Suspense } from 'react';
import { APP_NAME, APP_TAGLINE } from '@/config/strings';
import { getDictionary } from '@/lib/i18n-server';
import { Footer } from '@/components/footer';
import { HeroBackdrop } from '@/components/hero-backdrop';
import { LoginForm } from './login-form';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: t.auth.title };
}

/** Ecran-titre : le film derriere, le nom, et une seule chose a faire. */
export default async function LoginPage() {
  const t = await getDictionary();
  // Le nonce de la politique de securite du contenu, pour le script du captcha.
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return (
    <div className="relative isolate flex min-h-dvh flex-col items-center justify-center px-4 py-8">
      <HeroBackdrop />
      <main className="w-full max-w-[min(42rem,94vw)]">
        <div className="ecran-titre relative overflow-hidden px-6 py-10 sm:py-14">
          <div className="relative space-y-8 text-center">
            <div className="space-y-2">
              <h1 className="signage text-5xl leading-[0.95] sm:text-7xl">{APP_NAME}</h1>
              <p className="text-sm font-bold text-text-muted">{APP_TAGLINE}</p>
            </div>

            <div className="mx-auto max-w-sm space-y-4 text-left">
              <p className="text-center text-sm text-text-muted">{t.auth.subtitle}</p>
              <Suspense>
                <LoginForm nonce={nonce} />
              </Suspense>
            </div>
          </div>
        </div>

        {/* Page publique, et souvent la premiere vue : les mentions et le
            choix de la langue doivent y etre. */}
        <Footer />
      </main>
    </div>
  );
}
