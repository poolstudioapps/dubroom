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
    sourceLang: pack.source_lang ?? '',
    genre: pack.genre,
    tags: pack.tags,
  };
}

/**
 * Retoucher une scene publiee.
 *
 * Les scenes publiees avant que la langue et le genre deviennent
 * obligatoires n'en ont souvent pas : leur auteur, ou un administrateur,
 * les complete ici, etiquettes comprises.
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
