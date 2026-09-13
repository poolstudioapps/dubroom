-- Le decalage micro est propre a chaque prise, et le genre « chanson » disparait.

-- Une prise neuve part d'un decalage nul. Refaire une replique garde le
-- reglage de la prise precedente ; le volume, lui, suit encore le reglage
-- « partout » du joueur.
create or replace function save_take(p_clip_id uuid, p_audio_path text, p_duration_ms integer)
returns takes
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_take takes;
  v_prev takes;
  v_session uuid;
  v_me uuid;
  v_owner uuid;
  v_player participants;
begin
  select c.session_id, ch.assigned_to into v_session, v_owner
  from clips c
  join characters ch on ch.id = c.character_id
  where c.id = p_clip_id;
  if v_session is null then
    raise exception 'CLIP_NOT_FOUND' using errcode = 'P0002';
  end if;

  perform app_assert_status(v_session, array['recording']::session_status[]);
  if exists (select 1 from sessions where id = v_session and closed_at is not null) then
    raise exception 'SESSION_EXPIRED' using errcode = 'P0001';
  end if;

  v_me := app_my_participant(v_session);
  if v_me is null or v_me <> v_owner then
    raise exception 'NOT_YOUR_CHARACTER' using errcode = 'P0001';
  end if;
  select * into v_player from participants where id = v_me;

  select * into v_prev from takes
  where clip_id = p_clip_id and is_selected and participant_id = v_me
  limit 1;

  update takes set is_selected = false
  where clip_id = p_clip_id and is_selected;

  insert into takes (
    clip_id, participant_id, audio_path, duration_ms, is_selected,
    fx_reverb, fx_pitch, fx_tune, mic_offset_ms, gain_db
  )
  values (
    p_clip_id, v_me, p_audio_path, p_duration_ms, true,
    coalesce(v_prev.fx_reverb, 0), coalesce(v_prev.fx_pitch, 0), 0,
    coalesce(v_prev.mic_offset_ms, 0),
    coalesce(v_prev.gain_db, v_player.gain_db, 0)
  )
  returning * into v_take;

  return v_take;
end;
$$;

-- Plus de chansons au catalogue : le type garde la valeur, la fiche la refuse.
create or replace function app_genre_valide(p_genre text)
returns boolean
language sql
immutable
set search_path = public, pg_temp
as $$
  select coalesce(p_genre <> 'chanson' and p_genre = any (enum_range(null::pack_genre)::text[]), false);
$$;
