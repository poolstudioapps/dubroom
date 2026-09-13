import { SystemError } from '../errors.ts';
import { db, type Session } from '../lib/db.ts';
import type { ScopedLog } from '../log.ts';

/**
 * Fabrique une scene preparee reutilisable (PRD §16.2).
 *
 * Un pack est une RECETTE : l'adresse de la video, plus le travail de
 * preparation — decoupage, personnages, texte corrige a la main. Jamais
 * une copie de l'oeuvre. Quelques kilo-octets la ou une copie en pesait
 * treize mega.
 *
 * Ce choix n'est pas qu'une affaire de place. Rejouer un pack
 * retelecharge la video depuis sa source ; c'est l'utilisateur qui va la
 * chercher, comme il le ferait a la main, et nos serveurs ne
 * redistribuent rien.
 *
 * Le moment est choisi : on le fait pendant le job de rendu, juste avant
 * la purge, parce que la preparation est encore en base et qu'un job
 * separe la relirait pour rien.
 *
 * Les prises des joueurs ne sont jamais copiees. Un pack contient la
 * scene et sa preparation, pas ce que quelqu'un a enregistre.
 */
export async function buildPack(session: Session, logger: ScopedLog): Promise<void> {
  /*
   * Sans adresse, pas de pack.
   *
   * La base refuse deja de marquer une scene importee comme publiable,
   * et le formulaire ne propose plus la case. Ce garde-fou est le
   * troisieme : une session creee avant la regle pourrait encore porter
   * l'ancien drapeau, et il vaut mieux l'ignorer en silence que publier
   * une recette qui ne menerait nulle part.
   */
  if (session.source_type !== 'youtube' || !session.source_ref) {
    logger.warn('pack ignoré : la scène ne vient pas d’un lien', { step: 'purge' });
    return;
  }

  const [characters, lines] = await Promise.all([
    db
      .from('characters')
      .select('id, speaker_key, name, color, sort_order')
      .eq('session_id', session.id)
      .order('sort_order'),
    db
      .from('lines')
      .select('character_id, start_ms, end_ms, text, words, is_deleted')
      .eq('session_id', session.id)
      .order('start_ms'),
  ]);

  if (characters.error || lines.error) {
    throw new SystemError(
      `Lecture de la preparation impossible : ${(characters.error ?? lines.error)?.message}`,
    );
  }
  if ((characters.data ?? []).length === 0) {
    logger.warn('pack ignoré : aucun personnage', { step: 'purge' });
    return;
  }

  const { data: pack, error: packError } = await db
    .from('packs')
    .insert({
      created_by: session.host_id,
      title: session.title ?? 'Scène sans titre',
      duration_ms: session.duration_ms ?? 0,
      kind: 'url',
      source_url: session.source_ref,
      source_session_id: session.id,
      voice_peaks: session.voice_peaks,
      voice_peaks_hz: session.voice_peaks_hz,
      character_count: (characters.data ?? []).length,
      line_count: (lines.data ?? []).filter((l) => !l.is_deleted).length,
    })
    .select('id')
    .single();

  if (packError || !pack) {
    throw new SystemError(`Creation du pack impossible : ${packError?.message}`);
  }

  const packId = pack.id as string;

  // Personnages, puis repliques rattachees par leur cle de locuteur.
  const { data: packChars, error: charError } = await db
    .from('pack_characters')
    .insert(
      (characters.data ?? []).map((c) => ({
        pack_id: packId,
        speaker_key: c.speaker_key,
        name: c.name,
        color: c.color,
        sort_order: c.sort_order,
      })),
    )
    .select('id, speaker_key');
  if (charError) {
    throw new SystemError(`Copie des personnages impossible : ${charError.message}`);
  }

  const bySourceId = new Map(
    (characters.data ?? []).map((c) => [c.id as string, c.speaker_key as string]),
  );
  const byKey = new Map(
    (packChars ?? []).map((c) => [c.speaker_key as string, c.id as string]),
  );

  const rows = (lines.data ?? [])
    .map((l) => {
      const key = bySourceId.get(l.character_id as string);
      const target = key ? byKey.get(key) : undefined;
      return target
        ? {
            pack_id: packId,
            pack_character_id: target,
            start_ms: l.start_ms,
            end_ms: l.end_ms,
            text: l.text,
            words: l.words,
            is_deleted: l.is_deleted,
          }
        : null;
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  if (rows.length > 0) {
    const { error: lineError } = await db.from('pack_lines').insert(rows);
    if (lineError) {
      throw new SystemError(`Copie des repliques impossible : ${lineError.message}`);
    }
  }

  // La scene sait desormais qu'elle a ete publiee : l'ecran de resultat
  // affiche un lien vers le pack au lieu de reproposer la publication.
  await db.from('sessions').update({ published_pack_id: packId }).eq('id', session.id);

  logger.info('scène conservée dans la communauté', {
    step: 'purge',
    packId,
    repliques: rows.length,
  });
}
