import fs from 'node:fs/promises';
import path from 'node:path';

import {
  BUCKET_RENDERS,
  BUCKET_SOURCES,
  BUCKET_TAKES,
  MIC_OFFSET_BASELINE_MS,
} from '../../../config/constants.ts';
import { SystemError, UserError } from '../errors.ts';
import { db, getSession, setJobStep, updateSession, type Job } from '../lib/db.ts';
import { demandeTraitement, traiterVoix } from '../../../lib/audio/voice-dsp.ts';
import {
  audioDurationMs,
  decodeTakeToWav,
  extractAudio,
  graphPathFor,
  meanVolumeDb,
  mixWithGraph,
  muxFinal,
} from '../lib/ffmpeg.ts';
import { readWavMono, writeWav } from '../lib/wav.ts';
import { buildMixGraph, placeTake, type VoSegment } from '../lib/mixgraph.ts';
import { buildPack } from './pack.ts';
import * as storage from '../lib/storage.ts';
import type { ScopedLog } from '../log.ts';

interface ClipRow {
  id: string;
  character_id: string;
  window_start_ms: number;
  speech_start_ms: number;
  speech_end_ms: number;
}

interface CharacterRow {
  id: string;
  is_released: boolean;
}

interface LineRow {
  character_id: string;
  start_ms: number;
  end_ms: number;
  is_deleted: boolean;
}

interface TakeRow {
  id: string;
  clip_id: string;
  participant_id: string;
  audio_path: string;
  offset_ms: number;
  fx_reverb: number | null;
  fx_pitch: number | null;
  /** Decalage micro de cette prise, regle dans la console de voix. */
  mic_offset_ms: number | null;
  /** Gain de cette prise, en dB, ajoute a la correction automatique. */
  gain_db: number | string | null;
}

/**
 * Moteur de rendu (PRD §12).
 *
 * Cinq etapes : recuperation, mixage, mux, envoi, purge. La purge n'a
 * lieu qu'apres verification que le rendu est bien arrive — purger avant,
 * c'est perdre la session (PRD §13.1).
 */
export async function runRender(job: Job, workDir: string, logger: ScopedLog) {
  const session = await getSession(job.session_id);

  if (!session.video_path || !session.stem_music_path || !session.stem_voice_path) {
    throw new UserError(
      'Les fichiers de cette scène ont été purgés : le rendu n’est plus possible.',
    );
  }

  // ── 1. Recuperation ─────────────────────────────────────────────────
  await setJobStep(job.id, 'fetch', 0);

  const [characters, clips, lines, takes, participants] = await Promise.all([
    db.from('characters').select('id, is_released').eq('session_id', session.id),
    db
      .from('clips')
      .select('id, character_id, window_start_ms, speech_start_ms, speech_end_ms')
      .eq('session_id', session.id),
    db
      .from('lines')
      .select('character_id, start_ms, end_ms, is_deleted')
      .eq('session_id', session.id),
    db
      .from('takes')
      .select(
        'id, clip_id, participant_id, audio_path, offset_ms, fx_reverb, fx_pitch, mic_offset_ms, gain_db',
      )
      .eq('is_selected', true),
    db
      .from('participants')
      .select('id, mic_offset_ms, is_kicked')
      .eq('session_id', session.id),
  ]);

  const dbError =
    characters.error ?? clips.error ?? lines.error ?? takes.error ?? participants.error;
  if (dbError)
    throw new SystemError(`Lecture de la scène impossible : ${dbError.message}`);

  const characterRows = (characters.data ?? []) as CharacterRow[];
  const clipRows = (clips.data ?? []) as ClipRow[];
  const lineRows = (lines.data ?? []) as LineRow[];
  const clipIds = new Set(clipRows.map((c) => c.id));
  const takeRows = ((takes.data ?? []) as TakeRow[]).filter((t) =>
    clipIds.has(t.clip_id),
  );

  const micOffsetOf = new Map(
    (participants.data ?? []).map((p) => [
      p.id as string,
      {
        offset: p.mic_offset_ms as number,
        kicked: p.is_kicked as boolean,
      },
    ]),
  );
  const releasedCharacters = new Set(
    characterRows.filter((c) => c.is_released).map((c) => c.id),
  );

  // Telechargement des trois fichiers de session, puis des prises.
  /*
   * Le nom local suit l'extension stockee, jamais une supposition.
   *
   * Les scenes preparees avant le passage au FLAC ont des chemins en
   * `.wav` et doivent continuer a se rendre. Nommer le fichier d'apres
   * ce qu'on telecharge evite une migration, et evite surtout de
   * presenter a ffmpeg un FLAC deguise en WAV.
   */
  const extensionDe = (chemin: string | null) =>
    path.extname(chemin ?? '').toLowerCase() || '.wav';

  const musicLocal = path.join(workDir, `music${extensionDe(session.stem_music_path)}`);
  const voiceLocal = path.join(workDir, `voice${extensionDe(session.stem_voice_path)}`);
  const videoLocal = path.join(workDir, 'work.mp4');

  await storage.download(BUCKET_SOURCES, session.stem_music_path, musicLocal);
  await storage.download(BUCKET_SOURCES, session.stem_voice_path, voiceLocal);
  await storage.download(BUCKET_SOURCES, session.video_path, videoLocal);
  await setJobStep(job.id, 'fetch', 30);

  const takesDir = path.join(workDir, 'takes');
  await fs.mkdir(takesDir, { recursive: true });

  const usableTakes: { take: TakeRow; local: string; clip: ClipRow }[] = [];
  let fetched = 0;

  for (const take of takeRows) {
    const clip = clipRows.find((c) => c.id === take.clip_id);
    if (!clip) continue;

    // Un joueur exclu voit ses personnages repasser en VO : ses prises
    // sont ignorees, meme si elles existent encore (PRD §11.8).
    const participant = micOffsetOf.get(take.participant_id);
    if (!participant || participant.kicked) continue;
    if (releasedCharacters.has(clip.character_id)) continue;

    // L'extension de la prise telle qu'elle a ete envoyee : un iPhone
    // enregistre en MP4, et l'appeler `.webm` ne faisait que mentir.
    const local = path.join(takesDir, `${take.id}${path.extname(take.audio_path) || '.webm'}`);
    await storage.download(BUCKET_TAKES, take.audio_path, local);

    /*
     * Une prise vide ne vaut pas un rendu rate.
     *
     * Le navigateur rend parfois un WebM reduit a son entete, quelques
     * dizaines d'octets, quand le micro n'a rien capte. ffmpeg refuse ce
     * fichier et le rendu entier echoue sur un message que personne ne
     * peut relier a la prise fautive. On l'ecarte, on le dit dans les
     * logs, et la replique garde sa VO comme si elle n'avait pas ete
     * doublee.
     */
    const takeMs = await audioDurationMs(local);
    if (takeMs === null) {
      logger.warn('prise illisible, ignorée', {
        step: 'fetch',
        takeId: take.id,
        clipId: take.clip_id,
      });
      continue;
    }

    /*
     * Le pitch et la reverb, s'ils sont demandes.
     *
     * Ils se calculent ici et pas dans le graphe de mixage, avec le code
     * exact qui fait l'ecoute du studio (`lib/audio/voice-dsp.ts`) : ce
     * qu'on a regle a l'oreille est ce qui sort dans la video. La prise
     * est decodee, traitee, et reecrite a cote ; l'originale reste intacte.
     */
    const effets = { pitch: take.fx_pitch ?? 0, reverb: take.fx_reverb ?? 0 };
    let fichier = local;

    if (demandeTraitement(effets)) {
      try {
        const brut = path.join(takesDir, `${take.id}-brut.wav`);
        const traite = path.join(takesDir, `${take.id}-fx.wav`);
        await decodeTakeToWav(local, brut);
        const wav = await readWavMono(brut);
        const canaux = traiterVoix(Float32Array.from(wav.samples), wav.sampleRate, effets);
        await writeWav(traite, wav.sampleRate, canaux);
        fichier = traite;
      } catch (error) {
        // Un effet rate ne vaut pas un rendu perdu : la prise part
        // telle qu'elle a ete enregistree.
        logger.warn('effets impossibles, prise laissée brute', {
          step: 'fetch',
          takeId: take.id,
          detail: error instanceof Error ? error.message : String(error),
        });
      }
    }

    usableTakes.push({ take, local: fichier, clip });

    fetched += 1;
    await setJobStep(
      job.id,
      'fetch',
      30 + Math.round((fetched / Math.max(1, takeRows.length)) * 65),
    );
  }
  logger.info('éléments récupérés', { step: 'fetch', takes: usableTakes.length });

  // ── 2. Mixage ───────────────────────────────────────────────────────
  await setJobStep(job.id, 'mix', 0);

  // VO a conserver : les repliques des personnages liberes, plus toutes
  // les repliques que l'hote a supprimees — dans les deux cas, la voix
  // d'origine doit rester audible a cet endroit (PRD §9.2, §12.3).
  const voSegments: VoSegment[] = lineRows
    .filter((line) => line.is_deleted || releasedCharacters.has(line.character_id))
    .map((line) => ({ startMs: line.start_ms, endMs: line.end_ms }))
    .sort((a, b) => a.startMs - b.startMs);

  /*
   * D'ou vient le son la ou personne ne double.
   *
   * Le stem de voix separee servait a tout : c'est une reconstruction,
   * et elle s'entend. Or aux endroits qu'on ne remplace pas, l'original
   * est disponible, intact et gratuit. On le prend donc lui, et on coupe
   * le lit musical pendant ces passages pour ne pas entendre la musique
   * deux fois.
   *
   * Le stem de voix ne sert plus qu'au calage cote client. Il reste
   * telecharge parce qu'il part dans le pack quand l'hote garde la
   * scene.
   */
  const inputs = [musicLocal];
  const voiceInput = voSegments.length > 0 ? inputs.push(videoLocal) - 1 : null;

  /*
   * Le niveau de chaque prise, aligne sur la voix qu'elle remplace.
   *
   * Un joueur qui parle a trente centimetres du micro et un autre qui le
   * mange n'arrivent pas au meme volume, et le mixage les posait tels
   * quels : l'un passait sous la musique, l'autre ecrasait la scene. On
   * mesure donc ce que faisait la voix d'origine a cet endroit precis,
   * ce que fait la prise, et on comble l'ecart.
   *
   * La correction est bornee a douze decibels dans chaque sens. Au-dela,
   * c'est que la mesure s'est trompee — un fou rire hors micro, un
   * passage ou l'acteur chuchote — et forcer ferait pire.
   */
  const CORRECTION_MAX_DB = 12;
  const placements: ReturnType<typeof placeTake>[] = [];

  for (const { take, local, clip } of usableTakes) {
    const index = inputs.push(local) - 1;
    const reglages = micOffsetOf.get(take.participant_id);

    const [origine, prise] = await Promise.all([
      meanVolumeDb(voiceLocal, clip.speech_start_ms, clip.speech_end_ms),
      meanVolumeDb(local),
    ]);
    const correction =
      origine !== null && prise !== null
        ? Math.max(-CORRECTION_MAX_DB, Math.min(CORRECTION_MAX_DB, origine - prise))
        : 0;
    // Le gain choisi dans la console s'ajoute a la correction : il part du
    // niveau deja aligne, comme a l'ecoute dans le studio.
    const gainDb = correction + (Number(take.gain_db ?? 0) || 0);

    placements.push(
      placeTake(
        clip.window_start_ms,
        take.offset_ms,
        // Le reglage de la prise s'ajoute au retard de base : celui-ci
        // compense la latence de capture, que personne ne sait juger a
        // l'oreille, et l'autre corrige ce qui reste. Une prise d'avant
        // les reglages par prise retombe sur celui du joueur.
        (take.mic_offset_ms ?? reglages?.offset ?? 0) + MIC_OFFSET_BASELINE_MS,
        index,
        { gainDb },
      ),
    );
  }

  const durationMs = session.duration_ms ?? 0;
  const mixPath = path.join(workDir, 'mix.wav');

  if (placements.length === 0) {
    /*
     * Personne n'a double quoi que ce soit.
     *
     * Rien a remplacer, donc rien a reconstruire : on garde la bande
     * son d'origine telle quelle. La recomposer a partir des stems
     * aurait coute une generation de qualite pour rendre exactement ce
     * qu'on avait deja.
     */
    await extractAudio(videoLocal, mixPath);
    await setJobStep(job.id, 'mix', 100);
    logger.info('aucune prise : bande son d’origine conservée', { step: 'mix' });
  } else {
    const graph = buildMixGraph({
      musicInput: 0,
      voiceInput,
      voSegments,
      takes: placements,
    });

    await mixWithGraph(
      inputs,
      graph,
      graphPathFor(workDir),
      mixPath,
      durationMs,
      (pct) => void setJobStep(job.id, 'mix', pct).catch(() => undefined),
    );
    logger.info('mixage terminé', {
      step: 'mix',
      inputs: inputs.length,
      voSegments: voSegments.length,
    });
  }

  // ── 3. Mux final ────────────────────────────────────────────────────
  // La video est copiee sans reencodage, et aucun sous-titre n'est
  // incruste : le MP4 ne contient que l'image d'origine et l'audio
  // remixe (PRD §12.4, §12.5).
  await setJobStep(job.id, 'mux', 0);
  const finalPath = path.join(workDir, 'final.mp4');
  await muxFinal(
    videoLocal,
    mixPath,
    finalPath,
    durationMs,
    (pct) => void setJobStep(job.id, 'mux', pct).catch(() => undefined),
  );

  // ── 4. Envoi ────────────────────────────────────────────────────────
  await setJobStep(job.id, 'upload', 0);
  const renderPath = `${session.id}/final.mp4`;
  await storage.upload(BUCKET_RENDERS, renderPath, finalPath, 'video/mp4');

  const size = await storage.verifyUploaded(BUCKET_RENDERS, renderPath);
  await updateSession(session.id, {
    render_path: renderPath,
    render_size_bytes: size,
  });

  await setJobStep(job.id, 'upload', 100);
  logger.info('rendu envoyé', { step: 'upload', bytes: size });

  // ── 5. Conservation puis purge (PRD §13.1, §16.2) ───────────────────
  // Seulement maintenant : l'upload du rendu est confirme, taille non nulle.
  await setJobStep(job.id, 'purge', 0);

  // Si l'hote a demande a garder la scene, on la depose sous `packs/`
  // AVANT de purger — les fichiers sont encore la, sur le disque local.
  // Une scene deja issue d'un pack n'en refabrique pas un second.
  if (session.keep_as_pack && !session.from_pack_id) {
    try {
      await buildPack(session, logger);
    } catch (error) {
      // Le rendu est deja en securite : rater la conservation ne doit pas
      // faire echouer un job qui a abouti.
      logger.warn('conservation en communauté échouée', {
        step: 'purge',
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }
  /*
   * Les sources et les prises restent jusqu'a l'echeance du rendu.
   *
   * Tant que la video est la, le groupe peut redoubler la scene sans rien
   * reconstruire, et l'hote peut la publier avec son son. La fonction
   * `purger-rendus` efface tout ensemble a l'heure dite : rendu, video,
   * pistes et prises.
   */
  await updateSession(session.id, { status: 'done' });
  await setJobStep(job.id, 'purge', 100);

  logger.info('rendu terminé, sources gardées jusqu’à l’échéance', { step: 'purge' });
}
