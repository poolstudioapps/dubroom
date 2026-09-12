-- DubRoom — ecran de preparation (PRD §9).
--
-- Toutes ces operations sont reservees a l'hote et au seul statut
-- `prepping` : au-dela, la preparation est verrouillee (PRD §9.4).
-- Chaque operation qui touche au decoupage recalcule les clips dans la
-- meme transaction, pour qu'aucune session ne puisse rester avec des
-- clips desynchronises de ses repliques.

create or replace function app_assert_prepping(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not app_is_host(p_session_id) then
    raise exception 'HOST_ONLY' using errcode = 'P0001';
  end if;
  perform app_assert_status(p_session_id, array['prepping']::session_status[]);
end;
$$;

-- ── Renommage ─────────────────────────────────────────────────────────
-- N'affecte pas le decoupage : pas de recalcul.

create or replace function prep_rename_character(
  p_character_id uuid,
  p_name text
)
returns characters
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_char characters;
begin
  select * into v_char from characters where id = p_character_id;
  if not found then
    raise exception 'CHARACTER_NOT_FOUND' using errcode = 'P0002';
  end if;
  perform app_assert_prepping(v_char.session_id);

  if length(btrim(p_name)) = 0 then
    raise exception 'EMPTY_NAME' using errcode = 'P0001';
  end if;

  update characters set name = btrim(p_name) where id = p_character_id
  returning * into v_char;
  return v_char;
end;
$$;

-- ── Correction de texte (confort uniquement, PRD §9.3) ────────────────

create or replace function prep_update_line_text(p_line_id uuid, p_text text)
returns lines
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_line lines;
begin
  select * into v_line from lines where id = p_line_id;
  if not found then
    raise exception 'LINE_NOT_FOUND' using errcode = 'P0002';
  end if;
  perform app_assert_prepping(v_line.session_id);

  update lines set text = p_text where id = p_line_id returning * into v_line;
  return v_line;
end;
$$;

-- ── Reassignation de repliques ────────────────────────────────────────

create or replace function prep_reassign_lines(
  p_line_ids uuid[],
  p_character_id uuid,
  p_gap_ms int,
  p_margin_ms int
)
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
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

  perform recompute_clips(v_target_session, p_gap_ms, p_margin_ms);
  return v_count;
end;
$$;

-- ── Fusion de personnages ─────────────────────────────────────────────
-- La diarisation eclate volontiers un personnage en deux (PRD §6.4) :
-- c'est l'operation la plus utilisee de cet ecran.

create or replace function prep_merge_characters(
  p_source_ids uuid[],
  p_target_id uuid,
  p_gap_ms int,
  p_margin_ms int
)
returns characters
language plpgsql
security definer
set search_path = public, pg_temp
as $$
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

  perform recompute_clips(v_session, p_gap_ms, p_margin_ms);
  return v_target;
end;
$$;

-- ── Scission : deplacer des repliques vers un nouveau personnage ──────

create or replace function prep_split_lines(
  p_line_ids uuid[],
  p_name text,
  p_color text,
  p_gap_ms int,
  p_margin_ms int
)
returns characters
language plpgsql
security definer
set search_path = public, pg_temp
as $$
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

  perform recompute_clips(v_session, p_gap_ms, p_margin_ms);
  return v_char;
end;
$$;

-- ── Suppression de repliques ──────────────────────────────────────────
-- La replique ne sera pas doublable : la VO est conservee a cet endroit.

create or replace function prep_delete_lines(
  p_line_ids uuid[],
  p_gap_ms int,
  p_margin_ms int
)
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
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

  perform recompute_clips(v_session, p_gap_ms, p_margin_ms);
  return v_count;
end;
$$;

-- ── Suppression d'un personnage vide ──────────────────────────────────

create or replace function prep_delete_character(
  p_character_id uuid,
  p_gap_ms int,
  p_margin_ms int
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_char characters;
begin
  select * into v_char from characters where id = p_character_id;
  if not found then
    return;
  end if;
  perform app_assert_prepping(v_char.session_id);

  delete from characters where id = p_character_id;
  perform recompute_clips(v_char.session_id, p_gap_ms, p_margin_ms);
end;
$$;

-- Annulation d'une suppression : la replique redevient doublable.

create or replace function prep_restore_lines(
  p_line_ids uuid[],
  p_gap_ms int,
  p_margin_ms int
)
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
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

  perform recompute_clips(v_session, p_gap_ms, p_margin_ms);
  return v_count;
end;
$$;
