import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Headphones,
  Library,
  Mic,
  Sparkles,
} from 'lucide-react';

import { Carousel, type Slide } from '@/components/carousel';
import { AccountMenu } from '@/components/account-menu';
import { Footer } from '@/components/footer';
import { HeroRythmo } from '@/components/hero-rythmo';
import { HomePacksCta } from '@/components/home-packs-cta';
import {
  ArtCharacters,
  ArtImport,
  ArtRender,
  ArtRythmo,
} from '@/components/home-art';
import { SiteHeader } from '@/components/site-header';
import { TvSet } from '@/components/tv-set';
import { Card } from '@/components/ui';
import { getDictionary } from '@/lib/i18n-server';
import { currentUser } from '@/lib/supabase/server';

/**
 * Accueil.
 *
 * C'est la seule page visible sans compte, et elle ne montre aucun
 * contenu : ni scene, ni participant, ni rendu. Elle explique le
 * principe, ce qui permet de la faire lire a quelqu'un avant de
 * l'inviter, sans rien ouvrir de ce que le PRD §14 protege.
 *
 * Elle est construite pour decider : une promesse, une preuve visible
 * tout de suite, une seule action mise en avant, et les objections
 * traitees dans l'ordre ou elles viennent. Ce qu'elle ne fait pas, c'est
 * inventer une preuve sociale : ni compteur d'utilisateurs, ni
 * temoignage. Un produit prive sur invitation n'en a pas, et en fabriquer
 * serait mentir a la premiere personne qu'on invite.
 */
export default async function HomePage() {
  const [user, t] = await Promise.all([currentUser(), getDictionary()]);
  const primaryHref = user ? '/sessions' : '/login';

  const slides: Slide[] = [
    { title: t.home.slides.importTitle, body: t.home.slides.importBody, art: <ArtImport /> },
    { title: t.home.slides.charactersTitle, body: t.home.slides.charactersBody, art: <ArtCharacters /> },
    { title: t.home.slides.rythmoTitle, body: t.home.slides.rythmoBody, art: <ArtRythmo /> },
    { title: t.home.slides.renderTitle, body: t.home.slides.renderBody, art: <ArtRender /> },
  ];

  return (
    <div className="flex min-h-dvh flex-col items-center px-3 py-4 sm:px-6 sm:py-6">
      <div className="w-full max-w-5xl">
        <SiteHeader signedIn={!!user} right={user ? <AccountMenu /> : undefined} />

        <TvSet>
          <main className="space-y-12 sm:space-y-16">
            {/* ── La promesse, et la preuve, sans faire defiler ─────── */}
            <section className="grid items-center gap-8 lg:grid-cols-[1.15fr_1fr]">
              <div className="space-y-5 text-center lg:text-left">
                <p className="inline-flex items-center gap-2 rounded-full border-2 border-border-strong bg-surface-raised px-3 py-1 text-xs font-bold uppercase tracking-wide text-text-muted">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  {t.home.kicker}
                </p>

                <h1 className="signage text-balance text-4xl leading-[0.95] text-[oklch(0.55_0.17_235)] sm:text-6xl">
                  {t.home.heroTitle}
                </h1>

                <p className="mx-auto max-w-xl text-balance text-base leading-relaxed text-text-muted lg:mx-0">
                  {t.home.heroBody}
                </p>

                <div className="flex flex-col items-stretch gap-3 pt-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center lg:justify-start">
                  <Link
                    href={primaryHref}
                    className="btn-3d inline-flex h-14 items-center justify-center gap-2 whitespace-nowrap bg-accent px-7 text-base font-semibold uppercase tracking-wide text-accent-ink [--btn-lip:var(--color-accent-ink)] hover:bg-accent-hover sm:text-lg"
                  >
                    {user ? t.home.ctaSessions : t.home.cta}
                    <ArrowRight className="h-5 w-5" aria-hidden />
                  </Link>
                  <Link
                    href="/communaute"
                    className="btn-3d inline-flex h-14 items-center justify-center gap-2 whitespace-nowrap bg-surface-raised px-5 text-sm font-semibold uppercase tracking-wide text-text [--btn-lip:var(--color-border-strong)]"
                  >
                    <Library className="h-5 w-5" aria-hidden />
                    {t.home.ctaCommunity}
                  </Link>
                </div>

                {/* Les trois objections qui arrivent avant toute autre. */}
                <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 pt-1 text-xs font-bold text-text-faint lg:justify-start">
                  {[t.home.reassure1, t.home.reassure2, t.home.reassure3].map((item) => (
                    <li key={item} className="inline-flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-ok" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <HeroRythmo />
            </section>

            {/* ── Ce qu'on y gagne, dit en trois fois ───────────────── */}
            <section className="space-y-4">
              <h2 className="signage text-xl" style={{ textShadow: 'none' }}>
                {t.home.valueTitle}
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { icon: Mic, ...t.home.value1 },
                  { icon: Headphones, ...t.home.value2 },
                  { icon: Sparkles, ...t.home.value3 },
                ].map(({ icon: Icon, title, body }) => (
                  <Card key={title} className="space-y-2">
                    <Icon className="h-5 w-5 text-link" aria-hidden />
                    <h3 className="text-sm font-bold">{title}</h3>
                    <p className="text-sm leading-relaxed text-text-muted">{body}</p>
                  </Card>
                ))}
              </div>
            </section>

            {/* ── Le deroule ─────────────────────────────────────────── */}
            <section className="space-y-4">
              <h2 className="signage text-xl" style={{ textShadow: 'none' }}>
                {t.home.howTitle}
              </h2>
              <Carousel slides={slides} />
            </section>

            {/* Rappel de l'action, a mi-parcours : on decide rarement en
                haut de page, et personne ne remonte pour chercher. */}
            <section className="rounded-card border-2 border-bezel-dark bg-surface-sunken px-5 py-6 text-center">
              <p className="mx-auto max-w-xl text-balance text-lg font-bold">
                {t.home.midCta}
              </p>
              <Link
                href={primaryHref}
                className="btn-3d mt-4 inline-flex h-12 items-center justify-center gap-2 bg-accent px-7 text-sm font-semibold uppercase tracking-wide text-accent-ink [--btn-lip:var(--color-accent-ink)] hover:bg-accent-hover"
              >
                {user ? t.home.ctaSessions : t.home.cta}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </section>

            {/* Si la personne est connectee et n'a rien publie, c'est ici
                qu'on lui propose de le faire : l'onglet « Mes packs »
                n'existe pas tant qu'il serait vide. */}
            {user ? <HomePacksCta /> : null}

            {/* ── Les questions qui restent ──────────────────────────── */}
            <section className="space-y-4">
              <h2 className="signage text-xl" style={{ textShadow: 'none' }}>
                {t.home.faqTitle}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {t.home.faq.map((item) => (
                  <Card key={item.q} className="space-y-1.5">
                    <h3 className="text-sm font-bold">{item.q}</h3>
                    <p className="text-sm leading-relaxed text-text-muted">{item.a}</p>
                  </Card>
                ))}
              </div>
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
