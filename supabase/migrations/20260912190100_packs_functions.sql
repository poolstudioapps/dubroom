-- Dub’Up — operations sur les scenes preparees.

/** L'hote decide, pendant l'enregistrement, si la scene sera conservee. */
create or replace function set_keep_as_pack(p_session_id uuid, p_keep boolean)
returns sessions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session sessions;
begin
  if not app_is_host(p_session_id) then
    raise exception 'HOST_ONLY' using errcode = 'P0001';
  end if;
  -- Apres le rendu il est trop tard : les fichiers sont purges.
  perform app_assert_status(
    p_session_id,
    array['prepping', 'lobby', 'recording']::session_status[]
  );

  update sessions set keep_as_pack = p_keep where id = p_session_id
  returning * into v_session;
  return v_session;
end;
$$;

/** Le catalogue, avec de quoi l'afficher sans requete supplementaire. */
create or replace function list_packs()
returns table (
  id uuid,
  title text,
  description text,
  duration_ms int,
  character_count int,
  line_count int,
  size_bytes bigint,
  created_at timestamptz,
  is_mine boolean,
  characters jsonb
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not app_is_allowed() then
    raise exception 'NOT_ALLOWED' using errcode = 'P0001';
  end if;

  return query
  select
    p.id, p.title, p.description, p.duration_ms,
    p.character_count, p.line_count, p.size_bytes, p.created_at,
    p.created_by = auth.uid(),
    coalesce(
      (
        select jsonb_agg(
                 jsonb_build_object('name', c.name, 'color', c.color)
                 order by c.sort_order
               )
        from pack_characters c where c.pack_id = p.id
      ),
      '[]'::jsonb
    )
  from packs p
  order by p.created_at desc;
end;
$$;

/**
 * Demarre une scene depuis un pack.
 *
 * La session pointe vers les FICHIERS DU PACK, pas vers une copie : rien
 * n'est duplique dans Storage, et la purge de fin de rendu ne balaie que
 * `{session_id}/`, donc elle ne peut pas emporter le pack. Plusieurs
 * groupes peuvent rejouer la meme scene en parallele sans se marcher
 * dessus.
 *
 * La scene arrive directement en lobby : la preparation a deja ete faite
 * une fois, c'est tout l'interet.
 */
create or replace function start_from_pack(
  p_pack_id uuid,
  p_code text,
  p_display_name text,
  p_gap_ms int,
  p_margin_ms int
)
returns sessions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_pack packs;
  v_session sessions;
begin
  if not app_is_allowed() then
    raise exception 'NOT_ALLOWED' using errcode = 'P0001';
  end if;

  select * into v_pack from packs where id = p_pack_id;
  if not found then
    raise exception 'PACK_NOT_FOUND' using errcode = 'P0002';
  end if;

  insert into sessions (
    code, host_id, title, status, source_type, from_pack_id,
    video_path, stem_voice_path, stem_music_path, stem_music_preview_path,
    voice_peaks, voice_peaks_hz, duration_ms
  )
  values (
    upper(p_code), auth.uid(), v_pack.title, 'lobby', 'pack', v_pack.id,
    v_pack.video_path, v_pack.stem_voice_path, v_pack.stem_music_path,
    v_pack.stem_music_path,
    v_pack.voice_peaks, v_pack.voice_peaks_hz, v_pack.duration_ms
  )
  returning * into v_session;

  insert into participants (session_id, user_id, display_name, is_host)
  values (v_session.id, auth.uid(), p_display_name, true);

  -- Personnages puis repliques, en gardant la correspondance.
  with copied as (
    insert into characters (session_id, speaker_key, name, color, sort_order)
    select v_session.id, c.speaker_key, c.name, c.color, c.sort_order
    from pack_characters c
    where c.pack_id = v_pack.id
    returning id, speaker_key
  )
  insert into lines (session_id, character_id, start_ms, end_ms, text, words, is_deleted)
  select v_session.id, copied.id, l.start_ms, l.end_ms, l.text, l.words, l.is_deleted
  from pack_lines l
  join pack_characters pc on pc.id = l.pack_character_id
  join copied on copied.speaker_key = pc.speaker_key
  where l.pack_id = v_pack.id;

  perform recompute_clips(v_session.id, p_gap_ms, p_margin_ms);

  return v_session;
end;
$$;

/** Retire un pack du catalogue. Les fichiers sont effaces cote client. */
create or replace function delete_pack(p_pack_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from packs where id = p_pack_id and created_by = auth.uid()
  ) then
    raise exception 'PACK_FORBIDDEN' using errcode = 'P0001';
  end if;

  delete from packs where id = p_pack_id;
end;
$$;

grant execute on function list_packs() to authenticated;
