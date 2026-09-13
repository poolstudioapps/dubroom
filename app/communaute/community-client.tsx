'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { FolderHeart, Library, Plus, Search, X } from 'lucide-react';

import { useT } from '@/lib/i18n';
import { AppShell } from '@/components/app-shell';
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
import { humanizeError } from '@/lib/errors';
import { cn } from '@/lib/utils';
import { CommunityHero } from './community-hero';

const CREER_UN_PACK = '/sessions/new?pour=communaute';

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
              <LinkButton href="/mes-packs" variant="secondary" size="lg">
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

      <section className="space-y-5">
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
        <ul className={cn('grid gap-4 sm:gap-5', packGridClass(visible.length))}>
          {visible.map((pack) => (
            <PackCard
              key={pack.id}
              pack={pack}
              showMine={scope === 'all'}
              onPlay={() => setADoubler(pack)}
              onDelete={scope === 'mine' && pack.is_mine ? () => setPendingDelete(pack) : undefined}
            />
          ))}
        </ul>
      </section>

      {visible.length > 0 ? (
        <div className="space-y-1 border-t border-border pt-4 text-xs leading-relaxed text-text-faint">
          <p>{t.community.voteHelp}</p>
          <p>{t.community.recipeHelp}</p>
        </div>
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
