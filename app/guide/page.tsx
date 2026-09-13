import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Clock } from 'lucide-react';

import { AccountMenu } from '@/components/account-menu';
import { FaqList } from '@/components/faq-list';
import { Footer } from '@/components/footer';
import { HeroBackdrop } from '@/components/hero-backdrop';
import { SiteHeader } from '@/components/site-header';
import { TvSet } from '@/components/tv-set';
import { GUIDE_VIDEO_HREF } from '@/config/constants';
import { getDictionary } from '@/lib/i18n-server';
import { currentUser } from '@/lib/supabase/server';

const delai = (ms: number) => ({ '--delai': `${ms}ms` }) as CSSProperties;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return {
    title: t.guideHub.title,
    description: t.guideHub.body,
    robots: { index: false, follow: false },
  };
}

/**
 * Les guides.
 *
 * Le troisieme onglet, a cote de l'accueil et du catalogue : ce qu'on
 * cherche quand quelque chose ne marche pas comme prevu. Les guides en
 * cartes, puis les questions frequentes — les memes que sur l'accueil,
 * ou on ne pense pas a les chercher une fois entre.
 *
 * Chaque guide ajoute ici prend une carte de plus : la grille est prete
 * pour eux.
 */
export default async function GuidesPage() {
  const [user, t] = await Promise.all([currentUser(), getDictionary()]);

  const guides = [
    {
      href: GUIDE_VIDEO_HREF,
      image: '/illustrations/cinema/art-import.webp',
      titre: t.guide.metaTitle,
      resume: t.guideHub.videoGuideSummary,
      duree: t.guideHub.readingTime,
    },
  ];

  return (
    <div className="relative isolate flex min-h-dvh flex-col items-center px-3 py-4 sm:px-6 sm:py-6">
      <HeroBackdrop />
      <div className="w-full max-w-[min(84rem,94vw)]">
        <SiteHeader signedIn={!!user} right={user ? <AccountMenu /> : undefined} />

        <TvSet>
          <main className="space-y-12 sm:space-y-16">
            <section className="hero-accueil max-w-2xl space-y-4">
              <p
                data-reveal
                suppressHydrationWarning
                style={delai(0)}
                className="accroche inline-flex items-center gap-2 rounded-full border-2 border-border-strong bg-surface-raised px-3 py-1 text-xs font-bold uppercase tracking-wide text-text-muted"
              >
                <BookOpen className="h-3.5 w-3.5" aria-hidden />
                {t.nav.guides}
              </p>
              <h1
                data-reveal
                suppressHydrationWarning
                style={delai(90)}
                className="signage hero-titre text-balance text-4xl leading-[0.95] text-[oklch(0.55_0.17_235)] sm:text-6xl"
              >
                {t.guideHub.title}
              </h1>
              <p
                data-reveal
                suppressHydrationWarning
                style={delai(180)}
                className="text-balance text-base leading-relaxed text-text-muted"
              >
                {t.guideHub.body}
              </p>
            </section>

            <section className="space-y-5">
              <h2 data-reveal suppressHydrationWarning className="titre titre-section text-2xl">
                {t.guideHub.guidesTitle}
              </h2>
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {guides.map((guide, rang) => (
                  <li
                    key={guide.href}
                    data-reveal
                    suppressHydrationWarning
                    style={delai(rang * 110)}
                  >
                    <Link
                      href={guide.href}
                      className="panel carte-valeur group flex h-full flex-col overflow-hidden"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={guide.image}
                        alt=""
                        loading="lazy"
                        className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                      <div className="flex flex-1 flex-col gap-2 p-5">
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-text-faint">
                          <Clock className="h-3.5 w-3.5" aria-hidden />
                          {guide.duree}
                        </p>
                        <h3 className="text-lg font-bold leading-snug text-text">
                          {guide.titre}
                        </h3>
                        <p className="text-sm leading-relaxed text-text-muted">{guide.resume}</p>
                        <span className="lien-surligne mt-auto self-start pt-2 text-sm font-bold text-text">
                          {t.guideHub.readGuide}
                          <ArrowRight className="ml-1 inline h-4 w-4" aria-hidden />
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-4">
              <h2 data-reveal suppressHydrationWarning className="titre titre-section text-2xl">
                {t.home.faqTitle}
              </h2>
              <div data-reveal suppressHydrationWarning>
                <FaqList items={[...t.home.faq, ...t.home.faqExtra]} />
              </div>
            </section>
          </main>
        </TvSet>

        <Footer />
      </div>
    </div>
  );
}
