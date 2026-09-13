import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Clapperboard, Library, Sparkles } from 'lucide-react';

import { Carousel, type Slide } from '@/components/carousel';
import { AccountMenu } from '@/components/account-menu';
import { FaqList } from '@/components/faq-list';
import { Footer } from '@/components/footer';
import { HeroBackdrop } from '@/components/hero-backdrop';
import { HeroRythmo } from '@/components/hero-rythmo';
import { HomePacksCta } from '@/components/home-packs-cta';
import { loadHomeDemo } from '@/lib/home-demo';
import { ArtCharacters, ArtImport, ArtRender, ArtRythmo } from '@/components/home-art';
import { SiteHeader } from '@/components/site-header';
import { StructuredData } from '@/components/structured-data';
import { TvSet } from '@/components/tv-set';
import { Card } from '@/components/ui';
import { currentLocale, getDictionary } from '@/lib/i18n-server';
import { LOCALES, type Locale } from '@/config/i18n';
import { SITE_URL } from '@/config/site';
import { GUIDE_VIDEO_HREF } from '@/config/constants';
import { APP_NAME } from '@/config/strings';
import { currentUser } from '@/lib/supabase/server';

/**
 * Le decalage d'une apparition, lu par la feuille de style.
 *
 * Chaque bloc anime porte aussi `suppressHydrationWarning` : le script
 * d'apparition marque les blocs deja visibles avant que React ne reprenne
 * la main, et React signalait cet attribut ajoute comme un ecart entre le
 * serveur et le client. Il est attendu, et il ne concerne que l'element
 * lui-meme.
 */
const delai = (ms: number) => ({ '--delai': `${ms}ms` }) as CSSProperties;

/**
 * Accueil.
 *
 * C'est la seule page visible sans compte. Elle ne montre ni scene de
 * joueur, ni participant, ni rendu ; sa seule scene est celle de la
 * vitrine, figee dans le depot (voir `lib/home-demo.ts`). Elle explique le
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
 * C'est une page de presentation. La scene de la vitrine est une courte
 * video sans son servie par le site. Le
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
      images: [{ url: '/illustrations/og-invitation.jpg', width: 1200, height: 630 }],
    },
  };
}

export default async function HomePage() {
  const [user, t, locale, demo] = await Promise.all([
    currentUser(),
    getDictionary(),
    currentLocale(),
    loadHomeDemo(),
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
    <div className="relative isolate flex min-h-dvh flex-col items-center px-3 py-4 sm:px-6 sm:py-6">
      {/* Le film plein cadre, derriere l'accroche. */}
      <HeroBackdrop />
      <div className="w-full max-w-[min(84rem,94vw)]">
        <SiteHeader signedIn={!!user} right={user ? <AccountMenu /> : undefined} />

        <TvSet>
          <main className="space-y-12 sm:space-y-16">
            {/* ── La promesse, et la preuve, sans faire defiler ─────── */}
            <section className="hero-accueil grid items-center gap-8 lg:grid-cols-[1.15fr_1fr]">
              <div className="space-y-5 text-center lg:text-left">
                <p
                  data-reveal suppressHydrationWarning
                  style={delai(0)}
                  className="accroche inline-flex items-center gap-2 rounded-full border-2 border-border-strong bg-surface-raised px-3 py-1 text-xs font-bold uppercase tracking-wide text-text-muted"
                >
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  {t.home.kicker}
                </p>

                <h1
                  data-reveal suppressHydrationWarning
                  style={delai(90)}
                  className="signage hero-titre text-balance text-4xl leading-[0.95] sm:text-6xl"
                >
                  {t.home.heroTitle}
                </h1>

                <p
                  data-reveal suppressHydrationWarning
                  style={delai(180)}
                  className="mx-auto max-w-xl text-balance text-base leading-relaxed text-text-muted lg:mx-0"
                >
                  {t.home.heroBody}
                </p>

                <div
                  data-reveal suppressHydrationWarning
                  style={delai(270)}
                  className="flex flex-col items-stretch gap-3 pt-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center lg:justify-start"
                >
                  <Link
                    href={primaryHref}
                    className="btn-3d btn-primary inline-flex h-14 items-center justify-center gap-2 whitespace-nowrap bg-accent px-7 text-base font-semibold text-accent-ink sm:text-lg"
                  >
                    {primaryLabel}
                    <ArrowRight className="h-5 w-5" aria-hidden />
                  </Link>

                  {/* Retrouver les siennes : utile, mais jamais la
                      premiere chose qu'on vient faire. */}
                  {user ? (
                    <Link
                      href="/sessions"
                      className="btn-3d btn-secondary inline-flex h-14 items-center justify-center gap-2 whitespace-nowrap px-5 text-sm font-semibold text-text"
                    >
                      <Clapperboard className="h-5 w-5" aria-hidden />
                      {t.home.ctaSessions}
                    </Link>
                  ) : null}

                  <Link
                    href="/communaute"
                    className="btn-3d btn-secondary inline-flex h-14 items-center justify-center gap-2 whitespace-nowrap px-5 text-sm font-semibold text-text"
                  >
                    <Library className="h-5 w-5" aria-hidden />
                    {t.home.ctaCommunity}
                  </Link>
                </div>

                {/* Les trois objections qui arrivent avant toute autre. */}
                <ul
                  data-reveal suppressHydrationWarning
                  style={delai(360)}
                  className="flex flex-wrap justify-center gap-x-5 gap-y-2 pt-1 text-xs font-bold text-text-faint lg:justify-start"
                >
                  {[t.home.reassure1, t.home.reassure2, t.home.reassure3].map(
                    (item) => (
                      <li key={item} className="inline-flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-ok" aria-hidden />
                        {item}
                      </li>
                    ),
                  )}
                </ul>

                {/* Le second chemin des scenes du catalogue, dit la ou l'on
                    decide : sans lui, une scene qui ne se telecharge pas
                    ressemble a une scene cassee. */}
                <p
                  data-reveal suppressHydrationWarning
                  style={delai(450)}
                  className="text-sm text-text-muted"
                >
                  {t.guide.homeLead}{' '}
                  <Link href={GUIDE_VIDEO_HREF} className="lien-surligne font-bold text-text">
                    {t.guide.homeAction}&nbsp;→
                  </Link>
                </p>
              </div>

              <div data-reveal suppressHydrationWarning style={delai(240)}>
                <HeroRythmo demo={demo} />
              </div>
            </section>

            {/* ── Ce qu'on y gagne, dit en trois fois ───────────────── */}
            <section className="space-y-4">
              <h2 data-reveal suppressHydrationWarning className="titre titre-section text-xl">
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
                ].map(({ nom, title, body }, rang) => (
                  <Card
                    key={title}
                    data-reveal suppressHydrationWarning
                    style={delai(rang * 120)}
                    className="carte-valeur flex flex-col items-center gap-3 text-center"
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
              <h2 data-reveal suppressHydrationWarning className="titre titre-section text-xl">
                {t.home.howTitle}
              </h2>
              <div data-reveal suppressHydrationWarning>
                <Carousel slides={slides} />
              </div>
            </section>

            {/* Le guide d'import, la ou l'on vient de voir le deroule : la
                premiere question qui suit est « et ma video, je la trouve
                ou ? ». N'importe quelle source fait l'affaire. */}
            <section
              data-reveal
              suppressHydrationWarning
              className="panel carte-valeur grid items-stretch overflow-hidden sm:grid-cols-[minmax(0,18rem)_1fr]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/illustrations/cinema/art-import.webp"
                alt=""
                loading="lazy"
                className="aspect-video h-full w-full object-cover sm:aspect-auto"
              />
              <div className="space-y-2 p-5 sm:p-6">
                <span className="text-xs font-bold uppercase tracking-widest text-text-faint">
                  {t.guide.kicker}
                </span>
                <h2 className="titre text-xl text-balance">{t.guide.homeBannerTitle}</h2>
                <div className="text-sm leading-relaxed text-text-muted">
                  {t.guide.homeBannerBody}
                </div>
                <Link
                  href={GUIDE_VIDEO_HREF}
                  className="lien-surligne inline-block pt-1 text-sm font-bold text-text"
                >
                  {t.guide.homeBannerAction}&nbsp;→
                </Link>
              </div>
            </section>

            {/* Rappel de l'action, a mi-parcours : on decide rarement en
                haut de page, et personne ne remonte pour chercher. */}
            <section
              data-reveal suppressHydrationWarning
              className="appel-final rounded-card px-5 py-6 text-center"
            >
              <p className="mx-auto max-w-xl text-balance text-lg font-bold">
                {t.home.midCta}
              </p>
              <Link
                href={primaryHref}
                className="btn-3d btn-primary mt-4 inline-flex h-12 items-center justify-center gap-2 bg-accent px-7 text-sm font-semibold text-accent-ink"
              >
                {primaryLabel}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              {/* Un `div`, pas un `p` : la feuille de style habille les
                  paragraphes de ce bloc comme son titre. */}
              <div className="mt-4 text-xs text-text-muted">
                <Link href={GUIDE_VIDEO_HREF} className="lien-surligne font-bold text-text">
                  {t.guide.midLink}
                </Link>
              </div>
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
            <section className="space-y-10 sm:space-y-14">
              {[
                { titre: t.home.defineTitle, texte: t.home.defineBody },
                { titre: t.home.defineHowTitle, texte: t.home.defineHowBody },
                { titre: t.home.defineWhoTitle, texte: t.home.defineWhoBody },
              ].map(({ titre, texte }, rang) => (
                <article key={titre} className="definition space-y-2">
                  {/* Le grand numero cerne d'or : decor pur. */}
                  <span
                    data-reveal
                    suppressHydrationWarning
                    className="definition-numero titre"
                    aria-hidden
                  >
                    {String(rang + 1).padStart(2, '0')}
                  </span>
                  <div className="space-y-3">
                    <h2
                      data-reveal="gauche"
                      suppressHydrationWarning
                      style={delai(120)}
                      className="titre titre-section text-xl"
                    >
                      {titre}
                    </h2>
                    <p
                      data-reveal
                      suppressHydrationWarning
                      style={delai(280)}
                      className="max-w-prose text-sm leading-relaxed text-text-muted"
                    >
                      {texte}
                    </p>
                  </div>
                </article>
              ))}
            </section>

            {/* ── Les questions qui restent ──────────────────────────── */}
            <section className="space-y-4">
              <h2 data-reveal suppressHydrationWarning className="titre titre-section text-xl">
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

      <StructuredData t={t} locale={locale} />
    </div>
  );
}
