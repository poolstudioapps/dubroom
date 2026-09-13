import fs from 'node:fs/promises';
import path from 'node:path';

import { TIMEOUTS, config } from '../config.ts';
import { UserError } from '../errors.ts';
import { log } from '../log.ts';
import { run } from './run.ts';
import { listerProxys } from './webshare.ts';

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

/**
 * Les refus qu'aucune autre sortie ne leverait.
 *
 * Une video privee reste privee quelle que soit l'adresse qui la
 * demande : insister sur dix intermediaires ne ferait qu'ajouter une
 * minute d'attente avant le meme message. Le controle anti-robot, lui,
 * ne juge que l'adresse — d'ou son absence de cette liste.
 */
const DEFINITIF = [
  'Private video',
  'Video unavailable',
  'This video is unavailable',
  'members-only',
  'age-restricted',
  'removed by the user',
  'copyright',
];

/** Une sortie : un intermediaire, ou `null` pour la connexion directe. */
type Sortie = string | null;

/**
 * La derniere sortie qui a fonctionne, essayee en premier la fois
 * suivante.
 *
 * Sans cette memoire, chaque telechargement recommencerait par les
 * intermediaires refuses et perdrait une dizaine de secondes avant
 * d'atteindre celui qui marche. Elle ne survit pas a l'arret du worker,
 * ce qui est voulu : les reputations changent, et repartir de la liste
 * complete est le bon reflexe au demarrage.
 */
let derniereBonne: Sortie | undefined;

async function sorties(): Promise<Sortie[]> {
  /*
   * L'ordre : les intermediaires regles a la main d'abord, puis ceux que
   * le fournisseur annonce, puis la connexion directe.
   *
   * Un intermediaire paye, ajoute un jour dans `YTDLP_PROXIES`, doit
   * passer avant les gratuits — c'est le seul sur lequel on compte. Et
   * la tentative directe ferme toujours la marche : sur le PC d'un hote,
   * elle est la seule de la liste, et elle suffit.
   */
  const annonces = await listerProxys();
  const vues = new Set<string>();
  const liste: Sortie[] = [];
  for (const proxy of [...config.ytdlpProxies, ...annonces]) {
    if (vues.has(proxy)) continue;
    vues.add(proxy);
    liste.push(proxy);
  }
  liste.push(null);

  const connue = derniereBonne === undefined ? -1 : liste.indexOf(derniereBonne);
  if (connue > 0) liste.unshift(...liste.splice(connue, 1));
  return liste;
}

/** Le nom d'une sortie pour les journaux, sans son mot de passe. */
function nommer(sortie: Sortie): string {
  if (!sortie) return 'directe';
  // Les journaux Cloud Run sont lisibles par toute personne ayant acces
  // a la console : l'identifiant du proxy n'a rien a y faire.
  return sortie.replace(/\/\/[^@]*@/, '//');
}

/**
 * Rejoue l'action sur chaque sortie jusqu'a ce que l'une aboutisse.
 *
 * Le detail qui justifie cette boucle : une adresse peut repondre aux
 * questions sur la video puis refuser d'en livrer le flux. Inspection et
 * telechargement passent donc tous deux par ici, et rien ne garantit
 * qu'ils retiendront la meme.
 */
async function viaSortie<T>(
  quoi: string,
  action: (sortie: Sortie) => Promise<T>,
): Promise<T> {
  const liste = await sorties();
  let derniere: unknown;

  for (const [rang, sortie] of liste.entries()) {
    try {
      const resultat = await action(sortie);
      if (sortie !== derniereBonne) {
        log.info(`${quoi} : sortie retenue`, { via: nommer(sortie) });
        derniereBonne = sortie;
      }
      return resultat;
    } catch (error) {
      derniere = error;
      const message = error instanceof Error ? error.message : String(error);
      if (DEFINITIF.some((motif) => message.includes(motif))) throw error;
      if (rang < liste.length - 1) {
        log.warn(`${quoi} : sortie refusee, on passe a la suivante`, {
          via: nommer(sortie),
          restantes: liste.length - rang - 1,
        });
      }
    }
  }
  throw derniere;
}

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
    ({ stdout } = await viaSortie('inspection', (sortie) =>
      run(
        config.ytdlp,
        [
          '--dump-json',
          '--no-playlist',
          '--no-warnings',
          ...(CLIENTS ? ['--extractor-args', `youtube:player_client=${CLIENTS}`] : []),
          ...(sortie ? ['--proxy', sortie] : []),
          url,
        ],
        { timeoutMs: TIMEOUTS.ytdlp },
      ),
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
    await viaSortie('téléchargement', (sortie) =>
      run(
        config.ytdlp,
        [
          '--no-playlist',
          ...(CLIENTS ? ['--extractor-args', `youtube:player_client=${CLIENTS}`] : []),
          ...(sortie ? ['--proxy', sortie] : []),
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
      ),
    );
  } catch (error) {
    toUserError(error);
  }

  const entries = await fs.readdir(workDir);
  /*
   * Le fichier fusionne d'abord, le reste ensuite.
   *
   * Une sortie refusee en plein telechargement laisse derriere elle des
   * pistes separees — `dl.f137.mp4` pour l'image, `dl.f140.m4a` pour le
   * son — et parfois un `.part` inacheve. Prendre le premier `dl.` venu
   * revenait a doubler, une fois sur deux, une video muette.
   */
  const file =
    entries.find((name) => /^dl\.(mp4|mkv|webm)$/.test(name)) ??
    entries.find((name) => name.startsWith('dl.') && !name.endsWith('.part'));
  if (!file) {
    throw new UserError(
      'Le téléchargement YouTube n’a produit aucun fichier. Importe plutôt la vidéo.',
    );
  }
  return path.join(workDir, file);
}
