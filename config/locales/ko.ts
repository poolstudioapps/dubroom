/**
 * 한국어 사전.
 *
 * `fr`와 키가 일대일로 대응한다. 컴파일러가 검사한다.
 * 원문과 같이 친구끼리 노는 말투에 맞춘 해요체.
 */

import type { Dictionary } from '../i18n';

export const ko = {
  nav: {
    home: '홈',
    homeShort: '홈',
    sessions: '내 장면',
    sessionsShort: '장면',
    community: '커뮤니티',
    communityShort: '커뮤니티',
    myPacks: '내 팩',
    myPacksShort: '내 팩',
  },

  account: {
    title: '내 계정',
    subtitle: '이름과 사진은 모든 장면에 따라갑니다. 다른 참가자에게도 보입니다.',
    menuLabel: '내 계정과 로그아웃',
    menuHint: '이름, 사진, 접속',
    photo: '프로필 사진',
    photoAdd: '사진 추가',
    photoChange: '사진 변경',
    photoRemove: '삭제',
    photoHelp: 'PNG, JPEG, WebP로 최대 2 MB. 다른 초대된 사람에게도 보입니다.',
    displayName: '표시 이름',
    displayNameHelp: '로비와 완성본 크레딧에 나오는 이름입니다.',
    saved: '저장했습니다.',
    accessTitle: '내 접속',
    email: '이메일 주소',
    method: '로그인 방식',
    methodEmail: '이메일 링크',
    since: '가입일',
    emailLocked:
      '주소는 여기서 바꿀 수 없습니다. 초대 목록에 올라 있는 것이 이 주소이기 때문입니다. 변경은 운영자에게 문의하세요.',
  },

  myPacks: {
    title: '내 팩',
    subtitle:
      '공개한 장면입니다. 누구나 다시 할 수 있고, 내리는 건 본인만 할 수 있습니다.',
    sceneCount: (n: number) => `공개한 장면 ${n}개`,
    emptyTitle: '아직 공개한 것이 없습니다',
    emptyBody:
      '링크로 가져온 장면은 끝난 뒤에 공개할 수 있습니다. 링크와 구간만 커뮤니티로 넘어가고 영상은 넘어가지 않습니다.',
  },

  home: {
    originalScene: '원본 장면',
    demoLines: [
      { name: 'Alba', text: '이 문이 맞는 거 확실해?' },
      { name: 'Rem', text: '전혀.' },
      { name: 'Noor', text: '그래도 간다.' },
    ],
    carouselLabel: '작동 방식',
    rythmoLabel: '리드모 밴드 미리보기: 더빙하는 동안 재생 헤드 아래로 텍스트가 흐릅니다.',
    heroTitle: '좋아하는 장면을 다시 더빙하세요',
    heroBody:
      '장면을 고르고, 각자 배역을 하나씩 맡아, 각자 편한 때에 녹음합니다. 원래 음악과 현장음은 그대로 두고 목소리만 바뀝니다. 결과는 마지막에 다 같이 확인합니다.',
    kicker: '친구끼리 하는 더빙 스튜디오',
    cta: '스튜디오로',
    ctaSessions: '내 장면 보기',
    ctaCommunity: '준비된 장면 둘러보기',
    howTitle: '진행 방식',
    reassure1: '설치할 것 없음',
    reassure2: '녹음은 각자 편할 때',
    reassure3: '공개되지 않음',

    valueTitle: '무엇이 나오나',
    value1: {
      title: '그들의 목소리 대신 당신의 목소리',
      body: '집에서 헤드셋 마이크로 녹음합니다. 원래 음악과 효과음은 그대로 두고 목소리만 바뀝니다.',
    },
    value2: {
      title: '끝날 때까지 아무도 듣지 못합니다',
      body: '완성본이 나오기 전까지 내 녹음은 다른 사람에게 들리지 않습니다. 마지막에 다 같이 확인하는 것이 이 놀이의 전부입니다.',
    },
    value3: {
      title: '남는 MP4 하나',
      body: '마지막에 어디서나 재생되는 파일이 남습니다. 자막은 입혀지지 않습니다. 원본 장면 쪽은 지워집니다.',
    },

    midCta: '장면을 고르고, 배역을 나누고, 어떻게 되는지 보세요.',

    packsCtaTitle: '아직 공개한 팩이 없습니다',
    packsCtaBody:
      '링크로 가져온 장면은 커뮤니티에 공유할 수 있습니다. 링크와 구간이면 충분하고 영상은 보관되지 않습니다. 다른 사람은 배역만 고르면 됩니다.',
    packsCtaAction: '장면 준비하기',

    faqTitle: '자주 묻는 것',
    seoTitle: '친구들과 영화 장면 더빙하기',
    defineTitle: '영화 장면 더빙이란',
    defineBody:
      '영화 장면을 더빙한다는 것은 화면, 음악, 효과음, 리듬을 그대로 두고 원래 목소리만 내 목소리로 바꾸는 일입니다. 위에 해설을 얹는 게 아니라, 장면 자체를 다른 연기자로 다시 하는 것입니다. Dub’Up은 그 작업을 브라우저에서 하는 온라인 더빙 소프트웨어입니다.',
    defineHowTitle: '영화 장면을 직접 더빙하는 방법',
    defineHowBody:
      '집에는 없는 세 가지가 필요합니다. 목소리만 바꾸기 위해 목소리와 음악을 분리하는 것, 누가 언제 말하는지 밀리초 단위로 아는 것, 그리고 말하면서 타이밍을 맞추는 것. Dub’Up은 앞의 두 가지를 장면에서 자동으로 처리하고, 세 번째는 리드미 밴드로 풉니다. 재생 헤드 아래로 글자가 흐르는 이 방식은 더빙 스튜디오가 팔십 년째 쓰고 있습니다.',
    defineWhoTitle: '누구에게 쓸모가 있나',
    defineWhoBody:
      '명대사를 다시 해 보고 싶은 친구들, 편집 프로그램이 아닌 도구를 찾는 팬더빙 제작자, 학생들에게 한 대목을 더빙시키는 어학 교사, 그리고 스튜디오를 빌리지 않고 리드미 밴드로 연습하려는 성우 지망생에게.',
    faqExtra: [
      {
        q: '무료인가요?',
        a: '네. Dub’Up은 개인 프로젝트이며 광고도, 구독료도, 장면 수 제한도 없습니다.',
      },
      {
        q: '영상 편집 프로그램과 무엇이 다른가요?',
        a: '편집 프로그램은 빈 타임라인을 주고 테이크 정렬을 손에 맡깁니다. Dub’Up은 장면에서 출발합니다. 목소리를 분리하고, 대사를 찾고, 등장인물에 배정하고, 녹음을 원래 목소리에 자동으로 다시 맞춥니다.',
      },
      {
        q: '한국어 화면으로 영어 장면을 더빙할 수 있나요?',
        a: '가능합니다. 화면 언어와 장면 언어는 별개입니다. 받아쓴 글은 타이밍 안내이고, 그 위에 무엇을 말할지는 자유입니다.',
      },
      {
        q: '목소리와 음악은 어떻게 분리하나요?',
        a: '호스트 컴퓨터에서 도는 음원 분리 모델이 목소리와 음악·환경음 두 트랙을 돌려줍니다. 분리가 장면 자체에서 나오기 때문에 화면과 어긋나지 않습니다.',
      },
    ] as const,
    faq: [
      {
        q: '뭐가 필요한가요?',
        a: '마이크 달린 헤드셋과 브라우저입니다. 헤드셋은 사소한 게 아닙니다. 없으면 마이크가 원래 소리를 다시 녹음해서 믹스가 못 쓰게 됩니다.',
      },
      {
        q: '다 같이 동시에 있어야 하나요?',
        a: '아닙니다. 각자 편할 때 자기 대사를 녹음합니다. 모두 끝나면 렌더링이 시작됩니다.',
      },
      {
        q: '더빙을 할 줄 알아야 하나요?',
        a: '아닙니다. 실제 스튜디오처럼 텍스트가 재생 헤드 아래로 흐릅니다. 읽으면 타이밍이 맞습니다. 잘 안 된 테이크는 같은 조건으로 다시 하면 됩니다.',
      },
      {
        q: '얼마나 걸리나요?',
        a: '가져온 뒤 자동 준비에 몇 분, 그다음은 대사 분량만큼입니다. 2분짜리 장면이면 셋이서 30분쯤 걸립니다.',
      },
      {
        q: '녹음은 보관되나요?',
        a: '아닙니다. 완성본이 나오는 즉시 원본 영상과 함께 지워집니다.',
      },
      {
        q: '아무나 초대할 수 있나요?',
        a: '초대 목록에 추가된 주소만 들어올 수 있습니다. 주소 추가는 계정 화면에서 직접 합니다.',
      },
    ] as const,
    privateTitle: '네트워크가 아니라 사적인 방',
    privateBody:
      'Dub’Up은 초대된 사람만 쓸 수 있습니다. 공개 목록도, 바깥으로의 공유도, 검색 등록도 없습니다. 그래서 성립합니다. 보호받는 저작물의 일부를 친구끼리 더빙하되, 밖으로는 내보내지 않습니다.',
    slides: {
      importTitle: '대사까지 외우고 있는 그 장면을 고르세요',
      importBody:
        '링크 하나, 또는 파일 하나. 누가 어떤 역을 할지 정하는 사이에 장면은 이미 나뉘고, 목소리는 음악과 분리되고, 대사는 밀리초 단위로 자리를 잡습니다. 귀찮은 일은 고르기가 끝나기 전에 끝나 있습니다.',
      charactersTitle: '진짜 캐스팅처럼 배역을 나누세요',
      charactersBody:
        '등장인물은 이미 찾아냈고 이름도 붙어 있습니다. 각자 클릭 한 번으로 자기 배역을 가져가면 끝. 아무도 원하지 않은 배역은 원래 목소리를 그대로 두고, 완성본에서는 티가 나지 않습니다.',
      rythmoTitle: '글자가 흘러갑니다. 여러분은 연기만 하면 됩니다',
      rythmoBody:
        '진짜 스튜디오처럼 대사가 재생 헤드 아래로 지나갑니다. 맞출 것도, 편집을 배울 것도 없습니다. 읽으면 맞습니다. 잘 안 된 테이크는 2초면 다시, 몇 번이든.',
      renderTitle: '그리고 재생 버튼을 누르는 순간이 옵니다',
      renderBody:
        '아무도 다른 사람 목소리를 듣지 못했습니다. 장면이 다시 돌아가고, 화면과 음악은 그대로인데, 등장인물의 입에서 나오는 건 여러분의 목소리입니다. 나머지 전부가 이 1분을 위해 있습니다.',
    },
  },

  community: {
    title: '더빙할 수 있는 장면',
    subtitle:
      '이미 가져오고, 분리하고, 구간을 나눈 장면들입니다. 배역만 고르면 됩니다. 기다릴 것도, 준비를 다시 할 것도 없습니다.',
    play: '이 장면 더빙하기',
    preview: '미리보기',
    openSource: '원본 열기',
    kindRecipe: '레시피',
    kindMedia: '파일 보관',
    recipeHelp:
      '이 장면은 여기 보관되지 않습니다. 링크와 구간만 저장돼 있습니다. 시작할 때 영상을 다시 받아오므로 몇 분 걸립니다.',
    mediaHelp: '여기에 보관된 장면입니다. 바로 시작됩니다.',
    mine: '내 것',
    voteUp: '이 장면은 구간이 잘 나뉘어 있다',
    voteDown: '이 장면은 구간이 잘못 나뉘어 있다',
    voteScore: (n: number) => `커뮤니티 점수: ${n}`,
    voteHelp:
      '평가 대상은 영화가 아니라 구간 나누기입니다. 잘 나뉜 장면은 모두의 저녁 한 번을 아껴 줍니다.',
    sort: {
      label: '정렬',
      popular: '평가 높은 순',
      recent: '최신순',
      short: '짧은 순',
      title: '제목순',
    },
    filterLang: '장면 언어',
    filterGenre: '장르',
    filterCast: '배역 수',
    filterLength: '길이',
    filterAll: '전체',
    filterAllGenres: '모든 장르',
    filterAnyCast: '상관없음',
    filterAnyLength: '상관없음',
    filterReset: '전부 보기',
    filterNoMatch: '조건에 맞는 장면이 없습니다',
    filterNoMatchBody: '조건을 넓히거나, 목록에 없는 장면을 직접 공개해 보세요.',
    langUnknown: '언어 모름',
    langNames: {
      fr: '프랑스어',
      en: '영어',
      es: '스페인어',
      de: '독일어',
      it: '이탈리아어',
      pt: '포르투갈어',
      ja: '일본어',
      ko: '한국어',
      zh: '중국어',
      ru: '러시아어',
    } as Record<string, string>,
    genreNames: {
      action: '액션',
      comedie: '코미디',
      drame: '드라마',
      animation: '애니메이션',
      anime: '애니메이션',
      serie: '드라마',
      super_heros: '히어로',
      science_fiction: 'SF',
      horreur: '공포',
      jeu_video: '게임',
      chanson: '노래',
      documentaire: '다큐멘터리',
      autre: '기타',
    } as Record<string, string>,
    castBuckets: {
      solo: '1 배역',
      duo: '2 배역',
      small: '3~4 배역',
      large: '5 배역 이상',
    } as Record<string, string>,
    lengthBuckets: {
      short: '1분 미만',
      medium: '1~3분',
      long: '3분 이상',
    } as Record<string, string>,
    sceneCount: (n: number) => `이용할 수 있는 장면 ${n}개`,
    characterCount: (n: number) => `등장인물 ${n}명`,
    lineCount: (n: number) => `대사 ${n}개`,
    emptyTitle: '아직 보관된 장면이 없습니다',
    emptyBody:
      '게임 중에 호스트가 렌더링 전에 "이 장면 보관"을 선택할 수 있습니다. 그러면 여기 올라와서 다른 그룹이 할 수 있게 됩니다.',
    remove: '목록에서 내리기',
    removeTitle: '이 장면을 내릴까요?',
    removeBody:
      '영상, 분리한 트랙, 구간이 삭제됩니다. 이걸로 이미 시작한 장면은 작동을 멈춥니다. 되돌릴 수 없습니다.',
    publish: '커뮤니티에 공개',
    published: '이 장면은 커뮤니티에 있습니다',
    seeInCommunity: '커뮤니티에서 보기',
    publishRecipeHelp:
      '공유되는 것은 링크와 구간뿐입니다. 영상은 여기 보관되지 않습니다.',
    publishFromCatalogue:
      '이 장면은 목록에서 가져온 것이라 이미 등록돼 있습니다. 다시 올리면 구분할 수 없는 중복이 생깁니다.',
    publishTooLate:
      '이 장면은 가져온 파일로 만들었고, 소재는 렌더링 뒤에 지워졌습니다. 공유하려면 그 전에 정했어야 합니다. 링크로 가져온 장면이라면 언제든 공개할 수 있습니다.',
    keepLabel: '다시 할 수 있게 이 장면 보관',
    keepHelp:
      '렌더링이 끝나면 구간과 등장인물째로 커뮤니티 탭에 들어갑니다. 녹음 쪽은 절대 보관되지 않습니다.',
  },

  theme: {
    label: '디자인',
    retro: '레트로',
    modern: '모던',
  },

  terms: {
    consent: '{terms}과 {privacy}을 읽고 동의합니다.',
    notice: '계속하면 {terms} 및 {privacy}에 동의하는 것으로 간주됩니다.',
    linkTerms: '이용약관',
    linkPrivacy: '개인정보 처리방침',
    required: '계속하려면 동의가 필요합니다.',
    gateTitle: '하나만 더',
    gateBody:
      '시작하기 전에 이용약관에 동의해야 합니다. 체크 한 번이면 됩니다.',
    gateGist:
      '핵심은 이렇습니다. 가져온 영상과 그 사용에 대한 책임은 본인에게 있습니다. 모든 것은 초대된 사람들 사이에만 머물고, 공개되지 않습니다.',
    gateConfirm: '동의하고 계속하기',
  },

  legal: {
    mentions: '운영자 정보',
    privacy: '개인정보',
    terms: '이용약관',
    usageNotice:
      '초대된 사람들 사이의 엄격히 사적인 이용입니다. 어떤 내용도 공개 배포되거나 검색에 등록되지 않습니다.',
    contact: '문의',
    contactEmail: 'ienders.pro@gmail.com',
  },

  status: {
    draft: '초안',
    ingest_queued: '대기 중',
    ingesting: '가져오는 중',
    ingest_failed: '가져오기 실패',
    prepping: '준비 필요',
    lobby: '로비 열림',
    recording: '녹음 중',
    render_queued: '렌더링 대기',
    rendering: '렌더링 중',
    render_failed: '렌더링 실패',
    done: '완료',
  },

  common: {
    untitled: '제목 없는 장면',
    stepTitled: (n: number, titre: string) => `${n}단계: ${titre}`,
    scrollPause: '슬라이드 멈춤',
    scrollResume: '슬라이드 재개',
    step: (n: number, total: number) => `${total}단계 중 ${n}단계`,
    loading: '불러오는 중…',
    save: '저장',
    cancel: '취소',
    confirm: '확인',
    delete: '삭제',
    back: '뒤로',
    retry: '다시 시도',
    close: '닫기',
    copy: '복사',
    copied: '복사했습니다',
    unknownError: '예상치 못한 오류가 났습니다.',
  },

  auth: {
    linkExpired: '이 링크는 만료되었거나 이미 사용되었습니다. 로그인 링크는 한 시간 동안 한 번만 유효합니다. 새로 요청하세요.',
    linkUsed: '이 링크는 만료되었거나 이미 사용되었습니다. 새로 요청하세요.',
    linkIncomplete: '이 링크는 불완전합니다. 새로 요청하세요.',
    title: '로그인',
    subtitle: '링크를 보내 드립니다. 누르면 끝입니다.',
    emailLabel: '이메일 주소',
    emailPlaceholder: 'name@example.kr',
    send: '링크 보내기',
    sending: '보내는 중…',
    sent: '링크를 보냈습니다. 메일함을 확인하세요.',
    notAllowed: '이 주소는 초대 목록에 없습니다. 호스트에게 추가를 부탁하세요.',
    errorTitle: '로그인할 수 없습니다',
    backToSignIn: '로그인 화면으로 돌아가기',
    signOut: '로그아웃',

    signIn: '로그인',
    passwordLabel: '비밀번호',
    badCredentials: '주소나 비밀번호가 맞지 않습니다.',
    rateLimited:
      '한 시간 안에 링크를 너무 많이 요청했습니다. 호스트에게 직접 보내 달라고 하거나, 비밀번호로 로그인하세요.',
    switchToPassword: '비밀번호가 있어서 바로 로그인합니다',
    switchToLink: '비밀번호가 없으니 링크를 보내 주세요',
    inviteOnly: '초대된 주소만 이용할 수 있습니다.',
    discord: 'Discord로 계속하기',
    orSeparator: '또는 이메일로',
    notAllowedWith: (email: string) =>
      `${email}은(는) 초대 목록에 없습니다. 호스트에게 추가를 부탁하세요. Discord로 들어왔다면 Discord 계정 주소가 기준입니다.`,

    passwordSectionTitle: '비밀번호',
    passwordSectionHelp: '하나 정해 두면 메일을 거치지 않고 다시 들어올 수 있습니다.',
    passwordNew: '새 비밀번호',
    passwordSave: '비밀번호 저장',
    passwordSaved: '비밀번호를 저장했습니다. 다음 로그인부터 쓸 수 있습니다.',
    passwordTooShort: '최소 여덟 자입니다.',
  },

  guests: {
    title: '초대된 사람',
    help: '여기 있는 주소만 들어올 수 있습니다. Discord는 Discord 계정 주소가 기준이며, 늘 쓰는 주소와 다를 수 있습니다.',
    add: '초대',
    joined: '들어온 적 있음',
    pending: '들어온 적 없음',
    remove: '목록에서 빼기',
  },

  sessions: {
    joinTitle: '장면 참가',
    joinCode: '코드',
    title: '내 장면',
    empty: '아직 장면이 없습니다. 하나 가져와서 시작하세요.',
    create: '새 장면',
    open: '열기',
    storageUsed: (used: string, total: string) => `${total} 중 ${used}`,
    storageWarning: '저장 공간이 거의 찼습니다. 오래된 장면을 지워 자리를 만드세요.',
    deleteConfirmTitle: '이 장면을 삭제할까요?',
    deleteConfirmBody:
      '완성본, 테이크, 모든 메타데이터가 지워집니다. 되돌릴 수 없습니다.',
    joinByCode: '코드로 참여',
    join: '참여',
    storageTitle: '사용 중인 공간',
    storageHelp:
      '원본 영상과 분리한 트랙은 렌더링이 끝나는 즉시 지워집니다. 오래 남는 것은 완성본뿐입니다. 장면을 지우면 그만큼 비워집니다.',
    codePlaceholder: 'ABC234',
    codeNotFound: '이 코드에 맞는 장면이 없습니다.',
  },

  create: {
    title: '새 장면',
    tabUpload: '파일 가져오기',
    tabYoutube: 'YouTube 링크 붙여넣기',
    songLabel: '노래입니다',
    songHelp:
      '가사는 이미 알 테니 받아쓰기는 건너뜁니다. 구간은 곡의 보컬을 따라가며 들어갈 타이밍만 알려줍니다.',
    matchTitle: '이 장면은 이미 있습니다',
    matchBody:
      '누군가 이미 준비해 두었습니다. 구간, 배역, 대사가 모두 있습니다. 그대로 쓰면 같은 결과를 몇 분씩 기다릴 필요 없이 바로 시작합니다.',
    matchLines: '말할 대사',
    matchUse: '이 장면으로 시작하기',
    matchScratch: '처음부터 다시 만들기',
    tabPack: '팩에서 시작하기',
    packHelp:
      '준비할 게 없습니다. 장면은 이미 나뉘어 있으니 배역만 고르고 녹음하면 됩니다. 전체 목록은 커뮤니티 탭에 있습니다.',
    titleLabel: '장면 제목',
    titlePlaceholder: '다리 위의 결투',
    dropzone: 'MP4를 여기에 놓거나, 눌러서 고르세요',
    fileTooLarge: '파일이 너무 큽니다. 최대 2 GB입니다.',
    wrongType: '영상 파일이 필요합니다(가능하면 MP4).',
    youtubeLabel: '영상 링크',
    youtubePlaceholder: 'https://www.youtube.com/watch?v=…',
    youtubeWarning:
      'YouTube에서 받아오는 건 편의 기능이지 보장이 아닙니다. 자주 실패합니다. 안 되면 파일을 직접 가져오세요.',
    multiTrackWarning:
      '소스에 오디오 트랙이 여러 개면(더빙, 원어, 코멘터리 등) 첫 번째가 더빙 대상입니다.',
    durationWarning: '장면은 10분 미만이어야 합니다.',
    keepLabel: '공유 장면으로 만들기',
    keepHelpUrl:
      '커뮤니티 탭으로 들어갑니다. 링크에서 왔으므로 링크와 구간만 보관됩니다. 여기에는 아무것도 남지 않습니다.',
    keepHelpUpload:
      '링크로 만든 장면만 커뮤니티에 올릴 수 있습니다. 가져온 파일은 그룹 안에서만 비공개로 유지되며, 작품 자체를 다시 호스팅하지 않습니다.',
    submitUpload: '가져와서 준비',
    submitYoutube: '받아와서 준비',
    uploading: '파일 보내는 중…',
  },

  ingest: {
    title: '장면 준비',
    subtitle: '장면을 나누는 중입니다. 몇 분 걸립니다.',
    queued:
      '워커를 기다리는 중입니다.',
    queuedHelp:
      '호스트 PC에서 워커가 실행되면 바로 장면이 시작됩니다. start.bat을 실행하세요.',
    failed: '가져오기에 실패했습니다.',
    retry: '가져오기 다시 실행',
    neverStarted:
      '가져오기가 시작되지 않았습니다. 파일 전송이 실패했을 가능성이 큽니다. 다시 실행하거나 새 장면으로 시작하세요.',
    hostPreparing: '호스트가 등장인물을 정리하는 중입니다. 곧 로비가 열립니다.',
    startOver: '새 장면',
  },

  prepare: {
    selectCharacter: (nom: string) => `${nom} 선택`,
    selectLine: (code: string) => `${code} 대사 선택`,
    listen: '듣기',
    lineText: '대사 문구',
    title: '등장인물 정리',
    subtitle:
      '자동 판별은 화자를 자주 틀립니다. 지금이 고칠 때입니다. 로비를 열면 바꿀 수 없습니다.',
    charactersHeading: '찾아낸 등장인물',
    linesHeading: '대사',
    linesOf: (name: string) => `${name}의 대사`,
    showAllLines: '전부 보기',
    lineCount: (n: number) => `대사 ${n}개`,
    speakTime: '발화 시간',
    playLongest: '가장 긴 부분 듣기',
    rename: '이름 변경',
    merge: '합치기',
    mergeInto: (name: string) => `${name}(으)로 합치기`,
    mergeHint: '합치려면 등장인물을 둘 이상 고르세요.',
    mergeConfirm: (from: string, to: string) =>
      `${from}의 대사가 모두 ${to}(으)로 넘어갑니다. ${from}은(는) 삭제됩니다.`,
    splitToNew: '새 등장인물로 옮기기',
    reassign: '다시 배정…',
    assignedTo: '배정된 인물',
    changeCharacter: '등장인물 바꾸기',
    selectedCount: (n: number) => `대사 ${n}개 선택 →`,
    howTitle: '누가 무슨 말을 하는지 확인하세요',
    howBody:
      '대사마다 배정된 등장인물의 이름이 붙어 있습니다. 그 이름을 누르면 다른 인물에게 넘길 수 있습니다. 왼쪽에서는 이름을 바꾸거나, 판별이 잘못 나눈 두 목소리를 합칠 수 있습니다.',
    selectAll: '전체 선택',
    selectNone: '선택 해제',
    deleteLine: '대사 삭제',
    deleteLineHint: '그 자리의 원래 음성은 남습니다.',
    textIsAGuide: '텍스트는 타이밍 안내일 뿐입니다. 읽을 수 없을 때만 고치세요.',
    openLobby: '로비 열기',
    openLobbyConfirm: '로비를 열면 등장인물과 대사를 더 이상 바꿀 수 없습니다.',
    lockedAfterLobby: '로비를 연 뒤로 준비 단계는 잠겨 있습니다.',
    recalculating: '클립 다시 계산 중…',
    noSelection: '옮길 대사를 고르세요.',
    restoreLine: '대사 되돌리기',
    deletedBadge: '삭제됨, 원래 음성 유지',
  },

  lobby: {
    hostTag: '(호스트)',
    title: '로비',
    shareLink: '공유 링크',
    shareCode: '장면 코드',
    watchOriginal: '원본 장면 보기',
    characters: '등장인물',
    takeCharacter: '이 인물 맡기',
    dropCharacter: '이 인물 놓기',
    releaseCharacter: '원래 음성으로 두기',
    unrelease: '다시 비워 두기',
    releasedBadge: '원래 음성 유지',
    takenBy: (name: string) => `${name} 담당`,
    free: '비어 있음',
    ready: '준비됐습니다',
    notReady: '준비 취소',
    readyBadge: '준비 완료',
    waitingBadge: '대기 중',
    players: '참가자',
    start: '시작하기',
    startBlockedTitle: '아직 빠진 것이 있습니다:',
    startBlockedCharacters: '담당자가 없는 인물, 맡거나 원래 음성으로 두세요:',
    startBlockedReady: '아직 준비 완료를 누르지 않은 사람:',
    clipCount: (n: number) => `클립 ${n}개`,
    hostOnly: '시작은 호스트만 할 수 있습니다.',
  },

  studio: {
    fxNoTake: '먼저 이 대사를 녹음하세요. 그다음 테이크에 효과를 적용할 수 있습니다.',
    playBlocked: '브라우저가 재생을 차단했습니다. 버튼을 다시 눌러 주세요.',
    reassign: (nom: string) => `${nom} 재배정`,
    pickPlayer: '플레이어 선택…',
    title: '스튜디오',
    clipProgress: (current: number, total: number) => `클립 ${current} / ${total}`,
    playOriginal: '원본 장면 재생',
    record: '녹음',
    stop: '정지',
    playTake: '내 테이크',
    redo: '다시 하기',
    validate: '확정하고 다음',
    finish: '끝냈습니다',
    takeSaved: '테이크를 저장했습니다.',
    backToClips: '내 클립으로 돌아가기',
    allTakesSaved:
      '테이크가 모두 저장됐습니다. 페이지를 닫아도 됩니다. 모두 끝나면 호스트가 렌더링합니다. 렌더링이 시작되기 전까지는 다시 녹음할 수도 있습니다.',
    validated: '확정됨',
    previous: '이전',
    next: '다음',
    backingVolume: '배경음',
    micOffset: '마이크 지연',
    micOffsetHelp: '테이크가 늘 늦게 들어가면 이 값을 낮추세요. 믹싱 때 적용됩니다.',
    calibrate: '자동으로 맞추기',
    calibrating: '측정 중… 조용히 있어 주세요.',
    calibrationDone: (ms: number) => `측정된 지연: ${ms} ms.`,
    calibrationFailed: '지연을 측정하지 못했습니다. 필요하면 손으로 맞추세요.',
    micDenied: '브라우저가 마이크를 거부했습니다. 허용한 뒤 페이지를 새로고침하세요.',
    headphonesRequired:
      '헤드폰이 필요합니다. 녹음 중에는 음악만 들리고 원래 목소리는 들리지 않습니다.',
    overflowWarning: '테이크가 구간을 넘어갑니다. 끝이 잘립니다. 더 짧게 다시 하세요.',
    speechZone: '발화 구간',
    margin: '여유',
    noTake: '이 클립에는 테이크가 없습니다.',
    uploading: '테이크 보내는 중…',
    noCharacter:
      '이 장면에서 배정된 배역이 없습니다. 여기서 다른 사람들의 진행 상황을 볼 수 있습니다.',
    fxTitle: '보이스 콘솔',
    fxReset: '전부 초기화',
    fxReverb: '리버브',
    fxPitch: '음높이',
    fxTune: '음정 보정',
    fxHelp:
      '효과는 지금 보이는 테이크에만 적용됩니다. 녹음 자체가 아니라 믹싱 때 더해지므로, 렌더링 전까지 언제든 바꾸거나 뺄 수 있습니다.',
    fxPresets: {
      dry: '원래 목소리',
      room: '작은 방',
      cathedral: '대성당',
      cartoon: '만화 목소리',
      deep: '낮은 목소리',
      cover: '커버',
    },
    emptyTake:
      '아무것도 녹음되지 않았습니다. 마이크가 연결되고 선택돼 있는지 확인한 뒤 다시 녹음하세요.',
    whereEveryoneIs: '모두의 진행 상황',
    you: '(나)',
    hostTag: '(호스트)',
    stateVo: '원음 유지',
    stateDone: '완료',
    stateRecording: '녹음 중',
    waitingHost: '호스트가 렌더링을 시작하기를 기다리는 중입니다.',
    hostCanRender: '모두 끝났습니다. 렌더링을 시작할 수 있습니다.',
    stillMissing: '아직 녹음할 대사가 남아 있습니다.',
    finishedTitle: '끝났습니다!',
    finishedBody: '렌더링이 시작되기 전까지는 돌아와서 테이크를 다시 할 수 있습니다.',
    waitingFor: '아직 기다리는 사람:',
    playerProgress: (name: string, done: number, total: number) =>
      `${name} (${done}/${total})`,
    everyoneDone: '모두 끝냈습니다. 호스트가 렌더링할 수 있습니다.',
    othersDone: '다른 사람들은 끝냈습니다. 이제 당신만 남았습니다.',
    soloScene: '이 장면에는 당신 혼자입니다.',
    soloHint: '등장인물이 모두 당신 담당입니다. 기다릴 사람이 없습니다.',
    launchRender: '렌더링 시작',
    renderBlocked: '테이크가 없는 클립이 남아 있습니다.',
    kick: '이 참가자 내보내기',
    kickConfirm: (name: string) =>
      `${name}을(를) 내보내면 담당하던 인물은 원래 음성으로 돌아갑니다. 그 사람의 녹음은 쓰이지 않습니다.`,
    reassignInstead: '담당 인물을 다른 사람에게 넘기기',
    kicked: '호스트가 이 장면에서 당신을 내보냈습니다.',
    myClips: '내 클립',
    youAreDubbing: '담당',
    cueIn: '차례까지',
    cueNow: '당신 차례',
    cueDone: '대사가 지나갔습니다',
    cueIdle: '대기',
    originalTrace: '색이 있는 파형은 원래 목소리가 말하는 지점을 보여 줍니다.',
    micWindow: '마이크는 내 대사 구간에만 열립니다.',
    autoAlign: '자동 위치 맞춤',
    autoAlignHelp:
      '테이크를 원래 목소리와 견주어 제자리에 다시 놓습니다. 내 타이밍을 그대로 두고 싶으면 끄세요.',
    alignedBy: (ms: number) =>
      ms === 0
        ? '테이크가 이미 제자리였습니다.'
        : ms > 0
          ? `${ms} ms 늦었는데, 맞춰 놓았습니다.`
          : `${-ms} ms 빨랐는데, 맞춰 놓았습니다.`,
    alignUnsure: '이 테이크에서는 뚜렷한 기준을 찾지 못했습니다. 그대로 놓습니다.',
  },

  progress: {
    preparing: '장면을 준비하는 중',
    rendering: '결과물을 만드는 중',
    queued:
      '대기 중: 호스트의 워커가 실행되면 바로 처리됩니다.',
    working: '몇 분 걸립니다. 탭을 열어 둔 채 나중에 돌아와도 됩니다.',
    almost: '거의 다 됐습니다.',
    longer: '평소보다 오래 걸리고 있지만 계속 돌아가는 중입니다. 그대로 두세요.',
  },
  render: {
    title: '렌더링 중',
    queued:
      '워커를 기다리는 중입니다.',
    frozen: '장면이 확정됐습니다. 테이크는 더 이상 바꿀 수 없습니다.',
    failed: '렌더링에 실패했습니다.',
    retry: '렌더링 다시 실행',
  },

  result: {
    title: '완성',
    download: 'MP4 내려받기',
    exportTitle: '장면 가져가기',
    formatWide: '가로 형식',
    formatWideHint: '컴퓨터 화면이나 TV용.',
    formatVertical: '세로 형식',
    formatVerticalHint: '가운데를 잘라낸 스토리·릴스용.',
    formatVerticalMissing:
      '이 장면은 자동 자르기 이전에 렌더링됐습니다. 다시 렌더링하면 받을 수 있습니다.',
    share: '공유',
    shareHelp:
      '휴대폰에서는 공유를 누르면 시스템 공유 시트가 열립니다. 설치된 틱톡, 인스타그램 등이 거기 나옵니다.',
    shareUnsupported:
      '이 브라우저는 파일을 공유하지 못합니다. 내려받은 뒤 앱에서 올리세요.',
    cast: '배역',
    voiceOriginal: '원래 음성',
    shareHint: '이 링크는 이 장면의 참가자만 열 수 있습니다.',
    sourcePurged: '원본은 삭제됐습니다. 남은 것은 완성본뿐입니다.',
  },

  errors: {
    notFound: '찾을 수 없습니다.',
    forbidden: '이 장면에 접근할 수 없습니다.',
    sessionLocked: '이 장면은 더 이상 바꿀 수 없습니다.',
    hostOnly: '호스트만 할 수 있습니다.',
    noAudioTrack: '이 파일에는 오디오 트랙이 없습니다.',
    noVideoTrack: '이 파일에는 영상이 없습니다.',
    tooLong: '장면이 너무 깁니다. 최대 10분입니다.',
    youtubeFailed: 'YouTube에서 받아오지 못했습니다. 영상 파일을 직접 가져오세요.',
  },
} satisfies Dictionary;
