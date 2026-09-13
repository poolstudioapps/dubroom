-- Dub'Up — deux workers pour une file : Google, et le PC de l'hote.
--
-- Le worker Cloud Run avait ete retire parce que YouTube refuse les
-- adresses de centre de donnees. Mais YouTube n'intervient qu'a une seule
-- etape : le telechargement. La separation, la transcription, le
-- decoupage et le rendu lisent et ecrivent dans Supabase, et passent sans
-- difficulte depuis Google.
--
-- Le partage est donc le suivant :
--
--  - une tache qui doit TELECHARGER depuis YouTube (preparation d'une
--    scene venue d'un lien ou d'un pack, tant que la video n'est pas
--    encore dans le stockage) n'est prise que par le PC de l'hote ;
--
--  - toutes les autres — preparation d'un fichier importe, suite d'une
--    preparation YouTube une fois la video en ligne, rendu final — sont
--    pour Google, reveille par la base au moment ou elles entrent en file.
--
-- Le PC reste le filet : s'il voit une tache pour Google que personne n'a
-- prise apres un delai de grace, il la prend lui-meme. Google eteint, en
-- panne ou mal configure, tout continue de fonctionner comme avant, avec
-- ce delai en plus.
--
-- Aucun secret ici : l'adresse du reveil et son jeton vivent dans Vault.
-- Sans eux, le declencheur ne fait rien, et le PC reprend tout apres le
-- delai de grace.

-- ── Horodatage des taches ─────────────────────────────────────────────
--
-- `queued_at` : depuis quand la tache attend. Le delai de grace se mesure
-- a partir de la, et non de la creation : une preparation YouTube rendue
-- a la file apres son telechargement doit laisser a Google sa chance,
-- meme si elle a ete creee dix minutes plus tot.
--
-- `touched_at` : le dernier signe de vie. La reprise des taches bloquees
-- se fondait sur l'heure de demarrage, si bien qu'une separation longue
-- sur un worker etait declaree morte et relancee par l'autre. Deux
-- workers pour une file rendent ce defaut reel ; chaque avancement
-- repousse desormais l'echeance.

alter table jobs
  add column if not exists queued_at timestamptz not null default now(),
  add column if not exists touched_at timestamptz;

create or replace function app_jobs_horodatage()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.touched_at := now();
  if new.status = 'queued' and old.status is distinct from 'queued' then
    new.queued_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists jobs_horodatage on jobs;
create trigger jobs_horodatage
  before update on jobs
  for each row execute function app_jobs_horodatage();

-- ── Qui peut prendre quoi ─────────────────────────────────────────────

create or replace function app_job_needs_local(p_type text, p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p_type = 'ingest'
    and exists (
      select 1
      from sessions s
      where s.id = p_session_id
        and s.source_type = 'youtube'
        and s.video_path is null
    );
$$;

create or replace function claim_job(
  p_worker_id text,
  p_max_attempts int,
  p_role text,
  p_grace_seconds int
)
returns jobs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_job jobs;
begin
  insert into workers (id, last_seen_at)
  values (p_worker_id, now())
  on conflict (id) do update set last_seen_at = now();

  select j.* into v_job
  from jobs j
  where j.status = 'queued'
    and j.attempts < p_max_attempts
    and case
      when p_role = 'cloud' then
        not app_job_needs_local(j.type, j.session_id)
      else
        app_job_needs_local(j.type, j.session_id)
        or j.queued_at <= now() - make_interval(
          secs => greatest(coalesce(p_grace_seconds, 0), 0)
        )
    end
  order by j.created_at
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

  update sessions
  set status = case
        when v_job.type = 'ingest' then 'ingesting'::session_status
        else 'rendering'::session_status
      end
  where id = v_job.session_id;

  return v_job;
end;
$$;

-- L'ancienne signature reste, pour un worker de PC lance avant la mise a
-- jour : il suit la meme regle, avec le delai de grace par defaut. Sans
-- cela il prendrait tout dans la seconde, et Google ne serait reveille
-- que pour trouver la file vide.
create or replace function claim_job(p_worker_id text, p_max_attempts int default 3)
returns jobs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return claim_job(p_worker_id, p_max_attempts, 'local'::text, 150);
end;
$$;

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
      and coalesce(touched_at, started_at) < now() - make_interval(mins => p_stale_minutes)
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

-- ── Le reveil de Google ───────────────────────────────────────────────
--
-- Une tache pour Google entre en file : la base appelle la fonction Edge
-- `reveiller-worker`, qui lance le job Cloud Run. Aucun minuteur, rien
-- qui tourne a vide, et rien d'appele pour une tache que seul le PC peut
-- faire.
--
-- Un reveil qui echoue ne bloque jamais l'insertion : la tache reste en
-- file, et le PC la prendra apres le delai de grace.

create or replace function reveiller_worker()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_url text;
  v_jeton text;
begin
  if tg_op = 'UPDATE' and old.status = 'queued' then
    return null;
  end if;
  if app_job_needs_local(new.type, new.session_id) then
    return null;
  end if;

  select decrypted_secret into v_url
  from vault.decrypted_secrets where name = 'reveil_worker_url';
  select decrypted_secret into v_jeton
  from vault.decrypted_secrets where name = 'reveil_worker_token';
  if v_url is null or v_jeton is null then
    return null;
  end if;

  perform net.http_post(
    url := v_url,
    body := jsonb_build_object('job', new.id),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-reveil-token', v_jeton
    ),
    timeout_milliseconds := 10000
  );
  return null;
exception when others then
  raise warning 'réveil du worker impossible : %', sqlerrm;
  return null;
end;
$$;

drop trigger if exists jobs_reveillent_le_worker on jobs;
create trigger jobs_reveillent_le_worker
  after insert or update of status on jobs
  for each row
  when (new.status = 'queued')
  execute function reveiller_worker();

-- ── Droits ────────────────────────────────────────────────────────────

revoke all on function claim_job(text, int, text, int) from public, anon, authenticated;
revoke all on function claim_job(text, int) from public, anon, authenticated;
revoke all on function requeue_stale_jobs(int) from public, anon, authenticated;
revoke all on function app_job_needs_local(text, uuid) from public, anon, authenticated;
revoke all on function reveiller_worker() from public, anon, authenticated;
revoke all on function app_jobs_horodatage() from public, anon, authenticated;

grant execute on function claim_job(text, int, text, int) to service_role;
grant execute on function claim_job(text, int) to service_role;
grant execute on function requeue_stale_jobs(int) to service_role;
