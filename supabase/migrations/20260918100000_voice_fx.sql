-- Dub’Up — la console de voix.
--
-- Trois reglages par joueur et par scene. Ils ne touchent jamais le
-- fichier enregistre : la prise reste brute en reserve, et les effets
-- sont appliques au mixage. On peut donc les changer d'avis en avis
-- jusqu'au rendu, et les remettre a zero sans avoir rien perdu.
--
--  - `fx_reverb`  0 a 100 : de la voix seche a la grande salle ;
--  - `fx_pitch`   -12 a +12 demi-tons : la voix monte ou descend ;
--  - `fx_tune`    0 a 100 : force du recalage sur les notes justes.
--
-- Par scene et non par compte : on ne double pas un dessin anime comme
-- on reprend une chanson.

alter table participants
  add column if not exists fx_reverb int not null default 0
    check (fx_reverb between 0 and 100),
  add column if not exists fx_pitch int not null default 0
    check (fx_pitch between -12 and 12),
  add column if not exists fx_tune int not null default 0
    check (fx_tune between 0 and 100);

comment on column participants.fx_reverb is 'Réverbération, 0 à 100.';
comment on column participants.fx_pitch is 'Transposition en demi-tons, -12 à +12.';
comment on column participants.fx_tune is 'Force du recalage sur les notes, 0 à 100.';

/**
 * Regle sa propre console.
 *
 * Comme `set_mic_offset` : chacun regle la sienne, sur une scene ou il
 * joue, et tant que le rendu n'est pas lance. Apres, ce serait mentir
 * sur ce qu'on va entendre.
 */
create or replace function set_voice_fx(
  p_session_id uuid,
  p_reverb int,
  p_pitch int,
  p_tune int
)
returns participants
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row participants;
begin
  if not app_is_participant(p_session_id) then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  update participants
  set fx_reverb = greatest(0, least(100, coalesce(p_reverb, 0))),
      fx_pitch = greatest(-12, least(12, coalesce(p_pitch, 0))),
      fx_tune = greatest(0, least(100, coalesce(p_tune, 0)))
  where session_id = p_session_id
    and user_id = auth.uid()
  returning * into v_row;

  if not found then
    raise exception 'NOT_A_PLAYER' using errcode = 'P0002';
  end if;

  return v_row;
end;
$$;

revoke execute on function set_voice_fx(uuid, int, int, int) from public;
grant execute on function set_voice_fx(uuid, int, int, int)
  to authenticated, service_role;
