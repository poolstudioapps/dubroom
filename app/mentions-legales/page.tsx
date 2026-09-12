import Link from 'next/link';

import { Footer } from '@/components/footer';
import { APP_NAME } from '@/config/strings';
import { LegalShell, LegalSection } from '@/components/legal-shell';

export const metadata = { title: `Mentions légales — ${APP_NAME}` };

export default function MentionsPage() {
  return (
    <>
      <LegalShell title="Mentions légales">
        <LegalSection title="Éditeur">
          <p>
            {APP_NAME} est un projet personnel édité par Alexandre Perret (Pool
            Studio). Contact : <a href="mailto:ienders.pro@gmail.com">ienders.pro@gmail.com</a>.
          </p>
        </LegalSection>

        <LegalSection title="Hébergement">
          <p>
            L’application est hébergée par Vercel Inc., 440 N Barranca Ave #4133,
            Covina, CA 91723, États-Unis. Les données et les fichiers sont hébergés
            par Supabase, sur une infrastructure située dans l’Union européenne
            (région Irlande).
          </p>
          <p>
            Les traitements audio et vidéo s’exécutent sur un ordinateur personnel,
            et non sur un serveur : aucun fichier source ne transite par un service
            tiers en dehors de ceux cités ici.
          </p>
        </LegalSection>

        <LegalSection title="Nature du service">
          <p>
            {APP_NAME} est un outil privé, sans inscription ouverte, sans publicité
            et sans monétisation. L’accès est réservé aux personnes explicitement
            invitées par l’éditeur. Il n’existe ni catalogue public, ni partage hors
            du cercle des participants, ni indexation par les moteurs de recherche.
          </p>
        </LegalSection>

        <LegalSection title="Œuvres protégées">
          <p>
            Le service permet de retravailler la bande sonore d’extraits vidéo
            fournis par ses utilisateurs. Ces extraits peuvent relever du droit
            d’auteur. Chaque utilisateur reste responsable des contenus qu’il
            importe et de l’usage qu’il en fait.
          </p>
          <p>
            L’usage prévu est strictement privé et non diffusé, dans le cercle de
            famille ou d’amis. Toute rediffusion publique d’un contenu produit ici
            sortirait de ce cadre et relèverait de la seule responsabilité de son
            auteur.
          </p>
          <p>
            Pour signaler un contenu, écrivez à l’adresse ci-dessus : il sera
            supprimé sans délai.
          </p>
        </LegalSection>

        <LegalSection title="Propriété intellectuelle du service">
          <p>
            Le code, l’interface et les éléments graphiques de {APP_NAME} sont la
            propriété de leur auteur. Les enregistrements réalisés par les
            participants leur appartiennent.
          </p>
        </LegalSection>

        <p className="text-sm">
          Voir aussi la{' '}
          <Link href="/confidentialite">politique de confidentialité</Link>.
        </p>
      </LegalShell>
      <div className="mx-auto w-full max-w-3xl">
        <Footer />
      </div>
    </>
  );
}
