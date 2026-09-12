-- Dub’Up — un plafond a la longueur d'un clip.
--
-- Le regroupement ne tenait compte que du silence : deux repliques
-- separees de moins de trois secondes partaient dans le meme clip, sans
-- limite. Un personnage qui parle en continu se retrouvait donc avec une
-- tirade de quarante secondes a enregistrer d'un trait, sans reprise
-- possible : rater le dernier mot obligeait a tout refaire.
--
-- On ajoute donc une seconde raison de couper : la duree. Au-dela de
-- `p_max_ms` de parole depuis le debut du groupe, la replique suivante
-- ouvre un nouveau clip. Une replique seule plus longue que le plafond
-- n'est jamais coupee en deux — on ne tronconne pas une phrase au
-- milieu, et de toute facon il faudra bien la dire d'un souffle.
--
-- Le calcul devient recursif, et il faut qu'il le soit : « couper quand
-- le cumul depasse » se reinitialise a chaque coupe, ce qu'une fonction
-- de fenetre ne sait pas faire.

drop function if exists recompute_clips(uuid, int, int);

create or replace function recompute_clips(
  p_session_id uuid,
  p_gap_ms int,
  p_margin_ms int,
  p_max_ms int default 15000
)
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_duration int;
  v_count int;
begin
  select duration_ms into v_duration from sessions where id = p_session_id;

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
$$;

revoke all on function recompute_clips(uuid, int, int, int) from public, anon;
grant execute on function recompute_clips(uuid, int, int, int)
  to authenticated, service_role;
