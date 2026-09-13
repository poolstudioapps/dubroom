'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { MessageSquare, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react';

import { Avatar } from '@/components/avatar';
import { SelectMenu } from '@/components/select-menu';
import { Alert, Button, Dialog, Spinner } from '@/components/ui';
import { humanizeError } from '@/lib/errors';
import { useLocale, useT } from '@/lib/i18n';
import {
  addPackComment,
  deletePackComment,
  listPackComments,
  packCommentsKey,
  votePackComment,
  type PackComment,
} from '@/lib/packs';
import { cn } from '@/lib/utils';

const LONGUEUR_MAX = 1000;

const TRIS = ['top', 'recent', 'oldest'] as const;
const FILTRES = ['all', 'positive', 'mine'] as const;
type Tri = (typeof TRIS)[number];
type Filtre = (typeof FILTRES)[number];

/** « il y a 3 heures », dans la langue de l'interface. */
function ilYa(date: string, locale: string): string {
  const secondes = (new Date(date).getTime() - Date.now()) / 1000;
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const paliers: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ];
  for (const [unite, duree] of paliers) {
    if (Math.abs(secondes) >= duree) return format.format(Math.round(secondes / duree), unite);
  }
  return format.format(0, 'second');
}

/**
 * Les commentaires d'une scene.
 *
 * On y parle du decoupage — une replique coupee, un personnage a
 * fusionner —, des conseils de distribution, ou de la tirade qu'il faut
 * absolument jouer. Les votes font remonter ce qui aide ; les filtres
 * servent a retrouver ce qu'on a ecrit, ou a ne lire que ce qui a ete
 * juge utile.
 *
 * Revoter la meme chose retire son vote, comme pour les scenes. Chacun
 * supprime ses propres commentaires ; un administrateur, tous.
 */
export function PackComments({ packId }: { packId: string }) {
  const t = useT();
  const locale = useLocale();
  const qc = useQueryClient();

  const [texte, setTexte] = useState('');
  const [tri, setTri] = useState<Tri>('top');
  const [filtre, setFiltre] = useState<Filtre>('all');
  const [erreur, setErreur] = useState<string | null>(null);
  const [aSupprimer, setASupprimer] = useState<PackComment | null>(null);

  const cle = packCommentsKey(packId);
  const commentaires = useQuery({
    queryKey: cle,
    queryFn: () => listPackComments(packId),
  });

  const rafraichir = () => {
    void qc.invalidateQueries({ queryKey: cle });
    // Le nombre d'avis s'affiche sur les cartes du catalogue.
    void qc.invalidateQueries({ queryKey: ['packs'] });
  };

  const publier = useMutation({
    mutationFn: () => addPackComment(packId, texte),
    onMutate: () => setErreur(null),
    onSuccess: () => {
      setTexte('');
      // Son propre message doit se voir tout de suite, pas en bas d'un
      // tri par votes ou il n'a encore aucune voix.
      setTri('recent');
      setFiltre('all');
      rafraichir();
    },
    onError: (e) => setErreur(humanizeError(e)),
  });

  const supprimer = useMutation({
    mutationFn: (commentaire: PackComment) => deletePackComment(commentaire.id),
    onSuccess: () => {
      setASupprimer(null);
      rafraichir();
    },
    onError: (e) => setErreur(humanizeError(e)),
  });

  const voter = useMutation({
    mutationFn: ({ id, value }: { id: string; value: 1 | -1 }) => votePackComment(id, value),
    // Le compte bouge au clic, pas au retour du serveur.
    onMutate: ({ id, value }) => {
      qc.setQueryData<PackComment[]>(cle, (liste) =>
        liste?.map((c) => {
          if (c.id !== id) return c;
          const suivant = c.my_vote === value ? 0 : value;
          return {
            ...c,
            my_vote: suivant,
            score: c.score - c.my_vote + suivant,
            up_count: c.up_count - (c.my_vote === 1 ? 1 : 0) + (suivant === 1 ? 1 : 0),
            down_count: c.down_count - (c.my_vote === -1 ? 1 : 0) + (suivant === -1 ? 1 : 0),
          };
        }),
      );
    },
    onError: (e) => setErreur(humanizeError(e)),
    onSettled: () => void qc.invalidateQueries({ queryKey: cle }),
  });

  const tous = commentaires.data ?? [];
  const visibles = tous
    .filter((c) => (filtre === 'mine' ? c.is_mine : filtre === 'positive' ? c.score > 0 : true))
    .sort((a, b) => {
      const recent = b.created_at.localeCompare(a.created_at);
      if (tri === 'recent') return recent;
      if (tri === 'oldest') return -recent;
      return b.score - a.score || recent;
    });

  return (
    <section className="space-y-4" aria-labelledby="commentaires">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="commentaires" className="titre titre-section flex items-baseline gap-2 text-xl">
          {t.community.commentsTitle}
          {tous.length > 0 ? (
            <span className="text-sm font-semibold text-text-faint">{tous.length}</span>
          ) : null}
        </h2>

        {tous.length > 1 ? (
          <div className="flex flex-wrap items-center gap-2">
            <SelectMenu
              variant="pill"
              label={t.community.commentsFilter.label}
              prefix={t.community.commentsFilter.label}
              value={filtre}
              onChange={setFiltre}
              className={cn(filtre !== 'all' && 'filtre-actif')}
              options={FILTRES.map((k) => ({ value: k, label: t.community.commentsFilter[k] }))}
            />
            <SelectMenu
              variant="pill"
              label={t.community.commentsSort.label}
              prefix={t.community.commentsSort.label}
              value={tri}
              onChange={setTri}
              align="end"
              options={TRIS.map((k) => ({ value: k, label: t.community.commentsSort[k] }))}
            />
          </div>
        ) : null}
      </div>

      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (texte.trim()) publier.mutate();
        }}
      >
        <label htmlFor="nouveau-commentaire" className="sr-only">
          {t.community.commentsPlaceholder}
        </label>
        <textarea
          id="nouveau-commentaire"
          value={texte}
          rows={3}
          maxLength={LONGUEUR_MAX}
          onChange={(e) => setTexte(e.target.value)}
          onKeyDown={(e) => {
            // Ctrl/Cmd + Entree publie, comme dans toutes les messageries.
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && texte.trim()) {
              e.preventDefault();
              publier.mutate();
            }
          }}
          placeholder={t.community.commentsPlaceholder}
          className={cn(
            'ui-input block w-full resize-y rounded-sm border-2 border-border-strong bg-screen px-3 py-2 text-sm leading-relaxed text-text',
            'shadow-[inset_0_2px_4px_0_rgb(0_0_0/0.18)] placeholder:italic placeholder:text-text-faint focus:border-bezel focus:outline-none',
          )}
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs tabular-nums text-text-faint">
            {texte.length > LONGUEUR_MAX - 150
              ? t.community.commentCharsLeft(LONGUEUR_MAX - texte.length)
              : null}
          </span>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!texte.trim()}
            loading={publier.isPending}
          >
            {t.community.commentsSubmit}
          </Button>
        </div>
      </form>

      {erreur ? <Alert tone="danger">{erreur}</Alert> : null}

      {commentaires.isLoading ? (
        <p className="flex items-center gap-2 text-sm text-text-faint">
          <Spinner />
          {t.common.loading}
        </p>
      ) : null}

      {commentaires.isSuccess && tous.length === 0 ? (
        <p className="panel flex items-center gap-3 p-4 text-sm text-text-muted">
          <MessageSquare className="h-4 w-4 shrink-0 text-text-faint" aria-hidden />
          {t.community.commentsEmpty}
        </p>
      ) : null}

      {tous.length > 0 && visibles.length === 0 ? (
        <p className="text-sm text-text-faint">{t.community.commentsNoMatch}</p>
      ) : null}

      {visibles.length > 0 ? (
        <ul className="panel divide-y divide-border overflow-hidden">
          {visibles.map((c) => (
            <li key={c.id} className="flex gap-3 p-4">
              <Avatar name={c.author_name} path={c.author_avatar} size="sm" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
                  <span className="font-bold">{c.author_name}</span>
                  {c.is_mine ? (
                    <span className="text-xs text-text-faint">{t.studio.you}</span>
                  ) : null}
                  <time
                    dateTime={c.created_at}
                    title={new Date(c.created_at).toLocaleString(locale)}
                    className="text-xs text-text-faint"
                  >
                    {ilYa(c.created_at, locale)}
                  </time>
                </p>
                <p className="whitespace-pre-line break-words text-sm leading-relaxed text-text-muted">
                  {c.body}
                </p>

                <div className="flex items-center gap-0.5 pt-0.5">
                  <BoutonVote
                    label={t.community.commentUp}
                    actif={c.my_vote === 1}
                    ton="up"
                    onClick={() => voter.mutate({ id: c.id, value: 1 })}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" aria-hidden />
                  </BoutonVote>
                  <span
                    className={cn(
                      'min-w-6 text-center text-xs font-bold tabular-nums',
                      c.score > 0 && 'text-ok-ink',
                      c.score < 0 && 'text-danger-ink',
                      c.score === 0 && 'text-text-faint',
                    )}
                    aria-label={t.community.voteScore(c.score)}
                  >
                    {c.score > 0 ? `+${c.score}` : c.score}
                  </span>
                  <BoutonVote
                    label={t.community.commentDown}
                    actif={c.my_vote === -1}
                    ton="down"
                    onClick={() => voter.mutate({ id: c.id, value: -1 })}
                  >
                    <ThumbsDown className="h-3.5 w-3.5" aria-hidden />
                  </BoutonVote>

                  {c.can_delete ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto text-text-faint"
                      onClick={() => setASupprimer(c)}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      {t.community.commentDelete}
                    </Button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <Dialog
        open={!!aSupprimer}
        onClose={() => setASupprimer(null)}
        title={t.community.commentDeleteConfirm}
        footer={
          <>
            <Button variant="ghost" onClick={() => setASupprimer(null)}>
              {t.common.cancel}
            </Button>
            <Button
              variant="danger"
              loading={supprimer.isPending}
              onClick={() => aSupprimer && supprimer.mutate(aSupprimer)}
            >
              {t.common.delete}
            </Button>
          </>
        }
      >
        <p className="whitespace-pre-line break-words text-sm text-text-muted">
          {aSupprimer?.body}
        </p>
      </Dialog>
    </section>
  );
}

function BoutonVote({
  label,
  actif,
  ton,
  onClick,
  children,
}: {
  label: string;
  actif: boolean;
  ton: 'up' | 'down';
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={actif}
      title={label}
      onClick={onClick}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
        actif
          ? ton === 'up'
            ? 'bg-ok/20 text-ok-ink'
            : 'bg-danger/15 text-danger-ink'
          : 'text-text-faint hover:bg-surface hover:text-text',
      )}
    >
      {children}
    </button>
  );
}
