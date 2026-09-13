import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, Clapperboard, Library, Sparkles } from 'lucide-react';

import { Carousel, type Slide } from '@/components/carousel';
import { AccountMenu } from '@/components/account-menu';
import { FaqList } from '@/components/faq-list';
import { Footer } from '@/components/footer';
import { HeroRythmo } from '@/components/hero-rythmo';
import { HomePacksCta } from '@/components/home-packs-cta';
import { ArtCharacters, ArtImport, ArtRender, ArtRythmo } from '@/components/home-art';
import { SiteHeader } from '@/components/site-header';
import { StructuredData } from '@/components/structured-data';
import { TvSet } from '@/components/tv-set';
import { Card } from '@/components/ui';
import { currentLocale, getDictionary } from '@/lib/i18n-server';
import { LOCALES, type Locale } from '@/config/i18n';
import { SITE_URL } from '@/config/site';
import { APP_NAME } from '@/config/strings';
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
/**
 * L'accueil est la seule page du produit qui a vocation a etre trouvee.
 *
 * Elle ne montre aucune oeuvre : c'est une page de presentation. Le
 * `robots` global ferme tout ; cette page-ci rouvre pour elle-meme.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return {
    // `absolute` : le gabarit ajoute « · Dub’Up » a tout titre de page,
    // et le nom du produit y figure deja.
    title: { absolute: `${t.home.seoTitle} · ${APP_NAME}` },
    description: t.home.heroBody,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
      },
    },
    /*
     * Pas d'`hreflang` : les dix langues partagent une seule adresse,
     * et declarer dix variantes pointant toutes au meme endroit est une
     * erreur que Google signale. Tant qu'une langue n'a pas d'adresse a
     * elle — `/en/`, `/es/` — il n'y a rien a declarer. C'est le
     * prochain pas si le referencement multilingue compte.
     */
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      url: SITE_URL,
      title: `${t.home.seoTitle} · ${APP_NAME}`,
      description: t.home.heroBody,
      images: [{ url: '/illustrations/og-card.webp', width: 1200, height: 675 }],
    },
  };
}

export default async function HomePage() {
  const [user, t, locale] = await Promise.all([
    currentUser(),
    getDictionary(),
    currentLocale(),
  ]);
  /*
   * Ou mene le bouton plein.
   *
   * Un visiteur n'a qu'une decision a prendre : essayer. Une fois entre,
   * la question devient « qu'est-ce que je fais maintenant », et la
   * reponse la plus frequente est d'en commencer une nouvelle. L'ancien
   * chemin passait par la liste des scenes, ce qui ajoutait un clic a
   * l'action la plus courante et laissait le visiteur devant un
   * inventaire plutot que devant un depart.
   */
  const primaryHref = user ? '/sessions/new' : '/login';
  const primaryLabel = user ? t.sessions.create : t.home.cta;

  const slides: Slide[] = [
    {
      title: t.home.slides.importTitle,
      body: t.home.slides.importBody,
      art: <ArtImport />,
    },
    {
      title: t.home.slides.charactersTitle,
      body: t.home.slides.charactersBody,
      art: <ArtCharacters />,
    },
    {
      title: t.home.slides.rythmoTitle,
      body: t.home.slides.rythmoBody,
      art: <ArtRythmo />,
    },
    {
      title: t.home.slides.renderTitle,
      body: t.home.slides.renderBody,
      art: <ArtRender />,
    },
  ];

  return (
    <div className="flex min-h-dvh flex-col items-center px-3 py-4 sm:px-6 sm:py-6">
      <div className="w-full max-w-[min(84rem,94vw)]">
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
                    className="btn-3d btn-primary inline-flex h-14 items-center justify-center gap-2 whitespace-nowrap bg-accent px-7 text-base font-semibold uppercase tracking-wide text-accent-ink [--btn-lip:var(--color-accent-ink)] hover:bg-accent-hover sm:text-lg"
                  >
                    {primaryLabel}
                    <ArrowRight className="h-5 w-5" aria-hidden />
                  </Link>

                  {/* Retrouver les siennes : utile, mais jamais la
                      premiere chose qu'on vient faire. */}
                  {user ? (
                    <Link
                      href="/sessions"
                      className="btn-3d btn-secondary inline-flex h-14 items-center justify-center gap-2 whitespace-nowrap bg-surface-raised px-5 text-sm font-semibold uppercase tracking-wide text-text [--btn-lip:var(--color-border-strong)]"
                    >
                      <Clapperboard className="h-5 w-5" aria-hidden />
                      {t.home.ctaSessions}
                    </Link>
                  ) : null}

                  <Link
                    href="/communaute"
                    className="btn-3d btn-secondary inline-flex h-14 items-center justify-center gap-2 whitespace-nowrap bg-surface-raised px-5 text-sm font-semibold uppercase tracking-wide text-text [--btn-lip:var(--color-border-strong)]"
                  >
                    <Library className="h-5 w-5" aria-hidden />
                    {t.home.ctaCommunity}
                  </Link>
                </div>

                {/* Les trois objections qui arrivent avant toute autre. */}
                <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 pt-1 text-xs font-bold text-text-faint lg:justify-start">
                  {[t.home.reassure1, t.home.reassure2, t.home.reassure3].map(
                    (item) => (
                      <li key={item} className="inline-flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-ok" aria-hidden />
                        {item}
                      </li>
                    ),
                  )}
                </ul>
              </div>

              <HeroRythmo />
            </section>

            {/* ── Ce qu'on y gagne, dit en trois fois ───────────────── */}
            <section className="space-y-4">
              <h2 className="signage text-xl" style={{ textShadow: 'none' }}>
                {t.home.valueTitle}
              </h2>
              {/*
                Trois cartes courtes, donc centrees.

                La regle vaut pour tout le site : ce qui tient en deux
                lignes sous une image se centre, ce qui se lit en
                paragraphes reste cale a gauche. Centrer un texte long
                deplace le debut de chaque ligne et oblige l'oeil a le
                rechercher a chaque retour.
              */}
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { nom: 'voix', ...t.home.value1 },
                  { nom: 'secret', ...t.home.value2 },
                  { nom: 'fichier', ...t.home.value3 },
                ].map(({ nom, title, body }) => (
                  <Card
                    key={title}
                    className="flex flex-col items-center gap-3 text-center"
                  >
                    <span className={`icone icone-${nom} h-20 w-20`} aria-hidden />
                    <h3 className="text-base font-bold text-balance">{title}</h3>
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
                className="btn-3d btn-primary mt-4 inline-flex h-12 items-center justify-center gap-2 bg-accent px-7 text-sm font-semibold uppercase tracking-wide text-accent-ink [--btn-lip:var(--color-accent-ink)] hover:bg-accent-hover"
              >
                {primaryLabel}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </section>

            {/* Si la personne est connectee et n'a rien publie, c'est ici
                qu'on lui propose de le faire : l'onglet « Mes packs »
                n'existe pas tant qu'il serait vide. */}
            {user ? <HomePacksCta /> : null}

            {/*
              Les sections de fond.

              Elles ne sont pas la pour remplir : ce sont les trois
              questions que quelqu'un tape avant de connaitre le produit
              — ce que c'est, comment on fait, a qui ca sert. Un moteur
              de reponse qui cite cette page citera ces paragraphes,
              parce que ce sont les seuls qui repondent sans supposer
              qu'on sait deja de quoi on parle.
            */}
            <section className="space-y-6">
              <article className="space-y-2">
                <h2 className="signage text-xl" style={{ textShadow: 'none' }}>
                  {t.home.defineTitle}
                </h2>
                <p className="max-w-prose text-sm leading-relaxed text-text-muted">
                  {t.home.defineBody}
                </p>
              </article>

              <article className="space-y-2">
                <h2 className="signage text-xl" style={{ textShadow: 'none' }}>
                  {t.home.defineHowTitle}
                </h2>
                <p className="max-w-prose text-sm leading-relaxed text-text-muted">
                  {t.home.defineHowBody}
                </p>
              </article>

              <article className="space-y-2">
                <h2 className="signage text-xl" style={{ textShadow: 'none' }}>
                  {t.home.defineWhoTitle}
                </h2>
                <p className="max-w-prose text-sm leading-relaxed text-text-muted">
                  {t.home.defineWhoBody}
                </p>
              </article>
            </section>

            {/* ── Les questions qui restent ──────────────────────────── */}
            <section className="space-y-4">
              <h2 className="signage text-xl" style={{ textShadow: 'none' }}>
                {t.home.faqTitle}
              </h2>
              <FaqList items={[...t.home.faq, ...t.home.faqExtra]} />
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

      <StructuredData t={t} locale={locale} />
    </div>
  );
}
