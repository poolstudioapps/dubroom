'use client';

import { useState } from 'react';
import {
  Download,
  Loader2,
  RectangleHorizontal,
  Share2,
  Smartphone,
} from 'lucide-react';

import { Alert, Button, Card } from '@/components/ui';
import { useSceneCtx } from '@/components/scene-page';
import { formatBytes } from '@/config/strings';
import { useRenderUrl } from '@/lib/data';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/**
 * Emporter le rendu.
 *
 * Deux fichiers, parce qu'il y a deux endroits ou l'on montre ce genre
 * de chose : l'original 16/9 pour un ecran d'ordinateur ou une
 * television, et une version recadree au centre pour les applications
 * qui ne connaissent que le format debout.
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

  const large = useRenderUrl(session, 'large');
  const vertical = useRenderUrl(session, 'vertical');

  const [partage, setPartage] = useState<'idle' | 'working' | 'unsupported'>('idle');

  /**
   * Envoie le fichier a la feuille de partage du systeme.
   *
   * Le fichier est telecharge puis passe a `navigator.share` : passer
   * l'adresse seule ouvrirait un partage de lien, que les applications
   * video refusent, et l'adresse est signee pour une heure de toute
   * facon.
   */
  async function partager(url: string, nom: string) {
    setPartage('working');
    try {
      const blob = await (await fetch(url)).blob();
      const fichier = new File([blob], nom, { type: 'video/mp4' });
      if (!navigator.canShare?.({ files: [fichier] })) {
        setPartage('unsupported');
        return;
      }
      await navigator.share({ files: [fichier], title: session.title ?? 'Dub’Up' });
      setPartage('idle');
    } catch {
      // Un partage annule n'est pas une erreur : on se tait.
      setPartage('idle');
    }
  }

  const titre = session.title ?? 'Dub’Up';

  return (
    <Card className="space-y-3">
      <h2 className="text-sm font-bold">{t.result.exportTitle}</h2>

      <div className="grid gap-2 sm:grid-cols-2">
        <Format
          icone={<RectangleHorizontal className="h-4 w-4" aria-hidden />}
          nom={t.result.formatWide}
          detail={t.result.formatWideHint}
          taille={session.render_size_bytes}
          url={large.data ?? null}
          fichier={`${titre}.mp4`}
          onPartager={partager}
          partageEnCours={partage === 'working'}
          t={t}
        />

        <Format
          icone={<Smartphone className="h-4 w-4" aria-hidden />}
          nom={t.result.formatVertical}
          detail={t.result.formatVerticalHint}
          taille={session.render_vertical_size_bytes}
          url={vertical.data ?? null}
          fichier={`${titre} (9x16).mp4`}
          onPartager={partager}
          partageEnCours={partage === 'working'}
          indisponible={!session.render_vertical_path}
          indisponibleTexte={t.result.formatVerticalMissing}
          t={t}
        />
      </div>

      {partage === 'unsupported' ? (
        <Alert>{t.result.shareUnsupported}</Alert>
      ) : (
        <p className="text-xs leading-relaxed text-text-faint">{t.result.shareHelp}</p>
      )}
    </Card>
  );
}

function Format({
  icone,
  nom,
  detail,
  taille,
  url,
  fichier,
  onPartager,
  partageEnCours,
  indisponible,
  indisponibleTexte,
  t,
}: {
  icone: React.ReactNode;
  nom: string;
  detail: string;
  taille: number | null;
  url: string | null;
  fichier: string;
  onPartager: (url: string, nom: string) => void;
  partageEnCours: boolean;
  indisponible?: boolean;
  indisponibleTexte?: string;
  t: ReturnType<typeof useT>;
}) {
  return (
    <div className="panel space-y-2 p-3">
      <p className="flex items-center gap-2 text-sm font-bold">
        {icone}
        {nom}
      </p>
      <p className="text-xs leading-relaxed text-text-faint">
        {indisponible ? indisponibleTexte : detail}
        {!indisponible && taille ? ` · ${formatBytes(taille)}` : ''}
      </p>

      {indisponible ? null : (
        <div className="flex flex-wrap gap-2">
          <a
            href={url ?? undefined}
            download={fichier}
            aria-disabled={!url}
            className={cn(
              'btn-3d btn-secondary inline-flex h-10 flex-1 items-center justify-center gap-2 bg-surface-raised px-3',
              'text-xs font-semibold uppercase tracking-wide text-text [--btn-lip:var(--color-border-strong)]',
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
            Le bouton de partage n'apparait que la ou il fait quelque
            chose. Sur un ordinateur de bureau, la feuille de partage
            n'existe pas et le bouton ne serait qu'une deception.
          */}
          {typeof navigator !== 'undefined' && 'share' in navigator ? (
            <Button
              size="sm"
              className="h-10"
              disabled={!url || partageEnCours}
              loading={partageEnCours}
              onClick={() => url && onPartager(url, fichier)}
            >
              <Share2 className="h-4 w-4" aria-hidden />
              {t.result.share}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
