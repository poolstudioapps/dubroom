/**
 * Confronte l'adaptateur Scribe a la vraie reponse de l'API.
 *
 * Le PRD §20.8 donne la forme de la reponse « de memoire » et demande
 * explicitement de ne pas la consommer telle quelle. Ce script fabrique
 * de la vraie parole francaise avec le TTS du meme fournisseur, la
 * transcrit, puis verifie que `parseScribeResponse` et le regroupement en
 * repliques tiennent debout sur des donnees reelles.
 *
 *   npm run probe:scribe
 *
 * Il consomme quelques credits ElevenLabs. Ce n'est pas un test a rejouer
 * en boucle, c'est le controle a faire une fois, et a refaire le jour ou
 * l'API bouge.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { config } from '../src/config.ts';
import { downmixForStt } from '../src/lib/ffmpeg.ts';
import { parseScribeResponse } from '../src/lib/scribe.ts';
import { groupWordsIntoLines } from '../../lib/segmentation.ts';

const PHRASE =
  "Bonjour. Tu fais quoi ce soir ? Moi je reste ici, j'ai du travail.";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dubroom-scribe-'));
const key = config.elevenLabsKey;

console.log('\nControle de l adaptateur Scribe\n');

// ── 1. Une voix, n'importe laquelle ─────────────────────────────────
const voicesRes = await fetch('https://api.elevenlabs.io/v1/voices', {
  headers: { 'xi-api-key': key },
});
if (!voicesRes.ok) {
  console.log(`  cle refusee : HTTP ${voicesRes.status}`);
  console.log(`  ${(await voicesRes.text()).slice(0, 200)}`);
  process.exit(1);
}
const voices = ((await voicesRes.json()) as { voices?: { voice_id: string }[] })
  .voices ?? [];
console.log(`  cle valide, ${voices.length} voix disponibles`);

const voiceId = voices[0]?.voice_id;
if (!voiceId) {
  console.log('  aucune voix disponible');
  process.exit(1);
}

// ── 2. Synthese ─────────────────────────────────────────────────────
const ttsRes = await fetch(
  `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
  {
    method: 'POST',
    headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: PHRASE, model_id: 'eleven_multilingual_v2' }),
  },
);
if (!ttsRes.ok) {
  console.log(`  TTS : HTTP ${ttsRes.status} ${(await ttsRes.text()).slice(0, 200)}`);
  process.exit(1);
}
const mp3 = path.join(dir, 'speech.mp3');
fs.writeFileSync(mp3, Buffer.from(await ttsRes.arrayBuffer()));
console.log(`  parole synthetisee : ${Math.round(fs.statSync(mp3).size / 1024)} Ko`);

// Meme downmix que le worker avant l'envoi a Scribe.
const wav = path.join(dir, 'speech16k.wav');
await downmixForStt(mp3, wav);

// ── 3. Transcription ────────────────────────────────────────────────
const form = new FormData();
form.append('file', new Blob([fs.readFileSync(wav)], { type: 'audio/wav' }), 'a.wav');
form.append('model_id', 'scribe_v1');
form.append('diarize', 'true');
form.append('timestamps_granularity', 'word');
form.append('tag_audio_events', 'false');
form.append('language_code', 'fra');

const sttRes = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
  method: 'POST',
  headers: { 'xi-api-key': key },
  body: form,
});
const raw = await sttRes.text();
fs.writeFileSync(path.join(dir, 'scribe-raw.json'), raw);

if (!sttRes.ok) {
  console.log(`  Scribe : HTTP ${sttRes.status}`);
  console.log(`  ${raw.slice(0, 300)}`);
  process.exit(1);
}

const payload = JSON.parse(raw) as Record<string, unknown>;
console.log(`  cles racine        : ${Object.keys(payload).join(', ')}`);

const firstWord = (payload.words as Record<string, unknown>[] | undefined)?.[0];
console.log(
  `  champs d un mot    : ${firstWord ? Object.keys(firstWord).join(', ') : 'AUCUN'}`,
);
console.log(`  texte reconnu      : ${String(payload.text ?? '').slice(0, 90)}`);

// ── 4. Adaptateur et decoupage ──────────────────────────────────────
const words = parseScribeResponse(payload);
console.log(`  adaptateur         : ${words.length} mots`);
console.log(`  premier mot        : ${JSON.stringify(words[0])}`);

const lines = groupWordsIntoLines(words);
console.log(`  repliques          : ${lines.length}`);
for (const line of lines) {
  console.log(`    [${line.startMs}-${line.endMs}] ${line.speaker} : ${line.text}`);
}
console.log(`\n  reponse brute conservee : ${path.join(dir, 'scribe-raw.json')}\n`);
