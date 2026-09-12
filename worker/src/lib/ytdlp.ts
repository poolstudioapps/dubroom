import fs from 'node:fs/promises';
import path from 'node:path';

import { TIMEOUTS, config } from '../config.ts';
import { UserError } from '../errors.ts';
import { log } from '../log.ts';
import { run } from './run.ts';

/**
 * Les clients que yt-dlp doit essayer, dans l'ordre.
 *
 * Depuis une connexion domestique, le client par defaut suffit. Depuis
 * un centre de donnees, YouTube repond « Sign in to confirm you're not a
 * bot » et refuse tout — c'est une mesure anti-aspiration qui vise les
 * adresses des hebergeurs, la notre comprise.
 *
 * Certains clients y echappent encore : ceux des televisions connectees,
 * qui ne passent pas par les memes controles. La liste est reglable par
 * l'environnement parce que c'est un jeu du chat et de la souris : ce
 * qui marche ce mois-ci ne marchera peut-etre pas le suivant, et il faut
 * pouvoir changer sans reconstruire l'image.
 */
const CLIENTS = config.ytdlpClients;

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

  /*
   * Le message d'origine part dans les journaux avant d'etre remplace.
   *
   * Ce qu'on montre au joueur est volontairement court et actionnable ;
   * ce qu'on garde ici est ce qui permet de comprendre. Sans cette
   * ligne, un blocage anti-robot et une video privee se ressemblaient
   * comme deux gouttes d'eau dans les journaux, et il fallait deviner.
   */
  log.warn('yt-dlp a refusé', { detail: message.slice(0, 500) });

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
export async function inspect(
  url: string,
): Promise<{ durationMs: number; title: string }> {
  let stdout: string;
  try {
    ({ stdout } = await run(
      config.ytdlp,
      [
        '--dump-json',
        '--no-playlist',
        '--no-warnings',
        ...(CLIENTS ? ['--extractor-args', `youtube:player_client=${CLIENTS}`] : []),
        url,
      ],
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
        ...(CLIENTS ? ['--extractor-args', `youtube:player_client=${CLIENTS}`] : []),
        '-f',
        'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        '--merge-output-format',
        'mp4',
        // Obligatoire des qu'il y a fusion video+audio : sans ca yt-dlp
        // cherche ffmpeg dans le PATH global et echoue.
        '--ffmpeg-location',
        path.dirname(config.ffmpeg),
        '--newline',
        '-o',
        path.join(workDir, 'dl.%(ext)s'),
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
