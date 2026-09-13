-- Dub'Up — des roles, et des rendus qui ne restent qu'une heure.
--
-- ── Les roles ─────────────────────────────────────────────────────────
--
-- Trois niveaux, portes par la liste d'invites elle-meme : un role se
-- donne a une adresse, avant meme que la personne ne se soit connectee.
--
--  - `owner` : les proprietaires du projet. Tous les droits, dont celui
--    de nommer et de retirer les administrateurs. Ils ne se nomment ni
--    ne se retirent depuis l'application.
--
--  - `admin` : peut creer une scene depuis un lien YouTube. Ce chemin
--    passe par le worker du PC de l'hote, le seul que YouTube laisse
--    telecharger ; il reste donc reserve a ceux qui savent le lancer.
--
--  - `user` : importe ses videos, et part des scenes du catalogue en
--    apportant la video. Tout est traite en ligne.
--
-- Les roles des comptes existants sont poses a part, sur la base, et non
-- ici : une migration versionnee n'a pas a porter les adresses des
-- membres.
--
-- ── Les rendus ────────────────────────────────────────────────────────
--
-- Un rendu est supprime une heure apres sa creation. Le temps de le
-- regarder et de le telecharger ; rien ne s'accumule dans le stockage.
-- L'ecran du resultat le dit, avec le temps qui reste.
--
-- La suppression passe par la fonction Edge `purger-rendus` : Postgres
-- ne peut pas effacer un fichier du stockage lui-meme. `pg_cron` regarde
-- toutes les cinq minutes s'il y a quelque chose a effacer, et n'appelle
-- la fonction que dans ce cas.
--
-- Les rendus deja produits ne recoivent pas d'echeance : les effacer
-- d'office supprimerait des scenes que personne n'a eu l'occasion de
-- telecharger en connaissant la regle.

-- ══════════════════════════════════════════════════════════════════════
-- Roles
-- ══════════════════════════════════════════════════════════════════════

alter table allowed_emails
  add column if not exists role text not null default 'user';

alter table allowed_emails drop constraint if exists allowed_emails_role_check;
alter table allowed_emails
  add constraint allowed_emails_role_check check (role in ('user', 'admin', 'owner'));

create or replace function app_current_role()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select role from allowed_emails where lower(email) = app_current_email()),
    'none'
  );
$$;

create or replace function app_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select app_current_role() in ('admin', 'owner');
$$;

create or replace function app_is_owner()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select app_current_role() = 'owner';
$$;

/** Le role de la personne connectee, pour l'interface. */
create or replace function get_my_role()
returns text
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not app_is_allowed() then
    raise exception 'NOT_ALLOWED' using errcode = 'P0001';
  end if;
  return app_current_role();
end;
$$;

/** Les membres et leur role : reserve aux proprietaires. */
create or replace function list_members()
returns table (email text, role text, has_account boolean, display_name text)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not app_is_owner() then
    raise exception 'OWNER_ONLY' using errcode = 'P0001';
  end if;

  return query
  select
    a.email::text,
    a.role,
    u.id is not null,
    p.display_name::text
  from allowed_emails a
  left join auth.users u on lower(u.email) = lower(a.email)
  left join profiles p on p.user_id = u.id
  order by
    case a.role when 'owner' then 0 when 'admin' then 1 else 2 end,
    a.added_at;
end;
$$;

/** Nommer ou retirer un administrateur : reserve aux proprietaires. */
create or replace function set_member_role(p_email text, p_role text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := lower(btrim(p_email));
  v_actuel text;
begin
  if not app_is_owner() then
    raise exception 'OWNER_ONLY' using errcode = 'P0001';
  end if;
  if p_role not in ('user', 'admin') then
    raise exception 'INVALID_ROLE' using errcode = 'P0001';
  end if;

  select role into v_actuel from allowed_emails where lower(email) = v_email;
  if not found then
    raise exception 'GUEST_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_actuel = 'owner' then
    raise exception 'OWNER_LOCKED' using errcode = 'P0001';
  end if;

  update allowed_emails set role = p_role where lower(email) = v_email;
end;
$$;

-- Retirer un invite : un proprietaire ne se retire pas, et seul un
-- proprietaire retire un administrateur.
create or replace function revoke_guest(p_email text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := lower(btrim(p_email));
  v_role text;
begin
  if not app_is_allowed() then
    raise exception 'NOT_ALLOWED' using errcode = 'P0001';
  end if;

  -- On ne se retire pas soi-meme : ce serait se fermer la porte au nez,
  -- sans moyen de la rouvrir depuis l'application.
  if v_email = app_current_email() then
    raise exception 'CANNOT_REVOKE_SELF' using errcode = 'P0001';
  end if;

  select role into v_role from allowed_emails where lower(email) = v_email;
  if v_role = 'owner' then
    raise exception 'OWNER_LOCKED' using errcode = 'P0001';
  end if;
  if v_role = 'admin' and not app_is_owner() then
    raise exception 'OWNER_ONLY' using errcode = 'P0001';
  end if;

  delete from allowed_emails where lower(email) = v_email;
end;
$$;

-- Creer une scene : le lien YouTube est reserve aux administrateurs.
create or replace function create_session(
  p_code text,
  p_title text,
  p_source_type text,
  p_source_ref text,
  p_display_name text,
  p_keep_as_pack boolean default false,
  p_is_song boolean default false
)
returns sessions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session sessions;
  v_keep boolean;
begin
  if not app_is_allowed() then
    raise exception 'NOT_ALLOWED' using errcode = 'P0001';
  end if;

  -- Un lien YouTube part chez le worker du PC de l'hote, le seul que
  -- YouTube laisse telecharger : le chemin est reserve aux administrateurs.
  if p_source_type = 'youtube' and not app_is_admin() then
    raise exception 'ADMIN_ONLY' using errcode = 'P0001';
  end if;

  /*
   * L'intention est ignoree plutot que refusee.
   *
   * Le formulaire ne propose deja plus la case pour un fichier importe ;
   * si elle arrive quand meme, c'est un client obsolete ou bricole. Faire
   * echouer la creation de la scene pour autant serait disproportionne :
   * la scene est parfaitement jouable, elle ne sera simplement pas
   * publiee.
   */
  v_keep := coalesce(p_keep_as_pack, false)
            and app_pack_eligible(p_source_type, p_source_ref);

  insert into sessions (
    code, host_id, title, source_type, source_ref, status, keep_as_pack, is_song
  )
  values (
    upper(p_code), auth.uid(), nullif(p_title, ''), p_source_type,
    nullif(p_source_ref, ''), 'draft', v_keep,
    coalesce(p_is_song, false)
  )
  returning * into v_session;

  insert into participants (session_id, user_id, display_name, is_host)
  values (v_session.id, auth.uid(), p_display_name, true);

  return v_session;
end;
$$;

-- Partir d'un pack par telechargement automatique : meme regle. Les
-- autres membres passent par `start_from_pack_file`, avec leur video.
create or replace function start_from_pack(
  p_pack_id uuid,
  p_code text,
  p_display_name text,
  p_gap_ms integer,
  p_margin_ms integer
)
returns sessions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_pack packs;
  v_session sessions;
begin
  if not app_is_allowed() then
    raise exception 'NOT_ALLOWED' using errcode = 'P0001';
  end if;

  select * into v_pack from packs where id = p_pack_id;
  if not found then
    raise exception 'PACK_NOT_FOUND' using errcode = 'P0002';
  end if;

  if v_pack.kind = 'media' then
    insert into sessions (
      code, host_id, title, status, source_type, from_pack_id,
      video_path, stem_voice_path, stem_music_path, stem_music_preview_path,
      voice_peaks, voice_peaks_hz, duration_ms
    )
    values (
      upper(p_code), auth.uid(), v_pack.title, 'lobby', 'pack', v_pack.id,
      v_pack.video_path, v_pack.stem_voice_path, v_pack.stem_music_path,
      v_pack.stem_music_path,
      v_pack.voice_peaks, v_pack.voice_peaks_hz, v_pack.duration_ms
    )
    returning * into v_session;
  else
    if not app_is_admin() then
      raise exception 'ADMIN_ONLY' using errcode = 'P0001';
    end if;

    -- Tout est a refaire sauf la comprehension de la scene.
    insert into sessions (
      code, host_id, title, status, source_type, source_ref, from_pack_id,
      duration_ms
    )
    values (
      upper(p_code), auth.uid(), v_pack.title, 'ingest_queued', 'youtube',
      v_pack.source_url, v_pack.id, v_pack.duration_ms
    )
    returning * into v_session;

    insert into jobs (session_id, type, status)
    values (v_session.id, 'ingest', 'queued');
  end if;

  insert into participants (session_id, user_id, display_name, is_host)
  values (v_session.id, auth.uid(), p_display_name, true);

  -- Les personnages et repliques sont copies dans les deux cas : pour un
  -- pack `url`, ils attendront simplement que les medias arrivent.
  with copied as (
    insert into characters (session_id, speaker_key, name, color, sort_order)
    select v_session.id, c.speaker_key, c.name, c.color, c.sort_order
    from pack_characters c
    where c.pack_id = v_pack.id
    returning id, speaker_key
  )
  insert into lines (session_id, character_id, start_ms, end_ms, text, words, is_deleted)
  select v_session.id, copied.id, l.start_ms, l.end_ms, l.text, l.words, l.is_deleted
  from pack_lines l
  join pack_characters pc on pc.id = l.pack_character_id
  join copied on copied.speaker_key = pc.speaker_key
  where l.pack_id = v_pack.id;

  perform recompute_clips(v_session.id, p_gap_ms, p_margin_ms);

  return v_session;
end;
$$;

revoke all on function app_current_role() from public, anon, authenticated;
revoke all on function app_is_admin() from public, anon, authenticated;
revoke all on function app_is_owner() from public, anon, authenticated;
revoke all on function get_my_role() from public, anon;
revoke all on function list_members() from public, anon;
revoke all on function set_member_role(text, text) from public, anon;
grant execute on function get_my_role() to authenticated, service_role;
grant execute on function list_members() to authenticated, service_role;
grant execute on function set_member_role(text, text) to authenticated, service_role;

-- ══════════════════════════════════════════════════════════════════════
-- Rendus ephemeres
-- ══════════════════════════════════════════════════════════════════════

alter table sessions
  add column if not exists render_expires_at timestamptz,
  add column if not exists render_deleted_at timestamptz;

-- Le compte a rebours part du moment ou le rendu arrive, quel que soit le
-- worker qui l'a produit : c'est la base qui le pose, pas le worker.
create or replace function app_sessions_echeance_rendu()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.render_path is not null and new.render_path is distinct from old.render_path then
    new.render_expires_at := now() + interval '1 hour';
    new.render_deleted_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists sessions_echeance_rendu on sessions;
create trigger sessions_echeance_rendu
  before update of render_path on sessions
  for each row execute function app_sessions_echeance_rendu();

/** Appelee par pg_cron : ne reveille la fonction Edge que s'il y a a faire. */
create or replace function app_purger_rendus()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_url text;
  v_jeton text;
begin
  if not exists (
    select 1 from sessions
    where render_path is not null and render_expires_at <= now()
  ) then
    return;
  end if;

  select decrypted_secret into v_url
  from vault.decrypted_secrets where name = 'purge_rendus_url';
  select decrypted_secret into v_jeton
  from vault.decrypted_secrets where name = 'purge_rendus_token';
  if v_url is null or v_jeton is null then
    return;
  end if;

  perform net.http_post(
    url := v_url,
    body := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-purge-token', v_jeton
    ),
    timeout_milliseconds := 30000
  );
end;
$$;

revoke all on function app_sessions_echeance_rendu() from public, anon, authenticated;
revoke all on function app_purger_rendus() from public, anon, authenticated;

create extension if not exists pg_cron with schema pg_catalog;

select cron.unschedule(jobid) from cron.job where jobname = 'purger-rendus';
select cron.schedule('purger-rendus', '*/5 * * * *', 'select public.app_purger_rendus()');
