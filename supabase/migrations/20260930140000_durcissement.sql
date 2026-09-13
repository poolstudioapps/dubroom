-- Durcissement avant l'ouverture sur un domaine public.
--
-- Rien ici ne change ce que l'application fait ; tout reduit ce qu'une
-- requete forgee pourrait faire de plus. Toute l'ecriture passe par des
-- fonctions `security definer` qui verifient chacune leurs droits : le
-- navigateur n'a donc besoin que de lire, et l'anonyme de rien du tout.

-- ── 1. Les tables : lecture seule pour le navigateur, rien pour l'anonyme ──
--
-- Les politiques RLS refusaient deja les ecritures sans politique, mais
-- les droits `insert`, `update`, `delete` restaient donnes, avec
-- `truncate`, `references` et `trigger` que RLS ne couvre pas. On retire
-- tout ce que le code n'utilise pas.

revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke insert, update, delete, truncate, references, trigger on all tables in schema public from authenticated;
revoke all on all sequences in schema public from authenticated;

-- « Mes scenes » supprime une scene directement, sous sa politique.
grant delete on public.sessions to authenticated;

-- Les workers : seule la date de dernier passage se lit, et seulement par
-- les invites — elle dit si la preparation va demarrer.
revoke select on public.workers from authenticated;
grant select (last_seen_at) on public.workers to authenticated;
drop policy if exists workers_select on public.workers;
create policy workers_select on public.workers
  for select to authenticated using (app_is_allowed());

-- Les notifications : aux connectes, pas au role public.
drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications
  for select to authenticated using (user_id = auth.uid());

-- ── 2. Les fonctions : l'anonyme n'appelle que l'apercu et la demo ──────
--
-- Postgres donne `execute` a tout le monde (`public`) sur chaque fonction
-- creee, et l'anonyme en herite : retirer le droit a `anon` seul ne
-- fermait rien. On le retire a `public`, maintenant et pour les fonctions
-- a venir ; `authenticated` et `service_role` gardent leurs droits
-- explicites, poses par chaque migration.

revoke execute on all functions in schema public from public, anon;
alter default privileges in schema public revoke execute on functions from public;

do $$
declare r record;
begin
  -- Ce que les pages sans compte appellent : l'apercu de la communaute,
  -- la demo de l'accueil, et le test d'invitation (faux pour l'anonyme).
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.proname in ('list_top_packs_public', 'home_demo', 'app_is_allowed')
  loop
    execute format('grant execute on function %s to anon', r.sig);
  end loop;

  -- Les declencheurs ne s'appellent pas depuis l'API.
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.prorettype in ('trigger'::regtype, 'event_trigger'::regtype)
  loop
    execute format('revoke execute on function %s from anon, authenticated', r.sig);
  end loop;

  -- Un chemin de recherche fixe sur les trois fonctions qui n'en avaient pas.
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.proname in ('app_lien_valide', 'app_pack_eligible', 'app_path_session')
  loop
    execute format('alter function %s set search_path = public, pg_temp', r.sig);
  end loop;
end $$;

-- ── 3. Le stockage : ses propres scenes, ses propres prises ─────────────

-- L'espace utilise etait celui de tout le monde : chacun voit le sien.
create or replace function public.storage_usage()
 returns bigint
 language sql
 stable security definer
 set search_path to 'public', 'pg_temp'
as $function$
  select coalesce(sum(render_size_bytes), 0)::bigint
  from sessions
  where host_id = auth.uid();
$function$;

-- Une prise brute ne s'ecoute qu'une fois la scene terminee : la surprise
-- du resultat est le coeur du jeu, et n'importe quel participant pouvait
-- lister et telecharger les prises des autres pendant l'enregistrement.
drop policy if exists takes_object_select on storage.objects;
create policy takes_object_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'takes'
    and (
      split_part(name, '/', 2) = app_my_participant(app_path_session(name))::text
      or exists (
        select 1 from public.sessions s
        where s.id = app_path_session(name) and s.status = 'done'
      )
    )
  );

-- Une prise ne peut designer qu'un fichier de son propre dossier : sans
-- ca, elle pouvait pointer vers la prise d'un autre joueur de la scene.
create or replace function public.save_take(p_clip_id uuid, p_audio_path text, p_duration_ms integer)
 returns takes
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
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

  if p_audio_path is null
     or p_audio_path !~ ('^' || v_session::text || '/' || v_me::text || '/[0-9a-f-]{36}\.[a-z0-9]{2,5}$') then
    raise exception 'FOREIGN_TAKE' using errcode = 'P0001';
  end if;
  if p_duration_ms is null or p_duration_ms < 0 or p_duration_ms > 600000 then
    raise exception 'TAKE_INVALID' using errcode = 'P0001';
  end if;

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
$function$;

-- ── 4. Les invitations : qui a invite qui, et combien ───────────────────
--
-- N'importe quel invite peut en inviter d'autres : c'est un jeu entre
-- amis, et c'est voulu. Mais sans limite, un seul compte pouvait remplir
-- la liste, et chacun voyait l'adresse de tous. Un membre invite au plus
-- trente personnes et ne voit que les siennes ; un administrateur voit
-- tout et n'a pas de plafond.

alter table public.allowed_emails
  add column if not exists invited_by uuid references auth.users(id) on delete set null;

create or replace function public.allow_guest(p_email text)
 returns text
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
declare
  v_email text := lower(btrim(p_email));
  v_admin boolean := app_is_admin();
begin
  if not app_is_allowed() then
    raise exception 'NOT_ALLOWED' using errcode = 'P0001';
  end if;
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' or length(v_email) > 254 then
    raise exception 'INVALID_EMAIL' using errcode = 'P0001';
  end if;
  if not v_admin
     and not exists (select 1 from allowed_emails where lower(email) = v_email)
     and (select count(*) from allowed_emails where invited_by = auth.uid()) >= 30 then
    raise exception 'INVITE_LIMIT' using errcode = 'P0001';
  end if;

  insert into allowed_emails (email, invited_by) values (v_email, auth.uid())
  on conflict (email) do update
    set banned_at = case when v_admin then null else allowed_emails.banned_at end;

  return v_email;
end;
$function$;

create or replace function public.list_guests()
 returns table(email text, added_at timestamp with time zone, has_account boolean, role text, banned boolean, can_remove boolean)
 language plpgsql
 stable security definer
 set search_path to 'public', 'pg_temp'
as $function$
begin
  if not app_is_allowed() then
    raise exception 'NOT_ALLOWED' using errcode = 'P0001';
  end if;

  return query
  select
    a.email,
    a.added_at,
    exists (select 1 from auth.users u where lower(u.email) = lower(a.email)),
    a.role,
    a.banned_at is not null,
    -- Retirer quelqu'un est un geste d'administrateur. Un proprietaire ne
    -- se retire jamais ; un administrateur, seulement par un proprietaire ;
    -- et personne ne se retire soi-meme.
    app_is_admin()
      and lower(a.email) <> app_current_email()
      and a.role <> 'owner'
      and (a.role <> 'admin' or app_is_owner())
  from allowed_emails a
  -- Un administrateur voit toute la liste ; un membre, ceux qu'il a invites.
  where app_is_admin() or a.invited_by = auth.uid()
  order by
    case a.role when 'owner' then 0 when 'admin' then 1 else 2 end,
    a.added_at;
end;
$function$;
