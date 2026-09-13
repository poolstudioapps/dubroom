'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button, Dialog } from '@/components/ui';
import { useT } from '@/lib/i18n';

/**
 * « Ta session a expiré. »
 *
 * S'ouvre a l'accueil quand on y arrive depuis un studio ferme pour
 * inactivite (`/?expiree=1`). La fermer retire le parametre de l'adresse :
 * un rechargement ne la rouvre pas.
 */
export function SessionExpiredDialog({ open: initial }: { open: boolean }) {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(initial);

  function fermer() {
    setOpen(false);
    router.replace('/', { scroll: false });
  }

  return (
    <Dialog
      open={open}
      onClose={fermer}
      title={t.studio.expiredTitle}
      footer={
        <Button variant="primary" onClick={fermer}>
          {t.studio.expiredOk}
        </Button>
      }
    >
      <p className="text-sm leading-relaxed text-text-muted">{t.studio.expiredBody}</p>
    </Dialog>
  );
}
