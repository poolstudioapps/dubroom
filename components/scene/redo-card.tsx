'use client';

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { RotateCcw } from 'lucide-react';

import { GuideIcon } from '@/components/guide-icon';
import { useSceneCtx } from '@/components/scene-page';
import { Alert, Button, Card, Dialog } from '@/components/ui';
import { redoublerScene } from '@/lib/actions';
import { humanizeError } from '@/lib/errors';
import { useT } from '@/lib/i18n';

/**
 * « On la refait ? »
 *
 * Tant que la video et les pistes sont encore la — l'heure qui suit le
 * montage —, l'hote peut relancer une manche : retour au lobby pour tout
 * le monde, avec la meme scene et les memes joueurs. Chacun y reprend ou
 * change de personnage, et rien n'est a reconstruire.
 *
 * Les autres joueurs voient ce que l'hote peut faire : quand il lance, la
 * scene repasse au lobby et leur ecran suit tout seul.
 */
export function RedoCard() {
  const t = useT();
  const { session, isHost, refetch } = useSceneCtx();
  const [confirmer, setConfirmer] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const relancer = useMutation({
    mutationFn: () => redoublerScene(session.id),
    onSuccess: () => {
      setConfirmer(false);
      refetch();
    },
    onError: (e) => setErreur(humanizeError(e)),
  });

  const disponible = !!session.video_path && !!session.stem_music_path;
  // Sans fichiers, seul l'hote a besoin de savoir pourquoi le bouton manque.
  if (!disponible && !isHost) return null;

  return (
    <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <GuideIcon nom="clap" className="h-14 w-14 shrink-0 drop-shadow-[0_10px_14px_rgb(0_0_0/0.55)]" />
      <div className="min-w-0 flex-1 space-y-1">
        <h2 className="text-base font-bold">{t.result.redoTitle}</h2>
        <p className="text-sm leading-relaxed text-text-muted">
          {!disponible ? t.result.redoUnavailable : isHost ? t.result.redoBody : t.result.redoGuest}
        </p>
        {erreur ? <Alert tone="danger">{erreur}</Alert> : null}
      </div>
      {isHost && disponible ? (
        <Button
          variant="primary"
          className="shrink-0"
          onClick={() => {
            setErreur(null);
            setConfirmer(true);
          }}
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          {t.result.redoAction}
        </Button>
      ) : null}

      <Dialog
        open={confirmer}
        onClose={() => setConfirmer(false)}
        title={t.result.redoConfirmTitle}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmer(false)}>
              {t.common.cancel}
            </Button>
            <Button variant="primary" loading={relancer.isPending} onClick={() => relancer.mutate()}>
              <RotateCcw className="h-4 w-4" aria-hidden />
              {t.result.redoAction}
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-text-muted">{t.result.redoConfirmBody}</p>
      </Dialog>
    </Card>
  );
}
