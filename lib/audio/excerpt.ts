'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Lecteur d'extrait : joue exactement [startMs, endMs] d'un media, puis
 * s'arrete. Sert a l'ecran de preparation, ou l'hote identifie une voix
 * en ecoutant une replique (PRD §9.1).
 */
export function useExcerpt(url: string | null | undefined) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopAtRef = useRef<number | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'none';
    audioRef.current = audio;

    const onTimeUpdate = () => {
      const stopAt = stopAtRef.current;
      if (stopAt !== null && audio.currentTime >= stopAt) {
        audio.pause();
        stopAtRef.current = null;
        setPlayingId(null);
      }
    };
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', () => setPlayingId(null));

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio && url && audio.src !== url) audio.src = url;
  }, [url]);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    stopAtRef.current = null;
    setPlayingId(null);
  }, []);

  const play = useCallback(
    (id: string, startMs: number, endMs: number) => {
      const audio = audioRef.current;
      if (!audio || !url) return;
      if (playingId === id) {
        stop();
        return;
      }
      audio.currentTime = startMs / 1000;
      stopAtRef.current = endMs / 1000;
      setPlayingId(id);
      void audio.play().catch(() => setPlayingId(null));
    },
    [playingId, stop, url],
  );

  return { play, stop, playingId };
}
