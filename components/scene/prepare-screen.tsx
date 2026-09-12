'use client';

import { useMutation } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  Combine,
  Pause,
  Play,
  RotateCcw,
  Scissors,
  Trash2,
  Users,
} from 'lucide-react';

import { useSceneCtx } from '@/components/scene-page';
import {
  Alert,
  Badge,
  Button,
  Card,
  Dialog,
  Input,
  Spinner,
} from '@/components/ui';
import { characterColorVar } from '@/config/constants';
import { formatDuration, formatTimecode, t } from '@/config/strings';
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

export function PrepareScreen() {
  const { session, characters, lines, clips, refetch } = useSceneCtx();
  const media = useMediaUrls(session);
  const excerpt = useExcerpt(media.data?.video);

  const [selectedLines, setSelectedLines] = useState<Set<string>>(new Set());
  const [selectedChars, setSelectedChars] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [splitOpen, setSplitOpen] = useState(false);
  const [splitName, setSplitName] = useState('');
  const [confirmLobby, setConfirmLobby] = useState(false);

  const stats = useMemo(
    () => statsByCharacter(characters, lines, clips),
    [characters, lines, clips],
  );
  const charById = useMemo(
    () => new Map(characters.map((c) => [c.id, c])),
    [characters],
  );

  const act = useMutation({
    mutationFn: (fn: () => Promise<unknown>) => fn(),
    onSuccess: () => {
      setSelectedLines(new Set());
      setSelectedChars(new Set());
      refetch();
    },
    onError: (e) => setError(humanizeError(e)),
  });

  const run = (fn: () => Promise<unknown>) => {
    setError(null);
    act.mutate(fn);
  };

  function toggle(set: Set<string>, id: string): Set<string> {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  }

  const selectedLineIds = [...selectedLines];
  const selectedCharIds = [...selectedChars];

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="signage text-3xl" style={{ textShadow: 'none' }}>
            {t.prepare.title}
          </h1>
          <p className="max-w-2xl text-sm text-text-faint">
            {t.prepare.subtitle}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setConfirmLobby(true)}
          disabled={characters.length === 0}
        >
          <Users className="h-4 w-4" aria-hidden />
          {t.prepare.openLobby}
        </Button>
      </header>

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {act.isPending ? (
        <div className="flex items-center gap-2 text-xs text-text-faint">
          <Spinner />
          {t.prepare.recalculating}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
        {/* ── Colonne gauche : personnages ───────────────────────────── */}
        <aside className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">{t.prepare.charactersHeading}</h2>
            <Badge>{characters.length}</Badge>
          </div>

          {characters.map((character) => {
            const stat = stats.get(character.id);
            const checked = selectedChars.has(character.id);
            return (
              <Card
                key={character.id}
                className={cn(
                  'space-y-2 py-3',
                  checked && 'border-select bg-select/12',
                )}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setSelectedChars((s) => toggle(s, character.id))
                    }
                    aria-label={`Sélectionner ${character.name}`}
                    className="h-4 w-4 accent-[var(--color-accent)]"
                  />
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

                <div className="flex items-center justify-between pl-6 text-xs text-text-faint">
                  <span>
                    {t.prepare.lineCount(stat?.lineCount ?? 0)} ·{' '}
                    {formatDuration(stat?.speakMs ?? 0)}
                  </span>
                  {stat?.longestLine ? (
                    <Button
                      size="sm"
                      variant="ghost"
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
              </Card>
            );
          })}

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
              {t.prepare.mergeInto(
                charById.get(selectedCharIds[0] ?? '')?.name ?? '',
              )}
            </Button>
          ) : (
            <p className="text-xs text-text-faint">{t.prepare.mergeHint}</p>
          )}
        </aside>

        {/* ── Colonne droite : repliques ─────────────────────────────── */}
        <section className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-medium">{t.prepare.linesHeading}</h2>

            {selectedLineIds.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="h-8 rounded-lg border border-border bg-surface-sunken px-2 text-xs"
                  defaultValue=""
                  aria-label={t.prepare.reassign}
                  onChange={(e) => {
                    const target = e.target.value;
                    e.currentTarget.value = '';
                    if (target) run(() => reassignLines(selectedLineIds, target));
                  }}
                >
                  <option value="">{t.prepare.reassign}</option>
                  {characters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <Button size="sm" onClick={() => setSplitOpen(true)}>
                  <Scissors className="h-3.5 w-3.5" aria-hidden />
                  {t.prepare.splitToNew}
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => run(() => deleteLines(selectedLineIds))}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  {t.prepare.deleteLine}
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => run(() => restoreLines(selectedLineIds))}
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                  {t.prepare.restoreLine}
                </Button>
              </div>
            ) : null}
          </div>

          <p className="text-xs text-text-faint">{t.prepare.textIsAGuide}</p>

          <div className="space-y-1">
            {lines.map((line) => {
              const character = charById.get(line.character_id);
              const checked = selectedLines.has(line.id);
              return (
                <div
                  key={line.id}
                  className={cn(
                    'flex items-start gap-2 rounded-lg border border-transparent px-2 py-1.5',
                    'hover:border-border hover:bg-surface',
                    checked && 'border-select bg-select/12',
                    // Supprimee : elle ne sera pas doublable, mais sa VO
                    // reste au mixage — d'ou le barre plutot que le retrait.
                    line.is_deleted && 'opacity-45',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => setSelectedLines((s) => toggle(s, line.id))}
                    aria-label={`Sélectionner la réplique de ${formatTimecode(line.start_ms)}`}
                    className="mt-1 h-4 w-4 accent-[var(--color-accent)]"
                  />

                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0"
                    aria-label="Écouter"
                    onClick={() =>
                      excerpt.play(line.id, line.start_ms, line.end_ms)
                    }
                  >
                    {excerpt.playingId === line.id ? (
                      <Pause className="h-3.5 w-3.5" />
                    ) : (
                      <Play className="h-3.5 w-3.5" />
                    )}
                  </Button>

                  <span
                    className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: characterColorVar(character?.color ?? ''),
                    }}
                    title={character?.name}
                    aria-hidden
                  />

                  <span className="mt-1 w-14 shrink-0 font-mono text-xs text-text-faint">
                    {formatTimecode(line.start_ms)}
                  </span>

                  <input
                    key={line.text}
                    defaultValue={line.text}
                    aria-label="Texte de la réplique"
                    title={line.is_deleted ? t.prepare.deleteLineHint : undefined}
                    className={cn(
                      'min-w-0 flex-1 border-0 bg-transparent text-sm outline-none focus:text-text',
                      line.is_deleted && 'line-through',
                    )}
                    onBlur={(e) => {
                      const value = e.target.value;
                      if (value !== line.text) {
                        run(() => updateLineText(line.id, value));
                      }
                    }}
                  />
                </div>
              );
            })}
          </div>
        </section>
      </div>

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
                const name = splitName.trim() || `Personnage ${characters.length + 1}`;
                setSplitOpen(false);
                setSplitName('');
                run(() =>
                  splitLinesToNewCharacter(
                    selectedLineIds,
                    name,
                    characters.length,
                  ),
                );
              }}
            >
              {t.common.confirm}
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <p>
            {selectedLineIds.length} réplique(s) seront déplacées vers un nouveau
            personnage.
          </p>
          <Input
            value={splitName}
            autoFocus
            placeholder={`Personnage ${characters.length + 1}`}
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
    </div>
  );
}
