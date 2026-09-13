-- Repliques a plusieurs voix.
--
-- Une replique dite par plusieurs personnages en meme temps est recopiee
-- pour chacun, aux memes bornes. Clips, studio, rendu et packs continuent
-- de ne connaitre qu'un personnage par ligne : chaque joueur double sa
-- copie, et les prises se superposent au mixage. Seules les operations qui
-- portent sur « la replique » elle-meme — son texte, sa suppression, sa
-- restauration — agissent sur toutes ses copies ; l'ecran de preparation
-- les regroupe par bornes. Deux repliques distinctes ne tombent jamais a
-- la milliseconde pres sur les memes bornes.

-- ── Les clips : les doublons exacts disparaissent d'abord ────────────────

create or replace function public.recompute_clips(p_session_id uuid, p_gap_ms integer, p_margin_ms integer, p_max_ms integer default 15000)
 returns integer
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
declare
  v_duration int;
  v_count int;
begin
  select duration_ms into v_duration from sessions where id = p_session_id;

  -- Deux copies d'une meme replique pour un meme personnage — apres une
  -- fusion de personnages, ou une reattribution vers une voix deja
  -- presente — n'en font qu'une : on garde celle qui est encore a doubler,
  -- sinon la plus ancienne.
  delete from lines a
  using lines b
  where a.session_id = p_session_id
    and b.session_id = p_session_id
    and a.id <> b.id
    and a.character_id = b.character_id
    and a.start_ms = b.start_ms
    and a.end_ms = b.end_ms
    and (
      (a.is_deleted and not b.is_deleted)
      or (a.is_deleted = b.is_deleted and (a.created_at, a.id::text) > (b.created_at, b.id::text))
    );

  delete from clips where session_id = p_session_id;

  with recursive ordered as (
    select
      l.id,
      l.character_id,
      l.start_ms,
      l.end_ms,
      row_number() over (
        partition by l.character_id order by l.start_ms, l.id
      ) as rn
    from lines l
    where l.session_id = p_session_id
      and l.is_deleted = false
  ),
  walk as (
    -- La premiere replique de chaque personnage ouvre son premier clip.
    select
      o.id, o.character_id, o.start_ms, o.end_ms, o.rn,
      1 as grp,
      o.start_ms as grp_start
    from ordered o
    where o.rn = 1

    union all

    -- Les suivantes rejoignent le groupe courant, sauf si un silence les
    -- en separe ou si le groupe est deja assez long comme ca.
    select
      o.id, o.character_id, o.start_ms, o.end_ms, o.rn,
      case
        when o.start_ms - w.end_ms >= p_gap_ms then w.grp + 1
        when o.end_ms - w.grp_start > p_max_ms then w.grp + 1
        else w.grp
      end,
      case
        when o.start_ms - w.end_ms >= p_gap_ms then o.start_ms
        when o.end_ms - w.grp_start > p_max_ms then o.start_ms
        else w.grp_start
      end
    from ordered o
    join walk w
      on w.character_id = o.character_id
     and o.rn = w.rn + 1
  ),
  clustered as (
    select
      character_id,
      grp,
      min(start_ms) as speech_start_ms,
      max(end_ms) as speech_end_ms,
      array_agg(id order by start_ms, id) as line_ids
    from walk
    group by character_id, grp
  )
  insert into clips (
    session_id, character_id, idx,
    window_start_ms, window_end_ms,
    speech_start_ms, speech_end_ms, line_ids
  )
  select
    p_session_id,
    character_id,
    (row_number() over (
      partition by character_id order by speech_start_ms
    ))::int - 1,
    greatest(0, speech_start_ms - p_margin_ms),
    case
      when v_duration is null or v_duration <= 0 then speech_end_ms + p_margin_ms
      else least(v_duration, speech_end_ms + p_margin_ms)
    end,
    speech_start_ms,
    speech_end_ms,
    line_ids
  from clustered;

  get diagnostics v_count = row_count;
  return v_count;
end;
$function$;

-- ── Supprimer et retablir : toutes les voix a la fois ────────────────────

create or replace function public.prep_delete_lines(p_line_ids uuid[], p_gap_ms integer, p_margin_ms integer, p_max_ms integer default 15000)
 returns integer
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
declare
  v_session uuid;
  v_count int;
begin
  select distinct session_id into v_session
  from lines where id = any (p_line_ids);
  if v_session is null then
    return 0;
  end if;
  perform app_assert_prepping(v_session);

  -- Marquage, pas suppression : la VO de cette replique sera reinjectee
  -- au mixage, ce qui suppose de connaitre encore ses bornes (PRD §12.3).
  -- Une replique a plusieurs voix se supprime entiere : une copie encore
  -- a doubler garderait sa prise par-dessus la VO revenue.
  update lines l set is_deleted = true
  where l.session_id = v_session
    and (l.start_ms, l.end_ms) in (
      select start_ms, end_ms from lines where id = any (p_line_ids)
    );
  get diagnostics v_count = row_count;

  perform recompute_clips(v_session, p_gap_ms, p_margin_ms, p_max_ms);
  return v_count;
end;
$function$;

create or replace function public.prep_restore_lines(p_line_ids uuid[], p_gap_ms integer, p_margin_ms integer, p_max_ms integer default 15000)
 returns integer
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
declare
  v_session uuid;
  v_count int;
begin
  select distinct session_id into v_session
  from lines where id = any (p_line_ids);
  if v_session is null then
    return 0;
  end if;
  perform app_assert_prepping(v_session);

  update lines l set is_deleted = false
  where l.session_id = v_session
    and (l.start_ms, l.end_ms) in (
      select start_ms, end_ms from lines where id = any (p_line_ids)
    );
  get diagnostics v_count = row_count;

  perform recompute_clips(v_session, p_gap_ms, p_margin_ms, p_max_ms);
  return v_count;
end;
$function$;

-- ── Le texte : le meme pour toutes les voix ──────────────────────────────

create or replace function public.prep_update_line_text(p_line_id uuid, p_text text)
 returns lines
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
declare
  v_line lines;
begin
  select * into v_line from lines where id = p_line_id;
  if not found then
    raise exception 'LINE_NOT_FOUND' using errcode = 'P0002';
  end if;
  perform app_assert_prepping(v_line.session_id);

  update lines set text = p_text
  where session_id = v_line.session_id
    and start_ms = v_line.start_ms
    and end_ms = v_line.end_ms;

  select * into v_line from lines where id = p_line_id;
  return v_line;
end;
$function$;

-- ── Ajouter et retirer une voix ──────────────────────────────────────────

create or replace function public.prep_add_line_character(p_line_id uuid, p_character_id uuid, p_gap_ms integer, p_margin_ms integer, p_max_ms integer default 15000)
 returns lines
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
declare
  v_line lines;
  v_copie lines;
begin
  select * into v_line from lines where id = p_line_id;
  if not found then
    raise exception 'LINE_NOT_FOUND' using errcode = 'P0002';
  end if;
  perform app_assert_prepping(v_line.session_id);

  if not exists (
    select 1 from characters
    where id = p_character_id and session_id = v_line.session_id
  ) then
    raise exception 'CROSS_SESSION' using errcode = 'P0001';
  end if;

  -- Deja dite par ce personnage : rien a ajouter.
  select * into v_copie from lines
  where session_id = v_line.session_id
    and character_id = p_character_id
    and start_ms = v_line.start_ms
    and end_ms = v_line.end_ms
  limit 1;
  if found then
    return v_copie;
  end if;

  insert into lines (session_id, character_id, start_ms, end_ms, text, words, is_deleted)
  values (
    v_line.session_id, p_character_id, v_line.start_ms, v_line.end_ms,
    v_line.text, v_line.words, v_line.is_deleted
  )
  returning * into v_copie;

  perform recompute_clips(v_line.session_id, p_gap_ms, p_margin_ms, p_max_ms);
  return v_copie;
end;
$function$;

create or replace function public.prep_remove_line_character(p_line_id uuid, p_gap_ms integer, p_margin_ms integer, p_max_ms integer default 15000)
 returns integer
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
declare
  v_line lines;
begin
  select * into v_line from lines where id = p_line_id;
  if not found then
    return 0;
  end if;
  perform app_assert_prepping(v_line.session_id);

  -- La derniere voix ne se retire pas : ce serait supprimer la replique
  -- sans garder sa VO. Pour ca, il y a la suppression.
  if not exists (
    select 1 from lines
    where session_id = v_line.session_id
      and id <> v_line.id
      and start_ms = v_line.start_ms
      and end_ms = v_line.end_ms
  ) then
    raise exception 'LAST_VOICE' using errcode = 'P0001';
  end if;

  delete from lines where id = p_line_id;

  perform recompute_clips(v_line.session_id, p_gap_ms, p_margin_ms, p_max_ms);
  return 1;
end;
$function$;

grant execute on function public.prep_add_line_character(uuid, uuid, integer, integer, integer) to anon, authenticated, service_role;
grant execute on function public.prep_remove_line_character(uuid, integer, integer, integer) to anon, authenticated, service_role;

-- ── Le pack : une replique a plusieurs voix se compte une fois ───────────

create or replace function public.publish_recipe_pack(p_session_id uuid, p_title text, p_source_lang text, p_genre text, p_tags text[] default '{}'::text[], p_source_url text default null::text)
 returns uuid
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
declare
  v_session sessions;
  v_pack_id uuid;
  v_characters int;
  v_title text := nullif(btrim(coalesce(p_title, '')), '');
  v_lang text := lower(btrim(coalesce(p_source_lang, '')));
  v_url text := nullif(btrim(coalesce(p_source_url, '')), '');
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
  if v_session.from_pack_id is not null then
    raise exception 'ALREADY_IN_CATALOGUE' using errcode = 'P0001';
  end if;

  -- Le lien : celui qu'on vient de saisir, sinon celui de la fiche de
  -- depart, sinon celui de la video YouTube importee.
  v_url := coalesce(
    v_url,
    nullif(btrim(v_session.pack_draft ->> 'source_url'), ''),
    case when v_session.source_type = 'youtube' then v_session.source_ref end
  );

  if v_title is null then
    raise exception 'PACK_TITLE_REQUIRED' using errcode = 'P0001';
  end if;
  if v_lang !~ '^[a-z]{2}$' then
    raise exception 'PACK_LANG_REQUIRED' using errcode = 'P0001';
  end if;
  if not app_genre_valide(p_genre) then
    raise exception 'PACK_GENRE_REQUIRED' using errcode = 'P0001';
  end if;
  if not app_lien_valide(v_url) then
    raise exception 'PACK_URL_REQUIRED' using errcode = 'P0001';
  end if;

  select count(*) into v_characters
  from characters where session_id = p_session_id;
  if v_characters = 0 then
    raise exception 'NOTHING_TO_PUBLISH' using errcode = 'P0001';
  end if;

  insert into packs (
    created_by, title, duration_ms, kind, source_url, source_session_id,
    voice_peaks, voice_peaks_hz, character_count, line_count,
    source_lang, genre, tags
  )
  values (
    auth.uid(),
    left(v_title, 120),
    coalesce(v_session.duration_ms, 0),
    'url',
    v_url,
    v_session.id,
    v_session.voice_peaks,
    v_session.voice_peaks_hz,
    v_characters,
    (select count(distinct (start_ms, end_ms)) from lines
     where session_id = p_session_id and not is_deleted),
    v_lang,
    p_genre::pack_genre,
    app_normaliser_tags(p_tags)
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
$function$;
