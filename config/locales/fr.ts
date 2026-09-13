/**
 * Le dictionnaire francais, langue de reference.
 *
 * C'est lui qui donne le type `Dictionary` : toute autre langue doit en
 * fournir exactement les memes cles, et le compilateur le verifie. Une
 * traduction incomplete ne passe donc pas la compilation, ce qui vaut
 * mieux qu'une phrase francaise surgissant au milieu d'une page anglaise.
 */

export const fr = {
  nav: {
    home: 'Accueil',
    homeShort: 'Accueil',
    sessions: 'Mes scènes',
    sessionsShort: 'Scènes',
    community: 'Communauté',
    communityShort: 'Communauté',
    myPacks: 'Mes packs',
    myPacksShort: 'Mes packs',
  },

  account: {
    title: 'Mon compte',
    subtitle:
      'Ton pseudo et ta photo te suivent dans toutes les scènes. Les autres joueurs voient les deux.',
    menuLabel: 'Mon compte et déconnexion',
    menuHint: 'Pseudo, photo, accès',
    photo: 'Photo de profil',
    photoAdd: 'Ajouter une photo',
    photoChange: 'Changer la photo',
    photoRemove: 'Retirer',
    photoHelp: 'PNG, JPEG ou WebP, 2 Mo maximum. Elle est visible des autres invités.',
    displayName: 'Pseudo',
    displayNameHelp:
      'C’est le nom que les autres lisent dans le lobby et sur le générique du rendu.',
    saved: 'C’est enregistré.',
    accessTitle: 'Mon accès',
    email: 'Adresse e-mail',
    method: 'Connexion par',
    methodEmail: 'Lien e-mail',
    since: 'Membre depuis',
    emailLocked:
      'L’adresse ne se change pas ici : c’est elle qui figure sur la liste des invités. Écris à l’éditeur pour la faire modifier.',
  },

  myPacks: {
    title: 'Mes packs',
    subtitle:
      'Les scènes que tu as publiées. Tout le monde peut les rejouer, et toi seul peux les retirer.',
    sceneCount: (n: number) => (n === 1 ? '1 scène publiée' : `${n} scènes publiées`),
    emptyTitle: 'Tu n’as encore rien publié',
    emptyBody:
      'À la fin d’une scène importée par lien, tu peux la publier : le lien et le découpage rejoignent la communauté, sans la vidéo.',
  },

  home: {
    heroTitle: 'Redoublez vos scènes préférées',
    heroBody:
      'Vous choisissez une scène, chacun prend un personnage, et vous l’enregistrez chacun de votre côté. La musique et l’ambiance d’origine restent en place : seules les voix changent. Le résultat se découvre à la fin, tous ensemble.',
    kicker: 'Le studio de doublage entre amis',
    cta: 'Entrer dans le studio',
    ctaSessions: 'Voir mes scènes',
    ctaCommunity: 'Parcourir les scènes prêtes',
    howTitle: 'Comment ça marche',
    reassure1: 'Sans installation',
    reassure2: 'Chacun enregistre quand il veut',
    reassure3: 'Rien n’est publié',

    valueTitle: 'Ce que ça donne',
    value1: {
      title: 'Ta voix à la place de la leur',
      body: 'Tu enregistres au micro de ton casque, chez toi. La musique et les bruitages d’origine restent intacts : on ne remplace que les voix.',
    },
    value2: {
      title: 'Personne n’entend rien avant la fin',
      body: 'Tes prises sont inaudibles des autres tant que le rendu n’a pas été produit. La découverte à la fin, tous ensemble, c’est tout le jeu.',
    },
    value3: {
      title: 'Un MP4 qui se garde',
      body: 'À la fin, un fichier qui se lit partout, sans sous-titres incrustés. La scène source, elle, est effacée.',
    },

    midCta: 'Choisis une scène, distribue les rôles, et vois ce que ça donne.',

    packsCtaTitle: 'Tu n’as encore publié aucun pack',
    packsCtaBody:
      'Une scène importée par lien peut être partagée à la communauté : le lien et le découpage suffisent, la vidéo n’est pas hébergée. Les autres n’ont plus qu’à choisir leurs rôles.',
    packsCtaAction: 'Préparer une scène',

    faqTitle: 'Les questions qu’on nous pose',
    seoTitle: 'Doubler une scène de film entre amis',
    defineTitle: 'Qu’est-ce que le doublage d’une scène de film ?',
    defineBody:
      'Doubler une scène de film, c’est remplacer les voix d’origine par les siennes en gardant tout le reste : l’image, la musique, les bruitages, le rythme. Le résultat n’est pas un commentaire posé par-dessus, c’est la scène elle-même, avec d’autres comédiens. Dub’Up est un logiciel de doublage en ligne qui fait ce travail dans le navigateur, sans rien installer.',
    defineHowTitle: 'Comment doubler une scène de film soi-même',
    defineHowBody:
      'Il faut trois choses que personne n’a chez soi : séparer les voix de la musique pour ne remplacer que les voix, savoir qui parle et quand à la milliseconde, et se synchroniser en parlant. Dub’Up fait les deux premières automatiquement à partir de la scène, et résout la troisième avec une bande rythmo, le texte défilant sous une tête de lecture qu’utilisent les studios de doublage professionnels depuis quatre-vingts ans.',
    defineWhoTitle: 'À qui ça sert',
    defineWhoBody:
      'Aux groupes d’amis qui veulent refaire une réplique culte, aux amateurs de fandub qui cherchent un outil sans montage, aux professeurs de langue qui font doubler un extrait à leur classe, et à ceux qui apprennent le doublage et veulent s’entraîner sur une bande rythmo sans louer un studio.',
    faqExtra: [
      {
        q: 'Est-ce que c’est gratuit ?',
        a: 'Oui. Dub’Up est un projet personnel, sans publicité, sans abonnement et sans limite de scènes.',
      },
      {
        q: 'Quelle différence avec un montage vidéo classique ?',
        a: 'Un logiciel de montage vous donne une timeline vide et vous laisse caler vos prises à la main. Dub’Up part de la scène : il en sépare les voix, repère les répliques, les attribue aux personnages et recale automatiquement vos prises sur la voix d’origine.',
      },
      {
        q: 'Peut-on doubler une scène en anglais depuis le français ?',
        a: 'Oui. La langue de l’interface et celle de la scène sont indépendantes. Le texte transcrit sert de guide de rythme, vous dites ce que vous voulez par-dessus.',
      },
      {
        q: 'Comment les voix sont-elles séparées de la musique ?',
        a: 'Par un modèle de séparation de sources qui tourne sur la machine de l’hôte et rend deux pistes : les voix d’un côté, la musique et l’ambiance de l’autre. Comme la séparation vient de la scène elle-même, elle reste calée à l’image.',
      },
    ] as const,
    faq: [
      {
        q: 'Il me faut quoi, exactement ?',
        a: 'Un casque avec un micro, et un navigateur. Le casque n’est pas un détail : sans lui, ton micro réenregistre la bande-son et le mixage devient inutilisable.',
      },
      {
        q: 'On doit être tous là en même temps ?',
        a: 'Non. Chacun enregistre ses répliques quand il veut. Le rendu se lance quand tout le monde a fini.',
      },
      {
        q: 'Il faut savoir doubler ?',
        a: 'Non. Le texte défile sous une tête de lecture, comme dans un vrai studio : tu lis, et tu tombes juste. Une prise ratée se refait à l’identique.',
      },
      {
        q: 'Combien de temps ça prend ?',
        a: 'Compte quelques minutes de préparation automatique après l’import, puis autant que de répliques à dire. Une scène de deux minutes se double en une demi-heure à trois.',
      },
      {
        q: 'Mes enregistrements sont conservés ?',
        a: 'Non. Ils sont effacés en même temps que la vidéo source, dès que le rendu final est produit.',
      },
      {
        q: 'Je peux inviter qui je veux ?',
        a: 'Seules les adresses ajoutées à la liste des invités peuvent entrer. Tu ajoutes toi-même une adresse depuis ton compte.',
      },
    ] as const,
    privateTitle: 'Un salon privé, pas un réseau',
    privateBody:
      'Dub’Up est réservé aux personnes invitées. Pas de catalogue public, pas de partage hors du cercle, pas d’indexation. C’est ce qui rend l’exercice tenable : on double des extraits d’œuvres protégées, entre amis, sans rien diffuser.',
    slides: {
      importTitle: 'Choisissez la scène que vous connaissez par cœur',
      importBody:
        'Un lien, ou un fichier. Le temps de vous mettre d’accord sur les rôles, la scène est déjà découpée, les voix séparées de la musique, chaque réplique repérée à la milliseconde. Le travail ingrat est fait avant que vous ayez fini de choisir.',
      charactersTitle: 'Distribuez les rôles comme un vrai casting',
      charactersBody:
        'Les personnages sont déjà détectés et nommés. Chacun réclame le sien d’un clic. Celui que personne ne veut garde sa voix d’origine, et le mixage n’y verra que du feu.',
      rythmoTitle: 'Le texte défile, vous n’avez qu’à jouer',
      rythmoBody:
        'Comme dans un vrai studio, les répliques passent sous une tête de lecture. Aucun calage à gérer, aucun montage à apprendre : vous lisez, vous tombez juste. Une prise ratée se refait en deux secondes, autant de fois que vous voulez.',
      renderTitle: 'Et puis vient le moment où vous appuyez sur lecture',
      renderBody:
        'Personne n’a entendu les autres. La scène repart, l’image et la musique d’origine intactes, et ce sont vos voix qui sortent de la bouche des personnages. C’est pour cette minute-là que tout le reste existe.',
    },
  },

  community: {
    title: 'Scènes prêtes à doubler',
    subtitle:
      'Des scènes déjà importées, séparées et découpées par le groupe. Il ne reste qu’à choisir les rôles : pas d’attente, pas de préparation à refaire.',
    play: 'Doubler cette scène',
    preview: 'Aperçu',
    openSource: 'Ouvrir la source',
    kindRecipe: 'Recette',
    kindMedia: 'Fichiers gardés',
    recipeHelp:
      'Cette scène n’est pas hébergée ici : seuls le lien et le découpage sont conservés. La vidéo est retéléchargée au lancement, ce qui prend quelques minutes.',
    mediaHelp: 'Scène hébergée ici : elle démarre immédiatement.',
    mine: 'La tienne',
    voteUp: 'Cette scène est bien découpée',
    voteDown: 'Cette scène est mal découpée',
    voteScore: (n: number) => `Score de la communauté : ${n}`,
    voteHelp:
      'Le vote porte sur le découpage, pas sur le film. Une scène bien découpée fait gagner une soirée à tout le monde.',
    sort: {
      label: 'Trier par',
      popular: 'Les mieux notées',
      recent: 'Les plus récentes',
      short: 'Les plus courtes',
      title: 'Titre (A → Z)',
    },

    filterLang: 'Langue de la scène',
    filterGenre: 'Genre',
    filterCast: 'Nombre de rôles',
    filterLength: 'Durée',
    filterAll: 'Toutes',
    filterAllGenres: 'Tous les genres',
    filterAnyCast: 'Peu importe',
    filterAnyLength: 'Peu importe',
    filterReset: 'Tout afficher',
    filterNoMatch: 'Aucune scène ne correspond',
    filterNoMatchBody:
      'Élargis les critères, ou publie la première scène qui manque au catalogue.',
    langUnknown: 'Langue inconnue',
    langNames: {
      fr: 'Français',
      en: 'Anglais',
      es: 'Espagnol',
      de: 'Allemand',
      it: 'Italien',
      pt: 'Portugais',
      ja: 'Japonais',
      ko: 'Coréen',
      zh: 'Chinois',
      ru: 'Russe',
    } as Record<string, string>,
    genreNames: {
      action: 'Action',
      comedie: 'Comédie',
      drame: 'Drame',
      animation: 'Animation',
      anime: 'Anime',
      serie: 'Série',
      super_heros: 'Super-héros',
      science_fiction: 'Science-fiction',
      horreur: 'Horreur',
      jeu_video: 'Jeu vidéo',
      chanson: 'Chanson',
      documentaire: 'Documentaire',
      autre: 'Autre',
    } as Record<string, string>,
    castBuckets: {
      solo: '1 rôle',
      duo: '2 rôles',
      small: '3 ou 4 rôles',
      large: '5 rôles ou plus',
    } as Record<string, string>,
    lengthBuckets: {
      short: 'Moins d’une minute',
      medium: '1 à 3 minutes',
      long: 'Plus de 3 minutes',
    } as Record<string, string>,
    sceneCount: (n: number) =>
      n === 1 ? '1 scène disponible' : `${n} scènes disponibles`,
    characterCount: (n: number) => (n === 1 ? '1 personnage' : `${n} personnages`),
    lineCount: (n: number) => (n === 1 ? '1 réplique' : `${n} répliques`),
    emptyTitle: 'Aucune scène conservée pour l’instant',
    emptyBody:
      'Pendant une partie, l’hôte peut cocher « garder cette scène » avant de lancer le rendu. Elle atterrira ici, prête à être rejouée par un autre groupe.',
    remove: 'Retirer du catalogue',
    removeTitle: 'Retirer cette scène ?',
    removeBody:
      'La vidéo, les pistes séparées et le découpage seront supprimés. Les scènes déjà lancées à partir d’elle cesseront de fonctionner. C’est irréversible.',
    publish: 'Publier dans la communauté',
    published: 'Cette scène est dans la communauté',
    seeInCommunity: 'Voir dans la communauté',
    publishRecipeHelp:
      'Seuls le lien et le découpage seront partagés. La vidéo n’est pas hébergée ici.',
    publishFromCatalogue:
      'Cette scène vient du catalogue : elle y est déjà. La republier en ferait un doublon que personne ne saurait départager.',
    publishTooLate:
      'Cette scène vient d’un fichier importé, et ses médias ont été purgés après le rendu. Pour la partager, il aurait fallu le décider avant. Une scène importée par lien, elle, reste publiable à tout moment.',
    keepLabel: 'Garder cette scène pour la rejouer',
    keepHelp:
      'Elle rejoindra l’onglet Communauté après le rendu, avec son découpage et ses personnages. Vos enregistrements, eux, ne sont jamais conservés.',
  },

  theme: {
    label: 'Apparence',
    retro: 'Rétro',
    modern: 'Moderne',
  },

  terms: {
    consent: 'J’ai lu et j’accepte les {terms} et la {privacy}.',
    notice: 'En continuant, tu acceptes les {terms} et la {privacy}.',
    linkTerms: 'conditions générales d’utilisation',
    linkPrivacy: 'politique de confidentialité',
    required: 'Il faut accepter les conditions pour continuer.',
    gateTitle: 'Encore une chose',
    gateBody:
      'Avant de commencer, il faut accepter les conditions générales d’utilisation. Une case à cocher et c’est parti.',
    gateGist:
      'L’essentiel : tu réponds toi-même des extraits que tu importes et de ce que tu en fais. Tout reste entre invités, rien n’est publié.',
    gateConfirm: 'Accepter et continuer',
  },

  legal: {
    mentions: 'Mentions légales',
    privacy: 'Confidentialité',
    terms: 'Conditions',
    usageNotice:
      'Usage strictement privé, entre personnes invitées. Aucun contenu n’est diffusé publiquement ni indexé.',
    contact: 'Contact',
    contactEmail: 'ienders.pro@gmail.com',
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
    errorTitle: 'Connexion impossible',
    backToSignIn: 'Revenir à la connexion',
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
      `L’adresse ${email} n’est pas sur la liste des invités. Demande à l’hôte de l’ajouter. Si tu es passé par Discord, c’est l’adresse de ton compte Discord qui compte.`,

    passwordSectionTitle: 'Mot de passe',
    passwordSectionHelp:
      'Définis-en un pour te reconnecter sans passer par ta boîte mail.',
    passwordNew: 'Nouveau mot de passe',
    passwordSave: 'Enregistrer le mot de passe',
    passwordSaved:
      'Mot de passe enregistré. Tu peux l’utiliser dès la prochaine connexion.',
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
    storageUsed: (used: string, total: string) => `${used} sur ${total}`,
    storageWarning:
      'L’espace de stockage arrive à saturation. Supprime d’anciennes scènes pour faire de la place.',
    deleteConfirmTitle: 'Supprimer cette scène ?',
    deleteConfirmBody:
      'Le rendu final, les prises et toutes les métadonnées seront effacés. C’est irréversible.',
    joinByCode: 'Rejoindre avec un code',
    join: 'Rejoindre',
    storageTitle: 'Espace utilisé',
    storageHelp:
      'La vidéo source et les pistes séparées sont effacées dès qu’un rendu est produit : seul le montage final occupe durablement de la place. Supprimer une scène libère la sienne.',
    codePlaceholder: 'ABC234',
    codeNotFound: 'Aucune scène ne correspond à ce code.',
  },

  create: {
    title: 'Nouvelle scène',
    tabUpload: 'Importer un fichier',
    tabYoutube: 'Coller un lien YouTube',
    songLabel: 'C’est une chanson',
    songHelp:
      'On saute la transcription : les paroles, tu les connais. Le découpage suit la voix du morceau et te dit quand entrer.',
    matchTitle: 'Cette scène existe déjà',
    matchBody:
      'Quelqu’un l’a déjà préparée : découpage, personnages et texte sont prêts. La reprendre démarre tout de suite, au lieu d’attendre plusieurs minutes pour le même résultat.',
    matchLines: 'Les répliques à dire',
    matchUse: 'Partir de cette scène',
    matchScratch: 'Refaire depuis zéro',
    tabPack: 'Partir d’un pack',
    packHelp:
      'Rien à préparer : la scène est déjà découpée, vous choisissez les rôles et vous enregistrez. Le catalogue complet est dans l’onglet Communauté.',
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
    keepLabel: 'En faire une scène partagée',
    keepHelpUrl:
      'Elle rejoindra l’onglet Communauté. Comme elle vient d’un lien, seuls le lien et le découpage seront conservés : rien n’est hébergé ici.',
    keepHelpUpload:
      'Seule une scène venue d’un lien peut rejoindre la communauté. Un fichier importé reste privé à ton groupe : on ne réhéberge jamais l’œuvre elle-même.',
    submitUpload: 'Importer et préparer',
    submitYoutube: 'Télécharger et préparer',
    uploading: 'Envoi du fichier…',
  },

  ingest: {
    title: 'Préparation de la scène',
    subtitle: 'On découpe la scène. Ça prend quelques minutes.',
    queued: 'Le traitement tarde à démarrer.',
    queuedHelp:
      'Il repart tout seul d’habitude. Si ça dure, préviens l’hôte de la scène.',
    failed: 'L’import a échoué.',
    retry: 'Relancer l’import',
    neverStarted:
      'L’import n’a jamais démarré : l’envoi du fichier a probablement échoué. Relance-le, ou repars d’une nouvelle scène.',
    hostPreparing:
      'L’hôte met au point les personnages. Le lobby s’ouvrira dans un instant.',
    startOver: 'Nouvelle scène',
  },

  prepare: {
    title: 'Préparer les personnages',
    subtitle:
      'La détection automatique se trompe souvent de personnage. C’est le moment de corriger : après l’ouverture du lobby, ce n’est plus modifiable.',
    charactersHeading: 'Personnages détectés',
    linesHeading: 'Répliques',
    linesOf: (name: string) => `Répliques de ${name}`,
    showAllLines: 'Tout revoir',
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
    assignedTo: 'Attribuée à',
    changeCharacter: 'Changer de personnage',
    selectedCount: (n: number) =>
      n === 1 ? '1 réplique sélectionnée →' : `${n} répliques sélectionnées →`,
    howTitle: 'Vérifie qui dit quoi',
    howBody:
      'Chaque réplique porte le nom du personnage à qui elle est attribuée. Clique ce nom pour la donner à un autre. À gauche, renomme un personnage ou fusionne deux voix que la détection a séparées à tort.',
    selectAll: 'Tout sélectionner',
    selectNone: 'Tout désélectionner',
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
    deletedBadge: 'Supprimée, VO conservée',
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
    startBlockedTitle: 'Il manque encore quelque chose :',
    startBlockedCharacters: 'personnages sans joueur, à prendre ou à laisser en VO :',
    startBlockedReady: 'joueurs qui ne se sont pas déclarés prêts :',
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
    noCharacter:
      'Aucun personnage ne t’a été attribué sur cette scène. Tu peux suivre les autres ici.',
    fxTitle: 'Console de voix',
    fxReset: 'Remettre à plat',
    fxReverb: 'Réverbe',
    fxPitch: 'Hauteur',
    fxTune: 'Justesse',
    fxHelp:
      'Les effets sont posés au mixage, jamais sur l’enregistrement : tu peux les changer jusqu’au rendu, ou revenir à ta voix nue.',
    fxPresets: {
      dry: 'Voix nue',
      room: 'Petite salle',
      cathedral: 'Cathédrale',
      cartoon: 'Dessin animé',
      deep: 'Voix grave',
      cover: 'Reprise',
    },
    emptyTake:
      'Rien n’a été enregistré. Vérifie que ton micro est bien branché et choisi, puis refais la prise.',
    whereEveryoneIs: 'Où en est le groupe',
    you: '(toi)',
    hostTag: '(hôte)',
    stateVo: 'En VO',
    stateDone: 'Fini',
    stateRecording: 'En cours',
    waitingHost: 'On attend que l’hôte lance le rendu.',
    hostCanRender: 'Tout le monde a fini : tu peux lancer le rendu.',
    stillMissing: 'Il reste des répliques à enregistrer.',
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
    micWindow: 'Le micro ne s’ouvre que sur ta réplique.',
    autoAlign: 'Calage automatique',
    autoAlignHelp:
      'Ta prise est comparée à la voix d’origine et repositionnée au bon endroit. Décoche si tu préfères garder ton timing exact.',
    alignedBy: (ms: number) =>
      ms === 0
        ? 'Ta prise tombait déjà juste.'
        : ms > 0
          ? `Tu avais ${ms} ms de retard, c’est rattrapé.`
          : `Tu avais ${-ms} ms d’avance, c’est rattrapé.`,
    alignUnsure:
      'Le calage n’a rien trouvé de net sur cette prise. Elle est posée telle quelle.',
  },

  progress: {
    preparing: 'Préparation de la scène',
    rendering: 'Montage en cours',
    queued: 'En file d’attente. Ça démarre tout seul dans un instant.',
    working:
      'Compte quelques minutes. Tu peux laisser l’onglet ouvert et revenir plus tard.',
    almost: 'Presque fini.',
    longer: 'C’est plus long que d’habitude, mais ça tourne toujours. Laisse faire.',
  },
  render: {
    title: 'Rendu en cours',
    queued: 'Le traitement tarde à démarrer.',
    frozen: 'La scène est figée : les prises ne sont plus modifiables.',
    failed: 'Le rendu a échoué.',
    retry: 'Relancer le rendu',
  },

  result: {
    title: 'Le résultat',
    download: 'Télécharger le MP4',
    exportTitle: 'Emporter la scène',
    formatWide: 'Format large',
    formatWideHint: 'Pour un écran d’ordinateur ou une télévision.',
    formatVertical: 'Format téléphone',
    formatVerticalHint: 'Recadré au centre, pour les stories et les reels.',
    formatVerticalMissing:
      'Cette scène a été rendue avant le recadrage automatique. Relance un rendu pour l’obtenir.',
    share: 'Partager',
    shareHelp:
      'Sur téléphone, « Partager » ouvre la feuille du système : TikTok, Instagram et les autres applications installées y apparaissent.',
    shareUnsupported:
      'Ce navigateur ne sait pas partager un fichier. Télécharge-le, puis publie-le depuis l’application.',
    cast: 'La distribution',
    voiceOriginal: 'VO conservée',
    shareHint: 'Le lien n’est accessible qu’aux participants de cette scène.',
    sourcePurged: 'La source a été supprimée : seul le rendu final est conservé.',
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
