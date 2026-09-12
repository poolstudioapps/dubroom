import fs from 'node:fs/promises';
import path from 'node:path';

import { WORKER_ROOT, assertConfig, config } from './config.ts';
import { isUserError, publicMessage, technicalMessage } from './errors.ts';
import { runIngest } from './jobs/ingest.ts';
import { runRender } from './jobs/render.ts';
import {
  claimJob,
  db,
  failJob,
  finishJob,
  heartbeat,
  requeueStaleJobs,
  updateSession,
  type Job,
} from './lib/db.ts';
import { run } from './lib/run.ts';
import { log, scopedLog } from './log.ts';

let stopping = false;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Filet de securite (PRD §20.1.9) : si le worker a ete lance sans passer
 * par start.bat, on verifie quand meme que l'environnement est complet.
 */
async function verifyEnvironment(): Promise<void> {
  try {
    await run(process.execPath, [path.join(WORKER_ROOT, 'scripts', 'bootstrap.mjs'), '--check'], {
      timeoutMs: 120_000,
      onStdout: (chunk) => process.stdout.write(chunk),
    });
  } catch {
    throw new Error(
      "L'environnement est incomplet. Lance start.bat (ou `npm run setup`) pour installer ce qui manque.",
    );
  }
}

/**
 * Nettoyage des dossiers de travail de plus de N jours (PRD §20.11).
 * Les dossiers d'un job en echec sont conserves : c'est ce qui permet de
 * comprendre ce qui s'est passe.
 */
async function cleanOldWorkDirs(): Promise<void> {
  const cutoff = Date.now() - config.workRetentionDays * 24 * 60 * 60 * 1000;
  let entries: string[];
  try {
    entries = await fs.readdir(config.workDir);
  } catch {
    return;
  }

  for (const entry of entries) {
    const dir = path.join(config.workDir, entry);
    try {
      const stat = await fs.stat(dir);
      if (stat.isDirectory() && stat.mtimeMs < cutoff) {
        await fs.rm(dir, { recursive: true, force: true });
        log.info('dossier de travail expiré supprimé', { dir });
      }
    } catch {
      // Un dossier verrouille n'empeche pas le worker de demarrer.
    }
  }
}

async function handleJob(job: Job): Promise<void> {
  const logger = scopedLog({ sessionId: job.session_id, jobId: job.id, type: job.type });
  const workDir = path.join(config.workDir, job.session_id);
  await fs.mkdir(workDir, { recursive: true });

  logger.info(`job ${job.type} démarré`, { attempt: job.attempts });
  const startedAt = Date.now();

  try {
    if (job.type === 'ingest') await runIngest(job, workDir, logger);
    else await runRender(job, workDir, logger);

    await finishJob(job.id);
    // Dossier supprime en fin de job REUSSI uniquement.
    await fs.rm(workDir, { recursive: true, force: true });

    logger.info(`job ${job.type} terminé`, {
      seconds: Math.round((Date.now() - startedAt) / 1000),
    });
  } catch (error) {
    const userFacing = isUserError(error);
    logger.error(`job ${job.type} en échec`, {
      user: userFacing,
      detail: technicalMessage(error),
      workDir,
    });

    const failedStatus = job.type === 'ingest' ? 'ingest_failed' : 'render_failed';
    const queuedStatus = job.type === 'ingest' ? 'ingest_queued' : 'render_queued';

    // Une UserError ne se retente pas : reessayer trois fois de
    // telecharger une video privee ne la rendra pas publique (PRD §20.3).
    const retryable = !userFacing && job.attempts < config.maxAttempts;

    if (retryable) {
      await db
        .from('jobs')
        .update({ status: 'queued', step: null, progress: 0, error: technicalMessage(error) })
        .eq('id', job.id);
      await updateSession(job.session_id, { status: queuedStatus });
      logger.warn('job remis en file', { attempts: job.attempts });
    } else {
      await failJob(job.id, publicMessage(error));
      await updateSession(job.session_id, { status: failedStatus });
    }
  }
}

async function main(): Promise<void> {
  console.log('');
  console.log('DubRoom worker');
  console.log('');

  await verifyEnvironment();
  assertConfig();

  await fs.mkdir(config.workDir, { recursive: true });
  await cleanOldWorkDirs();

  // Reprise apres crash, au demarrage et pas dans un cron (PRD §7.2).
  const revived = await requeueStaleJobs();
  if (revived > 0) log.info('jobs bloqués remis en file', { count: revived });

  log.info('worker prêt', {
    id: config.workerId,
    separation: config.separationMode,
    workDir: config.workDir,
  });
  console.log('');
  console.log('  En attente de jobs. Laisse cette fenêtre ouverte.');
  console.log('  Ctrl+C pour arrêter.');
  console.log('');

  while (!stopping) {
    try {
      // Le worker est le seul a initier la connexion : il interroge
      // Supabase en boucle, rien n'entre chez l'hote (PRD §5.3.1).
      const job = await claimJob();

      if (!job) {
        await sleep(config.pollIntervalMs);
        continue;
      }

      // Un seul job a la fois : ffmpeg et Demucs saturent la machine.
      await handleJob(job);
    } catch (error) {
      log.error('erreur de boucle', { detail: technicalMessage(error) });
      await heartbeat().catch(() => undefined);
      await sleep(config.pollIntervalMs * 5);
    }
  }

  log.info('worker arrêté');
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    if (stopping) process.exit(1);
    stopping = true;
    console.log('');
    log.info('arrêt demandé, fin du job en cours…');
  });
}

main().catch((error) => {
  log.error('démarrage impossible', { detail: technicalMessage(error) });
  console.error('');
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
