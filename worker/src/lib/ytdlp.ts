import fs from 'node:fs/promises';
import path from 'node:path';

import { TIMEOUTS, config } from '../config.ts';
import { UserError } from '../errors.ts';
import { run } from './run.ts';

/**
 * Motifs d'echec cote utilisateur (PRD §20.6). Ce sont des UserError :
 * message clair invitant a televerser le fichier, et surtout pas de
 * retry — reessayer ne rendra pas publique une video privee.
 */
const USER_FACING = [
  'Sign in to confirm',
  'Video unavailable',
  'Private video',
  'This video is unavailable',
  'members-only',
  'age-restricted',
  'removed by the user',
  'copyright',
];

function toUserError(error: unknown): never {
  const message = error instanceof Error ? error.message : String(error);
  if (USER_FACING.some((needle) => message.includes(needle))) {
    throw new UserError(
      'YouTube refuse cette vidéo. Importe plutôt le fichier directement.',
    );
  }
  throw new UserError(
    'Le téléchargement YouTube a échoué. Importe plutôt le fichier vidéo directement.',
  );
}

/** Verifie la duree AVANT de telecharger quoi que ce soit. */
export async function inspect(url: string): Promise<{ durationMs: number; title: string }> {
  let stdout: string;
  try {
    ({ stdout } = await run(
      config.ytdlp,
      ['--dump-json', '--no-playlist', '--no-warnings', url],
      { timeoutMs: TIMEOUTS.ytdlp },
    ));
  } catch (error) {
    toUserError(error);
  }

  const info = JSON.parse(stdout) as { duration?: number; title?: string };
  const durationMs = Math.round((info.duration ?? 0) * 1000);
  if (durationMs > config.maxVideoDurationMs) {
    throw new UserError(
      `Cette vidéo dépasse ${Math.round(config.maxVideoDurationMs / 60000)} minutes.`,
    );
  }
  return { durationMs, title: info.title ?? 'Scène YouTube' };
}

/**
 * Telecharge dans workDir et rend le chemin obtenu.
 *
 * Le gabarit `-o` contient `%(ext)s` : le nom final n'est pas connu a
 * l'avance, on liste donc le dossier plutot que de supposer `dl.mp4`.
 */
export async function download(
  url: string,
  workDir: string,
  onProgress: (pct: number) => void,
): Promise<string> {
  try {
    await run(
      config.ytdlp,
      [
        '--no-playlist',
        '-f',
        'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        '--merge-output-format', 'mp4',
        // Obligatoire des qu'il y a fusion video+audio : sans ca yt-dlp
        // cherche ffmpeg dans le PATH global et echoue.
        '--ffmpeg-location', path.dirname(config.ffmpeg),
        '--newline',
        '-o', path.join(workDir, 'dl.%(ext)s'),
        url,
      ],
      {
        timeoutMs: TIMEOUTS.ytdlp,
        onStdout: (chunk) => {
          const match = /\[download\]\s+(\d+(?:\.\d+)?)%/.exec(chunk);
          if (match?.[1]) onProgress(Math.min(99, Math.round(Number(match[1]))));
        },
      },
    );
  } catch (error) {
    toUserError(error);
  }

  const entries = await fs.readdir(workDir);
  const file = entries.find((name) => name.startsWith('dl.'));
  if (!file) {
    throw new UserError(
      'Le téléchargement YouTube n’a produit aucun fichier. Importe plutôt la vidéo.',
    );
  }
  return path.join(workDir, file);
}
