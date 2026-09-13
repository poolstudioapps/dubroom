'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { PackFacetsFields, facetsComplete } from '@/components/pack-facets-fields';
import { Alert, Button, Dialog } from '@/components/ui';
import { humanizeError } from '@/lib/errors';
import { useT } from '@/lib/i18n';
import { setPackFacets, type Pack, type PackFacets } from '@/lib/packs';

function facetsDe(pack: Pack): PackFacets {
  return {
    title: pack.title,
    sourceUrl: pack.source_url ?? '',
    sourceLang: pack.source_lang ?? '',
    genre: pack.genre,
    tags: pack.tags,
  };
}

/**
 * Retoucher une scene publiee.
 *
 * Titre, lien, langue, genre, tags : tout ce qui se renseigne a la
 * publication se corrige ici, par l'auteur ou un administrateur. Les
 * packs publies avant que le lien devienne obligatoire en demandent un
 * au premier enregistrement. Une retouche de l'auteur est signalee sur
 * la fiche.
 */
export function PackFacetsDialog({
  pack,
  open,
  onClose,
}: {
  pack: Pack;
  open: boolean;
  onClose: () => void;
}) {
  const t = useT();
  const qc = useQueryClient();
  const [facets, setFacets] = useState<PackFacets>(() => facetsDe(pack));
  const [error, setError] = useState<string | null>(null);

  // A chaque ouverture, on repart de ce qui est publie. Pas a chaque
  // rechargement du catalogue : il effacerait la saisie en cours.
  useEffect(() => {
    if (open) {
      setFacets(facetsDe(pack));
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pack.id]);

  const save = useMutation({
    mutationFn: () => setPackFacets(pack.id, { ...facets, title: facets.title.trim() }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['packs'] });
      onClose();
    },
    onError: (e) => setError(humanizeError(e)),
  });

  return (
    <Dialog
      open={open}
      onClose={save.isPending ? () => undefined : onClose}
      title={t.community.detailEditTitle}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={save.isPending}>
            {t.common.cancel}
          </Button>
          <Button
            variant="primary"
            disabled={!facetsComplete(facets)}
            loading={save.isPending}
            onClick={() => {
              setError(null);
              save.mutate();
            }}
          >
            {t.community.detailSave}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <PackFacetsFields value={facets} onChange={setFacets} idPrefix="retoucher" />
        {error ? <Alert tone="danger">{error}</Alert> : null}
      </div>
    </Dialog>
  );
}
