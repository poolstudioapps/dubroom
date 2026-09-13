import Link from 'next/link';

import { LegalShell, LegalSection } from '@/components/legal-shell';
import { APP_NAME } from '@/config/strings';

export const metadata = {
  robots: { index: true, follow: true },
  title: `Confidentialité · ${APP_NAME}`,
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Confidentialité">
      <LegalSection title="Ce qui est collecté">
        <p>
          Une adresse e-mail, qui sert uniquement à vous identifier et à vérifier que
          vous figurez sur la liste des personnes invitées. Si vous vous connectez par
          Discord, c’est l’adresse de votre compte Discord, et rien d’autre : ni pseudo,
          ni liste de serveurs, ni contacts.
        </p>
        <p>
          Un nom d’affichage, que vous choisissez, visible des autres participants d’une
          même scène.
        </p>
        <p>
          Les fichiers que vous importez, vos enregistrements vocaux, et les métadonnées
          qui en découlent : personnages, répliques, découpage.
        </p>
        <p>
          Si vous publiez une scène ou commentez une scène de la communauté : son titre,
          sa langue, son genre, ses tags, vos commentaires et vos votes, affichés avec
          votre nom d’affichage aux autres personnes invitées.
        </p>
      </LegalSection>

      <LegalSection title="Ce qui n’est pas fait">
        <p>
          Aucun traçage, aucun cookie publicitaire, aucune mesure d’audience, aucun
          profilage. Les seuls cookies déposés sont ceux qui maintiennent votre session
          ouverte. Rien n’est revendu ni partagé avec un tiers à des fins commerciales.
        </p>
      </LegalSection>

      <LegalSection title="La vidéo de l’accueil">
        <p>
          La page d’accueil montre un court extrait de démonstration, sans son, servi par ce
          site. Aucun service tiers n’est contacté pour l’afficher, et aucun cookie n’est
          déposé à cette occasion.
        </p>
      </LegalSection>

      <LegalSection title="Combien de temps">
        <p>
          La vidéo source et les pistes audio séparées sont supprimées automatiquement
          dès qu’un rendu a été produit et vérifié. Vos enregistrements le sont au même
          moment.
        </p>
        <p>
          Le rendu final est lui-même supprimé une heure après sa création. L’écran du
          résultat indique le temps restant : pour garder la scène, il faut la télécharger
          avant. Aucune copie n’est conservée au-delà.
        </p>
        <p>
          Publier une scène dans la communauté n’en garde que le découpage (personnages,
          texte, repères) et, si elle venait d’un lien, ce lien. Ni la vidéo ni les
          enregistrements de voix ne sont conservés.
        </p>
        <p>
          Un salon resté ouvert plus d’une heure est fermé automatiquement. Supprimer une
          scène efface le rendu, les prises et les métadonnées, sans retour possible. Un
          commentaire peut être supprimé à tout moment par son auteur.
        </p>
      </LegalSection>

      <LegalSection title="Qui voit quoi">
        <p>
          Une scène n’est visible que de ses participants. Avant le rendu, vos prises ne
          sont audibles que par vous : personne ne peut écouter ce que vous enregistrez
          tant que le résultat n’a pas été produit. C’est tout l’intérêt du jeu, et
          c’est appliqué par la base de données, pas seulement par l’interface.
        </p>
      </LegalSection>

      <LegalSection title="Sous-traitants">
        <p>
          Supabase (hébergement des données et des fichiers, Irlande), Vercel
          (hébergement de l’application, États-Unis), Google Cloud (traitement audio et
          vidéo des scènes, Belgique), ElevenLabs (transcription des dialogues,
          États-Unis). La transcription porte sur la piste de voix de la scène importée,
          jamais sur vos enregistrements.
        </p>
      </LegalSection>

      <LegalSection title="Vos droits">
        <p>
          Vous pouvez demander l’accès, la rectification ou l’effacement de vos données
          à <a href="mailto:ienders.pro@gmail.com">ienders.pro@gmail.com</a>. La
          suppression d’une scène est immédiate et se fait depuis l’application.
        </p>
      </LegalSection>

      <p className="text-sm">
        Voir aussi les <Link href="/mentions-legales">mentions légales</Link>.
      </p>
    </LegalShell>
  );
}
