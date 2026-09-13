-- Dub'Up — les effets de voix, prise par prise.
--
-- Ils etaient regles par joueur : une reverbe choisie pour une replique
-- chantee s'appliquait aussi aux trois repliques parlees du meme
-- personnage, sans moyen de l'eviter. Ils passent donc sur la prise.
--
-- Rien ne change dans le principe : la prise reste brute, les effets
-- sont poses au mixage, et on peut les changer ou les retirer tant que
-- le rendu n'est pas lance.

alter table takes
  add column if not exists fx_reverb int not null default 0
    check (fx_reverb between 0 and 100),
  add column if not exists fx_pitch int not null default 0
    check (fx_pitch between -12 and 12),
  add column if not exists fx_tune int not null default 0
    check (fx_tune between 0 and 100);

comment on column takes.fx_reverb is 'Réverbération de cette prise, 0 à 100.';
comment on column takes.fx_pitch is 'Transposition de cette prise, -12 à +12 demi-tons.';
comment on column takes.fx_tune is 'Recalage sur les notes de cette prise, 0 à 100.';

-- Les scenes en cours gardent ce qu'on y avait regle : les prises
-- existantes heritent des reglages de leur joueur.
update takes tk
set fx_reverb = p.fx_reverb, fx_pitch = p.fx_pitch, fx_tune = p.fx_tune
from participants p
where p.id = tk.participant_id
  and (p.fx_reverb <> 0 or p.fx_pitch <> 0 or p.fx_tune <> 0);

comment on column participants.fx_reverb is 'Remplacé par takes.fx_reverb.';
comment on column participants.fx_pitch is 'Remplacé par takes.fx_pitch.';
comment on column participants.fx_tune is 'Remplacé par takes.fx_tune.';

/**
 * Une nouvelle prise reprend les effets de celle qu'elle remplace.
 *
 * On refait une replique parce que le jeu n'allait pas, rarement parce
 * que l'effet n'allait pas : repartir d'une voix nue a chaque essai
 * obligerait a tout reregler.
 */
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
begin
  select c.session_id, ch.assigned_to into v_session, v_owner
  from clips c
  join characters ch on ch.id = c.character_id
  where c.id = p_clip_id;
  if v_session is null then
    raise exception 'CLIP_NOT_FOUND' using errcode = 'P0002';
  end if;

  perform app_assert_status(v_session, array['recording']::session_status[]);

  v_me := app_my_participant(v_session);
  if v_me is null or v_me <> v_owner then
    raise exception 'NOT_YOUR_CHARACTER' using errcode = 'P0001';
  end if;

  select * into v_prev from takes
  where clip_id = p_clip_id and is_selected and participant_id = v_me
  limit 1;

  -- Une seule prise retenue par clip : on desassocie avant d'inserer,
  -- sinon l'index partiel `one_selected_take_per_clip` rejette l'insert.
  update takes set is_selected = false
  where clip_id = p_clip_id and is_selected;

  insert into takes (
    clip_id, participant_id, audio_path, duration_ms, is_selected,
    fx_reverb, fx_pitch, fx_tune
  )
  values (
    p_clip_id, v_me, p_audio_path, p_duration_ms, true,
    coalesce(v_prev.fx_reverb, 0), coalesce(v_prev.fx_pitch, 0), coalesce(v_prev.fx_tune, 0)
  )
  returning * into v_take;

  return v_take;
end;
$$;

/** Regle les effets d'une de ses propres prises, tant qu'on enregistre. */
create or replace function set_take_fx(
  p_take_id uuid,
  p_reverb int,
  p_pitch int,
  p_tune int
)
returns takes
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_take takes;
  v_session uuid;
begin
  select c.session_id into v_session
  from takes tk join clips c on c.id = tk.clip_id
  where tk.id = p_take_id;
  if v_session is null then
    raise exception 'TAKE_NOT_FOUND' using errcode = 'P0002';
  end if;

  perform app_assert_status(v_session, array['recording']::session_status[]);

  update takes
  set fx_reverb = greatest(0, least(100, coalesce(p_reverb, 0))),
      fx_pitch = greatest(-12, least(12, coalesce(p_pitch, 0))),
      fx_tune = greatest(0, least(100, coalesce(p_tune, 0)))
  where id = p_take_id and participant_id = app_my_participant(v_session)
  returning * into v_take;
  if not found then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  return v_take;
end;
$$;

revoke execute on function set_take_fx(uuid, int, int, int) from public;
grant execute on function set_take_fx(uuid, int, int, int) to authenticated, service_role;
