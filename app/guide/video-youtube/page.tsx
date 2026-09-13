import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Check, Upload } from 'lucide-react';

import { AccountMenu } from '@/components/account-menu';
import { FaqList } from '@/components/faq-list';
import { Footer } from '@/components/footer';
import { GuideIcon, type GuideIconName } from '@/components/guide-icon';
import { HeroBackdrop } from '@/components/hero-backdrop';
import { SiteHeader } from '@/components/site-header';
import { TvSet } from '@/components/tv-set';
import { GuideStructuredData } from '@/components/guide-structured-data';
import { currentLocale, getDictionary } from '@/lib/i18n-server';
import { currentUser } from '@/lib/supabase/server';

/** Le decalage d'une apparition, lu par la feuille de style. */
const delai = (ms: number) => ({ '--delai': `${ms}ms` }) as CSSProperties;

const ICONES_ETAPES: GuideIconName[] = ['lien', 'telechargement', 'chrono', 'import'];

/*
 * Le guide d'import, ouvert aux moteurs.
 *
 * Il explique comment apporter sa video, quelle qu'en soit la source, sans
 * rien heberger ni montrer d'une oeuvre : c'est une question qu'on tape
 * avant de connaitre le produit, et la page qui y repond doit pouvoir etre
 * trouvee.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return {
    title: t.guide.metaTitle,
    description: t.guide.heroBody,
    robots: { index: true, follow: true },
    alternates: { canonical: '/guide/video-youtube' },
    openGraph: {
      type: 'article',
      title: t.guide.metaTitle,
      description: t.guide.heroBody,
      images: [{ url: '/illustrations/cinema/art-import.webp', width: 1000, height: 563 }],
    },
  };
}

/**
 * Doubler une scene du catalogue avec sa propre video.
 *
 * Construite comme les pages d'aide des catalogues de medias : une
 * promesse et deux actions en tete, les etapes numerotees en cartes, ce
 * qu'il faut verifier a cote de ce qu'il faut comprendre, les questions
 * qui restent, et un dernier rappel de l'action. Tout est lisible sans
 * rien ouvrir ; seules les reponses aux questions se deplient.
 */
export default async function GuideVideoPage() {
  const [user, t, locale] = await Promise.all([currentUser(), getDictionary(), currentLocale()]);
  const g = t.guide;

  const boutonPlein =
    'btn-3d btn-primary inline-flex h-14 items-center justify-center gap-2 whitespace-nowrap bg-accent px-7 text-base font-semibold text-accent-ink';
  const boutonContour =
    'btn-3d btn-secondary btn-bascule inline-flex h-14 items-center justify-center gap-2 whitespace-nowrap px-6 text-sm font-semibold text-text';

  // Le trajet d'une scene, en trois objets : une source, un fichier, un
  // lobby. La source peut etre n'importe laquelle, le format aussi.
  const trajet: { nom: GuideIconName; titre: string; detail: string }[] = [
    { nom: 'lien', titre: g.steps[0]?.title ?? '', detail: 'YouTube · TikTok · …' },
    { nom: 'fichier', titre: g.steps[1]?.title ?? '', detail: g.trajetFile },
    { nom: 'clap', titre: g.steps[3]?.title ?? '', detail: t.status.lobby },
  ];

  return (
    <div className="relative isolate flex min-h-dvh flex-col items-center px-3 py-4 sm:px-6 sm:py-6">
      <HeroBackdrop variant="guides" />
      <div className="w-full max-w-[min(84rem,94vw)]">
        <SiteHeader signedIn={!!user} right={user ? <AccountMenu /> : undefined} />

        <TvSet>
          <main className="space-y-14 sm:space-y-20">
            {/* ── La promesse ───────────────────────────────────────── */}
            <section className="hero-accueil grid items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
              <div className="space-y-5 text-center lg:text-left">
                <p
                  data-reveal
                  suppressHydrationWarning
                  style={delai(0)}
                  className="accroche inline-flex items-center gap-2 rounded-full border-2 border-border-strong bg-surface-raised px-3 py-1 text-xs font-bold uppercase tracking-wide text-text-muted"
                >
                  <BookOpen className="h-3.5 w-3.5" aria-hidden />
                  {g.kicker}
                </p>

                <h1
                  data-reveal
                  suppressHydrationWarning
                  style={delai(90)}
                  className="signage hero-titre text-balance text-4xl leading-[0.95] sm:text-6xl"
                >
                  {g.heroTitle}
                </h1>

                <p
                  data-reveal
                  suppressHydrationWarning
                  style={delai(180)}
                  className="mx-auto max-w-xl text-balance text-base leading-relaxed text-text-muted lg:mx-0"
                >
                  {g.heroBody}
                </p>

                <div
                  data-reveal
                  suppressHydrationWarning
                  style={delai(270)}
                  className="flex flex-col items-stretch gap-3 pt-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center lg:justify-start"
                >
                  <Link href="/communaute" className={boutonPlein}>
                    {g.ctaPrimary}
                    <ArrowRight className="h-5 w-5" aria-hidden />
                  </Link>
                  <a href="#pourquoi" className={boutonContour}>
                    {g.ctaSecondary}
                  </a>
                </div>
              </div>

              <div
                data-reveal
                suppressHydrationWarning
                style={delai(240)}
                className="panel mx-auto w-full max-w-md p-6 sm:p-8"
              >
                <ol className="relative space-y-7">
                  {/* Le fil qui relie les trois etapes. */}
                  <span
                    className="absolute bottom-5 left-5 top-5 w-px -translate-x-1/2 bg-border-strong"
                    aria-hidden
                  />
                  {trajet.map(({ nom, titre, detail }, rang) => (
                    <li key={titre} className="relative flex items-center gap-4">
                      <span
                        className={
                          rang === trajet.length - 1
                            ? 'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-accent bg-surface-raised'
                            : 'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-border-strong bg-surface-raised'
                        }
                      >
                        <GuideIcon nom={nom} className="h-7 w-7" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-text">{titre}</span>
                        <span className="block truncate font-mono text-xs text-text-faint">
                          {detail}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            {/* ── Les etapes ────────────────────────────────────────── */}
            <section className="space-y-6">
              <h2
                data-reveal
                suppressHydrationWarning
                className="titre titre-section text-center text-2xl sm:text-3xl"
              >
                {g.stepsTitle}
              </h2>
              <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {g.steps.map((etape, rang) => {
                  const nom = ICONES_ETAPES[rang] ?? 'import';
                  return (
                    <li
                      key={etape.title}
                      data-reveal
                      suppressHydrationWarning
                      style={delai(rang * 110)}
                      className="panel carte-valeur relative flex flex-col gap-3 overflow-hidden p-5"
                    >
                      <span
                        aria-hidden
                        className="pointer-events-none absolute -right-1 -top-5 select-none text-[6.5rem] font-black leading-none text-text opacity-[0.06]"
                      >
                        {rang + 1}
                      </span>
                      <GuideIcon
                        nom={nom}
                        className="relative h-14 w-14 drop-shadow-[0_10px_14px_rgb(0_0_0/0.55)]"
                      />
                      <h3 className="relative text-base font-bold text-text">{etape.title}</h3>
                      <p className="relative text-sm leading-relaxed text-text-muted">
                        {etape.body}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </section>

            {/* ── Comprendre, et verifier ───────────────────────────── */}
            <section
              id="pourquoi"
              className="grid scroll-mt-24 gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-start"
            >
              <div className="space-y-4">
                <h2 data-reveal suppressHydrationWarning className="titre text-2xl sm:text-3xl">
                  {g.whyTitle}
                </h2>
                <p
                  data-reveal
                  suppressHydrationWarning
                  className="max-w-2xl text-base leading-relaxed text-text-muted"
                >
                  {g.whyBody}
                </p>
                <div
                  data-reveal
                  suppressHydrationWarning
                  style={delai(0)}
                  className="panel max-w-xl space-y-2 p-5"
                >
                  <h3 className="flex items-center gap-2 font-bold text-text">
                    <Upload className="h-4 w-4 text-link" aria-hidden />
                    {g.wayFileTitle}
                  </h3>
                  <p className="text-sm leading-relaxed text-text-muted">{g.wayFileBody}</p>
                </div>
              </div>

              <aside
                data-reveal
                suppressHydrationWarning
                style={delai(160)}
                className="panel space-y-4 p-6"
              >
                <h2 className="text-lg font-bold text-text">{g.checklistTitle}</h2>
                <ul className="space-y-3">
                  {g.checklist.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-sm leading-relaxed text-text-muted"
                    >
                      {/* La couleur d'action, et non le vert : son encre
                          sombre, faite pour les fonds clairs, disparaissait
                          sur le charbon de la salle. */}
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink">
                        <Check className="h-3.5 w-3.5" aria-hidden />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </aside>
            </section>

            {/* ── Les questions qui restent ─────────────────────────── */}
            <section className="mx-auto max-w-3xl space-y-5">
              <h2
                data-reveal
                suppressHydrationWarning
                className="titre titre-section text-center text-2xl sm:text-3xl"
              >
                {g.faqTitle}
              </h2>
              {/* Le meme accordeon que l'accueil et les guides : il s'ouvre
                  en douceur, la ou `details` sautait d'un coup. */}
              <div data-reveal suppressHydrationWarning>
                <FaqList items={g.faq} />
              </div>
            </section>

            {/* ── Le rappel ─────────────────────────────────────────── */}
            <section
              data-reveal
              suppressHydrationWarning
              className="appel-final rounded-card px-5 py-10 text-center"
            >
              {/* La meme construction que le rappel de l'accueil : la feuille
                  de style met en grand le paragraphe de ce bloc. C'est donc la
                  question qui est un paragraphe, et l'explication qui n'en
                  est pas un. */}
              <p className="mx-auto max-w-xl text-balance text-lg font-bold">{g.finalTitle}</p>
              <div className="mx-auto mt-3 max-w-xl text-balance text-sm leading-relaxed text-text-muted">
                {g.finalBody}
              </div>
              <Link href="/communaute" className={`${boutonPlein} mt-6`}>
                {g.ctaPrimary}
                <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
            </section>
          </main>
        </TvSet>

        <Footer />
      </div>

      <GuideStructuredData
        path="/guide/video-youtube"
        name={g.metaTitle}
        description={g.heroBody}
        image="/illustrations/cinema/art-import.webp"
        locale={locale}
        hubName={t.guideHub.title}
        steps={g.steps}
        faq={g.faq}
      />
    </div>
  );
}
