/**
 * 日本語辞書。
 *
 * `fr` とキーが一対一で対応する。コンパイラが検査する。
 * 原文と同じく、友人どうしの遊びに合う、かしこまらない丁寧語。
 */

import type { Dictionary } from '../i18n';
import { INGEST_STEPS, RENDER_STEPS } from '../constants';

export const ja = {
  nav: {
    home: 'ホーム',
    homeShort: 'ホーム',
    sessions: 'マイシーン',
    sessionsShort: 'シーン',
    community: 'コミュニティ',
    communityShort: 'コミュニティ',
    myPacks: 'マイパック',
    myPacksShort: 'マイパック',
  },

  account: {
    title: 'アカウント',
    subtitle: '名前と写真はすべてのシーンに引き継がれます。ほかの参加者からも見えます。',
    menuLabel: 'アカウントとログアウト',
    menuHint: '名前、写真、ログイン方法',
    photo: 'プロフィール写真',
    photoAdd: '写真を追加',
    photoChange: '写真を変更',
    photoRemove: '削除',
    photoHelp: 'PNG、JPEG、WebP で 2 MB まで。ほかの招待者にも表示されます。',
    displayName: '表示名',
    displayNameHelp: 'ロビーや完成作品のクレジットに出る名前です。',
    saved: '保存しました。',
    accessTitle: 'ログイン情報',
    email: 'メールアドレス',
    method: 'ログイン方法',
    methodEmail: 'メールのリンク',
    since: '登録日',
    emailLocked:
      'アドレスはここでは変更できません。招待リストに載っているのがこのアドレスだからです。変更は運営までご連絡ください。',
  },

  myPacks: {
    title: 'マイパック',
    subtitle: '公開したシーンです。誰でも遊べますが、取り下げられるのはあなただけです。',
    sceneCount: (n: number) => `公開中のシーン ${n} 件`,
    emptyTitle: 'まだ何も公開していません',
    emptyBody:
      'リンクから取り込んだシーンは、終わったあとに公開できます。リンクと区切りだけがコミュニティに渡り、動画は渡りません。',
  },

  home: {
    heroTitle: '好きなシーンを吹き替え直す',
    heroBody:
      'シーンを選び、ひとりずつ役を持ち、それぞれ自分の都合で録音します。もとの音楽や環境音はそのまま、声だけが変わります。結果は最後に、全員そろって見ます。',
    kicker: '友人どうしの吹き替えスタジオ',
    cta: 'スタジオに入る',
    ctaSessions: 'マイシーンを見る',
    ctaCommunity: '準備済みのシーンを見る',
    howTitle: '流れ',
    reassure1: 'インストール不要',
    reassure2: '録音はいつでも',
    reassure3: '公開はされません',

    valueTitle: 'できあがるもの',
    value1: {
      title: '彼らの声の代わりに、あなたの声',
      body:
        'ヘッドセットのマイクで、自宅から録音します。もとの音楽や効果音はそのまま、声だけが差し替わります。',
    },
    value2: {
      title: '最後まで誰にも聞こえない',
      body:
        '完成ミックスができるまで、あなたの録音はほかの人には聞こえません。最後に全員で聞くところが、この遊びの本体です。',
    },
    value3: {
      title: '手元に残る MP4',
      body:
        '最後に、どこでも再生できるファイルが残ります。字幕は焼き込まれません。もとのシーンのほうは消去されます。',
    },

    midCta: 'シーンを選んで、役を配って、どうなるか見てみましょう。',

    packsCtaTitle: 'まだパックを公開していません',
    packsCtaBody:
      'リンクから取り込んだシーンはコミュニティに共有できます。リンクと区切りだけで足り、動画は保管されません。ほかの人は役を選ぶだけです。',
    packsCtaAction: 'シーンを用意する',

    faqTitle: 'よくある質問',
    faq: [
      {
        q: '必要なものは？',
        a: 'マイク付きのヘッドセットと、ブラウザです。ヘッドセットは些細な点ではありません。使わないとマイクが元の音声を拾い直し、ミックスが使いものになりません。',
      },
      {
        q: '全員そろっている必要は？',
        a: 'ありません。それぞれ好きなときにせりふを録音します。全員が終わったところで書き出しが始まります。',
      },
      {
        q: '吹き替えの経験は要りますか？',
        a: '要りません。本物のスタジオと同じように、テキストが再生ヘッドの下を流れます。読めばタイミングは合います。失敗したテイクは同じ条件で録り直せます。',
      },
      {
        q: 'どのくらいかかりますか？',
        a: '取り込みのあと自動の下準備に数分、そのあとはせりふの量しだいです。2 分のシーンなら 3 人で 30 分ほどです。',
      },
      {
        q: '録音は保存されますか？',
        a: 'されません。完成ミックスができた時点で、もとの動画といっしょに消去されます。',
      },
      {
        q: '誰でも招待できますか？',
        a: '招待リストに追加されたアドレスだけが入れます。アドレスの追加はアカウント画面から自分でできます。',
      },
    ] as const,
    privateTitle: 'ネットワークではなく、私的な部屋',
    privateBody:
      'DubRoom は招待された人だけのものです。公開カタログはなく、輪の外への共有もなく、検索にも載りません。それが成り立たせている条件です。著作物の抜粋を、友人どうしで吹き替え、外には出しません。',
    slides: {
      importTitle: 'シーンを取り込む',
      importBody:
        '動画ファイル、またはリンクから。音声は声と、音楽・環境音の二つに分けられます。この分離はシーン自体から取るので、映像とミリ秒単位で合っています。',
      charactersTitle: '登場人物を整理する',
      charactersBody:
        'せりふは自動で文字起こしされ、話者が割り当てられます。ホストが数クリックで直します。名前の変更、取り違えられた二つの声の統合、せりふの割り当て直し。そのあとロビーを開き、各自が役を選びます。',
      rythmoTitle: 'リズモバンドで吹き替える',
      rythmoBody:
        '本物の吹き替えスタジオと同じく、テキストが再生ヘッドの下を流れます。録音中に聞こえるのは音楽だけで、もとの声は聞こえません。映像とテキストだけで十分合います。',
      renderTitle: '結果を見る',
      renderBody:
        'すべてが混ぜ直されます。もとの映像、もとの音楽、そして彼らの代わりにあなたたちの声。どこでも再生でき、字幕は焼き込まれず、手元に残る MP4 です。',
    },
  },

  community: {
    title: '吹き替えできるシーン',
    subtitle:
      'すでに取り込み、分離し、区切り終えたシーンです。あとは役を選ぶだけ。待ち時間も、下準備のやり直しもありません。',
    play: 'このシーンを吹き替える',
    preview: 'プレビュー',
    openSource: '元の動画を開く',
    kindRecipe: 'レシピ',
    kindMedia: 'ファイル保管',
    recipeHelp:
      'このシーンはここには置かれていません。リンクと区切りだけが保存されています。開始時に動画を取り直すので、数分かかります。',
    mediaHelp: 'ここに置かれているシーンです。すぐ始まります。',
    mine: 'あなたの',
    voteUp: 'このシーンは区切りがよい',
    voteDown: 'このシーンは区切りが悪い',
    voteScore: (n: number) => `コミュニティ評価：${n}`,
    voteHelp:
      '評価の対象は映画ではなく、区切りです。区切りのよいシーンは、全員の一晩を節約します。',
    sortedByScore: '評価の高い順',
    sceneCount: (n: number) => `利用できるシーン ${n} 件`,
    characterCount: (n: number) => `登場人物 ${n} 人`,
    lineCount: (n: number) => `せりふ ${n} 件`,
    emptyTitle: 'まだ保管されたシーンはありません',
    emptyBody:
      'プレイ中、ホストは書き出し前に「このシーンを残す」を選べます。そうするとここに並び、別のグループが遊べるようになります。',
    remove: 'カタログから外す',
    removeTitle: 'このシーンを外しますか？',
    removeBody:
      '動画、分離した音声、区切りが削除されます。これをもとに始まっているシーンは動かなくなります。取り消せません。',
    publish: 'コミュニティに公開',
    published: 'このシーンはコミュニティにあります',
    seeInCommunity: 'コミュニティで見る',
    publishRecipeHelp: '共有されるのはリンクと区切りだけです。動画はここには置かれません。',
    publishTooLate:
      'このシーンは取り込んだファイルから作られ、素材は書き出し後に消去されました。共有するなら、その前に決めておく必要がありました。リンクから取り込んだシーンなら、いつでも公開できます。',
    keepLabel: 'またプレイできるようにこのシーンを残す',
    keepHelp:
      '書き出しのあと、区切りと登場人物ごとコミュニティのタブに入ります。録音のほうは決して保存されません。',
  },

  legal: {
    mentions: '運営者情報',
    privacy: 'プライバシー',
    usageNotice:
      '招待された人のあいだでの、完全に私的な利用です。公開配信も検索登録もありません。',
    contact: 'お問い合わせ',
    contactEmail: 'ienders.pro@gmail.com',
  },

  common: {
    loading: '読み込み中…',
    save: '保存',
    cancel: 'キャンセル',
    confirm: '確定',
    delete: '削除',
    back: '戻る',
    retry: 'やり直す',
    close: '閉じる',
    copy: 'コピー',
    copied: 'コピーしました',
    unknownError: '予期しないエラーが起きました。',
  },

  auth: {
    title: 'ログイン',
    subtitle: 'リンクをお送りします。押せば完了です。',
    emailLabel: 'メールアドレス',
    emailPlaceholder: 'name@example.jp',
    send: 'リンクを送る',
    sending: '送信中…',
    sent: 'リンクを送りました。メールをご確認ください。',
    notAllowed: 'このアドレスは招待リストにありません。ホストに追加を頼んでください。',
    signOut: 'ログアウト',

    signIn: 'ログイン',
    passwordLabel: 'パスワード',
    badCredentials: 'アドレスかパスワードが違います。',
    rateLimited:
      '1 時間のリンク送信回数を超えました。ホストに直接送ってもらうか、パスワードでログインしてください。',
    switchToPassword: 'パスワードがあるので直接ログインする',
    switchToLink: 'パスワードがないのでリンクを送ってほしい',
    inviteOnly: '招待されたアドレスだけが利用できます。',
    discord: 'Discord で続ける',
    orSeparator: 'またはメールで',
    notAllowedWith: (email: string) =>
      `${email} は招待リストにありません。ホストに追加を頼んでください。Discord から来た場合は、Discord アカウントのアドレスが対象です。`,

    passwordSectionTitle: 'パスワード',
    passwordSectionHelp: '設定しておくと、メールを開かずに戻ってこられます。',
    passwordNew: '新しいパスワード',
    passwordSave: 'パスワードを保存',
    passwordSaved: 'パスワードを保存しました。次回のログインから使えます。',
    passwordTooShort: '8 文字以上にしてください。',
  },

  guests: {
    title: '招待者',
    help: 'ここにあるアドレスだけが入れます。Discord の場合は Discord アカウントのアドレスが対象で、ふだん使うものとは限りません。',
    add: '招待する',
    joined: '参加済み',
    pending: '未参加',
    remove: 'リストから外す',
  },

  sessions: {
    title: 'マイシーン',
    empty: 'まだシーンがありません。ひとつ取り込んで始めましょう。',
    create: '新しいシーン',
    open: '開く',
    storageUsed: (used: string, total: string) => `${total} 中 ${used}`,
    storageWarning: '保存容量が残りわずかです。古いシーンを削除して空けてください。',
    deleteConfirmTitle: 'このシーンを削除しますか？',
    deleteConfirmBody:
      '完成ミックス、テイク、すべてのメタデータが消去されます。取り消せません。',
    joinByCode: 'コードで参加',
    join: '参加',
    storageTitle: '使用中の容量',
    storageHelp:
      'もとの動画と分離した音声は、書き出しができた時点で消去されます。長く残るのは完成した映像だけです。シーンを削除すればその分が空きます。',
    codePlaceholder: 'ABC234',
    codeNotFound: 'このコードに合うシーンはありません。',
  },

  create: {
    title: '新しいシーン',
    tabUpload: 'ファイルを取り込む',
    tabYoutube: 'YouTube のリンクを貼る',
    titleLabel: 'シーンの題名',
    titlePlaceholder: '橋の上の決闘',
    dropzone: 'MP4 をここにドロップ、またはクリックして選択',
    fileTooLarge: 'ファイルが大きすぎます。2 GB までです。',
    wrongType: '動画ファイルが必要です（できれば MP4）。',
    youtubeLabel: '動画のリンク',
    youtubePlaceholder: 'https://www.youtube.com/watch?v=…',
    youtubeWarning:
      'YouTube からの取得は便利機能であって、保証ではありません。よく失敗します。うまくいかないときはファイルを直接取り込んでください。',
    multiTrackWarning:
      '音声トラックが複数ある場合（吹き替え、原語、コメンタリーなど）、吹き替え対象になるのは 1 番目です。',
    durationWarning: 'シーンは 10 分未満にしてください。',
    keepLabel: '共有シーンにする',
    keepHelpUrl:
      'コミュニティのタブに入ります。リンク由来なので、保存されるのはリンクと区切りだけです。ここには何も置かれません。',
    keepHelpUpload:
      '書き出しのあとコミュニティのタブに入ります。ファイル由来なので、動画と分離した音声が保存されます。10 メガバイトほどです。',
    submitUpload: '取り込んで準備',
    submitYoutube: 'ダウンロードして準備',
    uploading: 'ファイルを送信中…',
  },

  ingest: {
    title: 'シーンの準備',
    subtitle: 'シーンを切り分けています。数分かかります。',
    queued: 'ワーカー待ちです。パソコンでスクリプトを起動してください。',
    queuedHelp:
      '処理はホストのパソコンで動きます。start.bat をダブルクリックすれば、あとは自動で始まります。',
    failed: '取り込みに失敗しました。',
    retry: '取り込みをやり直す',
    neverStarted:
      '取り込みが始まっていません。ファイルの送信で失敗した可能性が高いです。やり直すか、新しいシーンから始めてください。',
    startOver: '新しいシーン',
    steps: {
      download: '動画を取得中',
      encode: '正規化中',
      extract: '音声を抽出中',
      separate: '声と背景音を分離中',
      transcribe: '文字起こしと話者の判定',
      segment: 'せりふを切り分け中',
    } satisfies Record<(typeof INGEST_STEPS)[number], string>,
  },

  prepare: {
    title: '登場人物の整理',
    subtitle:
      '自動判定は話者をよく取り違えます。直すのは今です。ロビーを開いたあとは変更できません。',
    charactersHeading: '検出された登場人物',
    linesHeading: 'せりふ',
    lineCount: (n: number) => `せりふ ${n} 件`,
    speakTime: '発話時間',
    playLongest: 'いちばん長い部分を聞く',
    rename: '名前を変更',
    merge: '統合',
    mergeInto: (name: string) => `${name} に統合`,
    mergeHint: '統合するには登場人物を 2 人以上選んでください。',
    mergeConfirm: (from: string, to: string) =>
      `${from} のせりふはすべて ${to} に移ります。${from} は削除されます。`,
    splitToNew: '新しい登場人物に移す',
    reassign: '割り当て先…',
    assignedTo: '割り当て先',
    changeCharacter: '登場人物を変更',
    selectedCount: (n: number) => `せりふ ${n} 件を選択 →`,
    howTitle: '誰のせりふか確認する',
    howBody:
      'せりふにはそれぞれ、割り当てられた登場人物の名前が付いています。その名前を押すと別の人物に移せます。左側では、名前を変えたり、判定が誤って分けた二つの声を統合したりできます。',
    selectAll: 'すべて選択',
    selectNone: '選択を解除',
    deleteLine: 'せりふを削除',
    deleteLineHint: 'その場所のもとの音声は残ります。',
    textIsAGuide: 'テキストはタイミングの目安です。読めないときだけ直してください。',
    openLobby: 'ロビーを開く',
    openLobbyConfirm: 'ロビーを開くと、登場人物とせりふは変更できなくなります。',
    lockedAfterLobby: 'ロビーを開いたため、準備は編集できません。',
    recalculating: 'クリップを再計算中…',
    noSelection: '移動するせりふを選んでください。',
    restoreLine: 'せりふを戻す',
    deletedBadge: '削除済み、もとの音声は保持',
  },

  lobby: {
    title: 'ロビー',
    shareLink: '共有リンク',
    shareCode: 'シーンのコード',
    watchOriginal: 'もとのシーンを見る',
    characters: '登場人物',
    takeCharacter: 'この人物を担当する',
    dropCharacter: 'この人物を手放す',
    releaseCharacter: 'もとの音声のままにする',
    unrelease: 'もう一度あけておく',
    releasedBadge: 'もとの音声を保持',
    takenBy: (name: string) => `${name} が担当`,
    free: '空き',
    ready: '準備できました',
    notReady: '準備を取り消す',
    readyBadge: '準備完了',
    waitingBadge: '待機中',
    players: '参加者',
    start: '開始する',
    startBlockedTitle: 'まだ足りないものがあります：',
    startBlockedCharacters: '担当者のいない人物（担当するか、もとの音声のままにしてください）：',
    startBlockedReady: 'まだ準備完了にしていない人：',
    clipCount: (n: number) => `クリップ ${n} 件`,
    hostOnly: '開始できるのはホストだけです。',
  },

  studio: {
    title: 'スタジオ',
    clipProgress: (current: number, total: number) => `クリップ ${current} / ${total}`,
    playOriginal: 'もとのシーンを再生',
    record: '録音',
    stop: '停止',
    playTake: '自分のテイク',
    redo: '録り直す',
    validate: '確定して次へ',
    finish: '終わりました',
    takeSaved: 'テイクを保存しました。',
    backToClips: '自分のクリップに戻る',
    allTakesSaved:
      'テイクはすべて保存されています。ページを閉じても大丈夫です。全員が終わったらホストが書き出します。書き出しが始まるまでは録り直しもできます。',
    validated: '確定済み',
    previous: '前へ',
    next: '次へ',
    backingVolume: '背景音',
    micOffset: 'マイクのずれ',
    micOffsetHelp:
      'テイクがいつも遅れて入るなら、この値を下げてください。ミックス時に適用されます。',
    calibrate: '自動で調整',
    calibrating: '測定中…静かにしていてください。',
    calibrationDone: (ms: number) => `測定されたずれ：${ms} ms。`,
    calibrationFailed: 'ずれを測定できませんでした。必要なら手で調整してください。',
    micDenied: 'ブラウザがマイクを拒否しました。許可してページを読み込み直してください。',
    headphonesRequired:
      'ヘッドホンが必要です。録音中に聞こえるのは音楽だけで、もとの声は聞こえません。',
    overflowWarning: 'テイクが枠をはみ出しています。終わりが切れます。短めに録り直してください。',
    speechZone: '発話区間',
    margin: '余白',
    noTake: 'このクリップにはテイクがありません。',
    uploading: 'テイクを送信中…',
    finishedTitle: 'お疲れさまでした！',
    finishedBody: '書き出しが始まるまでは、戻ってテイクを録り直せます。',
    waitingFor: 'まだ待っている人：',
    playerProgress: (name: string, done: number, total: number) =>
      `${name}（${done}/${total}）`,
    everyoneDone: '全員終わりました。ホストが書き出せます。',
    othersDone: 'ほかの人は終わりました。あとはあなただけです。',
    soloScene: 'このシーンはあなたひとりです。',
    soloHint: '登場人物はすべてあなたの担当です。待つ相手はいません。',
    launchRender: '書き出しを始める',
    renderBlocked: 'テイクのないクリップが残っています。',
    kick: 'この参加者を外す',
    kickConfirm: (name: string) =>
      `${name} を外すと、担当していた人物はもとの音声に戻ります。録音は使われません。`,
    reassignInstead: '担当していた人物を別の人に割り当てる',
    kicked: 'ホストによってこのシーンから外されました。',
    myClips: '自分のクリップ',
    youAreDubbing: '担当',
    cueIn: '出番まで',
    cueNow: '出番です',
    cueDone: 'せりふは終わりました',
    cueIdle: '待機中',
    originalTrace: '色のついた波形は、もとの声が話している位置を示します。',
    micWindow: 'マイクが開くのは自分のせりふの間だけです。',
    autoAlign: '自動で位置合わせ',
    autoAlignHelp:
      'テイクをもとの声と照らし合わせ、正しい位置に置き直します。自分のタイミングをそのまま残したいときは外してください。',
    alignedBy: (ms: number) =>
      ms === 0
        ? 'テイクはもともとぴったりでした。'
        : ms > 0
          ? `${ms} ms 遅れていたので、直しました。`
          : `${-ms} ms 早かったので、直しました。`,
    alignUnsure: 'このテイクでは合わせどころが見つかりませんでした。そのまま置いています。',
  },

  render: {
    title: '書き出し中',
    queued: 'ワーカー待ちです。パソコンでスクリプトを起動してください。',
    frozen: 'シーンは確定しました。テイクは変更できません。',
    failed: '書き出しに失敗しました。',
    retry: '書き出しをやり直す',
    steps: {
      fetch: 'テイクを取得中',
      mix: '音声をミックス中',
      mux: '映像を組み立て中',
      upload: '結果を送信中',
      purge: '素材を片付け中',
    } satisfies Record<(typeof RENDER_STEPS)[number], string>,
  },

  result: {
    title: '完成',
    download: 'MP4 をダウンロード',
    cast: '配役',
    voiceOriginal: 'もとの音声',
    shareHint: 'このリンクはシーンの参加者だけが開けます。',
    sourcePurged: 'もとの素材は削除されました。残っているのは完成ミックスだけです。',
  },

  errors: {
    notFound: '見つかりません。',
    forbidden: 'このシーンにはアクセスできません。',
    sessionLocked: 'このシーンはもう変更できません。',
    hostOnly: 'これができるのはホストだけです。',
    noAudioTrack: 'このファイルには音声トラックがありません。',
    noVideoTrack: 'このファイルには映像がありません。',
    tooLong: 'シーンが長すぎます。10 分までです。',
    youtubeFailed:
      'YouTube からの取得に失敗しました。動画ファイルを直接取り込んでください。',
  },
} satisfies Dictionary;
