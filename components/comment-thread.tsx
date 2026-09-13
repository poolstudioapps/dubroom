'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { Flag, MessageSquare, Reply, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react';

import { Avatar } from '@/components/avatar';
import { CertifiedBadge } from '@/components/certified-badge';
import { SelectMenu } from '@/components/select-menu';
import { Alert, Button, Dialog, Spinner } from '@/components/ui';
import { profileHref } from '@/lib/creators';
import { humanizeError } from '@/lib/errors';
import { useLocale, useT } from '@/lib/i18n';
import {
  addComment,
  commentsKey,
  deletePackComment,
  listComments,
  reportComment,
  votePackComment,
  type CommentTarget,
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
 * Un fil de commentaires, sous une scene ou sur un profil.
 *
 * Deux niveaux, pas plus : on repond a un commentaire, et repondre a une
 * reponse range sous le meme premier commentaire. Au-dela, un fil de
 * soiree devient un escalier qu'on ne lit plus.
 *
 * Les votes font remonter ce qui aide. Chacun peut signaler un
 * commentaire une fois : au cinquieme signalement il disparait et son
 * auteur est averti ; au troisieme avertissement, son acces est suspendu.
 * Chacun supprime les siens ; un administrateur, tous ; et sur son profil,
 * on supprime aussi ce qu'on nous a ecrit.
 */
export function CommentThread({ target, intro }: { target: CommentTarget; intro?: string }) {
  const t = useT();
  const locale = useLocale();
  const qc = useQueryClient();

  const [texte, setTexte] = useState('');
  const [tri, setTri] = useState<Tri>('top');
  const [filtre, setFiltre] = useState<Filtre>('all');
  const [erreur, setErreur] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [aSupprimer, setASupprimer] = useState<PackComment | null>(null);
  const [aSignaler, setASignaler] = useState<PackComment | null>(null);
  /** Le premier commentaire sous lequel on est en train de repondre. */
  const [reponseA, setReponseA] = useState<string | null>(null);
  const [reponse, setReponse] = useState('');

  const cle = commentsKey(target);
  const commentaires = useQuery({ queryKey: cle, queryFn: () => listComments(target) });

  const rafraichir = () => {
    void qc.invalidateQueries({ queryKey: cle });
    void qc.invalidateQueries({ queryKey: ['packs'] });
    if (target.kind === 'profile') void qc.invalidateQueries({ queryKey: ['creator', target.id] });
  };

  const publier = useMutation({
    mutationFn: (entree: { corps: string; parent: string | null }) =>
      addComment(target, entree.corps, entree.parent),
    onMutate: () => {
      setErreur(null);
      setInfo(null);
    },
    onSuccess: (_id, entree) => {
      if (entree.parent) {
        setReponse('');
        setReponseA(null);
      } else {
        setTexte('');
        // Son propre message doit se voir tout de suite, pas en bas d'un
        // tri par votes ou il n'a encore aucune voix.
        setTri('recent');
        setFiltre('all');
      }
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

  const signaler = useMutation({
    mutationFn: (commentaire: PackComment) => reportComment(commentaire.id),
    onSuccess: (resultat) => {
      setASignaler(null);
      setInfo(resultat.removed ? t.community.commentRemovedAfterReports : t.community.commentReportedThanks);
      rafraichir();
    },
    onError: (e) => {
      setASignaler(null);
      setErreur(humanizeError(e));
    },
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
  const reponsesDe = new Map<string, PackComment[]>();
  for (const c of tous) {
    if (!c.parent_id) continue;
    const liste = reponsesDe.get(c.parent_id) ?? [];
    liste.push(c);
    reponsesDe.set(c.parent_id, liste);
  }
  for (const liste of reponsesDe.values()) liste.sort((a, b) => a.created_at.localeCompare(b.created_at));

  const racines = tous
    .filter((c) => !c.parent_id)
    .filter((c) => (filtre === 'mine' ? c.is_mine : filtre === 'positive' ? c.score > 0 : true))
    .sort((a, b) => {
      const recent = b.created_at.localeCompare(a.created_at);
      if (tri === 'recent') return recent;
      if (tri === 'oldest') return -recent;
      return b.score - a.score || recent;
    });

  const nbRacines = tous.filter((c) => !c.parent_id).length;

  function Element({ c, racine }: { c: PackComment; racine: PackComment }) {
    return (
      <div className="flex gap-3">
        <Link href={profileHref(c.author_id)} className="shrink-0" tabIndex={-1} aria-hidden>
          <Avatar name={c.author_name} path={c.author_avatar} size="sm" />
        </Link>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="flex flex-wrap items-center gap-x-2 text-sm">
            <Link href={profileHref(c.author_id)} className="font-bold hover:underline">
              {c.author_name}
            </Link>
            {c.author_certified ? <CertifiedBadge /> : null}
            {c.is_mine ? <span className="text-xs text-text-faint">{t.studio.you}</span> : null}
            <time
              dateTime={c.created_at}
              title={new Date(c.created_at).toLocaleString(locale)}
              className="text-xs text-text-faint"
            >
              {ilYa(c.created_at, locale)}
            </time>
          </p>
          <p className="whitespace-pre-line break-words text-sm leading-relaxed text-text-muted">{c.body}</p>

          <div className="flex flex-wrap items-center gap-0.5 pt-0.5">
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

            <Button
              size="sm"
              variant="ghost"
              className="text-text-faint"
              onClick={() => {
                setReponseA(reponseA === racine.id ? null : racine.id);
                setReponse(c.id === racine.id ? '' : `@${c.author_name} `);
              }}
            >
              <Reply className="h-3.5 w-3.5" aria-hidden />
              {t.community.commentReply}
            </Button>

            <span className="ml-auto flex items-center gap-0.5">
              {c.can_report ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-text-faint"
                  onClick={() => setASignaler(c)}
                >
                  <Flag className="h-3.5 w-3.5" aria-hidden />
                  {t.community.commentReport}
                </Button>
              ) : null}
              {c.can_delete ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-text-faint"
                  onClick={() => setASupprimer(c)}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  {t.community.commentDelete}
                </Button>
              ) : null}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-4" aria-labelledby={`commentaires-${target.kind}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id={`commentaires-${target.kind}`}
          className="titre titre-section flex items-baseline gap-2 text-xl"
        >
          {t.community.commentsTitle}
          {tous.length > 0 ? (
            <span className="text-sm font-semibold text-text-faint">{tous.length}</span>
          ) : null}
        </h2>

        {nbRacines > 1 ? (
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

      {intro ? <p className="text-sm leading-relaxed text-text-muted">{intro}</p> : null}

      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (texte.trim()) publier.mutate({ corps: texte, parent: null });
        }}
      >
        <label htmlFor={`nouveau-${target.kind}`} className="sr-only">
          {t.community.commentsPlaceholder}
        </label>
        <ChampTexte
          id={`nouveau-${target.kind}`}
          valeur={texte}
          onChange={setTexte}
          placeholder={t.community.commentsPlaceholder}
          onEnvoyer={() => texte.trim() && publier.mutate({ corps: texte, parent: null })}
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs tabular-nums text-text-faint">
            {texte.length > LONGUEUR_MAX - 150 ? t.community.commentCharsLeft(LONGUEUR_MAX - texte.length) : null}
          </span>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!texte.trim()}
            loading={publier.isPending && !reponseA}
          >
            {t.community.commentsSubmit}
          </Button>
        </div>
      </form>

      {erreur ? <Alert tone="danger">{erreur}</Alert> : null}
      {info ? <Alert tone="ok">{info}</Alert> : null}

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

      {nbRacines > 0 && racines.length === 0 ? (
        <p className="text-sm text-text-faint">{t.community.commentsNoMatch}</p>
      ) : null}

      {racines.length > 0 ? (
        <ul className="panel divide-y divide-border overflow-hidden">
          {racines.map((racine) => {
            const reponses = reponsesDe.get(racine.id) ?? [];
            return (
              <li key={racine.id} className="space-y-4 p-4">
                <Element c={racine} racine={racine} />

                {reponses.length > 0 ? (
                  <ul className="ml-4 space-y-4 border-l-2 border-border pl-4 sm:ml-10">
                    {reponses.map((r) => (
                      <li key={r.id}>
                        <Element c={r} racine={racine} />
                      </li>
                    ))}
                  </ul>
                ) : null}

                {reponseA === racine.id ? (
                  <form
                    className="ml-4 space-y-2 sm:ml-10"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (reponse.trim()) publier.mutate({ corps: reponse, parent: racine.id });
                    }}
                  >
                    <ChampTexte
                      id={`reponse-${racine.id}`}
                      valeur={reponse}
                      onChange={setReponse}
                      placeholder={t.community.commentReplyPlaceholder}
                      autoFocus
                      lignes={2}
                      onEnvoyer={() =>
                        reponse.trim() && publier.mutate({ corps: reponse, parent: racine.id })
                      }
                    />
                    <div className="flex justify-end gap-2">
                      <Button type="button" size="sm" variant="ghost" onClick={() => setReponseA(null)}>
                        {t.common.cancel}
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        variant="primary"
                        disabled={!reponse.trim()}
                        loading={publier.isPending}
                      >
                        {t.community.commentReply}
                      </Button>
                    </div>
                  </form>
                ) : null}
              </li>
            );
          })}
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
        <p className="whitespace-pre-line break-words text-sm text-text-muted">{aSupprimer?.body}</p>
      </Dialog>

      <Dialog
        open={!!aSignaler}
        onClose={() => setASignaler(null)}
        title={t.community.commentReportTitle}
        footer={
          <>
            <Button variant="ghost" onClick={() => setASignaler(null)}>
              {t.common.cancel}
            </Button>
            <Button
              variant="danger"
              loading={signaler.isPending}
              onClick={() => aSignaler && signaler.mutate(aSignaler)}
            >
              <Flag className="h-4 w-4" aria-hidden />
              {t.community.commentReport}
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm">
          <p className="whitespace-pre-line break-words rounded-card bg-surface-sunken p-3 text-text-muted">
            {aSignaler?.body}
          </p>
          <p className="leading-relaxed text-text-muted">{t.community.commentReportBody}</p>
        </div>
      </Dialog>
    </section>
  );
}

function ChampTexte({
  id,
  valeur,
  onChange,
  placeholder,
  onEnvoyer,
  autoFocus,
  lignes = 3,
}: {
  id: string;
  valeur: string;
  onChange: (v: string) => void;
  placeholder: string;
  onEnvoyer: () => void;
  autoFocus?: boolean;
  lignes?: number;
}) {
  return (
    <textarea
      id={id}
      value={valeur}
      rows={lignes}
      maxLength={LONGUEUR_MAX}
      autoFocus={autoFocus}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        // Ctrl/Cmd + Entree publie, comme dans toutes les messageries.
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          onEnvoyer();
        }
      }}
      placeholder={placeholder}
      className={cn(
        'ui-input block w-full resize-y rounded-sm border-2 border-border-strong bg-screen px-3 py-2 text-sm leading-relaxed text-text',
        'shadow-[inset_0_2px_4px_0_rgb(0_0_0/0.18)] placeholder:italic placeholder:text-text-faint focus:border-bezel focus:outline-none',
      )}
    />
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
