import Link from 'next/link';

import { APP_NAME } from '@/config/strings';
import { TERMS_VERSION_LABEL } from '@/config/terms';
import { LegalShell, LegalSection } from '@/components/legal-shell';

export const metadata = {
  robots: { index: true, follow: true },
  title: 'Conditions générales d’utilisation',
  description: `Les règles d’usage de ${APP_NAME} : accès sur invitation, cadre strictement privé, et responsabilité de chacun sur les extraits qu’il importe.`,
};

/**
 * Les conditions generales.
 *
 * Elles disent une seule chose importante, et tout le reste en decoule :
 * l'outil ne fournit aucun contenu. Il travaille ce que la personne lui
 * donne, dans un cercle prive, et c'est elle qui repond de ce qu'elle
 * apporte. Le texte evite donc les formules qui laisseraient croire a un
 * catalogue, a une diffusion ou a une licence accordee par l'editeur.
 *
 * Ecrit en francais et dans cette langue seulement, comme les deux
 * autres pages legales : c'est le droit francais qui s'applique, et une
 * traduction de confort de ces textes-la creerait deux versions dont on
 * ne saurait plus laquelle engage.
 */
export default function ConditionsPage() {
  return (
    <LegalShell title="Conditions générales d’utilisation">
      <p className="text-xs font-bold uppercase tracking-widest text-text-faint">
        Version du {TERMS_VERSION_LABEL}
      </p>

      <LegalSection title="1. Objet">
        <p>
          Les présentes conditions régissent l’utilisation de {APP_NAME}, un service qui
          permet à un petit groupe de personnes de refaire ensemble la bande sonore d’un
          extrait vidéo qu’elles fournissent elles-mêmes.
        </p>
        <p>
          Créer un compte, ou se connecter par lien, par mot de passe ou par Discord,
          vaut acceptation de ces conditions. Qui ne les accepte pas ne peut pas
          utiliser le service.
        </p>
      </LegalSection>

      <LegalSection title="2. Accès sur invitation">
        <p>
          L’accès est réservé aux personnes explicitement invitées par l’éditeur. Il
          n’existe aucune inscription ouverte. L’éditeur peut retirer une invitation à
          tout moment, sans préavis ni justification, notamment en cas de manquement aux
          présentes conditions.
        </p>
        <p>
          Le compte est personnel. Vous êtes responsable de sa confidentialité et de
          tout ce qui est fait depuis celui-ci.
        </p>
      </LegalSection>

      <LegalSection title="3. Contenus importés et droit d’auteur">
        <p>
          <strong className="font-bold text-text">
            Vous êtes seul responsable des extraits que vous importez, du lien que vous
            fournissez, et de l’usage que vous faites du résultat.
          </strong>{' '}
          {APP_NAME} ne fournit, n’héberge à demeure, ni ne met à disposition aucun
          catalogue d’œuvres : le service ne traite que ce que vous lui donnez.
        </p>
        <p>
          En important un fichier ou en fournissant un lien, vous déclarez disposer des
          droits nécessaires, ou agir dans un cadre que la loi autorise. Vous faites
          votre affaire personnelle de toute question de droit d’auteur, de droit
          voisin, de droit à l’image et de droit moral attachée au contenu que vous
          apportez, y compris de toute réclamation, action ou demande d’un ayant droit.
          Vous garantissez l’éditeur contre les conséquences d’une telle réclamation
          dirigée contre lui du fait de votre contenu.
        </p>
        <p>
          Un doublage est une œuvre dérivée : les droits de l’auteur de la scène
          d’origine restent entiers. Ce qui rend l’exercice tenable ici est le caractère
          privé et non diffusé de l’usage, dans le cercle de famille ou d’amis.
        </p>
      </LegalSection>

      <LegalSection title="4. Cadre d’usage privé">
        <p>
          Le service est destiné à un usage strictement privé et non diffusé. Sont
          notamment interdits, et engagent votre seule responsabilité :
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            la publication, la diffusion ou la mise en ligne publique d’un rendu produit
            ici, y compris sur un réseau social ou une plateforme vidéo ;
          </li>
          <li>tout usage commercial, direct ou indirect ;</li>
          <li>
            l’importation de contenus illicites, haineux, diffamatoires, ou représentant
            des personnes mineures de façon inappropriée ;
          </li>
          <li>
            l’importation de l’image ou de la voix d’une personne sans son accord, dès
            lors que le résultat lui serait prêté ;
          </li>
          <li>
            la reproduction de la voix d’une personne réelle dans le but de tromper sur
            son identité ou ses propos.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Vos enregistrements">
        <p>
          Les voix que vous enregistrez sont vos créations, et vous en conservez les
          droits. En participant à une scène, vous autorisez le service à les assembler
          avec celles des autres participants pour produire le rendu de cette scène, et
          à les diffuser aux personnes de cette même scène. Rien d’autre.
        </p>
        <p>
          Vous pouvez demander à tout moment le retrait de vos enregistrements. Les
          modalités et les durées de conservation figurent dans la{' '}
          <Link href="/confidentialite">politique de confidentialité</Link>.
        </p>
      </LegalSection>

      <LegalSection title="6. Scènes partagées avec le groupe">
        <p>
          Une scène conservée dans l’onglet Communauté ne contient aucune copie de
          l’œuvre d’origine : elle ne retient qu’un lien vers la source, les repères de
          temps du découpage et la répartition des personnages. En la publiant, vous
          acceptez que les autres personnes invitées la réutilisent pour jouer. Vous
          restez responsable de la licéité du lien que vous avez fourni.
        </p>
      </LegalSection>

      <LegalSection title="7. Disponibilité et responsabilité de l’éditeur">
        <p>
          {APP_NAME} est un projet personnel, fourni en l’état, sans garantie de
          disponibilité, de continuité ni d’absence d’erreur. Le service peut être
          interrompu, modifié ou arrêté à tout moment. Les traitements audio et vidéo
          s’exécutent sur un service en ligne ou sur l’ordinateur personnel d’un
          administrateur : une scène peut échouer ou attendre.
        </p>
        <p>
          Le rendu d’une scène est supprimé une heure après sa création. L’éditeur ne
          saurait être tenu responsable de la perte d’un enregistrement, d’un rendu ou
          d’une scène. Ce qui compte pour vous doit être téléchargé.
        </p>
      </LegalSection>

      <LegalSection title="8. Signalement">
        <p>
          Pour signaler un contenu ou demander un retrait, écrivez à{' '}
          <a href="mailto:ienders.pro@gmail.com">ienders.pro@gmail.com</a>. Le contenu
          signalé est supprimé sans délai.
        </p>
      </LegalSection>

      <LegalSection title="9. Modification des conditions">
        <p>
          Ces conditions peuvent évoluer. En cas de changement significatif,
          l’acceptation est redemandée à la connexion suivante. La version en vigueur
          est celle affichée sur cette page.
        </p>
      </LegalSection>

      <LegalSection title="10. Droit applicable">
        <p>
          Les présentes conditions sont soumises au droit français. À défaut de
          résolution amiable, le litige relève des juridictions françaises compétentes.
        </p>
      </LegalSection>

      <p className="text-sm">
        Voir aussi les <Link href="/mentions-legales">mentions légales</Link> et la{' '}
        <Link href="/confidentialite">politique de confidentialité</Link>.
      </p>
    </LegalShell>
  );
}
