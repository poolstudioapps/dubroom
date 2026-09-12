/**
 * English dictionary.
 *
 * Mirrors `fr` key for key. The compiler enforces it: a missing key fails
 * the build, which beats a stray French sentence surfacing mid page.
 *
 * Register follows the French: direct, second person, no marketing gloss.
 */

import type { Dictionary } from '../i18n';
import { INGEST_STEPS, RENDER_STEPS } from '../constants';

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
    sceneCount: (n: number) => (n === 1 ? '1 scene published' : `${n} scenes published`),
    emptyTitle: 'You have not published anything yet',
    emptyBody:
      'At the end of a scene imported from a link, you can publish it: the link and the cut join the community, without the video.',
  },

  home: {
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
      body:
        'You record on your headset mic, at home. The original music and sound effects stay untouched: only the voices are replaced.',
    },
    value2: {
      title: 'Nobody hears a thing until the end',
      body:
        'Your takes stay inaudible to everyone else until the final mix exists. Discovering it together at the end is the whole game.',
    },
    value3: {
      title: 'An MP4 you keep',
      body:
        'At the end, a file that plays anywhere, with no burnt-in subtitles. The source scene itself is erased.',
    },

    midCta: 'Pick a scene, hand out the roles, and see what comes out.',

    packsCtaTitle: 'You have not published a pack yet',
    packsCtaBody:
      'A scene imported from a link can be shared with the community: the link and the cut are enough, the video is not hosted. Everyone else only has to pick their roles.',
    packsCtaAction: 'Prepare a scene',

    faqTitle: 'Questions we get',
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
      'DubRoom is for invited people only. No public catalogue, no sharing outside the circle, no search indexing. That is what makes it workable: we dub extracts of protected works, among friends, without publishing anything.',
    slides: {
      importTitle: 'Import a scene',
      importBody:
        'A video file, or a link. The soundtrack is split in two: the voices on one side, the music and atmosphere on the other. That split comes from the scene itself, so it lines up with the picture to the millisecond.',
      charactersTitle: 'Sort out the characters',
      charactersBody:
        'The lines are transcribed and assigned automatically. The host corrects it in a few clicks: rename, merge two voices that were confused, reassign a line. Then the lobby opens and everyone picks a role.',
      rythmoTitle: 'Dub along the scrolling band',
      rythmoBody:
        'The text scrolls under a playhead, the way it does in a real dubbing studio. While recording you only hear the music, never the original voices: the picture and the text are enough to land on time.',
      renderTitle: 'Discover the result',
      renderBody:
        'Everything is mixed back together: the original picture, the original music, and your voices in place of theirs. An MP4 that plays anywhere, with no burnt-in subtitles, and that you keep.',
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
    sortedByScore: 'Best rated first',
    sceneCount: (n: number) => (n === 1 ? '1 scene available' : `${n} scenes available`),
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
    publishTooLate:
      'This scene came from an imported file, and its media was purged after the render. Sharing it had to be decided beforehand. A scene imported from a link stays publishable at any time.',
    keepLabel: 'Keep this scene to play again',
    keepHelp:
      'It will join the Community tab after the render, with its cut and its characters. Your recordings are never kept.',
  },

  legal: {
    mentions: 'Legal notice',
    privacy: 'Privacy',
    usageNotice:
      'Strictly private use, between invited people. No content is published or indexed.',
    contact: 'Contact',
    contactEmail: 'ienders.pro@gmail.com',
  },

  common: {
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
    title: 'Sign in',
    subtitle: 'We send you a link, you click it, done.',
    emailLabel: 'Your email address',
    emailPlaceholder: 'name@example.com',
    send: 'Send me a link',
    sending: 'Sending…',
    sent: 'Link sent. Go check your inbox.',
    notAllowed:
      'This address is not on the guest list. Ask the host to add you.',
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
    passwordSectionHelp:
      'Set one to come back without going through your inbox.',
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
    title: 'My scenes',
    empty: 'No scene yet. Import one to get started.',
    create: 'New scene',
    open: 'Open',
    storageUsed: (used: string, total: string) => `${used} of ${total}`,
    storageWarning:
      'Storage is running out. Delete old scenes to make room.',
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
      'It will join the Community tab after the render. Since it comes from a file, the video and the separated tracks are kept, around ten megabytes.',
    submitUpload: 'Import and prepare',
    submitYoutube: 'Download and prepare',
    uploading: 'Uploading the file…',
  },

  ingest: {
    title: 'Preparing the scene',
    subtitle: 'The scene is being cut up. It takes a few minutes.',
    queued: 'Waiting for the worker. Start the script on your PC.',
    queuedHelp:
      'Processing runs on the host machine. Double-click start.bat and the job will pick itself up.',
    failed: 'The import failed.',
    retry: 'Restart the import',
    neverStarted:
      'The import never started: the file upload probably failed. Start it again, or begin a new scene.',
    startOver: 'New scene',
    steps: {
      download: 'Fetching the video',
      encode: 'Normalising',
      extract: 'Extracting the audio',
      separate: 'Separating voices and background',
      transcribe: 'Transcribing and detecting characters',
      segment: 'Cutting the lines',
    } satisfies Record<(typeof INGEST_STEPS)[number], string>,
  },

  prepare: {
    title: 'Sort out the characters',
    subtitle:
      'Automatic detection often gets the character wrong. Now is the time to fix it: once the lobby opens, none of this can change.',
    charactersHeading: 'Detected characters',
    linesHeading: 'Lines',
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
    textIsAGuide:
      'The text is only a timing guide. Fix it only if it is unreadable.',
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
    startBlockedCharacters: 'characters with no player, to take or to leave as original:',
    startBlockedReady: 'players who have not said they are ready:',
    clipCount: (n: number) => (n === 1 ? '1 clip' : `${n} clips`),
    hostOnly: 'Only the host can start the game.',
  },

  studio: {
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
    calibrationFailed:
      'Could not measure the offset. Set it by hand if needed.',
    micDenied:
      'The browser refused the microphone. Allow it, then reload the page.',
    headphonesRequired:
      'Headphones required. While recording you only hear the music, never the original voices.',
    overflowWarning:
      'Your take runs past the window, the end will be cut. Do it shorter.',
    speechZone: 'Speaking zone',
    margin: 'Margin',
    noTake: 'No take for this clip.',
    uploading: 'Uploading the take…',
    finishedTitle: 'You are done!',
    finishedBody:
      'You can still come back and redo a take until the render starts.',
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

  render: {
    title: 'Rendering',
    queued: 'Waiting for the worker. Start the script on your PC.',
    frozen: 'The scene is frozen: takes can no longer be changed.',
    failed: 'The render failed.',
    retry: 'Restart the render',
    steps: {
      fetch: 'Fetching the takes',
      mix: 'Mixing the audio',
      mux: 'Assembling the video',
      upload: 'Uploading the result',
      purge: 'Cleaning up the source',
    } satisfies Record<(typeof RENDER_STEPS)[number], string>,
  },

  result: {
    title: 'The result',
    download: 'Download the MP4',
    cast: 'The cast',
    voiceOriginal: 'Original kept',
    shareHint: 'The link only works for people in this scene.',
    sourcePurged:
      'The source has been deleted: only the final mix is kept.',
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
