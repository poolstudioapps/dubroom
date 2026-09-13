'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Clapperboard, PartyPopper, Plus } from 'lucide-react';

import { LinkButton } from '@/components/link-button';
import { useSceneCtx } from '@/components/scene-page';
import { Alert, Button, Card } from '@/components/ui';
import { openLobby } from '@/lib/actions';
import { humanizeError } from '@/lib/errors';
import { useT } from '@/lib/i18n';
import { packHref } from '@/lib/packs';

/**
 * Le pack est publie. Et maintenant ?
 *
 * C'est seulement ici qu'on propose de jouer : la scene est prete, la
 * video est la, le lobby s'ouvre en un clic. Les deux autres suites
 * restent a portee — voir la fiche telle que la communaute la voit, ou
 * enchainer sur un autre pack.
 */
export function PackPublishedPanel() {
  const t = useT();
  const { session, refetch } = useSceneCtx();
  const [error, setError] = useState<string | null>(null);

  const jouer = useMutation({
    mutationFn: () => openLobby(session.id),
    onSuccess: () => refetch(),
    onError: (e) => setError(humanizeError(e)),
  });

  return (
    <Card className="mx-auto max-w-xl space-y-6 p-6 text-center sm:p-8">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/15 text-accent">
        <PartyPopper className="h-8 w-8" aria-hidden />
      </span>

      <div className="space-y-2">
        <h1 className="titre text-3xl sm:text-4xl">{t.prepare.packPublishedTitle}</h1>
        <p className="text-balance text-sm leading-relaxed text-text-muted">
          {t.prepare.packPublishedBody}
        </p>
      </div>

      <div className="flex flex-col items-center gap-3">
        <Button
          variant="primary"
          size="lg"
          className="w-full sm:w-auto"
          loading={jouer.isPending}
          onClick={() => {
            setError(null);
            jouer.mutate();
          }}
        >
          <Clapperboard className="h-5 w-5" aria-hidden />
          {t.prepare.packPlay}
        </Button>
        <p className="text-xs text-text-faint">{t.prepare.packPlayHint}</p>
        {session.published_pack_id ? (
          <LinkButton href={packHref(session.published_pack_id)} variant="secondary" className="w-full sm:w-auto">
            {t.prepare.packSeeFiche}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </LinkButton>
        ) : null}
        <Link
          href="/sessions/new?pour=communaute"
          className="lien-surligne inline-flex items-center gap-1 text-sm font-bold text-text"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {t.prepare.packAnother}
        </Link>
      </div>

      {error ? <Alert tone="danger">{error}</Alert> : null}
    </Card>
  );
}
