-- DubRoom — fonctions metier.
--
-- Parti pris : la lecture passe par RLS, mais toute TRANSITION d'etat passe
-- par une fonction `security definer`. C'est ce qui permet de tenir les
-- invariants du PRD (un seul joueur par personnage, une seule prise retenue
-- par clip, pas de modification apres l'ouverture du lobby) sans disperser
-- la regle dans des policies impossibles a relire.
--
-- Les seuils (marge, gap) ne sont jamais ecrits ici : ils arrivent en
-- parametre depuis config/constants.ts, qui reste la source unique (PRD §18).

-- ── Helpers d'identite ────────────────────────────────────────────────

create or replace function app_current_email()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select lower(coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email',
    (select email from auth.users where id = auth.uid())
  ));
$$;

create or replace function app_is_allowed()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from allowed_emails where lower(email) = app_current_email()
  );
$$;

create or replace function app_is_host(p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from sessions
    where id = p_session_id and host_id = auth.uid()
  );
$$;

create or replace function app_is_participant(p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from participants
    where session_id = p_session_id and user_id = auth.uid()
  );
$$;

create or replace function app_my_participant(p_session_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select id from participants
  where session_id = p_session_id and user_id = auth.uid()
  limit 1;
$$;

-- Extrait l'uuid de session d'un chemin Storage `{session_id}/...`.
create or replace function app_path_session(p_name text)
returns uuid
language plpgsql
immutable
as $$
declare
  v_first text := split_part(p_name, '/', 1);
begin
  if v_first ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
    return v_first::uuid;
  end if;
  return null;
end;
$$;

-- ── Garde-fou de statut ───────────────────────────────────────────────

create or replace function app_assert_status(
  p_session_id uuid,
  p_allowed session_status[]
)
returns session_status
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_status session_status;
begin
  select status into v_status from sessions where id = p_session_id;
  if v_status is null then
    raise exception 'SESSION_NOT_FOUND' using errcode = 'P0002';
  end if;
  if not (v_status = any (p_allowed)) then
    raise exception 'SESSION_LOCKED: statut % inattendu', v_status
      using errcode = 'P0001';
  end if;
  return v_status;
end;
$$;

-- ── Decoupage en clips (PRD §6.5) ─────────────────────────────────────
--
-- Unique implementation du decoupage. Le worker n'ecrit que les `lines`
-- puis appelle cette fonction ; l'ecran de preparation l'appelle apres
-- chaque correction. Les clips ne sont donc jamais calcules deux fois
-- par deux codes differents.

create or replace function recompute_clips(
  p_session_id uuid,
  p_gap_ms int,
  p_margin_ms int
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

  with ordered as (
    select
      l.id,
      l.character_id,
      l.start_ms,
      l.end_ms,
      lag(l.end_ms) over (
        partition by l.character_id order by l.start_ms, l.id
      ) as prev_end
    from lines l
    where l.session_id = p_session_id
      and l.is_deleted = false
  ),
  flagged as (
    select
      o.*,
      case
        when o.prev_end is null then 1
        -- Deux repliques separees de moins de p_gap_ms seront dites
        -- d'un seul souffle : les couper serait artificiel.
        when o.start_ms - o.prev_end >= p_gap_ms then 1
        else 0
      end as is_new_group
    from ordered o
  ),
  grouped as (
    select
      f.*,
      sum(f.is_new_group) over (
        partition by f.character_id
        order by f.start_ms, f.id
        rows between unbounded preceding and current row
      ) as grp
    from flagged f
  ),
  clustered as (
    select
      character_id,
      grp,
      min(start_ms) as speech_start_ms,
      max(end_ms) as speech_end_ms,
      array_agg(id order by start_ms, id) as line_ids
    from grouped
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

-- ── File d'attente : reclamation d'un job (PRD §7.2) ──────────────────
--
-- FOR UPDATE SKIP LOCKED est du SQL brut : PostgREST ne sait pas
-- l'exprimer, d'ou cette fonction appelee en RPC par le worker.

create or replace function claim_job(p_worker_id text, p_max_attempts int default 3)
returns jobs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job jobs;
begin
  -- Heartbeat au passage : c'est lui qui alimente le message
  -- « en attente du worker » cote front (PRD §12.1).
  insert into workers (id, last_seen_at)
  values (p_worker_id, now())
  on conflict (id) do update set last_seen_at = now();

  select * into v_job
  from jobs
  where status = 'queued' and attempts < p_max_attempts
  order by created_at
  for update skip locked
  limit 1;

  if not found then
    update workers set current_job_id = null where id = p_worker_id;
    return null;
  end if;

  update jobs
  set status = 'running',
      claimed_by = p_worker_id,
      attempts = attempts + 1,
      progress = 0,
      error = null,
      started_at = now()
  where id = v_job.id
  returning * into v_job;

  update workers set current_job_id = v_job.id where id = p_worker_id;

  -- La session suit le job : le front n'a qu'une seule source de verite.
  update sessions
  set status = case
        when v_job.type = 'ingest' then 'ingesting'::session_status
        else 'rendering'::session_status
      end
  where id = v_job.session_id;

  return v_job;
end;
$$;

-- Reprise apres crash, appelee au demarrage du worker (PRD §7.2).
create or replace function requeue_stale_jobs(p_stale_minutes int default 10)
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count int;
begin
  with revived as (
    update jobs
    set status = 'queued', claimed_by = null, step = null, progress = 0
    where status = 'running'
      and started_at < now() - make_interval(mins => p_stale_minutes)
    returning id, session_id, type
  )
  update sessions s
  set status = case
        when r.type = 'ingest' then 'ingest_queued'::session_status
        else 'render_queued'::session_status
      end
  from revived r
  where s.id = r.session_id;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- ── Cycle de vie d'une session ────────────────────────────────────────

create or replace function create_session(
  p_code text,
  p_title text,
  p_source_type text,
  p_source_ref text,
  p_display_name text
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

  insert into sessions (code, host_id, title, source_type, source_ref, status)
  values (upper(p_code), auth.uid(), nullif(p_title, ''), p_source_type,
          nullif(p_source_ref, ''), 'draft')
  returning * into v_session;

  insert into participants (session_id, user_id, display_name, is_host)
  values (v_session.id, auth.uid(), p_display_name, true);

  return v_session;
end;
$$;

create or replace function join_session(p_code text, p_display_name text)
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

  select * into v_session from sessions where code = upper(p_code);
  if not found then
    raise exception 'SESSION_NOT_FOUND' using errcode = 'P0002';
  end if;

  insert into participants (session_id, user_id, display_name)
  values (v_session.id, auth.uid(), p_display_name)
  on conflict (session_id, user_id) do update
    set display_name = excluded.display_name
  where participants.is_kicked = false;

  return v_session;
end;
$$;

create or replace function enqueue_ingest(p_session_id uuid, p_upload_path text)
returns jobs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job jobs;
begin
  if not app_is_host(p_session_id) then
    raise exception 'HOST_ONLY' using errcode = 'P0001';
  end if;
  perform app_assert_status(p_session_id, array['draft', 'ingest_failed']::session_status[]);

  update sessions
  set status = 'ingest_queued',
      upload_path = coalesce(nullif(p_upload_path, ''), upload_path)
  where id = p_session_id;

  -- Un seul job actif par session : la reprise reutilise le job en echec.
  delete from jobs
  where session_id = p_session_id and type = 'ingest' and status = 'failed';

  insert into jobs (session_id, type, status)
  values (p_session_id, 'ingest', 'queued')
  returning * into v_job;

  return v_job;
end;
$$;

create or replace function open_lobby(
  p_session_id uuid,
  p_gap_ms int,
  p_margin_ms int
)
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
  perform app_assert_status(p_session_id, array['prepping']::session_status[]);

  -- Dernier recalcul avant verrouillage : au-dela, plus rien ne bouge.
  perform recompute_clips(p_session_id, p_gap_ms, p_margin_ms);

  update sessions set status = 'lobby' where id = p_session_id
  returning * into v_session;
  return v_session;
end;
$$;

create or replace function start_recording(p_session_id uuid)
returns sessions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session sessions;
  v_orphans int;
  v_unready int;
begin
  if not app_is_host(p_session_id) then
    raise exception 'HOST_ONLY' using errcode = 'P0001';
  end if;
  perform app_assert_status(p_session_id, array['lobby']::session_status[]);

  select count(*) into v_orphans
  from characters
  where session_id = p_session_id
    and assigned_to is null
    and is_released = false;
  if v_orphans > 0 then
    raise exception 'CHARACTERS_UNASSIGNED' using errcode = 'P0001';
  end if;

  select count(*) into v_unready
  from participants
  where session_id = p_session_id and is_kicked = false and is_ready = false;
  if v_unready > 0 then
    raise exception 'PLAYERS_NOT_READY' using errcode = 'P0001';
  end if;

  update sessions set status = 'recording' where id = p_session_id
  returning * into v_session;
  return v_session;
end;
$$;

create or replace function enqueue_render(p_session_id uuid)
returns jobs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job jobs;
  v_missing int;
begin
  if not app_is_host(p_session_id) then
    raise exception 'HOST_ONLY' using errcode = 'P0001';
  end if;
  perform app_assert_status(
    p_session_id, array['recording', 'render_failed']::session_status[]
  );

  -- Tout clip d'un personnage non libere doit avoir une prise retenue.
  select count(*) into v_missing
  from clips c
  join characters ch on ch.id = c.character_id
  where c.session_id = p_session_id
    and ch.is_released = false
    and not exists (
      select 1 from takes tk where tk.clip_id = c.id and tk.is_selected
    );
  if v_missing > 0 then
    raise exception 'TAKES_MISSING: % clip(s)', v_missing using errcode = 'P0001';
  end if;

  -- La scene se fige immediatement, meme si aucun worker ne tourne (PRD §12.1).
  update sessions set status = 'render_queued' where id = p_session_id;

  delete from jobs
  where session_id = p_session_id and type = 'render' and status = 'failed';

  insert into jobs (session_id, type, status)
  values (p_session_id, 'render', 'queued')
  returning * into v_job;

  return v_job;
end;
$$;

-- ── Lobby ─────────────────────────────────────────────────────────────

create or replace function assign_character(p_character_id uuid)
returns characters
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_char characters;
  v_me uuid;
begin
  select * into v_char from characters where id = p_character_id;
  if not found then
    raise exception 'CHARACTER_NOT_FOUND' using errcode = 'P0002';
  end if;
  perform app_assert_status(v_char.session_id, array['lobby']::session_status[]);

  v_me := app_my_participant(v_char.session_id);
  if v_me is null then
    raise exception 'NOT_A_PARTICIPANT' using errcode = 'P0001';
  end if;
  if v_char.assigned_to is not null and v_char.assigned_to <> v_me then
    raise exception 'CHARACTER_TAKEN' using errcode = 'P0001';
  end if;

  update characters
  set assigned_to = v_me, is_released = false
  where id = p_character_id
  returning * into v_char;
  return v_char;
end;
$$;

create or replace function unassign_character(p_character_id uuid)
returns characters
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_char characters;
  v_me uuid;
begin
  select * into v_char from characters where id = p_character_id;
  if not found then
    raise exception 'CHARACTER_NOT_FOUND' using errcode = 'P0002';
  end if;
  perform app_assert_status(v_char.session_id, array['lobby']::session_status[]);

  v_me := app_my_participant(v_char.session_id);
  if v_char.assigned_to <> v_me and not app_is_host(v_char.session_id) then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  update characters set assigned_to = null where id = p_character_id
  returning * into v_char;
  return v_char;
end;
$$;

-- Libere un personnage : sa VO sera conservee au mixage (PRD §10.3).
create or replace function set_character_released(
  p_character_id uuid,
  p_released boolean
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
  if not app_is_host(v_char.session_id) then
    raise exception 'HOST_ONLY' using errcode = 'P0001';
  end if;
  perform app_assert_status(
    v_char.session_id, array['lobby', 'recording']::session_status[]
  );

  update characters
  set is_released = p_released,
      assigned_to = case when p_released then null else assigned_to end
  where id = p_character_id
  returning * into v_char;
  return v_char;
end;
$$;

create or replace function set_ready(p_session_id uuid, p_ready boolean)
returns participants
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_participant participants;
begin
  perform app_assert_status(p_session_id, array['lobby']::session_status[]);
  update participants
  set is_ready = p_ready
  where session_id = p_session_id and user_id = auth.uid()
  returning * into v_participant;
  if not found then
    raise exception 'NOT_A_PARTICIPANT' using errcode = 'P0001';
  end if;
  return v_participant;
end;
$$;

create or replace function set_mic_offset(p_session_id uuid, p_offset_ms int)
returns participants
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_participant participants;
begin
  update participants
  set mic_offset_ms = p_offset_ms
  where session_id = p_session_id and user_id = auth.uid()
  returning * into v_participant;
  if not found then
    raise exception 'NOT_A_PARTICIPANT' using errcode = 'P0001';
  end if;
  return v_participant;
end;
$$;

-- Exclusion d'un joueur bloquant (PRD §11.8).
create or replace function kick_participant(p_participant_id uuid)
returns participants
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_participant participants;
begin
  select * into v_participant from participants where id = p_participant_id;
  if not found then
    raise exception 'PARTICIPANT_NOT_FOUND' using errcode = 'P0002';
  end if;
  if not app_is_host(v_participant.session_id) then
    raise exception 'HOST_ONLY' using errcode = 'P0001';
  end if;
  if v_participant.is_host then
    raise exception 'CANNOT_KICK_HOST' using errcode = 'P0001';
  end if;

  update participants
  set is_kicked = true, is_ready = false
  where id = p_participant_id
  returning * into v_participant;

  -- Ses personnages repassent en VO ; ses prises seront ignorees au mixage.
  update characters
  set is_released = true, assigned_to = null
  where assigned_to = p_participant_id;

  return v_participant;
end;
$$;

-- Reassignation d'un personnage a un autre joueur, alternative a la VO.
create or replace function reassign_character(
  p_character_id uuid,
  p_participant_id uuid
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
  if not app_is_host(v_char.session_id) then
    raise exception 'HOST_ONLY' using errcode = 'P0001';
  end if;
  perform app_assert_status(
    v_char.session_id, array['lobby', 'recording']::session_status[]
  );

  update characters
  set assigned_to = p_participant_id, is_released = false
  where id = p_character_id
  returning * into v_char;
  return v_char;
end;
$$;

-- ── Prises ────────────────────────────────────────────────────────────

create or replace function save_take(
  p_clip_id uuid,
  p_audio_path text,
  p_duration_ms int
)
returns takes
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_take takes;
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

  -- Une seule prise retenue par clip : on desassocie avant d'inserer,
  -- sinon l'index partiel `one_selected_take_per_clip` rejette l'insert.
  update takes set is_selected = false
  where clip_id = p_clip_id and is_selected;

  insert into takes (clip_id, participant_id, audio_path, duration_ms, is_selected)
  values (p_clip_id, v_me, p_audio_path, p_duration_ms, true)
  returning * into v_take;

  return v_take;
end;
$$;

create or replace function set_take_offset(p_take_id uuid, p_offset_ms int)
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

  update takes set offset_ms = p_offset_ms
  where id = p_take_id and participant_id = app_my_participant(v_session)
  returning * into v_take;
  if not found then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  return v_take;
end;
$$;

-- ── Stockage (PRD §13.3) ──────────────────────────────────────────────
-- Le quota Supabase est global : on somme toutes les sessions, pas
-- seulement celles de l'appelant.

create or replace function storage_usage()
returns bigint
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(sum(render_size_bytes), 0)::bigint from sessions;
$$;

-- ── Droits d'execution ────────────────────────────────────────────────
--
-- claim_job et requeue_stale_jobs appartiennent au worker seul.
--
-- Attention : revoquer a `public` retire aussi le droit implicite de
-- `service_role`, qui contourne RLS mais reste soumis aux GRANT. Sans le
-- grant explicite qui suit, le worker recevrait « permission denied »
-- des sa premiere boucle.

revoke all on function claim_job(text, int) from public, anon, authenticated;
revoke all on function requeue_stale_jobs(int) from public, anon, authenticated;
revoke all on function recompute_clips(uuid, int, int) from public, anon;
revoke all on function app_assert_status(uuid, session_status[]) from public, anon;

grant execute on function claim_job(text, int) to service_role;
grant execute on function requeue_stale_jobs(int) to service_role;
grant execute on function recompute_clips(uuid, int, int) to service_role;
