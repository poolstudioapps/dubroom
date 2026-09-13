-- Reveiller le worker des le debut de l'envoi d'une video.
--
-- Le job Cloud Run met une minute a demarrer (GPU a froid). Jusqu'ici on
-- ne le lancait qu'une fois le fichier arrive : la scene attendait donc
-- l'envoi, puis encore une minute. On le previent au debut de l'envoi, et
-- il patiente tant qu'un envoi est en cours.

alter table sessions add column if not exists upload_started_at timestamptz;

create or replace function prevenir_worker(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_url text;
  v_jeton text;
begin
  -- Seul l'hote d'une scene en brouillon, et au plus une fois toutes les
  -- deux minutes : chaque appel peut demarrer un GPU.
  update sessions
  set upload_started_at = now()
  where id = p_session_id
    and host_id = auth.uid()
    and status = 'draft'
    and source_type = 'upload'
    and (upload_started_at is null or upload_started_at < now() - interval '2 minutes');
  if not found then
    return;
  end if;

  select decrypted_secret into v_url
  from vault.decrypted_secrets where name = 'reveil_worker_url';
  select decrypted_secret into v_jeton
  from vault.decrypted_secrets where name = 'reveil_worker_token';
  if v_url is null or v_jeton is null then
    return;
  end if;

  perform net.http_post(
    url := v_url,
    body := jsonb_build_object('prevenance', p_session_id),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-reveil-token', v_jeton
    ),
    timeout_milliseconds := 10000
  );
exception when others then
  raise warning 'prévenance du worker impossible : %', sqlerrm;
end;
$$;

revoke all on function prevenir_worker(uuid) from public, anon;
grant execute on function prevenir_worker(uuid) to authenticated;

-- Le worker demande s'il doit patienter avant de s'arreter.
create or replace function envoi_en_cours()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from sessions
    where status = 'draft'
      and upload_started_at > now() - interval '3 minutes'
  );
$$;

revoke all on function envoi_en_cours() from public, anon, authenticated;
grant execute on function envoi_en_cours() to service_role;
