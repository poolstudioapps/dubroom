/**
 * 日本語辞書。
 *
 * `fr` とキーが一対一で対応する。コンパイラが検査する。
 * 原文と同じく、友人どうしの遊びに合う、かしこまらない丁寧語。
 */

import type { Dictionary } from '../i18n';

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
    subtitle:
      '名前と写真はすべてのシーンに引き継がれます。ほかの参加者からも見えます。',
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
    subtitle:
      '公開したシーンです。誰でも遊べますが、取り下げられるのはあなただけです。',
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
      body: 'ヘッドセットのマイクで、自宅から録音します。もとの音楽や効果音はそのまま、声だけが差し替わります。',
    },
    value2: {
      title: '最後まで誰にも聞こえない',
      body: '完成ミックスができるまで、あなたの録音はほかの人には聞こえません。最後に全員で聞くところが、この遊びの本体です。',
    },
    value3: {
      title: '手元に残る MP4',
      body: '最後に、どこでも再生できるファイルが残ります。字幕は焼き込まれません。もとのシーンのほうは消去されます。',
    },

    midCta: 'シーンを選んで、役を配って、どうなるか見てみましょう。',

    packsCtaTitle: 'まだパックを公開していません',
    packsCtaBody:
      'リンクから取り込んだシーンはコミュニティに共有できます。リンクと区切りだけで足り、動画は保管されません。ほかの人は役を選ぶだけです。',
    packsCtaAction: 'シーンを用意する',

    faqTitle: 'よくある質問',
    seoTitle: '映画のシーンを友だちと吹き替える',
    defineTitle: '映画のシーンを吹き替えるとは',
    defineBody:
      '映画のシーンを吹き替えるとは、映像も音楽も効果音もリズムもそのままに、もとの声だけを自分の声に差し替えることです。上から解説をかぶせるのではなく、シーンそのものを別の演者でやり直します。Dub’Up は、その作業をブラウザだけで行うオンラインの吹き替えソフトです。',
    defineHowTitle: '映画のシーンを自分で吹き替える方法',
    defineHowBody:
      '家庭にはない三つのものが要ります。声だけを差し替えるために声と音楽を分けること、誰がいつ話すかをミリ秒単位で知ること、そして話しながらタイミングを合わせること。Dub’Up は最初の二つをシーンから自動で行い、三つ目をリズモバンドで解きます。再生ヘッドの下を文字が流れるこの仕組みは、professional な吹き替えスタジオが八十年使ってきたものです。',
    defineWhoTitle: 'どんな人のためのものか',
    defineWhoBody:
      '名台詞をやり直したい友人どうし、編集ソフトではない道具を探している fandub の作り手、クラスに抜粋を吹き替えさせる語学教師、そしてスタジオを借りずにリズモバンドで練習したい吹き替えの学習者のためのものです。',
    faqExtra: [
      {
        q: '無料ですか？',
        a: 'はい。Dub’Up は個人のプロジェクトで、広告も、定額課金も、シーン数の上限もありません。',
      },
      {
        q: '動画編集ソフトとの違いは？',
        a: '編集ソフトは空のタイムラインを渡し、テイクの位置合わせは手作業に任せます。Dub’Up はシーンから始めます。声を分離し、せりふを見つけ、登場人物に割り当て、録音をもとの声に自動で合わせ直します。',
      },
      {
        q: '日本語の画面で英語のシーンを吹き替えられますか？',
        a: 'できます。画面の言語とシーンの言語は別物です。文字起こしはタイミングの目安で、その上で何を話すかは自由です。',
      },
      {
        q: '声と音楽はどうやって分けているのですか？',
        a: 'ホストのパソコンで動く音源分離のモデルが、声と、音楽・環境音の二つのトラックを返します。分離はシーン自体から取るので、映像とずれません。',
      },
    ] as const,
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
      'Dub’Up は招待された人だけのものです。公開カタログはなく、輪の外への共有もなく、検索にも載りません。それが成り立たせている条件です。著作物の抜粋を、友人どうしで吹き替え、外には出しません。',
    slides: {
      importTitle: '台詞まで覚えているあのシーンを選ぶ',
      importBody:
        'リンク一本、あるいはファイル一つ。誰がどの役をやるか決めているあいだに、シーンはもう切り分けられ、声と音楽は分けられ、せりふはミリ秒単位で押さえられています。面倒な部分は、選び終わる前に片づいています。',
      charactersTitle: '本物のキャスティングのように役を配る',
      charactersBody:
        '登場人物はすでに見つけられ、名前も付いています。ひとクリックで自分の役を取るだけ。誰も取らなかった役はもとの声のまま残り、仕上がりでは見分けがつきません。',
      rythmoTitle: '文字が流れる。あとは演じるだけ',
      rythmoBody:
        '本物のスタジオと同じく、せりふが再生ヘッドの下を流れます。合わせる作業も、編集の習得も要りません。読めば、はまります。失敗したテイクは二秒で録り直し、何度でも。',
      renderTitle: 'そして、再生ボタンを押す瞬間が来る',
      renderBody:
        '誰もほかの人の声を聞いていません。シーンがもう一度動きだし、映像も音楽もそのままに、登場人物の口から出てくるのはあなたたちの声です。ほかのすべては、この一分のためにあります。',
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
    sort: {
      label: '並び替え',
      popular: '評価が高い順',
      recent: '新しい順',
      short: '短い順',
      title: 'タイトル順',
    },
    filterLang: 'シーンの言語',
    filterGenre: 'ジャンル',
    filterCast: '役の数',
    filterLength: '長さ',
    filterAll: 'すべて',
    filterAllGenres: 'すべてのジャンル',
    filterAnyCast: '指定なし',
    filterAnyLength: '指定なし',
    filterReset: 'すべて表示',
    filterNoMatch: '条件に合うシーンがありません',
    filterNoMatchBody:
      '条件を広げるか、まだ誰も出していないシーンを公開してみてください。',
    langUnknown: '言語不明',
    langNames: {
      fr: 'フランス語',
      en: '英語',
      es: 'スペイン語',
      de: 'ドイツ語',
      it: 'イタリア語',
      pt: 'ポルトガル語',
      ja: '日本語',
      ko: '韓国語',
      zh: '中国語',
      ru: 'ロシア語',
    } as Record<string, string>,
    genreNames: {
      action: 'アクション',
      comedie: 'コメディ',
      drame: 'ドラマ',
      animation: 'アニメ',
      anime: 'アニメ',
      serie: 'ドラマ',
      super_heros: 'ヒーロー',
      science_fiction: 'SF',
      horreur: 'ホラー',
      jeu_video: 'ゲーム',
      chanson: '歌',
      documentaire: 'ドキュメンタリー',
      autre: 'その他',
    } as Record<string, string>,
    castBuckets: {
      solo: '1 役',
      duo: '2 役',
      small: '3〜4 役',
      large: '5 役以上',
    } as Record<string, string>,
    lengthBuckets: {
      short: '1 分未満',
      medium: '1〜3 分',
      long: '3 分以上',
    } as Record<string, string>,
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
    publishRecipeHelp:
      '共有されるのはリンクと区切りだけです。動画はここには置かれません。',
    publishFromCatalogue:
      'このシーンはカタログから来たもので、すでに登録されています。もう一度出すと見分けのつかない重複ができてしまいます。',
    publishTooLate:
      'このシーンは取り込んだファイルから作られ、素材は書き出し後に消去されました。共有するなら、その前に決めておく必要がありました。リンクから取り込んだシーンなら、いつでも公開できます。',
    keepLabel: 'またプレイできるようにこのシーンを残す',
    keepHelp:
      '書き出しのあと、区切りと登場人物ごとコミュニティのタブに入ります。録音のほうは決して保存されません。',
  },

  theme: {
    label: '見た目',
    retro: 'レトロ',
    modern: 'モダン',
  },

  terms: {
    consent: '{terms}と{privacy}を読み、同意します。',
    linkTerms: '利用規約',
    linkPrivacy: 'プライバシーポリシー',
    required: '続けるには同意が必要です。',
    gateTitle: 'もうひとつだけ',
    gateBody:
      '前回の訪問から利用規約が変わりました。まだ同意していない場合も同じです。チェックを入れれば続きに戻れます。',
    gateGist:
      '要点はひとつ。取り込む映像と、その使い方の責任はあなたにあります。すべては招待された人の間にとどまり、公開されることはありません。',
    gateConfirm: '同意して続ける',
  },

  legal: {
    mentions: '運営者情報',
    privacy: 'プライバシー',
    terms: '利用規約',
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
    errorTitle: 'ログインできませんでした',
    backToSignIn: 'ログイン画面に戻る',
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
    songLabel: 'これは曲です',
    songHelp:
      '歌詞は知っているはずなので、文字起こしは省きます。区切りは曲のボーカルに合わせ、入るタイミングだけ知らせます。',
    matchTitle: 'このシーンはすでにあります',
    matchBody:
      '誰かがもう用意しています。区切りも役も台詞もそろっているので、同じ結果を数分待つ代わりにすぐ始められます。',
    matchLines: '言う台詞',
    matchUse: 'このシーンから始める',
    matchScratch: '一から作り直す',
    tabPack: 'パックから始める',
    packHelp:
      '下準備は不要です。シーンはすでに区切られているので、役を選んで録音するだけ。全部の一覧はコミュニティのタブにあります。',
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
    queued: '処理の開始が遅れています。',
    queuedHelp:
      'たいていは自然に動きだします。長引くようならシーンのホストに伝えてください。',
    failed: '取り込みに失敗しました。',
    retry: '取り込みをやり直す',
    neverStarted:
      '取り込みが始まっていません。ファイルの送信で失敗した可能性が高いです。やり直すか、新しいシーンから始めてください。',
    hostPreparing: 'ホストが登場人物を整理しています。まもなくロビーが開きます。',
    startOver: '新しいシーン',
  },

  prepare: {
    title: '登場人物の整理',
    subtitle:
      '自動判定は話者をよく取り違えます。直すのは今です。ロビーを開いたあとは変更できません。',
    charactersHeading: '検出された登場人物',
    linesHeading: 'せりふ',
    linesOf: (name: string) => `${name} のせりふ`,
    showAllLines: 'すべて見る',
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
    startBlockedCharacters:
      '担当者のいない人物（担当するか、もとの音声のままにしてください）：',
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
    micDenied:
      'ブラウザがマイクを拒否しました。許可してページを読み込み直してください。',
    headphonesRequired:
      'ヘッドホンが必要です。録音中に聞こえるのは音楽だけで、もとの声は聞こえません。',
    overflowWarning:
      'テイクが枠をはみ出しています。終わりが切れます。短めに録り直してください。',
    speechZone: '発話区間',
    margin: '余白',
    noTake: 'このクリップにはテイクがありません。',
    uploading: 'テイクを送信中…',
    noCharacter:
      'このシーンでは役が割り当てられていません。ここで他の人の進み具合を見られます。',
    fxTitle: 'ボイス卓',
    fxReset: 'すべて戻す',
    fxReverb: 'リバーブ',
    fxPitch: '高さ',
    fxTune: '音程補正',
    fxHelp:
      'エフェクトは書き出しのときに乗せるもので、録音そのものには入りません。書き出しまで何度でも変えられますし、素の声にも戻せます。',
    fxPresets: {
      dry: '素の声',
      room: '小さな部屋',
      cathedral: '大聖堂',
      cartoon: 'アニメ声',
      deep: '低い声',
      cover: 'カバー',
    },
    emptyTake:
      '何も録音されませんでした。マイクが接続され、選択されているか確かめてから録り直してください。',
    whereEveryoneIs: 'みんなの進み具合',
    you: '（あなた）',
    hostTag: '（ホスト）',
    stateVo: '原音のまま',
    stateDone: '完了',
    stateRecording: '録音中',
    waitingHost: 'ホストが書き出しを始めるのを待っています。',
    hostCanRender: '全員そろいました。書き出しを始められます。',
    stillMissing: 'まだ録っていない台詞があります。',
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
    alignUnsure:
      'このテイクでは合わせどころが見つかりませんでした。そのまま置いています。',
  },

  progress: {
    preparing: 'シーンを準備しています',
    rendering: '仕上げています',
    queued: '順番待ちです。まもなく自動で始まります。',
    working: '数分かかります。タブを開いたままにして、あとで戻ってきても大丈夫です。',
    almost: 'もうすぐ終わります。',
    longer:
      'いつもより時間がかかっていますが、処理は続いています。そのままお待ちください。',
  },
  render: {
    title: '書き出し中',
    queued: 'ワーカー待ちです。パソコンでスクリプトを起動してください。',
    frozen: 'シーンは確定しました。テイクは変更できません。',
    failed: '書き出しに失敗しました。',
    retry: '書き出しをやり直す',
  },

  result: {
    title: '完成',
    download: 'MP4 をダウンロード',
    exportTitle: 'シーンを持ち帰る',
    formatWide: '横長',
    formatWideHint: 'パソコンやテレビの画面向け。',
    formatVertical: '縦長',
    formatVerticalHint: '中央で切り抜き、ストーリーズやリール向け。',
    formatVerticalMissing:
      'このシーンは自動切り抜きより前に書き出されています。もう一度書き出すと手に入ります。',
    share: '共有',
    shareHelp:
      'スマートフォンでは共有から端末の共有メニューが開き、TikTok や Instagram など入っているアプリが並びます。',
    shareUnsupported:
      'このブラウザーはファイルを共有できません。保存してからアプリで投稿してください。',
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
