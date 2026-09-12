import { createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import { SystemError } from '../errors.ts';
import { db } from './db.ts';

/**
 * Acces Storage depuis le worker (PRD §20.10).
 *
 * Les fichiers pesent plusieurs centaines de Mo : rien ne reste en
 * memoire, tout passe par le disque.
 */

export async function download(
  bucket: string,
  remotePath: string,
  localPath: string,
): Promise<void> {
  const { data, error } = await db.storage.from(bucket).download(remotePath);
  if (error || !data) {
    throw new SystemError(
      `Téléchargement impossible : ${bucket}/${remotePath} (${error?.message ?? 'vide'})`,
    );
  }
  const stream = Readable.fromWeb(
    data.stream() as unknown as Parameters<typeof Readable.fromWeb>[0],
  );
  await pipeline(stream, createWriteStream(localPath));
}

export async function upload(
  bucket: string,
  remotePath: string,
  localPath: string,
  contentType: string,
): Promise<void> {
  const body = await fs.readFile(localPath);
  const { error } = await db.storage.from(bucket).upload(remotePath, body, {
    contentType,
    // upsert pour qu'une reprise apres crash ne parte pas en erreur de
    // doublon : les jobs doivent rester idempotents (PRD §18).
    upsert: true,
  });
  if (error) {
    throw new SystemError(
      `Envoi impossible : ${bucket}/${remotePath} (${error.message})`,
    );
  }
}

/**
 * Verifie qu'un objet existe et n'est pas vide.
 * Appele avant toute purge : purger sans confirmation, c'est perdre la
 * session (PRD §13.1).
 */
export async function verifyUploaded(
  bucket: string,
  remotePath: string,
): Promise<number> {
  const slash = remotePath.lastIndexOf('/');
  const folder = slash >= 0 ? remotePath.slice(0, slash) : '';
  const name = slash >= 0 ? remotePath.slice(slash + 1) : remotePath;

  const { data, error } = await db.storage.from(bucket).list(folder, { search: name });
  if (error) throw new SystemError(`Vérification impossible : ${error.message}`);

  const found = (data ?? []).find((item) => item.name === name);
  const size = (found?.metadata as { size?: number } | undefined)?.size ?? 0;
  if (!found || size <= 0) {
    throw new SystemError(
      `Le rendu n'est pas arrivé dans ${bucket}/${remotePath} : purge annulée.`,
    );
  }
  return size;
}

/** Supprime recursivement tout ce qu'un bucket contient pour une session. */
export async function removeSessionFolder(
  bucket: string,
  sessionId: string,
): Promise<number> {
  let removed = 0;

  const { data: entries } = await db.storage
    .from(bucket)
    .list(sessionId, { limit: 1000 });
  const files: string[] = [];

  for (const entry of entries ?? []) {
    // Un objet sans metadata est un dossier : le bucket `takes` est
    // range par participant, il y a donc un niveau de plus.
    if (entry.id === null) {
      const { data: nested } = await db.storage
        .from(bucket)
        .list(`${sessionId}/${entry.name}`, { limit: 1000 });
      for (const child of nested ?? []) {
        files.push(`${sessionId}/${entry.name}/${child.name}`);
      }
    } else {
      files.push(`${sessionId}/${entry.name}`);
    }
  }

  if (files.length > 0) {
    const { error } = await db.storage.from(bucket).remove(files);
    if (error) throw new SystemError(`Purge impossible : ${error.message}`);
    removed = files.length;
  }
  return removed;
}
