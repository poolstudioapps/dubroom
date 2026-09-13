import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  AudioLines,
  BookOpen,
  Clock,
  Crosshair,
  DoorClosed,
  Download,
  Ear,
  Headphones,
  Library,
  Mic,
  Plus,
  Share2,
  Upload,
  Users,
} from 'lucide-react';

import { AccountMenu } from '@/components/account-menu';
import { FaqList } from '@/components/faq-list';
import { Footer } from '@/components/footer';
import { HeroBackdrop } from '@/components/hero-backdrop';
import { LinkButton } from '@/components/link-button';
import { SiteHeader } from '@/components/site-header';
import { TvSet } from '@/components/tv-set';
import { GUIDE_ORDER } from '@/config/guides';
import { ficheGuide } from '@/lib/guides';
import { getDictionary } from '@/lib/i18n-server';
import { currentUser } from '@/lib/supabase/server';

const delai = (ms: number) => ({ '--delai': `${ms}ms` }) as CSSProperties;

const ICONES_PARCOURS = [Upload, Users, Mic, Share2] as const;
const ICONES_ASTUCES = [Headphones, Ear, Crosshair, AudioLines, DoorClosed, Download] as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return {
    title: t.guideHub.title,
    description: t.guideHub.body,
    robots: { index: false, follow: false },
  };
}

/**
 * Le centre d'aide.
 *
 * Il etait une grande image, un titre, et une seule carte : on arrivait
 * sur une page qui semblait en construction. Il suit maintenant le trajet
 * d'une scene — importer, preparer, doubler, partager —, propose un guide
 * pour chaque etape, les reflexes qui evitent les mauvaises surprises, et
 * les questions frequentes.
 */
export default async function GuidesPage() {
  const [user, t] = await Promise.all([currentUser(), getDictionary()]);
  const h = t.guideHub;

  return (
    <div className="relative isolate flex min-h-dvh flex-col items-center px-3 py-4 sm:px-6 sm:py-6">
      <HeroBackdrop />
      <div className="w-full max-w-[min(84rem,94vw)]">
        <SiteHeader signedIn={!!user} right={user ? <AccountMenu /> : undefined} />

        <TvSet>
          <main className="space-y-14 sm:space-y-20">
            {/* ── La promesse et le trajet ──────────────────────────── */}
            <section className="hero-accueil grid items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
              <div className="space-y-5 text-center lg:text-left">
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
                  className="signage hero-titre text-balance text-4xl leading-[0.95] sm:text-6xl"
                >
                  {h.title}
                </h1>
                <p
                  data-reveal
                  suppressHydrationWarning
                  style={delai(180)}
                  className="mx-auto max-w-xl text-balance text-base leading-relaxed text-text-muted lg:mx-0"
                >
                  {h.body}
                </p>
                <div
                  data-reveal
                  suppressHydrationWarning
                  style={delai(270)}
                  className="flex flex-col items-stretch gap-3 pt-1 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start"
                >
                  <LinkButton href={user ? '/sessions/new' : '/login'} size="lg">
                    <Plus className="h-5 w-5" aria-hidden />
                    {h.heroCreate}
                  </LinkButton>
                  <LinkButton href="/communaute" variant="secondary" size="lg">
                    <Library className="h-5 w-5" aria-hidden />
                    {h.heroCommunity}
                  </LinkButton>
                </div>
              </div>

              <div
                data-reveal
                suppressHydrationWarning
                style={delai(240)}
                className="panel mx-auto w-full max-w-md space-y-5 p-6 sm:p-8"
              >
                <h2 className="text-xs font-bold uppercase tracking-widest text-text-faint">
                  {h.journeyTitle}
                </h2>
                <ol className="relative space-y-6">
                  <span
                    className="absolute bottom-5 left-5 top-5 w-px -translate-x-1/2 bg-border-strong"
                    aria-hidden
                  />
                  {h.journey.map((etape, rang) => {
                    const Icone = ICONES_PARCOURS[rang] ?? Share2;
                    return (
                      <li key={etape.title} className="relative flex gap-4">
                        <span
                          className={
                            rang === h.journey.length - 1
                              ? 'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink'
                              : 'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-border-strong bg-surface-raised text-text'
                          }
                        >
                          <Icone className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="min-w-0 space-y-0.5 pt-0.5">
                          <span className="block text-sm font-bold text-text">{etape.title}</span>
                          <span className="block text-xs leading-relaxed text-text-muted">
                            {etape.body}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </section>

            {/* ── Un guide par etape ────────────────────────────────── */}
            <section className="space-y-6">
              <div className="space-y-2 text-center">
                <h2 data-reveal suppressHydrationWarning className="titre titre-section text-2xl sm:text-3xl">
                  {h.guidesTitle}
                </h2>
                <p
                  data-reveal
                  suppressHydrationWarning
                  className="mx-auto max-w-2xl text-sm leading-relaxed text-text-muted"
                >
                  {h.guidesSubtitle}
                </p>
              </div>
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {GUIDE_ORDER.map((guide, rang) => {
                  const fiche = ficheGuide(t, guide.cle);
                  return (
                    <li key={guide.href} data-reveal suppressHydrationWarning style={delai(rang * 110)}>
                      <Link
                        href={guide.href}
                        className="panel carte-valeur group flex h-full flex-col overflow-hidden"
                      >
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
                          <p className="flex items-center gap-1.5 text-xs font-semibold text-text-faint">
                            <Clock className="h-3.5 w-3.5" aria-hidden />
                            {fiche.duree}
                          </p>
                          <h3 className="text-lg font-bold leading-snug text-text">{fiche.titre}</h3>
                          <p className="text-sm leading-relaxed text-text-muted">{fiche.resume}</p>
                          <span className="lien-surligne mt-auto self-start pt-2 text-sm font-bold text-text">
                            {h.readGuide}
                            <ArrowRight className="ml-1 inline h-4 w-4" aria-hidden />
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* ── Les reflexes ──────────────────────────────────────── */}
            <section className="space-y-6">
              <h2 data-reveal suppressHydrationWarning className="titre titre-section text-center text-2xl sm:text-3xl">
                {h.tipsTitle}
              </h2>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {h.tips.map((astuce, rang) => {
                  const Icone = ICONES_ASTUCES[rang] ?? Headphones;
                  return (
                    <li
                      key={astuce.title}
                      data-reveal
                      suppressHydrationWarning
                      style={delai(rang * 70)}
                      className="panel flex gap-4 p-5"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                        <Icone className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="space-y-1">
                        <span className="block font-bold text-text">{astuce.title}</span>
                        <span className="block text-sm leading-relaxed text-text-muted">{astuce.body}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* ── Les questions ─────────────────────────────────────── */}
            <section className="mx-auto max-w-3xl space-y-5">
              <h2 data-reveal suppressHydrationWarning className="titre titre-section text-center text-2xl sm:text-3xl">
                {t.home.faqTitle}
              </h2>
              <div data-reveal suppressHydrationWarning>
                <FaqList items={[...t.home.faq, ...t.home.faqExtra]} />
              </div>
            </section>

            {/* ── Le rappel ─────────────────────────────────────────── */}
            <section
              data-reveal
              suppressHydrationWarning
              className="appel-final rounded-card border-2 border-bezel-dark bg-surface-sunken px-5 py-10 text-center"
            >
              {/* Le titre est un `p`, le texte un `div` : la peau cinema
                  habille les paragraphes de ce bloc comme son titre. */}
              <p className="mx-auto max-w-xl text-balance text-2xl font-bold">{h.finalTitle}</p>
              <div className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-text-muted">
                {h.finalBody}
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <LinkButton href={user ? '/sessions/new' : '/login'}>
                  {h.heroCreate}
                  <ArrowRight className="h-4 w-4" aria-hidden />
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
