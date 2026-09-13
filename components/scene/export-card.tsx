'use client';

import { useState } from 'react';
import { Download, Loader2, Share2 } from 'lucide-react';

import { Alert, Button, Card } from '@/components/ui';
import { useSceneCtx } from '@/components/scene-page';
import { formatBytes } from '@/config/strings';
import { useRenderUrl } from '@/lib/data';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/**
 * Emporter le rendu.
 *
 * Un seul fichier, au format de la video d'origine : une scene tournee
 * debout ressort debout, une scene en 16/9 ressort en 16/9. La version
 * recadree en 9/16 coupait les bords de tous les plans larges et doublait
 * le temps de montage pour un fichier que peu de gens prenaient.
 *
 * Le partage passe par le systeme d'exploitation, et c'est un choix.
 * Publier directement sur TikTok ou Instagram demanderait un compte
 * developpeur valide chez chacun, une application soumise a leur
 * validation, et le droit de poster au nom de quelqu'un — beaucoup de
 * dependances pour un outil prive. La feuille de partage du telephone
 * fait la meme chose, tout de suite, et sans rien demander a personne :
 * elle propose les applications reellement installees.
 */
export function ExportCard() {
  const t = useT();
  const { session } = useSceneCtx();

  const rendu = useRenderUrl(session);
  const url = rendu.data ?? null;
  const titre = session.title ?? 'Dub’Up';
  const fichier = `${titre}.mp4`;

  const [partage, setPartage] = useState<'idle' | 'working' | 'unsupported'>('idle');

  /**
   * Envoie le fichier a la feuille de partage du systeme.
   *
   * Le fichier est telecharge puis passe a `navigator.share` : passer
   * l'adresse seule ouvrirait un partage de lien, que les applications
   * video refusent, et l'adresse est signee pour une heure de toute
   * facon.
   */
  async function partager() {
    if (!url) return;
    setPartage('working');
    try {
      const blob = await (await fetch(url)).blob();
      const video = new File([blob], fichier, { type: 'video/mp4' });
      if (!navigator.canShare?.({ files: [video] })) {
        setPartage('unsupported');
        return;
      }
      await navigator.share({ files: [video], title: titre });
      setPartage('idle');
    } catch {
      // Un partage annule n'est pas une erreur : on se tait.
      setPartage('idle');
    }
  }

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-bold">{t.result.exportTitle}</h2>
        {session.render_size_bytes ? (
          <span className="text-xs text-text-faint">{formatBytes(session.render_size_bytes)}</span>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href={url ?? undefined}
          download={fichier}
          aria-disabled={!url}
          className={cn(
            'btn-3d btn-primary inline-flex h-11 flex-1 items-center justify-center gap-2 px-4',
            'text-sm font-semibold',
            !url && 'pointer-events-none opacity-40',
          )}
        >
          {url ? (
            <Download className="h-4 w-4" aria-hidden />
          ) : (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          )}
          {t.result.download}
        </a>

        {/*
          Le bouton de partage n'apparait que la ou il fait quelque chose.
          Sur un ordinateur de bureau, la feuille de partage n'existe pas et
          le bouton ne serait qu'une deception.
        */}
        {typeof navigator !== 'undefined' && 'share' in navigator ? (
          <Button
            className="h-11 flex-1"
            disabled={!url || partage === 'working'}
            loading={partage === 'working'}
            onClick={() => void partager()}
          >
            <Share2 className="h-4 w-4" aria-hidden />
            {t.result.share}
          </Button>
        ) : null}
      </div>

      {partage === 'unsupported' ? (
        <Alert>{t.result.shareUnsupported}</Alert>
      ) : (
        <p className="text-xs leading-relaxed text-text-faint">{t.result.shareHelp}</p>
      )}
    </Card>
  );
}
