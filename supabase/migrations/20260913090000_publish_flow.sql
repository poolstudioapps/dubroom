-- DubRoom — publier une scene dans la communaute.
--
-- Trois moments possibles, et ils ne se valent pas :
--
--  1. A LA CREATION. L'hote sait deja qu'il prepare une scene destinee a
--     etre partagee. C'est le seul moment qui garantit tout.
--  2. PENDANT LA PARTIE. Meme effet : la decision precede le rendu.
--  3. APRES LE RENDU. La purge est passee, les medias n'existent plus.
--     Verifie sur une scene rendue : le LIEN et toute la PREPARATION
--     survivent (personnages, repliques, mots horodates) ; la video, les
--     stems et l'enveloppe, non.
--
-- Il en decoule une regle simple, qu'il faut dire a l'utilisateur plutot
-- que de la lui faire deviner :
--   - scene venue d'un LIEN  -> publiable a tout moment, meme apres coup,
--     puisqu'une recette ne contient que le lien et la preparation ;
--   - scene venue d'un FICHIER -> la decision doit etre prise avant le
--     rendu, sans quoi les medias sont deja perdus.

alter table sessions
  add column published_pack_id uuid references packs (id) on delete set null;

comment on column sessions.published_pack_id is
  'Pack issu de cette scene, si elle a ete publiee dans la communaute.';

-- Le worker renseigne cette colonne pour les packs `media`.
alter table packs
  add column source_session_id uuid references sessions (id) on delete set null;

/**
 * Publie une scene venue d'un lien, sous forme de recette.
 *
 * Ne demande aucun fichier : c'est precisement ce qui permet de le faire
 * apres le rendu, une fois la source purgee. Le decoupage est recopie
 * tel que l'hote l'a corrige — c'est la valeur du pack.
 */
create or replace function publish_recipe_pack(
  p_session_id uuid,
  p_title text default null
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
  if v_session.source_ref is null then
    -- Une scene importee depuis un fichier n'a pas de lien : sans media
    -- conserve, il n'y a plus rien a publier.
    raise exception 'NO_SOURCE_URL' using errcode = 'P0001';
  end if;

  select count(*) into v_characters
  from characters where session_id = p_session_id;
  if v_characters = 0 then
    raise exception 'NOTHING_TO_PUBLISH' using errcode = 'P0001';
  end if;

  insert into packs (
    created_by, title, duration_ms, kind, source_url, source_session_id,
    voice_peaks, voice_peaks_hz, character_count, line_count
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
    (select count(*) from lines where session_id = p_session_id and not is_deleted)
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

/** L'intention de partager peut etre posee des la creation de la scene. */
drop function if exists create_session(text, text, text, text, text);

create function create_session(
  p_code text,
  p_title text,
  p_source_type text,
  p_source_ref text,
  p_display_name text,
  p_keep_as_pack boolean default false
)
returns sessions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session sessions;
begin
  if not app_is_allowed() then
    raise exception 'NOT_ALLOWED' using errcode = 'P0001';
  end if;

  insert into sessions (
    code, host_id, title, source_type, source_ref, status, keep_as_pack
  )
  values (
    upper(p_code), auth.uid(), nullif(p_title, ''), p_source_type,
    nullif(p_source_ref, ''), 'draft', coalesce(p_keep_as_pack, false)
  )
  returning * into v_session;

  insert into participants (session_id, user_id, display_name, is_host)
  values (v_session.id, auth.uid(), p_display_name, true);

  return v_session;
end;
$$;
