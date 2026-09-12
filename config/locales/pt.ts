/**
 * Dicionário português (do Brasil).
 *
 * Espelha `fr` chave por chave; o compilador verifica.
 * Tratamento por "você", como no original: é um jogo entre amigos.
 */

import type { Dictionary } from '../i18n';

export const pt = {
  nav: {
    home: 'Início',
    homeShort: 'Início',
    sessions: 'Minhas cenas',
    sessionsShort: 'Cenas',
    community: 'Comunidade',
    communityShort: 'Comunidade',
    myPacks: 'Meus packs',
    myPacksShort: 'Meus packs',
  },

  account: {
    title: 'Minha conta',
    subtitle:
      'Seu nome e sua foto vão com você em todas as cenas. Os outros jogadores veem os dois.',
    menuLabel: 'Minha conta e sair',
    menuHint: 'Nome, foto, acesso',
    photo: 'Foto de perfil',
    photoAdd: 'Adicionar uma foto',
    photoChange: 'Trocar a foto',
    photoRemove: 'Remover',
    photoHelp: 'PNG, JPEG ou WebP, no máximo 2 MB. Os outros convidados veem.',
    displayName: 'Nome',
    displayNameHelp:
      'É o nome que os outros leem no lobby e nos créditos do resultado.',
    saved: 'Salvo.',
    accessTitle: 'Meu acesso',
    email: 'Endereço de e-mail',
    method: 'Você entra com',
    methodEmail: 'Link por e-mail',
    since: 'Membro desde',
    emailLocked:
      'O endereço não se troca aqui: é o que está na lista de convidados. Escreva ao editor para alterá-lo.',
  },

  myPacks: {
    title: 'Meus packs',
    subtitle:
      'As cenas que você publicou. Qualquer um pode jogá-las, e só você pode retirá-las.',
    sceneCount: (n: number) => (n === 1 ? '1 cena publicada' : `${n} cenas publicadas`),
    emptyTitle: 'Você ainda não publicou nada',
    emptyBody:
      'No fim de uma cena importada por link, você pode publicá-la: o link e o corte vão para a comunidade, sem o vídeo.',
  },

  home: {
    heroTitle: 'Redublem suas cenas favoritas',
    heroBody:
      'Vocês escolhem uma cena, cada um pega um personagem e grava por conta própria. A música e o ambiente originais continuam ali: só as vozes mudam. O resultado se descobre no fim, todos juntos.',
    kicker: 'O estúdio de dublagem entre amigos',
    cta: 'Entrar no estúdio',
    ctaSessions: 'Ver minhas cenas',
    ctaCommunity: 'Ver cenas prontas',
    howTitle: 'Como funciona',
    reassure1: 'Nada para instalar',
    reassure2: 'Cada um grava quando quiser',
    reassure3: 'Nada é publicado',

    valueTitle: 'O que sai disso',
    value1: {
      title: 'Sua voz no lugar da deles',
      body: 'Você grava com o microfone do seu fone, em casa. A música e os efeitos originais ficam intactos: só as vozes são substituídas.',
    },
    value2: {
      title: 'Ninguém ouve nada até o fim',
      body: 'Suas tomadas ficam inaudíveis para os outros enquanto a mixagem final não existir. Descobrir juntos no fim é o jogo inteiro.',
    },
    value3: {
      title: 'Um MP4 que fica',
      body: 'No fim, um arquivo que roda em qualquer lugar, sem legendas gravadas. A cena de origem, essa é apagada.',
    },

    midCta: 'Escolha uma cena, distribua os papéis, e veja o que sai.',

    packsCtaTitle: 'Você ainda não publicou nenhum pack',
    packsCtaBody:
      'Uma cena importada por link pode ser compartilhada com a comunidade: bastam o link e o corte, o vídeo não fica hospedado. Aos outros só resta escolher os papéis.',
    packsCtaAction: 'Preparar uma cena',

    faqTitle: 'O que perguntam para a gente',
    seoTitle: 'Dublar uma cena de filme entre amigos',
    defineTitle: 'O que é dublar uma cena de filme?',
    defineBody:
      'Dublar uma cena de filme é trocar as vozes originais pelas suas mantendo todo o resto: a imagem, a música, os efeitos, o ritmo. O resultado não é um comentário por cima, é a própria cena com outros atores. O Dub’Up é um software de dublagem online que faz esse trabalho no navegador, sem instalar nada.',
    defineHowTitle: 'Como dublar uma cena de filme por conta própria',
    defineHowBody:
      'São precisas três coisas que ninguém tem em casa: separar as vozes da música para trocar só as vozes, saber quem fala e quando ao milissegundo, e manter a sincronia enquanto se fala. O Dub’Up faz as duas primeiras automaticamente a partir da cena, e resolve a terceira com uma faixa rítmica, o texto que passa sob uma cabeça de leitura usada pelos estúdios de dublagem há oitenta anos.',
    defineWhoTitle: 'Para quem serve',
    defineWhoBody:
      'Para grupos de amigos que querem refazer uma fala clássica, para quem faz fandub e procura uma ferramenta que não seja um editor, para professores de idiomas que põem a turma a dublar um trecho, e para quem estuda dublagem e quer treinar em faixa rítmica sem alugar estúdio.',
    faqExtra: [
      {
        q: 'É de graça?',
        a: 'É. O Dub’Up é um projeto pessoal, sem anúncios, sem assinatura e sem limite de cenas.',
      },
      {
        q: 'Qual a diferença para um editor de vídeo?',
        a: 'Um editor entrega uma linha do tempo vazia e deixa você encaixar as tomadas na mão. O Dub’Up parte da cena: separa as vozes, acha as falas, atribui aos personagens e reposiciona suas tomadas sobre a voz original.',
      },
      {
        q: 'Dá para dublar uma cena em inglês com a interface em português?',
        a: 'Dá. O idioma da interface e o da cena são independentes. O texto transcrito serve de guia de tempo, e você fala o que quiser por cima.',
      },
      {
        q: 'Como as vozes são separadas da música?',
        a: 'Por um modelo de separação de fontes que roda na máquina do anfitrião e devolve duas faixas: as vozes de um lado, música e ambiente do outro. Como a separação vem da própria cena, continua grudada na imagem.',
      },
    ] as const,
    faq: [
      {
        q: 'Do que eu preciso, exatamente?',
        a: 'Um fone com microfone e um navegador. O fone não é detalhe: sem ele, seu microfone grava a trilha de novo e a mixagem fica inutilizável.',
      },
      {
        q: 'Todo mundo precisa estar junto ao mesmo tempo?',
        a: 'Não. Cada um grava as falas quando quiser. A renderização começa quando todos terminarem.',
      },
      {
        q: 'Preciso saber dublar?',
        a: 'Não. O texto passa sob uma cabeça de leitura, como num estúdio de verdade: você lê e cai no tempo. Uma tomada ruim se refaz igual.',
      },
      {
        q: 'Quanto tempo leva?',
        a: 'Conte alguns minutos de preparo automático depois da importação, e depois o tempo das falas. Uma cena de dois minutos se dubla em meia hora em três pessoas.',
      },
      {
        q: 'Minhas gravações ficam guardadas?',
        a: 'Não. São apagadas junto com o vídeo de origem, assim que a mixagem final existir.',
      },
      {
        q: 'Posso convidar quem eu quiser?',
        a: 'Só entram os endereços adicionados à lista de convidados. Você mesmo adiciona um endereço pela sua conta.',
      },
    ] as const,
    privateTitle: 'Uma sala privada, não uma rede',
    privateBody:
      'O Dub’Up é só para quem foi convidado. Sem catálogo público, sem compartilhar fora do círculo, sem indexação. É isso que torna a coisa sustentável: dublamos trechos de obras protegidas, entre amigos, sem divulgar nada.',
    slides: {
      importTitle: 'Escolham a cena que vocês sabem de cor',
      importBody:
        'Um link, ou um arquivo. No tempo de vocês combinarem os papéis, a cena já está cortada, as vozes separadas da música, cada fala presa ao milissegundo. A parte chata fica pronta antes de vocês terminarem de escolher.',
      charactersTitle: 'Distribuam os papéis como num casting de verdade',
      charactersBody:
        'Os personagens já estão identificados e com nome. Cada um pega o seu com um clique. O que ninguém quer fica com a voz original, e na mixagem não dá para notar.',
      rythmoTitle: 'O texto passa, vocês só atuam',
      rythmoBody:
        'Como num estúdio de verdade, as falas correm sob uma cabeça de leitura. Nada para encaixar, nenhum editor para aprender: você lê e cai no tempo. Uma tomada ruim se refaz em dois segundos, quantas vezes quiser.',
      renderTitle: 'E aí chega a hora de apertar o play',
      renderBody:
        'Ninguém ouviu os outros. A cena roda de novo, com a imagem e a música originais intactas, e são as vozes de vocês saindo da boca dos personagens. Todo o resto existe por causa desse minuto.',
    },
  },

  community: {
    title: 'Cenas prontas para dublar',
    subtitle:
      'Cenas já importadas, separadas e cortadas pelo grupo. Só falta escolher os papéis: sem espera, sem refazer o preparo.',
    play: 'Dublar esta cena',
    preview: 'Prévia',
    openSource: 'Abrir a fonte',
    kindRecipe: 'Receita',
    kindMedia: 'Arquivos guardados',
    recipeHelp:
      'Esta cena não fica hospedada aqui: só o link e o corte são guardados. O vídeo é baixado de novo no início, o que leva alguns minutos.',
    mediaHelp: 'Cena hospedada aqui: começa na hora.',
    mine: 'Sua',
    voteUp: 'Esta cena está bem cortada',
    voteDown: 'Esta cena está mal cortada',
    voteScore: (n: number) => `Pontuação da comunidade: ${n}`,
    voteHelp:
      'O voto é sobre o corte, não sobre o filme. Uma cena bem cortada economiza uma noite de todo mundo.',
    sort: {
      label: 'Ordenar por',
      popular: 'Mais bem avaliadas',
      recent: 'Mais recentes',
      short: 'Mais curtas',
      title: 'Título (A → Z)',
    },
    filterLang: 'Idioma da cena',
    filterGenre: 'Gênero',
    filterCast: 'Número de papéis',
    filterLength: 'Duração',
    filterAll: 'Todos',
    filterAllGenres: 'Todos os gêneros',
    filterAnyCast: 'Tanto faz',
    filterAnyLength: 'Tanto faz',
    filterReset: 'Mostrar tudo',
    filterNoMatch: 'Nenhuma cena corresponde',
    filterNoMatchBody:
      'Abra mais os critérios, ou publique a cena que falta no catálogo.',
    langUnknown: 'Idioma desconhecido',
    langNames: {
      fr: 'Francês',
      en: 'Inglês',
      es: 'Espanhol',
      de: 'Alemão',
      it: 'Italiano',
      pt: 'Português',
      ja: 'Japonês',
      ko: 'Coreano',
      zh: 'Chinês',
      ru: 'Russo',
    } as Record<string, string>,
    genreNames: {
      action: 'Ação',
      comedie: 'Comédia',
      drame: 'Drama',
      animation: 'Animação',
      anime: 'Anime',
      serie: 'Série',
      super_heros: 'Super-heróis',
      science_fiction: 'Ficção científica',
      horreur: 'Terror',
      jeu_video: 'Videogame',
      chanson: 'Música',
      documentaire: 'Documentário',
      autre: 'Outro',
    } as Record<string, string>,
    castBuckets: {
      solo: '1 papel',
      duo: '2 papéis',
      small: '3 ou 4 papéis',
      large: '5 papéis ou mais',
    } as Record<string, string>,
    lengthBuckets: {
      short: 'Menos de um minuto',
      medium: 'De 1 a 3 minutos',
      long: 'Mais de 3 minutos',
    } as Record<string, string>,
    sceneCount: (n: number) =>
      n === 1 ? '1 cena disponível' : `${n} cenas disponíveis`,
    characterCount: (n: number) => (n === 1 ? '1 personagem' : `${n} personagens`),
    lineCount: (n: number) => (n === 1 ? '1 fala' : `${n} falas`),
    emptyTitle: 'Nenhuma cena guardada por enquanto',
    emptyBody:
      'Durante uma partida, o anfitrião pode marcar "guardar esta cena" antes de rodar a renderização. Ela cai aqui, pronta para outro grupo jogar.',
    remove: 'Tirar do catálogo',
    removeTitle: 'Tirar esta cena?',
    removeBody:
      'O vídeo, as faixas separadas e o corte serão apagados. As cenas já iniciadas a partir dela param de funcionar. Não tem volta.',
    publish: 'Publicar na comunidade',
    published: 'Esta cena está na comunidade',
    seeInCommunity: 'Ver na comunidade',
    publishRecipeHelp:
      'Só o link e o corte serão compartilhados. O vídeo não fica hospedado aqui.',
    publishFromCatalogue:
      'Esta cena veio do catálogo: já está lá. Publicar de novo deixaria duas cópias que ninguém sabe diferenciar.',
    publishTooLate:
      'Esta cena veio de um arquivo importado, e a mídia dela foi apagada depois da renderização. Compartilhar teria que ter sido decidido antes. Uma cena importada por link, essa continua publicável a qualquer momento.',
    keepLabel: 'Guardar esta cena para jogar de novo',
    keepHelp:
      'Ela vai para a aba Comunidade depois da renderização, com o corte e os personagens. As gravações de vocês nunca são guardadas.',
  },

  theme: {
    label: 'Visual',
    retro: 'Retrô',
    modern: 'Moderno',
  },

  terms: {
    consent: 'Li e aceito as {terms} e a {privacy}.',
    linkTerms: 'condições de uso',
    linkPrivacy: 'política de privacidade',
    required: 'É preciso aceitar as condições para continuar.',
    gateTitle: 'Mais uma coisa',
    gateBody:
      'As condições de uso mudaram desde a sua última visita, ou você nunca as aceitou. Uma caixinha e voltamos ao jogo.',
    gateGist:
      'O essencial: você responde pelos trechos que importa e pelo que faz com eles. Tudo fica entre convidados, nada é publicado.',
    gateConfirm: 'Aceitar e continuar',
  },

  legal: {
    mentions: 'Aviso legal',
    privacy: 'Privacidade',
    terms: 'Condições',
    usageNotice:
      'Uso estritamente privado, entre pessoas convidadas. Nenhum conteúdo é divulgado publicamente nem indexado.',
    contact: 'Contato',
    contactEmail: 'ienders.pro@gmail.com',
  },

  common: {
    loading: 'Carregando…',
    save: 'Salvar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    delete: 'Excluir',
    back: 'Voltar',
    retry: 'Tentar de novo',
    close: 'Fechar',
    copy: 'Copiar',
    copied: 'Copiado',
    unknownError: 'Aconteceu um erro inesperado.',
  },

  auth: {
    title: 'Entrar',
    subtitle: 'A gente manda um link, você clica, pronto.',
    emailLabel: 'Seu endereço de e-mail',
    emailPlaceholder: 'nome@exemplo.com.br',
    send: 'Me mandar um link',
    sending: 'Enviando…',
    sent: 'Link enviado. Dá uma olhada no seu e-mail.',
    notAllowed:
      'Este endereço não está na lista de convidados. Peça ao anfitrião para adicionar você.',
    errorTitle: 'Não deu para entrar',
    backToSignIn: 'Voltar para a tela de acesso',
    signOut: 'Sair',

    signIn: 'Entrar',
    passwordLabel: 'Sua senha',
    badCredentials: 'Endereço ou senha incorretos.',
    rateLimited:
      'Links demais pedidos nesta hora. Peça ao anfitrião para mandar um direto, ou entre com a sua senha.',
    switchToPassword: 'Tenho senha, quero entrar direto',
    switchToLink: 'Não tenho senha, me mandem um link',
    inviteOnly: 'O acesso é só para endereços convidados.',
    discord: 'Continuar com o Discord',
    orSeparator: 'ou por e-mail',
    notAllowedWith: (email: string) =>
      `O endereço ${email} não está na lista de convidados. Peça ao anfitrião para adicioná-lo. Se você entrou pelo Discord, vale o endereço da sua conta do Discord.`,

    passwordSectionTitle: 'Senha',
    passwordSectionHelp: 'Defina uma para voltar sem passar pelo e-mail.',
    passwordNew: 'Nova senha',
    passwordSave: 'Salvar a senha',
    passwordSaved: 'Senha salva. Dá para usar já no próximo acesso.',
    passwordTooShort: 'No mínimo oito caracteres.',
  },

  guests: {
    title: 'Convidados',
    help: 'Só estes endereços entram. No Discord vale o endereço da conta do Discord, que nem sempre é o de sempre.',
    add: 'Convidar',
    joined: 'Já veio',
    pending: 'Nunca veio',
    remove: 'Tirar da lista',
  },

  sessions: {
    title: 'Minhas cenas',
    empty: 'Nenhuma cena por enquanto. Importe uma para começar.',
    create: 'Nova cena',
    open: 'Abrir',
    storageUsed: (used: string, total: string) => `${used} de ${total}`,
    storageWarning: 'O espaço está acabando. Exclua cenas antigas para abrir lugar.',
    deleteConfirmTitle: 'Excluir esta cena?',
    deleteConfirmBody:
      'A mixagem final, as tomadas e todos os metadados serão apagados. Não tem volta.',
    joinByCode: 'Entrar com um código',
    join: 'Entrar',
    storageTitle: 'Espaço usado',
    storageHelp:
      'O vídeo de origem e as faixas separadas são apagados assim que existe uma renderização: só o resultado final ocupa espaço de forma duradoura. Excluir uma cena libera o espaço dela.',
    codePlaceholder: 'ABC234',
    codeNotFound: 'Nenhuma cena corresponde a esse código.',
  },

  create: {
    title: 'Nova cena',
    tabUpload: 'Importar um arquivo',
    tabYoutube: 'Colar um link do YouTube',
    songLabel: 'É uma música',
    songHelp:
      'Pulamos a transcrição: a letra você já sabe. O corte segue a voz da faixa e avisa quando entrar.',
    matchTitle: 'Esta cena já existe',
    matchBody:
      'Alguém já preparou: o corte, os personagens e o texto estão prontos. Pegar essa começa na hora, em vez de esperar vários minutos pelo mesmo resultado.',
    matchLines: 'As falas a dizer',
    matchUse: 'Partir desta cena',
    matchScratch: 'Refazer do zero',
    tabPack: 'Partir de um pack',
    packHelp:
      'Nada para preparar: a cena já está cortada, vocês escolhem os papéis e gravam. O catálogo completo está na aba Comunidade.',
    titleLabel: 'Título da cena',
    titlePlaceholder: 'O duelo na ponte',
    dropzone: 'Solte seu MP4 aqui, ou clique para escolher',
    fileTooLarge: 'Arquivo pesado demais: no máximo 2 GB.',
    wrongType: 'Precisa de um arquivo de vídeo (MP4 de preferência).',
    youtubeLabel: 'Link do vídeo',
    youtubePlaceholder: 'https://www.youtube.com/watch?v=…',
    youtubeWarning:
      'Baixar do YouTube é uma conveniência, não uma garantia: quebra com frequência. Se não der certo, importe o arquivo direto.',
    multiTrackWarning:
      'Se a sua fonte tiver várias faixas de áudio (dublada, original, comentários), a dublada é a primeira.',
    durationWarning: 'A cena precisa ter menos de 10 minutos.',
    keepLabel: 'Transformar em cena compartilhada',
    keepHelpUrl:
      'Ela vai para a aba Comunidade. Como vem de um link, só o link e o corte são guardados: nada fica hospedado aqui.',
    keepHelpUpload:
      'Ela vai para a aba Comunidade depois da renderização. Como vem de um arquivo, o vídeo e as faixas separadas são guardados, uns dez megabytes.',
    submitUpload: 'Importar e preparar',
    submitYoutube: 'Baixar e preparar',
    uploading: 'Enviando o arquivo…',
  },

  ingest: {
    title: 'Preparando a cena',
    subtitle: 'A cena está sendo cortada. Leva alguns minutos.',
    queued: 'O processamento está demorando a começar.',
    queuedHelp:
      'Costuma pegar sozinho. Se demorar, avise quem hospeda a cena.',
    failed: 'A importação falhou.',
    retry: 'Rodar a importação de novo',
    neverStarted:
      'A importação nunca começou: o envio do arquivo provavelmente falhou. Rode de novo, ou comece uma cena nova.',
    hostPreparing: 'O anfitrião está acertando os personagens. O lobby abre já já.',
    startOver: 'Nova cena',
  },

  prepare: {
    title: 'Preparar os personagens',
    subtitle:
      'A detecção automática erra de personagem com frequência. É a hora de corrigir: depois que o lobby abrir, não dá mais para mudar.',
    charactersHeading: 'Personagens detectados',
    linesHeading: 'Falas',
    linesOf: (name: string) => `Falas de ${name}`,
    showAllLines: 'Ver tudo',
    lineCount: (n: number) => (n === 1 ? '1 fala' : `${n} falas`),
    speakTime: 'Tempo de fala',
    playLongest: 'Ouvir o trecho mais longo',
    rename: 'Renomear',
    merge: 'Juntar',
    mergeInto: (name: string) => `Juntar em ${name}`,
    mergeHint: 'Selecione pelo menos dois personagens para juntá-los.',
    mergeConfirm: (from: string, to: string) =>
      `Todas as falas de ${from} vão para ${to}. ${from} será excluído.`,
    splitToNew: 'Mover para um personagem novo',
    reassign: 'Reatribuir a…',
    assignedTo: 'Atribuída a',
    changeCharacter: 'Trocar de personagem',
    selectedCount: (n: number) =>
      n === 1 ? '1 fala selecionada →' : `${n} falas selecionadas →`,
    howTitle: 'Confira quem fala o quê',
    howBody:
      'Cada fala traz o nome do personagem a quem ela pertence. Clique nesse nome para passá-la a outro. À esquerda, renomeie um personagem ou junte duas vozes que a detecção separou por engano.',
    selectAll: 'Selecionar tudo',
    selectNone: 'Limpar a seleção',
    deleteLine: 'Excluir a fala',
    deleteLineHint: 'O áudio original fica preservado nesse ponto.',
    textIsAGuide: 'O texto é só um guia de tempo. Corrija só se estiver ilegível.',
    openLobby: 'Abrir o lobby',
    openLobbyConfirm: 'Depois que o lobby abrir, personagens e falas não mudam mais.',
    lockedAfterLobby: 'O preparo está travado desde que o lobby abriu.',
    recalculating: 'Recalculando os clipes…',
    noSelection: 'Selecione falas para movê-las.',
    restoreLine: 'Restaurar a fala',
    deletedBadge: 'Excluída, áudio original mantido',
  },

  lobby: {
    title: 'Lobby',
    shareLink: 'Link para compartilhar',
    shareCode: 'Código da cena',
    watchOriginal: 'Ver a cena no original',
    characters: 'Personagens',
    takeCharacter: 'Pegar este personagem',
    dropCharacter: 'Largar este personagem',
    releaseCharacter: 'Deixar no original',
    unrelease: 'Liberar de novo',
    releasedBadge: 'Original mantido',
    takenBy: (name: string) => `Pego por ${name}`,
    free: 'Livre',
    ready: 'Estou pronto',
    notReady: 'Não estou mais pronto',
    readyBadge: 'Pronto',
    waitingBadge: 'Esperando',
    players: 'Jogadores',
    start: 'Começar a partida',
    startBlockedTitle: 'Ainda falta alguma coisa:',
    startBlockedCharacters:
      'personagens sem jogador, para pegar ou deixar no original:',
    startBlockedReady: 'jogadores que não se declararam prontos:',
    clipCount: (n: number) => (n === 1 ? '1 clipe' : `${n} clipes`),
    hostOnly: 'Só o anfitrião pode começar a partida.',
  },

  studio: {
    title: 'Estúdio',
    clipProgress: (current: number, total: number) => `Clipe ${current} / ${total}`,
    playOriginal: 'Ver a cena (original)',
    record: 'Gravar',
    stop: 'Parar',
    playTake: 'Minha tomada',
    redo: 'Refazer',
    validate: 'Guardar e seguir',
    finish: 'Terminei',
    takeSaved: 'Tomada salva.',
    backToClips: 'Voltar aos meus clipes',
    allTakesSaved:
      'Todas as suas tomadas estão salvas. Dá para fechar a página: o anfitrião roda a renderização quando todo mundo terminar. Você também pode refazer alguma enquanto a renderização não começar.',
    validated: 'Guardada',
    previous: 'Anterior',
    next: 'Próximo',
    backingVolume: 'Fundo sonoro',
    micOffset: 'Atraso do microfone',
    micOffsetHelp:
      'Se as suas tomadas caem sempre atrasadas, abaixe este valor. Ele é aplicado na mixagem.',
    calibrate: 'Calibrar automaticamente',
    calibrating: 'Calibrando… fique em silêncio.',
    calibrationDone: (ms: number) => `Atraso medido: ${ms} ms.`,
    calibrationFailed: 'Não deu para medir o atraso. Ajuste na mão se precisar.',
    micDenied: 'O navegador recusou o microfone. Autorize e recarregue a página.',
    headphonesRequired:
      'Fone obrigatório. Enquanto grava você só ouve a música, nunca as vozes originais.',
    overflowWarning:
      'Sua tomada passa da janela, o fim vai ser cortado. Faça mais curta.',
    speechZone: 'Zona de fala',
    margin: 'Margem',
    noTake: 'Nenhuma tomada para este clipe.',
    uploading: 'Enviando a tomada…',
    noCharacter:
      'Nenhum personagem foi atribuído a você nesta cena. Dá para acompanhar os outros por aqui.',
    fxTitle: 'Mesa de voz',
    fxReset: 'Zerar tudo',
    fxReverb: 'Reverb',
    fxPitch: 'Altura',
    fxTune: 'Afinação',
    fxHelp:
      'Os efeitos entram na mixagem, nunca na gravação: dá para mudar até o render, ou voltar à voz crua.',
    fxPresets: {
      dry: 'Voz crua',
      room: 'Sala pequena',
      cathedral: 'Catedral',
      cartoon: 'Desenho',
      deep: 'Voz grave',
      cover: 'Cover',
    },
    emptyTake:
      'Nada foi gravado. Confere se o seu microfone está conectado e selecionado, e grave de novo.',
    whereEveryoneIs: 'Como está o grupo',
    you: '(você)',
    hostTag: '(anfitrião)',
    stateVo: 'No original',
    stateDone: 'Pronto',
    stateRecording: 'Gravando',
    waitingHost: 'Esperando o anfitrião iniciar a mixagem.',
    hostCanRender: 'Todo mundo terminou: você já pode iniciar a mixagem.',
    stillMissing: 'Ainda faltam falas para gravar.',
    finishedTitle: 'Você terminou!',
    finishedBody:
      'Ainda dá para voltar e refazer uma tomada enquanto a renderização não começa.',
    waitingFor: 'Ainda esperando:',
    playerProgress: (name: string, done: number, total: number) =>
      `${name} (${done}/${total})`,
    everyoneDone: 'Todo mundo terminou. O anfitrião pode rodar a renderização.',
    othersDone: 'Os outros terminaram. Só falta você.',
    soloScene: 'Você está sozinho nesta cena.',
    soloHint: 'Todos os personagens são seus: ninguém para esperar.',
    launchRender: 'Rodar a renderização',
    renderBlocked: 'Ainda há clipes sem nenhuma tomada.',
    kick: 'Remover este jogador',
    kickConfirm: (name: string) =>
      `${name} será removido e os personagens dele voltam ao áudio original. As tomadas dele serão ignoradas.`,
    reassignInstead: 'Passar o personagem dele para outra pessoa',
    kicked: 'O anfitrião removeu você desta cena.',
    myClips: 'Meus clipes',
    youAreDubbing: 'Você está dublando',
    cueIn: 'Sua vez em',
    cueNow: 'SUA VEZ',
    cueDone: 'Fala já passou',
    cueIdle: 'Pronto',
    originalTrace: 'O traço colorido mostra quando a voz original fala.',
    micWindow: 'O microfone só abre na sua fala.',
    autoAlign: 'Ajuste automático',
    autoAlignHelp:
      'Sua tomada é comparada com a voz original e reposicionada no lugar certo. Desmarque se preferir manter o seu tempo exato.',
    alignedBy: (ms: number) =>
      ms === 0
        ? 'Sua tomada já caía certinho.'
        : ms > 0
          ? `Você estava ${ms} ms atrasado, já foi corrigido.`
          : `Você estava ${-ms} ms adiantado, já foi corrigido.`,
    alignUnsure: 'O ajuste não achou nada claro nesta tomada. Ela fica como está.',
  },

  progress: {
    preparing: 'Preparando a cena',
    rendering: 'Montando o resultado',
    queued: 'Na fila. Começa sozinho daqui a pouco.',
    working: 'Conte alguns minutos. Dá para deixar a aba aberta e voltar depois.',
    almost: 'Quase lá.',
    longer: 'Está demorando mais que o normal, mas continua rodando. Deixa terminar.',
  },
  render: {
    title: 'Renderizando',
    queued: 'Esperando o worker. Rode o script no seu PC.',
    frozen: 'A cena está congelada: as tomadas não mudam mais.',
    failed: 'A renderização falhou.',
    retry: 'Rodar a renderização de novo',
  },

  result: {
    title: 'O resultado',
    download: 'Baixar o MP4',
    exportTitle: 'Levar a cena',
    formatWide: 'Formato largo',
    formatWideHint: 'Para tela de computador ou televisão.',
    formatVertical: 'Formato celular',
    formatVerticalHint: 'Cortado no centro, para stories e reels.',
    formatVerticalMissing:
      'Esta cena foi renderizada antes do corte automático. Rode o render de novo para obtê-lo.',
    share: 'Compartilhar',
    shareHelp:
      'No celular, Compartilhar abre o menu do sistema: TikTok, Instagram e os outros apps instalados aparecem ali.',
    shareUnsupported:
      'Este navegador não consegue compartilhar um arquivo. Baixe e publique pelo app.',
    cast: 'O elenco',
    voiceOriginal: 'Original mantido',
    shareHint: 'O link só funciona para quem participa desta cena.',
    sourcePurged: 'A fonte foi apagada: só a mixagem final fica.',
  },

  errors: {
    notFound: 'Não encontrado.',
    forbidden: 'Você não tem acesso a esta cena.',
    sessionLocked: 'Esta cena não pode mais ser alterada.',
    hostOnly: 'Só o anfitrião pode fazer isso.',
    noAudioTrack: 'Este arquivo não tem faixa de áudio.',
    noVideoTrack: 'Este arquivo não tem vídeo.',
    tooLong: 'Cena longa demais: no máximo 10 minutos.',
    youtubeFailed: 'O download do YouTube falhou. Importe o arquivo de vídeo direto.',
  },
} satisfies Dictionary;
