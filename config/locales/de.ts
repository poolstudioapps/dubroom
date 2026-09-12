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
    sceneCount: (n: number) => (n === 1 ? '1 Szene veröffentlicht' : `${n} Szenen veröffentlicht`),
    emptyTitle: 'Du hast noch nichts veröffentlicht',
    emptyBody:
      'Am Ende einer über Link importierten Szene kannst du sie veröffentlichen: Link und Schnitt gehen an die Community, ohne das Video.',
  },

  home: {
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
      body:
        'Du nimmst mit dem Mikrofon deines Headsets auf, zu Hause. Musik und Geräusche des Originals bleiben unangetastet: nur die Stimmen werden ersetzt.',
    },
    value2: {
      title: 'Bis zum Schluss hört niemand etwas',
      body:
        'Deine Aufnahmen bleiben für alle anderen unhörbar, solange es keine fertige Mischung gibt. Sie am Ende gemeinsam zu entdecken, ist das ganze Spiel.',
    },
    value3: {
      title: 'Eine MP4, die bleibt',
      body:
        'Am Ende eine Datei, die überall läuft, ohne eingebrannte Untertitel. Die Quellszene selbst wird gelöscht.',
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
      'Eine Filmszene zu synchronisieren heißt, die Originalstimmen durch die eigenen zu ersetzen und alles andere zu behalten: Bild, Musik, Geräusche, Rhythmus. Das Ergebnis ist kein Kommentar darüber, es ist die Szene selbst, mit anderen Sprechern. DubRoom ist eine Synchronsoftware im Browser, ohne Installation.',
    defineHowTitle: 'Wie man eine Filmszene selbst synchronisiert',
    defineHowBody:
      'Es braucht drei Dinge, die zu Hause niemand hat: die Stimmen von der Musik trennen, damit nur die Stimmen ersetzt werden, auf die Millisekunde wissen, wer wann spricht, und beim Sprechen synchron bleiben. DubRoom erledigt die ersten beiden automatisch aus der Szene und löst das dritte mit einem Laufband, dem unter einem Abspielkopf durchlaufenden Text, den Synchronstudios seit achtzig Jahren benutzen.',
    defineWhoTitle: 'Für wen das ist',
    defineWhoBody:
      'Für Freundesgruppen, die eine berühmte Zeile nachsprechen wollen, für Fandub-Leute, die kein Schnittprogramm suchen, für Sprachlehrer, die eine Klasse einen Ausschnitt synchronisieren lassen, und für alle, die Sprechen lernen und am Laufband üben wollen, ohne ein Studio zu mieten.',
    faqExtra: [
      {
        q: 'Ist das kostenlos?',
        a: 'Ja. DubRoom ist ein privates Projekt, ohne Werbung, ohne Abo und ohne Begrenzung der Szenen.',
      },
      {
        q: 'Was ist der Unterschied zu einem Schnittprogramm?',
        a: 'Ein Schnittprogramm gibt dir eine leere Zeitleiste und lässt dich deine Aufnahmen von Hand ausrichten. DubRoom geht von der Szene aus: es trennt die Stimmen, findet die Sätze, ordnet sie den Figuren zu und rückt deine Aufnahmen automatisch auf die Originalstimme.',
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
    privateTitle: 'Ein privates Wohnzimmer, kein Netzwerk',
    privateBody:
      'DubRoom ist nur für eingeladene Personen. Kein öffentlicher Katalog, kein Teilen außerhalb des Kreises, keine Indexierung. Genau das macht die Sache tragfähig: wir synchronisieren Ausschnitte geschützter Werke, unter Freunden, ohne etwas zu verbreiten.',
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
    sortedByScore: 'Bestbewertete zuerst',
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
      fr: 'Französisch', en: 'Englisch', es: 'Spanisch', de: 'Deutsch', it: 'Italienisch',
      pt: 'Portugiesisch', ja: 'Japanisch', ko: 'Koreanisch', zh: 'Chinesisch', ru: 'Russisch',
    } as Record<string, string>,
    genreNames: {
      action: 'Action', comedie: 'Komödie', drame: 'Drama', animation: 'Animation',
      science_fiction: 'Science-Fiction', horreur: 'Horror', documentaire: 'Dokumentation',
      autre: 'Sonstiges',
    } as Record<string, string>,
    castBuckets: {
      solo: '1 Rolle', duo: '2 Rollen', small: '3 oder 4 Rollen', large: '5 Rollen oder mehr',
    } as Record<string, string>,
    lengthBuckets: {
      short: 'Unter einer Minute', medium: '1 bis 3 Minuten', long: 'Über 3 Minuten',
    } as Record<string, string>,
    sceneCount: (n: number) => (n === 1 ? '1 Szene verfügbar' : `${n} Szenen verfügbar`),
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
    publishTooLate:
      'Diese Szene kam aus einer importierten Datei, und ihre Medien wurden nach der Ausgabe gelöscht. Das Teilen hätte vorher entschieden werden müssen. Eine über Link importierte Szene bleibt dagegen jederzeit veröffentlichbar.',
    keepLabel: 'Diese Szene zum Wiederspielen behalten',
    keepHelp:
      'Sie kommt nach der Ausgabe in den Reiter Community, mit Schnitt und Figuren. Eure Aufnahmen werden nie aufbewahrt.',
  },

  theme: {
    label: 'Aussehen',
    retro: 'Retro',
    modern: 'Modern',
  },

  legal: {
    mentions: 'Impressum',
    privacy: 'Datenschutz',
    usageNotice:
      'Streng private Nutzung, unter eingeladenen Personen. Kein Inhalt wird öffentlich verbreitet oder indexiert.',
    contact: 'Kontakt',
    contactEmail: 'ienders.pro@gmail.com',
  },

  common: {
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
    passwordSaved: 'Passwort gespeichert. Du kannst es ab der nächsten Anmeldung verwenden.',
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
    tabUpload: 'Datei importieren',
    tabYoutube: 'YouTube-Link einfügen',
    tabPack: 'Mit einem Pack starten',
    packHelp:
      'Nichts vorzubereiten: die Szene ist schon geschnitten, ihr wählt die Rollen und nehmt auf. Der ganze Katalog steht im Reiter Community.',
    titleLabel: 'Titel der Szene',
    titlePlaceholder: 'Das Duell auf der Brücke',
    dropzone: 'Zieh deine MP4 hierher, oder klicke, um sie zu wählen',
    fileTooLarge: 'Datei zu groß: höchstens 2 GB.',
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
      'Sie kommt nach der Ausgabe in den Reiter Community. Da sie aus einer Datei stammt, werden Video und getrennte Spuren gespeichert, rund zehn Megabyte.',
    submitUpload: 'Importieren und vorbereiten',
    submitYoutube: 'Herunterladen und vorbereiten',
    uploading: 'Datei wird hochgeladen…',
  },

  ingest: {
    title: 'Szene wird vorbereitet',
    subtitle: 'Die Szene wird zerlegt. Das dauert ein paar Minuten.',
    queued: 'Warte auf den Worker. Starte das Skript auf deinem PC.',
    queuedHelp:
      'Die Verarbeitung läuft auf dem Rechner des Gastgebers. Doppelklick auf start.bat, dann holt sich der Auftrag selbst ab.',
    failed: 'Der Import ist fehlgeschlagen.',
    retry: 'Import neu starten',
    neverStarted:
      'Der Import ist nie gestartet: vermutlich ist das Hochladen der Datei fehlgeschlagen. Starte ihn neu, oder fang mit einer neuen Szene an.',
    hostPreparing:
      'Der Gastgeber sortiert gerade die Figuren. Die Lobby öffnet gleich.',
    startOver: 'Neue Szene',
  },

  prepare: {
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
    startBlockedCharacters: 'Figuren ohne Spieler, zu nehmen oder im Original zu lassen:',
    startBlockedReady: 'Spieler, die sich nicht bereit gemeldet haben:',
    clipCount: (n: number) => (n === 1 ? '1 Clip' : `${n} Clips`),
    hostOnly: 'Nur der Gastgeber kann die Partie starten.',
  },

  studio: {
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
    queued: 'In der Warteschlange. Es startet gleich von selbst.',
    working:
      'Rechne mit ein paar Minuten. Du kannst den Tab offen lassen und später zurückkommen.',
    almost: 'Fast fertig.',
    longer:
      'Es dauert länger als sonst, läuft aber weiter. Lass es zu Ende laufen.',
  },
  render: {
    title: 'Ausgabe läuft',
    queued: 'Warte auf den Worker. Starte das Skript auf deinem PC.',
    frozen: 'Die Szene ist eingefroren: Aufnahmen lassen sich nicht mehr ändern.',
    failed: 'Die Ausgabe ist fehlgeschlagen.',
    retry: 'Ausgabe neu starten',
  },

  result: {
    title: 'Das Ergebnis',
    download: 'MP4 herunterladen',
    cast: 'Die Besetzung',
    voiceOriginal: 'Original bleibt',
    shareHint: 'Der Link funktioniert nur für die Beteiligten dieser Szene.',
    sourcePurged:
      'Die Quelle wurde gelöscht: nur die fertige Mischung bleibt.',
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
