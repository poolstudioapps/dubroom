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
import { SiteNav } from '@/components/site-nav';
import { Card } from '@/components/ui';
import { APP_NAME, t } from '@/config/strings';
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
        <header className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <span className="signage text-2xl text-[oklch(0.85_0.12_200)] sm:text-3xl">
            {APP_NAME}
          </span>
          <SiteNav />
        </header>

        <div className="rounded-[1.75rem] border-[3px] border-bezel-dark bg-bezel p-4 shadow-[0_24px_60px_-16px_rgb(0_0_0/0.7),inset_0_2px_0_0_rgb(255_255_255/0.18)] sm:p-6">
          <div className="relative overflow-hidden rounded-[1.25rem] bg-screen p-5 shadow-[inset_0_0_0_3px_oklch(0.32_0.12_300)] sm:p-8">
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/35 via-transparent to-transparent"
              aria-hidden
            />

            <div className="relative space-y-10">
              <section className="space-y-4 text-center">
                <h1 className="signage text-4xl leading-[0.95] text-[oklch(0.55_0.17_235)] sm:text-6xl">
                  {t.home.heroTitle}
                </h1>
                <p className="mx-auto max-w-2xl text-sm leading-relaxed text-text-muted sm:text-base">
                  {t.home.heroBody}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <Link
                    href={user ? '/sessions' : '/login'}
                    className="btn-3d inline-flex h-14 items-center gap-2 bg-accent px-8 text-lg font-semibold uppercase tracking-wide text-accent-ink [--btn-lip:var(--color-accent-ink)] hover:bg-accent-hover"
                  >
                    <LogIn className="h-5 w-5" aria-hidden />
                    {user ? t.home.ctaSessions : t.home.cta}
                  </Link>
                  <Link
                    href="/communaute"
                    className="btn-3d inline-flex h-14 items-center gap-2 bg-surface-raised px-6 text-sm font-semibold uppercase tracking-wide text-text [--btn-lip:var(--color-border-strong)]"
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
                <p className="text-sm text-text-muted">{t.home.privateBody}</p>
              </Card>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
