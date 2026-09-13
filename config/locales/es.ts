/**
 * Diccionario español.
 *
 * Refleja `fr` clave por clave; el compilador lo verifica.
 * Tuteo, como en el original: es un juego entre amigos.
 */

import type { Dictionary } from '../i18n';

export const es = {
  nav: {
    home: 'Inicio',
    homeShort: 'Inicio',
    sessions: 'Mis escenas',
    sessionsShort: 'Escenas',
    community: 'Comunidad',
    communityShort: 'Comunidad',
    myPacks: 'Mis packs',
    myPacksShort: 'Mis packs',
    guides: 'Guías',
    guidesShort: 'Guías',
    create: 'Crear',
    join: 'Unirse',
    joinHelp: 'Introduce el código de seis caracteres que te dio el anfitrión.',
  },

  account: {
    title: 'Mi cuenta',
    subtitle:
      'Tu nombre y tu foto te acompañan en todas las escenas. Los demás jugadores ven los dos.',
    menuLabel: 'Mi cuenta y cerrar sesión',
    menuHint: 'Nombre, foto, acceso',
    photo: 'Foto de perfil',
    photoAdd: 'Añadir una foto',
    photoChange: 'Cambiar la foto',
    photoRemove: 'Quitar',
    photoHelp: 'PNG, JPEG o WebP, 2 MB como máximo. Los demás invitados la ven.',
    displayName: 'Nombre',
    displayNameHelp:
      'Es el nombre que los demás leen en la sala y en los créditos del resultado.',
    saved: 'Guardado.',
    accessTitle: 'Mi acceso',
    email: 'Correo electrónico',
    method: 'Entras con',
    methodEmail: 'Enlace por correo',
    since: 'Miembro desde',
    emailLocked:
      'La dirección no se cambia aquí: es la que figura en la lista de invitados. Escribe al editor para modificarla.',
  },

  myPacks: {
    title: 'Mis packs',
    subtitle:
      'Las escenas que has publicado. Cualquiera puede jugarlas y solo tú puedes retirarlas.',
    sceneCount: (n: number) =>
      n === 1 ? '1 escena publicada' : `${n} escenas publicadas`,
    emptyTitle: 'Todavía no has publicado nada',
    emptyBody:
      'Al final de una escena importada por enlace puedes publicarla: el enlace y el corte pasan a la comunidad, sin el vídeo.',
  },

  home: {
    youDub: 'doblas a',
    demoLines: [
      { name: 'Alba', text: '¿Seguro que es la puerta correcta?' },
      { name: 'Rem', text: 'En absoluto.' },
      { name: 'Noor', text: 'Entramos igualmente.' },
    ],
    carouselLabel: 'Cómo funciona',
    rythmoLabel: 'Vista previa de la banda rítmica: el texto se desplaza bajo un cabezal mientras doblas.',
    heroTitle: 'Redobla tus escenas favoritas',
    heroBody:
      'Elegís una escena, cada uno se queda con un personaje y lo grabáis por vuestra cuenta. La música y el ambiente originales siguen ahí: solo cambian las voces. El resultado se descubre al final, todos juntos.',
    kicker: 'El estudio de doblaje entre amigos',
    cta: 'Entrar en el estudio',
    ctaSessions: 'Ver mis escenas',
    ctaCommunity: 'Ver escenas listas',
    howTitle: 'Cómo funciona',
    reassure1: 'Sin instalar nada',
    reassure2: 'Cada uno graba cuando quiere',
    reassure3: 'Nada se publica',

    valueTitle: 'Lo que sale',
    value1: {
      title: 'Tu voz en lugar de la suya',
      body: 'Grabas con el micrófono de tus auriculares, en casa. La música y los efectos originales quedan intactos: solo se sustituyen las voces.',
    },
    value2: {
      title: 'Nadie oye nada hasta el final',
      body: 'Tus tomas son inaudibles para los demás mientras no exista la mezcla final. Descubrirlo juntos al final es todo el juego.',
    },
    value3: {
      title: 'Un MP4 que te quedas',
      body: 'Al final, un archivo que se reproduce en cualquier sitio, sin subtítulos incrustados. La escena original, en cambio, se borra.',
    },

    midCta: 'Elige una escena, reparte los papeles y mira lo que sale.',

    packsCtaTitle: 'Todavía no has publicado ningún pack',
    packsCtaBody:
      'Una escena importada por enlace se puede compartir con la comunidad: bastan el enlace y el corte, el vídeo no se aloja. A los demás solo les queda elegir sus papeles.',
    packsCtaAction: 'Preparar una escena',

    faqTitle: 'Lo que nos preguntan',
    seoTitle: 'Doblar una escena de película entre amigos',
    defineTitle: '¿Qué es doblar una escena de película?',
    defineBody:
      'Doblar una escena de película es sustituir las voces originales por las tuyas conservando todo lo demás: la imagen, la música, los efectos, el ritmo. El resultado no es un comentario encima, es la escena misma con otros actores. Dub’Up es un software de doblaje en línea que hace ese trabajo en el navegador, sin instalar nada.',
    defineHowTitle: 'Cómo doblar una escena de película por tu cuenta',
    defineHowBody:
      'Hacen falta tres cosas que nadie tiene en casa: separar las voces de la música para sustituir solo las voces, saber quién habla y cuándo al milisegundo, y mantener la sincronía al hablar. Dub’Up hace las dos primeras automáticamente a partir de la escena, y resuelve la tercera con una banda rítmica, el texto que pasa bajo un cabezal de lectura que los estudios de doblaje usan desde hace ochenta años.',
    defineWhoTitle: 'Para quién es',
    defineWhoBody:
      'Para grupos de amigos que quieren rehacer una frase mítica, para aficionados al fandub que buscan una herramienta sin montaje, para profesores de idiomas que hacen doblar un fragmento a su clase, y para quien aprende doblaje y quiere practicar sobre banda rítmica sin alquilar un estudio.',
    faqExtra: [
      {
        q: '¿Es gratis?',
        a: 'Sí. Dub’Up es un proyecto personal, sin publicidad, sin suscripción y sin límite de escenas.',
      },
      {
        q: '¿En qué se diferencia de un editor de vídeo?',
        a: 'Un editor te da una línea de tiempo vacía y te deja cuadrar las tomas a mano. Dub’Up parte de la escena: separa las voces, localiza las frases, las asigna a los personajes y recoloca tus tomas sobre la voz original.',
      },
      {
        q: '¿Puedo doblar una escena en inglés desde una interfaz en español?',
        a: 'Sí. El idioma de la interfaz y el de la escena son independientes. El texto transcrito sirve de guía de ritmo, tú dices lo que quieras encima.',
      },
      {
        q: '¿Cómo se separan las voces de la música?',
        a: 'Con un modelo de separación de fuentes que corre en la máquina del anfitrión y devuelve dos pistas: las voces por un lado, la música y el ambiente por otro. Como la separación sale de la propia escena, sigue cuadrada con la imagen.',
      },
    ] as const,
    faq: [
      {
        q: '¿Qué necesito exactamente?',
        a: 'Unos auriculares con micrófono y un navegador. Los auriculares no son un detalle: sin ellos tu micrófono vuelve a grabar la banda sonora y la mezcla queda inservible.',
      },
      {
        q: '¿Tenemos que estar todos a la vez?',
        a: 'No. Cada uno graba sus frases cuando quiere. El montaje arranca cuando todos han terminado.',
      },
      {
        q: '¿Hay que saber doblar?',
        a: 'No. El texto pasa bajo un cabezal de lectura, como en un estudio de verdad: lees y caes a tiempo. Una toma mala se repite igual.',
      },
      {
        q: '¿Cuánto se tarda?',
        a: 'Cuenta unos minutos de preparación automática tras la importación y luego lo que duren las frases. Una escena de dos minutos se dobla en media hora entre tres.',
      },
      {
        q: '¿Se guardan mis grabaciones?',
        a: 'No. Se borran junto con el vídeo original en cuanto existe la mezcla final.',
      },
      {
        q: '¿Puedo invitar a quien quiera?',
        a: 'Solo entran las direcciones añadidas a la lista de invitados. Tú mismo añades una dirección desde tu cuenta.',
      },
    ] as const,
    slides: {
      importTitle: 'Elegid la escena que os sabéis de memoria',
      importBody:
        'Un enlace, o un archivo. En lo que os ponéis de acuerdo con los papeles, la escena ya está cortada, las voces separadas de la música, cada frase fijada al milisegundo. Lo ingrato está hecho antes de que acabéis de elegir.',
      charactersTitle: 'Repartid los papeles como en un casting de verdad',
      charactersBody:
        'Los personajes ya están detectados y con nombre. Cada uno reclama el suyo con un clic. El que nadie quiere conserva su voz original, y en la mezcla no se nota.',
      rythmoTitle: 'El texto pasa, vosotros solo actuáis',
      rythmoBody:
        'Como en un estudio de verdad, las frases corren bajo un cabezal de lectura. Nada que cuadrar, nada de montaje que aprender: lees y caes a tiempo. Una toma mala se repite en dos segundos, tantas veces como quieras.',
      renderTitle: 'Y llega el momento de darle al play',
      renderBody:
        'Nadie ha oído a los demás. La escena vuelve a rodar, con su imagen y su música intactas, y son vuestras voces las que salen de la boca de los personajes. Todo lo demás existe por ese minuto.',
    },
  },

  community: {
    title: 'Escenas listas para doblar',
    subtitle:
      'Escenas ya importadas, separadas y cortadas por el grupo. Solo queda elegir los papeles: sin esperas, sin repetir la preparación.',
    play: 'Doblar esta escena',
    preview: 'Vista previa',
    openSource: 'Abrir la fuente',
    kindRecipe: 'Receta',
    kindMedia: 'Archivos guardados',
    recipeHelp:
      'Esta escena no está alojada aquí: solo se guardan el enlace y el corte. El vídeo se vuelve a descargar al empezar, lo que tarda unos minutos.',
    mediaHelp: 'Escena alojada aquí: arranca al instante.',
    mine: 'Tuya',
    voteUp: 'Esta escena está bien cortada',
    voteDown: 'Esta escena está mal cortada',
    voteScore: (n: number) => `Puntuación de la comunidad: ${n}`,
    voteHelp:
      'El voto es sobre el corte, no sobre la película. Una escena bien cortada le ahorra una tarde a todo el mundo.',
    sort: {
      label: 'Ordenar por',
      popular: 'Mejor valoradas',
      recent: 'Más recientes',
      short: 'Más cortas',
      title: 'Título (A → Z)',
    },
    filterLang: 'Idioma de la escena',
    filterGenre: 'Género',
    filterCast: 'Número de papeles',
    filterLength: 'Duración',
    filterAll: 'Todos',
    filterAllGenres: 'Todos los géneros',
    filterAnyCast: 'Da igual',
    filterAnyLength: 'Da igual',
    filterReset: 'Mostrar todo',
    filterNoMatch: 'Ninguna escena coincide',
    filterNoMatchBody:
      'Amplía los criterios, o publica la escena que le falta al catálogo.',
    langUnknown: 'Idioma desconocido',
    langNames: {
      fr: 'Francés',
      en: 'Inglés',
      es: 'Español',
      de: 'Alemán',
      it: 'Italiano',
      pt: 'Portugués',
      ja: 'Japonés',
      ko: 'Coreano',
      zh: 'Chino',
      ru: 'Ruso',
    } as Record<string, string>,
    genreNames: {
      action: 'Acción',
      comedie: 'Comedia',
      drame: 'Drama',
      animation: 'Animación',
      anime: 'Anime',
      serie: 'Serie',
      super_heros: 'Superhéroes',
      science_fiction: 'Ciencia ficción',
      horreur: 'Terror',
      jeu_video: 'Videojuego',
      chanson: 'Canción',
      documentaire: 'Documental',
      autre: 'Otro',
    } as Record<string, string>,
    castBuckets: {
      solo: '1 papel',
      duo: '2 papeles',
      small: '3 o 4 papeles',
      large: '5 papeles o más',
    } as Record<string, string>,
    lengthBuckets: {
      short: 'Menos de un minuto',
      medium: 'De 1 a 3 minutos',
      long: 'Más de 3 minutos',
    } as Record<string, string>,
    sceneCount: (n: number) =>
      n === 1 ? '1 escena disponible' : `${n} escenas disponibles`,
    characterCount: (n: number) => (n === 1 ? '1 personaje' : `${n} personajes`),
    lineCount: (n: number) => (n === 1 ? '1 frase' : `${n} frases`),
    emptyTitle: 'Ninguna escena guardada por ahora',
    emptyBody:
      'Durante una partida, el anfitrión puede marcar «guardar esta escena» antes de lanzar el montaje. Aterrizará aquí, lista para que otro grupo la juegue.',
    remove: 'Quitar del catálogo',
    removeTitle: '¿Quitar esta escena?',
    removeBody:
      'Se borrarán el vídeo, las pistas separadas y el corte. Las escenas ya empezadas a partir de ella dejarán de funcionar. No hay vuelta atrás.',
    publish: 'Publicar en la comunidad',
    published: 'Esta escena está en la comunidad',
    seeInCommunity: 'Verla en la comunidad',
    publishRecipeHelp:
      'Solo se comparten el enlace y el corte. El vídeo no se aloja aquí.',
    publishFromCatalogue:
      'Esta escena viene del catálogo: ya está ahí. Volver a publicarla dejaría dos copias que nadie sabría distinguir.',
    publishTooLate:
      'Esta escena venía de un archivo importado y sus medios se purgaron tras el montaje. Compartirla había que decidirlo antes. Una escena importada por enlace, en cambio, se puede publicar en cualquier momento.',
    keepLabel: 'Guardar esta escena para volver a jugarla',
    keepHelp:
      'Pasará a la pestaña Comunidad después del montaje, con su corte y sus personajes. Vuestras grabaciones no se guardan nunca.',
  },

  theme: {
    cinema: 'Cine',
    label: 'Aspecto',
    retro: 'Retro',
    modern: 'Moderno',
  },

  terms: {
    consent: 'He leído y acepto las {terms} y la {privacy}.',
    notice: 'Al continuar, aceptas las {terms} y la {privacy}.',
    linkTerms: 'condiciones de uso',
    linkPrivacy: 'política de privacidad',
    required: 'Hay que aceptar las condiciones para continuar.',
    gateTitle: 'Una cosa más',
    gateBody:
      'Antes de empezar, tienes que aceptar las condiciones de uso. Una casilla y listo.',
    gateGist:
      'Lo esencial: tú respondes por los fragmentos que importas y por lo que haces con ellos. Todo queda entre invitados, nada se publica.',
    gateConfirm: 'Aceptar y continuar',
  },

  legal: {
    mentions: 'Aviso legal',
    privacy: 'Privacidad',
    terms: 'Condiciones',
    usageNotice:
      'Uso estrictamente privado, entre personas invitadas. Ningún contenido se difunde públicamente ni se indexa.',
    contact: 'Contacto',
    contactEmail: 'ienders.pro@gmail.com',
  },

  status: {
    draft: 'Borrador',
    ingest_queued: 'En cola',
    ingesting: 'Importando',
    ingest_failed: 'Error al importar',
    prepping: 'Por preparar',
    lobby: 'Sala abierta',
    recording: 'Grabando',
    render_queued: 'Montaje en cola',
    rendering: 'Montando',
    render_failed: 'Error al montar',
    done: 'Terminada',
  },

  common: {
    untitled: 'Escena sin título',
    stepTitled: (n: number, titre: string) => `Paso ${n}: ${titre}`,
    scrollPause: 'Detener el pase',
    scrollResume: 'Reanudar el pase',
    step: (n: number, total: number) => `Paso ${n} de ${total}`,
    loading: 'Cargando…',
    save: 'Guardar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    delete: 'Eliminar',
    back: 'Volver',
    retry: 'Reintentar',
    close: 'Cerrar',
    copy: 'Copiar',
    copied: 'Copiado',
    unknownError: 'Ha ocurrido un error inesperado.',
  },

  auth: {
    linkExpired: 'Este enlace ha caducado o ya se ha usado. Los enlaces de acceso duran una hora y sirven una vez. Pide uno nuevo.',
    linkUsed: 'Este enlace ha caducado o ya se ha usado. Pide uno nuevo.',
    linkIncomplete: 'Este enlace está incompleto. Pide uno nuevo.',
    title: 'Entrar',
    subtitle: 'Te enviamos un enlace, haces clic y ya está.',
    emailLabel: 'Tu correo electrónico',
    emailPlaceholder: 'nombre@ejemplo.es',
    send: 'Enviarme un enlace',
    sending: 'Enviando…',
    sent: 'Enlace enviado. Mira tu correo.',
    notAllowed:
      'Esta dirección no está en la lista de invitados. Pide al anfitrión que te añada.',
    errorTitle: 'No podemos conectarte',
    backToSignIn: 'Volver a la pantalla de acceso',
    signOut: 'Cerrar sesión',

    signIn: 'Entrar',
    passwordLabel: 'Tu contraseña',
    badCredentials: 'Dirección o contraseña incorrectas.',
    rateLimited:
      'Demasiados enlaces pedidos esta hora. Pide al anfitrión que te envíe uno directamente, o entra con tu contraseña.',
    switchToPassword: 'Tengo contraseña, quiero entrar directamente',
    switchToLink: 'No tengo contraseña, enviadme un enlace',
    inviteOnly: 'El acceso está reservado a las direcciones invitadas.',
    discord: 'Continuar con Discord',
    orSeparator: 'o por correo',
    notAllowedWith: (email: string) =>
      `La dirección ${email} no está en la lista de invitados. Pide al anfitrión que la añada. Si has entrado por Discord, cuenta la dirección de tu cuenta de Discord.`,

    passwordSectionTitle: 'Contraseña',
    passwordSectionHelp: 'Define una para volver sin pasar por tu correo.',
    passwordNew: 'Nueva contraseña',
    passwordSave: 'Guardar la contraseña',
    passwordSaved: 'Contraseña guardada. Puedes usarla desde la próxima vez.',
    passwordTooShort: 'Ocho caracteres como mínimo.',
  },

  guests: {
    title: 'Invitados',
    help: 'Solo estas direcciones pueden entrar. Para Discord cuenta la dirección de la cuenta de Discord, que no siempre es la habitual.',
    add: 'Invitar',
    joined: 'Ya ha venido',
    pending: 'Nunca ha venido',
    remove: 'Quitar de la lista',
  },

  sessions: {
    joinTitle: 'Unirse a la escena',
    joinCode: 'Código',
    title: 'Mis escenas',
    empty: 'Ninguna escena por ahora. Importa una para empezar.',
    create: 'Nueva escena',
    open: 'Abrir',
    storageUsed: (used: string, total: string) => `${used} de ${total}`,
    storageWarning:
      'El almacenamiento se está llenando. Elimina escenas antiguas para hacer sitio.',
    deleteConfirmTitle: '¿Eliminar esta escena?',
    deleteConfirmBody:
      'Se borrarán el montaje final, las tomas y todos los metadatos. No hay vuelta atrás.',
    joinByCode: 'Entrar con un código',
    join: 'Entrar',
    storageTitle: 'Espacio usado',
    storageHelp:
      'El vídeo original y las pistas separadas se borran en cuanto existe un montaje: solo el resultado final ocupa sitio de forma duradera. Eliminar una escena libera el suyo.',
    codePlaceholder: 'ABC234',
    codeNotFound: 'Ninguna escena coincide con ese código.',
  },

  create: {
    title: 'Nueva escena',
    tabUpload: 'Importar un vídeo',
    tabYoutube: 'Pegar un enlace de YouTube',
    songLabel: 'Es una canción',
    songHelp:
      'Nos saltamos la transcripción: la letra ya te la sabes. El corte sigue la voz del tema y te dice cuándo entrar.',
    matchTitle: 'Esta escena ya existe',
    matchBody:
      'Alguien ya la preparó: el corte, los personajes y el texto están listos. Retomarla empieza enseguida, en vez de esperar varios minutos para el mismo resultado.',
    matchLines: 'Las frases a decir',
    matchUse: 'Partir de esta escena',
    matchScratch: 'Rehacer desde cero',
    tabPack: 'Partir de una escena lista',
    packHelp:
      'Nada que preparar: la escena ya está cortada, elegís los papeles y grabáis. El catálogo completo está en la pestaña Comunidad.',
    titleLabel: 'Título de la escena',
    titlePlaceholder: 'El duelo del puente',
    dropzone: 'Suelta aquí tu MP4, o haz clic para elegirlo',
    fileTooLarge: 'Archivo demasiado pesado: 50 MB como máximo.',
    wrongType: 'Hace falta un archivo de vídeo (MP4 preferiblemente).',
    youtubeLabel: 'Enlace del vídeo',
    youtubePlaceholder: 'https://www.youtube.com/watch?v=…',
    youtubeWarning:
      'La descarga de YouTube es una comodidad, no una garantía: falla con frecuencia. Si no funciona, importa el archivo directamente.',
    multiTrackWarning:
      'Si tu fuente tiene varias pistas de audio (doblada, original, comentarios), se dobla la primera.',
    durationWarning: 'La escena debe durar menos de 10 minutos.',
    keepLabel: 'Convertirla en escena compartida',
    keepHelpUrl:
      'Pasará a la pestaña Comunidad. Como viene de un enlace, solo se guardan el enlace y el corte: aquí no se aloja nada.',
    keepHelpUpload:
      'Solo las escenas creadas desde un enlace pueden unirse a la comunidad. Un archivo importado permanece privado para tu grupo: nunca volvemos a alojar la obra.',
    submitUpload: 'Importar y preparar',
    submitYoutube: 'Descargar y preparar',
    uploading: 'Subiendo el archivo…',
    subtitle: 'Dos maneras de empezar: importar tu vídeo para una escena nueva, o retomar una escena que el grupo ya preparó.',
    introUpload: 'Una escena nueva, preparada desde cero a partir de tu vídeo.',
    introPack: 'Los personajes y las frases ya están listos: tú traes el vídeo y la sala se abre en unos dos minutos.',
    introYoutube: 'Solo para administradores: el vídeo lo descarga el worker del PC del anfitrión, que debe estar en marcha.',
    limits: 'MP4 · 50 MB y 10 minutos como máximo',
    uploadStepsTitle: 'Cómo funciona',
    uploadSteps: [
      'Eliges tu vídeo y le pones un título.',
      'Preparamos todo en línea: el sonido, las voces, los diálogos. De dos a tres minutos.',
      'Revisas los personajes y luego invitas a tus amigos a la sala.',
    ],
    adminBadge: 'Admin',
  },

  ingest: {
    title: 'Preparando la escena',
    subtitle: 'Estamos cortando la escena. Tarda unos minutos.',
    queued:
      'Esperando al worker.',
    queuedHelp:
      'La escena empieza en cuanto el worker funcione en el PC del anfitrión: ejecuta start.bat.',
    failed: 'La importación ha fallado.',
    retry: 'Reintentar la importación',
    neverStarted:
      'La importación nunca arrancó: probablemente falló la subida del archivo. Vuelve a lanzarla, o empieza una escena nueva.',
    hostPreparing:
      'El anfitrión está ajustando los personajes. La sala se abre enseguida.',
    startOver: 'Nueva escena',
  },

  prepare: {
    selectCharacter: (nom: string) => `Seleccionar ${nom}`,
    selectLine: (code: string) => `Seleccionar la línea de ${code}`,
    listen: 'Escuchar',
    lineText: 'Texto de la línea',
    title: 'Preparar los personajes',
    subtitle:
      'La detección automática se equivoca de personaje a menudo. Es el momento de corregir: cuando se abra la sala, ya no se podrá cambiar.',
    charactersHeading: 'Personajes detectados',
    linesHeading: 'Frases',
    linesOf: (name: string) => `Frases de ${name}`,
    showAllLines: 'Ver todo',
    lineCount: (n: number) => (n === 1 ? '1 frase' : `${n} frases`),
    speakTime: 'Tiempo de habla',
    playLongest: 'Escuchar el fragmento más largo',
    rename: 'Renombrar',
    merge: 'Fusionar',
    mergeInto: (name: string) => `Fusionar en ${name}`,
    mergeHint: 'Selecciona al menos dos personajes para fusionarlos.',
    mergeConfirm: (from: string, to: string) =>
      `Todas las frases de ${from} pasarán a ${to}. ${from} se eliminará.`,
    splitToNew: 'Mover a un personaje nuevo',
    reassign: 'Reasignar a…',
    assignedTo: 'Asignada a',
    changeCharacter: 'Cambiar de personaje',
    selectedCount: (n: number) =>
      n === 1 ? '1 frase seleccionada →' : `${n} frases seleccionadas →`,
    howTitle: 'Comprueba quién dice qué',
    howBody:
      'Cada frase lleva el nombre del personaje al que pertenece. Haz clic en ese nombre para dársela a otro. A la izquierda, renombra un personaje o fusiona dos voces que la detección separó por error.',
    selectAll: 'Seleccionar todo',
    selectNone: 'Quitar la selección',
    deleteLine: 'Eliminar la frase',
    deleteLineHint: 'El audio original se conservará en ese punto.',
    textIsAGuide:
      'El texto es solo una guía de sincronía. Corrígelo únicamente si es ilegible.',
    openLobby: 'Abrir la sala',
    openLobbyConfirm:
      'Una vez abierta la sala, los personajes y las frases ya no se pueden cambiar.',
    lockedAfterLobby: 'La preparación está bloqueada desde que se abrió la sala.',
    recalculating: 'Recalculando los clips…',
    noSelection: 'Selecciona frases para moverlas.',
    restoreLine: 'Restaurar la frase',
    deletedBadge: 'Eliminada, audio original guardado',
  },

  lobby: {
    hostTag: '(anfitrión)',
    title: 'Sala',
    shareLink: 'Enlace para compartir',
    shareCode: 'Código de la escena',
    watchOriginal: 'Ver la escena original',
    characters: 'Personajes',
    takeCharacter: 'Coger este personaje',
    dropCharacter: 'Dejar este personaje',
    releaseCharacter: 'Dejar en versión original',
    unrelease: 'Volver a dejarlo libre',
    releasedBadge: 'Original guardado',
    takenBy: (name: string) => `Lo tiene ${name}`,
    free: 'Libre',
    ready: 'Estoy listo',
    notReady: 'Ya no estoy listo',
    readyBadge: 'Listo',
    waitingBadge: 'Esperando',
    players: 'Jugadores',
    start: 'Empezar la partida',
    startBlockedTitle: 'Todavía falta algo:',
    startBlockedCharacters:
      'personajes sin jugador, para coger o dejar en versión original:',
    startBlockedReady: 'jugadores que no se han declarado listos:',
    clipCount: (n: number) => (n === 1 ? '1 clip' : `${n} clips`),
    hostOnly: 'Solo el anfitrión puede empezar la partida.',
  },

  studio: {
    fxNoTake: 'Graba primero esta línea: luego los efectos se aplican a la toma.',
    playBlocked: 'El navegador bloqueó la reproducción. Vuelve a tocar el botón.',
    reassign: (nom: string) => `Reasignar ${nom}`,
    pickPlayer: 'Elige un jugador…',
    title: 'Estudio',
    clipProgress: (current: number, total: number) => `Clip ${current} / ${total}`,
    playOriginal: 'Ver la escena (original)',
    record: 'Grabar',
    stop: 'Parar',
    playTake: 'Mi toma',
    redo: 'Repetir',
    validate: 'Guardar y siguiente',
    finish: 'He terminado',
    takeSaved: 'Toma guardada.',
    backToClips: 'Volver a mis clips',
    allTakesSaved:
      'Todas tus tomas están guardadas. Puedes cerrar la página: el anfitrión lanzará el montaje cuando todos hayan terminado. También puedes repetir alguna mientras no empiece el montaje.',
    validated: 'Guardada',
    previous: 'Anterior',
    next: 'Siguiente',
    backingVolume: 'Fondo sonoro',
    micOffset: 'Desfase del micrófono',
    micOffsetHelp:
      'Si tus tomas caen siempre tarde, baja este valor. Se aplica en la mezcla.',
    calibrate: 'Calibrar automáticamente',
    calibrating: 'Calibrando… no hagas ruido.',
    calibrationDone: (ms: number) => `Desfase medido: ${ms} ms.`,
    calibrationFailed:
      'No se ha podido medir el desfase. Ajústalo a mano si hace falta.',
    micDenied: 'El navegador ha rechazado el micrófono. Permítelo y recarga la página.',
    headphonesRequired:
      'Auriculares obligatorios. Mientras grabas solo oyes la música, nunca las voces originales.',
    overflowWarning:
      'Tu toma se sale de la ventana y se cortará el final. Hazla más corta.',
    speechZone: 'Zona de habla',
    margin: 'Margen',
    noTake: 'Ninguna toma para este clip.',
    uploading: 'Subiendo la toma…',
    noCharacter:
      'No se te ha asignado ningún personaje en esta escena. Puedes seguir a los demás aquí.',
    fxTitle: 'Mesa de voz',
    fxReset: 'Dejar plano',
    fxReverb: 'Reverb',
    fxPitch: 'Tono',
    fxTune: 'Afinación',
    fxHelp:
      'Los efectos se aplican a la toma mostrada, y solo a ella. Se añaden en la mezcla, nunca en la grabación: puedes cambiarlos o quitarlos hasta el montaje.',
    fxPresets: {
      dry: 'Voz limpia',
      room: 'Sala pequeña',
      cathedral: 'Catedral',
      cartoon: 'Dibujos',
      deep: 'Voz grave',
      cover: 'Versión',
    },
    emptyTake:
      'No se grabó nada. Comprueba que tu micrófono esté conectado y seleccionado, y vuelve a grabar.',
    whereEveryoneIs: 'Cómo va el grupo',
    you: '(tú)',
    hostTag: '(anfitrión)',
    stateVo: 'En V.O.',
    stateDone: 'Listo',
    stateRecording: 'Grabando',
    waitingHost: 'Esperando a que el anfitrión lance la mezcla.',
    hostCanRender: 'Todo el mundo ha terminado: ya puedes lanzar la mezcla.',
    stillMissing: 'Todavía quedan frases por grabar.',
    finishedTitle: '¡Has terminado!',
    finishedBody:
      'Todavía puedes volver y repetir una toma mientras no empiece el montaje.',
    waitingFor: 'Aún se espera a:',
    playerProgress: (name: string, done: number, total: number) =>
      `${name} (${done}/${total})`,
    everyoneDone: 'Todos han terminado. El anfitrión puede lanzar el montaje.',
    othersDone: 'Los demás han terminado. Solo faltas tú.',
    soloScene: 'Estás solo en esta escena.',
    soloHint: 'Todos los personajes son tuyos: no hay a quién esperar.',
    launchRender: 'Lanzar el montaje',
    renderBlocked: 'Quedan clips sin ninguna toma.',
    kick: 'Expulsar a este jugador',
    kickConfirm: (name: string) =>
      `${name} será expulsado y sus personajes volverán a la versión original. Sus tomas se ignorarán.`,
    reassignInstead: 'Reasignar su personaje a otra persona',
    kicked: 'El anfitrión te ha expulsado de esta escena.',
    myClips: 'Mis clips',
    youAreDubbing: 'Estás doblando a',
    cueIn: 'Te toca en',
    cueNow: 'TE TOCA',
    cueDone: 'Frase pasada',
    cueIdle: 'Listo',
    originalTrace: 'El trazo de color muestra cuándo habla la voz original.',
    micWindow: 'El micrófono solo se abre en tu frase.',
    autoAlign: 'Ajuste automático',
    autoAlignHelp:
      'Tu toma se compara con la voz original y se recoloca en su sitio. Desactívalo si prefieres conservar tu sincronía exacta.',
    alignedBy: (ms: number) =>
      ms === 0
        ? 'Tu toma ya caía a tiempo.'
        : ms > 0
          ? `Ibas ${ms} ms tarde, ya está corregido.`
          : `Ibas ${-ms} ms adelantado, ya está corregido.`,
    alignUnsure:
      'El ajuste no ha encontrado nada claro en esta toma. Se coloca tal cual.',
  },

  progress: {
    preparing: 'Preparando la escena',
    rendering: 'Montando el resultado',
    queued:
      'En cola: el procesamiento empieza en un momento.',
    working: 'Cuenta unos minutos. Puedes dejar la pestaña abierta y volver más tarde.',
    almost: 'Casi está.',
    longer: 'Está tardando más de lo normal, pero sigue en marcha. Déjalo terminar.',
    phases: {
      upload: 'Enviando el vídeo',
      queued: 'Iniciando el procesamiento',
      download: 'Recuperando el vídeo',
      encode: 'Preparando la imagen',
      extract: 'Procesando el audio',
      separate: 'Separando voces y música',
      transcribe: 'Desglosando los diálogos',
      segment: 'Asignando las frases a los personajes',
      renderQueued: 'Iniciando el montaje',
      fetch: 'Recuperando las tomas',
      mix: 'Mezclando las voces',
      mux: 'Montando el vídeo',
      uploadRender: 'Enviando el resultado',
      purge: 'Finalizando',
    },
  },
  render: {
    title: 'Montaje en curso',
    queued:
      'Esperando al worker.',
    frozen: 'La escena está congelada: las tomas ya no se pueden cambiar.',
    failed: 'El montaje ha fallado.',
    retry: 'Reintentar el montaje',
  },

  result: {
    title: 'El resultado',
    download: 'Descargar el MP4',
    exportTitle: 'Llevarte la escena',
    formatWide: 'Formato ancho',
    formatWideHint: 'Para una pantalla de ordenador o un televisor.',
    formatVertical: 'Formato teléfono',
    formatVerticalHint: 'Recortado al centro, para stories y reels.',
    formatVerticalMissing:
      'Esta escena se renderizó antes del recorte automático. Vuelve a lanzar el render para obtenerlo.',
    share: 'Compartir',
    shareHelp:
      'En el móvil, Compartir abre el menú del sistema: TikTok, Instagram y las demás apps instaladas aparecen ahí.',
    shareUnsupported:
      'Este navegador no sabe compartir un archivo. Descárgalo y publícalo desde la app.',
    cast: 'El reparto',
    voiceOriginal: 'Original guardado',
    shareHint: 'El enlace solo funciona para quienes participan en esta escena.',
    sourcePurged: 'La fuente se ha eliminado: solo se conserva la mezcla final.',
    expiresIn: (m: string) => `Este vídeo se borrará en ${m}. Descárgalo ahora si quieres conservarlo.`,
    expiresSoon: 'Este vídeo se va a borrar en cualquier momento. Descárgalo ahora si quieres conservarlo.',
    expiredTitle: 'El vídeo se ha borrado',
    expiredBody: 'Las escenas terminadas se borran una hora después del montaje: no guardamos nada en nuestros servidores. Para conservar una escena, descárgala antes.',
  },

  packStart: {
    intro: 'Esta escena se guarda como enlace: hay que volver a conseguir su vídeo. Hay dos maneras.',
    recommended: 'Recomendado',
    fileTitle: 'Importar el vídeo tú mismo',
    fileBody: 'Consigue el vídeo de YouTube de la escena y suelta aquí el archivo. Todo se prepara en línea, en unos dos minutos, sin el PC del anfitrión. El texto y los personajes del pack se reutilizan tal cual.',
    openSource: 'Ver el vídeo en YouTube',
    howTo: '¿Cómo consigo el archivo?',
    drop: 'Suelta el vídeo aquí o haz clic para elegirlo',
    expected: (d: string) => `Duración esperada: ${d} · MP4, 50 MB como máximo`,
    mismatch: (esperada: string, recibida: string) => `Este archivo dura ${recibida}; la escena del pack, ${esperada}. Si no es exactamente el mismo vídeo, las frases caerán a destiempo.`,
    tooLarge: 'Archivo demasiado pesado: 50 MB como máximo. Consigue el vídeo en 720p o 480p.',
    fileSubmit: 'Importar y doblar',
    or: 'o',
    autoTitle: 'Descarga automática',
    autoBody: 'El PC del anfitrión descarga el vídeo de YouTube. start.bat tiene que estar en marcha.',
    autoSubmit: 'Iniciar la descarga',
    mediaBody: 'Esta escena está alojada aquí: empieza enseguida.',
    introMember: 'Esta escena se guarda como enlace: trae su vídeo y todo se prepara en línea con el texto y los personajes del pack.',
  },

  guide: {
    metaTitle: 'Doblar una escena con tu propio vídeo',
    kicker: 'Guía',
    heroTitle: 'Dobla una escena del catálogo con tu propio vídeo',
    heroBody: 'Las escenas del catálogo solo guardan el enlace de YouTube y el trabajo de preparación. Para doblar una, hace falta el vídeo. Lo más sencillo: conseguirlo tú e importarlo. Cuatro pasos, cinco minutos.',
    ctaPrimary: 'Elegir una escena',
    ctaSecondary: '¿Por qué este paso?',
    stepsTitle: 'En cuatro pasos',
    steps: [
      {
        title: 'Abre la escena en YouTube',
        body: 'En Comunidad, abre la escena que quieres doblar y sigue el enlace «Ver el vídeo en YouTube». Copia la dirección de la página.',
      },
      {
        title: 'Consigue el archivo',
        body: 'Pega la dirección en la herramienta de descarga que prefieras y guarda el vídeo en MP4. Elige 720p, o 480p si el archivo supera los 50 MB.',
      },
      {
        title: 'Comprueba la duración',
        body: 'El vídeo debe ser exactamente el del pack: mismo inicio, mismo final. Dub’Up compara la duración y te avisa si no coincide.',
      },
      {
        title: 'Importa y dobla',
        body: 'Vuelve a la escena y suelta el archivo en «Importar el vídeo tú mismo». La preparación se hace en línea y luego se abre la sala.',
      },
    ],
    checklistTitle: 'Antes de importar',
    checklist: [
      'El mismo fragmento que la escena del pack, sin cortes',
      'En formato MP4',
      '50 MB como máximo: 720p o 480p bastan',
      '10 minutos como máximo',
    ],
    whyTitle: '¿Por qué este paso?',
    whyBody: 'YouTube rechaza las descargas que vienen de servidores. Por eso Dub’Up no puede conseguir el vídeo por ti: tú lo traes y todo lo demás se hace en línea.',
    wayFileTitle: 'Importas el archivo',
    wayFileBody: 'Funciona a cualquier hora, aunque nadie haya iniciado start.bat. La preparación se hace en línea, en unos dos minutos.',
    faqTitle: 'Preguntas frecuentes',
    faq: [
      {
        q: '¿Qué herramienta uso para descargar?',
        a: 'Cualquiera que guarde un vídeo de YouTube en MP4. Evita las que piden instalar una extensión o un programa desconocido, y descarga solo vídeos que tengas derecho a usar en privado.',
      },
      {
        q: 'Mi archivo supera los 50 MB',
        a: 'Descárgalo con menos calidad: 720p, o 480p para una escena larga. La imagen sigue nítida en el estudio y el sonido no se resiente.',
      },
      {
        q: 'Las frases caen a destiempo',
        a: 'El vídeo no es exactamente el del pack: una introducción de más, un final cortado u otra subida. Usa el enlace del pack y consigue ese.',
      },
      {
        q: 'El vídeo ya no está en YouTube',
        a: 'Sin el vídeo original no se puede doblar la escena. Importa otra versión como escena nueva: se preparará desde cero.',
      },
    ],
    finalTitle: '¿Listo para doblar?',
    finalBody: 'Elige una escena del catálogo, consigue su vídeo y la sala se abre en pocos minutos.',
    homeLead: '¿Una escena del catálogo no se descarga?',
    homeAction: 'Importa tu propio vídeo',
    createLink: '¿Cómo consigo el archivo de un vídeo de YouTube?',
  },

  guideHub: {
    title: 'Guías y ayuda',
    body: 'Todo lo necesario para preparar una escena, doblarla con amigos y recuperar el resultado.',
    guidesTitle: 'Las guías',
    readGuide: 'Leer la guía',
    videoGuideSummary: 'Consigue el vídeo de una escena del catálogo, comprueba que coincide con el texto e impórtalo.',
    readingTime: '5 min de lectura',
  },

  admin: {
    title: 'Administradores',
    help: 'Un administrador puede crear una escena desde un enlace de YouTube: el vídeo lo descarga el worker de su PC. Los demás miembros importan sus vídeos, que se preparan en línea.',
    roleOwner: 'Propietario',
    roleAdmin: 'Admin',
    roleUser: 'Miembro',
    promote: 'Hacer admin',
    demote: 'Quitar admin',
    noAccount: 'aún no ha entrado',
  },

  errors: {
    notFound: 'No encontrado.',
    forbidden: 'No tienes acceso a esta escena.',
    sessionLocked: 'Esta escena ya no se puede modificar.',
    hostOnly: 'Solo el anfitrión puede hacerlo.',
    noAudioTrack: 'Este archivo no tiene pista de audio.',
    noVideoTrack: 'Este archivo no tiene vídeo.',
    tooLong: 'Escena demasiado larga: 10 minutos como máximo.',
    youtubeFailed:
      'La descarga de YouTube ha fallado. Importa el archivo de vídeo directamente.',
  },
} satisfies Dictionary;
