'use client';

import { TAKE_AUDIO_BITS_PER_SECOND } from '@/config/constants';

/**
 * Capture micro pour le studio (PRD §11.4).
 *
 * Les contraintes ne sont pas negociables :
 * - `echoCancellation: false` — le casque est obligatoire, et l'AEC
 *   degrade nettement une voix jouee.
 * - `autoGainControl: false` — un comedien qui chuchote puis crie doit
 *   rester chuchotant puis criant.
 */
export const MIC_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: false,
  noiseSuppression: true,
  autoGainControl: false,
  channelCount: 1,
  sampleRate: 48_000,
};

function pickMimeType(): string | undefined {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

export class MicRecorder {
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  /** Ouvre le micro une seule fois pour toute la session de studio. */
  async prime(): Promise<void> {
    if (this.stream) return;
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: MIC_CONSTRAINTS,
      video: false,
    });
  }

  get ready(): boolean {
    return !!this.stream;
  }

  start(): void {
    if (!this.stream) throw new Error('Micro non initialisé');
    this.chunks = [];
    const mimeType = pickMimeType();
    this.recorder = new MediaRecorder(this.stream, {
      ...(mimeType ? { mimeType } : {}),
      audioBitsPerSecond: TAKE_AUDIO_BITS_PER_SECOND,
    });
    this.recorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.chunks.push(event.data);
    };
    this.recorder.start();
  }

  /** Arrete la capture et rend le blob complet. */
  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const recorder = this.recorder;
      if (!recorder || recorder.state === 'inactive') {
        reject(new Error('Aucun enregistrement en cours'));
        return;
      }
      recorder.onstop = () => {
        const blob = new Blob(this.chunks, {
          type: recorder.mimeType || 'audio/webm',
        });
        this.chunks = [];
        this.recorder = null;
        resolve(blob);
      };
      recorder.stop();
    });
  }

  get recording(): boolean {
    return this.recorder?.state === 'recording';
  }

  /** Libere le micro quand on quitte le studio. */
  release(): void {
    this.recorder?.state === 'recording' && this.recorder.stop();
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.recorder = null;
  }
}
