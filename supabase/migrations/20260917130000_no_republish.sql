-- Dub’Up — une scene deja publiee ne se republie pas.
--
-- Jouer une scene du catalogue produit une session ordinaire, qui se
-- termine par un ecran de resultat proposant de publier. Rien
-- n'empechait donc de renvoyer au catalogue ce qu'on venait d'y prendre,
-- a l'identique : meme lien, meme decoupage, memes personnages. Au
-- troisieme groupe qui rejoue la scene, le catalogue en contient quatre
-- exemplaires et plus personne ne sait laquelle choisir.
--
-- Le garde-fou existait deja cote worker pour la conservation
-- automatique (`keep_as_pack`), mais pas ici, ou la publication est
-- manuelle et posterieure au rendu.
--
-- L'ancienne signature a deux arguments dort encore en base, laissee par
-- une version precedente. Elle ne connait ni la langue ni le genre, plus
-- personne ne l'appelle, et elle offrirait un chemin de contournement :
-- elle disparait.

drop function if exists publish_recipe_pack(uuid, text);

create or replace function publish_recipe_pack(
  p_session_id uuid,
  p_title text default null,
  p_source_lang text default null,
  p_genre text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session sessions;
  v_pack_id uuid;
  v_characters int;
begin
  select * into v_session from sessions where id = p_session_id;
  if not found then
    raise exception 'SESSION_NOT_FOUND' using errcode = 'P0002';
  end if;
  if not app_is_host(p_session_id) then
    raise exception 'HOST_ONLY' using errcode = 'P0001';
  end if;
  if v_session.published_pack_id is not null then
    raise exception 'ALREADY_PUBLISHED' using errcode = 'P0001';
  end if;

  -- La scene vient du catalogue : elle y figure deja.
  if v_session.from_pack_id is not null then
    raise exception 'ALREADY_IN_CATALOGUE' using errcode = 'P0001';
  end if;

  if v_session.source_ref is null then
    raise exception 'NO_SOURCE_URL' using errcode = 'P0001';
  end if;

  select count(*) into v_characters
  from characters where session_id = p_session_id;
  if v_characters = 0 then
    raise exception 'NOTHING_TO_PUBLISH' using errcode = 'P0001';
  end if;

  insert into packs (
    created_by, title, duration_ms, kind, source_url, source_session_id,
    voice_peaks, voice_peaks_hz, character_count, line_count,
    source_lang, genre
  )
  values (
    auth.uid(),
    coalesce(nullif(btrim(coalesce(p_title, '')), ''), v_session.title, 'Scène sans titre'),
    coalesce(v_session.duration_ms, 0),
    'url',
    v_session.source_ref,
    v_session.id,
    v_session.voice_peaks,
    v_session.voice_peaks_hz,
    v_characters,
    (select count(*) from lines where session_id = p_session_id and not is_deleted),
    nullif(lower(coalesce(p_source_lang, '')), ''),
    coalesce(nullif(p_genre, '')::pack_genre, 'autre')
  )
  returning id into v_pack_id;

  with copied as (
    insert into pack_characters (pack_id, speaker_key, name, color, sort_order)
    select v_pack_id, c.speaker_key, c.name, c.color, c.sort_order
    from characters c
    where c.session_id = p_session_id
    returning id, speaker_key
  )
  insert into pack_lines (
    pack_id, pack_character_id, start_ms, end_ms, text, words, is_deleted
  )
  select v_pack_id, copied.id, l.start_ms, l.end_ms, l.text, l.words, l.is_deleted
  from lines l
  join characters c on c.id = l.character_id
  join copied on copied.speaker_key = c.speaker_key
  where l.session_id = p_session_id;

  update sessions set published_pack_id = v_pack_id where id = p_session_id;

  return v_pack_id;
end;
$$;

revoke execute on function publish_recipe_pack(uuid, text, text, text) from public;
grant execute on function publish_recipe_pack(uuid, text, text, text)
  to authenticated, service_role;
