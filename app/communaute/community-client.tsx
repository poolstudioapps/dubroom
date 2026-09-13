'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, FolderHeart, Library, Plus, Search, X } from 'lucide-react';

import { useT } from '@/lib/i18n';
import { AppShell } from '@/components/app-shell';
import { FaqList } from '@/components/faq-list';
import { HeroBackdrop } from '@/components/hero-backdrop';
import { LinkButton } from '@/components/link-button';
import { PackCard, packGridClass } from '@/components/pack-card';
import {
  DEFAULT_SORT,
  EMPTY_FILTER,
  PackFilters,
  matchesFilter,
  matchesSearch,
  sortPacks,
  type PackFilter,
  type PackSort,
} from '@/components/pack-filters';
import { PackStartDialog } from '@/components/pack-start-dialog';
import { Alert, Button, Card, Dialog, Input, Spinner } from '@/components/ui';
import { PACKS_QUERY, deletePack, type Pack } from '@/lib/packs';
import { profileHref } from '@/lib/creators';
import { humanizeError } from '@/lib/errors';
import { useMyProfile } from '@/lib/profile';
import { cn } from '@/lib/utils';
import { CommunityHero } from './community-hero';

const CREER_UN_PACK = '/sessions/new?pour=communaute';
/** Quatre rangees de scenes par page, quel que soit le nombre de colonnes. */
const RANGEES_PAR_PAGE = 4;

/** Le nombre de colonnes de la grille, lu sur les memes paliers qu'elle. */
function useColonnes(): number {
  const [colonnes, setColonnes] = useState(3);
  useEffect(() => {
    const paliers = ['(min-width: 1536px)', '(min-width: 1024px)', '(min-width: 640px)'].map((q) =>
      window.matchMedia(q),
    );
    const lire = () =>
      setColonnes(paliers[0]!.matches ? 4 : paliers[1]!.matches ? 3 : paliers[2]!.matches ? 2 : 1);
    lire();
    paliers.forEach((p) => p.addEventListener('change', lire));
    return () => paliers.forEach((p) => p.removeEventListener('change', lire));
  }, []);
  return colonnes;
}

/**
 * Le catalogue des scenes preparees.
 *
 * Reserve aux invites, comme le reste du produit : ce sont des extraits
 * d'oeuvres protegees, et c'est le caractere prive de l'usage qui rend
 * l'exercice tenable (PRD §14).
 *
 * La page a deux portes, et elles sont en tete : choisir une scene, et
 * en ajouter une. Creer un pack n'etait propose nulle part ici — on
 * decouvrait qu'on pouvait publier en arrivant au bout d'une scene.
 * « Mes packs » a la meme place, a cote : c'est la meme page, restreinte
 * a ce que j'ai publie, et c'est la seule ou l'on retire une scene.
 */
export function CommunityClient({
  displayName,
  scope = 'all',
  initialQuery = '',
}: {
  displayName: string;
  scope?: 'all' | 'mine';
  /** La recherche portee par l'adresse, `?q=`. */
  initialQuery?: string;
}) {
  const t = useT();

  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Pack | null>(null);
  /** La scene dont on choisit comment recuperer la video. */
  const [aDoubler, setADoubler] = useState<Pack | null>(null);
  const [filter, setFilter] = useState<PackFilter>(EMPTY_FILTER);
  const [sort, setSort] = useState<PackSort>(DEFAULT_SORT);

  const [recherche, setRecherche] = useState(initialQuery);
  // Une etiquette touchee sur une carte ramene ici avec `?q=#tag` : la
  // page ne se remonte pas, c'est donc a l'etat de suivre l'adresse.
  useEffect(() => setRecherche(initialQuery), [initialQuery]);

  const packs = useQuery(PACKS_QUERY);
  // « Mes packs » mene au profil public : c'est la qu'on les gere.
  const profil = useMyProfile();
  const monProfil = profil.data?.user_id ? profileHref(profil.data.user_id) : '/mes-packs';
  const colonnes = useColonnes();
  const [page, setPage] = useState(0);
  const haut = useRef<HTMLElement>(null);

  function chercher(texte: string) {
    setRecherche(texte);
    // L'adresse suit la recherche : on peut la partager, et le retour
    // arriere depuis une scene retrouve la meme liste.
    const url = texte.trim() ? `?q=${encodeURIComponent(texte.trim())}` : window.location.pathname;
    window.history.replaceState(null, '', url);
  }

  const remove = useMutation({
    mutationFn: (pack: Pack) => deletePack(pack),
    onSuccess: () => {
      setPendingDelete(null);
      void qc.invalidateQueries({ queryKey: ['packs'] });
    },
    onError: (e) => setError(humanizeError(e)),
  });

  // Deux etages : ce que la page montre par principe, puis ce que les
  // criteres laissent passer. Le premier decide si le catalogue est vide,
  // le second s'il faut elargir les criteres. Les deux messages different.
  const tous = packs.data ?? [];
  const mesPacks = tous.filter((pack) => pack.is_mine);
  const mine = scope === 'all' ? tous : mesPacks;
  const visible = sortPacks(
    mine.filter(
      (pack) =>
        matchesFilter(pack, filter) &&
        matchesSearch(pack, recherche, [
          t.community.genreNames[pack.genre] ?? '',
          pack.source_lang ? (t.community.langNames[pack.source_lang] ?? '') : '',
        ]),
    ),
    sort,
  );
  const strings = scope === 'mine' ? t.myPacks : t.community;

  // La pagination : quatre rangees, et retour a la premiere page des que
  // les criteres changent.
  const parPage = colonnes * RANGEES_PAR_PAGE;
  const pages = Math.max(1, Math.ceil(visible.length / parPage));
  const pageCourante = Math.min(page, pages - 1);
  const affiches = visible.slice(pageCourante * parPage, (pageCourante + 1) * parPage);
  useEffect(() => setPage(0), [recherche, filter, sort, scope]);
  const allerA = (suivante: number) => {
    setPage(suivante);
    haut.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const roles = mine.reduce((somme, pack) => somme + pack.character_count, 0);
  const langues = new Set(mine.map((pack) => pack.source_lang).filter(Boolean)).size;

  return (
    <AppShell
      className="space-y-10 sm:space-y-12"
      backdrop={scope === 'all' ? <HeroBackdrop variant="communaute" /> : undefined}
    >
      {/* ── Les deux portes, dans la composition de l'accueil ──────── */}
      <CommunityHero
        kicker={
          <>
            {scope === 'mine' ? (
              <FolderHeart className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <Library className="h-3.5 w-3.5" aria-hidden />
            )}
            {scope === 'mine' ? t.myPacks.kicker : t.community.kicker}
          </>
        }
        title={strings.title}
        subtitle={strings.subtitle}
        howTitle={t.community.howTitle}
        howSteps={t.community.howSteps}
        footnote={mine.length > 0 ? t.community.stats(mine.length, roles, langues) : undefined}
        actions={
          <>
            <LinkButton href={CREER_UN_PACK} size="lg">
              <Plus className="h-5 w-5" aria-hidden />
              {t.community.createPack}
            </LinkButton>
            {scope === 'all' ? (
              <LinkButton href={monProfil} variant="secondary" size="lg">
                <FolderHeart className="h-5 w-5" aria-hidden />
                {t.community.myPacksCta}
                {mesPacks.length > 0 ? (
                  <span className="rounded-full bg-accent/20 px-2 py-0.5 text-xs tabular-nums">
                    {mesPacks.length}
                  </span>
                ) : null}
              </LinkButton>
            ) : (
              <LinkButton href="/communaute" variant="secondary" size="lg">
                <Library className="h-5 w-5" aria-hidden />
                {t.myPacks.browseAll}
              </LinkButton>
            )}
          </>
        }
      />

      {error ? <Alert tone="danger">{error}</Alert> : null}

      {packs.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-text-faint">
          <Spinner />
          {t.common.loading}
        </div>
      ) : null}

      <section ref={haut} className="scroll-mt-6 space-y-5">
        {/* ── La recherche et les criteres, d'un seul tenant ───────── */}
        {mine.length > 0 ? (
          <div className="panel space-y-3 p-3 sm:p-4">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint"
                aria-hidden
              />
              <Input
                type="search"
                value={recherche}
                onChange={(e) => chercher(e.target.value)}
                placeholder={t.community.searchPlaceholder}
                aria-label={t.community.searchLabel}
                enterKeyHint="search"
                className="h-12 pl-10 pr-11 text-base"
              />
              {recherche ? (
                <button
                  type="button"
                  onClick={() => chercher('')}
                  aria-label={t.community.searchClear}
                  className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-text-faint hover:bg-surface hover:text-text"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              ) : null}
            </div>

            {mine.length > 1 ? (
              <PackFilters
                packs={mine}
                value={filter}
                onChange={setFilter}
                sort={sort}
                onSortChange={setSort}
              />
            ) : null}
          </div>
        ) : null}

        {packs.isSuccess && mine.length === 0 ? (
          <Card className="space-y-4 py-10 text-center">
            <h2 className="titre text-2xl">{strings.emptyTitle}</h2>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-text-muted">
              {strings.emptyBody}
            </p>
            <LinkButton href={CREER_UN_PACK}>
              <Plus className="h-4 w-4" aria-hidden />
              {t.community.createPack}
            </LinkButton>
          </Card>
        ) : null}

        {mine.length > 0 && visible.length === 0 ? (
          <Card className="space-y-2 py-8 text-center">
            <h2 className="text-sm font-bold">
              {recherche.trim()
                ? t.community.searchNoMatch(recherche.trim())
                : t.community.filterNoMatch}
            </h2>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-text-muted">
              {t.community.filterNoMatchBody}
            </p>
          </Card>
        ) : null}

        {visible.length > 0 ? (
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-semibold text-text-faint">
              {strings.sceneCount(visible.length)}
            </p>
          </div>
        ) : null}

        {/* Une grille de catalogue, pas une pile de fiches. */}
        <ul className={cn('grid gap-4 sm:gap-5', packGridClass(affiches.length))}>
          {affiches.map((pack) => (
            <PackCard
              key={pack.id}
              pack={pack}
              showMine={scope === 'all'}
              onPlay={() => setADoubler(pack)}
              onDelete={scope === 'mine' && pack.is_mine ? () => setPendingDelete(pack) : undefined}
            />
          ))}
        </ul>

        <Pagination page={pageCourante} pages={pages} onChange={allerA} />
      </section>

      {visible.length > 0 ? (
        <div className="space-y-1 border-t border-border pt-4 text-xs leading-relaxed text-text-faint">
          <p>{t.community.voteHelp}</p>
          <p>{t.community.recipeHelp}</p>
        </div>
      ) : null}

      {/* Les questions qu'on se pose en decouvrant le catalogue, tout en bas. */}
      {scope === 'all' ? (
        <section className="mx-auto w-full max-w-3xl space-y-5">
          <h2 className="titre titre-section text-center text-2xl sm:text-3xl">
            {t.community.faqTitle}
          </h2>
          <FaqList items={t.community.faq} />
        </section>
      ) : null}

      <Dialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title={t.community.removeTitle}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingDelete(null)}>
              {t.common.cancel}
            </Button>
            <Button
              variant="danger"
              loading={remove.isPending}
              onClick={() => pendingDelete && remove.mutate(pendingDelete)}
            >
              {t.common.delete}
            </Button>
          </>
        }
      >
        {t.community.removeBody}
      </Dialog>

      <PackStartDialog pack={aDoubler} displayName={displayName} onClose={() => setADoubler(null)} />
    </AppShell>
  );
}

/**
 * Le choix de la page, sous la grille.
 *
 * Toutes les pages quand il y en a peu ; au-dela, la premiere, la derniere
 * et les voisines de la page courante, pour que la rangee ne deborde
 * jamais sur telephone.
 */
function Pagination({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}) {
  const t = useT();
  if (pages <= 1) return null;

  const numeros: (number | null)[] = [];
  for (let i = 0; i < pages; i += 1) {
    const proche = Math.abs(i - page) <= 1;
    if (pages <= 7 || i === 0 || i === pages - 1 || proche) numeros.push(i);
    else if (numeros[numeros.length - 1] !== null) numeros.push(null);
  }

  const bouton =
    'flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-bold tabular-nums transition-colors disabled:pointer-events-none disabled:opacity-40';

  return (
    <nav aria-label={t.community.pagination.label} className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
      <button
        type="button"
        className={cn(bouton, 'border border-border-strong text-text-muted hover:bg-surface hover:text-text')}
        disabled={page === 0}
        aria-label={t.community.pagination.previous}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
      </button>
      {numeros.map((numero, rang) =>
        numero === null ? (
          <span key={`ellipse-${rang}`} className="px-1 text-text-faint" aria-hidden>
            …
          </span>
        ) : (
          <button
            key={numero}
            type="button"
            aria-label={t.community.pagination.page(numero + 1)}
            aria-current={numero === page ? 'page' : undefined}
            onClick={() => onChange(numero)}
            className={cn(
              bouton,
              numero === page
                ? 'bg-accent text-accent-ink'
                : 'text-text-muted hover:bg-surface hover:text-text',
            )}
          >
            {numero + 1}
          </button>
        ),
      )}
      <button
        type="button"
        className={cn(bouton, 'border border-border-strong text-text-muted hover:bg-surface hover:text-text')}
        disabled={page >= pages - 1}
        aria-label={t.community.pagination.next}
        onClick={() => onChange(page + 1)}
      >
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
    </nav>
  );
}
