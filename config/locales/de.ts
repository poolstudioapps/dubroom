/**
 * Deutsches Wörterbuch.
 *
 * Spiegelt `fr` Schlüssel für Schlüssel; der Compiler prüft das.
 * Geduzt, wie im Original: es ist ein Spiel unter Freunden.
 */

import type { Dictionary } from '../i18n';

export const de = {
  nav: {
    home: 'Start',
    homeShort: 'Start',
    sessions: 'Meine Szenen',
    sessionsShort: 'Szenen',
    community: 'Community',
    communityShort: 'Community',
    myPacks: 'Meine Packs',
    myPacksShort: 'Meine Packs',
    guides: 'Anleitungen',
    guidesShort: 'Hilfe',
    create: 'Erstellen',
    join: 'Beitreten',
    joinHelp: 'Gib den sechsstelligen Code ein, den dir der Gastgeber gegeben hat.',
  },

  account: {
    title: 'Mein Konto',
    subtitle:
      'Dein Name und dein Bild begleiten dich in jede Szene. Die anderen sehen beides.',
    menuLabel: 'Mein Konto und abmelden',
    menuHint: 'Name, Bild, Zugang',
    photo: 'Profilbild',
    photoAdd: 'Bild hinzufügen',
    photoChange: 'Bild ändern',
    photoRemove: 'Entfernen',
    photoHelp: 'PNG, JPEG oder WebP, höchstens 2 MB. Andere Gäste sehen es.',
    displayName: 'Anzeigename',
    displayNameHelp:
      'Diesen Namen lesen die anderen in der Lobby und im Abspann des Ergebnisses.',
    saved: 'Gespeichert.',
    accessTitle: 'Mein Zugang',
    email: 'E-Mail-Adresse',
    method: 'Anmeldung über',
    methodEmail: 'E-Mail-Link',
    since: 'Dabei seit',
    emailLocked:
      'Die Adresse lässt sich hier nicht ändern: sie steht auf der Gästeliste. Schreib dem Betreiber, um sie zu ändern.',
  },

  myPacks: {
    title: 'Meine Packs',
    subtitle:
      'Die Szenen, die du veröffentlicht hast. Alle können sie spielen, und nur du kannst sie zurückziehen.',
    sceneCount: (n: number) =>
      n === 1 ? '1 Szene veröffentlicht' : `${n} Szenen veröffentlicht`,
    emptyTitle: 'Du hast noch nichts veröffentlicht',
    emptyBody:
      'Am Ende einer über Link importierten Szene kannst du sie veröffentlichen: Link und Schnitt gehen an die Community, ohne das Video.',
  },

  home: {
    youDub: 'du sprichst',
    demoLines: [
      { name: 'Alba', text: 'Bist du sicher, dass das die richtige Tür ist?' },
      { name: 'Rem', text: 'Überhaupt nicht.' },
      { name: 'Noor', text: 'Wir gehen trotzdem rein.' },
    ],
    carouselLabel: 'So funktioniert es',
    rythmoLabel: 'Vorschau des Rhythmusbands: Der Text läuft beim Synchronisieren unter einem Abspielkopf durch.',
    heroTitle: 'Synchronisiert eure Lieblingsszenen neu',
    heroBody:
      'Ihr wählt eine Szene, jeder nimmt sich eine Figur, und ihr nehmt für euch allein auf. Musik und Atmosphäre des Originals bleiben stehen: nur die Stimmen ändern sich. Das Ergebnis entdeckt ihr am Ende, gemeinsam.',
    kicker: 'Das Synchronstudio unter Freunden',
    cta: 'Ins Studio',
    ctaSessions: 'Meine Szenen ansehen',
    ctaCommunity: 'Fertige Szenen durchsehen',
    howTitle: 'So läuft es ab',
    reassure1: 'Nichts zu installieren',
    reassure2: 'Jeder nimmt auf, wann er will',
    reassure3: 'Nichts wird veröffentlicht',

    valueTitle: 'Was dabei herauskommt',
    value1: {
      title: 'Deine Stimme statt ihrer',
      body: 'Du nimmst mit dem Mikrofon deines Headsets auf, zu Hause. Musik und Geräusche des Originals bleiben unangetastet: nur die Stimmen werden ersetzt.',
    },
    value2: {
      title: 'Bis zum Schluss hört niemand etwas',
      body: 'Deine Aufnahmen bleiben für alle anderen unhörbar, solange es keine fertige Mischung gibt. Sie am Ende gemeinsam zu entdecken, ist das ganze Spiel.',
    },
    value3: {
      title: 'Eine MP4, die bleibt',
      body: 'Am Ende eine Datei, die überall läuft, ohne eingebrannte Untertitel. Die Quellszene selbst wird gelöscht.',
    },

    midCta: 'Szene aussuchen, Rollen verteilen, und schauen, was dabei herauskommt.',

    packsCtaTitle: 'Du hast noch kein Pack veröffentlicht',
    packsCtaBody:
      'Eine über Link importierte Szene lässt sich mit der Community teilen: Link und Schnitt genügen, das Video wird nicht gehostet. Die anderen müssen nur noch ihre Rollen wählen.',
    packsCtaAction: 'Eine Szene vorbereiten',

    faqTitle: 'Was man uns fragt',
    seoTitle: 'Eine Filmszene unter Freunden synchronisieren',
    defineTitle: 'Was heißt eine Filmszene synchronisieren?',
    defineBody:
      'Eine Filmszene zu synchronisieren heißt, die Originalstimmen durch die eigenen zu ersetzen und alles andere zu behalten: Bild, Musik, Geräusche, Rhythmus. Das Ergebnis ist kein Kommentar darüber, es ist die Szene selbst, mit anderen Sprechern. Dub’Up ist eine Synchronsoftware im Browser, ohne Installation.',
    defineHowTitle: 'Wie man eine Filmszene selbst synchronisiert',
    defineHowBody:
      'Es braucht drei Dinge, die zu Hause niemand hat: die Stimmen von der Musik trennen, damit nur die Stimmen ersetzt werden, auf die Millisekunde wissen, wer wann spricht, und beim Sprechen synchron bleiben. Dub’Up erledigt die ersten beiden automatisch aus der Szene und löst das dritte mit einem Laufband, dem unter einem Abspielkopf durchlaufenden Text, den Synchronstudios seit achtzig Jahren benutzen.',
    defineWhoTitle: 'Für wen das ist',
    defineWhoBody:
      'Für Freundesgruppen, die eine berühmte Zeile nachsprechen wollen, für Fandub-Leute, die kein Schnittprogramm suchen, für Sprachlehrer, die eine Klasse einen Ausschnitt synchronisieren lassen, und für alle, die Sprechen lernen und am Laufband üben wollen, ohne ein Studio zu mieten.',
    faqExtra: [
      {
        q: 'Ist das kostenlos?',
        a: 'Ja. Dub’Up ist ein privates Projekt, ohne Werbung, ohne Abo und ohne Begrenzung der Szenen.',
      },
      {
        q: 'Was ist der Unterschied zu einem Schnittprogramm?',
        a: 'Ein Schnittprogramm gibt dir eine leere Zeitleiste und lässt dich deine Aufnahmen von Hand ausrichten. Dub’Up geht von der Szene aus: es trennt die Stimmen, findet die Sätze, ordnet sie den Figuren zu und rückt deine Aufnahmen automatisch auf die Originalstimme.',
      },
      {
        q: 'Kann ich eine englische Szene aus einer deutschen Oberfläche synchronisieren?',
        a: 'Ja. Sprache der Oberfläche und Sprache der Szene sind unabhängig. Der transkribierte Text ist eine Zeitvorgabe, sprechen kannst du darüber, was du willst.',
      },
      {
        q: 'Wie werden Stimmen von der Musik getrennt?',
        a: 'Durch ein Quellentrennungsmodell auf der Rechnermaschine des Gastgebers, das zwei Spuren liefert: die Stimmen auf der einen, Musik und Atmosphäre auf der anderen. Da die Trennung aus der Szene selbst stammt, bleibt sie bildgenau.',
      },
    ] as const,
    faq: [
      {
        q: 'Was brauche ich genau?',
        a: 'Ein Headset mit Mikrofon und einen Browser. Das Headset ist keine Nebensache: ohne es nimmt dein Mikrofon den Ton noch einmal mit auf, und die Mischung ist unbrauchbar.',
      },
      {
        q: 'Müssen wir alle gleichzeitig da sein?',
        a: 'Nein. Jeder nimmt seine Sätze auf, wann er will. Die Ausgabe startet, sobald alle fertig sind.',
      },
      {
        q: 'Muss ich synchronisieren können?',
        a: 'Nein. Der Text läuft unter einem Abspielkopf durch, wie in einem echten Studio: du liest, und du triffst. Eine misslungene Aufnahme wiederholst du genauso.',
      },
      {
        q: 'Wie lange dauert das?',
        a: 'Rechne mit ein paar Minuten automatischer Vorbereitung nach dem Import, danach so lange, wie Sätze zu sprechen sind. Eine Szene von zwei Minuten ist zu dritt in einer halben Stunde synchronisiert.',
      },
      {
        q: 'Werden meine Aufnahmen aufbewahrt?',
        a: 'Nein. Sie werden zusammen mit dem Quellvideo gelöscht, sobald die fertige Mischung vorliegt.',
      },
      {
        q: 'Kann ich einladen, wen ich will?',
        a: 'Hinein kommen nur Adressen, die auf der Gästeliste stehen. Eine Adresse trägst du selbst in deinem Konto ein.',
      },
    ] as const,
    slides: {
      importTitle: 'Nehmt die Szene, die ihr auswendig könnt',
      importBody:
        'Ein Link oder eine Datei. Bis ihr euch über die Rollen einig seid, ist die Szene längst zerlegt, die Stimmen von der Musik getrennt, jeder Satz auf die Millisekunde festgenagelt. Die undankbare Arbeit ist erledigt, bevor ihr fertig ausgewählt habt.',
      charactersTitle: 'Verteilt die Rollen wie bei einem echten Casting',
      charactersBody:
        'Die Figuren sind schon erkannt und benannt. Jeder schnappt sich seine mit einem Klick. Was niemand will, behält die Originalstimme, und im Mix fällt es nicht auf.',
      rythmoTitle: 'Der Text läuft durch, ihr spielt einfach',
      rythmoBody:
        'Wie in einem echten Studio ziehen die Sätze unter einem Abspielkopf vorbei. Nichts auszurichten, kein Schnittprogramm zu lernen: du liest, und du triffst. Eine misslungene Aufnahme ist in zwei Sekunden wiederholt, so oft du willst.',
      renderTitle: 'Und dann kommt der Moment, in dem ihr auf Play drückt',
      renderBody:
        'Keiner hat die anderen gehört. Die Szene läuft noch einmal, Bild und Musik unangetastet, und aus den Mündern der Figuren kommen eure Stimmen. Für diese eine Minute ist alles andere da.',
    },
  },

  community: {
    title: 'Szenen, bereit zum Synchronisieren',
    subtitle:
      'Szenen, die die Gruppe schon importiert, getrennt und geschnitten hat. Es bleibt nur die Rollenwahl: kein Warten, keine Vorbereitung noch einmal.',
    play: 'Diese Szene synchronisieren',
    preview: 'Vorschau',
    openSource: 'Quelle öffnen',
    kindRecipe: 'Rezept',
    kindMedia: 'Dateien behalten',
    recipeHelp:
      'Diese Szene liegt nicht hier: nur Link und Schnitt sind gespeichert. Das Video wird beim Start neu geladen, was ein paar Minuten dauert.',
    mediaHelp: 'Szene liegt hier: sie startet sofort.',
    mine: 'Deine',
    voteUp: 'Diese Szene ist gut geschnitten',
    voteDown: 'Diese Szene ist schlecht geschnitten',
    voteScore: (n: number) => `Bewertung der Community: ${n}`,
    voteHelp:
      'Bewertet wird der Schnitt, nicht der Film. Eine gut geschnittene Szene erspart allen einen Abend.',
    sort: {
      label: 'Sortieren nach',
      popular: 'Bestbewertet',
      recent: 'Neueste',
      short: 'Kürzeste',
      title: 'Titel (A → Z)',
    },
    filterLang: 'Sprache der Szene',
    filterGenre: 'Genre',
    filterCast: 'Anzahl Rollen',
    filterLength: 'Länge',
    filterAll: 'Alle',
    filterAllGenres: 'Alle Genres',
    filterAnyCast: 'Egal',
    filterAnyLength: 'Egal',
    filterReset: 'Alles anzeigen',
    filterNoMatch: 'Keine Szene passt',
    filterNoMatchBody:
      'Mach die Auswahl breiter, oder veröffentliche die Szene, die dem Katalog fehlt.',
    langUnknown: 'Sprache unbekannt',
    langNames: {
      fr: 'Französisch',
      en: 'Englisch',
      es: 'Spanisch',
      de: 'Deutsch',
      it: 'Italienisch',
      pt: 'Portugiesisch',
      ja: 'Japanisch',
      ko: 'Koreanisch',
      zh: 'Chinesisch',
      ru: 'Russisch',
    } as Record<string, string>,
    genreNames: {
      action: 'Action',
      comedie: 'Komödie',
      drame: 'Drama',
      animation: 'Animation',
      anime: 'Anime',
      serie: 'Serie',
      super_heros: 'Superhelden',
      science_fiction: 'Science-Fiction',
      horreur: 'Horror',
      jeu_video: 'Videospiel',
      chanson: 'Lied',
      documentaire: 'Dokumentation',
      autre: 'Sonstiges',
    } as Record<string, string>,
    castBuckets: {
      solo: '1 Rolle',
      duo: '2 Rollen',
      small: '3 oder 4 Rollen',
      large: '5 Rollen oder mehr',
    } as Record<string, string>,
    lengthBuckets: {
      short: 'Unter einer Minute',
      medium: '1 bis 3 Minuten',
      long: 'Über 3 Minuten',
    } as Record<string, string>,
    sceneCount: (n: number) =>
      n === 1 ? '1 Szene verfügbar' : `${n} Szenen verfügbar`,
    characterCount: (n: number) => (n === 1 ? '1 Figur' : `${n} Figuren`),
    lineCount: (n: number) => (n === 1 ? '1 Satz' : `${n} Sätze`),
    emptyTitle: 'Noch keine Szene aufbewahrt',
    emptyBody:
      'Während einer Partie kann der Gastgeber „diese Szene behalten“ ankreuzen, bevor er die Ausgabe startet. Sie landet dann hier, bereit für eine andere Gruppe.',
    remove: 'Aus dem Katalog nehmen',
    removeTitle: 'Diese Szene entfernen?',
    removeBody:
      'Video, getrennte Spuren und Schnitt werden gelöscht. Szenen, die schon daraus gestartet wurden, hören auf zu funktionieren. Das lässt sich nicht rückgängig machen.',
    publish: 'In der Community veröffentlichen',
    published: 'Diese Szene ist in der Community',
    seeInCommunity: 'In der Community ansehen',
    publishRecipeHelp:
      'Geteilt werden nur Link und Schnitt. Das Video liegt nicht hier.',
    publishFromCatalogue:
      'Diese Szene kommt aus dem Katalog, sie steht also schon drin. Ein zweites Mal veröffentlicht gäbe es zwei Fassungen, die niemand auseinanderhält.',
    publishTooLate:
      'Diese Szene kam aus einer importierten Datei, und ihre Medien wurden nach der Ausgabe gelöscht. Das Teilen hätte vorher entschieden werden müssen. Eine über Link importierte Szene bleibt dagegen jederzeit veröffentlichbar.',
    keepLabel: 'Diese Szene zum Wiederspielen behalten',
    keepHelp:
      'Sie kommt nach der Ausgabe in den Reiter Community, mit Schnitt und Figuren. Eure Aufnahmen werden nie aufbewahrt.',
  },

  theme: {
    cinema: 'Kino',
    label: 'Aussehen',
    retro: 'Retro',
    modern: 'Modern',
  },

  terms: {
    consent: 'Ich habe die {terms} und die {privacy} gelesen und akzeptiere sie.',
    notice: 'Wenn du fortfährst, akzeptierst du die {terms} und die {privacy}.',
    linkTerms: 'Nutzungsbedingungen',
    linkPrivacy: 'Datenschutzerklärung',
    required: 'Ohne Zustimmung geht es nicht weiter.',
    gateTitle: 'Noch eine Sache',
    gateBody:
      'Bevor es losgeht, musst du die Nutzungsbedingungen akzeptieren. Ein Häkchen und weiter geht’s.',
    gateGist:
      'Kurz gesagt: Du stehst selbst für die Ausschnitte ein, die du hochlädst, und für das, was du damit machst. Alles bleibt unter Eingeladenen, nichts wird veröffentlicht.',
    gateConfirm: 'Akzeptieren und weiter',
  },

  legal: {
    mentions: 'Impressum',
    privacy: 'Datenschutz',
    terms: 'Nutzungsbedingungen',
    usageNotice:
      'Streng private Nutzung, unter eingeladenen Personen. Kein Inhalt wird öffentlich verbreitet oder indexiert.',
    contact: 'Kontakt',
    contactEmail: 'ienders.pro@gmail.com',
  },

  status: {
    draft: 'Entwurf',
    ingest_queued: 'In Warteschlange',
    ingesting: 'Wird importiert',
    ingest_failed: 'Import fehlgeschlagen',
    prepping: 'Vorzubereiten',
    lobby: 'Lobby offen',
    recording: 'Aufnahme',
    render_queued: 'Rendern in Warteschlange',
    rendering: 'Wird gerendert',
    render_failed: 'Rendern fehlgeschlagen',
    done: 'Fertig',
  },

  common: {
    untitled: 'Szene ohne Titel',
    stepTitled: (n: number, titre: string) => `Schritt ${n}: ${titre}`,
    scrollPause: 'Diashow anhalten',
    scrollResume: 'Diashow fortsetzen',
    step: (n: number, total: number) => `Schritt ${n} von ${total}`,
    loading: 'Lädt…',
    save: 'Speichern',
    cancel: 'Abbrechen',
    confirm: 'Bestätigen',
    delete: 'Löschen',
    back: 'Zurück',
    retry: 'Erneut versuchen',
    close: 'Schließen',
    copy: 'Kopieren',
    copied: 'Kopiert',
    unknownError: 'Etwas Unerwartetes ist schiefgegangen.',
  },

  auth: {
    linkExpired: 'Dieser Link ist abgelaufen oder wurde bereits verwendet. Anmeldelinks gelten eine Stunde und nur einmal. Fordere einen neuen an.',
    linkUsed: 'Dieser Link ist abgelaufen oder wurde bereits verwendet. Fordere einen neuen an.',
    linkIncomplete: 'Dieser Link ist unvollständig. Fordere einen neuen an.',
    title: 'Anmelden',
    subtitle: 'Wir schicken dir einen Link, du klickst, fertig.',
    emailLabel: 'Deine E-Mail-Adresse',
    emailPlaceholder: 'name@beispiel.de',
    send: 'Link schicken',
    sending: 'Wird gesendet…',
    sent: 'Link verschickt. Schau in dein Postfach.',
    notAllowed:
      'Diese Adresse steht nicht auf der Gästeliste. Bitte den Gastgeber, dich einzutragen.',
    errorTitle: 'Anmeldung nicht möglich',
    backToSignIn: 'Zurück zur Anmeldung',
    signOut: 'Abmelden',

    signIn: 'Anmelden',
    passwordLabel: 'Dein Passwort',
    badCredentials: 'Adresse oder Passwort falsch.',
    rateLimited:
      'Zu viele Links in dieser Stunde angefordert. Bitte den Gastgeber, dir direkt einen zu schicken, oder melde dich mit deinem Passwort an.',
    switchToPassword: 'Ich habe ein Passwort und melde mich direkt an',
    switchToLink: 'Ich habe kein Passwort, schickt mir einen Link',
    inviteOnly: 'Der Zugang ist eingeladenen Adressen vorbehalten.',
    discord: 'Weiter mit Discord',
    orSeparator: 'oder per E-Mail',
    notAllowedWith: (email: string) =>
      `Die Adresse ${email} steht nicht auf der Gästeliste. Bitte den Gastgeber, sie einzutragen. Wenn du über Discord gekommen bist, zählt die Adresse deines Discord-Kontos.`,

    passwordSectionTitle: 'Passwort',
    passwordSectionHelp:
      'Lege eines fest, um ohne Umweg über dein Postfach zurückzukommen.',
    passwordNew: 'Neues Passwort',
    passwordSave: 'Passwort speichern',
    passwordSaved:
      'Passwort gespeichert. Du kannst es ab der nächsten Anmeldung verwenden.',
    passwordTooShort: 'Mindestens acht Zeichen.',
  },

  guests: {
    title: 'Gäste',
    help: 'Nur diese Adressen kommen hinein. Bei Discord zählt die Adresse des Discord-Kontos, und das ist nicht immer die gewohnte.',
    add: 'Einladen',
    joined: 'War schon da',
    pending: 'War noch nie da',
    remove: 'Von der Liste nehmen',
  },

  sessions: {
    joinTitle: 'Der Szene beitreten',
    joinCode: 'Code',
    title: 'Meine Szenen',
    empty: 'Noch keine Szene. Importiere eine, um anzufangen.',
    create: 'Neue Szene',
    open: 'Öffnen',
    storageUsed: (used: string, total: string) => `${used} von ${total}`,
    storageWarning:
      'Der Speicher wird knapp. Lösche alte Szenen, um Platz zu schaffen.',
    deleteConfirmTitle: 'Diese Szene löschen?',
    deleteConfirmBody:
      'Die fertige Mischung, die Aufnahmen und alle Metadaten werden gelöscht. Das lässt sich nicht rückgängig machen.',
    joinByCode: 'Mit Code beitreten',
    join: 'Beitreten',
    storageTitle: 'Belegter Speicher',
    storageHelp:
      'Quellvideo und getrennte Spuren werden gelöscht, sobald eine Ausgabe vorliegt: dauerhaft Platz belegt nur das fertige Ergebnis. Eine Szene zu löschen gibt ihren Platz frei.',
    codePlaceholder: 'ABC234',
    codeNotFound: 'Zu diesem Code gibt es keine Szene.',
  },

  create: {
    title: 'Neue Szene',
    tabUpload: 'Video importieren',
    tabYoutube: 'YouTube-Link einfügen',
    songLabel: 'Das ist ein Lied',
    songHelp:
      'Wir überspringen die Transkription: den Text kennst du. Der Schnitt folgt der Gesangsspur und sagt dir, wann du einsetzt.',
    matchTitle: 'Diese Szene gibt es schon',
    matchBody:
      'Jemand hat sie bereits vorbereitet: Schnitt, Rollen und Text sind fertig. Sie zu übernehmen geht sofort, statt mehrere Minuten auf dasselbe Ergebnis zu warten.',
    matchLines: 'Die Sätze zum Sprechen',
    matchUse: 'Diese Szene übernehmen',
    matchScratch: 'Von vorn aufbauen',
    tabPack: 'Mit einer fertigen Szene starten',
    packHelp:
      'Nichts vorzubereiten: die Szene ist schon geschnitten, ihr wählt die Rollen und nehmt auf. Der ganze Katalog steht im Reiter Community.',
    titleLabel: 'Titel der Szene',
    titlePlaceholder: 'Das Duell auf der Brücke',
    dropzone: 'Zieh deine MP4 hierher, oder klicke, um sie zu wählen',
    fileTooLarge: 'Datei zu groß: höchstens 50 MB.',
    wrongType: 'Es braucht eine Videodatei (am besten MP4).',
    youtubeLabel: 'Link zum Video',
    youtubePlaceholder: 'https://www.youtube.com/watch?v=…',
    youtubeWarning:
      'Der YouTube-Download ist eine Bequemlichkeit, keine Garantie: er fällt regelmäßig aus. Wenn es nicht klappt, importiere die Datei direkt.',
    multiTrackWarning:
      'Hat deine Quelle mehrere Tonspuren (synchronisiert, Original, Kommentar), wird die erste synchronisiert.',
    durationWarning: 'Die Szene muss unter 10 Minuten bleiben.',
    keepLabel: 'Als geteilte Szene anlegen',
    keepHelpUrl:
      'Sie kommt in den Reiter Community. Da sie aus einem Link stammt, werden nur Link und Schnitt gespeichert: hier liegt nichts.',
    keepHelpUpload:
      'Nur Szenen aus einem Link können in die Community. Eine importierte Datei bleibt in deiner Gruppe privat: Wir hosten das Werk selbst niemals erneut.',
    submitUpload: 'Importieren und vorbereiten',
    submitYoutube: 'Herunterladen und vorbereiten',
    uploading: 'Datei wird hochgeladen…',
    subtitle: 'Zwei Wege zum Start: Importiere dein Video für eine ganz neue Szene, oder übernimm eine Szene, die die Gruppe schon vorbereitet hat.',
    introUpload: 'Eine neue Szene, von Grund auf aus deinem Video vorbereitet.',
    introPack: 'Figuren und Sätze stehen schon: Du bringst das Video mit, und die Lobby öffnet sich in etwa zwei Minuten.',
    introYoutube: 'Nur für Administratoren: Das Video lädt der Worker auf dem PC des Gastgebers herunter, der laufen muss.',
    limits: 'MP4 · höchstens 50 MB und 10 Minuten',
    uploadStepsTitle: 'So läuft es ab',
    uploadSteps: [
      'Du wählst dein Video aus und gibst ihm einen Titel.',
      'Wir bereiten alles online vor: Ton, Stimmen, Dialoge. Zwei bis drei Minuten.',
      'Du prüfst die Figuren und lädst dann deine Freunde in die Lobby ein.',
    ],
    adminBadge: 'Admin',
  },

  ingest: {
    title: 'Szene wird vorbereitet',
    subtitle: 'Die Szene wird zerlegt. Das dauert ein paar Minuten.',
    queued:
      'Warten auf den Worker.',
    queuedHelp:
      'Die Szene startet, sobald der Worker auf dem PC des Gastgebers läuft: Starte start.bat.',
    failed: 'Der Import ist fehlgeschlagen.',
    retry: 'Import neu starten',
    neverStarted:
      'Der Import ist nie gestartet: vermutlich ist das Hochladen der Datei fehlgeschlagen. Starte ihn neu, oder fang mit einer neuen Szene an.',
    hostPreparing:
      'Der Gastgeber sortiert gerade die Figuren. Die Lobby öffnet gleich.',
    startOver: 'Neue Szene',
  },

  prepare: {
    selectCharacter: (nom: string) => `${nom} auswählen`,
    selectLine: (code: string) => `Zeile bei ${code} auswählen`,
    listen: 'Anhören',
    lineText: 'Text der Zeile',
    title: 'Figuren vorbereiten',
    subtitle:
      'Die automatische Erkennung verwechselt oft die Figur. Jetzt ist der Moment zu korrigieren: sobald die Lobby offen ist, geht nichts mehr.',
    charactersHeading: 'Erkannte Figuren',
    linesHeading: 'Sätze',
    linesOf: (name: string) => `Sätze von ${name}`,
    showAllLines: 'Alles zeigen',
    lineCount: (n: number) => (n === 1 ? '1 Satz' : `${n} Sätze`),
    speakTime: 'Sprechzeit',
    playLongest: 'Längsten Ausschnitt anhören',
    rename: 'Umbenennen',
    merge: 'Zusammenführen',
    mergeInto: (name: string) => `Zu ${name} zusammenführen`,
    mergeHint: 'Wähle mindestens zwei Figuren aus, um sie zusammenzuführen.',
    mergeConfirm: (from: string, to: string) =>
      `Alle Sätze von ${from} gehen an ${to}. ${from} wird gelöscht.`,
    splitToNew: 'Zu einer neuen Figur verschieben',
    reassign: 'Neu zuordnen zu…',
    assignedTo: 'Zugeordnet zu',
    changeCharacter: 'Figur wechseln',
    selectedCount: (n: number) =>
      n === 1 ? '1 Satz ausgewählt →' : `${n} Sätze ausgewählt →`,
    howTitle: 'Prüfe, wer was sagt',
    howBody:
      'Jeder Satz trägt den Namen der Figur, zu der er gehört. Klicke auf diesen Namen, um ihn einer anderen zu geben. Links benennst du eine Figur um oder führst zwei Stimmen zusammen, die die Erkennung fälschlich getrennt hat.',
    selectAll: 'Alles auswählen',
    selectNone: 'Auswahl aufheben',
    deleteLine: 'Satz löschen',
    deleteLineHint: 'Der Originalton bleibt an dieser Stelle erhalten.',
    textIsAGuide:
      'Der Text ist nur eine Zeitvorgabe. Korrigiere ihn nur, wenn er unlesbar ist.',
    openLobby: 'Lobby öffnen',
    openLobbyConfirm:
      'Sobald die Lobby offen ist, lassen sich Figuren und Sätze nicht mehr ändern.',
    lockedAfterLobby: 'Die Vorbereitung ist gesperrt, seit die Lobby offen ist.',
    recalculating: 'Clips werden neu berechnet…',
    noSelection: 'Wähle Sätze aus, um sie zu verschieben.',
    restoreLine: 'Satz wiederherstellen',
    deletedBadge: 'Gelöscht, Originalton bleibt',
  },

  lobby: {
    hostTag: '(Gastgeber)',
    title: 'Lobby',
    shareLink: 'Link zum Teilen',
    shareCode: 'Code der Szene',
    watchOriginal: 'Szene im Original ansehen',
    characters: 'Figuren',
    takeCharacter: 'Diese Figur nehmen',
    dropCharacter: 'Diese Figur abgeben',
    releaseCharacter: 'Im Original lassen',
    unrelease: 'Wieder freigeben',
    releasedBadge: 'Original bleibt',
    takenBy: (name: string) => `Genommen von ${name}`,
    free: 'Frei',
    ready: 'Ich bin bereit',
    notReady: 'Ich bin nicht mehr bereit',
    readyBadge: 'Bereit',
    waitingBadge: 'Wartet',
    players: 'Spieler',
    start: 'Partie starten',
    startBlockedTitle: 'Es fehlt noch etwas:',
    startBlockedCharacters:
      'Figuren ohne Spieler, zu nehmen oder im Original zu lassen:',
    startBlockedReady: 'Spieler, die sich nicht bereit gemeldet haben:',
    clipCount: (n: number) => (n === 1 ? '1 Clip' : `${n} Clips`),
    hostOnly: 'Nur der Gastgeber kann die Partie starten.',
  },

  studio: {
    fxNoTake: 'Nimm diese Zeile zuerst auf: Danach werden die Effekte auf die Aufnahme angewendet.',
    playBlocked: 'Der Browser hat die Wiedergabe blockiert. Tippe erneut auf die Schaltfläche.',
    reassign: (nom: string) => `${nom} neu zuweisen`,
    pickPlayer: 'Spieler auswählen…',
    title: 'Studio',
    clipProgress: (current: number, total: number) => `Clip ${current} / ${total}`,
    playOriginal: 'Szene abspielen (Original)',
    record: 'Aufnehmen',
    stop: 'Stopp',
    playTake: 'Meine Aufnahme',
    redo: 'Wiederholen',
    validate: 'Behalten und weiter',
    finish: 'Ich bin fertig',
    takeSaved: 'Aufnahme gespeichert.',
    backToClips: 'Zurück zu meinen Clips',
    allTakesSaved:
      'Alle deine Aufnahmen sind gespeichert. Du kannst die Seite schließen: der Gastgeber startet die Ausgabe, wenn alle fertig sind. Solange sie nicht läuft, kannst du auch noch eine wiederholen.',
    validated: 'Behalten',
    previous: 'Zurück',
    next: 'Weiter',
    backingVolume: 'Hintergrund',
    micOffset: 'Mikrofon-Versatz',
    micOffsetHelp:
      'Wenn deine Aufnahmen immer zu spät sitzen, senke diesen Wert. Er wird beim Mischen angewendet.',
    calibrate: 'Automatisch kalibrieren',
    calibrating: 'Kalibrierung… bleib still.',
    calibrationDone: (ms: number) => `Gemessener Versatz: ${ms} ms.`,
    calibrationFailed:
      'Der Versatz ließ sich nicht messen. Stelle ihn bei Bedarf von Hand ein.',
    micDenied:
      'Der Browser hat das Mikrofon abgelehnt. Erlaube es und lade die Seite neu.',
    headphonesRequired:
      'Kopfhörer sind Pflicht. Beim Aufnehmen hörst du nur die Musik, nie die Originalstimmen.',
    overflowWarning:
      'Deine Aufnahme läuft über das Fenster hinaus, das Ende wird abgeschnitten. Mach sie kürzer.',
    speechZone: 'Sprechbereich',
    margin: 'Rand',
    noTake: 'Keine Aufnahme für diesen Clip.',
    uploading: 'Aufnahme wird hochgeladen…',
    noCharacter:
      'Dir wurde in dieser Szene keine Rolle zugeteilt. Hier kannst du den anderen zusehen.',
    fxTitle: 'Stimmpult',
    fxReset: 'Alles zurück',
    fxReverb: 'Hall',
    fxPitch: 'Tonhöhe',
    fxTune: 'Stimmung',
    fxHelp:
      'Die Effekte gelten nur für die angezeigte Aufnahme. Sie werden beim Mischen hinzugefügt, nie in der Aufnahme selbst: Du kannst sie bis zum Rendern ändern oder entfernen.',
    fxPresets: {
      dry: 'Nackte Stimme',
      room: 'Kleiner Raum',
      cathedral: 'Kathedrale',
      cartoon: 'Zeichentrick',
      deep: 'Tiefe Stimme',
      cover: 'Coverversion',
    },
    emptyTake:
      'Es wurde nichts aufgenommen. Prüfe, ob dein Mikrofon angeschlossen und ausgewählt ist, und nimm noch einmal auf.',
    whereEveryoneIs: 'Wo alle stehen',
    you: '(du)',
    hostTag: '(Gastgeber)',
    stateVo: 'Original',
    stateDone: 'Fertig',
    stateRecording: 'Nimmt auf',
    waitingHost: 'Wir warten darauf, dass der Gastgeber das Rendern startet.',
    hostCanRender: 'Alle sind fertig: du kannst das Rendern starten.',
    stillMissing: 'Es fehlen noch Aufnahmen.',
    finishedTitle: 'Du bist fertig!',
    finishedBody:
      'Solange die Ausgabe nicht läuft, kannst du zurückkommen und eine Aufnahme wiederholen.',
    waitingFor: 'Es fehlen noch:',
    playerProgress: (name: string, done: number, total: number) =>
      `${name} (${done}/${total})`,
    everyoneDone: 'Alle sind fertig. Der Gastgeber kann die Ausgabe starten.',
    othersDone: 'Die anderen sind fertig. Es fehlst nur noch du.',
    soloScene: 'Du bist allein in dieser Szene.',
    soloHint: 'Alle Figuren gehören dir: auf niemanden zu warten.',
    launchRender: 'Ausgabe starten',
    renderBlocked: 'Es gibt noch Clips ohne Aufnahme.',
    kick: 'Diesen Spieler entfernen',
    kickConfirm: (name: string) =>
      `${name} wird entfernt und seine Figuren gehen zurück auf den Originalton. Seine Aufnahmen werden ignoriert.`,
    reassignInstead: 'Seine Figur jemand anderem zuordnen',
    kicked: 'Der Gastgeber hat dich aus dieser Szene entfernt.',
    myClips: 'Meine Clips',
    youAreDubbing: 'Du sprichst',
    cueIn: 'Du bist dran in',
    cueNow: 'DU BIST DRAN',
    cueDone: 'Satz vorbei',
    cueIdle: 'Bereit',
    originalTrace: 'Die farbige Spur zeigt, wann die Originalstimme spricht.',
    micWindow: 'Das Mikrofon öffnet sich nur für deinen Satz.',
    autoAlign: 'Automatische Ausrichtung',
    autoAlignHelp:
      'Deine Aufnahme wird mit der Originalstimme verglichen und an die richtige Stelle gerückt. Schalte es ab, wenn du dein genaues Timing behalten willst.',
    alignedBy: (ms: number) =>
      ms === 0
        ? 'Deine Aufnahme saß schon richtig.'
        : ms > 0
          ? `Du warst ${ms} ms zu spät, das ist korrigiert.`
          : `Du warst ${-ms} ms zu früh, das ist korrigiert.`,
    alignUnsure:
      'Die Ausrichtung hat bei dieser Aufnahme nichts Eindeutiges gefunden. Sie bleibt, wie sie ist.',
  },

  progress: {
    preparing: 'Szene wird vorbereitet',
    rendering: 'Wird zusammengesetzt',
    queued:
      'In der Warteschlange: Die Verarbeitung beginnt gleich.',
    working:
      'Rechne mit ein paar Minuten. Du kannst den Tab offen lassen und später zurückkommen.',
    almost: 'Fast fertig.',
    longer: 'Es dauert länger als sonst, läuft aber weiter. Lass es zu Ende laufen.',
    phases: {
      upload: 'Video wird hochgeladen',
      queued: 'Verarbeitung startet',
      download: 'Video wird geholt',
      encode: 'Bild wird vorbereitet',
      extract: 'Audioverarbeitung',
      separate: 'Stimmen und Musik werden getrennt',
      transcribe: 'Dialoge werden zerlegt',
      segment: 'Sätze werden den Figuren zugeordnet',
      renderQueued: 'Schnitt startet',
      fetch: 'Aufnahmen werden geholt',
      mix: 'Stimmen werden gemischt',
      mux: 'Video wird geschnitten',
      uploadRender: 'Ergebnis wird hochgeladen',
      purge: 'Abschluss',
    },
  },
  render: {
    title: 'Ausgabe läuft',
    queued:
      'Warten auf den Worker.',
    frozen: 'Die Szene ist eingefroren: Aufnahmen lassen sich nicht mehr ändern.',
    failed: 'Die Ausgabe ist fehlgeschlagen.',
    retry: 'Ausgabe neu starten',
  },

  result: {
    title: 'Das Ergebnis',
    download: 'MP4 herunterladen',
    exportTitle: 'Die Szene mitnehmen',
    formatWide: 'Breitformat',
    formatWideHint: 'Für einen Computerbildschirm oder Fernseher.',
    formatVertical: 'Hochformat',
    formatVerticalHint: 'Mittig zugeschnitten, für Stories und Reels.',
    formatVerticalMissing:
      'Diese Szene wurde vor dem automatischen Zuschnitt gerendert. Starte das Rendern erneut.',
    share: 'Teilen',
    shareHelp:
      'Auf dem Handy öffnet Teilen das Systemmenü: TikTok, Instagram und alles andere Installierte stehen dort.',
    shareUnsupported:
      'Dieser Browser kann keine Datei teilen. Lade sie herunter und poste sie aus der App.',
    cast: 'Die Besetzung',
    voiceOriginal: 'Original bleibt',
    shareHint: 'Der Link funktioniert nur für die Beteiligten dieser Szene.',
    sourcePurged: 'Die Quelle wurde gelöscht: nur die fertige Mischung bleibt.',
    expiresIn: (m: string) => `Dieses Video wird in ${m} gelöscht. Lade es jetzt herunter, wenn du es behalten willst.`,
    expiresSoon: 'Dieses Video wird gleich gelöscht. Lade es jetzt herunter, wenn du es behalten willst.',
    expiredTitle: 'Das Video wurde gelöscht',
    expiredBody: 'Fertige Szenen werden eine Stunde nach dem Schnitt gelöscht: Auf unseren Servern bleibt nichts. Wer eine Szene behalten will, lädt sie vorher herunter.',
  },

  packStart: {
    intro: 'Diese Szene ist als Link gespeichert: Ihr Video muss neu besorgt werden. Dafür gibt es zwei Wege.',
    recommended: 'Empfohlen',
    fileTitle: 'Video selbst importieren',
    fileBody: 'Besorge dir das YouTube-Video der Szene und lege die Datei hier ab. Alles wird online vorbereitet, in etwa zwei Minuten, ohne den PC des Gastgebers. Text und Figuren des Packs werden unverändert übernommen.',
    openSource: 'Video auf YouTube ansehen',
    howTo: 'Wie komme ich an die Datei?',
    drop: 'Video hier ablegen oder zum Auswählen klicken',
    expected: (d: string) => `Erwartete Länge: ${d} · MP4, höchstens 50 MB`,
    mismatch: (erwartet: string, erhalten: string) => `Diese Datei dauert ${erhalten}, die Szene des Packs ${erwartet}. Ist es nicht genau dasselbe Video, landen die Sätze an der falschen Stelle.`,
    tooLarge: 'Datei zu groß: höchstens 50 MB. Lade das Video in 720p oder 480p herunter.',
    fileSubmit: 'Importieren und synchronisieren',
    or: 'oder',
    autoTitle: 'Automatischer Download',
    autoBody: 'Der PC des Gastgebers lädt das Video von YouTube. Dort muss start.bat laufen.',
    autoSubmit: 'Download starten',
    mediaBody: 'Diese Szene liegt hier: Sie startet sofort.',
    introMember: 'Diese Szene ist als Link gespeichert: Bring ihr Video mit, und alles wird online mit Text und Figuren des Packs vorbereitet.',
  },

  guide: {
    metaTitle: 'Eine Szene mit dem eigenen Video synchronisieren',
    kicker: 'Anleitung',
    heroTitle: 'Synchronisiere eine Katalogszene mit deinem eigenen Video',
    heroBody: 'Katalogszenen speichern nur den YouTube-Link und die Vorbereitung. Um eine zu synchronisieren, braucht es das Video. Am einfachsten: Du besorgst es selbst und importierst es. Vier Schritte, fünf Minuten.',
    ctaPrimary: 'Szene auswählen',
    ctaSecondary: 'Warum dieser Schritt?',
    stepsTitle: 'In vier Schritten',
    steps: [
      {
        title: 'Szene auf YouTube öffnen',
        body: 'Öffne in der Community die gewünschte Szene und folge dem Link „Video auf YouTube ansehen“. Kopiere die Adresse der Seite.',
      },
      {
        title: 'Datei besorgen',
        body: 'Füge die Adresse in ein Download-Tool deiner Wahl ein und speichere das Video als MP4. Wähle 720p, oder 480p, wenn die Datei größer als 50 MB ist.',
      },
      {
        title: 'Länge prüfen',
        body: 'Es muss genau das Video des Packs sein: gleicher Anfang, gleiches Ende. Dub’Up vergleicht die Länge und warnt dich bei Abweichungen.',
      },
      {
        title: 'Importieren und loslegen',
        body: 'Zurück bei der Szene legst du die Datei unter „Video selbst importieren“ ab. Die Vorbereitung läuft online, danach öffnet sich die Lobby.',
      },
    ],
    checklistTitle: 'Vor dem Import',
    checklist: [
      'Derselbe Ausschnitt wie die Szene des Packs, ungeschnitten',
      'Im MP4-Format',
      'Höchstens 50 MB: 720p oder 480p reichen',
      'Höchstens 10 Minuten',
    ],
    whyTitle: 'Warum dieser Schritt?',
    whyBody: 'YouTube lehnt Downloads von Servern ab. Dub’Up kann das Video deshalb nicht für dich holen: Du bringst es mit, und alles andere passiert online.',
    wayFileTitle: 'Du importierst die Datei',
    wayFileBody: 'Funktioniert jederzeit, auch wenn niemand start.bat gestartet hat. Die Vorbereitung läuft online, in etwa zwei Minuten.',
    faqTitle: 'Häufige Fragen',
    faq: [
      {
        q: 'Welches Tool soll ich zum Herunterladen nutzen?',
        a: 'Jedes Tool, das ein YouTube-Video als MP4 speichert. Meide solche, die eine Erweiterung oder unbekannte Software installieren wollen, und lade nur Videos herunter, die du privat nutzen darfst.',
      },
      {
        q: 'Meine Datei ist größer als 50 MB',
        a: 'Lade sie in niedrigerer Qualität herunter: 720p, oder 480p bei einer langen Szene. Das Bild bleibt im Studio scharf, und der Ton leidet nicht.',
      },
      {
        q: 'Die Sätze landen an der falschen Stelle',
        a: 'Das Video ist nicht genau das des Packs: ein zusätzliches Intro, ein abgeschnittenes Ende oder ein anderer Upload. Nimm den Link des Packs und besorge genau dieses.',
      },
      {
        q: 'Das Video ist nicht mehr auf YouTube',
        a: 'Ohne das Originalvideo lässt sich die Szene nicht synchronisieren. Importiere eine andere Fassung als neue Szene: Sie wird von Grund auf vorbereitet.',
      },
    ],
    finalTitle: 'Bereit zum Synchronisieren?',
    finalBody: 'Wähle eine Szene im Katalog, besorge ihr Video, und die Lobby öffnet sich in wenigen Minuten.',
    homeLead: 'Eine Katalogszene lässt sich nicht herunterladen?',
    homeAction: 'Importiere dein eigenes Video',
    createLink: 'Wie komme ich an die Datei eines YouTube-Videos?',
  },

  guideHub: {
    title: 'Anleitungen und Hilfe',
    body: 'Alles, um eine Szene vorzubereiten, sie mit Freunden zu synchronisieren und das Ergebnis zu holen.',
    guidesTitle: 'Die Anleitungen',
    readGuide: 'Anleitung lesen',
    videoGuideSummary: 'Das Video einer Katalogszene besorgen, prüfen, ob es zum Text passt, und importieren.',
    readingTime: '5 Min. Lesezeit',
  },

  admin: {
    title: 'Administratoren',
    help: 'Ein Administrator kann eine Szene aus einem YouTube-Link erstellen: Das Video lädt der Worker auf seinem PC herunter. Andere Mitglieder importieren ihre Videos, die online vorbereitet werden.',
    roleOwner: 'Inhaber',
    roleAdmin: 'Admin',
    roleUser: 'Mitglied',
    promote: 'Zum Admin machen',
    demote: 'Admin entziehen',
    noAccount: 'noch nicht angemeldet',
  },

  errors: {
    notFound: 'Nicht gefunden.',
    forbidden: 'Du hast keinen Zugang zu dieser Szene.',
    sessionLocked: 'Diese Szene lässt sich nicht mehr ändern.',
    hostOnly: 'Das kann nur der Gastgeber.',
    noAudioTrack: 'Diese Datei hat keine Tonspur.',
    noVideoTrack: 'Diese Datei hat kein Video.',
    tooLong: 'Szene zu lang: höchstens 10 Minuten.',
    youtubeFailed:
      'Der YouTube-Download ist fehlgeschlagen. Importiere die Videodatei stattdessen direkt.',
  },
} satisfies Dictionary;
