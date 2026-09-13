'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Library, Share2 } from 'lucide-react';

import { useT } from '@/lib/i18n';
import { PackFacetsFields, facetsComplete } from '@/components/pack-facets-fields';
import { useSceneCtx } from '@/components/scene-page';
import { Alert, Button, Card } from '@/components/ui';

import { humanizeError } from '@/lib/errors';
import { packHref, publishRecipePack, type PackFacets, type PackGenre } from '@/lib/packs';
import type { SessionRow } from '@/lib/supabase/database.types';

/** Ce qu'on sait deja de la fiche : la scene, et sa fiche de depart. */
export function facetsDeLaScene(session: SessionRow): PackFacets {
  const brouillon = session.pack_draft;
  return {
    title: session.title ?? '',
    sourceUrl:
      brouillon?.source_url ??
      (session.source_type === 'youtube' ? (session.source_ref ?? '') : ''),
    sourceLang: session.source_lang ?? '',
    genre: (brouillon?.genre as PackGenre | null) ?? '',
    tags: brouillon?.tags ?? [],
  };
}

/**
 * Publier une scene terminee.
 *
 * Ce qui part dans la communaute, c'est le decoupage — personnages,
 * texte, reperes — et le lien d'ou vient l'extrait, jamais la video.
 *
 * Sur l'ecran du resultat, la carte commence par poser la question :
 * « partager ce pack ? ». Un formulaire deplie d'emblee se lisait comme
 * une etape obligatoire, et on le sautait sans le lire. Oui ouvre la
 * fiche complete ; non la range, avec de quoi changer d'avis.
 */
export function PublishCard({ ask = false }: { ask?: boolean }) {
  const t = useT();
  const qc = useQueryClient();
  const { session, isHost, refetch } = useSceneCtx();
  const [etape, setEtape] = useState<'question' | 'fiche' | 'plusTard'>(
    ask ? 'question' : 'fiche',
  );
  const [facets, setFacets] = useState<PackFacets>(() => facetsDeLaScene(session));
  const [error, setError] = useState<string | null>(null);

  const publish = useMutation({
    mutationFn: () =>
      publishRecipePack(session.id, { ...facets, title: facets.title.trim() }),
    onSuccess: () => {
      refetch();
      void qc.invalidateQueries({ queryKey: ['packs'] });
    },
    onError: (e) => setError(humanizeError(e)),
  });

  if (!isHost) return null;

  // Deja dans la communaute : publiee ici, ou venue du catalogue. Une
  // seconde publication ferait un doublon que personne ne departagerait.
  const dejaLa = session.published_pack_id ?? session.from_pack_id;
  if (dejaLa) {
    return (
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-bold">
          <Library
            className={session.published_pack_id ? 'h-4 w-4 text-ok' : 'h-4 w-4 text-text-faint'}
            aria-hidden
          />
          {session.published_pack_id ? t.community.published : t.community.publishFromCatalogue}
        </p>
        <Link
          href={packHref(dejaLa)}
          className="inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-sm font-bold text-accent transition-colors hover:text-accent-hover"
        >
          {t.community.seeInCommunity}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </Card>
    );
  }

  if (etape === 'question') {
    return (
      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Share2 className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="font-bold">{t.community.publishAskTitle}</h2>
          <p className="text-sm leading-relaxed text-text-muted">{t.community.publishAskBody}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="primary" onClick={() => setEtape('fiche')}>
            {t.community.publishAskYes}
          </Button>
          <Button variant="ghost" onClick={() => setEtape('plusTard')}>
            {t.community.publishAskNo}
          </Button>
        </div>
      </Card>
    );
  }

  if (etape === 'plusTard') {
    return (
      <Card className="flex flex-wrap items-center justify-between gap-3 py-3">
        <p className="text-sm text-text-muted">{t.community.publishLater}</p>
        <Button size="sm" variant="ghost" onClick={() => setEtape('fiche')}>
          <Share2 className="h-3.5 w-3.5" aria-hidden />
          {t.community.publish}
        </Button>
      </Card>
    );
  }

  const complet = facetsComplete(facets);

  return (
    <Card className="space-y-5 p-5 sm:p-6">
      <div className="space-y-1">
        <h2 className="flex items-center gap-2 font-bold">
          <Share2 className="h-4 w-4 text-accent" aria-hidden />
          {t.community.publish}
        </h2>
        <p className="text-sm leading-relaxed text-text-muted">{t.community.publishRecipeHelp}</p>
      </div>

      <PackFacetsFields value={facets} onChange={setFacets} idPrefix="publier" />

      {error ? <Alert tone="danger">{error}</Alert> : null}

      <div className="space-y-2">
        <div className="flex flex-wrap justify-end gap-2">
          {ask ? (
            <Button variant="ghost" onClick={() => setEtape('plusTard')}>
              {t.common.cancel}
            </Button>
          ) : null}
          <Button
            variant="primary"
            disabled={!complet}
            loading={publish.isPending}
            onClick={() => {
              setError(null);
              publish.mutate();
            }}
          >
            {t.community.publish}
          </Button>
        </div>
        {complet ? null : (
          <p className="text-right text-xs text-text-faint">{t.community.publishMissing}</p>
        )}
      </div>
    </Card>
  );
}
