import Link from 'next/link';
import { ArrowRight, Clapperboard, Library, ThumbsUp } from 'lucide-react';

import { Footer } from '@/components/footer';
import { GuideIcon, type GuideIconName } from '@/components/guide-icon';
import { HeroBackdrop } from '@/components/hero-backdrop';
import { SiteHeader } from '@/components/site-header';
import { TvSet } from '@/components/tv-set';
import { UrlPreview } from '@/components/url-preview';
import type { Dictionary } from '@/config/i18n';
import { characterColorVar } from '@/config/constants';
import { formatDuration } from '@/config/strings';
import { getDictionary } from '@/lib/i18n-server';
import { supabaseServer } from '@/lib/supabase/server';

interface PackPublic {
  id: string;
  title: string;
  source_url: string | null;
  duration_ms: number;
  line_count: number;
  character_count: number;
  genre: string;
  source_lang: string | null;
  tags: string[];
  score: number;
  characters: { name: string; color: string }[];
  total: number | string;
}

/** Combien de scenes on va chercher : trois nettes, le reste sous le voile. */
const APERCU = 9;
const NETTES = 3;
const ICONES_ETAPES: GuideIconName[] = ['fiche', 'script', 'partage'];

/**
 * La communaute, vue sans compte.
 *
 * On montre les scenes les mieux notees, parce que c'est ce qui donne
 * envie : trois en clair, les suivantes floutees sous un voile qui monte
 * du bas, et l'invitation a creer un compte pour voir la suite. Ni auteur,
 * ni commentaire, ni bouton pour jouer : de quoi comprendre ce qu'on
 * trouvera, pas de quoi parcourir le catalogue.
 */
export async function CommunityPreview() {
  const [t, db] = await Promise.all([getDictionary(), supabaseServer()]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (db.rpc as any)('list_top_packs_public', { p_limit: APERCU });
  const packs = (data ?? []) as PackPublic[];
  const total = Number(packs[0]?.total ?? 0);
  const connexion = `/login?next=${encodeURIComponent('/communaute')}`;

  const nettes = packs.slice(0, NETTES);
  const floutees = packs.slice(NETTES);
  // Toujours une rangee sous le voile, meme avec un catalogue maigre.
  const fantomes = Math.max(0, NETTES - floutees.length);

  return (
    <div className="relative isolate flex min-h-dvh flex-col items-center px-3 py-4 sm:px-6 sm:py-6">
      <HeroBackdrop variant="communaute" />
      <div className="w-full max-w-[min(84rem,94vw)]">
        <SiteHeader signedIn={false} />

        <TvSet>
          <main className="space-y-10 sm:space-y-12">
            <section className="hero-accueil grid items-center gap-8 lg:grid-cols-[1.25fr_1fr]">
              <div className="space-y-5 text-center lg:text-left">
                <p className="accroche inline-flex items-center gap-2 rounded-full border-2 border-border-strong bg-surface-raised px-3 py-1 text-xs font-bold uppercase tracking-wide text-text-muted">
                  <Library className="h-3.5 w-3.5" aria-hidden />
                  {t.community.kicker}
                </p>
                <h1 className="signage hero-titre text-balance text-4xl leading-[0.98] sm:text-6xl">
                  {t.community.title}
                </h1>
                <p className="mx-auto max-w-xl text-balance text-base leading-relaxed text-text-muted lg:mx-0">
                  {t.community.subtitle}
                </p>
                <div className="flex flex-col items-stretch gap-3 pt-1 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
                  <Link
                    href={connexion}
                    className="btn-3d btn-primary inline-flex h-14 items-center justify-center gap-2 whitespace-nowrap bg-accent px-7 text-base font-semibold text-accent-ink"
                  >
                    {t.community.previewCta}
                    <ArrowRight className="h-5 w-5" aria-hidden />
                  </Link>
                </div>
              </div>

              <aside className="panel space-y-5 p-6 sm:p-7">
                <h2 className="text-xs font-bold uppercase tracking-widest text-text-faint">
                  {t.community.howTitle}
                </h2>
                <ol className="relative space-y-6">
                  <span
                    className="absolute bottom-5 left-5 top-5 w-px -translate-x-1/2 bg-border-strong"
                    aria-hidden
                  />
                  {t.community.howSteps.map((etape, rang) => (
                    <li key={etape.title} className="relative flex gap-4">
                      <span
                        className={
                          rang === t.community.howSteps.length - 1
                            ? 'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-accent bg-surface-raised'
                            : 'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-border-strong bg-surface-raised'
                        }
                      >
                        <GuideIcon nom={ICONES_ETAPES[rang] ?? 'partage'} className="h-7 w-7" />
                      </span>
                      <span className="min-w-0 space-y-0.5 pt-0.5">
                        <span className="block text-sm font-bold text-text">{etape.title}</span>
                        <span className="block text-xs leading-relaxed text-text-muted">{etape.body}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </aside>
            </section>

            <section className="space-y-4 sm:space-y-5">
              <ul className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                {nettes.map((pack) => (
                  <Carte key={pack.id} pack={pack} t={t} href={connexion} />
                ))}
              </ul>

              {/* Le reste du catalogue, sous le voile. */}
              <div className="relative overflow-hidden rounded-card">
                <ul
                  aria-hidden
                  className="pointer-events-none grid select-none gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3"
                >
                  {floutees.map((pack) => (
                    <Carte key={pack.id} pack={pack} t={t} />
                  ))}
                  {Array.from({ length: fantomes }, (_, i) => (
                    <li key={`fantome-${i}`} className="panel flex flex-col overflow-hidden">
                      <div className="aspect-video border-b border-border bg-stage" />
                      <div className="space-y-2 p-4">
                        <div className="h-4 w-2/3 rounded bg-surface-sunken" />
                        <div className="h-3 w-1/2 rounded bg-surface-sunken" />
                      </div>
                    </li>
                  ))}
                </ul>

                <div
                  aria-hidden
                  className="absolute inset-0 backdrop-blur-md [-webkit-mask-image:linear-gradient(180deg,transparent,#000_35%)] [mask-image:linear-gradient(180deg,transparent,#000_35%)]"
                />
                <div
                  className="absolute inset-0 flex items-end justify-center px-4 pb-6 sm:pb-10"
                  style={{
                    background:
                      'linear-gradient(180deg, transparent 0%, rgb(9 9 11 / 0.7) 45%, rgb(9 9 11 / 0.94) 100%)',
                  }}
                >
                  <div className="panel w-full max-w-lg space-y-3 p-6 text-center">
                    <GuideIcon nom="clap" className="mx-auto h-16 w-16 drop-shadow-[0_10px_14px_rgb(0_0_0/0.55)]" />
                    <h2 className="titre text-balance text-2xl">{t.community.previewMoreTitle}</h2>
                    <p className="text-sm leading-relaxed text-text-muted">
                      {t.community.previewMoreBody(total)}
                    </p>
                    <Link
                      href={connexion}
                      className="btn-3d btn-primary inline-flex h-12 items-center justify-center gap-2 bg-accent px-6 text-sm font-semibold text-accent-ink"
                    >
                      {t.community.previewCta}
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </TvSet>

        <Footer />
      </div>
    </div>
  );
}

/** Une scene de l'apercu. Sans `href`, elle n'est qu'un decor sous le voile. */
function Carte({ pack, t, href }: { pack: PackPublic; t: Dictionary; href?: string }) {
  const details = [
    t.community.lineCount(pack.line_count),
    pack.genre !== 'autre' ? t.community.genreNames[pack.genre] : null,
    pack.source_lang ? (t.community.langNames[pack.source_lang] ?? pack.source_lang) : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const duree = (
    <span className="absolute bottom-2.5 right-2.5 rounded-md bg-black/75 px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-white">
      {formatDuration(pack.duration_ms)}
    </span>
  );
  const visibles = pack.characters.slice(0, 4);
  const reste = pack.characters.length - visibles.length;

  return (
    <li className="panel carte-pack relative flex flex-col overflow-hidden">
      {/* L'apercu ne se lance pas ici : toute la carte mene a la connexion. */}
      <div className="pointer-events-none">
        {pack.source_url ? (
          <UrlPreview url={pack.source_url} title={pack.title} flush overlay={duree} />
        ) : (
          <div className="relative flex aspect-video items-center justify-center border-b border-border bg-stage text-stage-faint">
            <Clapperboard className="h-8 w-8" aria-hidden />
            {duree}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="line-clamp-2 font-bold leading-snug" title={pack.title}>
              {href ? (
                <Link
                  href={href}
                  className="after:absolute after:inset-0 after:content-[''] hover:underline hover:underline-offset-4 focus-visible:outline-none focus-visible:after:rounded-card focus-visible:after:ring-2 focus-visible:after:ring-select"
                >
                  {pack.title}
                </Link>
              ) : (
                pack.title
              )}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-text-faint">{details}</p>
          </div>
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent/15 px-2 py-1 text-xs font-bold tabular-nums text-accent"
            aria-label={t.community.voteScore(pack.score)}
          >
            <ThumbsUp className="h-3.5 w-3.5" aria-hidden />
            {pack.score}
          </span>
        </div>

        <ul className="flex flex-wrap gap-1.5" aria-label={t.community.characterCount(pack.character_count)}>
          {visibles.map((character) => (
            <li
              key={character.name}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-surface-sunken px-2.5 py-1 text-xs font-semibold"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: characterColorVar(character.color) }}
                aria-hidden
              />
              <span className="truncate">{character.name}</span>
            </li>
          ))}
          {reste > 0 ? (
            <li className="inline-flex items-center rounded-full bg-surface-sunken px-2.5 py-1 text-xs font-semibold text-text-faint">
              +{reste}
            </li>
          ) : null}
        </ul>
      </div>
    </li>
  );
}
