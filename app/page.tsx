import Link from 'next/link';
import { Library, LogIn } from 'lucide-react';

import { Carousel, type Slide } from '@/components/carousel';
import { Footer } from '@/components/footer';
import {
  ArtCharacters,
  ArtImport,
  ArtRender,
  ArtRythmo,
} from '@/components/home-art';
import { SiteHeader } from '@/components/site-header';
import { TvSet } from '@/components/tv-set';
import { Card } from '@/components/ui';
import { t } from '@/config/strings';
import { currentUser } from '@/lib/supabase/server';

/**
 * Accueil.
 *
 * C'est la seule page visible sans compte, et elle ne montre aucun
 * contenu : ni scene, ni participant, ni rendu. Elle explique le
 * principe, ce qui permet de la faire lire a quelqu'un avant de
 * l'inviter, sans rien ouvrir de ce que le PRD §14 protege. Le
 * `noindex` global du site s'y applique comme partout ailleurs.
 */
export default async function HomePage() {
  const user = await currentUser();

  const slides: Slide[] = [
    { title: t.home.slides.importTitle, body: t.home.slides.importBody, art: <ArtImport /> },
    { title: t.home.slides.charactersTitle, body: t.home.slides.charactersBody, art: <ArtCharacters /> },
    { title: t.home.slides.rythmoTitle, body: t.home.slides.rythmoBody, art: <ArtRythmo /> },
    { title: t.home.slides.renderTitle, body: t.home.slides.renderBody, art: <ArtRender /> },
  ];

  return (
    <div className="flex min-h-dvh flex-col items-center px-3 py-4 sm:px-6 sm:py-6">
      <div className="w-full max-w-5xl">
        <SiteHeader />

        <TvSet>
          <main className="space-y-10 sm:space-y-12">
            <section className="space-y-4 text-center">
              <h1 className="signage text-balance text-4xl leading-[0.95] text-[oklch(0.55_0.17_235)] sm:text-6xl">
                {t.home.heroTitle}
              </h1>
              <p className="mx-auto max-w-2xl text-balance text-sm leading-relaxed text-text-muted sm:text-base">
                {t.home.heroBody}
              </p>

              <div className="flex flex-col items-stretch justify-center gap-3 pt-2 sm:flex-row sm:items-center">
                <Link
                  href={user ? '/sessions' : '/login'}
                  className="btn-3d inline-flex h-14 items-center justify-center gap-2 bg-accent px-8 text-base font-semibold uppercase tracking-wide text-accent-ink [--btn-lip:var(--color-accent-ink)] hover:bg-accent-hover sm:text-lg"
                >
                  <LogIn className="h-5 w-5" aria-hidden />
                  {user ? t.home.ctaSessions : t.home.cta}
                </Link>
                <Link
                  href="/communaute"
                  className="btn-3d inline-flex h-14 items-center justify-center gap-2 bg-surface-raised px-6 text-sm font-semibold uppercase tracking-wide text-text [--btn-lip:var(--color-border-strong)]"
                >
                  <Library className="h-5 w-5" aria-hidden />
                  {t.home.ctaCommunity}
                </Link>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="signage text-xl" style={{ textShadow: 'none' }}>
                {t.home.howTitle}
              </h2>
              <Carousel slides={slides} />
            </section>

            <Card className="space-y-2">
              <h2 className="text-sm font-bold">{t.home.privateTitle}</h2>
              <p className="text-sm leading-relaxed text-text-muted">
                {t.home.privateBody}
              </p>
            </Card>
          </main>
        </TvSet>

        <Footer />
      </div>
    </div>
  );
}
