'use client';

import { useMutation } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Circle, Play, Square } from 'lucide-react';

import { useT } from '@/lib/i18n';
import { FinishedPanel } from '@/components/scene/finished-panel';
import { PlayerProgressList } from '@/components/scene/player-progress';
import { RythmoBand } from '@/components/scene/rythmo-band';
import { SpeakCue } from '@/components/scene/speak-cue';
import { AudioDevicesCard } from '@/components/scene/audio-devices-card';
import { StudioSidebar } from '@/components/scene/studio-sidebar';
import { VoiceConsole, type TakeSettings } from '@/components/scene/voice-console';
import { WaveformView } from '@/components/scene/waveform-view';
import { useSceneCtx } from '@/components/scene-page';
import { Alert, Badge, Button, Card, Spinner } from '@/components/ui';
import {
  ALIGN_APPLY_MIN_CONFIDENCE,
  ALIGN_HISTORY,
  AUDIO_SYNC_TOLERANCE_MS,
  BUCKET_TAKES,
  DEFAULT_BACKING_VOLUME,
  MIC_OFFSET_BASELINE_MS,
  REC_LEAD_IN_MS,
  REC_TAIL_MS,
  TAKE_MIN_MS,
  SIGNED_URL_TTL_S,
  characterColorVar,
} from '@/config/constants';

import { setTakeFx, setTakeMix, uploadTake } from '@/lib/actions';
import { applyOutputDevice, useAudioDevices } from '@/lib/audio/devices';
import { MicRecorder } from '@/lib/audio/recorder';
import { seekAll, unlockMedia } from '@/lib/audio/media';
import { alignTake, envelopeFromBlob, type Alignment } from '@/lib/audio/align';
import { decodeEnvelope } from '@/lib/audio/envelope';
import { ECOUTE_HZ, cleReglages, decoderPrise, rendreVoix } from '@/lib/audio/voice-fx';
import { analyzeTake, type TakeAnalysis } from '@/lib/audio/waveform';
import { useMediaUrls, useTakes } from '@/lib/data';
import { recallPreference, rememberPreference } from '@/lib/consent';
import { humanizeError } from '@/lib/errors';
import { useWaitingRoom } from '@/lib/presence';
import { clipsForParticipant, selectedTakeByClip } from '@/lib/scene-stats';
import { supabaseBrowser } from '@/lib/supabase/client';
import type { TakeRow } from '@/lib/supabase/database.types';
import { cn } from '@/lib/utils';
import { useNarrowViewport, useShortViewport } from '@/lib/viewport';

type Mode = 'idle' | 'original' | 'recording' | 'playback';

/** La case « partout » du decalage, retenue d'une scene a l'autre. */
const OFFSET_PARTOUT_KEY = 'dubup.micOffsetEverywhere' as const;
/** La case « garder ces effets pour la prise suivante ». */
const GARDER_EFFETS_KEY = 'dubup.keepFx' as const;

function mediane(valeurs: number[]): number {
  const triees = [...valeurs].sort((a, b) => a - b);
  const milieu = Math.floor(triees.length / 2);
  return triees.length % 2 ? triees[milieu]! : (triees[milieu - 1]! + triees[milieu]!) / 2;
}

function reglagesDe(take: TakeRow): TakeSettings {
  return {
    reverb: take.fx_reverb ?? 0,
    pitch: take.fx_pitch ?? 0,
    tune: 0,
    gainDb: Number(take.gain_db ?? 0),
    micOffsetMs: take.mic_offset_ms ?? 0,
  };
}

/** Une prise decodee, prete a etre rejouee avec ses effets. */
interface PriseDecodee {
  cle: string;
  promesse: Promise<Float32Array>;
  /** Ou la prise tombe dans la fenetre, calage automatique compris. */
  offsetMs: number;
  /** Le fichier, garde pour en redessiner la forme d'onde au retour. */
  blob?: Blob;
}

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
  const recorderRef = useRef<MicRecorder>(new MicRecorder());
  // Le micro et la sortie du casque choisis pour ce studio.
  const devices = useAudioDevices();
  const sortieRef = useRef('');
  sortieRef.current = devices.outputId;

  const [mode, setModeState] = useState<Mode>('idle');
  const modeRef = useRef<Mode>('idle');
  const setMode = useCallback((next: Mode) => {
    modeRef.current = next;
    setModeState(next);
  }, []);

  const [index, setIndex] = useState(0);
  const [backing, setBacking] = useState(DEFAULT_BACKING_VOLUME);
  const [analysis, setAnalysis] = useState<TakeAnalysis | null>(null);
  /** La prise du clip affiche est decodable : « Ma prise » peut jouer. */
  const [hasTakeAudio, setHasTakeAudio] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [micReady, setMicReady] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  /** Les retards mesures sur les dernieres prises nettes de ce joueur. */
  const lagHistory = useRef<number[]>([]);
  /** Ou tombe le debut de la prise affichee dans la fenetre, calage compris. */
  const [placement, setPlacement] = useState<number | null>(null);
  /**
   * Instant de la scene ou le micro s'est reellement ouvert.
   *
   * Il n'est pas connu d'avance : on arme le micro quand la lecture
   * atteint la zone de parole, et la lecture n'a pas une precision a la
   * milliseconde. On releve donc l'heure exacte a l'ouverture.
   */
  const recStartedAtMs = useRef<number | null>(null);
  /** Une fin de prise est en cours : un second appel ne doit rien arreter. */
  const finissant = useRef(false);

  // ── La console de voix ─────────────────────────────────────────────
  // Deux etats : ce que montrent les curseurs, qui suit le doigt, et ce
  // qu'on entend, qui ne change qu'au curseur lache. Recalculer la
  // hauteur a chaque pixel de glisse figerait l'ecran.
  const [reglages, setReglages] = useState<TakeSettings>({
    reverb: 0,
    pitch: 0,
    tune: 0,
    gainDb: 0,
    micOffsetMs: 0,
  });
  const reglagesRef = useRef(reglages);
  const [ecoute, setEcoute] = useState<TakeSettings>(reglages);
  const [offsetPartout, setOffsetPartout] = useState(false);
  const [consoleErreur, setConsoleErreur] = useState<string | null>(null);
  const [gainPartout, setGainPartout] = useState<'idle' | 'pending' | 'done'>('idle');
  const [calcul, setCalcul] = useState(false);
  /** Les effets passent a la replique suivante. */
  const [garderEffets, setGarderEffets] = useState(false);
  const garderEffetsRef = useRef(false);
  garderEffetsRef.current = garderEffets;

  // ── L'ecoute de la prise, avec ses effets ──────────────────────────
  const audioCtx = useRef<AudioContext | null>(null);
  const voix = useRef<AudioBufferSourceNode | null>(null);
  const brut = useRef<PriseDecodee | null>(null);
  const rendu = useRef<{ source: Promise<Float32Array>; cle: string; buffer: AudioBuffer } | null>(
    null,
  );
  /** La prise qu'on vient d'enregistrer : inutile de la retelecharger. */
  const priseLocale = useRef<{ takeId: string | null; blob: Blob } | null>(null);
  /**
   * Les formes d'onde deja calculees, par prise.
   *
   * Changer de clip efface l'analyse affichee ; revenir sur un clip dont la
   * prise etait deja en memoire ne la recalculait pas, et la piste restait
   * invisible — impossible alors de la voir, ni de la faire glisser.
   */
  const analyses = useRef(new Map<string, TakeAnalysis>());

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

  // Sur l'ecran d'attente, on s'y declare ; ailleurs, on ecoute seulement.
  const salle = useWaitingRoom(
    session.id,
    me?.id ?? null,
    (acknowledged && allDone) || myClips.length === 0,
  );

  // Une preference : relue seulement si on a accepte d'en garder.
  useEffect(() => {
    setOffsetPartout(recallPreference(OFFSET_PARTOUT_KEY) === '1');
    setGarderEffets(recallPreference(GARDER_EFFETS_KEY) === '1');
  }, []);

  const poser = useCallback((suivants: TakeSettings) => {
    reglagesRef.current = suivants;
    setReglages(suivants);
    setEcoute(suivants);
  }, []);

  /*
   * La console se recale sur la prise affichee.
   *
   * Des valeurs primitives dans les dependances, jamais l'objet : la liste
   * des prises est rechargee a chaque envoi de n'importe quel joueur, et
   * un objet neuf ramenait le curseur sous le doigt a sa valeur d'avant.
   *
   * Sans prise, les effets repartent de zero : une replique neuve ne
   * reprend pas la cathedrale de la precedente — sauf si la case « garder
   * ces effets » est cochee, et alors elle reprend exactement ceux qu'on
   * vient d'entendre. Le volume et le decalage repartent du reglage
   * « partout » du joueur.
   */
  const takeId = currentTake?.id ?? null;
  const serveur = currentTake
    ? `${cleReglages(reglagesDe(currentTake))}|${currentTake.mic_offset_ms}`
    : null;
  const defautGain = Number(me?.gain_db ?? 0);
  const defautOffset = me?.mic_offset_ms ?? 0;

  useEffect(() => {
    const precedents = reglagesRef.current;
    const garder = garderEffetsRef.current;
    poser(
      currentTake
        ? reglagesDe(currentTake)
        : {
            reverb: garder ? precedents.reverb : 0,
            pitch: garder ? precedents.pitch : 0,
            tune: 0,
            gainDb: defautGain,
            micOffsetMs: defautOffset,
          },
    );
    setConsoleErreur(null);
    setGainPartout('idle');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clip?.id, takeId, serveur]);

  // Le reglage « partout » a change : une replique sans prise le suit,
  // sans perdre les effets qu'on y a deja poses.
  useEffect(() => {
    if (currentTake) return;
    poser({ ...reglagesRef.current, gainDb: defautGain, micOffsetMs: defautOffset });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defautGain, defautOffset]);

  // ── Transport ───────────────────────────────────────────────────────

  const arreterVoix = useCallback(() => {
    const source = voix.current;
    voix.current = null;
    if (!source) return;
    try {
      source.stop();
    } catch {
      // Deja arretee : rien a faire.
    }
    source.disconnect();
  }, []);

  const stopAll = useCallback(() => {
    arreterVoix();
    videoRef.current?.pause();
    musicRef.current?.pause();
    setMode('idle');
  }, [arreterVoix, setMode]);

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
      /*
       * Le mode a deja change : une prise vient de se terminer, et React
       * n'a pas encore demonte cette boucle. Sans ce garde, l'image de
       * retard voyait un micro ferme sur la replique et le rouvrait : une
       * seconde « prise » vide suivait la vraie, et l'ecran affichait
       * « Rien n'a été enregistré » sous une prise pourtant validee.
       */
      if (modeRef.current !== mode) {
        cancelAnimationFrame(frame);
        return;
      }
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

  // La sortie choisie : l'image, le fond sonore et l'ecoute de la prise.
  // Reappliquee quand les medias changent ou que la video est remontee.
  useEffect(() => {
    void applyOutputDevice(
      devices.outputId,
      [videoRef.current, musicRef.current],
      audioCtx.current,
    );
  }, [devices.outputId, media.data?.music, media.data?.video, index, acknowledged]);

  // Un autre micro : l'ancien est referme, la prochaine prise ouvre le
  // nouveau. Jamais pendant une prise, le menu est d'ailleurs verrouille.
  const micPrecedent = useRef(devices.micId);
  useEffect(() => {
    if (micPrecedent.current === devices.micId) return;
    micPrecedent.current = devices.micId;
    if (recorderRef.current.recording) return;
    recorderRef.current.release();
    setMicReady(false);
  }, [devices.micId]);

  // Changer de clip coupe tout : on ne laisse jamais un transport
  // continuer sur un clip qu'on ne regarde plus.
  useEffect(() => {
    stopAll();
    setAnalysis(null);
    setHasTakeAudio(false);
    setPlacement(null);
    // Le message d'une autre replique n'a rien a faire sur celle-ci.
    setError(null);
  }, [index, stopAll]);

  // Charge la prise retenue du clip courant pour l'afficher et la
  // reecouter, y compris apres un retour en arriere.
  useEffect(() => {
    let cancelled = false;
    if (!currentTake) return;
    const cle = currentTake.id;

    /** La forme d'onde : depuis la memoire, sinon recalculee du fichier. */
    const montrer = (blob?: Blob) => {
      const connue = analyses.current.get(cle);
      if (connue) {
        setAnalysis(connue);
        return;
      }
      if (!blob) return;
      void analyzeTake(blob)
        .then((resultat) => {
          analyses.current.set(cle, resultat);
          if (!cancelled) setAnalysis(resultat);
        })
        .catch(() => undefined);
    };

    if (brut.current?.cle === cle) {
      setHasTakeAudio(true);
      setPlacement(brut.current.offsetMs);
      montrer(brut.current.blob);
      return;
    }
    const locale = priseLocale.current;
    if (locale && locale.takeId === cle) {
      brut.current = {
        cle,
        promesse: decoderPrise(locale.blob),
        offsetMs: currentTake.offset_ms,
        blob: locale.blob,
      };
      setHasTakeAudio(true);
      setPlacement(currentTake.offset_ms);
      montrer(locale.blob);
      return;
    }

    void (async () => {
      const { data } = await supabaseBrowser()
        .storage.from(BUCKET_TAKES)
        .createSignedUrl(currentTake.audio_path, SIGNED_URL_TTL_S);
      if (cancelled || !data?.signedUrl) return;

      try {
        const blob = await (await fetch(data.signedUrl)).blob();
        if (cancelled) return;
        const promesse = decoderPrise(blob);
        promesse.catch(() => undefined);
        brut.current = { cle, promesse, offsetMs: currentTake.offset_ms, blob };
        setHasTakeAudio(true);
        setPlacement(currentTake.offset_ms);
        montrer(blob);
      } catch {
        // La forme d'onde est un confort : son echec ne doit pas
        // empecher de refaire la prise.
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
    unlockMedia([video, musicRef.current]);
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
    unlockMedia([video, music]);

    try {
      await recorderRef.current.prime(devices.micId);
      setMicReady(true);
      // Le micro autorise, les appareils ont enfin un nom a afficher.
      void devices.refresh();
    } catch {
      setError(t.studio.micDenied);
      return;
    }

    video.muted = true;
    await seekToWindow();

    setAnalysis(null);
    setHasTakeAudio(false);
    setPlacement(null);
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
    mutationFn: async (input: {
      blob: Blob;
      durationMs: number;
      offsetMs: number;
      clipId: string;
      /** Cette prise est la derniere qui manquait. */
      completes: boolean;
    }) => {
      if (!me) throw new Error('Clip introuvable');
      return uploadTake({
        sessionId: session.id,
        participantId: me.id,
        clipId: input.clipId,
        blob: input.blob,
        durationMs: input.durationMs,
        offsetMs: input.offsetMs,
      });
    },
    onSuccess: async (take, input) => {
      const locale = priseLocale.current;
      if (locale?.blob === input.blob) {
        locale.takeId = take.id;
        if (brut.current?.cle === 'locale') brut.current = { ...brut.current, cle: take.id };
        const analyse = analyses.current.get('locale');
        if (analyse) analyses.current.set(take.id, analyse);
      }

      /*
       * Les reglages choisis avant d'enregistrer se posent sur la prise.
       *
       * Une replique refaite a deja les siens, herites par la base : rien
       * ne differe alors, et rien n'est envoye.
       */
      const voulu = reglagesRef.current;
      try {
        if (take.fx_reverb !== voulu.reverb || take.fx_pitch !== voulu.pitch) {
          await setTakeFx(take.id, voulu);
        }
        if (Number(take.gain_db) !== voulu.gainDb || take.mic_offset_ms !== voulu.micOffsetMs) {
          await setTakeMix(session.id, take.id, {
            gainDb: voulu.gainDb,
            micOffsetMs: voulu.micOffsetMs,
          });
        }
      } catch (e) {
        setConsoleErreur(humanizeError(e));
      }

      refetch();
      void takesQuery.refetch();

      // La derniere replique qui manquait vient d'arriver : direction
      // l'ecran d'attente, ou l'on voit ou en sont les autres.
      if (input.completes) {
        stopAll();
        setAcknowledged(true);
      }
    },
    onError: (e) => setError(humanizeError(e)),
  });

  async function finishRecording() {
    // La boucle et le bouton « Arrêter » peuvent appeler deux fois de suite.
    if (finissant.current) return;
    if (!recorderRef.current.recording) {
      stopAll();
      recStartedAtMs.current = null;
      return;
    }
    finissant.current = true;
    let blob: Blob;
    try {
      blob = await recorderRef.current.stop();
    } finally {
      finissant.current = false;
    }
    const openedAtMs = recStartedAtMs.current;
    recStartedAtMs.current = null;
    stopAll();
    if (!clip) return;

    /*
     * Une prise qu'on ne peut pas decoder n'est pas une prise.
     *
     * Elle etait envoyee quand meme, et le rendu tombait dessus des
     * jours plus tard sans que rien ne relie l'echec a cet
     * enregistrement-la. Mieux vaut le dire tout de suite, tant que le
     * casque est encore sur les oreilles.
     */
    let durationMs = clip.speech_end_ms - clip.speech_start_ms;
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
      setHasTakeAudio(false);
      return;
    }

    // Ou poser la prise : la ou le micro s'est ouvert, et non au debut de
    // la fenetre, puis corrige du retard mesure sur la voix d'origine.
    const placedAtMs = openedAtMs ?? clip.window_start_ms;
    let offsetMs = placedAtMs - clip.window_start_ms;

    const measured = await measureLag(blob, placedAtMs);

    /*
     * Le calage s'applique d'office, sans rien afficher.
     *
     * Il n'etait applique que sur un pic de correlation tres net, ce qui
     * arrive rarement quand deux voix differentes lisent le meme texte :
     * la plupart des prises restaient posees telles quelles. Il vaut
     * maintenant des qu'il se detache un peu du bruit, et quand il ne se
     * detache pas du tout, c'est le retard habituel du joueur, releve sur
     * ses prises nettes, qui le remplace.
     *
     * Une prise calee n'a plus besoin du retard de base : il estime la
     * latence de capture, et la mesure vient de la trouver pour de vrai.
     * L'ajouter encore la faisait tomber quarante millisecondes trop tard.
     */
    let retard: number | null = null;
    if (measured && measured.confidence >= ALIGN_APPLY_MIN_CONFIDENCE) {
      retard = measured.lagMs;
      if (measured.reliable) {
        lagHistory.current = [...lagHistory.current, measured.lagMs].slice(-ALIGN_HISTORY);
      }
    } else if (lagHistory.current.length > 0) {
      retard = mediane(lagHistory.current);
    }
    if (retard !== null) offsetMs -= Math.round(retard) + MIC_OFFSET_BASELINE_MS;

    priseLocale.current = { takeId: null, blob };
    analyses.current.set('locale', analysed);
    const promesse = decoderPrise(blob);
    promesse.catch(() => undefined);
    brut.current = { cle: 'locale', promesse, offsetMs, blob };
    setHasTakeAudio(true);
    setPlacement(offsetMs);

    const completes =
      !allDone && myClips.every((c) => c.id === clip.id || selectedTakes.has(c.id));
    upload.mutate({ blob, durationMs, offsetMs, clipId: clip.id, completes });
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

  function contexte(): AudioContext {
    if (!audioCtx.current) {
      audioCtx.current = new AudioContext();
      // L'ecoute de la prise sort la ou sort le reste : dans le casque choisi.
      void applyOutputDevice(sortieRef.current, [], audioCtx.current);
    }
    return audioCtx.current;
  }

  /**
   * La prise telle que le mixage la posera : volume, pitch, reverb.
   *
   * Le resultat est garde pour les memes reglages : relire sa prise dix
   * fois ne recalcule rien.
   */
  async function voixPreparee(s: TakeSettings): Promise<AudioBuffer | null> {
    const prise = brut.current;
    if (!prise) return null;
    const cle = cleReglages(s);
    if (rendu.current?.source === prise.promesse && rendu.current.cle === cle) {
      return rendu.current.buffer;
    }

    const samples = await prise.promesse;
    // La prise a change pendant le decodage : ce tampon ne sert plus.
    if (brut.current?.promesse !== prise.promesse) return null;

    let sortie: Float32Array[];
    setCalcul(true);
    try {
      // Laisser l'indicateur s'afficher avant quelques dizaines de ms de calcul.
      await new Promise((resolve) => setTimeout(resolve, 0));
      sortie = rendreVoix(samples, s);
    } finally {
      setCalcul(false);
    }
    const buffer = contexte().createBuffer(
      sortie.length,
      Math.max(1, sortie[0]?.length ?? 0),
      ECOUTE_HZ,
    );
    sortie.forEach((canal, c) => buffer.getChannelData(c).set(canal));
    rendu.current = { source: prise.promesse, cle, buffer };
    return buffer;
  }

  /**
   * Pose la voix sur la lecture en cours, a sa place.
   *
   * Appelee au depart, et de nouveau quand un curseur est lache pendant
   * l'ecoute : la voix repart alors a l'endroit exact ou en est la video,
   * avec les nouveaux reglages.
   */
  function lancerVoix(buffer: AudioBuffer, s: TakeSettings) {
    const video = videoRef.current;
    const prise = brut.current;
    if (!clip || !video || !prise) return;
    arreterVoix();

    const ctx = contexte();
    /*
     * Reproduire exactement ce que fera le mixage : la prise tombe la ou
     * le micro s'est ouvert, deplacee par le calage automatique, plus le
     * decalage de la console et le retard de base.
     */
    const delayMs = prise.offsetMs + s.micOffsetMs + MIC_OFFSET_BASELINE_MS;
    const attenteMs = delayMs - (video.currentTime * 1000 - clip.window_start_ms);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    if (attenteMs >= 0) {
      source.start(ctx.currentTime + attenteMs / 1000);
    } else if (-attenteMs / 1000 < buffer.duration) {
      source.start(0, -attenteMs / 1000);
    } else {
      source.disconnect();
      return;
    }
    voix.current = source;
  }

  /** Reecoute : fond + la prise, posee et traitee comme au mixage. */
  async function playTake() {
    if (!clip || !hasTakeAudio) return;
    stopAll();
    const video = videoRef.current;
    const music = musicRef.current;
    if (!video) return;

    unlockMedia([video, music]);
    // Pendant le toucher : un contexte audio reveille plus tard reste
    // muet sur iPhone.
    void contexte().resume();
    video.muted = true;

    const reglagesEcoute = ecoute;
    let buffer: AudioBuffer | null = null;
    try {
      [buffer] = await Promise.all([voixPreparee(reglagesEcoute), seekToWindow()]);
    } catch {
      buffer = null;
    }
    if (!buffer) {
      setError(t.studio.previewFailed);
      return;
    }

    setMode('playback');
    try {
      await Promise.all([video.play(), music ? music.play() : Promise.resolve()]);
      if (modeRef.current === 'playback') lancerVoix(buffer, reglagesEcoute);
    } catch {
      stopAll();
      setError(t.studio.playBlocked);
    }
  }

  /*
   * Un curseur lache s'entend tout de suite.
   *
   * Pendant l'ecoute, la voix repart avec les nouveaux reglages a
   * l'endroit ou en est la video. A l'arret, on prepare deja le tampon :
   * appuyer sur « Ma prise » juste apres ne fait rien attendre.
   */
  const cleEcoute = `${cleReglages(ecoute)}|${ecoute.micOffsetMs}`;
  useEffect(() => {
    if (!hasTakeAudio) return;
    let annule = false;
    void (async () => {
      const buffer = await voixPreparee(ecoute).catch(() => null);
      if (!annule && buffer && modeRef.current === 'playback') lancerVoix(buffer, ecoute);
    })();
    return () => {
      annule = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleEcoute, hasTakeAudio]);

  /** Un curseur lache : on enregistre, et l'ecoute suit. */
  async function appliquer(partiel: Partial<TakeSettings>) {
    const suivants = { ...reglagesRef.current, ...partiel };
    poser(suivants);
    setConsoleErreur(null);

    const effets = 'reverb' in partiel || 'pitch' in partiel;
    const gain = 'gainDb' in partiel;
    const decalage = 'micOffsetMs' in partiel;

    try {
      if (decalage && offsetPartout) {
        await setTakeMix(
          session.id,
          currentTake?.id ?? null,
          { micOffsetMs: suivants.micOffsetMs },
          true,
        );
        refetch();
      }
      // Sans prise, les reglages attendent l'enregistrement.
      if (!currentTake) return;

      if (effets) await setTakeFx(currentTake.id, suivants);
      if (gain || (decalage && !offsetPartout)) {
        await setTakeMix(session.id, currentTake.id, {
          gainDb: gain ? suivants.gainDb : undefined,
          micOffsetMs: decalage && !offsetPartout ? suivants.micOffsetMs : undefined,
        });
      }
      void takesQuery.refetch();
    } catch (e) {
      setConsoleErreur(humanizeError(e));
    }
  }

  function choisirGarderEffets(next: boolean) {
    setGarderEffets(next);
    rememberPreference(GARDER_EFFETS_KEY, next ? '1' : '0');
  }

  function choisirOffsetPartout(next: boolean) {
    setOffsetPartout(next);
    rememberPreference(OFFSET_PARTOUT_KEY, next ? '1' : '0');
    if (!next) return;
    // Cocher la case applique tout de suite la valeur affichee.
    void (async () => {
      try {
        await setTakeMix(
          session.id,
          currentTake?.id ?? null,
          { micOffsetMs: reglagesRef.current.micOffsetMs },
          true,
        );
        refetch();
        void takesQuery.refetch();
      } catch (e) {
        setConsoleErreur(humanizeError(e));
      }
    })();
  }

  async function appliquerGainPartout() {
    setGainPartout('pending');
    setConsoleErreur(null);
    try {
      await setTakeMix(
        session.id,
        currentTake?.id ?? null,
        { gainDb: reglagesRef.current.gainDb },
        true,
      );
      setGainPartout('done');
      refetch();
      void takesQuery.refetch();
    } catch (e) {
      setGainPartout('idle');
      setConsoleErreur(humanizeError(e));
    }
  }

  /**
   * Le bouton de droite, sous les commandes.
   *
   * Sur le dernier clip il mene a l'ecran d'attente. S'il reste des
   * repliques sans prise ailleurs, il y emmene : « J'ai terminé » ne
   * faisait rien dans ce cas, et on ne savait pas pourquoi.
   */
  function suivant() {
    if (!isLastClip) {
      setIndex((i) => Math.min(myClips.length - 1, i + 1));
      return;
    }
    if (allDone) {
      stopAll();
      setAcknowledged(true);
      return;
    }
    const manque = myClips.findIndex((c) => !selectedTakes.has(c.id));
    if (manque >= 0) {
      setIndex(manque);
      setError(t.studio.missingClips);
    }
  }

  useEffect(() => {
    const recorder = recorderRef.current;
    return () => {
      recorder.release();
      void audioCtx.current?.close().catch(() => undefined);
    };
  }, []);

  if (!me) {
    return <Alert tone="danger">{t.errors.forbidden}</Alert>;
  }

  if (myClips.length === 0) {
    return (
      <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[1fr_22rem]">
        <Card className="space-y-3 self-start">
          <h1 className="text-lg font-semibold">{t.studio.title}</h1>
          <p className="text-sm text-text-muted">{t.studio.noCharacter}</p>

          {/* Sans role a jouer, on regarde les autres avancer. */}
          <div className="space-y-2 pt-1">
            <h2 className="text-xs font-bold uppercase tracking-widest text-text-faint">
              {t.studio.whereEveryoneIs}
            </h2>
            <PlayerProgressList
              sessionId={session.id}
              myParticipantId={me.id}
              waiting={salle.waiting}
            />
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
            done={0}
            total={0}
            devices={<AudioDevicesCard devices={devices} recording={false} />}
          />
        </div>
      </div>
    );
  }

  if (!clip || !character) return <Spinner />;

  const recording = mode === 'recording';

  if (acknowledged && allDone) {
    return (
      <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[1fr_22rem]">
        <FinishedPanel
          sessionId={session.id}
          myParticipantId={me.id}
          isHost={isHost}
          waiting={salle.waiting}
          onBack={() => setAcknowledged(false)}
        />
        <div className="min-w-0 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
          <StudioSidebar
            backing={backing}
            onBacking={setBacking}
            done={doneCount}
            total={myClips.length}
            devices={<AudioDevicesCard devices={devices} recording={false} />}
          />
        </div>
      </div>
    );
  }

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

  const consoleVoix = (
    <VoiceConsole
      value={reglages}
      hasTake={!!currentTake}
      computing={calcul}
      error={consoleErreur}
      onInput={(partiel) => {
        const suivants = { ...reglagesRef.current, ...partiel };
        reglagesRef.current = suivants;
        setReglages(suivants);
      }}
      onCommit={(partiel) => void appliquer(partiel)}
      offsetEverywhere={offsetPartout}
      onOffsetEverywhere={choisirOffsetPartout}
      onGainEverywhere={() => void appliquerGainPartout()}
      gainEverywhere={gainPartout}
      keepFx={garderEffets}
      onKeepFx={choisirGarderEffets}
      backing={backing}
      onBacking={setBacking}
    />
  );

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
            {/*
              Les pastilles menent chacune a son clip. La zone de clic
              deborde la pastille : huit pixels ne se visent pas au doigt.
            */}
            <div className="flex flex-wrap items-center" role="group" aria-label={t.studio.clipsNav}>
              {myClips.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  disabled={recording}
                  aria-current={i === index ? 'step' : undefined}
                  aria-label={t.studio.clipProgress(i + 1, myClips.length)}
                  title={t.studio.clipProgress(i + 1, myClips.length)}
                  onClick={() => setIndex(i)}
                  className="group flex h-6 w-5 items-center justify-center disabled:cursor-not-allowed"
                >
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full transition-transform group-hover:scale-150 group-disabled:scale-100',
                      i === index && 'ring-2 ring-accent ring-offset-2 ring-offset-transparent',
                      selectedTakes.has(c.id)
                        ? 'bg-ok'
                        : i === index
                          ? 'bg-accent'
                          : 'bg-border-strong',
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
        </header>

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
                'rounded-card border border-border bg-black object-contain',
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
        <div className="order-7 shrink-0 lg:order-5">
          <WaveformView
            analysis={analysis}
            clip={clip}
            videoRef={videoRef}
            voicePeaks={session.voice_peaks}
            voicePeaksHz={session.voice_peaks_hz}
            characterColor={character.color}
            height={narrow ? 52 : compact ? 68 : 96}
            // La prise dessinee la ou le mixage la posera : retard de base
            // compris, decalage micro ajoute par la bande elle-meme.
            takeStartMs={placement === null ? null : placement + MIC_OFFSET_BASELINE_MS}
            offsetMs={reglages.micOffsetMs}
            draggable={!recording && hasTakeAudio}
            onOffsetInput={(v) => {
              const suivants = { ...reglagesRef.current, micOffsetMs: v };
              reglagesRef.current = suivants;
              setReglages(suivants);
            }}
            onOffsetCommit={(v) => void appliquer({ micOffsetMs: v })}
          />
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
              statut.tone === 'danger' && 'bg-danger/15 text-danger-ink',
              statut.tone === 'warn' && 'bg-warn/15 text-warn-ink',
              statut.tone === 'ok' && 'bg-ok/15 text-ok-ink',
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
              disabled={recording || !hasTakeAudio}
              loading={calcul && mode !== 'playback'}
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
                // le bouton mene a l'ecran d'attente.
                <Button
                  variant={currentTake ? 'primary' : 'secondary'}
                  disabled={!currentTake || recording}
                  onClick={suivant}
                >
                  <Check className="h-4 w-4" aria-hidden />
                  {t.studio.finish}
                </Button>
              ) : (
                <Button
                  variant={currentTake ? 'primary' : 'secondary'}
                  disabled={recording}
                  onClick={suivant}
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
        <div className="order-6 shrink-0 lg:hidden">{consoleVoix}</div>

        {/* Stem de fond : la seule sortie audible pendant une prise. */}
        <audio ref={musicRef} src={media.data?.music ?? undefined} preload="auto" />
      </div>

      {/* La colonne de reglages defile pour elle seule : la page, non. */}
      <div className="min-w-0 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
        <StudioSidebar
          backing={backing}
          onBacking={setBacking}
          done={doneCount}
          total={myClips.length}
          voiceConsole={consoleVoix}
          devices={<AudioDevicesCard devices={devices} recording={recording} />}
        />
      </div>
    </div>
  );
}
