'use client';

import { useState } from 'react';
import { ScrollText } from 'lucide-react';

import { TermsConsent } from '@/components/terms-consent';
import { Alert, Button } from '@/components/ui';
import { TERMS_VERSION } from '@/config/terms';
import { humanizeError } from '@/lib/errors';
import { useT } from '@/lib/i18n';
import { useAcceptTerms, useMyProfile } from '@/lib/profile';

/**
 * Le seul endroit ou les conditions sont acceptees.
 *
 * L'ecran de connexion n'en porte qu'une mention, sans case : avant
 * l'authentification on ne sait pas a qui l'on parle, et l'on ne peut
 * donc pas savoir ce que cette personne a deja signe. Une case a cet
 * endroit-la aurait redemande son consentement a chaque nouveau
 * navigateur, ce qui est a la fois inutile et agacant.
 *
 * Ici, au contraire, le profil est charge. Il porte la version acceptee,
 * et cette information suit le compte partout — autre machine, autre
 * navigateur, session effacee. On demande une fois, jamais deux.
 *
 * Deux cas seulement :
 *
 *  - le profil porte la version en cours : on ne montre rien ;
 *  - il ne la porte pas : nouveau compte, ou conditions modifiees depuis
 *    la derniere acceptation. On demande, et on bloque tant que ce n'est
 *    pas fait.
 *
 * Une lecture en echec ne bloque personne : si le profil ne se charge
 * pas, le produit reste utilisable. Ce garde-fou protege un texte
 * juridique, pas un secret.
 */
export function TermsGate() {
  const t = useT();
  const profile = useMyProfile();
  const accept = useAcceptTerms();

  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aJour = profile.data?.terms_version === TERMS_VERSION;


  if (!profile.data || aJour) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-gate-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-room-deep/85 p-4 backdrop-blur-sm"
    >
      <div className="panel w-full max-w-lg space-y-4 bg-screen p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/25 text-accent-ink">
            <ScrollText className="h-5 w-5" aria-hidden />
          </span>
          <h2 id="terms-gate-title" className="text-lg font-bold">
            {t.terms.gateTitle}
          </h2>
        </div>

        <p className="text-sm leading-relaxed text-text-muted">{t.terms.gateBody}</p>

        <p className="rounded-lg bg-surface-sunken px-4 py-3 text-sm leading-relaxed text-text">
          {t.terms.gateGist}
        </p>

        <TermsConsent id="terms-gate" checked={checked} onChange={setChecked} />

        {error ? <Alert tone="danger">{error}</Alert> : null}

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!checked}
          loading={accept.isPending}
          onClick={() => {
            setError(null);
            accept.mutate(TERMS_VERSION, {
              onError: (e) => setError(humanizeError(e)),
            });
          }}
        >
          {t.terms.gateConfirm}
        </Button>
      </div>
    </div>
  );
}
