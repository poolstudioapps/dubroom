/**
 * Rattrape l'enveloppe de la voix pour les scenes deja ingerees.
 *
 * L'enveloppe est calculee a l'ingestion depuis la version qui l'ajoute ;
 * les scenes anterieures n'en ont pas, et le studio se contente alors de
 * ne rien tracer. Ce script la calcule apres coup, tant que le stem voix
 * est encore la — c'est-a-dire tant que la scene n'a pas ete rendue, le
 * rendu purgeant la source (PRD §13.1).
 *
 *   npm run backfill:envelope
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { BUCKET_SOURCES } from '../../config/constants.ts';
import { assertConfig } from '../src/config.ts';
import { db, updateSession } from '../src/lib/db.ts';
import { computeEnvelope } from '../src/lib/envelope.ts';
import * as storage from '../src/lib/storage.ts';

assertConfig();

const { data, error } = await db
  .from('sessions')
  .select('id, title, code, stem_voice_path')
  .not('stem_voice_path', 'is', null)
  .is('voice_peaks', null);

if (error) {
  console.error(`\n  Lecture impossible : ${error.message}\n`);
  process.exit(1);
}

const sessions = (data ?? []) as {
  id: string;
  title: string | null;
  code: string;
  stem_voice_path: string;
}[];

console.log(`\nRattrapage de l enveloppe\n`);
if (sessions.length === 0) {
  console.log('  Aucune scene a traiter.\n');
  process.exit(0);
}

let done = 0;
for (const session of sessions) {
  const label = `${session.code} ${session.title ?? ''}`.trim();
  process.stdout.write(`  . ${label} `);

  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'dubroom-envelope-'));
  const local = path.join(dir, 'voice.wav');

  try {
    await storage.download(BUCKET_SOURCES, session.stem_voice_path, local);
    const envelope = await computeEnvelope(local, dir);
    await updateSession(session.id, {
      voice_peaks: envelope.peaks,
      voice_peaks_hz: envelope.hz,
    });
    console.log(`OK (${envelope.peaks.length} caracteres)`);
    done += 1;
  } catch (err) {
    console.log(`ECHEC : ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

if (sessions.length > 0) {
  console.log(`\n  ${done}/${sessions.length} scene(s) traitee(s).\n`);
}

// Le client Supabase ouvre une connexion Realtime des sa creation. Sans
// fermeture explicite, Node sort sur une assertion libuv sous Windows :
// un script qui a bien travaille finirait sur un message d'erreur.
await db.removeAllChannels();
db.realtime.disconnect();
