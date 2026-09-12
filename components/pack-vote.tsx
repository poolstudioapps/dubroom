'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ThumbsDown, ThumbsUp } from 'lucide-react';

import { useT } from '@/lib/i18n';
import { votePack, type Pack } from '@/lib/packs';
import { cn } from '@/lib/utils';

/**
 * L'avis du groupe sur une scene preparee.
 *
 * Ce qui se juge ici n'est pas le film mais le travail de decoupage :
 * une scene mal decoupee donne des repliques tronquees, et celle qui la
 * lance ne comprend qu'a l'enregistrement. Le vote remonte les scenes
 * soignees, et c'est lui qui ordonne le catalogue.
 *
 * Revoter la meme chose retire son vote. C'est le geste attendu partout
 * ailleurs, et il evite un troisieme bouton pour se dedire.
 */
export function PackVote({ pack }: { pack: Pack }) {
  const t = useT();

  const qc = useQueryClient();
  // Etat local : le compte doit bouger au clic, pas au retour du serveur.
  const [mine, setMine] = useState(pack.my_vote);
  const [score, setScore] = useState(pack.score);

  const vote = useMutation({
    mutationFn: (value: 1 | -1) => votePack(pack.id, value),
    onMutate: (value) => {
      const next = mine === value ? 0 : value;
      setScore(score - mine + next);
      setMine(next);
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ['packs'] }),
  });

  return (
    <div className="flex items-center gap-0.5">
      <VoteButton
        label={t.community.voteUp}
        active={mine === 1}
        tone="up"
        onClick={() => vote.mutate(1)}
      >
        <ThumbsUp className="h-4 w-4" aria-hidden />
      </VoteButton>

      <span
        className={cn(
          'min-w-7 text-center text-sm font-bold tabular-nums',
          score > 0 && 'text-ok',
          score < 0 && 'text-danger',
          score === 0 && 'text-text-faint',
        )}
        aria-label={t.community.voteScore(score)}
      >
        {score > 0 ? `+${score}` : score}
      </span>

      <VoteButton
        label={t.community.voteDown}
        active={mine === -1}
        tone="down"
        onClick={() => vote.mutate(-1)}
      >
        <ThumbsDown className="h-4 w-4" aria-hidden />
      </VoteButton>
    </div>
  );
}

function VoteButton({
  label,
  active,
  tone,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  tone: 'up' | 'down';
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
        'text-text-muted hover:bg-surface-sunken hover:text-text',
        active && tone === 'up' && 'bg-ok/20 text-ok hover:text-ok',
        active && tone === 'down' && 'bg-danger/20 text-danger hover:text-danger',
      )}
    >
      {children}
    </button>
  );
}
