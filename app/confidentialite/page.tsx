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
      </LegalSection>

      <LegalSection title="Ce qui n’est pas fait">
        <p>
          Aucun traçage, aucun cookie publicitaire, aucune mesure d’audience, aucun
          profilage. Les seuls cookies déposés sont ceux qui maintiennent votre session
          ouverte. Rien n’est revendu ni partagé avec un tiers à des fins commerciales.
        </p>
      </LegalSection>

      <LegalSection title="Combien de temps">
        <p>
          La vidéo source et les pistes audio séparées sont supprimées automatiquement
          dès qu’un rendu a été produit et vérifié. Vos enregistrements le sont au même
          moment.
        </p>
        <p>
          Une exception : si l’hôte choisit de conserver une scène préparée pour la
          rejouer, sa vidéo, ses pistes séparées et son découpage sont gardés. Les
          enregistrements de voix, eux, ne le sont jamais.
        </p>
        <p>
          Le rendu final est conservé jusqu’à suppression manuelle par l’hôte. Supprimer
          une scène efface le rendu, les prises et les métadonnées, sans retour
          possible.
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
          (hébergement de l’application, États-Unis), ElevenLabs (transcription des
          dialogues, États-Unis). La transcription porte sur la piste de voix de la
          scène importée, jamais sur vos enregistrements.
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
