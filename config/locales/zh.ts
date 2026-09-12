/**
 * 简体中文词典。
 *
 * 与 `fr` 逐键对应，由编译器检查。
 * 语气跟原文一样：朋友之间玩的东西，说人话，不端着。
 */

import type { Dictionary } from '../i18n';
import { INGEST_STEPS, RENDER_STEPS } from '../constants';

export const zh = {
  nav: {
    home: '首页',
    homeShort: '首页',
    sessions: '我的片段',
    sessionsShort: '片段',
    community: '社区',
    communityShort: '社区',
    myPacks: '我的包',
    myPacksShort: '我的包',
  },

  account: {
    title: '我的账号',
    subtitle: '名字和头像会跟着你进入每一个片段，其他人都看得到。',
    menuLabel: '我的账号与退出',
    menuHint: '名字、头像、登录方式',
    photo: '头像',
    photoAdd: '添加头像',
    photoChange: '更换头像',
    photoRemove: '移除',
    photoHelp: 'PNG、JPEG 或 WebP，最大 2 MB。其他受邀者看得到。',
    displayName: '显示名称',
    displayNameHelp: '这是别人在大厅和成片字幕里看到的名字。',
    saved: '已保存。',
    accessTitle: '我的登录',
    email: '邮箱地址',
    method: '登录方式',
    methodEmail: '邮件链接',
    since: '加入时间',
    emailLocked:
      '邮箱不能在这里修改：受邀名单上写的就是它。要改请联系站点作者。',
  },

  myPacks: {
    title: '我的包',
    subtitle: '你发布过的片段。谁都可以再玩，只有你能撤下来。',
    sceneCount: (n: number) => `已发布 ${n} 个片段`,
    emptyTitle: '你还没发布过任何东西',
    emptyBody:
      '用链接导入的片段，做完之后可以发布：进入社区的只有链接和切分，视频不会跟着走。',
  },

  home: {
    heroTitle: '把喜欢的片段重新配一遍',
    heroBody:
      '你们挑一个片段，每人认领一个角色，各自找时间录。原来的音乐和环境声照旧，只有声音换成你们的。结果留到最后，一起看。',
    kicker: '朋友之间的配音棚',
    cta: '进入录音棚',
    ctaSessions: '看我的片段',
    ctaCommunity: '浏览现成片段',
    howTitle: '怎么玩',
    reassure1: '不用装任何东西',
    reassure2: '各自想录就录',
    reassure3: '不会被发布出去',

    valueTitle: '做出来是什么',
    value1: {
      title: '用你的声音替掉他们的',
      body:
        '在家用耳机上的麦克风录。原来的音乐和音效原封不动，换掉的只有人声。',
    },
    value2: {
      title: '到最后谁也听不到',
      body:
        '成片没出来之前，你录的东西别人听不见。最后一起揭晓，这就是整个玩法。',
    },
    value3: {
      title: '留得下的一个 MP4',
      body:
        '最后得到一个到处都能播的文件，字幕不会烧进去。原片这边则会被删掉。',
    },

    midCta: '挑一个片段，分好角色，看看能做出什么。',

    packsCtaTitle: '你还没发布过包',
    packsCtaBody:
      '用链接导入的片段可以分享给社区：有链接和切分就够了，视频不会存在这里。别人只要挑角色就行。',
    packsCtaAction: '准备一个片段',

    faqTitle: '常被问到的',
    faq: [
      {
        q: '到底需要什么？',
        a: '一副带麦克风的耳机，还有浏览器。耳机不是小事：不戴的话麦克风会把原声再录一遍，混出来就废了。',
      },
      {
        q: '大家必须同时在线吗？',
        a: '不用。各人想录的时候录自己的台词。所有人录完，才开始出片。',
      },
      {
        q: '需要会配音吗？',
        a: '不需要。文字会在播放头下面走过，跟真录音棚一样：照着念就对得上。录砸了原样重来一次就行。',
      },
      {
        q: '要花多久？',
        a: '导入之后自动准备几分钟，之后就看台词有多少。两分钟的片段，三个人半小时左右能配完。',
      },
      {
        q: '我的录音会留着吗？',
        a: '不会。成片一出来，它们就跟原视频一起删掉。',
      },
      {
        q: '我能随便邀请人吗？',
        a: '只有加进受邀名单的邮箱能进来。在账号页面你可以自己加。',
      },
    ] as const,
    privateTitle: '一个私人客厅，不是社交网络',
    privateBody:
      'DubRoom 只给受邀请的人用。没有公开目录，不往圈子外分享，不被搜索收录。正因为这样才站得住：我们在朋友之间给受保护作品的片段配音，什么也不往外传。',
    slides: {
      importTitle: '导入一个片段',
      importBody:
        '一个视频文件，或者一条链接。声音会被分成两路：人声一路，音乐和环境声一路。这个分离是从片段本身拿的，所以跟画面对得上，误差在毫秒级。',
      charactersTitle: '把角色理清楚',
      charactersBody:
        '台词会自动转写并分配说话人。房主点几下就能改：改名字、把认错的两个声音合起来、把某句台词换个人。然后打开大厅，各人挑角色。',
      rythmoTitle: '照着字带配音',
      rythmoBody:
        '文字在播放头下面走过，跟真的配音棚一样。录的时候只听得到音乐，听不到原声：看画面加看字就够对上了。',
      renderTitle: '揭晓结果',
      renderBody:
        '全部重新混到一起：原画面、原音乐，还有你们的声音替掉他们的。一个到处都能播、字幕没烧进去、留得下来的 MP4。',
    },
  },

  community: {
    title: '可以直接配的片段',
    subtitle:
      '已经由大家导入、分离、切好的片段。剩下的只是挑角色：不用等，也不用重做准备。',
    play: '配这个片段',
    preview: '预览',
    openSource: '打开原片',
    kindRecipe: '配方',
    kindMedia: '保留文件',
    recipeHelp:
      '这个片段不存在这里：只保存了链接和切分。开始的时候会重新下载视频，要花几分钟。',
    mediaHelp: '存在这里的片段：马上就能开始。',
    mine: '你的',
    voteUp: '这个片段切得好',
    voteDown: '这个片段切得不好',
    voteScore: (n: number) => `社区评分：${n}`,
    voteHelp: '投的是切分，不是电影。切得好的片段能给所有人省下一个晚上。',
    sortedByScore: '评分高的在前',
    sceneCount: (n: number) => `可用片段 ${n} 个`,
    characterCount: (n: number) => `${n} 个角色`,
    lineCount: (n: number) => `${n} 句台词`,
    emptyTitle: '暂时还没有保留的片段',
    emptyBody:
      '玩的过程中，房主可以在出片之前勾上「保留这个片段」。它就会出现在这里，等着别的小组来玩。',
    remove: '从目录里撤下',
    removeTitle: '撤下这个片段？',
    removeBody:
      '视频、分离出来的音轨和切分都会被删除。已经由它开始的片段会失效。撤不回来。',
    publish: '发布到社区',
    published: '这个片段已经在社区里',
    seeInCommunity: '去社区看看',
    publishRecipeHelp: '分享出去的只有链接和切分。视频不存在这里。',
    publishTooLate:
      '这个片段来自导入的文件，素材在出片之后已经清掉了。要分享得提前决定。用链接导入的片段则随时都能发布。',
    keepLabel: '保留这个片段以便再玩',
    keepHelp:
      '出片之后它会进入社区页，带着切分和角色。你们的录音则从来不保留。',
  },

  legal: {
    mentions: '法律信息',
    privacy: '隐私',
    usageNotice: '仅限受邀者之间的私人使用。任何内容都不公开传播，也不被收录。',
    contact: '联系',
    contactEmail: 'ienders.pro@gmail.com',
  },

  common: {
    loading: '加载中…',
    save: '保存',
    cancel: '取消',
    confirm: '确定',
    delete: '删除',
    back: '返回',
    retry: '重试',
    close: '关闭',
    copy: '复制',
    copied: '已复制',
    unknownError: '出了点没料到的错。',
  },

  auth: {
    title: '登录',
    subtitle: '我们发一条链接给你，点一下就好。',
    emailLabel: '你的邮箱地址',
    emailPlaceholder: 'name@example.com',
    send: '给我发链接',
    sending: '发送中…',
    sent: '链接已发出，去邮箱看看。',
    notAllowed: '这个邮箱不在受邀名单里。让房主把你加上。',
    signOut: '退出',

    signIn: '登录',
    passwordLabel: '你的密码',
    badCredentials: '邮箱或密码不对。',
    rateLimited:
      '这一小时内请求的链接太多了。让房主直接发一条给你，或者用密码登录。',
    switchToPassword: '我有密码，直接登录',
    switchToLink: '我没有密码，发链接给我',
    inviteOnly: '只有受邀的邮箱能用。',
    discord: '用 Discord 继续',
    orSeparator: '或者用邮箱',
    notAllowedWith: (email: string) =>
      `${email} 不在受邀名单里。让房主把它加上。如果你是从 Discord 进来的，算的是你 Discord 账号的邮箱。`,

    passwordSectionTitle: '密码',
    passwordSectionHelp: '设一个，下次就不用绕道邮箱了。',
    passwordNew: '新密码',
    passwordSave: '保存密码',
    passwordSaved: '密码已保存，下次登录就能用。',
    passwordTooShort: '至少八个字符。',
  },

  guests: {
    title: '受邀者',
    help: '只有这些邮箱能进来。Discord 算的是 Discord 账号的邮箱，不一定是平时那个。',
    add: '邀请',
    joined: '来过',
    pending: '没来过',
    remove: '从名单里移除',
  },

  sessions: {
    title: '我的片段',
    empty: '暂时还没有片段。导入一个就能开始。',
    create: '新片段',
    open: '打开',
    storageUsed: (used: string, total: string) => `${total} 中已用 ${used}`,
    storageWarning: '存储空间快满了。删掉旧片段腾点地方。',
    deleteConfirmTitle: '删除这个片段？',
    deleteConfirmBody: '成片、录音和所有元数据都会被抹掉。撤不回来。',
    joinByCode: '用代码加入',
    join: '加入',
    storageTitle: '已用空间',
    storageHelp:
      '原视频和分离出来的音轨在出片之后就删掉了，长期占地方的只有成片。删掉一个片段就腾出它那份。',
    codePlaceholder: 'ABC234',
    codeNotFound: '没有片段对得上这个代码。',
  },

  create: {
    title: '新片段',
    tabUpload: '导入文件',
    tabYoutube: '粘贴 YouTube 链接',
    titleLabel: '片段标题',
    titlePlaceholder: '桥上的决斗',
    dropzone: '把 MP4 拖到这里，或者点一下来选',
    fileTooLarge: '文件太大：最多 2 GB。',
    wrongType: '需要一个视频文件（最好是 MP4）。',
    youtubeLabel: '视频链接',
    youtubePlaceholder: 'https://www.youtube.com/watch?v=…',
    youtubeWarning:
      '从 YouTube 下载只是图方便，不保证成功，经常会挂。不行的话就直接导入文件。',
    multiTrackWarning:
      '如果源里有多条音轨（配音、原声、评论），会拿第一条来配。',
    durationWarning: '片段要短于 10 分钟。',
    keepLabel: '做成共享片段',
    keepHelpUrl:
      '它会进入社区页。因为来自链接，只保存链接和切分：这里什么都不存。',
    keepHelpUpload:
      '出片之后它会进入社区页。因为来自文件，会保存视频和分离出来的音轨，大概十来兆。',
    submitUpload: '导入并准备',
    submitYoutube: '下载并准备',
    uploading: '正在上传文件…',
  },

  ingest: {
    title: '正在准备片段',
    subtitle: '正在切分片段，要几分钟。',
    queued: '等 worker。在你的电脑上把脚本跑起来。',
    queuedHelp:
      '处理是在房主的机器上跑的。双击 start.bat，任务自己会开始。',
    failed: '导入失败了。',
    retry: '重新导入',
    neverStarted:
      '导入根本没开始：多半是文件上传失败了。重来一次，或者从新片段开始。',
    startOver: '新片段',
    steps: {
      download: '正在取视频',
      encode: '正在归一化',
      extract: '正在提取音频',
      separate: '正在分离人声和背景',
      transcribe: '转写并识别角色',
      segment: '正在切分台词',
    } satisfies Record<(typeof INGEST_STEPS)[number], string>,
  },

  prepare: {
    title: '整理角色',
    subtitle:
      '自动识别经常认错人。现在是改的时候：大厅一开就动不了了。',
    charactersHeading: '识别出的角色',
    linesHeading: '台词',
    lineCount: (n: number) => `${n} 句台词`,
    speakTime: '说话时长',
    playLongest: '听最长的一段',
    rename: '改名',
    merge: '合并',
    mergeInto: (name: string) => `合并到 ${name}`,
    mergeHint: '选中至少两个角色才能合并。',
    mergeConfirm: (from: string, to: string) =>
      `${from} 的所有台词都会转到 ${to}。${from} 会被删除。`,
    splitToNew: '移到一个新角色',
    reassign: '改派给…',
    assignedTo: '归属',
    changeCharacter: '换一个角色',
    selectedCount: (n: number) => `选中 ${n} 句 →`,
    howTitle: '核对谁说了什么',
    howBody:
      '每句台词上都带着它归属角色的名字。点那个名字就能把它交给别人。左边可以给角色改名，或者把识别错分成两个的声音合起来。',
    selectAll: '全选',
    selectNone: '取消全选',
    deleteLine: '删除这句',
    deleteLineHint: '那个位置的原声会保留。',
    textIsAGuide: '文字只是对时间的提示。除非看不清，不然不用改。',
    openLobby: '打开大厅',
    openLobbyConfirm: '大厅一旦打开，角色和台词就改不了了。',
    lockedAfterLobby: '大厅打开之后，准备阶段就锁住了。',
    recalculating: '正在重算片段…',
    noSelection: '选中一些台词才能移动。',
    restoreLine: '恢复这句',
    deletedBadge: '已删除，原声保留',
  },

  lobby: {
    title: '大厅',
    shareLink: '分享链接',
    shareCode: '片段代码',
    watchOriginal: '看原片',
    characters: '角色',
    takeCharacter: '认领这个角色',
    dropCharacter: '放掉这个角色',
    releaseCharacter: '保留原声',
    unrelease: '重新空出来',
    releasedBadge: '保留原声',
    takenBy: (name: string) => `${name} 认领`,
    free: '空着',
    ready: '我准备好了',
    notReady: '取消准备',
    readyBadge: '已准备',
    waitingBadge: '等待中',
    players: '玩家',
    start: '开始',
    startBlockedTitle: '还差点东西：',
    startBlockedCharacters: '没人认领的角色，要么认领要么保留原声：',
    startBlockedReady: '还没点准备的人：',
    clipCount: (n: number) => `${n} 个片段`,
    hostOnly: '只有房主能开始。',
  },

  studio: {
    title: '录音棚',
    clipProgress: (current: number, total: number) => `片段 ${current} / ${total}`,
    playOriginal: '播放原片',
    record: '录音',
    stop: '停止',
    playTake: '我的这条',
    redo: '重录',
    validate: '留下并继续',
    finish: '我录完了',
    takeSaved: '已保存。',
    backToClips: '回到我的片段',
    allTakesSaved:
      '你录的都保存好了。可以关页面：等所有人录完，房主会出片。出片开始之前还能重录。',
    validated: '已留下',
    previous: '上一个',
    next: '下一个',
    backingVolume: '背景音',
    micOffset: '麦克风偏移',
    micOffsetHelp: '如果你录的总是慢半拍，把这个值调小。混音时会用上。',
    calibrate: '自动校准',
    calibrating: '测量中…别出声。',
    calibrationDone: (ms: number) => `测到的偏移：${ms} 毫秒。`,
    calibrationFailed: '没能测出偏移。需要的话手动调。',
    micDenied: '浏览器拒绝了麦克风。允许之后刷新页面。',
    headphonesRequired: '必须戴耳机。录的时候只听得到音乐，听不到原声。',
    overflowWarning: '你录的超出了范围，结尾会被切掉。录短一点。',
    speechZone: '说话区间',
    margin: '余量',
    noTake: '这个片段还没有录音。',
    uploading: '正在上传…',
    finishedTitle: '录完了！',
    finishedBody: '出片开始之前，你还能回来重录。',
    waitingFor: '还在等：',
    playerProgress: (name: string, done: number, total: number) =>
      `${name}（${done}/${total}）`,
    everyoneDone: '所有人都录完了，房主可以出片。',
    othersDone: '别人都录完了，就差你。',
    soloScene: '这个片段只有你一个人。',
    soloHint: '所有角色都是你的，不用等谁。',
    launchRender: '开始出片',
    renderBlocked: '还有片段没有录音。',
    kick: '把这个玩家移出',
    kickConfirm: (name: string) =>
      `${name} 会被移出，他认领的角色回到原声。他录的内容会被忽略。`,
    reassignInstead: '把他的角色派给别人',
    kicked: '房主把你移出了这个片段。',
    myClips: '我的片段',
    youAreDubbing: '你在配',
    cueIn: '还有多久轮到你',
    cueNow: '轮到你了',
    cueDone: '这句过去了',
    cueIdle: '待命',
    originalTrace: '有颜色的波形显示原声在什么时候说话。',
    micWindow: '麦克风只在你那句台词上打开。',
    autoAlign: '自动对位',
    autoAlignHelp:
      '把你录的跟原声比对，再放回该在的位置。想保留自己的节奏就关掉。',
    alignedBy: (ms: number) =>
      ms === 0
        ? '你录的本来就正好。'
        : ms > 0
          ? `你慢了 ${ms} 毫秒，已经补上了。`
          : `你快了 ${-ms} 毫秒，已经补上了。`,
    alignUnsure: '这一条没找到明确的对位点，就按原样放着。',
  },

  render: {
    title: '正在出片',
    queued: '等 worker。在你的电脑上把脚本跑起来。',
    frozen: '片段已经定下来了：录音不能再改。',
    failed: '出片失败了。',
    retry: '重新出片',
    steps: {
      fetch: '正在取录音',
      mix: '正在混音',
      mux: '正在合成视频',
      upload: '正在上传结果',
      purge: '正在清理源文件',
    } satisfies Record<(typeof RENDER_STEPS)[number], string>,
  },

  result: {
    title: '成片',
    download: '下载 MP4',
    cast: '演员表',
    voiceOriginal: '保留原声',
    shareHint: '这条链接只有这个片段的参与者打得开。',
    sourcePurged: '源文件已经删除，留下的只有成片。',
  },

  errors: {
    notFound: '找不到。',
    forbidden: '你没有这个片段的权限。',
    sessionLocked: '这个片段不能再改了。',
    hostOnly: '只有房主能这么做。',
    noAudioTrack: '这个文件没有音轨。',
    noVideoTrack: '这个文件没有视频。',
    tooLong: '片段太长了：最多 10 分钟。',
    youtubeFailed: '从 YouTube 下载失败了。直接导入视频文件吧。',
  },
} satisfies Dictionary;
