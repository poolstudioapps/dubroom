/**
 * Toutes les chaines visibles, en francais (PRD §18).
 * Centralisees des la V1 pour ne pas avoir a reprendre l'interface plus tard.
 */

import { INGEST_STEPS, RENDER_STEPS } from './constants';

export const APP_NAME = 'DubRoom';
export const APP_TAGLINE = 'Le studio de doublage entre amis.';

export const t = {
  nav: {
    home: 'Accueil',
    sessions: 'Mes scènes',
    community: 'Communauté',
  },

  home: {
    heroTitle: 'Redoublez vos scènes préférées',
    heroBody:
      'Vous choisissez une scène, chacun prend un personnage, et vous l’enregistrez chacun de votre côté. La musique et l’ambiance d’origine restent en place : seules les voix changent. Le résultat se découvre à la fin, tous ensemble.',
    cta: 'Entrer dans le studio',
    ctaSessions: 'Voir mes scènes',
    ctaCommunity: 'Parcourir les scènes prêtes',
    howTitle: 'Comment ça marche',
    privateTitle: 'Un salon privé, pas un réseau',
    privateBody:
      'DubRoom est réservé aux personnes invitées. Pas de catalogue public, pas de partage hors du cercle, pas d’indexation. C’est ce qui rend l’exercice tenable : on double des extraits d’œuvres protégées, entre amis, sans rien diffuser.',
    slides: {
      importTitle: 'On importe une scène',
      importBody:
        'Un fichier vidéo, ou un lien. La bande-son est séparée en deux : les voix d’un côté, la musique et l’ambiance de l’autre. Cette séparation vient de la scène elle-même, elle est donc calée à l’image au millième de seconde près.',
      charactersTitle: 'On repère les personnages',
      charactersBody:
        'Les répliques sont transcrites et attribuées automatiquement. L’hôte corrige en quelques clics : renommer, fusionner deux voix confondues, réassigner une réplique. Puis il ouvre le lobby et chacun choisit son rôle.',
      rythmoTitle: 'On double à la bande rythmo',
      rythmoBody:
        'Le texte défile sous une tête de lecture, comme dans un vrai studio de doublage. Pendant l’enregistrement vous n’entendez que la musique, jamais les voix d’origine : l’image et le texte suffisent à tomber juste.',
      renderTitle: 'On découvre le résultat',
      renderBody:
        'Tout est remixé : l’image d’origine, la musique d’origine, et vos voix à la place des leurs. Un MP4 qui se lit partout, sans sous-titres incrustés, et qui se garde.',
    },
  },

  community: {
    title: 'Scènes prêtes à doubler',
    subtitle:
      'Des scènes déjà importées, séparées et découpées par le groupe. Il ne reste qu’à choisir les rôles : pas d’attente, pas de préparation à refaire.',
    play: 'Doubler cette scène',
    mine: 'La tienne',
    characterCount: (n: number) => (n === 1 ? '1 personnage' : `${n} personnages`),
    lineCount: (n: number) => (n === 1 ? '1 réplique' : `${n} répliques`),
    emptyTitle: 'Aucune scène conservée pour l’instant',
    emptyBody:
      'Pendant une partie, l’hôte peut cocher « garder cette scène » avant de lancer le rendu. Elle atterrira ici, prête à être rejouée par un autre groupe.',
    remove: 'Retirer du catalogue',
    removeTitle: 'Retirer cette scène ?',
    removeBody:
      'La vidéo, les pistes séparées et le découpage seront supprimés. Les scènes déjà lancées à partir d’elle cesseront de fonctionner. C’est irréversible.',
    keepLabel: 'Garder cette scène pour la rejouer',
    keepHelp:
      'Elle rejoindra l’onglet Communauté après le rendu, avec son découpage et ses personnages. Vos enregistrements, eux, ne sont jamais conservés.',
  },

  legal: {
    mentions: 'Mentions légales',
    privacy: 'Confidentialité',
    usageNotice:
      'Usage strictement privé, entre personnes invitées. Aucun contenu n’est diffusé publiquement ni indexé.',
  },

  common: {
    loading: 'Chargement…',
    save: 'Enregistrer',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    delete: 'Supprimer',
    back: 'Retour',
    retry: 'Réessayer',
    close: 'Fermer',
    copy: 'Copier',
    copied: 'Copié',
    unknownError: 'Une erreur inattendue est survenue.',
  },

  auth: {
    title: 'Connexion',
    subtitle: 'On t’envoie un lien, tu cliques, c’est fini.',
    emailLabel: 'Ton adresse e-mail',
    emailPlaceholder: 'prenom@exemple.fr',
    send: 'Recevoir mon lien',
    sending: 'Envoi…',
    sent: 'Lien envoyé. Va voir ta boîte mail.',
    notAllowed:
      'Cette adresse n’est pas sur la liste des invités. Demande à l’hôte de t’ajouter.',
    signOut: 'Se déconnecter',

    signIn: 'Se connecter',
    passwordLabel: 'Ton mot de passe',
    badCredentials: 'Adresse ou mot de passe incorrect.',
    rateLimited:
      'Trop de liens demandés dans l’heure. Demande à l’hôte de t’en envoyer un directement, ou connecte-toi avec ton mot de passe.',
    switchToPassword: 'J’ai un mot de passe, je me connecte directement',
    switchToLink: 'Je n’ai pas de mot de passe, envoyez-moi un lien',
    inviteOnly: 'L’accès est réservé aux adresses invitées.',
    discord: 'Continuer avec Discord',
    orSeparator: 'ou par e-mail',
    notAllowedWith: (email: string) =>
      `L’adresse ${email} n’est pas sur la liste des invités. Demande à l’hôte de l’ajouter — c’est l’adresse de ton compte Discord si tu es passé par là.`,

    passwordSectionTitle: 'Mot de passe',
    passwordSectionHelp:
      'Définis-en un pour te reconnecter sans passer par ta boîte mail.',
    passwordNew: 'Nouveau mot de passe',
    passwordSave: 'Enregistrer le mot de passe',
    passwordSaved: 'Mot de passe enregistré. Tu peux l’utiliser dès la prochaine connexion.',
    passwordTooShort: 'Huit caractères au minimum.',
  },

  guests: {
    title: 'Les invités',
    help: 'Seules ces adresses peuvent entrer. Pour Discord, c’est l’adresse du compte Discord qui compte, pas forcément celle d’habitude.',
    add: 'Inviter',
    joined: 'Déjà venu',
    pending: 'Jamais venu',
    remove: 'Retirer de la liste',
  },

  sessions: {
    title: 'Mes scènes',
    empty: 'Aucune scène pour l’instant. Importes-en une pour commencer.',
    create: 'Nouvelle scène',
    open: 'Ouvrir',
    storageUsed: (used: string, total: string) => `${used} / ${total} utilisés`,
    storageWarning:
      'L’espace de stockage arrive à saturation. Supprime d’anciennes scènes pour faire de la place.',
    deleteConfirmTitle: 'Supprimer cette scène ?',
    deleteConfirmBody:
      'Le rendu final, les prises et toutes les métadonnées seront effacés. C’est irréversible.',
    joinByCode: 'Rejoindre avec un code',
    codePlaceholder: 'ABC234',
    codeNotFound: 'Aucune scène ne correspond à ce code.',
  },

  create: {
    title: 'Nouvelle scène',
    tabUpload: 'Importer un fichier',
    tabYoutube: 'Coller un lien YouTube',
    titleLabel: 'Titre de la scène',
    titlePlaceholder: 'Le duel du pont',
    dropzone: 'Dépose ton MP4 ici, ou clique pour le choisir',
    fileTooLarge: 'Fichier trop lourd : 2 Go maximum.',
    wrongType: 'Il faut un fichier vidéo (MP4 de préférence).',
    youtubeLabel: 'Lien de la vidéo',
    youtubePlaceholder: 'https://www.youtube.com/watch?v=…',
    youtubeWarning:
      'Le téléchargement YouTube est un confort, pas une garantie : il tombe en panne régulièrement. Si ça échoue, importe le fichier directement.',
    multiTrackWarning:
      'Si ta source contient plusieurs pistes audio (VF, VO, commentaires), c’est la première qui sera doublée.',
    durationWarning: 'La scène doit faire moins de 10 minutes.',
    submitUpload: 'Importer et préparer',
    submitYoutube: 'Télécharger et préparer',
    uploading: 'Envoi du fichier…',
  },

  ingest: {
    title: 'Préparation de la scène',
    subtitle: 'On découpe la scène. Ça prend quelques minutes.',
    queued: 'En attente du worker — lance le script sur ton PC.',
    queuedHelp:
      'Le traitement tourne sur la machine de l’hôte. Double-clique sur start.bat, le job démarrera tout seul.',
    failed: 'L’import a échoué.',
    retry: 'Relancer l’import',
    neverStarted:
      'L’import n’a jamais démarré : l’envoi du fichier a probablement échoué. Relance-le, ou repars d’une nouvelle scène.',
    startOver: 'Nouvelle scène',
    steps: {
      download: 'Récupération de la vidéo',
      encode: 'Normalisation',
      extract: 'Extraction de l’audio',
      separate: 'Séparation des voix et du fond',
      transcribe: 'Transcription et détection des personnages',
      segment: 'Découpage des répliques',
    } satisfies Record<(typeof INGEST_STEPS)[number], string>,
  },

  prepare: {
    title: 'Préparer les personnages',
    subtitle:
      'La détection automatique se trompe parfois. Renomme, fusionne, réassigne, puis ouvre le lobby.',
    charactersHeading: 'Personnages détectés',
    linesHeading: 'Répliques',
    lineCount: (n: number) => (n === 1 ? '1 réplique' : `${n} répliques`),
    speakTime: 'Temps de parole',
    playLongest: 'Écouter l’extrait le plus long',
    rename: 'Renommer',
    merge: 'Fusionner',
    mergeInto: (name: string) => `Fusionner vers ${name}`,
    mergeHint: 'Sélectionne au moins deux personnages pour les fusionner.',
    mergeConfirm: (from: string, to: string) =>
      `Toutes les répliques de ${from} passeront sur ${to}. ${from} sera supprimé.`,
    splitToNew: 'Déplacer vers un nouveau personnage',
    reassign: 'Réassigner à…',
    deleteLine: 'Supprimer la réplique',
    deleteLineHint: 'La VO d’origine sera conservée à cet endroit.',
    textIsAGuide:
      'Le texte n’est qu’un guide de timing. Corrige-le seulement s’il est illisible.',
    openLobby: 'Ouvrir le lobby',
    openLobbyConfirm:
      'Une fois le lobby ouvert, les personnages et les répliques ne sont plus modifiables.',
    lockedAfterLobby: 'La préparation est verrouillée depuis l’ouverture du lobby.',
    recalculating: 'Recalcul des clips…',
    noSelection: 'Sélectionne des répliques pour les déplacer.',
    restoreLine: 'Rétablir la réplique',
    deletedBadge: 'Supprimée — VO conservée',
  },

  lobby: {
    title: 'Lobby',
    shareLink: 'Lien à partager',
    shareCode: 'Code de la scène',
    watchOriginal: 'Voir la scène en VO',
    characters: 'Personnages',
    takeCharacter: 'Prendre ce personnage',
    dropCharacter: 'Laisser ce personnage',
    releaseCharacter: 'Laisser en VO',
    unrelease: 'Rendre disponible',
    releasedBadge: 'VO conservée',
    takenBy: (name: string) => `Pris par ${name}`,
    free: 'Libre',
    ready: 'Je suis prêt',
    notReady: 'Je ne suis plus prêt',
    readyBadge: 'Prêt',
    waitingBadge: 'En attente',
    players: 'Joueurs',
    start: 'Lancer la partie',
    startBlockedCharacters:
      'Chaque personnage doit être pris par un joueur, ou laissé en VO.',
    startBlockedReady: 'Tous les joueurs présents doivent être prêts.',
    clipCount: (n: number) => (n === 1 ? '1 clip' : `${n} clips`),
    hostOnly: 'Seul l’hôte peut lancer la partie.',
  },

  studio: {
    title: 'Studio',
    clipProgress: (current: number, total: number) => `Clip ${current} / ${total}`,
    playOriginal: 'Lire la scène (VO)',
    record: 'Enregistrer',
    stop: 'Arrêter',
    playTake: 'Ma prise',
    redo: 'Refaire',
    validate: 'Valider et suivant',
    finish: 'J’ai terminé',
    takeSaved: 'Prise enregistrée.',
    backToClips: 'Revenir à mes clips',
    allTakesSaved:
      'Toutes tes prises sont enregistrées. Tu peux fermer la page : l’hôte lancera le rendu quand tout le monde aura fini. Tu peux aussi en refaire une tant que le rendu n’est pas lancé.',
    validated: 'Validé',
    previous: 'Précédent',
    next: 'Suivant',
    backingVolume: 'Fond sonore',
    micOffset: 'Décalage micro',
    micOffsetHelp:
      'Si tes prises tombent systématiquement trop tard, descends cette valeur. Elle est appliquée au mixage.',
    calibrate: 'Calibrer automatiquement',
    calibrating: 'Calibrage… reste silencieux.',
    calibrationDone: (ms: number) => `Décalage mesuré : ${ms} ms.`,
    calibrationFailed:
      'Impossible de mesurer le décalage. Règle-le à la main si besoin.',
    micDenied:
      'Le micro est refusé par le navigateur. Autorise-le puis recharge la page.',
    headphonesRequired:
      'Casque obligatoire. Pendant l’enregistrement tu n’entends que la musique, jamais les voix d’origine.',
    overflowWarning:
      'Ta prise dépasse la fenêtre, la fin sera coupée. Refais-la plus court.',
    speechZone: 'Zone de parole',
    margin: 'Marge',
    noTake: 'Aucune prise pour ce clip.',
    uploading: 'Envoi de la prise…',
    finishedTitle: 'Tu as fini !',
    finishedBody:
      'Tu peux encore revenir modifier une prise tant que le rendu n’est pas lancé.',
    waitingFor: 'On attend encore :',
    playerProgress: (name: string, done: number, total: number) =>
      `${name} (${done}/${total})`,
    everyoneDone: 'Tout le monde a fini. L’hôte peut lancer le rendu.',
    othersDone: 'Les autres ont fini. Il ne manque plus que toi.',
    soloScene: 'Tu es seul sur cette scène.',
    soloHint: 'Tous les personnages sont à toi : personne d’autre à attendre.',
    launchRender: 'Lancer le rendu',
    renderBlocked: 'Il reste des clips sans prise validée.',
    kick: 'Exclure ce joueur',
    kickConfirm: (name: string) =>
      `${name} sera exclu et ses personnages repasseront en VO. Ses prises seront ignorées.`,
    reassignInstead: 'Réassigner son personnage à quelqu’un d’autre',
    kicked: 'Tu as été exclu de cette scène par l’hôte.',
    myClips: 'Mes clips',
    youAreDubbing: 'Tu doubles',
    cueIn: 'À toi dans',
    cueNow: 'À TOI',
    cueDone: 'Réplique passée',
    cueIdle: 'Prêt',
    originalTrace: 'Le tracé coloré montre quand la voix d’origine parle.',
  },

  render: {
    title: 'Rendu en cours',
    queued: 'En attente du worker — lance le script sur ton PC.',
    frozen: 'La scène est figée : les prises ne sont plus modifiables.',
    failed: 'Le rendu a échoué.',
    retry: 'Relancer le rendu',
    steps: {
      fetch: 'Récupération des prises',
      mix: 'Mixage audio',
      mux: 'Assemblage de la vidéo',
      upload: 'Envoi du résultat',
      purge: 'Nettoyage de la source',
    } satisfies Record<(typeof RENDER_STEPS)[number], string>,
  },

  result: {
    title: 'Le résultat',
    download: 'Télécharger le MP4',
    cast: 'La distribution',
    voiceOriginal: 'VO conservée',
    shareHint: 'Le lien n’est accessible qu’aux participants de cette scène.',
    sourcePurged:
      'La source a été supprimée : seul le rendu final est conservé.',
  },

  errors: {
    notFound: 'Introuvable.',
    forbidden: 'Tu n’as pas accès à cette scène.',
    sessionLocked: 'Cette scène n’est plus modifiable.',
    hostOnly: 'Seul l’hôte peut faire ça.',
    noAudioTrack: 'Ce fichier ne contient pas de piste audio.',
    noVideoTrack: 'Ce fichier ne contient pas de vidéo.',
    tooLong: 'Scène trop longue : 10 minutes maximum.',
    youtubeFailed:
      'Le téléchargement YouTube a échoué. Importe plutôt le fichier vidéo directement.',
  },
} as const;

/** Formate une duree en ms vers `m:ss`. */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Formate un timecode en ms vers `m:ss.d`. */
export function formatTimecode(ms: number): string {
  const total = Math.max(0, ms);
  const m = Math.floor(total / 60000);
  const s = Math.floor((total % 60000) / 1000);
  const d = Math.floor((total % 1000) / 100);
  return `${m}:${String(s).padStart(2, '0')}.${d}`;
}

/** Formate un poids d'octets en unite lisible. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  const units = ['Ko', 'Mo', 'Go', 'To'];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[i]}`;
}
