-- Salons et studios endormis, notifications, apercu public de la communaute.

-- ══ 1. Ce qui s'endort se ferme ═══════════════════════════════════════
--
-- Un salon ouvert, ou un studio ou plus aucune prise n'arrive, depuis
-- vingt minutes se ferme tout seul. Le salon ferme reste rouvrable par
-- l'hote ; le studio ferme renvoie ses joueurs a l'accueil.

alter table sessions add column if not exists recording_started_at timestamptz;

create or replace function app_salon_ouvert()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.status = 'lobby'
     and (tg_op = 'INSERT' or old.status is distinct from 'lobby') then
    new.lobby_opened_at := now();
    new.closed_at := null;
  end if;
  if new.status = 'recording'
     and (tg_op = 'INSERT' or old.status is distinct from 'recording') then
    new.recording_started_at := now();
    new.closed_at := null;
  end if;
  return new;
end;
$$;

create or replace function app_fermer_salons()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_salons integer;
  v_studios integer;
begin
  -- Le salon : vingt minutes depuis l'ouverture ou la derniere arrivee.
  update sessions s
  set closed_at = now()
  where s.status = 'lobby'
    and s.closed_at is null
    and greatest(
      s.lobby_opened_at,
      coalesce((select max(p.created_at) from participants p where p.session_id = s.id), '-infinity'::timestamptz)
    ) < now() - interval '20 minutes';
  get diagnostics v_salons = row_count;

  -- Le studio : vingt minutes sans nouvelle prise.
  update sessions s
  set closed_at = now()
  where s.status = 'recording'
    and s.closed_at is null
    and greatest(
      coalesce(s.recording_started_at, s.lobby_opened_at, s.created_at),
      coalesce(
        (select max(t.created_at) from takes t join clips c on c.id = t.clip_id where c.session_id = s.id),
        '-infinity'::timestamptz
      )
    ) < now() - interval '20 minutes';
  get diagnostics v_studios = row_count;

  return v_salons + v_studios;
end;
$$;

-- Une prise n'entre plus dans un studio ferme.
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

  -- Refaire une replique garde ses reglages. Une replique neuve part a
  -- plat pour les effets, et du reglage « partout » pour le reste.
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
    coalesce(v_prev.mic_offset_ms, v_player.mic_offset_ms, 0),
    coalesce(v_prev.gain_db, v_player.gain_db, 0)
  )
  returning * into v_take;

  return v_take;
end;
$$;

-- ══ 2. Les notifications ══════════════════════════════════════════════

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (
    kind in ('render_started', 'render_done', 'render_expiring', 'render_deleted', 'pack_like', 'comment')
  ),
  session_id uuid references sessions(id) on delete cascade,
  pack_id uuid references packs(id) on delete cascade,
  profile_id uuid references auth.users(id) on delete cascade,
  count integer not null default 1,
  actors text[] not null default '{}',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists notifications_user_idx on notifications (user_id, created_at desc);

alter table notifications enable row level security;
drop policy if exists notifications_select on notifications;
create policy notifications_select on notifications for select using (user_id = auth.uid());
revoke insert, update, delete on notifications from anon, authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table notifications;
  end if;
end;
$$;

/*
 * Pose une notification, en regroupant les likes et les commentaires.
 *
 * Tant qu'une notification du meme genre sur la meme scene (ou le meme
 * profil) n'est pas lue, les suivantes s'y ajoutent : « Léa et 2 autres
 * ont aimé… » plutot que trois lignes.
 */
create or replace function app_notifier(
  p_user uuid,
  p_kind text,
  p_session uuid,
  p_pack uuid,
  p_profile uuid,
  p_actor text,
  p_data jsonb
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_actors text[];
begin
  if p_user is null then
    return;
  end if;

  if p_kind in ('pack_like', 'comment') then
    select id, actors into v_id, v_actors
    from notifications
    where user_id = p_user
      and kind = p_kind
      and read_at is null
      and pack_id is not distinct from p_pack
      and profile_id is not distinct from p_profile
    order by created_at desc
    limit 1;

    if v_id is not null then
      update notifications
      set count = case when p_actor = any (v_actors) and p_kind = 'pack_like' then count else count + 1 end,
          actors = case
            when p_actor is null or p_actor = any (v_actors) then v_actors
            else (array_prepend(p_actor, v_actors))[1:3]
          end,
          data = data || coalesce(p_data, '{}'::jsonb),
          created_at = now()
      where id = v_id;
      return;
    end if;
  end if;

  insert into notifications (user_id, kind, session_id, pack_id, profile_id, actors, data)
  values (
    p_user, p_kind, p_session, p_pack, p_profile,
    case when p_actor is null then '{}'::text[] else array[p_actor] end,
    coalesce(p_data, '{}'::jsonb)
  );
end;
$$;

revoke all on function app_notifier(uuid, text, uuid, uuid, uuid, text, jsonb) from public, anon, authenticated;

-- Le montage : lance, termine, puis supprime.
create or replace function app_notifier_session()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_kind text;
  r record;
begin
  if new.status = 'render_queued'
     and old.status is distinct from 'render_queued'
     and old.status is distinct from 'rendering' then
    v_kind := 'render_started';
  elsif new.status = 'done' and new.render_path is not null
     and (old.status is distinct from 'done' or old.render_path is null) then
    v_kind := 'render_done';
  elsif new.render_deleted_at is not null and old.render_deleted_at is null then
    v_kind := 'render_deleted';
  else
    return new;
  end if;

  for r in
    select distinct user_id from participants
    where session_id = new.id and not is_kicked and user_id is not null
  loop
    perform app_notifier(
      r.user_id, v_kind, new.id, null, null, null,
      jsonb_build_object('title', coalesce(new.title, ''), 'code', new.code)
    );
  end loop;
  return new;
end;
$$;

drop trigger if exists sessions_notifier on sessions;
create trigger sessions_notifier
after update on sessions
for each row execute function app_notifier_session();

-- Un like sur une scene publiee.
create or replace function app_notifier_vote()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_pack packs;
begin
  if new.value <> 1 or (tg_op = 'UPDATE' and old.value = 1) then
    return new;
  end if;
  select * into v_pack from packs where id = new.pack_id;
  if v_pack.created_by is null or v_pack.created_by = new.user_id then
    return new;
  end if;
  perform app_notifier(
    v_pack.created_by, 'pack_like', null, v_pack.id, null,
    app_nom_public(new.user_id), jsonb_build_object('title', v_pack.title)
  );
  return new;
end;
$$;

drop trigger if exists pack_votes_notifier on pack_votes;
create trigger pack_votes_notifier
after insert or update on pack_votes
for each row execute function app_notifier_vote();

-- Un commentaire sur sa scene, sur son profil, ou une reponse.
create or replace function app_notifier_commentaire()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_auteur text := app_nom_public(new.user_id);
  v_pack packs;
  v_parent uuid;
  v_destinataire uuid;
begin
  if new.pack_id is not null then
    select * into v_pack from packs where id = new.pack_id;
    v_destinataire := v_pack.created_by;
    if v_destinataire is not null and v_destinataire <> new.user_id then
      perform app_notifier(
        v_destinataire, 'comment', null, new.pack_id, null, v_auteur,
        jsonb_build_object('title', v_pack.title)
      );
    end if;
  elsif new.profile_id is not null then
    v_destinataire := new.profile_id;
    if v_destinataire <> new.user_id then
      perform app_notifier(v_destinataire, 'comment', null, null, new.profile_id, v_auteur, '{}'::jsonb);
    end if;
  end if;

  if new.parent_id is not null then
    select user_id into v_parent from pack_comments where id = new.parent_id;
    if v_parent is not null and v_parent <> new.user_id
       and v_parent is distinct from v_destinataire then
      perform app_notifier(
        v_parent, 'comment', null, new.pack_id, new.profile_id, v_auteur,
        jsonb_build_object('title', coalesce(v_pack.title, ''), 'reply', true)
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists pack_comments_notifier on pack_comments;
create trigger pack_comments_notifier
after insert on pack_comments
for each row execute function app_notifier_commentaire();

-- La video va disparaitre : 10, 5 puis 1 minute avant.
create or replace function app_notifier_expirations()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r record;
  v_minutes integer;
  v_seuil integer;
  v_nouvelles integer := 0;
begin
  for r in
    select s.id, s.title, s.code, s.render_expires_at, p.user_id
    from sessions s
    join participants p on p.session_id = s.id and not p.is_kicked and p.user_id is not null
    where s.render_path is not null
      and s.render_expires_at > now()
      and s.render_expires_at <= now() + interval '10 minutes'
  loop
    v_minutes := ceil(extract(epoch from (r.render_expires_at - now())) / 60)::integer;
    v_seuil := case when v_minutes <= 1 then 1 when v_minutes <= 5 then 5 else 10 end;
    if not exists (
      select 1 from notifications
      where user_id = r.user_id and session_id = r.id and kind = 'render_expiring'
        and (data ->> 'minutes')::integer <= v_seuil
        -- Un nouveau montage repart de zero : on ne regarde que celui-ci.
        and created_at >= r.render_expires_at - interval '1 hour'
    ) then
      insert into notifications (user_id, kind, session_id, data)
      values (
        r.user_id, 'render_expiring', r.id,
        jsonb_build_object('title', coalesce(r.title, ''), 'code', r.code, 'minutes', v_seuil)
      );
      v_nouvelles := v_nouvelles + 1;
    end if;
  end loop;

  -- Un mois d'historique suffit.
  delete from notifications where created_at < now() - interval '30 days';
  return v_nouvelles;
end;
$$;

revoke all on function app_notifier_expirations() from public, anon, authenticated;

create or replace function list_notifications(p_limit integer default 30)
returns table (
  id uuid,
  kind text,
  session_code text,
  pack_id uuid,
  profile_id uuid,
  count integer,
  actors text[],
  data jsonb,
  created_at timestamptz,
  read_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select n.id, n.kind, s.code, n.pack_id, n.profile_id, n.count, n.actors, n.data, n.created_at, n.read_at
  from notifications n
  left join sessions s on s.id = n.session_id
  where n.user_id = auth.uid()
  order by n.created_at desc
  limit least(greatest(coalesce(p_limit, 30), 1), 100);
$$;

create or replace function mark_notifications_read()
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update notifications set read_at = now()
  where user_id = auth.uid() and read_at is null;
$$;

revoke all on function list_notifications(integer) from anon;
revoke all on function mark_notifications_read() from anon;

-- Les taches planifiees : chaque minute, pour tenir les seuils de 1 minute.
select cron.alter_job(jobid, schedule := '* * * * *') from cron.job where jobname = 'fermer-salons';
select cron.alter_job(jobid, schedule := '* * * * *') from cron.job where jobname = 'purger-rendus';
select cron.unschedule(jobid) from cron.job where jobname = 'notifier-expirations';
select cron.schedule('notifier-expirations', '* * * * *', 'select public.app_notifier_expirations()');

-- ══ 3. La communaute, vue sans compte ═════════════════════════════════
--
-- Les scenes les mieux notees, sans auteur ni commentaire : de quoi donner
-- envie, pas de quoi parcourir le catalogue.
create or replace function list_top_packs_public(p_limit integer default 9)
returns table (
  id uuid,
  title text,
  source_url text,
  duration_ms integer,
  line_count integer,
  character_count integer,
  genre text,
  source_lang text,
  tags text[],
  score integer,
  characters jsonb,
  total bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    p.id,
    p.title,
    p.source_url,
    p.duration_ms,
    p.line_count,
    p.character_count,
    p.genre::text,
    p.source_lang,
    p.tags,
    coalesce((select sum(v.value) from pack_votes v where v.pack_id = p.id), 0)::integer as score,
    coalesce(
      (
        select jsonb_agg(jsonb_build_object('name', pc.name, 'color', pc.color) order by pc.sort_order)
        from pack_characters pc
        where pc.pack_id = p.id
      ),
      '[]'::jsonb
    ) as characters,
    count(*) over () as total
  from packs p
  order by 10 desc, p.created_at desc
  limit least(greatest(coalesce(p_limit, 9), 1), 12);
$$;

grant execute on function list_top_packs_public(integer) to anon, authenticated;
