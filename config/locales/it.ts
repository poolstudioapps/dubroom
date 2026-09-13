/**
 * Dizionario italiano.
 *
 * Rispecchia `fr` chiave per chiave; il compilatore lo verifica.
 * Si dà del tu, come nell'originale: è un gioco tra amici.
 */

import type { Dictionary } from '../i18n';

export const it = {
  nav: {
    home: 'Home',
    homeShort: 'Home',
    sessions: 'Le mie scene',
    sessionsShort: 'Scene',
    community: 'Community',
    communityShort: 'Community',
    myPacks: 'I miei pack',
    myPacksShort: 'I miei pack',
    guides: 'Guide',
    guidesShort: 'Guide',
    create: 'Crea',
    join: 'Unisciti',
    joinHelp: 'Inserisci il codice di sei caratteri che ti ha dato l’host.',
  },

  account: {
    title: 'Il mio account',
    subtitle:
      'Il tuo nome e la tua foto ti seguono in tutte le scene. Gli altri giocatori vedono entrambi.',
    menuLabel: 'Il mio account e uscita',
    menuHint: 'Nome, foto, accesso',
    photo: 'Foto del profilo',
    photoAdd: 'Aggiungi una foto',
    photoChange: 'Cambia la foto',
    photoRemove: 'Togli',
    photoHelp: 'PNG, JPEG o WebP, 2 MB al massimo. La vedono gli altri invitati.',
    displayName: 'Nome',
    displayNameHelp:
      'È il nome che gli altri leggono nella lobby e nei titoli del risultato.',
    saved: 'Salvato.',
    accessTitle: 'Il mio accesso',
    email: 'Indirizzo email',
    method: 'Entri con',
    methodEmail: 'Link via email',
    since: 'Iscritto dal',
    emailLocked:
      'L’indirizzo non si cambia qui: è quello che figura nella lista degli invitati. Scrivi all’editore per modificarlo.',
  },

  myPacks: {
    title: 'I miei pack',
    subtitle:
      'Le scene che hai pubblicato. Chiunque può rigiocarle, e solo tu puoi ritirarle.',
    sceneCount: (n: number) =>
      n === 1 ? '1 scena pubblicata' : `${n} scene pubblicate`,
    emptyTitle: 'Non hai ancora pubblicato nulla',
    emptyBody:
      'Alla fine di una scena importata da un link puoi pubblicarla: il link e il taglio vanno alla community, senza il video.',
  },

  home: {
    youDub: 'doppi',
    demoLines: [
      { name: 'Alba', text: 'Sei sicuro che sia la porta giusta?' },
      { name: 'Rem', text: 'Per niente.' },
      { name: 'Noor', text: 'Entriamo lo stesso.' },
    ],
    carouselLabel: 'Come funziona',
    rythmoLabel: 'Anteprima della banda ritmica: il testo scorre sotto una testina mentre doppi.',
    heroTitle: 'Ridoppiate le vostre scene preferite',
    heroBody:
      'Scegliete una scena, ognuno prende un personaggio e la registrate ciascuno per conto proprio. La musica e l’ambiente originali restano al loro posto: cambiano solo le voci. Il risultato si scopre alla fine, tutti insieme.',
    kicker: 'Lo studio di doppiaggio tra amici',
    cta: 'Entra nello studio',
    ctaSessions: 'Le mie scene',
    ctaCommunity: 'Sfoglia le scene pronte',
    howTitle: 'Come funziona',
    reassure1: 'Niente da installare',
    reassure2: 'Ognuno registra quando vuole',
    reassure3: 'Niente viene pubblicato',

    valueTitle: 'Cosa ne esce',
    value1: {
      title: 'La tua voce al posto della loro',
      body: 'Registri con il microfono delle tue cuffie, a casa. La musica e i rumori originali restano intatti: si sostituiscono solo le voci.',
    },
    value2: {
      title: 'Nessuno sente niente fino alla fine',
      body: 'Le tue prese restano inudibili agli altri finché non esiste il montaggio finale. Scoprirlo insieme alla fine è tutto il gioco.',
    },
    value3: {
      title: 'Un MP4 che resta',
      body: 'Alla fine, un file che si legge ovunque, senza sottotitoli impressi. La scena di partenza, invece, viene cancellata.',
    },

    midCta: 'Scegli una scena, distribuisci le parti, e guarda cosa ne esce.',

    packsCtaTitle: 'Non hai ancora pubblicato nessun pack',
    packsCtaBody:
      'Una scena importata da un link si può condividere con la community: bastano il link e il taglio, il video non viene ospitato. Agli altri resta solo da scegliere le parti.',
    packsCtaAction: 'Preparare una scena',

    faqTitle: 'Quello che ci chiedono',
    seoTitle: 'Doppiare una scena di film tra amici',
    defineTitle: 'Che cosa vuol dire doppiare una scena di film?',
    defineBody:
      'Doppiare una scena di film vuol dire sostituire le voci originali con le proprie tenendo tutto il resto: l’immagine, la musica, i rumori, il ritmo. Il risultato non è un commento sopra, è la scena stessa con altri attori. Dub’Up è un software di doppiaggio online che fa questo lavoro nel browser, senza installare niente.',
    defineHowTitle: 'Come doppiare una scena di film da soli',
    defineHowBody:
      'Servono tre cose che nessuno ha in casa: separare le voci dalla musica per sostituire solo le voci, sapere chi parla e quando al millesimo, e restare in sincrono mentre si parla. Dub’Up fa le prime due in automatico a partire dalla scena, e risolve la terza con una banda ritmica, il testo che scorre sotto una testina di lettura usata dagli studi di doppiaggio da ottant’anni.',
    defineWhoTitle: 'A chi serve',
    defineWhoBody:
      'A gruppi di amici che vogliono rifare una battuta celebre, agli appassionati di fandub che cercano uno strumento che non sia un programma di montaggio, ai professori di lingue che fanno doppiare un estratto alla classe, e a chi studia doppiaggio e vuole esercitarsi su banda ritmica senza affittare uno studio.',
    faqExtra: [
      {
        q: 'È gratis?',
        a: 'Sì. Dub’Up è un progetto personale, senza pubblicità, senza abbonamento e senza limiti di scene.',
      },
      {
        q: 'Che differenza c’è con un programma di montaggio?',
        a: 'Un programma di montaggio ti dà una timeline vuota e ti lascia allineare le prese a mano. Dub’Up parte dalla scena: separa le voci, trova le battute, le assegna ai personaggi e rimette le tue prese in linea con la voce originale.',
      },
      {
        q: 'Posso doppiare una scena in inglese da un’interfaccia in italiano?',
        a: 'Sì. La lingua dell’interfaccia e quella della scena sono indipendenti. Il testo trascritto serve da guida per i tempi, sopra ci dici quello che vuoi.',
      },
      {
        q: 'Come vengono separate le voci dalla musica?',
        a: 'Con un modello di separazione delle sorgenti che gira sulla macchina dell’ospite e restituisce due tracce: le voci da una parte, musica e ambiente dall’altra. Siccome la separazione viene dalla scena stessa, resta agganciata all’immagine.',
      },
    ] as const,
    faq: [
      {
        q: 'Cosa mi serve, esattamente?',
        a: 'Delle cuffie con microfono e un browser. Le cuffie non sono un dettaglio: senza, il microfono registra di nuovo la colonna sonora e il missaggio diventa inutilizzabile.',
      },
      {
        q: 'Dobbiamo esserci tutti nello stesso momento?',
        a: 'No. Ognuno registra le sue battute quando vuole. Il montaggio parte quando hanno finito tutti.',
      },
      {
        q: 'Bisogna saper doppiare?',
        a: 'No. Il testo scorre sotto una testina di lettura, come in uno studio vero: leggi, e cadi in tempo. Una presa venuta male si rifà identica.',
      },
      {
        q: 'Quanto ci vuole?',
        a: 'Conta qualche minuto di preparazione automatica dopo l’importazione, poi il tempo delle battute da dire. Una scena di due minuti si doppia in mezz’ora in tre.',
      },
      {
        q: 'Le mie registrazioni vengono conservate?',
        a: 'No. Vengono cancellate insieme al video di partenza, appena esiste il montaggio finale.',
      },
      {
        q: 'Posso invitare chi voglio?',
        a: 'Entrano solo gli indirizzi aggiunti alla lista degli invitati. Un indirizzo lo aggiungi tu stesso dal tuo account.',
      },
    ] as const,
    slides: {
      importTitle: 'Scegliete la scena che sapete a memoria',
      importBody:
        'Un link, o un file. Nel tempo che vi mettete d’accordo sulle parti, la scena è già tagliata, le voci separate dalla musica, ogni battuta fissata al millesimo. Il lavoro ingrato è fatto prima che abbiate finito di scegliere.',
      charactersTitle: 'Distribuite le parti come a un vero casting',
      charactersBody:
        'I personaggi sono già individuati e con un nome. Ognuno si prende il suo con un clic. Quello che nessuno vuole tiene la voce originale, e nel missaggio non si sente.',
      rythmoTitle: 'Il testo scorre, a voi tocca solo recitare',
      rythmoBody:
        'Come in uno studio vero, le battute passano sotto una testina di lettura. Niente da sincronizzare, nessun montaggio da imparare: leggi e cadi in tempo. Una presa venuta male si rifà in due secondi, quante volte vuoi.',
      renderTitle: 'E poi arriva il momento in cui premete play',
      renderBody:
        'Nessuno ha sentito gli altri. La scena riparte, immagine e musica originali intatte, e dalla bocca dei personaggi escono le vostre voci. Tutto il resto esiste per quel minuto lì.',
    },
  },

  community: {
    title: 'Scene pronte da doppiare',
    subtitle:
      'Scene già importate, separate e tagliate dal gruppo. Resta solo da scegliere le parti: niente attese, niente preparazione da rifare.',
    play: 'Doppia questa scena',
    preview: 'Anteprima',
    openSource: 'Apri la fonte',
    kindRecipe: 'Ricetta',
    kindMedia: 'File conservati',
    recipeHelp:
      'Questa scena non è ospitata qui: si conservano solo il link e il taglio. Il video viene riscaricato all’avvio, cosa che richiede qualche minuto.',
    mediaHelp: 'Scena ospitata qui: parte subito.',
    mine: 'Tua',
    voteUp: 'Questa scena è tagliata bene',
    voteDown: 'Questa scena è tagliata male',
    voteScore: (n: number) => `Punteggio della community: ${n}`,
    voteHelp:
      'Il voto riguarda il taglio, non il film. Una scena tagliata bene fa risparmiare una serata a tutti.',
    sort: {
      label: 'Ordina per',
      popular: 'Più votate',
      recent: 'Più recenti',
      short: 'Più corte',
      title: 'Titolo (A → Z)',
    },
    filterLang: 'Lingua della scena',
    filterGenre: 'Genere',
    filterCast: 'Numero di ruoli',
    filterLength: 'Durata',
    filterAll: 'Tutte',
    filterAllGenres: 'Tutti i generi',
    filterAnyCast: 'Indifferente',
    filterAnyLength: 'Indifferente',
    filterReset: 'Mostra tutto',
    filterNoMatch: 'Nessuna scena corrisponde',
    filterNoMatchBody:
      'Allarga i criteri, oppure pubblica la scena che manca al catalogo.',
    langUnknown: 'Lingua sconosciuta',
    langNames: {
      fr: 'Francese',
      en: 'Inglese',
      es: 'Spagnolo',
      de: 'Tedesco',
      it: 'Italiano',
      pt: 'Portoghese',
      ja: 'Giapponese',
      ko: 'Coreano',
      zh: 'Cinese',
      ru: 'Russo',
    } as Record<string, string>,
    genreNames: {
      action: 'Azione',
      comedie: 'Commedia',
      drame: 'Dramma',
      animation: 'Animazione',
      anime: 'Anime',
      serie: 'Serie TV',
      super_heros: 'Supereroi',
      science_fiction: 'Fantascienza',
      horreur: 'Horror',
      jeu_video: 'Videogioco',
      chanson: 'Canzone',
      documentaire: 'Documentario',
      autre: 'Altro',
    } as Record<string, string>,
    castBuckets: {
      solo: '1 ruolo',
      duo: '2 ruoli',
      small: '3 o 4 ruoli',
      large: '5 ruoli o più',
    } as Record<string, string>,
    lengthBuckets: {
      short: 'Meno di un minuto',
      medium: 'Da 1 a 3 minuti',
      long: 'Più di 3 minuti',
    } as Record<string, string>,
    sceneCount: (n: number) =>
      n === 1 ? '1 scena disponibile' : `${n} scene disponibili`,
    characterCount: (n: number) => (n === 1 ? '1 personaggio' : `${n} personaggi`),
    lineCount: (n: number) => (n === 1 ? '1 battuta' : `${n} battute`),
    emptyTitle: 'Nessuna scena conservata per ora',
    emptyBody:
      'Durante una partita, l’ospite può spuntare «conserva questa scena» prima di lanciare il montaggio. Finirà qui, pronta per un altro gruppo.',
    remove: 'Togli dal catalogo',
    removeTitle: 'Togliere questa scena?',
    removeBody:
      'Il video, le tracce separate e il taglio verranno cancellati. Le scene già avviate a partire da questa smetteranno di funzionare. Non si torna indietro.',
    publish: 'Pubblica nella community',
    published: 'Questa scena è nella community',
    seeInCommunity: 'Vedila nella community',
    publishRecipeHelp:
      'Si condividono solo il link e il taglio. Il video non è ospitato qui.',
    publishFromCatalogue:
      'Questa scena viene dal catalogo: c’è già. Ripubblicarla lascerebbe due copie che nessuno saprebbe distinguere.',
    publishTooLate:
      'Questa scena veniva da un file importato, e i suoi media sono stati eliminati dopo il montaggio. Condividerla andava deciso prima. Una scena importata da un link, invece, resta pubblicabile in qualsiasi momento.',
    keepLabel: 'Conserva questa scena per rigiocarla',
    keepHelp:
      'Andrà nella scheda Community dopo il montaggio, con il suo taglio e i suoi personaggi. Le vostre registrazioni non vengono mai conservate.',
  },

  theme: {
    cinema: 'Cinema',
    label: 'Aspetto',
    retro: 'Retrò',
    modern: 'Moderno',
  },

  terms: {
    consent: 'Ho letto e accetto le {terms} e la {privacy}.',
    notice: 'Continuando, accetti i {terms} e la {privacy}.',
    linkTerms: 'condizioni d’uso',
    linkPrivacy: 'informativa sulla privacy',
    required: 'Bisogna accettare le condizioni per continuare.',
    gateTitle: 'Ancora una cosa',
    gateBody:
      'Prima di iniziare, devi accettare i termini di utilizzo. Una casella e si parte.',
    gateGist:
      'In breve: rispondi tu degli spezzoni che carichi e di quello che ne fai. Tutto resta tra invitati, niente viene pubblicato.',
    gateConfirm: 'Accetta e continua',
  },

  legal: {
    mentions: 'Note legali',
    privacy: 'Privacy',
    terms: 'Condizioni',
    usageNotice:
      'Uso strettamente privato, tra persone invitate. Nessun contenuto viene diffuso pubblicamente né indicizzato.',
    contact: 'Contatto',
    contactEmail: 'ienders.pro@gmail.com',
  },

  status: {
    draft: 'Bozza',
    ingest_queued: 'In coda',
    ingesting: 'Importazione',
    ingest_failed: 'Importazione fallita',
    prepping: 'Da preparare',
    lobby: 'Lobby aperta',
    recording: 'Registrazione',
    render_queued: 'Montaggio in coda',
    rendering: 'Montaggio',
    render_failed: 'Montaggio fallito',
    done: 'Completata',
  },

  common: {
    untitled: 'Scena senza titolo',
    stepTitled: (n: number, titre: string) => `Passo ${n}: ${titre}`,
    scrollPause: 'Ferma lo scorrimento',
    scrollResume: 'Riprendi lo scorrimento',
    step: (n: number, total: number) => `Passo ${n} di ${total}`,
    loading: 'Caricamento…',
    save: 'Salva',
    cancel: 'Annulla',
    confirm: 'Conferma',
    delete: 'Elimina',
    back: 'Indietro',
    retry: 'Riprova',
    close: 'Chiudi',
    copy: 'Copia',
    copied: 'Copiato',
    unknownError: 'Si è verificato un errore imprevisto.',
  },

  auth: {
    linkExpired: 'Questo link è scaduto o è già stato usato. I link di accesso durano un’ora e valgono una volta sola. Chiedine uno nuovo.',
    linkUsed: 'Questo link è scaduto o è già stato usato. Chiedine uno nuovo.',
    linkIncomplete: 'Questo link è incompleto. Chiedine uno nuovo.',
    title: 'Accedi',
    subtitle: 'Ti mandiamo un link, ci clicchi, finito.',
    emailLabel: 'Il tuo indirizzo email',
    emailPlaceholder: 'nome@esempio.it',
    send: 'Mandami un link',
    sending: 'Invio…',
    sent: 'Link inviato. Controlla la posta.',
    notAllowed:
      'Questo indirizzo non è nella lista degli invitati. Chiedi all’ospite di aggiungerti.',
    errorTitle: 'Accesso impossibile',
    backToSignIn: 'Torna alla schermata di accesso',
    signOut: 'Esci',

    signIn: 'Accedi',
    passwordLabel: 'La tua password',
    badCredentials: 'Indirizzo o password sbagliati.',
    rateLimited:
      'Troppi link richiesti in un’ora. Chiedi all’ospite di mandartene uno direttamente, oppure accedi con la password.',
    switchToPassword: 'Ho una password, accedo direttamente',
    switchToLink: 'Non ho una password, mandatemi un link',
    inviteOnly: 'L’accesso è riservato agli indirizzi invitati.',
    discord: 'Continua con Discord',
    orSeparator: 'oppure via email',
    notAllowedWith: (email: string) =>
      `L’indirizzo ${email} non è nella lista degli invitati. Chiedi all’ospite di aggiungerlo. Se sei passato da Discord, conta l’indirizzo del tuo account Discord.`,

    passwordSectionTitle: 'Password',
    passwordSectionHelp: 'Impostane una per rientrare senza passare dalla posta.',
    passwordNew: 'Nuova password',
    passwordSave: 'Salva la password',
    passwordSaved: 'Password salvata. Puoi usarla dal prossimo accesso.',
    passwordTooShort: 'Almeno otto caratteri.',
  },

  guests: {
    title: 'Invitati',
    help: 'Solo questi indirizzi possono entrare. Per Discord conta l’indirizzo dell’account Discord, che non è sempre quello solito.',
    add: 'Invita',
    joined: 'Già venuto',
    pending: 'Mai venuto',
    remove: 'Togli dalla lista',
  },

  sessions: {
    joinTitle: 'Unisciti alla scena',
    joinCode: 'Codice',
    title: 'Le mie scene',
    empty: 'Nessuna scena per ora. Importane una per cominciare.',
    create: 'Nuova scena',
    open: 'Apri',
    storageUsed: (used: string, total: string) => `${used} su ${total}`,
    storageWarning: 'Lo spazio sta finendo. Elimina vecchie scene per fare posto.',
    deleteConfirmTitle: 'Eliminare questa scena?',
    deleteConfirmBody:
      'Il montaggio finale, le prese e tutti i metadati verranno cancellati. Non si torna indietro.',
    joinByCode: 'Entra con un codice',
    join: 'Entra',
    storageTitle: 'Spazio usato',
    storageHelp:
      'Il video di partenza e le tracce separate vengono cancellati appena esiste un montaggio: solo il risultato finale occupa spazio a lungo. Eliminare una scena libera il suo.',
    codePlaceholder: 'ABC234',
    codeNotFound: 'Nessuna scena corrisponde a questo codice.',
  },

  create: {
    title: 'Nuova scena',
    tabUpload: 'Importa un video',
    tabYoutube: 'Incolla un link YouTube',
    songLabel: 'È una canzone',
    songHelp:
      'Saltiamo la trascrizione: il testo lo sai. Il taglio segue la voce del brano e ti dice quando entrare.',
    matchTitle: 'Questa scena esiste già',
    matchBody:
      'Qualcuno l’ha già preparata: taglio, personaggi e testo sono pronti. Riprenderla parte subito, invece di aspettare qualche minuto per lo stesso risultato.',
    matchLines: 'Le battute da dire',
    matchUse: 'Partire da questa scena',
    matchScratch: 'Rifare da zero',
    tabPack: 'Parti da una scena pronta',
    packHelp:
      'Niente da preparare: la scena è già tagliata, scegliete le parti e registrate. Il catalogo completo è nella scheda Community.',
    titleLabel: 'Titolo della scena',
    titlePlaceholder: 'Il duello sul ponte',
    dropzone: 'Trascina qui il tuo MP4, o clicca per sceglierlo',
    fileTooLarge: 'File troppo pesante: 50 MB al massimo.',
    wrongType: 'Serve un file video (MP4 preferibilmente).',
    youtubeLabel: 'Link del video',
    youtubePlaceholder: 'https://www.youtube.com/watch?v=…',
    youtubeWarning:
      'Il download da YouTube è una comodità, non una garanzia: si guasta di frequente. Se non funziona, importa direttamente il file.',
    multiTrackWarning:
      'Se la tua fonte ha più tracce audio (doppiata, originale, commenti), viene doppiata la prima.',
    durationWarning: 'La scena deve durare meno di 10 minuti.',
    keepLabel: 'Farne una scena condivisa',
    keepHelpUrl:
      'Andrà nella scheda Community. Venendo da un link, si conservano solo il link e il taglio: qui non viene ospitato nulla.',
    keepHelpUpload:
      'Solo le scene create da un link possono entrare nella community. Un file importato resta privato al tuo gruppo: non ospitiamo mai l’opera stessa.',
    submitUpload: 'Importa e prepara',
    submitYoutube: 'Scarica e prepara',
    uploading: 'Invio del file…',
    subtitle: 'Due modi per iniziare: importa il tuo video per una scena nuova, o riprendi una scena che il gruppo ha già preparato.',
    introUpload: 'Una scena nuova, preparata da zero a partire dal tuo video.',
    introPack: 'Personaggi e battute sono già pronti: tu porti il video e la lobby si apre in circa due minuti.',
    introYoutube: 'Solo per gli amministratori: il video viene scaricato dal worker del PC dell’host, che deve essere avviato.',
    limits: 'MP4 · al massimo 50 MB e 10 minuti',
    uploadStepsTitle: 'Come funziona',
    uploadSteps: [
      'Scegli il tuo video e gli dai un titolo.',
      'Prepariamo tutto online: il suono, le voci, i dialoghi. Da due a tre minuti.',
      'Controlli i personaggi, poi inviti gli amici nella lobby.',
    ],
    adminBadge: 'Admin',
  },

  ingest: {
    title: 'Preparazione della scena',
    subtitle: 'Stiamo tagliando la scena. Ci vogliono alcuni minuti.',
    queued:
      'In attesa del worker.',
    queuedHelp:
      'La scena parte appena il worker è attivo sul PC dell’host: avvia start.bat.',
    failed: 'L’importazione è fallita.',
    retry: 'Rilancia l’importazione',
    neverStarted:
      'L’importazione non è mai partita: probabilmente è fallito l’invio del file. Rilanciala, oppure riparti da una scena nuova.',
    hostPreparing: 'L’ospite sta sistemando i personaggi. La lobby si apre tra poco.',
    startOver: 'Nuova scena',
  },

  prepare: {
    selectCharacter: (nom: string) => `Seleziona ${nom}`,
    selectLine: (code: string) => `Seleziona la battuta di ${code}`,
    listen: 'Ascolta',
    lineText: 'Testo della battuta',
    title: 'Preparare i personaggi',
    subtitle:
      'Il riconoscimento automatico sbaglia spesso personaggio. È il momento di correggere: dopo l’apertura della lobby non si cambia più.',
    charactersHeading: 'Personaggi rilevati',
    linesHeading: 'Battute',
    linesOf: (name: string) => `Battute di ${name}`,
    showAllLines: 'Rivedere tutto',
    lineCount: (n: number) => (n === 1 ? '1 battuta' : `${n} battute`),
    speakTime: 'Tempo di parola',
    playLongest: 'Ascolta l’estratto più lungo',
    rename: 'Rinomina',
    merge: 'Unisci',
    mergeInto: (name: string) => `Unisci in ${name}`,
    mergeHint: 'Seleziona almeno due personaggi per unirli.',
    mergeConfirm: (from: string, to: string) =>
      `Tutte le battute di ${from} passeranno a ${to}. ${from} verrà eliminato.`,
    splitToNew: 'Sposta su un nuovo personaggio',
    reassign: 'Riassegna a…',
    assignedTo: 'Assegnata a',
    changeCharacter: 'Cambia personaggio',
    selectedCount: (n: number) =>
      n === 1 ? '1 battuta selezionata →' : `${n} battute selezionate →`,
    howTitle: 'Controlla chi dice cosa',
    howBody:
      'Ogni battuta porta il nome del personaggio a cui appartiene. Clicca quel nome per darla a un altro. A sinistra, rinomina un personaggio o unisci due voci che il riconoscimento ha separato per errore.',
    selectAll: 'Seleziona tutto',
    selectNone: 'Deseleziona tutto',
    deleteLine: 'Elimina la battuta',
    deleteLineHint: 'L’audio originale resterà in quel punto.',
    textIsAGuide:
      'Il testo è solo una guida per i tempi. Correggilo solo se è illeggibile.',
    openLobby: 'Apri la lobby',
    openLobbyConfirm:
      'Una volta aperta la lobby, personaggi e battute non si possono più cambiare.',
    lockedAfterLobby: 'La preparazione è bloccata da quando la lobby è aperta.',
    recalculating: 'Ricalcolo dei clip…',
    noSelection: 'Seleziona delle battute per spostarle.',
    restoreLine: 'Ripristina la battuta',
    deletedBadge: 'Eliminata, audio originale conservato',
  },

  lobby: {
    hostTag: '(host)',
    title: 'Lobby',
    shareLink: 'Link da condividere',
    shareCode: 'Codice della scena',
    watchOriginal: 'Guarda la scena in originale',
    characters: 'Personaggi',
    takeCharacter: 'Prendi questo personaggio',
    dropCharacter: 'Lascia questo personaggio',
    releaseCharacter: 'Lascia in originale',
    unrelease: 'Rendi di nuovo disponibile',
    releasedBadge: 'Originale conservato',
    takenBy: (name: string) => `Preso da ${name}`,
    free: 'Libero',
    ready: 'Sono pronto',
    notReady: 'Non sono più pronto',
    readyBadge: 'Pronto',
    waitingBadge: 'In attesa',
    players: 'Giocatori',
    start: 'Avvia la partita',
    startBlockedTitle: 'Manca ancora qualcosa:',
    startBlockedCharacters:
      'personaggi senza giocatore, da prendere o da lasciare in originale:',
    startBlockedReady: 'giocatori che non si sono dichiarati pronti:',
    clipCount: (n: number) => (n === 1 ? '1 clip' : `${n} clip`),
    hostOnly: 'Solo l’ospite può avviare la partita.',
  },

  studio: {
    fxNoTake: 'Registra prima questa battuta: poi gli effetti si applicano alla ripresa.',
    playBlocked: 'Il browser ha bloccato la riproduzione. Tocca di nuovo il pulsante.',
    reassign: (nom: string) => `Riassegna ${nom}`,
    pickPlayer: 'Scegli un giocatore…',
    title: 'Studio',
    clipProgress: (current: number, total: number) => `Clip ${current} / ${total}`,
    playOriginal: 'Guarda la scena (originale)',
    record: 'Registra',
    stop: 'Ferma',
    playTake: 'La mia presa',
    redo: 'Rifai',
    validate: 'Tieni e avanti',
    finish: 'Ho finito',
    takeSaved: 'Presa salvata.',
    backToClips: 'Torna ai miei clip',
    allTakesSaved:
      'Tutte le tue prese sono salvate. Puoi chiudere la pagina: l’ospite lancerà il montaggio quando avranno finito tutti. Puoi anche rifarne una finché il montaggio non parte.',
    validated: 'Tenuta',
    previous: 'Precedente',
    next: 'Avanti',
    backingVolume: 'Sottofondo',
    micOffset: 'Scarto del microfono',
    micOffsetHelp:
      'Se le tue prese cadono sempre in ritardo, abbassa questo valore. Viene applicato al missaggio.',
    calibrate: 'Calibra automaticamente',
    calibrating: 'Calibrazione… resta in silenzio.',
    calibrationDone: (ms: number) => `Scarto misurato: ${ms} ms.`,
    calibrationFailed: 'Impossibile misurare lo scarto. Regolalo a mano se serve.',
    micDenied:
      'Il browser ha rifiutato il microfono. Autorizzalo e ricarica la pagina.',
    headphonesRequired:
      'Cuffie obbligatorie. Mentre registri senti solo la musica, mai le voci originali.',
    overflowWarning:
      'La tua presa esce dalla finestra, la fine verrà tagliata. Falla più corta.',
    speechZone: 'Zona di parola',
    margin: 'Margine',
    noTake: 'Nessuna presa per questo clip.',
    uploading: 'Invio della presa…',
    noCharacter:
      'In questa scena non ti è stato assegnato nessun personaggio. Qui puoi seguire gli altri.',
    fxTitle: 'Banco voce',
    fxReset: 'Rimettere a zero',
    fxReverb: 'Riverbero',
    fxPitch: 'Altezza',
    fxTune: 'Intonazione',
    fxHelp:
      'Gli effetti si applicano alla ripresa mostrata, e solo a quella. Vengono aggiunti nel mixaggio, mai sulla registrazione: puoi cambiarli o toglierli fino al montaggio.',
    fxPresets: {
      dry: 'Voce nuda',
      room: 'Stanza piccola',
      cathedral: 'Cattedrale',
      cartoon: 'Cartone',
      deep: 'Voce grave',
      cover: 'Cover',
    },
    emptyTake:
      'Non è stato registrato niente. Controlla che il microfono sia collegato e selezionato, poi rifai la presa.',
    whereEveryoneIs: 'A che punto è il gruppo',
    you: '(tu)',
    hostTag: '(host)',
    stateVo: 'In originale',
    stateDone: 'Fatto',
    stateRecording: 'In corso',
    waitingHost: 'Si aspetta che l’host lanci il montaggio.',
    hostCanRender: 'Hanno finito tutti: puoi lanciare il montaggio.',
    stillMissing: 'Mancano ancora delle battute da registrare.',
    finishedTitle: 'Hai finito!',
    finishedBody:
      'Puoi ancora tornare e rifare una presa finché il montaggio non parte.',
    waitingFor: 'Si aspetta ancora:',
    playerProgress: (name: string, done: number, total: number) =>
      `${name} (${done}/${total})`,
    everyoneDone: 'Hanno finito tutti. L’ospite può lanciare il montaggio.',
    othersDone: 'Gli altri hanno finito. Manchi solo tu.',
    soloScene: 'Sei solo su questa scena.',
    soloHint: 'Tutti i personaggi sono tuoi: nessuno da aspettare.',
    launchRender: 'Lancia il montaggio',
    renderBlocked: 'Restano clip senza nessuna presa.',
    kick: 'Escludi questo giocatore',
    kickConfirm: (name: string) =>
      `${name} verrà escluso e i suoi personaggi torneranno all’audio originale. Le sue prese verranno ignorate.`,
    reassignInstead: 'Riassegna il suo personaggio a qualcun altro',
    kicked: 'L’ospite ti ha escluso da questa scena.',
    myClips: 'I miei clip',
    youAreDubbing: 'Stai doppiando',
    cueIn: 'Tocca a te tra',
    cueNow: 'TOCCA A TE',
    cueDone: 'Battuta passata',
    cueIdle: 'Pronto',
    originalTrace: 'Il tracciato colorato mostra quando parla la voce originale.',
    micWindow: 'Il microfono si apre solo sulla tua battuta.',
    autoAlign: 'Allineamento automatico',
    autoAlignHelp:
      'La tua presa viene confrontata con la voce originale e rimessa al punto giusto. Toglilo se preferisci tenere i tuoi tempi esatti.',
    alignedBy: (ms: number) =>
      ms === 0
        ? 'La tua presa cadeva già giusta.'
        : ms > 0
          ? `Eri in ritardo di ${ms} ms, è stato recuperato.`
          : `Eri in anticipo di ${-ms} ms, è stato recuperato.`,
    alignUnsure:
      'L’allineamento non ha trovato nulla di netto su questa presa. Resta com’è.',
  },

  progress: {
    preparing: 'Preparazione della scena',
    rendering: 'Montaggio in corso',
    queued:
      'In coda: l’elaborazione parte tra un attimo.',
    working:
      'Conta qualche minuto. Puoi lasciare la scheda aperta e tornare più tardi.',
    almost: 'Ci siamo quasi.',
    longer: 'Ci sta mettendo più del solito, ma sta ancora girando. Lascialo finire.',
    phases: {
      upload: 'Invio del video',
      queued: 'Avvio dell’elaborazione',
      download: 'Recupero del video',
      encode: 'Preparazione dell’immagine',
      extract: 'Elaborazione audio',
      separate: 'Separazione di voci e musica',
      transcribe: 'Scomposizione dei dialoghi',
      segment: 'Assegnazione delle battute ai personaggi',
      renderQueued: 'Avvio del montaggio',
      fetch: 'Recupero delle registrazioni',
      mix: 'Mixaggio delle voci',
      mux: 'Montaggio del video',
      uploadRender: 'Invio del risultato',
      purge: 'Finalizzazione',
    },
  },
  render: {
    title: 'Montaggio in corso',
    queued:
      'In attesa del worker.',
    frozen: 'La scena è congelata: le prese non si possono più cambiare.',
    failed: 'Il montaggio è fallito.',
    retry: 'Rilancia il montaggio',
  },

  result: {
    title: 'Il risultato',
    download: 'Scarica l’MP4',
    exportTitle: 'Portarsi via la scena',
    formatWide: 'Formato largo',
    formatWideHint: 'Per uno schermo di computer o una TV.',
    formatVertical: 'Formato telefono',
    formatVerticalHint: 'Ritagliato al centro, per storie e reel.',
    formatVerticalMissing:
      'Questa scena è stata montata prima del ritaglio automatico. Rilancia il montaggio per averlo.',
    share: 'Condividi',
    shareHelp:
      'Su telefono, Condividi apre il menu di sistema: TikTok, Instagram e le altre app installate compaiono lì.',
    shareUnsupported:
      'Questo browser non sa condividere un file. Scaricalo e pubblicalo dall’app.',
    cast: 'Il cast',
    voiceOriginal: 'Originale conservato',
    shareHint: 'Il link funziona solo per chi partecipa a questa scena.',
    sourcePurged: 'La fonte è stata eliminata: resta solo il montaggio finale.',
    expiresIn: (m: string) => `Questo video sarà eliminato tra ${m}. Scaricalo ora se vuoi tenerlo.`,
    expiresSoon: 'Questo video sta per essere eliminato. Scaricalo ora se vuoi tenerlo.',
    expiredTitle: 'Il video è stato eliminato',
    expiredBody: 'Le scene finite vengono cancellate un’ora dopo il montaggio: sui nostri server non resta nulla. Per tenere una scena, scaricala prima.',
  },

  packStart: {
    intro: 'Questa scena è salvata come link: il suo video va recuperato di nuovo. Ci sono due modi.',
    recommended: 'Consigliato',
    fileTitle: 'Importa tu il video',
    fileBody: 'Recupera il video YouTube della scena e trascina qui il file. Tutto viene preparato online, in circa due minuti, senza il PC dell’host. Testo e personaggi del pack vengono ripresi così come sono.',
    openSource: 'Guarda il video su YouTube',
    howTo: 'Come recupero il file?',
    drop: 'Trascina qui il video o clicca per sceglierlo',
    expected: (d: string) => `Durata prevista: ${d} · MP4, massimo 50 MB`,
    mismatch: (prevista: string, ricevuta: string) => `Questo file dura ${ricevuta}, la scena del pack ${prevista}. Se non è esattamente lo stesso video, le battute cadranno fuori tempo.`,
    tooLarge: 'File troppo pesante: massimo 50 MB. Recupera il video in 720p o 480p.',
    fileSubmit: 'Importa e doppia',
    or: 'oppure',
    autoTitle: 'Download automatico',
    autoBody: 'Il PC dell’host scarica il video da YouTube. Lì deve essere avviato start.bat.',
    autoSubmit: 'Avvia il download',
    mediaBody: 'Questa scena è ospitata qui: parte subito.',
    introMember: 'Questa scena è salvata come link: porta il suo video e tutto viene preparato online con il testo e i personaggi del pack.',
  },

  guide: {
    metaTitle: 'Doppiare una scena con il tuo video',
    kicker: 'Guida',
    heroTitle: 'Doppia una scena del catalogo con il tuo video',
    heroBody: 'Le scene del catalogo conservano solo il link YouTube e il lavoro di preparazione. Per doppiarne una serve il video. Il modo più semplice: recuperarlo tu e importarlo. Quattro passaggi, cinque minuti.',
    ctaPrimary: 'Scegli una scena',
    ctaSecondary: 'Perché questo passaggio?',
    stepsTitle: 'In quattro passaggi',
    steps: [
      {
        title: 'Apri la scena su YouTube',
        body: 'In Community apri la scena da doppiare e segui il link «Guarda il video su YouTube». Copia l’indirizzo della pagina.',
      },
      {
        title: 'Recupera il file',
        body: 'Incolla l’indirizzo nello strumento di download che preferisci e salva il video in MP4. Scegli 720p, o 480p se il file supera i 50 MB.',
      },
      {
        title: 'Controlla la durata',
        body: 'Il video deve essere esattamente quello del pack: stesso inizio, stessa fine. Dub’Up confronta la durata e ti avvisa se è diversa.',
      },
      {
        title: 'Importa e doppia',
        body: 'Torna alla scena e trascina il file in «Importa tu il video». La preparazione avviene online, poi si apre la lobby.',
      },
    ],
    checklistTitle: 'Prima di importare',
    checklist: [
      'Lo stesso spezzone della scena del pack, senza tagli',
      'In formato MP4',
      'Al massimo 50 MB: bastano 720p o 480p',
      'Al massimo 10 minuti',
    ],
    whyTitle: 'Perché questo passaggio?',
    whyBody: 'YouTube rifiuta i download che provengono dai server. Dub’Up quindi non può recuperare il video al posto tuo: lo porti tu, e tutto il resto avviene online.',
    wayFileTitle: 'Importi tu il file',
    wayFileBody: 'Funziona a qualsiasi ora, anche se nessuno ha avviato start.bat. La preparazione avviene online, in circa due minuti.',
    faqTitle: 'Domande frequenti',
    faq: [
      {
        q: 'Quale strumento uso per scaricare?',
        a: 'Qualsiasi strumento che salvi un video YouTube in MP4. Evita quelli che chiedono di installare un’estensione o un programma sconosciuto, e scarica solo video che hai il diritto di usare in privato.',
      },
      {
        q: 'Il mio file supera i 50 MB',
        a: 'Scaricalo in qualità più bassa: 720p, o 480p per una scena lunga. L’immagine resta nitida nello studio e l’audio non ne risente.',
      },
      {
        q: 'Le battute cadono fuori tempo',
        a: 'Il video non è esattamente quello del pack: un’introduzione in più, un finale tagliato o un altro caricamento. Usa il link del pack e recupera quello.',
      },
      {
        q: 'Il video non è più su YouTube',
        a: 'Senza il video originale la scena non si può doppiare. Importa un’altra versione come nuova scena: verrà preparata da zero.',
      },
    ],
    finalTitle: 'Pronto a doppiare?',
    finalBody: 'Scegli una scena nel catalogo, recupera il suo video e la lobby si apre in pochi minuti.',
    homeLead: 'Una scena del catalogo non si scarica?',
    homeAction: 'Importa il tuo video',
    createLink: 'Come recupero il file di un video YouTube?',
  },

  guideHub: {
    title: 'Guide e aiuto',
    body: 'Tutto quello che serve per preparare una scena, doppiarla con gli amici e recuperare il risultato.',
    guidesTitle: 'Le guide',
    readGuide: 'Leggi la guida',
    videoGuideSummary: 'Recupera il video di una scena del catalogo, controlla che corrisponda al testo e importalo.',
    readingTime: '5 min di lettura',
  },

  admin: {
    title: 'Amministratori',
    help: 'Un amministratore può creare una scena da un link YouTube: il video viene scaricato dal worker del suo PC. Gli altri membri importano i loro video, preparati online.',
    roleOwner: 'Proprietario',
    roleAdmin: 'Admin',
    roleUser: 'Membro',
    promote: 'Nomina admin',
    demote: 'Togli admin',
    noAccount: 'non ancora collegato',
  },

  errors: {
    notFound: 'Non trovato.',
    forbidden: 'Non hai accesso a questa scena.',
    sessionLocked: 'Questa scena non si può più modificare.',
    hostOnly: 'Può farlo solo l’ospite.',
    noAudioTrack: 'Questo file non ha traccia audio.',
    noVideoTrack: 'Questo file non ha video.',
    tooLong: 'Scena troppo lunga: 10 minuti al massimo.',
    youtubeFailed:
      'Il download da YouTube è fallito. Importa direttamente il file video.',
  },
} satisfies Dictionary;
