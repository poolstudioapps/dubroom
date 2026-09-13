-- Dub'Up — la longueur maximale d'un clip, jusqu'au bout.
--
-- La migration `clip_length` a donne a `recompute_clips` un troisieme
-- critere, `p_max_ms` : au-dela de quinze secondes de parole, la replique
-- suivante ouvre un nouveau clip. Le site s'est mis a l'envoyer a toutes
-- les fonctions qui redecoupent la scene. Mais ces sept-la n'avaient pas
-- ete mises a jour : PostgREST, qui choisit une fonction d'apres les noms
-- des parametres recus, n'en trouvait aucune. Ouvrir le lobby, et toute
-- correction de l'ecran de preparation, echouaient avec « Could not find
-- the function ... in the schema cache ».
--
-- Chaque fonction garde exactement son corps. Elle recoit `p_max_ms`, avec
-- la meme valeur par defaut que `recompute_clips`, et le lui transmet.
-- L'ancienne signature est supprimee : laissee a cote de la nouvelle, un
-- appel sans `p_max_ms` ne saurait plus laquelle choisir.
--
-- Genere depuis les definitions en production, pour ne rien reecrire a la
-- main.

begin;

-- ── open_lobby ──
drop function if exists public.open_lobby(uuid,integer,integer);

CREATE OR REPLACE FUNCTION public.open_lobby(p_session_id uuid, p_gap_ms integer, p_margin_ms integer, p_max_ms integer DEFAULT 15000)
 RETURNS sessions
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_session sessions;
begin
  if not app_is_host(p_session_id) then
    raise exception 'HOST_ONLY' using errcode = 'P0001';
  end if;
  perform app_assert_status(p_session_id, array['prepping']::session_status[]);

  -- Dernier recalcul avant verrouillage : au-dela, plus rien ne bouge.
  perform recompute_clips(p_session_id, p_gap_ms, p_margin_ms, p_max_ms);

  update sessions set status = 'lobby' where id = p_session_id
  returning * into v_session;
  return v_session;
end;
$function$;

grant execute on function public.open_lobby(uuid,integer,integer,integer) to anon, authenticated, service_role;

-- ── prep_delete_character ──
drop function if exists public.prep_delete_character(uuid,integer,integer);

CREATE OR REPLACE FUNCTION public.prep_delete_character(p_character_id uuid, p_gap_ms integer, p_margin_ms integer, p_max_ms integer DEFAULT 15000)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_char characters;
begin
  select * into v_char from characters where id = p_character_id;
  if not found then
    return;
  end if;
  perform app_assert_prepping(v_char.session_id);

  delete from characters where id = p_character_id;
  perform recompute_clips(v_char.session_id, p_gap_ms, p_margin_ms, p_max_ms);
end;
$function$;

grant execute on function public.prep_delete_character(uuid,integer,integer,integer) to anon, authenticated, service_role;

-- ── prep_delete_lines ──
drop function if exists public.prep_delete_lines(uuid[],integer,integer);

CREATE OR REPLACE FUNCTION public.prep_delete_lines(p_line_ids uuid[], p_gap_ms integer, p_margin_ms integer, p_max_ms integer DEFAULT 15000)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
  update lines set is_deleted = true where id = any (p_line_ids);
  get diagnostics v_count = row_count;

  perform recompute_clips(v_session, p_gap_ms, p_margin_ms, p_max_ms);
  return v_count;
end;
$function$;

grant execute on function public.prep_delete_lines(uuid[],integer,integer,integer) to anon, authenticated, service_role;

-- ── prep_merge_characters ──
drop function if exists public.prep_merge_characters(uuid[],uuid,integer,integer);

CREATE OR REPLACE FUNCTION public.prep_merge_characters(p_source_ids uuid[], p_target_id uuid, p_gap_ms integer, p_margin_ms integer, p_max_ms integer DEFAULT 15000)
 RETURNS characters
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_session uuid;
  v_target characters;
begin
  select * into v_target from characters where id = p_target_id;
  if not found then
    raise exception 'CHARACTER_NOT_FOUND' using errcode = 'P0002';
  end if;
  v_session := v_target.session_id;
  perform app_assert_prepping(v_session);

  if exists (
    select 1 from characters
    where id = any (p_source_ids) and session_id <> v_session
  ) then
    raise exception 'CROSS_SESSION' using errcode = 'P0001';
  end if;

  update lines
  set character_id = p_target_id
  where session_id = v_session
    and character_id = any (p_source_ids)
    and character_id <> p_target_id;

  delete from characters
  where session_id = v_session
    and id = any (p_source_ids)
    and id <> p_target_id;

  perform recompute_clips(v_session, p_gap_ms, p_margin_ms, p_max_ms);
  return v_target;
end;
$function$;

grant execute on function public.prep_merge_characters(uuid[],uuid,integer,integer,integer) to anon, authenticated, service_role;

-- ── prep_reassign_lines ──
drop function if exists public.prep_reassign_lines(uuid[],uuid,integer,integer);

CREATE OR REPLACE FUNCTION public.prep_reassign_lines(p_line_ids uuid[], p_character_id uuid, p_gap_ms integer, p_margin_ms integer, p_max_ms integer DEFAULT 15000)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_session uuid;
  v_target_session uuid;
  v_count int;
begin
  select session_id into v_target_session
  from characters where id = p_character_id;
  if v_target_session is null then
    raise exception 'CHARACTER_NOT_FOUND' using errcode = 'P0002';
  end if;
  perform app_assert_prepping(v_target_session);

  select distinct session_id into v_session
  from lines where id = any (p_line_ids);
  if v_session is null or v_session <> v_target_session then
    raise exception 'CROSS_SESSION' using errcode = 'P0001';
  end if;

  update lines set character_id = p_character_id where id = any (p_line_ids);
  get diagnostics v_count = row_count;

  perform recompute_clips(v_target_session, p_gap_ms, p_margin_ms, p_max_ms);
  return v_count;
end;
$function$;

grant execute on function public.prep_reassign_lines(uuid[],uuid,integer,integer,integer) to anon, authenticated, service_role;

-- ── prep_restore_lines ──
drop function if exists public.prep_restore_lines(uuid[],integer,integer);

CREATE OR REPLACE FUNCTION public.prep_restore_lines(p_line_ids uuid[], p_gap_ms integer, p_margin_ms integer, p_max_ms integer DEFAULT 15000)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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

  update lines set is_deleted = false where id = any (p_line_ids);
  get diagnostics v_count = row_count;

  perform recompute_clips(v_session, p_gap_ms, p_margin_ms, p_max_ms);
  return v_count;
end;
$function$;

grant execute on function public.prep_restore_lines(uuid[],integer,integer,integer) to anon, authenticated, service_role;

-- ── prep_split_lines ──
drop function if exists public.prep_split_lines(uuid[],text,text,integer,integer);

CREATE OR REPLACE FUNCTION public.prep_split_lines(p_line_ids uuid[], p_name text, p_color text, p_gap_ms integer, p_margin_ms integer, p_max_ms integer DEFAULT 15000)
 RETURNS characters
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_session uuid;
  v_char characters;
  v_order int;
begin
  select distinct session_id into v_session
  from lines where id = any (p_line_ids);
  if v_session is null then
    raise exception 'LINE_NOT_FOUND' using errcode = 'P0002';
  end if;
  perform app_assert_prepping(v_session);

  select coalesce(max(sort_order), -1) + 1 into v_order
  from characters where session_id = v_session;

  insert into characters (session_id, speaker_key, name, color, sort_order)
  values (v_session, 'split_' || gen_random_uuid()::text, btrim(p_name),
          p_color, v_order)
  returning * into v_char;

  update lines set character_id = v_char.id where id = any (p_line_ids);

  perform recompute_clips(v_session, p_gap_ms, p_margin_ms, p_max_ms);
  return v_char;
end;
$function$;

grant execute on function public.prep_split_lines(uuid[],text,text,integer,integer,integer) to anon, authenticated, service_role;

commit;
