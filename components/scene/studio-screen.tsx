'use client';

import { useMutation } from '@tanstack/react-query';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  Play,
  Square,
} from 'lucide-react';

import { FinishedPanel } from '@/components/scene/finished-panel';
import { RythmoBand } from '@/components/scene/rythmo-band';
import { SpeakCue } from '@/components/scene/speak-cue';
import { StudioSidebar } from '@/components/scene/studio-sidebar';
import { WaveformView } from '@/components/scene/waveform-view';
import { useSceneCtx } from '@/components/scene-page';
import { Alert, Badge, Button, Card, Spinner } from '@/components/ui';
import {
  AUDIO_SYNC_TOLERANCE_MS,
  BUCKET_TAKES,
  DEFAULT_BACKING_VOLUME,
  MIC_OFFSET_STORAGE_KEY,
  SIGNED_URL_TTL_S,
  characterColorVar,
} from '@/config/constants';
import { t } from '@/config/strings';
import { uploadTake } from '@/lib/actions';
import { MicRecorder } from '@/lib/audio/recorder';
import { analyzeTake, type TakeAnalysis } from '@/lib/audio/waveform';
import { useMediaUrls, useTakes } from '@/lib/data';
import { humanizeError } from '@/lib/errors';
import { clipsForParticipant, selectedTakeByClip } from '@/lib/scene-stats';
import { supabaseBrowser } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

type Mode = 'idle' | 'original' | 'recording' | 'playback';

export function StudioScreen() {
  const { session, characters, clips, lines, me, refetch } = useSceneCtx();
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
  const [error, setError] = useState<string | null>(null);
  const [micReady, setMicReady] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

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
    const stored = window.localStorage.getItem(MIC_OFFSET_STORAGE_KEY);
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

    const tick = () => {
      frame = requestAnimationFrame(tick);
      const video = videoRef.current;
      const music = musicRef.current;
      if (!video) return;

      if (video.currentTime * 1000 >= clip.window_end_ms) {
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
    const video = videoRef.current;
    const music = musicRef.current;
    if (!video || !clip) return;
    const at = clip.window_start_ms / 1000;
    video.currentTime = at;
    if (music) music.currentTime = at;
  }

  /** Mode VO : mix original complet, micro coupe (PRD §11.2). */
  async function playOriginal() {
    if (!clip) return;
    stopAll();
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    await seekToWindow();
    musicRef.current?.pause();
    setMode('original');
    await video.play();
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
    setMode('recording');

    // Pas de decompte : les deux secondes de marge tiennent ce role
    // (PRD §11.4). Micro et lecture demarrent au meme instant.
    recorderRef.current.start();
    await Promise.all([video.play(), music ? music.play() : Promise.resolve()]);
  }

  const upload = useMutation({
    mutationFn: async (input: { blob: Blob; durationMs: number }) => {
      if (!clip || !me) throw new Error('Clip introuvable');
      return uploadTake({
        sessionId: session.id,
        participantId: me.id,
        clipId: clip.id,
        blob: input.blob,
        durationMs: input.durationMs,
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
      return;
    }
    const blob = await recorderRef.current.stop();
    stopAll();

    setTakeUrl(URL.createObjectURL(blob));
    let durationMs = clip ? clip.window_end_ms - clip.window_start_ms : 0;
    try {
      const result = await analyzeTake(blob);
      setAnalysis(result);
      durationMs = Math.round(result.durationMs);
    } catch {
      setAnalysis(null);
    }
    upload.mutate({ blob, durationMs });
  }

  /** Reecoute : fond + la prise, posee comme au mixage. */
  async function playTake() {
    if (!clip || !takeUrl) return;
    stopAll();
    const video = videoRef.current;
    const music = musicRef.current;
    const take = takeRef.current;
    if (!video || !take) return;

    video.muted = true;
    await seekToWindow();
    setMode('playback');

    // Le decalage micro est applique au mixage : on le simule ici pour
    // que ce qu'on entend soit ce qu'on obtiendra.
    take.currentTime = micOffset < 0 ? -micOffset / 1000 : 0;
    await Promise.all([video.play(), music ? music.play() : Promise.resolve()]);

    if (micOffset > 0) {
      takeTimer.current = window.setTimeout(() => {
        void take.play();
      }, micOffset);
    } else {
      await take.play();
    }
  }

  useEffect(() => {
    const recorder = recorderRef.current;
    return () => recorder.release();
  }, []);

  if (!me) {
    return <Alert tone="danger">{t.errors.forbidden}</Alert>;
  }

  if (myClips.length === 0) {
    return (
      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <Card className="space-y-2">
          <h1 className="text-lg font-semibold">{t.studio.title}</h1>
          <p className="text-sm text-text-muted">
            Aucun personnage ne t’a été attribué sur cette scène.
          </p>
        </Card>
        <StudioSidebar
          backing={backing}
          onBacking={setBacking}
          micOffset={micOffset}
          onMicOffset={setMicOffset}
          done={0}
          total={0}
        />
      </div>
    );
  }

  if (!clip || !character) return <Spinner />;

  const recording = mode === 'recording';

  if (acknowledged && allDone) {
    return (
      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <FinishedPanel
          sessionId={session.id}
          myParticipantId={me.id}
          onBack={() => setAcknowledged(false)}
        />
        <StudioSidebar
          backing={backing}
          onBacking={setBacking}
          micOffset={micOffset}
          onMicOffset={setMicOffset}
          done={doneCount}
          total={myClips.length}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-3">
        <header className="flex flex-wrap items-center justify-between gap-2">
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

        <div className="overflow-hidden rounded-card border border-border bg-black">
          {media.data?.video ? (
            <video
              ref={videoRef}
              src={media.data.video}
              playsInline
              preload="auto"
              className="aspect-video w-full"
            />
          ) : (
            <div className="flex aspect-video items-center justify-center">
              <Spinner />
            </div>
          )}
        </div>

        <SpeakCue
          character={character}
          clip={clip}
          videoRef={videoRef}
          active={mode !== 'idle'}
        />

        <RythmoBand
          videoRef={videoRef}
          lines={lines}
          characters={characters}
          activeCharacterId={character.id}
          clip={clip}
        />

        <WaveformView
          analysis={analysis}
          clip={clip}
          videoRef={videoRef}
          voicePeaks={session.voice_peaks}
          voicePeaksHz={session.voice_peaks_hz}
          characterColor={character.color}
        />
        <p className="text-xs text-text-faint">{t.studio.originalTrace}</p>

        {analysis?.truncated ? (
          <Alert tone="warn">{t.studio.overflowWarning}</Alert>
        ) : null}
        {allDone ? (
          <Alert tone="ok">
            <span className="font-bold">{t.studio.finishedTitle}</span>{' '}
            {t.studio.allTakesSaved}
          </Alert>
        ) : currentTake && !upload.isPending ? (
          <Alert tone="ok">{t.studio.takeSaved}</Alert>
        ) : null}

        {upload.isPending ? (
          <p className="flex items-center gap-2 text-xs text-text-faint">
            <Spinner />
            {t.studio.uploading}
          </p>
        ) : null}
        {error ? <Alert tone="danger">{error}</Alert> : null}

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void playOriginal()} disabled={recording}>
            <Play className="h-4 w-4" aria-hidden />
            {t.studio.playOriginal}
          </Button>

          {recording ? (
            <Button variant="record" onClick={() => void finishRecording()}>
              <Square className="h-4 w-4" aria-hidden />
              {t.studio.stop}
            </Button>
          ) : (
            <Button variant="record" onClick={() => void startRecording()}>
              <Circle className="h-4 w-4 fill-current" aria-hidden />
              {currentTake ? t.studio.redo : t.studio.record}
            </Button>
          )}

          <Button
            onClick={() => void playTake()}
            disabled={recording || !takeUrl}
          >
            <Play className="h-4 w-4" aria-hidden />
            {t.studio.playTake}
          </Button>

          {mode !== 'idle' && !recording ? (
            <Button variant="ghost" onClick={stopAll}>
              <Square className="h-4 w-4" aria-hidden />
              {t.studio.stop}
            </Button>
          ) : null}

          <div className="ml-auto flex gap-2">
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

        {!micReady ? (
          <Alert>{t.studio.headphonesRequired}</Alert>
        ) : null}

        {/* Stem de fond : la seule sortie audible pendant une prise. */}
        <audio ref={musicRef} src={media.data?.music ?? undefined} preload="auto" />
        <audio ref={takeRef} src={takeUrl ?? undefined} preload="auto" />
      </div>

      <StudioSidebar
        backing={backing}
        onBacking={setBacking}
        micOffset={micOffset}
        onMicOffset={setMicOffset}
        done={doneCount}
        total={myClips.length}
      />
    </div>
  );
}
