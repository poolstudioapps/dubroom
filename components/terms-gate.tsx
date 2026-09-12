'use client';

import { useEffect, useRef, useState } from 'react';
import { ScrollText } from 'lucide-react';

import { TermsConsent } from '@/components/terms-consent';
import { Alert, Button } from '@/components/ui';
import { TERMS_STORAGE_KEY, TERMS_VERSION } from '@/config/terms';
import { humanizeError } from '@/lib/errors';
import { useT } from '@/lib/i18n';
import { useAcceptTerms, useMyProfile } from '@/lib/profile';

/**
 * Le passage oblige par les conditions.
 *
 * La case est cochee sur l'ecran de connexion, donc avant d'avoir un
 * compte : au moment ou l'on demande un lien par courriel, il n'y a
 * encore personne a qui attacher la reponse. Elle attend dans le
 * navigateur, et c'est ici, a la premiere page connectee, qu'elle
 * devient une ligne en base — qui a accepte, quelle version, quand.
 *
 * Trois cas, et il faut les trois :
 *
 *  - le profil porte la version en cours : on ne montre rien ;
 *  - le profil ne la porte pas mais le navigateur si : la personne vient
 *    de cocher, on inscrit sans rien demander ;
 *  - ni l'un ni l'autre : un compte ouvert avant ces conditions, ou une
 *    connexion depuis une autre machine. On demande, et on bloque.
 *
 * Le troisieme cas est la raison d'etre du composant. Une case cochee a
 * l'inscription ne dit rien des comptes qui existaient avant elle, et
 * c'est precisement ceux-la qu'il faut rattraper.
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

  // L'acceptation laissee par l'ecran de connexion, inscrite une fois.
  // Le verrou est une reference et non un etat : l'objet de mutation
  // change a chaque rendu, et s'y fier relancait l'ecriture en boucle.
  const inscrite = useRef(false);
  useEffect(() => {
    if (!profile.data || aJour || inscrite.current) return;
    if (window.localStorage.getItem(TERMS_STORAGE_KEY) !== TERMS_VERSION) return;
    inscrite.current = true;
    accept.mutate(TERMS_VERSION);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.data, aJour]);

  if (!profile.data || aJour) return null;

  // Le temps que l'inscription silencieuse passe, rien ne s'affiche :
  // montrer la carte une demi-seconde pour la retirer aussitot donnerait
  // un clignotement a chaque chargement de page.
  const dejaCochee =
    typeof window !== 'undefined' &&
    window.localStorage.getItem(TERMS_STORAGE_KEY) === TERMS_VERSION;
  if (dejaCochee) return null;

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
              onSuccess: () =>
                window.localStorage.setItem(TERMS_STORAGE_KEY, TERMS_VERSION),
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
