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

/**
 * Le format d'enregistrement, par ordre de preference.
 *
 * Safari, et donc tout navigateur d'iPhone, ne sait pas produire de WebM :
 * il n'enregistre qu'en MP4. La liste s'arretait au WebM et a l'Ogg, si
 * bien que sur iPhone aucun candidat ne correspondait, et que la prise
 * etait ensuite envoyee etiquetee WebM alors qu'elle n'en etait pas.
 */
function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) {
    return undefined;
  }
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4;codecs=mp4a.40.2',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

/** L'extension et le type a declarer pour une prise, d'apres son contenu. */
export function takeFileFormat(blob: Blob): { extension: string; contentType: string } {
  const type = blob.type.toLowerCase();
  if (type.includes('mp4') || type.includes('aac') || type.includes('m4a')) {
    return { extension: 'm4a', contentType: 'audio/mp4' };
  }
  if (type.includes('ogg')) return { extension: 'ogg', contentType: 'audio/ogg' };
  return { extension: 'webm', contentType: 'audio/webm' };
}

export class MicRecorder {
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  /** L'entree ouverte : `''` pour celle du systeme. */
  private deviceId = '';

  /**
   * Ouvre le micro, une seule fois tant qu'on garde la meme entree.
   *
   * Changer d'entree referme l'ancienne. Une entree retenue mais
   * debranchee depuis ne bloque pas le studio : on retombe sur celle du
   * systeme plutot que de refuser d'enregistrer.
   */
  async prime(deviceId = ''): Promise<void> {
    if (this.stream && this.deviceId === deviceId) return;
    if (this.stream) this.release();

    const ouvrir = (id: string) =>
      navigator.mediaDevices.getUserMedia({
        audio: id ? { ...MIC_CONSTRAINTS, deviceId: { exact: id } } : MIC_CONSTRAINTS,
        video: false,
      });

    try {
      this.stream = await ouvrir(deviceId);
      this.deviceId = deviceId;
    } catch (error) {
      if (!deviceId || (error as DOMException)?.name === 'NotAllowedError') throw error;
      this.stream = await ouvrir('');
      this.deviceId = '';
    }
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
        // Le type reel du flux, pas celui qu'on esperait : c'est lui qui
        // decidera de l'extension a l'envoi.
        const blob = new Blob(this.chunks, {
          type: recorder.mimeType || this.chunks[0]?.type || 'audio/webm',
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
