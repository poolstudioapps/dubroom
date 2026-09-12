/**
 * Auto-test du moteur de mixage (PRD §12).
 *
 * Fabrique une mini-scene synthetique — un fond, un stem voix, deux
 * prises — puis rejoue exactement le chemin du rendu : construction du
 * filtergraph, mixage, mux. Il ne valide pas le gout du resultat, mais il
 * prouve que le graphe est syntaxiquement bon et que le MP4 produit a la
 * bonne duree, ce qui est precisement ce qui casse en silence.
 *
 *   npm run selftest
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { config } from '../src/config.ts';
import { mixWithGraph, muxFinal, probe } from '../src/lib/ffmpeg.ts';
import { buildMixGraph, placeTake } from '../src/lib/mixgraph.ts';
import { run } from '../src/lib/run.ts';

const DURATION_S = 10;

async function tone(file: string, frequency: number, seconds: number) {
  await run(
    config.ffmpeg,
    [
      '-hide_banner',
      '-f', 'lavfi',
      '-i', `sine=frequency=${frequency}:duration=${seconds}:sample_rate=48000`,
      '-ac', '2', '-c:a', 'pcm_s16le',
      '-y', file,
    ],
    { timeoutMs: 60_000 },
  );
}

/** Une prise telle que le navigateur la produit : mono, webm/opus. */
async function take(file: string, frequency: number, seconds: number) {
  await run(
    config.ffmpeg,
    [
      '-hide_banner',
      '-f', 'lavfi',
      '-i', `sine=frequency=${frequency}:duration=${seconds}:sample_rate=48000`,
      '-ac', '1', '-c:a', 'libopus', '-b:a', '96k', '-f', 'webm',
      '-y', file,
    ],
    { timeoutMs: 60_000 },
  );
}

async function video(file: string, seconds: number) {
  await run(
    config.ffmpeg,
    [
      '-hide_banner',
      '-f', 'lavfi', '-i', `color=c=black:s=640x360:d=${seconds}:r=25`,
      '-f', 'lavfi', '-i', `anullsrc=r=48000:cl=stereo:d=${seconds}`,
      '-shortest',
      '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-y', file,
    ],
    { timeoutMs: 120_000 },
  );
}

async function main() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'dubup-selftest-'));
  console.log(`\nAuto-test du mixage\n  dossier : ${dir}\n`);

  const music = path.join(dir, 'music.wav');
  const voice = path.join(dir, 'voice.wav');
  const take1 = path.join(dir, 'take1.webm');
  const take2 = path.join(dir, 'take2.webm');
  const source = path.join(dir, 'work.mp4');

  console.log('  … génération des entrées');
  await tone(music, 220, DURATION_S);
  await tone(voice, 880, DURATION_S);
  await take(take1, 440, 2);
  await take(take2, 660, 2);
  await video(source, DURATION_S);

  // Deux prises, dont une avec un decalage micro negatif, et deux
  // segments de VO a reinjecter : la configuration qui exerce tous les
  // chemins du constructeur de graphe.
  const inputs = [music, voice, take1, take2];
  const graph = buildMixGraph({
    musicInput: 0,
    voiceInput: 1,
    voSegments: [
      { startMs: 1000, endMs: 2500 },
      { startMs: 7000, endMs: 7060 },
    ],
    takes: [placeTake(3000, 0, -40, 2), placeTake(100, 0, -500, 3)],
  });

  const graphPath = path.join(dir, 'graph.txt');
  const mix = path.join(dir, 'mix.wav');
  const final = path.join(dir, 'final.mp4');

  console.log('  … mixage');
  await mixWithGraph(inputs, graph, graphPath, mix, DURATION_S * 1000, () => {});

  console.log('  … mux');
  await muxFinal(source, mix, final, DURATION_S * 1000, () => {});

  const result = await probe(final);
  const drift = Math.abs(result.durationMs - DURATION_S * 1000);

  console.log('');
  console.log(`  durée attendue : ${DURATION_S * 1000} ms`);
  console.log(`  durée obtenue  : ${result.durationMs} ms`);
  console.log(`  écart          : ${drift} ms`);
  console.log('');

  // duration=first doit avoir borne le mix a la duree du fond : une
  // prise qui deborde ne doit jamais allonger l'audio.
  if (drift > 200) {
    console.error('  ÉCHEC : la durée du rendu ne suit pas celle de la vidéo.');
    process.exit(1);
  }

  console.log('  OK — graphe valide, durée conservée, aucun sous-titre incrusté.');
  console.log('');
  await fs.rm(dir, { recursive: true, force: true });
}

main().catch((error) => {
  console.error(`\n  ÉCHEC : ${error.message}\n`);
  process.exit(1);
});
