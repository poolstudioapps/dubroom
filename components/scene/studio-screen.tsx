'use client';

import { useMutation } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Circle, Play, Square } from 'lucide-react';

import { useT } from '@/lib/i18n';
import { FinishedPanel } from '@/components/scene/finished-panel';
import { PlayerProgressList } from '@/components/scene/player-progress';
import { RythmoBand } from '@/components/scene/rythmo-band';
import { SpeakCue } from '@/components/scene/speak-cue';
import { StudioSidebar } from '@/components/scene/studio-sidebar';
import { VoiceConsole } from '@/components/scene/voice-console';
import { WaveformView } from '@/components/scene/waveform-view';
import { useSceneCtx } from '@/components/scene-page';
import { Alert, Badge, Button, Card, Spinner } from '@/components/ui';
import {
  ALIGN_HISTORY,
  AUDIO_SYNC_TOLERANCE_MS,
  BUCKET_TAKES,
  DEFAULT_BACKING_VOLUME,
  LEGACY_MIC_OFFSET_STORAGE_KEY,
  MIC_OFFSET_BASELINE_MS,
  MIC_OFFSET_STORAGE_KEY,
  REC_LEAD_IN_MS,
  REC_TAIL_MS,
  TAKE_MIN_MS,
  SIGNED_URL_TTL_S,
  characterColorVar,
} from '@/config/constants';

import { uploadTake } from '@/lib/actions';
import { MicRecorder } from '@/lib/audio/recorder';
import { seekAll, unlockMedia } from '@/lib/audio/media';
import { alignTake, envelopeFromBlob, type Alignment } from '@/lib/audio/align';
import { decodeEnvelope } from '@/lib/audio/envelope';
import { analyzeTake, type TakeAnalysis } from '@/lib/audio/waveform';
import { useMediaUrls, useTakes } from '@/lib/data';
import { humanizeError } from '@/lib/errors';
import { clipsForParticipant, selectedTakeByClip } from '@/lib/scene-stats';
import { supabaseBrowser } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useNarrowViewport, useShortViewport } from '@/lib/viewport';

type Mode = 'idle' | 'original' | 'recording' | 'playback';

export function StudioScreen() {
  const t = useT();

  const compact = useShortViewport();
  /*
   * Sur telephone, chaque bande gagnee rapproche le bouton
   * d'enregistrement du premier ecran. Il reste atteignable de toute
   * facon — la barre de transport est collee en bas — mais le voir sans
   * faire defiler change la premiere impression du studio.
   */
  const narrow = useNarrowViewport();
  const { session, characters, clips, lines, me, isHost, refetch } = useSceneCtx();
  const media = useMediaUrls(session);

  const videoRef = useRef<HTMLVideoElement>(null);
  const musicRef = useRef<HTMLAudioElement>(null);
  const takeRef = useRef<HTMLAudioElement>(null);
  const recorderRef = useRef<MicRecorder>(new MicRecorder());
  const takeTimer = useRef<number | null>(null);

  const [mode, setMode] = useState<Mode>('idle');
  const [index, setIndex] = useState(0);
  const [backing, setBacking] = useState(DEFAULT_BACKING_VOLUME);
  const [micOffset, setMicOffset] = useState(me?.mic_offset_ms ?? 0);
  const [analysis, setAnalysis] = useState<TakeAnalysis | null>(null);
  const [takeUrl, setTakeUrl] = useState<string | null>(null);
  const localTakeUrl = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [micReady, setMicReady] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  /** Calage de la derniere prise, et memoire des precedentes. */
  const [alignment, setAlignment] = useState<Alignment | null>(null);
  const [autoAlign, setAutoAlign] = useState(true);
  const lagHistory = useRef<number[]>([]);
  /**
   * Instant de la scene ou le micro s'est reellement ouvert.
   *
   * Il n'est pas connu d'avance : on arme le micro quand la lecture
   * atteint la zone de parole, et la lecture n'a pas une precision a la
   * milliseconde. On releve donc l'heure exacte a l'ouverture.
   */
  const recStartedAtMs = useRef<number | null>(null);

  const myClips = useMemo(
    () => (me ? clipsForParticipant(me.id, characters, clips) : []),
    [me, characters, clips],
  );
  const takesQuery = useTakes(
    session.id,
    myClips.map((c) => c.id),
  );
  const selectedTakes = useMemo(
    () => selectedTakeByClip(takesQuery.data ?? []),
    [takesQuery.data],
  );

  const doneCount = myClips.filter((c) => selectedTakes.has(c.id)).length;
  const allDone = myClips.length > 0 && doneCount === myClips.length;
  const isLastClip = index >= myClips.length - 1;

  const clip = myClips[index];
  const character = characters.find((c) => c.id === clip?.character_id) ?? null;
  const currentTake = clip ? (selectedTakes.get(clip.id) ?? null) : null;

  // ── Restauration du reglage de latence ─────────────────────────────
  useEffect(() => {
    const stored =
      window.localStorage.getItem(MIC_OFFSET_STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_MIC_OFFSET_STORAGE_KEY);
    if (stored && me?.mic_offset_ms === 0) setMicOffset(Number(stored));
  }, [me?.mic_offset_ms]);

  // ── Transport ───────────────────────────────────────────────────────

  const stopAll = useCallback(() => {
    if (takeTimer.current !== null) {
      window.clearTimeout(takeTimer.current);
      takeTimer.current = null;
    }
    videoRef.current?.pause();
    musicRef.current?.pause();
    takeRef.current?.pause();
    setMode('idle');
  }, []);

  /**
   * Boucle de transport. Elle tient deux choses :
   * l'arret exact a la fin de la fenetre du clip, et le recalage du stem
   * de fond sur la video. Le fond est un element audio separe, il derive
   * sinon de quelques dizaines de ms sur une scene entiere.
   */
  useEffect(() => {
    if (mode === 'idle' || !clip) return;
    let frame = 0;

    // Bornes du micro : on ouvre un peu avant la replique et on ferme un
    // peu apres, jamais sur toute la fenetre.
    const micOpenMs = Math.max(
      clip.window_start_ms,
      clip.speech_start_ms - REC_LEAD_IN_MS,
    );
    const micCloseMs = Math.min(clip.window_end_ms, clip.speech_end_ms + REC_TAIL_MS);

    const tick = () => {
      frame = requestAnimationFrame(tick);
      const video = videoRef.current;
      const music = musicRef.current;
      if (!video) return;

      const nowMs = video.currentTime * 1000;

      if (mode === 'recording') {
        const recorder = recorderRef.current;
        if (
          !recorder.recording &&
          recStartedAtMs.current === null &&
          nowMs >= micOpenMs
        ) {
          // On releve l'heure reelle : c'est elle qui servira a replacer
          // la prise au mixage, pas la valeur theorique.
          recStartedAtMs.current = nowMs;
          recorder.start();
        }
        if (recorder.recording && nowMs >= micCloseMs) {
          void finishRecording();
          return;
        }
      }

      if (nowMs >= clip.window_end_ms) {
        if (mode === 'recording') void finishRecording();
        else stopAll();
        return;
      }

      if (music && !music.paused) {
        const drift = Math.abs(music.currentTime - video.currentTime) * 1000;
        if (drift > AUDIO_SYNC_TOLERANCE_MS) music.currentTime = video.currentTime;
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, clip, stopAll]);

  useEffect(() => {
    const music = musicRef.current;
    if (music) music.volume = backing;
  }, [backing]);

  // Changer de clip coupe tout : on ne laisse jamais un transport
  // continuer sur un clip qu'on ne regarde plus.
  useEffect(() => {
    stopAll();
    setAnalysis(null);
    setTakeUrl(null);
  }, [index, stopAll]);

  // Recharge la prise retenue du clip courant pour l'afficher et la
  // reecouter, y compris apres un retour en arriere.
  useEffect(() => {
    let cancelled = false;
    if (!currentTake) return;

    void (async () => {
      const { data } = await supabaseBrowser()
        .storage.from(BUCKET_TAKES)
        .createSignedUrl(currentTake.audio_path, SIGNED_URL_TTL_S);
      if (cancelled || !data?.signedUrl) return;
      setTakeUrl(data.signedUrl);

      try {
        const blob = await (await fetch(data.signedUrl)).blob();
        const result = await analyzeTake(blob);
        if (!cancelled) setAnalysis(result);
      } catch {
        // La forme d'onde est un confort : son echec ne doit pas
        // empecher de reecouter ou de refaire la prise.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentTake]);

  async function seekToWindow() {
    if (!clip) return;
    // seekAll attend les metadonnees puis la fin reelle du saut. Sans
    // cela, la lecture demarre a l'ancienne position et la prise est
    // calee a cote — un defaut qui ne se voit qu'au rendu final.
    await seekAll([videoRef.current, musicRef.current], clip.window_start_ms / 1000);
  }

  /** Mode VO : mix original complet, micro coupe (PRD §11.2). */
  async function playOriginal() {
    if (!clip) return;
    stopAll();
    const video = videoRef.current;
    if (!video) return;
    // Pendant le toucher, avant toute attente : voir `unlockMedia`.
    unlockMedia([video, musicRef.current, takeRef.current]);
    video.muted = false;
    await seekToWindow();
    musicRef.current?.pause();
    setMode('original');
    try {
      await video.play();
    } catch {
      stopAll();
      setError(t.studio.playBlocked);
    }
  }

  /**
   * Mode enregistrement : stem fond uniquement, jamais les voix d'origine.
   * C'est la regle la plus importante du studio (PRD §11.2) — la video est
   * donc coupee, et seul le stem de fond sort.
   */
  async function startRecording() {
    if (!clip) return;
    setError(null);
    stopAll();

    const video = videoRef.current;
    const music = musicRef.current;
    if (!video) return;

    // Tout de suite, pendant le toucher : l'autorisation du micro et le
    // calage qui suivent font perdre le geste sur iPhone.
    unlockMedia([video, music, takeRef.current]);

    try {
      await recorderRef.current.prime();
      setMicReady(true);
    } catch {
      setError(t.studio.micDenied);
      return;
    }

    video.muted = true;
    await seekToWindow();

    setAnalysis(null);
    setTakeUrl(null);
    setAlignment(null);
    recStartedAtMs.current = null;
    setMode('recording');

    // Pas de decompte : les deux secondes de marge tiennent ce role
    // (PRD §11.4). La lecture demarre ici ; le micro, lui, ne s'ouvre
    // qu'a l'entree de la zone de parole, ouvert par la boucle de
    // transport. On ne capte donc que ce qu'il y a a doubler.
    try {
      await Promise.all([video.play(), music ? music.play() : Promise.resolve()]);
    } catch {
      /*
       * Une lecture refusee laissait l'ecran en mode enregistrement pour
       * toujours : la video ne partait pas, le micro attendait une
       * replique qui n'arrivait jamais, et rien ne le disait.
       */
      stopAll();
      recStartedAtMs.current = null;
      setError(t.studio.playBlocked);
    }
  }

  const upload = useMutation({
    mutationFn: async (input: { blob: Blob; durationMs: number; offsetMs: number }) => {
      if (!clip || !me) throw new Error('Clip introuvable');
      return uploadTake({
        sessionId: session.id,
        participantId: me.id,
        clipId: clip.id,
        blob: input.blob,
        durationMs: input.durationMs,
        offsetMs: input.offsetMs,
      });
    },
    onSuccess: () => {
      refetch();
      void takesQuery.refetch();
    },
    onError: (e) => setError(humanizeError(e)),
  });

  async function finishRecording() {
    if (!recorderRef.current.recording) {
      stopAll();
      recStartedAtMs.current = null;
      return;
    }
    const blob = await recorderRef.current.stop();
    const openedAtMs = recStartedAtMs.current;
    recStartedAtMs.current = null;
    stopAll();

    // Une URL d'objet retient le blob en memoire tant qu'elle n'est pas
    // revoquee : sur une soiree de doublage, cela fait vite plusieurs
    // dizaines de prises conservees pour rien.
    if (localTakeUrl.current) URL.revokeObjectURL(localTakeUrl.current);
    localTakeUrl.current = URL.createObjectURL(blob);
    setTakeUrl(localTakeUrl.current);
    /*
     * Une prise qu'on ne peut pas decoder n'est pas une prise.
     *
     * Elle etait envoyee quand meme, et le rendu tombait dessus des
     * jours plus tard sans que rien ne relie l'echec a cet
     * enregistrement-la. Mieux vaut le dire tout de suite, tant que le
     * casque est encore sur les oreilles.
     */
    let durationMs = clip ? clip.speech_end_ms - clip.speech_start_ms : 0;
    let analysed: TakeAnalysis | null = null;
    try {
      analysed = await analyzeTake(blob);
      durationMs = Math.round(analysed.durationMs);
    } catch {
      analysed = null;
    }
    setAnalysis(analysed);

    if (!analysed || durationMs < TAKE_MIN_MS) {
      setError(t.studio.emptyTake);
      setTakeUrl(null);
      return;
    }

    // Ou poser la prise : la ou le micro s'est ouvert, et non au debut de
    // la fenetre, puis corrige du retard mesure sur la voix d'origine.
    const placedAtMs = openedAtMs ?? clip?.window_start_ms ?? 0;
    let offsetMs = clip ? placedAtMs - clip.window_start_ms : 0;

    const measured = await measureLag(blob, placedAtMs);
    setAlignment(measured);

    if (measured?.reliable && autoAlign) {
      lagHistory.current = [...lagHistory.current, measured.lagMs].slice(
        -ALIGN_HISTORY,
      );
      offsetMs -= measured.lagMs;
    }

    upload.mutate({ blob, durationMs, offsetMs });
  }

  /**
   * De combien cette prise est-elle en retard sur la voix d'origine ?
   *
   * Un echec ne coute rien : la prise est simplement posee la ou le micro
   * s'est ouvert, ce qui est deja bien plus juste qu'avant.
   */
  async function measureLag(blob: Blob, placedAtMs: number): Promise<Alignment | null> {
    const original = decodeEnvelope(session.voice_peaks);
    if (!original || !session.voice_peaks_hz) return null;
    try {
      const envelope = await envelopeFromBlob(blob);
      return alignTake(envelope, original, session.voice_peaks_hz, placedAtMs);
    } catch {
      return null;
    }
  }

  /** Reecoute : fond + la prise, posee comme au mixage. */
  async function playTake() {
    if (!clip || !takeUrl) return;
    stopAll();
    const video = videoRef.current;
    const music = musicRef.current;
    const take = takeRef.current;
    if (!video || !take) return;

    unlockMedia([video, music, take]);
    video.muted = true;
    await seekToWindow();
    setMode('playback');

    /*
     * Reproduire exactement ce que fera le mixage.
     *
     * Une prise ne commence plus au debut de la fenetre : le micro
     * s'ouvre a l'entree de la zone de parole, et le calage automatique
     * la deplace encore. Le retard a simuler est donc celui de la prise,
     * plus le decalage micro, compte depuis le debut de la fenetre.
     */
    const delayMs = (currentTake?.offset_ms ?? 0) + micOffset + MIC_OFFSET_BASELINE_MS;
    take.currentTime = delayMs < 0 ? -delayMs / 1000 : 0;
    try {
      await Promise.all([video.play(), music ? music.play() : Promise.resolve()]);
      if (delayMs > 0) {
        takeTimer.current = window.setTimeout(() => {
          take.play().catch(() => setError(t.studio.playBlocked));
        }, delayMs);
      } else {
        await take.play();
      }
    } catch {
      stopAll();
      setError(t.studio.playBlocked);
    }
  }

  useEffect(() => {
    const recorder = recorderRef.current;
    return () => {
      recorder.release();
      if (localTakeUrl.current) URL.revokeObjectURL(localTakeUrl.current);
    };
  }, []);

  if (!me) {
    return <Alert tone="danger">{t.errors.forbidden}</Alert>;
  }

  if (myClips.length === 0) {
    return (
      <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[1fr_22rem]">
        <Card variant="plate" className="space-y-3 self-start">
          <h1 className="text-lg font-semibold">{t.studio.title}</h1>
          <p className="text-sm text-text-muted">{t.studio.noCharacter}</p>

          {/* Sans role a jouer, on regarde les autres avancer. */}
          <div className="space-y-2 pt-1">
            <h2 className="text-xs font-bold uppercase tracking-widest text-text-faint">
              {t.studio.whereEveryoneIs}
            </h2>
            <PlayerProgressList sessionId={session.id} myParticipantId={me.id} />
          </div>
        </Card>
        {/*
          La colonne de reglages defile pour elle seule. Le studio tient
          dans une fenetre fixe : sans ce conteneur, ses cartes passaient
          sous le bord bas et le bouton de rendu devenait inatteignable.
        */}
        <div className="min-w-0 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
          <StudioSidebar
            backing={backing}
            onBacking={setBacking}
            micOffset={micOffset}
            onMicOffset={setMicOffset}
            autoAlign={autoAlign}
            onAutoAlign={setAutoAlign}
            done={0}
            total={0}
          />
        </div>
      </div>
    );
  }

  if (!clip || !character) return <Spinner />;

  const recording = mode === 'recording';

  /**
   * Ce qu'il y a a dire, et rien de plus.
   *
   * Un seul message a la fois, par ordre d'urgence : ce qui bloque
   * passe avant ce qui rassure. La ligne existe toujours, meme vide,
   * pour que rien ne bouge autour.
   */
  const statut: { tone: 'danger' | 'warn' | 'ok' | 'muted'; text: string } = error
    ? { tone: 'danger', text: error }
    : upload.isPending
      ? { tone: 'muted', text: t.studio.uploading }
      : analysis?.truncated
        ? { tone: 'warn', text: t.studio.overflowWarning }
        : allDone
          ? { tone: 'ok', text: t.studio.allTakesSaved }
          : currentTake
            ? { tone: 'ok', text: t.studio.takeSaved }
            : !micReady
              ? { tone: 'muted', text: t.studio.headphonesRequired }
              : { tone: 'muted', text: t.studio.micWindow };

  if (acknowledged && allDone) {
    return (
      <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[1fr_22rem]">
        <FinishedPanel
          sessionId={session.id}
          myParticipantId={me.id}
          isHost={isHost}
          onBack={() => setAcknowledged(false)}
        />
        <div className="min-w-0 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
          <StudioSidebar
            backing={backing}
            onBacking={setBacking}
            micOffset={micOffset}
            onMicOffset={setMicOffset}
            autoAlign={autoAlign}
            onAutoAlign={setAutoAlign}
            done={doneCount}
            total={myClips.length}
            take={currentTake}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-[1fr_22rem]">
      {/*
        Colonne principale : tout y est de hauteur fixe sauf l'image, qui
        absorbe ce qui reste. C'est ce qui permet a l'ecran de tenir dans
        la fenetre quelle qu'elle soit, au lieu de pousser les commandes
        sous la ligne de flottaison pendant qu'on enregistre.
      */}
      <div className="flex min-w-0 flex-col gap-2 lg:min-h-0">
        {/*
          L'ordre change entre telephone et ordinateur, d'ou les classes
          `order-*` sur les blocs qui suivent. Le DOM, lui, garde l'ordre
          de lecture : entete, image, ce qu'on joue, commandes.
        */}
        <header className="order-1 flex shrink-0 flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: characterColorVar(character.color) }}
              aria-hidden
            />
            <h1 className="font-semibold">{character.name}</h1>
            {currentTake ? <Badge tone="ok">{t.studio.validated}</Badge> : null}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-faint">
              {t.studio.clipProgress(index + 1, myClips.length)}
            </span>
            <div className="flex gap-1" aria-hidden>
              {myClips.map((c, i) => (
                <span
                  key={c.id}
                  className={cn(
                    'h-2 w-2 rounded-full',
                    selectedTakes.has(c.id)
                      ? 'bg-ok'
                      : i === index
                        ? 'bg-accent'
                        : 'bg-border-strong',
                  )}
                />
              ))}
            </div>
          </div>
        </header>

        {/*
          L'image occupe le reste, jamais plus. `min-h-0` est ce qui
          autorise un enfant de flexbox a retrecir sous sa taille
          naturelle : sans lui, la video impose sa hauteur et fait
          deborder toute la colonne.
        */}
        {/*
          L'image, et les deux facons de la cadrer.
          Sur un ordinateur elle prend la hauteur qui reste et deduit sa
          largeur : le cadre noir epouse alors le format du film au lieu
          d'etaler deux bandes noires sur un ecran large.
          Sur un telephone il n'y a pas de hauteur a prendre — la lui
          faire calculer la reduisait a quatre pixels. Elle garde donc
          son format et toute la largeur, et c'est la page qui defile.
        */}
        <div
          className={cn(
            'order-2 flex items-center justify-center overflow-hidden',
            'aspect-video w-full shrink-0',
            'lg:aspect-auto lg:min-h-0 lg:flex-1',
          )}
        >
          {media.data?.video ? (
            <video
              ref={videoRef}
              src={media.data.video}
              playsInline
              preload="auto"
              className={cn(
                'rounded-card border-2 border-bezel-dark bg-black object-contain',
                'h-full w-full',
                'lg:max-h-full lg:w-auto lg:max-w-full',
              )}
            />
          ) : (
            <Spinner />
          )}
        </div>

        {/* Qui je double et quand j'entre : toujours sous l'image. */}
        <div className="order-4 shrink-0 lg:order-3">
          <SpeakCue
            character={character}
            clip={clip}
            videoRef={videoRef}
            active={mode !== 'idle'}
          />
        </div>

        {/*
          La bande rythmo colle a l'image, telephone compris.
          Elle passait sous les commandes sur telephone, pour que le
          bouton d'enregistrement arrive plus haut : on jouait alors en
          lisant un texte qui defilait loin sous la video, les yeux faisant
          l'aller-retour. C'est elle qu'on regarde en doublant ; elle
          revient donc juste sous l'image, et plus haute pour qu'on la
          lise sans plisser les yeux.
        */}
        <div className="order-3 shrink-0 lg:order-4">
          <RythmoBand
            videoRef={videoRef}
            lines={lines}
            characters={characters}
            activeCharacterId={character.id}
            clip={clip}
            height={narrow ? 124 : compact ? 104 : 132}
          />
        </div>

        {/*
          La courbe de la prise, en dernier sur telephone : elle sert a
          verifier apres coup, pas a jouer.
        */}
        <div className="order-7 shrink-0 space-y-2 lg:order-5">
          <WaveformView
            analysis={analysis}
            clip={clip}
            videoRef={videoRef}
            voicePeaks={session.voice_peaks}
            voicePeaksHz={session.voice_peaks_hz}
            characterColor={character.color}
            height={narrow ? 52 : compact ? 68 : 96}
          />

          {/*
            Le calage de la derniere prise, sur une ligne qui ne se
            replie jamais : `flex-wrap` la faisait passer sur deux lignes
            des que le texte arrivait, et l'image perdait cinq pixels a
            chaque enregistrement.
          */}
          <p className="flex h-5 items-center gap-x-3 overflow-hidden text-xs text-text-faint">
            {alignment ? (
              <span
                className={cn('truncate', alignment.reliable && 'font-bold text-ok')}
              >
                {alignment.reliable && autoAlign
                  ? t.studio.alignedBy(alignment.lagMs)
                  : t.studio.alignUnsure}
              </span>
            ) : null}
          </p>
        </div>

        {/*
          Les commandes. Sous la bande et le repere de parole sur
          telephone ; dernieres sur ordinateur, ou l'ecran ne defile pas
          et ou la lecture va du haut vers le bas.
        */}
        <div className="order-5 shrink-0 space-y-2 lg:order-6">
          {/*
            Une seule ligne d'etat, de hauteur fixe, et jamais retiree.
            Les messages etaient six blocs qui apparaissaient et
            disparaissaient les uns sous les autres : chaque prise faisait
            donc sauter la mise en page et retrecir l'image de plusieurs
            dizaines de pixels, definitivement. Ici la place est reservee
            une fois pour toutes, et c'est le message qui change.
          */}
          <p
            role="status"
            className={cn(
              // Deux lignes sur telephone, une seule au-dela : le texte y
              // est le meme et la place, non. Les deux hauteurs sont
              // fixes, c'est ce qui empeche la page de sauter quand le
              // message change.
              'flex h-11 items-center gap-2 rounded-card px-3 text-xs font-bold lg:h-9',
              statut.tone === 'danger' && 'bg-danger/15 text-[oklch(0.42_0.18_25)]',
              statut.tone === 'warn' && 'bg-warn/20 text-[oklch(0.42_0.12_75)]',
              statut.tone === 'ok' && 'bg-ok/15 text-[oklch(0.4_0.13_150)]',
              statut.tone === 'muted' && 'text-text-faint',
            )}
          >
            {upload.isPending ? <Spinner /> : null}
            <span className="line-clamp-2 lg:truncate">{statut.text}</span>
          </p>

          {/*
            Deux colonnes sur telephone, une rangee sur ordinateur.
            La rangee qui se replie donnait, en trois cent quatre-vingt
            dix pixels, une marche d'escalier ou chaque bouton tombait a
            une largeur differente. La grille les aligne, et le bouton
            d'enregistrement prend la largeur entiere parce que c'est
            celui qu'on vise sans regarder.
          */}
          <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-wrap">
            {recording ? (
              <Button
                variant="record"
                className="col-span-2 lg:order-2"
                onClick={() => void finishRecording()}
              >
                <Square className="h-4 w-4" aria-hidden />
                {t.studio.stop}
              </Button>
            ) : (
              <Button
                variant="record"
                className="col-span-2 lg:order-2"
                onClick={() => void startRecording()}
              >
                <Circle className="h-4 w-4 fill-current" aria-hidden />
                {currentTake ? t.studio.redo : t.studio.record}
              </Button>
            )}

            <Button
              className="lg:order-1"
              onClick={() => void playOriginal()}
              disabled={recording}
            >
              <Play className="h-4 w-4" aria-hidden />
              {t.studio.playOriginal}
            </Button>

            <Button
              className="lg:order-3"
              onClick={() => void playTake()}
              disabled={recording || !takeUrl}
            >
              <Play className="h-4 w-4" aria-hidden />
              {t.studio.playTake}
            </Button>

            {mode !== 'idle' && !recording ? (
              <Button
                variant="ghost"
                className="col-span-2 lg:order-4"
                onClick={stopAll}
              >
                <Square className="h-4 w-4" aria-hidden />
                {t.studio.stop}
              </Button>
            ) : null}

            <div className="col-span-2 grid grid-cols-2 gap-2 lg:order-5 lg:ml-auto lg:flex">
              <Button
                variant="ghost"
                disabled={index === 0 || recording}
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                {t.studio.previous}
              </Button>
              {isLastClip ? (
                // Sur le dernier clip, « suivant » n'a nulle part ou aller :
                // le bouton restait grise et donnait a croire qu'on ne
                // pouvait pas valider, alors que la prise etait deja envoyee.
                <Button
                  variant={currentTake ? 'primary' : 'secondary'}
                  disabled={!currentTake || recording}
                  onClick={() => setAcknowledged(true)}
                >
                  <Check className="h-4 w-4" aria-hidden />
                  {t.studio.finish}
                </Button>
              ) : (
                <Button
                  variant={currentTake ? 'primary' : 'secondary'}
                  disabled={recording}
                  onClick={() => setIndex((i) => Math.min(myClips.length - 1, i + 1))}
                >
                  {currentTake ? t.studio.validate : t.studio.next}
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/*
          La console de la prise, sur telephone : juste sous les
          commandes, la ou l'on vient d'ecouter ce qu'on a enregistre.
          Sur ordinateur elle est dans la colonne de droite.
        */}
        <div className="order-6 shrink-0 lg:hidden">
          <VoiceConsole take={currentTake} />
        </div>

        {/* Stem de fond : la seule sortie audible pendant une prise. */}
        <audio ref={musicRef} src={media.data?.music ?? undefined} preload="auto" />
        <audio ref={takeRef} src={takeUrl ?? undefined} preload="auto" />
      </div>

      {/* La colonne de reglages defile pour elle seule : la page, non. */}
      <div className="min-w-0 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
        <StudioSidebar
          backing={backing}
          onBacking={setBacking}
          micOffset={micOffset}
          onMicOffset={setMicOffset}
          autoAlign={autoAlign}
          onAutoAlign={setAutoAlign}
          done={doneCount}
          total={myClips.length}
          take={currentTake}
        />
      </div>
    </div>
  );
}
