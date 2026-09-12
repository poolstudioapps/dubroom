import fs from 'node:fs/promises';

/**
 * Lecture et ecriture de WAV entier 16 bits.
 *
 * Le strict necessaire pour faire passer une prise par un traitement
 * ecrit en JavaScript : ffmpeg la decode en WAV, on la lit ici, on la
 * modifie, on la reecrit, et ffmpeg reprend la main. Aucune dependance,
 * parce qu'il ne s'agit que de lire un entete de quarante-quatre octets
 * et un tableau d'entiers.
 *
 * Mono uniquement, et c'est voulu : une prise de micro l'est toujours,
 * et un traitement de hauteur sur deux canaux desynchronises ferait plus
 * de degats que de bien.
 */
export interface Wav {
  sampleRate: number;
  samples: Float32Array;
}

export async function readWavMono(chemin: string): Promise<Wav> {
  const buffer = await fs.readFile(chemin);

  if (
    buffer.toString('ascii', 0, 4) !== 'RIFF' ||
    buffer.toString('ascii', 8, 12) !== 'WAVE'
  ) {
    throw new Error('Ce fichier n’est pas un WAV.');
  }

  // Les morceaux se suivent : on cherche `fmt ` puis `data`, sans
  // supposer qu'ils sont a une position fixe — ffmpeg en intercale
  // volontiers un troisieme avec ses metadonnees.
  let position = 12;
  let sampleRate = 0;
  let canaux = 1;
  let bits = 16;
  let debutData = -1;
  let tailleData = 0;

  while (position + 8 <= buffer.length) {
    const nom = buffer.toString('ascii', position, position + 4);
    const taille = buffer.readUInt32LE(position + 4);
    const contenu = position + 8;

    if (nom === 'fmt ') {
      canaux = buffer.readUInt16LE(contenu + 2);
      sampleRate = buffer.readUInt32LE(contenu + 4);
      bits = buffer.readUInt16LE(contenu + 14);
    } else if (nom === 'data') {
      debutData = contenu;
      tailleData = Math.min(taille, buffer.length - contenu);
      break;
    }
    position = contenu + taille + (taille % 2);
  }

  if (debutData < 0 || sampleRate === 0) throw new Error('WAV illisible.');
  if (bits !== 16) throw new Error(`WAV en ${bits} bits, 16 attendus.`);

  const total = Math.floor(tailleData / 2);
  const cadres = Math.floor(total / canaux);
  const samples = new Float32Array(cadres);

  // Les canaux surnumeraires sont moyennes : c'est plus honnete que de
  // jeter le second, qui porte parfois tout le signal.
  for (let i = 0; i < cadres; i += 1) {
    let somme = 0;
    for (let c = 0; c < canaux; c += 1) {
      somme += buffer.readInt16LE(debutData + (i * canaux + c) * 2) / 32768;
    }
    samples[i] = somme / canaux;
  }

  return { sampleRate, samples };
}

export async function writeWavMono(chemin: string, wav: Wav): Promise<void> {
  const n = wav.samples.length;
  const buffer = Buffer.alloc(44 + n * 2);

  buffer.write('RIFF', 0, 'ascii');
  buffer.writeUInt32LE(36 + n * 2, 4);
  buffer.write('WAVE', 8, 'ascii');
  buffer.write('fmt ', 12, 'ascii');
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(wav.sampleRate, 24);
  buffer.writeUInt32LE(wav.sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36, 'ascii');
  buffer.writeUInt32LE(n * 2, 40);

  for (let i = 0; i < n; i += 1) {
    // Bornage avant conversion : un depassement reboucle en entier
    // signe, et un clic tres fort remplace un leger ecretage.
    const v = Math.max(-1, Math.min(1, wav.samples[i]!));
    buffer.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }

  await fs.writeFile(chemin, buffer);
}
