import Link from 'next/link';

import { APP_NAME } from '@/config/strings';
import { LegalShell, LegalSection } from '@/components/legal-shell';

export const metadata = {
  robots: { index: true, follow: true }, title: `Mentions légales · ${APP_NAME}` };

export default function MentionsPage() {
  return (
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

      <LegalSection title="Ce que produisent les participants">
        <p>
          Les enregistrements de voix réalisés par les participants sont leurs
          créations. Chacun conserve ses droits sur sa propre interprétation et
          reste libre de demander son retrait à tout moment.
        </p>
        <p>
          Les scènes conservées dans l’onglet Communauté ne contiennent aucune
          copie de l’œuvre d’origine. Elles ne retiennent qu’un lien vers la
          source, les repères de temps du découpage et la répartition des
          personnages. Ce travail de préparation est celui de la personne qui
          l’a réalisé.
        </p>
        <p>
          Cela ne retire rien aux droits de l’œuvre doublée. Un doublage est une
          œuvre dérivée : les droits de l’auteur de la scène d’origine restent
          entiers, et ce qui rend l’exercice possible ici est le cadre privé de
          l’usage, sans diffusion ni public. Publier un rendu hors de ce cadre
          sortirait de ce qui est permis, et relèverait de la seule
          responsabilité de son auteur.
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
  );
}
