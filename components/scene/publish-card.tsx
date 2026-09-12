'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { Library, Share2 } from 'lucide-react';

import { useSceneCtx } from '@/components/scene-page';
import { Alert, Button, Card, Input } from '@/components/ui';
import { t } from '@/config/strings';
import { humanizeError } from '@/lib/errors';
import { publishRecipePack } from '@/lib/packs';

/**
 * Publier une scene terminee.
 *
 * Ce qui est possible ici depend de la source, et il vaut mieux le dire
 * que le laisser deviner :
 *
 *  - scene venue d'un LIEN : publiable meme maintenant. Une recette ne
 *    contient que le lien et la preparation, et tous deux survivent a la
 *    purge de fin de rendu ;
 *  - scene venue d'un FICHIER : les medias ont ete effaces, il n'y a plus
 *    rien a partager. La decision devait etre prise avant le rendu.
 */
export function PublishCard() {
  const { session, isHost, refetch } = useSceneCtx();
  const [title, setTitle] = useState(session.title ?? '');
  const [error, setError] = useState<string | null>(null);

  const publish = useMutation({
    mutationFn: () => publishRecipePack(session.id, title),
    onSuccess: () => refetch(),
    onError: (e) => setError(humanizeError(e)),
  });

  if (!isHost) return null;

  if (session.published_pack_id) {
    return (
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-bold">
          <Library className="h-4 w-4 text-ok" aria-hidden />
          {t.community.published}
        </p>
        <Link
          href="/communaute"
          className="inline-flex min-h-11 items-center text-sm font-bold text-link underline underline-offset-4"
        >
          {t.community.seeInCommunity}
        </Link>
      </Card>
    );
  }

  // Pas de lien d'origine : les medias sont partis avec la purge.
  if (!session.source_ref) {
    return (
      <Card>
        <Alert>{t.community.publishTooLate}</Alert>
      </Card>
    );
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-2">
        <Share2 className="h-4 w-4 text-text-muted" aria-hidden />
        <h2 className="text-sm font-bold">{t.community.publish}</h2>
      </div>
      <p className="text-xs text-text-faint">{t.community.publishRecipeHelp}</p>

      <div className="flex flex-wrap gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t.create.titlePlaceholder}
          className="min-w-48 flex-1"
        />
        <Button
          variant="primary"
          loading={publish.isPending}
          onClick={() => {
            setError(null);
            publish.mutate();
          }}
        >
          {t.community.publish}
        </Button>
      </div>

      {error ? <Alert tone="danger">{error}</Alert> : null}
    </Card>
  );
}
