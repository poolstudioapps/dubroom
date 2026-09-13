'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  Combine,
  Eye,
  Pause,
  Play,
  RotateCcw,
  Scissors,
  Search,
  Share2,
  Trash2,
  Users,
  X,
} from 'lucide-react';

import { useT } from '@/lib/i18n';
import { PackFacetsFields, facetsComplete } from '@/components/pack-facets-fields';
import { PackPublishedPanel } from '@/components/scene/pack-published-panel';
import { facetsDeLaScene } from '@/components/scene/publish-card';
import { useSceneCtx } from '@/components/scene-page';
import { publishRecipePack, type PackFacets } from '@/lib/packs';
import { CharacterPicker } from '@/components/scene/character-picker';
import { Alert, Badge, Button, Dialog, Input, Spinner } from '@/components/ui';
import { characterColorVar } from '@/config/constants';
import { formatDuration, formatTimecode } from '@/config/strings';
import {
  deleteLines,
  mergeCharacters,
  openLobby,
  renameCharacter,
  reassignLines,
  restoreLines,
  splitLinesToNewCharacter,
  updateLineText,
} from '@/lib/actions';
import { useExcerpt } from '@/lib/audio/excerpt';
import { useMediaUrls } from '@/lib/data';
import { humanizeError } from '@/lib/errors';
import { statsByCharacter } from '@/lib/scene-stats';
import { cn } from '@/lib/utils';

/**
 * L'editeur, juste apres la transcription.
 *
 * Il faisait tout, mais rien ne s'y lisait : deux colonnes de cases a
 * cocher, un filtre cache dans un compteur, des repliques supprimees
 * melangees aux autres, et une barre d'actions qui apparaissait en haut
 * pendant qu'on cochait en bas de la liste.
 *
 * Il se lit maintenant de haut en bas, dans l'ordre du travail :
 *
 * - trois etapes, pour savoir ce qu'on fait la ;
 * - une rangee de filtres par personnage, pour lire tout ce que dit
 *   quelqu'un d'un coup ; les repliques supprimees ont leur propre
 *   filtre au lieu d'encombrer la liste ;
 * - des lignes ou chaque geste est sur la ligne : ecouter, changer de
 *   personnage, corriger, supprimer ;
 * - une barre flottante des qu'on selectionne, toujours sous la main.
 *
 * Supprimer reste reversible : la replique n'est plus a doubler, mais sa
 * voix d'origine reste au mixage. On peut annuler tout de suite, ou la
 * retrouver dans « Supprimees ».
 */
export function PrepareScreen() {
  const t = useT();

  const { session, characters, lines, clips, refetch } = useSceneCtx();
  const media = useMediaUrls(session);
  const excerpt = useExcerpt(media.data?.video);

  const [selectedLines, setSelectedLines] = useState<Set<string>>(new Set());
  const [selectedChars, setSelectedChars] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [splitOpen, setSplitOpen] = useState(false);
  const [splitName, setSplitName] = useState('');
  const [confirmLobby, setConfirmLobby] = useState(false);
  const [filtreChar, setFiltreChar] = useState<string | null>(null);
  const [voirSupprimees, setVoirSupprimees] = useState(false);
  const [recherche, setRecherche] = useState('');
  /** Ce qui vient d'etre supprime, pour pouvoir l'annuler aussitot. */
  const [dernierRetrait, setDernierRetrait] = useState<string[] | null>(null);

  // ── Un pack cree depuis la communaute ──────────────────────────────
  const qc = useQueryClient();
  const packMode = !!session.pack_draft;
  const [publierOuvert, setPublierOuvert] = useState(false);
  const [publierErreur, setPublierErreur] = useState<string | null>(null);
  const [fiche, setFiche] = useState<PackFacets>(() => facetsDeLaScene(session));
  const publier = useMutation({
    mutationFn: () => publishRecipePack(session.id, { ...fiche, title: fiche.title.trim() }),
    onSuccess: () => {
      setPublierOuvert(false);
      void qc.invalidateQueries({ queryKey: ['packs'] });
      refetch();
    },
    onError: (e) => setPublierErreur(humanizeError(e)),
  });

  const stats = useMemo(
    () => statsByCharacter(characters, lines, clips),
    [characters, lines, clips],
  );
  const charById = useMemo(
    () => new Map(characters.map((c) => [c.id, c])),
    [characters],
  );
  /** Repliques encore a doubler, par personnage. */
  const actives = useMemo(() => {
    const parPerso = new Map<string, number>();
    for (const l of lines) {
      if (!l.is_deleted) parPerso.set(l.character_id, (parPerso.get(l.character_id) ?? 0) + 1);
    }
    return parPerso;
  }, [lines]);
  const nbSupprimees = lines.filter((l) => l.is_deleted).length;
  const nbActives = lines.length - nbSupprimees;

  const act = useMutation({
    mutationFn: (fn: () => Promise<unknown>) => fn(),
    onSuccess: () => {
      setSelectedLines(new Set());
      setSelectedChars(new Set());
      refetch();
    },
    onError: (e) => setError(humanizeError(e)),
  });

  const run = (fn: () => Promise<unknown>, apres?: () => void) => {
    setError(null);
    act.mutate(fn, { onSuccess: apres });
  };

  const supprimer = (ids: string[]) => {
    setDernierRetrait(null);
    run(() => deleteLines(ids), () => setDernierRetrait(ids));
  };

  function toggle(set: Set<string>, id: string): Set<string> {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  }

  /** Changer de vue vide la selection : on n'agit pas sur ce qu'on ne voit plus. */
  function voir(perso: string | null, supprimees = false) {
    setSelectedLines(new Set());
    setFiltreChar(perso);
    setVoirSupprimees(supprimees);
  }

  const q = recherche.trim().toLowerCase();
  const lignesVisibles = lines.filter(
    (l) =>
      l.is_deleted === voirSupprimees &&
      (!filtreChar || l.character_id === filtreChar) &&
      (!q || l.text.toLowerCase().includes(q)),
  );

  const selectedLineIds = [...selectedLines];
  const selectedCharIds = [...selectedChars];
  const selectionSupprimees = selectedLineIds.filter((id) => lines.find((l) => l.id === id)?.is_deleted);
  const toutCoche = lignesVisibles.length > 0 && selectedLines.size === lignesVisibles.length;
  const nomFiltre = filtreChar ? (charById.get(filtreChar)?.name ?? '') : '';

  if (packMode && session.published_pack_id) return <PackPublishedPanel />;

  return (
    <div className="space-y-5 pb-24">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="titre text-3xl">{t.prepare.title}</h1>
          <p className="max-w-2xl text-sm text-text-faint">{t.prepare.subtitle}</p>
        </div>
        {/* Un pack pour la communaute se publie d'abord ; on ne propose
            de le jouer qu'une fois publie. */}
        {packMode ? (
          <Button
            variant="primary"
            onClick={() => {
              setPublierErreur(null);
              setPublierOuvert(true);
            }}
            disabled={characters.length === 0}
          >
            <Share2 className="h-4 w-4" aria-hidden />
            {t.prepare.packPublish}
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={() => setConfirmLobby(true)}
            disabled={characters.length === 0}
          >
            <Users className="h-4 w-4" aria-hidden />
            {t.prepare.openLobby}
          </Button>
        )}
      </header>

      {/* Ce qu'on fait ici, en trois gestes. */}
      <ol className="panel grid gap-3 p-4 sm:grid-cols-3">
        {t.prepare.howSteps.map((etape, rang) => (
          <li key={etape} className="flex items-start gap-3 text-sm leading-relaxed text-text-muted">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-ink">
              {rang + 1}
            </span>
            {etape}
          </li>
        ))}
      </ol>

      {error ? <Alert tone="danger">{error}</Alert> : null}

      <div className="grid gap-5 lg:grid-cols-[19rem_minmax(0,1fr)]">
        {/* ── Les personnages ──────────────────────────────────────── */}
        <aside className="space-y-3 lg:self-start" aria-labelledby="titre-personnages">
          <div className="space-y-0.5">
            <h2 id="titre-personnages" className="flex items-center gap-2 text-sm font-bold">
              {t.prepare.charactersHeading}
              <Badge>{characters.length}</Badge>
            </h2>
            <p className="text-xs leading-relaxed text-text-faint">{t.prepare.charactersHelp}</p>
          </div>

          <ul className="space-y-2">
            {characters.map((character) => {
              const stat = stats.get(character.id);
              const checked = selectedChars.has(character.id);
              const filtre = filtreChar === character.id && !voirSupprimees;
              return (
                <li
                  key={character.id}
                  className={cn(
                    'panel space-y-2 p-3 transition-colors',
                    checked && 'border-select bg-select/12',
                    filtre && 'ring-2 ring-accent/60',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <label className="-m-1.5 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => setSelectedChars((s) => toggle(s, character.id))}
                        aria-label={t.prepare.selectCharacter(character.name)}
                        className="h-4 w-4 accent-[var(--color-accent)]"
                      />
                    </label>
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: characterColorVar(character.color) }}
                      aria-hidden
                    />
                    <Input
                      // Champ non controle : sans cle, React garde le noeud
                      // existant et l'ancien texte reste affiche apres une
                      // fusion ou un renommage venu du serveur.
                      key={character.name}
                      defaultValue={character.name}
                      className="h-8 flex-1"
                      aria-label={t.prepare.rename}
                      onBlur={(e) => {
                        const value = e.target.value.trim();
                        if (value && value !== character.name) {
                          run(() => renameCharacter(character.id, value));
                        }
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-1 pl-7">
                    <button
                      type="button"
                      aria-pressed={filtre}
                      onClick={() => voir(filtre ? null : character.id)}
                      className={cn(
                        'flex min-h-8 flex-1 items-center gap-1.5 rounded-md px-2 text-left text-xs text-text-muted transition-colors hover:bg-surface hover:text-text',
                        filtre && 'bg-accent/15 font-bold text-text',
                      )}
                    >
                      <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="truncate">
                        {t.prepare.lineCount(actives.get(character.id) ?? 0)} ·{' '}
                        {formatDuration(stat?.speakMs ?? 0)}
                      </span>
                    </button>
                    {stat?.longestLine ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        aria-label={t.prepare.playLongest}
                        title={t.prepare.playLongest}
                        onClick={() =>
                          excerpt.play(
                            `char-${character.id}`,
                            stat.longestLine!.start_ms,
                            stat.longestLine!.end_ms,
                          )
                        }
                      >
                        {excerpt.playingId === `char-${character.id}` ? (
                          <Pause className="h-3.5 w-3.5" />
                        ) : (
                          <Play className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>

          {selectedCharIds.length >= 2 ? (
            <Button
              className="w-full"
              onClick={() => {
                // Le premier selectionne est celui qui survit : on le dit
                // sur le bouton, sinon la fusion est un coup de des.
                const [target, ...sources] = selectedCharIds;
                if (!target) return;
                run(() => mergeCharacters(sources, target));
              }}
            >
              <Combine className="h-4 w-4" aria-hidden />
              {t.prepare.mergeInto(charById.get(selectedCharIds[0] ?? '')?.name ?? '')}
            </Button>
          ) : (
            <p className="text-xs text-text-faint">{t.prepare.mergeHint}</p>
          )}
        </aside>

        {/* ── Les repliques ────────────────────────────────────────── */}
        <section className="min-w-0 space-y-3" aria-labelledby="titre-repliques">
          <div className="panel space-y-3 p-3">
            <div
              role="group"
              aria-label={t.prepare.filterLabel}
              className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
            >
              <Pastille actif={!filtreChar && !voirSupprimees} onClick={() => voir(null)}>
                {t.prepare.filterAll}
                <Compte>{nbActives}</Compte>
              </Pastille>
              {characters.map((c) => (
                <Pastille
                  key={c.id}
                  actif={filtreChar === c.id && !voirSupprimees}
                  onClick={() => voir(c.id)}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: characterColorVar(c.color) }}
                    aria-hidden
                  />
                  <span className="max-w-32 truncate">{c.name}</span>
                  <Compte>{actives.get(c.id) ?? 0}</Compte>
                </Pastille>
              ))}
              {nbSupprimees > 0 ? (
                <>
                  <span className="mx-1 w-px shrink-0 self-stretch bg-border" aria-hidden />
                  <Pastille actif={voirSupprimees} onClick={() => voir(null, !voirSupprimees)}>
                    <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {t.prepare.filterDeleted}
                    <Compte>{nbSupprimees}</Compte>
                  </Pastille>
                </>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="relative min-w-48 flex-1">
                <span className="sr-only">{t.prepare.searchLabel}</span>
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint"
                  aria-hidden
                />
                <Input
                  type="search"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  placeholder={t.prepare.searchPlaceholder}
                  className="pl-9"
                />
              </label>
              <Button
                size="sm"
                variant="ghost"
                disabled={lignesVisibles.length === 0}
                onClick={() =>
                  setSelectedLines(toutCoche ? new Set() : new Set(lignesVisibles.map((l) => l.id)))
                }
              >
                {toutCoche ? t.prepare.selectNone : t.prepare.selectAll}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="titre-repliques" className="text-sm font-bold">
              {voirSupprimees
                ? t.prepare.filterDeleted
                : filtreChar
                  ? t.prepare.linesOf(nomFiltre)
                  : t.prepare.linesHeading}
              <span className="ml-2 font-semibold text-text-faint">{lignesVisibles.length}</span>
            </h2>
            <p className="text-xs text-text-faint">
              {voirSupprimees ? t.prepare.deleteLineHint : t.prepare.textIsAGuide}
            </p>
          </div>

          {dernierRetrait ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-border bg-surface-sunken px-3 py-2 text-sm">
              <span className="text-text-muted">
                {t.prepare.deletedToast(dernierRetrait.length)} {t.prepare.deleteLineHint}
              </span>
              <span className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const ids = dernierRetrait;
                    setDernierRetrait(null);
                    run(() => restoreLines(ids));
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                  {t.prepare.undo}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  aria-label={t.common.close}
                  onClick={() => setDernierRetrait(null)}
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </Button>
              </span>
            </div>
          ) : null}

          {lignesVisibles.length === 0 ? (
            <p className="panel p-6 text-center text-sm text-text-faint">{t.prepare.noMatch}</p>
          ) : (
            <ul className="panel divide-y divide-border overflow-hidden">
              {lignesVisibles.map((line) => {
                const character = charById.get(line.character_id);
                const checked = selectedLines.has(line.id);
                return (
                  <li
                    key={line.id}
                    className={cn(
                      'flex items-start gap-2 px-2 py-2.5 transition-colors sm:px-3',
                      checked ? 'bg-select/12' : 'hover:bg-surface',
                    )}
                  >
                    <label className="flex h-9 w-8 shrink-0 cursor-pointer items-center justify-center">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => setSelectedLines((s) => toggle(s, line.id))}
                        aria-label={t.prepare.selectLine(formatTimecode(line.start_ms))}
                        className="h-4 w-4 accent-[var(--color-accent)]"
                      />
                    </label>

                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 shrink-0"
                      aria-label={t.prepare.listen}
                      onClick={() => excerpt.play(line.id, line.start_ms, line.end_ms)}
                    >
                      {excerpt.playingId === line.id ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>

                    <div className="min-w-0 flex-1 space-y-1 sm:flex sm:items-start sm:gap-3 sm:space-y-0">
                      <div className="flex items-center gap-2 sm:w-56 sm:shrink-0 sm:pt-0.5">
                        <span className="w-12 shrink-0 font-mono text-xs text-text-faint tabular-nums">
                          {formatTimecode(line.start_ms)}
                        </span>
                        <CharacterPicker
                          value={character}
                          choices={characters}
                          onPick={(target) => run(() => reassignLines([line.id], target))}
                        />
                      </div>

                      <textarea
                        key={line.text}
                        defaultValue={line.text}
                        rows={1}
                        aria-label={t.prepare.lineText}
                        className={cn(
                          'block min-h-9 w-full min-w-0 resize-none rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm leading-relaxed text-text outline-none [field-sizing:content]',
                          'hover:border-border focus:border-border-strong focus:bg-surface-sunken',
                          line.is_deleted && 'text-text-faint line-through',
                        )}
                        onKeyDown={(e) => {
                          // Entree valide, comme dans un tableur.
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            e.currentTarget.blur();
                          }
                        }}
                        onBlur={(e) => {
                          const value = e.target.value;
                          if (value !== line.text) run(() => updateLineText(line.id, value));
                        }}
                      />
                    </div>

                    {/* Supprimer et retablir, sur la ligne : un interrupteur. */}
                    <Button
                      size="icon"
                      variant="ghost"
                      className={cn(
                        'h-9 w-9 shrink-0',
                        !line.is_deleted && 'text-text-faint hover:text-danger',
                      )}
                      aria-label={line.is_deleted ? t.prepare.restoreLine : t.prepare.deleteLine}
                      title={
                        line.is_deleted
                          ? t.prepare.restoreLine
                          : `${t.prepare.deleteLine} · ${t.prepare.deleteLineHint}`
                      }
                      onClick={() =>
                        line.is_deleted ? run(() => restoreLines([line.id])) : supprimer([line.id])
                      }
                    >
                      {line.is_deleted ? (
                        <RotateCcw className="h-4 w-4" aria-hidden />
                      ) : (
                        <Trash2 className="h-4 w-4" aria-hidden />
                      )}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/*
        La barre d'actions flotte en bas de l'ecran des qu'une replique est
        cochee : en haut de la liste, elle etait hors de vue au moment ou
        on en avait besoin.
      */}
      {selectedLineIds.length > 0 ? (
        <div
          role="toolbar"
          aria-label={t.prepare.selectionLabel(selectedLineIds.length)}
          className="fixed inset-x-0 bottom-4 z-30 mx-auto flex w-fit max-w-[calc(100%-2rem)] flex-wrap items-center justify-center gap-2 rounded-card border-2 border-select bg-surface-raised px-3 py-2 shadow-[0_16px_40px_-8px_rgb(0_0_0/0.7)]"
        >
          <span className="px-1 text-sm font-bold text-select">
            {t.prepare.selectionLabel(selectedLineIds.length)}
          </span>

          <CharacterPicker
            value={undefined}
            choices={characters}
            placeholder={t.prepare.reassign}
            dropUp
            onPick={(target) => run(() => reassignLines(selectedLineIds, target))}
          />

          <Button size="sm" onClick={() => setSplitOpen(true)}>
            <Scissors className="h-3.5 w-3.5" aria-hidden />
            {t.prepare.splitToNew}
          </Button>

          {selectionSupprimees.length < selectedLineIds.length ? (
            <Button
              size="sm"
              variant="danger"
              onClick={() =>
                supprimer(selectedLineIds.filter((id) => !selectionSupprimees.includes(id)))
              }
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              {t.common.delete}
            </Button>
          ) : null}

          {selectionSupprimees.length > 0 ? (
            <Button size="sm" onClick={() => run(() => restoreLines(selectionSupprimees))}>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              {t.prepare.restoreShort}
            </Button>
          ) : null}

          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9"
            aria-label={t.prepare.clearSelection}
            title={t.prepare.clearSelection}
            onClick={() => setSelectedLines(new Set())}
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      ) : null}

      {act.isPending ? (
        <div className="fixed right-4 top-4 z-40 flex items-center gap-2 rounded-full bg-surface-raised px-3 py-1.5 text-xs text-text-muted shadow-lg">
          <Spinner />
          {t.prepare.recalculating}
        </div>
      ) : null}

      <Dialog
        open={splitOpen}
        onClose={() => setSplitOpen(false)}
        title={t.prepare.splitToNew}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSplitOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const name =
                  splitName.trim() || t.prepare.defaultCharacterName(characters.length + 1);
                setSplitOpen(false);
                setSplitName('');
                run(() => splitLinesToNewCharacter(selectedLineIds, name, characters.length));
              }}
            >
              {t.common.confirm}
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <p>{t.prepare.splitBody(selectedLineIds.length)}</p>
          <Input
            value={splitName}
            autoFocus
            placeholder={t.prepare.defaultCharacterName(characters.length + 1)}
            onChange={(e) => setSplitName(e.target.value)}
          />
        </div>
      </Dialog>

      <Dialog
        open={confirmLobby}
        onClose={() => setConfirmLobby(false)}
        title={t.prepare.openLobby}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmLobby(false)}>
              {t.common.cancel}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setConfirmLobby(false);
                run(() => openLobby(session.id));
              }}
            >
              {t.common.confirm}
            </Button>
          </>
        }
      >
        {t.prepare.openLobbyConfirm}
      </Dialog>

      {/* La fiche, reprise de la creation et modifiable jusqu'au dernier
          moment : ce qui part dans la communaute est ce qu'on voit ici. */}
      <Dialog
        open={publierOuvert}
        onClose={() => (publier.isPending ? undefined : setPublierOuvert(false))}
        title={t.prepare.packPublish}
        footer={
          <>
            <Button
              variant="ghost"
              disabled={publier.isPending}
              onClick={() => setPublierOuvert(false)}
            >
              {t.common.cancel}
            </Button>
            <Button
              variant="primary"
              disabled={!facetsComplete(fiche)}
              loading={publier.isPending}
              onClick={() => {
                setPublierErreur(null);
                publier.mutate();
              }}
            >
              <Share2 className="h-4 w-4" aria-hidden />
              {t.prepare.packPublish}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="leading-relaxed">{t.prepare.packPublishBody}</p>
          <PackFacetsFields value={fiche} onChange={setFiche} idPrefix="publier-pack" />
          {publierErreur ? <Alert tone="danger">{publierErreur}</Alert> : null}
        </div>
      </Dialog>
    </div>
  );
}

function Pastille({
  actif,
  onClick,
  children,
}: {
  actif: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={actif}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-xs font-bold transition-colors',
        actif
          ? 'border-accent bg-accent text-accent-ink'
          : 'border-border-strong bg-surface-raised text-text-muted hover:text-text',
      )}
    >
      {children}
    </button>
  );
}

function Compte({ children }: { children: React.ReactNode }) {
  return <span className="font-semibold tabular-nums opacity-70">{children}</span>;
}
