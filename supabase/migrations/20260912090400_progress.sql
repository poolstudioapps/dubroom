-- DubRoom — avancement des joueurs (PRD §11.7).
--
-- L'ecran d'attente doit afficher « on attend Marie (2/5) », mais les
-- policies interdisent a un joueur de lire les prises des autres avant le
-- rendu (PRD §7.1). Les deux regles tiennent ensemble grace a cette
-- fonction : elle ne rend que des compteurs, jamais le contenu des prises.

create or replace function session_progress(p_session_id uuid)
returns table (
  participant_id uuid,
  display_name text,
  is_host boolean,
  is_kicked boolean,
  is_ready boolean,
  done int,
  total int
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not app_is_participant(p_session_id) then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  return query
  select
    p.id,
    p.display_name,
    p.is_host,
    p.is_kicked,
    p.is_ready,
    coalesce(count(*) filter (where tk.id is not null), 0)::int,
    coalesce(count(c.id), 0)::int
  from participants p
  left join characters ch
    on ch.assigned_to = p.id and ch.is_released = false
  left join clips c
    on c.character_id = ch.id
  left join takes tk
    on tk.clip_id = c.id and tk.is_selected
  where p.session_id = p_session_id
  group by p.id, p.display_name, p.is_host, p.is_kicked, p.is_ready
  order by p.created_at;
end;
$$;

-- Nombre de clips encore sans prise retenue, tous joueurs confondus.
-- Sert a activer le bouton « Lancer le rendu » cote hote.
create or replace function session_missing_takes(p_session_id uuid)
returns int
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_missing int;
begin
  if not app_is_participant(p_session_id) then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  select count(*) into v_missing
  from clips c
  join characters ch on ch.id = c.character_id
  where c.session_id = p_session_id
    and ch.is_released = false
    and not exists (
      select 1 from takes tk where tk.clip_id = c.id and tk.is_selected
    );

  return v_missing;
end;
$$;
