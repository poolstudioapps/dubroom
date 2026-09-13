/**
 * English dictionary.
 *
 * Mirrors `fr` key for key. The compiler enforces it: a missing key fails
 * the build, which beats a stray French sentence surfacing mid page.
 *
 * Register follows the French: direct, second person, no marketing gloss.
 */

import type { Dictionary } from '../i18n';

export const en = {
  nav: {
    home: 'Home',
    homeShort: 'Home',
    sessions: 'My scenes',
    sessionsShort: 'Scenes',
    community: 'Community',
    communityShort: 'Community',
    myPacks: 'My packs',
    myPacksShort: 'My packs',
  },

  account: {
    title: 'My account',
    subtitle:
      'Your name and picture follow you into every scene. The other players see both.',
    menuLabel: 'My account and sign out',
    menuHint: 'Name, picture, access',
    photo: 'Profile picture',
    photoAdd: 'Add a picture',
    photoChange: 'Change picture',
    photoRemove: 'Remove',
    photoHelp: 'PNG, JPEG or WebP, 2 MB at most. Other guests can see it.',
    displayName: 'Display name',
    displayNameHelp:
      'This is the name others read in the lobby and on the finished credits.',
    saved: 'Saved.',
    accessTitle: 'My access',
    email: 'Email address',
    method: 'Signing in with',
    methodEmail: 'Email link',
    since: 'Member since',
    emailLocked:
      'The address cannot be changed here: it is the one on the guest list. Write to the publisher to have it changed.',
  },

  myPacks: {
    title: 'My packs',
    subtitle:
      'The scenes you published. Anyone can play them, and only you can take them down.',
    sceneCount: (n: number) =>
      n === 1 ? '1 scene published' : `${n} scenes published`,
    emptyTitle: 'You have not published anything yet',
    emptyBody:
      'At the end of a scene imported from a link, you can publish it: the link and the cut join the community, without the video.',
  },

  home: {
    youDub: 'you dub',
    originalScene: 'the original scene',
    demoLines: [
      { name: 'Alba', text: 'Are you sure this is the right door?' },
      { name: 'Rem', text: 'Absolutely not.' },
      { name: 'Noor', text: 'We’re going in anyway.' },
    ],
    carouselLabel: 'How it works',
    rythmoLabel: 'Preview of the rythmo band: the text scrolls under a playhead while you dub.',
    heroTitle: 'Redub your favourite scenes',
    heroBody:
      'You pick a scene, each of you takes a character, and you record on your own time. The original music and atmosphere stay in place: only the voices change. You discover the result at the end, together.',
    kicker: 'The dubbing studio for friends',
    cta: 'Enter the studio',
    ctaSessions: 'See my scenes',
    ctaCommunity: 'Browse ready scenes',
    howTitle: 'How it works',
    reassure1: 'Nothing to install',
    reassure2: 'Record whenever you like',
    reassure3: 'Nothing is published',

    valueTitle: 'What you get',
    value1: {
      title: 'Your voice instead of theirs',
      body: 'You record on your headset mic, at home. The original music and sound effects stay untouched: only the voices are replaced.',
    },
    value2: {
      title: 'Nobody hears a thing until the end',
      body: 'Your takes stay inaudible to everyone else until the final mix exists. Discovering it together at the end is the whole game.',
    },
    value3: {
      title: 'An MP4 you keep',
      body: 'At the end, a file that plays anywhere, with no burnt-in subtitles. The source scene itself is erased.',
    },

    midCta: 'Pick a scene, hand out the roles, and see what comes out.',

    packsCtaTitle: 'You have not published a pack yet',
    packsCtaBody:
      'A scene imported from a link can be shared with the community: the link and the cut are enough, the video is not hosted. Everyone else only has to pick their roles.',
    packsCtaAction: 'Prepare a scene',

    faqTitle: 'Questions we get',
    seoTitle: 'Dub a film scene with friends',
    defineTitle: 'What is dubbing a film scene?',
    defineBody:
      'Dubbing a film scene means replacing the original voices with your own while keeping everything else: the picture, the music, the sound effects, the rhythm. The result is not commentary laid over the top, it is the scene itself, with different actors. Dub’Up is online dubbing software that does this work in the browser, with nothing to install.',
    defineHowTitle: 'How to dub a film scene yourself',
    defineHowBody:
      'It takes three things nobody has at home: separating the voices from the music so that only the voices are replaced, knowing who speaks and when to the millisecond, and staying in sync while talking. Dub’Up does the first two automatically from the scene, and solves the third with a rythmo band, the scrolling text under a playhead that professional dubbing studios have used for eighty years.',
    defineWhoTitle: 'Who it is for',
    defineWhoBody:
      'Groups of friends who want to redo a famous line, fandub makers looking for a tool that is not a video editor, language teachers having a class dub an extract, and anyone learning voice acting who wants to practise on a rythmo band without renting a studio.',
    faqExtra: [
      {
        q: 'Is it free?',
        a: 'Yes. Dub’Up is a personal project, with no ads, no subscription and no limit on scenes.',
      },
      {
        q: 'How is this different from a normal video editor?',
        a: 'A video editor hands you an empty timeline and leaves you to line up your takes by hand. Dub’Up starts from the scene: it separates the voices, finds the lines, assigns them to characters and automatically realigns your takes on the original voice.',
      },
      {
        q: 'Can I dub an English scene from a French interface?',
        a: 'Yes. The interface language and the scene language are independent. The transcribed text is a timing guide, you say whatever you like over it.',
      },
      {
        q: 'How are voices separated from the music?',
        a: 'By a source separation model running on the host machine, which returns two tracks: the voices on one side, the music and atmosphere on the other. Because the split comes from the scene itself, it stays locked to the picture.',
      },
    ] as const,
    faq: [
      {
        q: 'What do I actually need?',
        a: 'A headset with a microphone, and a browser. The headset is not a detail: without it your mic records the soundtrack again and the mix becomes unusable.',
      },
      {
        q: 'Do we all have to be there at once?',
        a: 'No. Everyone records their lines whenever they want. The render starts once everyone is done.',
      },
      {
        q: 'Do I need to know how to dub?',
        a: 'No. The text scrolls under a playhead, the way it does in a real studio: you read, and you land on time. A bad take is redone exactly the same way.',
      },
      {
        q: 'How long does it take?',
        a: 'Count a few minutes of automatic preparation after the import, then as long as there are lines to say. A two-minute scene takes about half an hour with three people.',
      },
      {
        q: 'Are my recordings kept?',
        a: 'No. They are erased along with the source video, as soon as the final mix exists.',
      },
      {
        q: 'Can I invite anyone?',
        a: 'Only addresses added to the guest list can get in. You add an address yourself from your account.',
      },
    ] as const,
    privateTitle: 'A private room, not a network',
    privateBody:
      'Dub’Up is for invited people only. No public catalogue, no sharing outside the circle, no search indexing. That is what makes it workable: we dub extracts of protected works, among friends, without publishing anything.',
    slides: {
      importTitle: 'Pick the scene you know by heart',
      importBody:
        'A link, or a file. By the time you have agreed on the roles, the scene is already cut up, the voices split from the music, every line pinned to the millisecond. The thankless part is done before you have finished choosing.',
      charactersTitle: 'Hand out the parts like a real casting session',
      charactersBody:
        'The characters are already detected and named. Each of you claims one with a click. Any part nobody wants keeps its original voice, and the mix will not give it away.',
      rythmoTitle: 'The text scrolls past, you just play',
      rythmoBody:
        'Like a real studio, the lines run under a playhead. No timing to manage, no editing to learn: you read, and you land on time. A bad take is redone in two seconds, as many times as you like.',
      renderTitle: 'And then comes the moment you press play',
      renderBody:
        'Nobody has heard the others. The scene rolls again, the original picture and music untouched, and it is your voices coming out of the characters. That one minute is what everything else is for.',
    },
  },

  community: {
    title: 'Scenes ready to dub',
    subtitle:
      'Scenes already imported, separated and cut by the group. All that is left is picking roles: no waiting, no preparation to redo.',
    play: 'Dub this scene',
    preview: 'Preview',
    openSource: 'Open the source',
    kindRecipe: 'Recipe',
    kindMedia: 'Files kept',
    recipeHelp:
      'This scene is not hosted here: only the link and the cut are kept. The video is downloaded again at launch, which takes a few minutes.',
    mediaHelp: 'Scene hosted here: it starts straight away.',
    mine: 'Yours',
    voteUp: 'This scene is cut well',
    voteDown: 'This scene is cut badly',
    voteScore: (n: number) => `Community score: ${n}`,
    voteHelp:
      'The vote is about the cut, not the film. A well cut scene saves everyone an evening.',
    sort: {
      label: 'Sort by',
      popular: 'Best rated',
      recent: 'Newest',
      short: 'Shortest',
      title: 'Title (A → Z)',
    },
    filterLang: 'Scene language',
    filterGenre: 'Genre',
    filterCast: 'Number of roles',
    filterLength: 'Length',
    filterAll: 'All',
    filterAllGenres: 'All genres',
    filterAnyCast: 'Any',
    filterAnyLength: 'Any',
    filterReset: 'Show everything',
    filterNoMatch: 'No scene matches',
    filterNoMatchBody:
      'Widen the filters, or publish the scene the catalogue is missing.',
    langUnknown: 'Language unknown',
    langNames: {
      fr: 'French',
      en: 'English',
      es: 'Spanish',
      de: 'German',
      it: 'Italian',
      pt: 'Portuguese',
      ja: 'Japanese',
      ko: 'Korean',
      zh: 'Chinese',
      ru: 'Russian',
    } as Record<string, string>,
    genreNames: {
      action: 'Action',
      comedie: 'Comedy',
      drame: 'Drama',
      animation: 'Animation',
      anime: 'Anime',
      serie: 'TV series',
      super_heros: 'Superhero',
      science_fiction: 'Science fiction',
      horreur: 'Horror',
      jeu_video: 'Video game',
      chanson: 'Song',
      documentaire: 'Documentary',
      autre: 'Other',
    } as Record<string, string>,
    castBuckets: {
      solo: '1 role',
      duo: '2 roles',
      small: '3 or 4 roles',
      large: '5 roles or more',
    } as Record<string, string>,
    lengthBuckets: {
      short: 'Under a minute',
      medium: '1 to 3 minutes',
      long: 'Over 3 minutes',
    } as Record<string, string>,
    sceneCount: (n: number) =>
      n === 1 ? '1 scene available' : `${n} scenes available`,
    characterCount: (n: number) => (n === 1 ? '1 character' : `${n} characters`),
    lineCount: (n: number) => (n === 1 ? '1 line' : `${n} lines`),
    emptyTitle: 'No scene kept yet',
    emptyBody:
      'During a game, the host can tick "keep this scene" before starting the render. It will land here, ready for another group to play.',
    remove: 'Remove from the catalogue',
    removeTitle: 'Remove this scene?',
    removeBody:
      'The video, the separated tracks and the cut will be deleted. Scenes already started from it will stop working. There is no undo.',
    publish: 'Publish to the community',
    published: 'This scene is in the community',
    seeInCommunity: 'See it in the community',
    publishRecipeHelp:
      'Only the link and the cut will be shared. The video is not hosted here.',
    publishFromCatalogue:
      'This scene comes from the catalogue: it is already there. Publishing it again would leave two copies nobody can tell apart.',
    publishTooLate:
      'This scene came from an imported file, and its media was purged after the render. Sharing it had to be decided beforehand. A scene imported from a link stays publishable at any time.',
    keepLabel: 'Keep this scene to play again',
    keepHelp:
      'It will join the Community tab after the render, with its cut and its characters. Your recordings are never kept.',
  },

  theme: {
    cinema: 'Cinema',
    label: 'Look',
    retro: 'Retro',
    modern: 'Modern',
  },

  terms: {
    consent: 'I have read and accept the {terms} and the {privacy}.',
    notice: 'By continuing, you accept the {terms} and the {privacy}.',
    linkTerms: 'terms of use',
    linkPrivacy: 'privacy policy',
    required: 'You need to accept the terms to continue.',
    gateTitle: 'One more thing',
    gateBody:
      'Before you start, you need to accept the terms of use. One checkbox and off you go.',
    gateGist:
      'The short version: you answer for the clips you import and for what you do with them. Everything stays between invited people, nothing is published.',
    gateConfirm: 'Accept and continue',
  },

  legal: {
    mentions: 'Legal notice',
    privacy: 'Privacy',
    terms: 'Terms',
    usageNotice:
      'Strictly private use, between invited people. No content is published or indexed.',
    contact: 'Contact',
    contactEmail: 'ienders.pro@gmail.com',
  },

  status: {
    draft: 'Draft',
    ingest_queued: 'Queued',
    ingesting: 'Importing',
    ingest_failed: 'Import failed',
    prepping: 'To prepare',
    lobby: 'Lobby open',
    recording: 'Recording',
    render_queued: 'Render queued',
    rendering: 'Rendering',
    render_failed: 'Render failed',
    done: 'Done',
  },

  common: {
    untitled: 'Untitled scene',
    stepTitled: (n: number, titre: string) => `Step ${n}: ${titre}`,
    scrollPause: 'Stop the slideshow',
    scrollResume: 'Resume the slideshow',
    step: (n: number, total: number) => `Step ${n} of ${total}`,
    loading: 'Loading…',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    back: 'Back',
    retry: 'Try again',
    close: 'Close',
    copy: 'Copy',
    copied: 'Copied',
    unknownError: 'Something unexpected went wrong.',
  },

  auth: {
    linkExpired: 'This link has expired or has already been used. Sign-in links last one hour and work once. Ask for a new one.',
    linkUsed: 'This link has expired or has already been used. Ask for a new one.',
    linkIncomplete: 'This link is incomplete. Ask for a new one.',
    title: 'Sign in',
    subtitle: 'We send you a link, you click it, done.',
    emailLabel: 'Your email address',
    emailPlaceholder: 'name@example.com',
    send: 'Send me a link',
    sending: 'Sending…',
    sent: 'Link sent. Go check your inbox.',
    notAllowed: 'This address is not on the guest list. Ask the host to add you.',
    errorTitle: 'Cannot sign you in',
    backToSignIn: 'Back to sign in',
    signOut: 'Sign out',

    signIn: 'Sign in',
    passwordLabel: 'Your password',
    badCredentials: 'Wrong address or password.',
    rateLimited:
      'Too many links requested this hour. Ask the host to send you one directly, or sign in with your password.',
    switchToPassword: 'I have a password, let me sign in directly',
    switchToLink: 'I have no password, send me a link',
    inviteOnly: 'Access is limited to invited addresses.',
    discord: 'Continue with Discord',
    orSeparator: 'or by email',
    notAllowedWith: (email: string) =>
      `The address ${email} is not on the guest list. Ask the host to add it. If you came through Discord, it is your Discord account address that counts.`,

    passwordSectionTitle: 'Password',
    passwordSectionHelp: 'Set one to come back without going through your inbox.',
    passwordNew: 'New password',
    passwordSave: 'Save password',
    passwordSaved: 'Password saved. You can use it from your next sign-in.',
    passwordTooShort: 'Eight characters minimum.',
  },

  guests: {
    title: 'Guests',
    help: 'Only these addresses can get in. For Discord, it is the Discord account address that counts, which is not always the usual one.',
    add: 'Invite',
    joined: 'Has been here',
    pending: 'Never been here',
    remove: 'Remove from the list',
  },

  sessions: {
    joinTitle: 'Join the scene',
    joinCode: 'Code',
    title: 'My scenes',
    empty: 'No scene yet. Import one to get started.',
    create: 'New scene',
    open: 'Open',
    storageUsed: (used: string, total: string) => `${used} of ${total}`,
    storageWarning: 'Storage is running out. Delete old scenes to make room.',
    deleteConfirmTitle: 'Delete this scene?',
    deleteConfirmBody:
      'The final mix, the takes and all the metadata will be erased. There is no undo.',
    joinByCode: 'Join with a code',
    join: 'Join',
    storageTitle: 'Storage used',
    storageHelp:
      'The source video and the separated tracks are erased as soon as a render exists: only the final cut takes lasting room. Deleting a scene frees its own.',
    codePlaceholder: 'ABC234',
    codeNotFound: 'No scene matches that code.',
  },

  create: {
    title: 'New scene',
    tabUpload: 'Import a file',
    tabYoutube: 'Paste a YouTube link',
    songLabel: 'It is a song',
    songHelp:
      'We skip the transcription: you know the lyrics. The cutting follows the vocal track and tells you when to come in.',
    matchTitle: 'This scene already exists',
    matchBody:
      'Someone has already prepared it: the cutting, the characters and the text are ready. Taking it starts right away instead of waiting several minutes for the same result.',
    matchLines: 'The lines to say',
    matchUse: 'Start from this scene',
    matchScratch: 'Redo it from scratch',
    tabPack: 'Start from a pack',
    packHelp:
      'Nothing to prepare: the scene is already cut, you pick the roles and record. The full catalogue is in the Community tab.',
    titleLabel: 'Scene title',
    titlePlaceholder: 'The duel on the bridge',
    dropzone: 'Drop your MP4 here, or click to pick one',
    fileTooLarge: 'File too heavy: 2 GB maximum.',
    wrongType: 'A video file is required (MP4 preferably).',
    youtubeLabel: 'Video link',
    youtubePlaceholder: 'https://www.youtube.com/watch?v=…',
    youtubeWarning:
      'YouTube downloading is a convenience, not a guarantee: it breaks regularly. If it fails, import the file directly.',
    multiTrackWarning:
      'If your source has several audio tracks (dubbed, original, commentary), the first one is the one that gets dubbed.',
    durationWarning: 'The scene must be under 10 minutes.',
    keepLabel: 'Make it a shared scene',
    keepHelpUrl:
      'It will join the Community tab. Since it comes from a link, only the link and the cut are kept: nothing is hosted here.',
    keepHelpUpload:
      'Only scenes created from a link can join the community. An imported file stays private to your group: we never re-host the work itself.',
    submitUpload: 'Import and prepare',
    submitYoutube: 'Download and prepare',
    uploading: 'Uploading the file…',
  },

  ingest: {
    title: 'Preparing the scene',
    subtitle: 'The scene is being cut up. It takes a few minutes.',
    queued:
      'Waiting for the worker.',
    queuedHelp:
      'The scene starts as soon as the worker is running on the host’s PC: launch start.bat.',
    failed: 'The import failed.',
    retry: 'Restart the import',
    neverStarted:
      'The import never started: the file upload probably failed. Start it again, or begin a new scene.',
    hostPreparing:
      'The host is sorting out the characters. The lobby opens in a moment.',
    startOver: 'New scene',
  },

  prepare: {
    selectCharacter: (nom: string) => `Select ${nom}`,
    selectLine: (code: string) => `Select the line at ${code}`,
    listen: 'Listen',
    lineText: 'Line text',
    title: 'Sort out the characters',
    subtitle:
      'Automatic detection often gets the character wrong. Now is the time to fix it: once the lobby opens, none of this can change.',
    charactersHeading: 'Detected characters',
    linesHeading: 'Lines',
    linesOf: (name: string) => `Lines of ${name}`,
    showAllLines: 'Show everything',
    lineCount: (n: number) => (n === 1 ? '1 line' : `${n} lines`),
    speakTime: 'Speaking time',
    playLongest: 'Play the longest extract',
    rename: 'Rename',
    merge: 'Merge',
    mergeInto: (name: string) => `Merge into ${name}`,
    mergeHint: 'Select at least two characters to merge them.',
    mergeConfirm: (from: string, to: string) =>
      `Every line of ${from} will move to ${to}. ${from} will be deleted.`,
    splitToNew: 'Move to a new character',
    reassign: 'Reassign to…',
    assignedTo: 'Assigned to',
    changeCharacter: 'Change character',
    selectedCount: (n: number) =>
      n === 1 ? '1 line selected →' : `${n} lines selected →`,
    howTitle: 'Check who says what',
    howBody:
      'Every line carries the name of the character it belongs to. Click that name to hand it to someone else. On the left, rename a character or merge two voices that detection split by mistake.',
    selectAll: 'Select all',
    selectNone: 'Clear selection',
    deleteLine: 'Delete the line',
    deleteLineHint: 'The original audio will be kept at that spot.',
    textIsAGuide: 'The text is only a timing guide. Fix it only if it is unreadable.',
    openLobby: 'Open the lobby',
    openLobbyConfirm:
      'Once the lobby is open, characters and lines can no longer be changed.',
    lockedAfterLobby: 'Preparation has been locked since the lobby opened.',
    recalculating: 'Recomputing clips…',
    noSelection: 'Select lines to move them.',
    restoreLine: 'Restore the line',
    deletedBadge: 'Deleted, original audio kept',
  },

  lobby: {
    hostTag: '(host)',
    title: 'Lobby',
    shareLink: 'Link to share',
    shareCode: 'Scene code',
    watchOriginal: 'Watch the original scene',
    characters: 'Characters',
    takeCharacter: 'Take this character',
    dropCharacter: 'Give up this character',
    releaseCharacter: 'Leave as original',
    unrelease: 'Make available again',
    releasedBadge: 'Original kept',
    takenBy: (name: string) => `Taken by ${name}`,
    free: 'Free',
    ready: 'I am ready',
    notReady: 'I am not ready',
    readyBadge: 'Ready',
    waitingBadge: 'Waiting',
    players: 'Players',
    start: 'Start the game',
    startBlockedTitle: 'Something is still missing:',
    startBlockedCharacters:
      'characters with no player, to take or to leave as original:',
    startBlockedReady: 'players who have not said they are ready:',
    clipCount: (n: number) => (n === 1 ? '1 clip' : `${n} clips`),
    hostOnly: 'Only the host can start the game.',
  },

  studio: {
    fxNoTake: 'Record this line first: effects are then applied to the take.',
    playBlocked: 'The browser blocked playback. Tap the button again.',
    reassign: (nom: string) => `Reassign ${nom}`,
    pickPlayer: 'Pick a player…',
    title: 'Studio',
    clipProgress: (current: number, total: number) => `Clip ${current} / ${total}`,
    playOriginal: 'Play the scene (original)',
    record: 'Record',
    stop: 'Stop',
    playTake: 'My take',
    redo: 'Redo',
    validate: 'Keep and next',
    finish: 'I am done',
    takeSaved: 'Take saved.',
    backToClips: 'Back to my clips',
    allTakesSaved:
      'All your takes are saved. You can close the page: the host will start the render once everyone is done. You can also redo one until the render starts.',
    validated: 'Kept',
    previous: 'Previous',
    next: 'Next',
    backingVolume: 'Background level',
    micOffset: 'Mic offset',
    micOffsetHelp:
      'If your takes always land late, lower this value. It is applied at mixing time.',
    calibrate: 'Calibrate automatically',
    calibrating: 'Calibrating… stay quiet.',
    calibrationDone: (ms: number) => `Measured offset: ${ms} ms.`,
    calibrationFailed: 'Could not measure the offset. Set it by hand if needed.',
    micDenied: 'The browser refused the microphone. Allow it, then reload the page.',
    headphonesRequired:
      'Headphones required. While recording you only hear the music, never the original voices.',
    overflowWarning:
      'Your take runs past the window, the end will be cut. Do it shorter.',
    speechZone: 'Speaking zone',
    margin: 'Margin',
    noTake: 'No take for this clip.',
    uploading: 'Uploading the take…',
    noCharacter:
      'No character was assigned to you on this scene. You can follow the others here.',
    fxTitle: 'Voice desk',
    fxReset: 'Flatten',
    fxReverb: 'Reverb',
    fxPitch: 'Pitch',
    fxTune: 'Tuning',
    fxHelp:
      'Effects apply to the take shown here, and only to it. They are added at mixing, never to the recording: you can change or remove them until the render.',
    fxPresets: {
      dry: 'Bare voice',
      room: 'Small room',
      cathedral: 'Cathedral',
      cartoon: 'Cartoon',
      deep: 'Deep voice',
      cover: 'Cover',
    },
    emptyTake:
      'Nothing was recorded. Check that your microphone is plugged in and selected, then take it again.',
    whereEveryoneIs: 'Where everyone is',
    you: '(you)',
    hostTag: '(host)',
    stateVo: 'Original',
    stateDone: 'Done',
    stateRecording: 'Recording',
    waitingHost: 'Waiting for the host to start the render.',
    hostCanRender: 'Everyone is done: you can start the render.',
    stillMissing: 'Some lines are still to be recorded.',
    finishedTitle: 'You are done!',
    finishedBody: 'You can still come back and redo a take until the render starts.',
    waitingFor: 'Still waiting on:',
    playerProgress: (name: string, done: number, total: number) =>
      `${name} (${done}/${total})`,
    everyoneDone: 'Everyone is done. The host can start the render.',
    othersDone: 'The others are done. Only you are left.',
    soloScene: 'You are alone on this scene.',
    soloHint: 'Every character is yours: nobody else to wait for.',
    launchRender: 'Start the render',
    renderBlocked: 'Some clips still have no take.',
    kick: 'Remove this player',
    kickConfirm: (name: string) =>
      `${name} will be removed and their characters will go back to the original audio. Their takes will be ignored.`,
    reassignInstead: 'Reassign their character to someone else',
    kicked: 'The host removed you from this scene.',
    myClips: 'My clips',
    youAreDubbing: 'You are dubbing',
    cueIn: 'Your turn in',
    cueNow: 'YOUR TURN',
    cueDone: 'Line gone by',
    cueIdle: 'Ready',
    originalTrace: 'The coloured trace shows when the original voice speaks.',
    micWindow: 'The mic only opens on your line.',
    autoAlign: 'Automatic alignment',
    autoAlignHelp:
      'Your take is compared to the original voice and moved to the right spot. Turn it off if you would rather keep your exact timing.',
    alignedBy: (ms: number) =>
      ms === 0
        ? 'Your take already landed on time.'
        : ms > 0
          ? `You were ${ms} ms late, that is fixed.`
          : `You were ${-ms} ms early, that is fixed.`,
    alignUnsure:
      'Alignment found nothing clear on this take. It is placed as recorded.',
  },

  progress: {
    preparing: 'Preparing the scene',
    rendering: 'Putting it together',
    queued:
      'In the queue: the host’s worker picks it up as soon as it runs.',
    working: 'Count a few minutes. You can leave the tab open and come back later.',
    almost: 'Nearly there.',
    longer: 'This is taking longer than usual, but it is still running. Let it finish.',
  },
  render: {
    title: 'Rendering',
    queued:
      'Waiting for the worker.',
    frozen: 'The scene is frozen: takes can no longer be changed.',
    failed: 'The render failed.',
    retry: 'Restart the render',
  },

  result: {
    title: 'The result',
    download: 'Download the MP4',
    exportTitle: 'Take the scene with you',
    formatWide: 'Wide format',
    formatWideHint: 'For a computer screen or a television.',
    formatVertical: 'Phone format',
    formatVerticalHint: 'Cropped to the centre, for stories and reels.',
    formatVerticalMissing:
      'This scene was rendered before automatic cropping. Run the render again to get it.',
    share: 'Share',
    shareHelp:
      'On a phone, Share opens the system sheet: TikTok, Instagram and whatever else is installed show up there.',
    shareUnsupported:
      'This browser cannot share a file. Download it, then post it from the app.',
    cast: 'The cast',
    voiceOriginal: 'Original kept',
    shareHint: 'The link only works for people in this scene.',
    sourcePurged: 'The source has been deleted: only the final mix is kept.',
  },

  errors: {
    notFound: 'Not found.',
    forbidden: 'You do not have access to this scene.',
    sessionLocked: 'This scene can no longer be changed.',
    hostOnly: 'Only the host can do that.',
    noAudioTrack: 'This file has no audio track.',
    noVideoTrack: 'This file has no video.',
    tooLong: 'Scene too long: 10 minutes maximum.',
    youtubeFailed:
      'The YouTube download failed. Import the video file directly instead.',
  },
} satisfies Dictionary;
