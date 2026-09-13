import Link from 'next/link';

import { CookieSettingsButton } from '@/components/cookie-consent';
import { LegalShell, LegalSection } from '@/components/legal-shell';
import { LOCALE_COOKIE } from '@/config/i18n';
import { APP_NAME } from '@/config/strings';
import { CONSENT_COOKIE } from '@/lib/consent';
import { AUTH_COOKIE_MAX_AGE } from '@/lib/supabase/cookies';

export const metadata = {
  robots: { index: true, follow: true },
  title: 'Cookies',
};

const JOURS_CONNEXION = Math.round(AUTH_COOKIE_MAX_AGE / 86_400);

const cellule = 'border-b border-border px-3 py-2 align-top text-left';

/**
 * La politique de cookies.
 *
 * Elle liste tout ce que le site depose, sans exception, et ce que
 * chaque element devient si l'on refuse. Le tableau est la reference :
 * un cookie ajoute au code sans ligne ici est un oubli a corriger.
 */
export default function CookiesPage() {
  return (
    <LegalShell title="Cookies">
      <LegalSection title="En bref">
        <p>
          {APP_NAME} n’utilise ni mesure d’audience, ni publicité, ni bouton de réseau
          social. Les seuls cookies déposés servent à vous garder connecté, à retenir
          votre choix sur les cookies, et — si vous l’acceptez — à vous éviter de
          refaire vos réglages à chaque visite.
        </p>
        <p>
          <CookieSettingsButton className="font-bold text-link underline underline-offset-4" />
        </p>
      </LegalSection>

      <LegalSection title="Cookies essentiels">
        <p>
          Indispensables au fonctionnement du site, ils ne peuvent pas être refusés et
          ne servent à rien d’autre.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-sm">
            <thead>
              <tr>
                <th className={cellule}>Nom</th>
                <th className={cellule}>Rôle</th>
                <th className={cellule}>Durée</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={cellule}>
                  <code>sb-…-auth-token</code>
                </td>
                <td className={cellule}>
                  Garde votre session de connexion ouverte (Supabase). Supprimé à la
                  déconnexion.
                </td>
                <td className={cellule}>{JOURS_CONNEXION} jours</td>
              </tr>
              <tr>
                <td className={cellule}>
                  <code>{CONSENT_COOKIE}</code>
                </td>
                <td className={cellule}>Retient votre choix sur les cookies.</td>
                <td className={cellule}>6 mois, puis la question est reposée</td>
              </tr>
            </tbody>
          </table>
        </div>
      </LegalSection>

      <LegalSection title="Préférences">
        <p>
          Facultatives. Si vous les refusez, tout fonctionne quand même : vos réglages
          valent le temps de la visite, puis sont oubliés.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] border-collapse text-sm">
            <thead>
              <tr>
                <th className={cellule}>Nom</th>
                <th className={cellule}>Rôle</th>
                <th className={cellule}>Durée</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={cellule}>
                  <code>{LOCALE_COOKIE}</code> (cookie)
                </td>
                <td className={cellule}>La langue que vous avez choisie.</td>
                <td className={cellule}>1 an ; fin de la visite si refusé</td>
              </tr>
              <tr>
                <td className={cellule}>
                  <code>dubup.lastEmail</code>, <code>dubup.loginMode</code> (stockage
                  local)
                </td>
                <td className={cellule}>
                  Préremplir l’adresse et le mode de connexion utilisés la dernière fois.
                </td>
                <td className={cellule}>Jusqu’à effacement ; non enregistré si refusé</td>
              </tr>
              <tr>
                <td className={cellule}>
                  <code>dubup.micOffsetEverywhere</code> (stockage local)
                </td>
                <td className={cellule}>
                  Retenir la case « appliquer à toutes mes prises » du studio.
                </td>
                <td className={cellule}>Jusqu’à effacement ; non enregistré si refusé</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Refuser les préférences efface immédiatement ce qu’elles avaient enregistré.
        </p>
      </LegalSection>

      <LegalSection title="Changer d’avis">
        <p>
          Votre choix se modifie à tout moment, depuis le lien « Gérer les cookies » en
          bas de chaque page, ou ici :{' '}
          <CookieSettingsButton className="font-bold text-link underline underline-offset-4" />.
          Vous pouvez aussi effacer les cookies depuis les réglages de votre navigateur.
        </p>
      </LegalSection>

      <p className="text-sm">
        Voir aussi la <Link href="/confidentialite">politique de confidentialité</Link>.
      </p>
    </LegalShell>
  );
}
