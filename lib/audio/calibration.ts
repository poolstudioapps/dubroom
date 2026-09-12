'use client';

import { MIC_OFFSET_MAX_MS, MIC_OFFSET_MIN_MS } from '@/config/constants';
import { MIC_CONSTRAINTS } from '@/lib/audio/recorder';
import { clamp } from '@/lib/utils';

/**
 * Calibrage de la latence micro (PRD §11.6) — confort, non bloquant.
 *
 * On emet un clic, on enregistre, et on mesure l'ecart entre l'instant
 * d'emission et le pic capte. Le resultat sert de `mic_offset_ms`, qui
 * est applique au mixage et jamais a l'enregistrement.
 *
 * Necessite un casque : sans lui, le clic sort du haut-parleur et la
 * mesure inclut la distance au micro, ce qui reste du meme ordre de
 * grandeur mais devient moins fiable.
 */
export async function calibrateMicOffset(): Promise<number> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: MIC_CONSTRAINTS,
    video: false,
  });

  try {
    const ctx = new AudioContext();
    await ctx.resume();

    const source = ctx.createMediaStreamSource(stream);
    const captured: Float32Array[] = [];

    // ScriptProcessor est deprecie mais reste le seul chemin sans
    // AudioWorklet externe ; la capture ne dure qu'une seconde.
    const processor = ctx.createScriptProcessor(1024, 1, 1);
    processor.onaudioprocess = (event) => {
      captured.push(new Float32Array(event.inputBuffer.getChannelData(0)));
    };
    source.connect(processor);
    processor.connect(ctx.destination);

    // Laisse la chaine se stabiliser avant d'emettre.
    const clickAt = ctx.currentTime + 0.3;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 2000;
    gain.gain.setValueAtTime(0, clickAt - 0.001);
    gain.gain.setValueAtTime(0.6, clickAt);
    gain.gain.setValueAtTime(0, clickAt + 0.005);
    osc.connect(gain).connect(ctx.destination);
    osc.start(clickAt - 0.01);
    osc.stop(clickAt + 0.05);

    const startedAt = ctx.currentTime;
    await new Promise((resolve) => setTimeout(resolve, 1200));

    processor.disconnect();
    source.disconnect();

    const sampleRate = ctx.sampleRate;
    const total = captured.reduce((sum, chunk) => sum + chunk.length, 0);
    const samples = new Float32Array(total);
    let cursor = 0;
    for (const chunk of captured) {
      samples.set(chunk, cursor);
      cursor += chunk.length;
    }
    await ctx.close();

    // Pic le plus fort : le clic est bien plus energique que le silence
    // d'une piece calme, une simple recherche de maximum suffit.
    let peakIndex = -1;
    let peak = 0;
    for (let i = 0; i < samples.length; i += 1) {
      const value = Math.abs(samples[i] ?? 0);
      if (value > peak) {
        peak = value;
        peakIndex = i;
      }
    }
    if (peakIndex < 0 || peak < 0.05) {
      throw new Error('Aucun clic détecté');
    }

    const capturedAtS = peakIndex / sampleRate;
    const emittedAtS = clickAt - startedAt;
    const offsetMs = Math.round((capturedAtS - emittedAtS) * 1000);

    return clamp(offsetMs, MIC_OFFSET_MIN_MS, MIC_OFFSET_MAX_MS);
  } finally {
    stream.getTracks().forEach((track) => track.stop());
  }
}
