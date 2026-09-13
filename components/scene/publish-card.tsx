'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { Library, Share2 } from 'lucide-react';

import { useT } from '@/lib/i18n';
import { PackFacetsFields, facetsComplete } from '@/components/pack-facets-fields';
import { useSceneCtx } from '@/components/scene-page';
import { Alert, Button, Card } from '@/components/ui';

import { humanizeError } from '@/lib/errors';
import { packHref, publishRecipePack, type PackFacets } from '@/lib/packs';

/**
 * Publier une scene terminee.
 *
 * Toute scene preparee se publie, qu'elle vienne d'un lien ou d'un
 * fichier : ce qui part dans la communaute, c'est le decoupage — les
 * personnages, le texte, les reperes — jamais la video. Une scene venue
 * d'un lien garde en plus son lien ; celle d'un fichier demande a ceux
 * qui la rejouent d'apporter le leur.
 *
 * Titre, langue et genre sont obligatoires. Ils etaient facultatifs, et
 * le catalogue se remplissait de scenes « Autre », en langue inconnue,
 * que plus aucun filtre ne retrouvait. Les etiquettes, elles, restent
 * libres : c'est ce qu'on tape dans la recherche (#starwars).
 */
export function PublishCard() {
  const t = useT();
  const qc = useQueryClient();
  const { session, isHost, refetch } = useSceneCtx();
  const [facets, setFacets] = useState<PackFacets>({
    title: session.title ?? '',
    // Choisie a la creation : on ne la redemande pas.
    sourceLang: session.source_lang ?? '',
    genre: '',
    tags: [],
  });
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
          className="inline-flex min-h-11 items-center text-sm font-bold text-link underline underline-offset-4"
        >
          {t.community.seeInCommunity}
        </Link>
      </Card>
    );
  }

  const complet = facetsComplete(facets);
  const depuisLien = session.source_type === 'youtube' && !!session.source_ref;

  return (
    <Card className="space-y-4">
      <div className="space-y-1">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <Share2 className="h-4 w-4 text-text-muted" aria-hidden />
          {t.community.publish}
        </h2>
        <p className="text-xs leading-relaxed text-text-faint">
          {depuisLien ? t.community.publishRecipeHelp : t.community.publishUploadHelp}
        </p>
      </div>

      <PackFacetsFields value={facets} onChange={setFacets} idPrefix="publier" />

      <div className="space-y-2">
        <Button
          variant="primary"
          className="w-full"
          disabled={!complet}
          loading={publish.isPending}
          onClick={() => {
            setError(null);
            publish.mutate();
          }}
        >
          {t.community.publish}
        </Button>
        {complet ? null : (
          <p className="text-center text-xs text-text-faint">{t.community.publishMissing}</p>
        )}
      </div>

      {error ? <Alert tone="danger">{error}</Alert> : null}
    </Card>
  );
}
