import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, BookOpen, Check, Clock, Lightbulb } from 'lucide-react';

import { AccountMenu } from '@/components/account-menu';
import { Footer } from '@/components/footer';
import { HeroBackdrop } from '@/components/hero-backdrop';
import { LinkButton } from '@/components/link-button';
import { SiteHeader } from '@/components/site-header';
import { TvSet } from '@/components/tv-set';
import { GUIDE_ARTICLES, GUIDE_ORDER, isGuideSlug } from '@/config/guides';
import { ficheGuide } from '@/lib/guides';
import { getDictionary } from '@/lib/i18n-server';
import { currentUser } from '@/lib/supabase/server';

const delai = (ms: number) => ({ '--delai': `${ms}ms` }) as CSSProperties;

export function generateStaticParams() {
  return Object.keys(GUIDE_ARTICLES).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isGuideSlug(slug)) return {};
  const t = await getDictionary();
  const g = t.guides[GUIDE_ARTICLES[slug].cle];
  return { title: g.title, description: g.summary, robots: { index: false, follow: false } };
}

/**
 * Un guide du centre d'aide.
 *
 * Le meme gabarit que le guide d'import, en plus court : une promesse et
 * son illustration, quatre etapes numerotees, ce qu'il faut verifier, les
 * autres guides, et un dernier appel a agir.
 */
export default async function GuideArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isGuideSlug(slug)) notFound();

  const [user, t] = await Promise.all([currentUser(), getDictionary()]);
  const meta = GUIDE_ARTICLES[slug];
  const g = t.guides[meta.cle];
  const autres = GUIDE_ORDER.filter((guide) => guide.cle !== meta.cle);

  return (
    <div className="relative isolate flex min-h-dvh flex-col items-center px-3 py-4 sm:px-6 sm:py-6">
      <HeroBackdrop />
      <div className="w-full max-w-[min(84rem,94vw)]">
        <SiteHeader signedIn={!!user} right={user ? <AccountMenu /> : undefined} />

        <TvSet>
          <main className="space-y-14 sm:space-y-20">
            <section className="hero-accueil grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
              <div className="space-y-5 text-center lg:text-left">
                <div
                  data-reveal
                  suppressHydrationWarning
                  style={delai(0)}
                  className="flex flex-wrap items-center justify-center gap-3 lg:justify-start"
                >
                  <Link
                    href="/guide"
                    className="accroche inline-flex items-center gap-2 rounded-full border-2 border-border-strong bg-surface-raised px-3 py-1 text-xs font-bold uppercase tracking-wide text-text-muted hover:text-text"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                    {t.guides.back}
                  </Link>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-faint">
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                    {g.readingTime}
                  </span>
                </div>
                <h1
                  data-reveal
                  suppressHydrationWarning
                  style={delai(90)}
                  className="signage hero-titre text-balance text-4xl leading-[0.98] sm:text-6xl"
                >
                  {g.title}
                </h1>
                <p
                  data-reveal
                  suppressHydrationWarning
                  style={delai(180)}
                  className="mx-auto max-w-xl text-balance text-base leading-relaxed text-text-muted lg:mx-0"
                >
                  {g.intro}
                </p>
              </div>

              <div data-reveal suppressHydrationWarning style={delai(240)} className="panel overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={meta.image}
                  alt=""
                  width={1000}
                  height={563}
                  className="block aspect-video w-full object-cover"
                />
              </div>
            </section>

            <section className="space-y-6">
              <h2 data-reveal suppressHydrationWarning className="titre titre-section text-center text-2xl sm:text-3xl">
                {g.stepsTitle}
              </h2>
              <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {g.steps.map((etape, rang) => (
                  <li
                    key={etape.title}
                    data-reveal
                    suppressHydrationWarning
                    style={delai(rang * 110)}
                    className="panel carte-valeur relative flex flex-col gap-3 overflow-hidden p-5"
                  >
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -right-1 -top-5 select-none text-[6.5rem] font-black leading-none text-transparent opacity-50 [-webkit-text-stroke:1.5px_var(--color-border-strong)]"
                    >
                      {rang + 1}
                    </span>
                    <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-ink">
                      {rang + 1}
                    </span>
                    <h3 className="relative text-base font-bold text-text">{etape.title}</h3>
                    <p className="relative text-sm leading-relaxed text-text-muted">{etape.body}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-start">
              <div
                data-reveal
                suppressHydrationWarning
                className="panel flex gap-4 p-6"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <Lightbulb className="h-5 w-5" aria-hidden />
                </span>
                <div className="space-y-1">
                  <h2 className="font-bold text-text">{t.guides.noteTitle}</h2>
                  <p className="text-sm leading-relaxed text-text-muted">{g.note}</p>
                </div>
              </div>

              <aside data-reveal suppressHydrationWarning style={delai(160)} className="panel space-y-4 p-6">
                <h2 className="text-lg font-bold text-text">{g.checklistTitle}</h2>
                <ul className="space-y-3">
                  {g.checklist.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-text-muted">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink">
                        <Check className="h-3.5 w-3.5" aria-hidden />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </aside>
            </section>

            <section className="space-y-6">
              <h2 data-reveal suppressHydrationWarning className="titre titre-section text-center text-2xl sm:text-3xl">
                {t.guides.related}
              </h2>
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {autres.map((guide, rang) => {
                  const fiche = ficheGuide(t, guide.cle);
                  return (
                    <li key={guide.href} data-reveal suppressHydrationWarning style={delai(rang * 110)}>
                      <Link href={guide.href} className="panel carte-valeur group flex h-full flex-col overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={guide.image}
                          alt=""
                          loading="lazy"
                          width={1000}
                          height={563}
                          className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                        <div className="flex flex-1 flex-col gap-2 p-5">
                          <h3 className="font-bold leading-snug text-text">{fiche.titre}</h3>
                          <p className="text-sm leading-relaxed text-text-muted">{fiche.resume}</p>
                          <span className="lien-surligne mt-auto self-start pt-2 text-sm font-bold text-text">
                            {t.guideHub.readGuide}
                            <ArrowRight className="ml-1 inline h-4 w-4" aria-hidden />
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section
              data-reveal
              suppressHydrationWarning
              className="appel-final rounded-card border-2 border-bezel-dark bg-surface-sunken px-5 py-10 text-center"
            >
              <p className="mx-auto max-w-xl text-balance text-2xl font-bold">{g.ctaTitle}</p>
              <div className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-text-muted">{g.ctaBody}</div>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <LinkButton href={user ? meta.cta : '/login'}>
                  {g.ctaLabel}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </LinkButton>
                <LinkButton href="/guide" variant="secondary">
                  <BookOpen className="h-4 w-4" aria-hidden />
                  {t.guides.back}
                </LinkButton>
              </div>
            </section>
          </main>
        </TvSet>

        <Footer />
      </div>
    </div>
  );
}
