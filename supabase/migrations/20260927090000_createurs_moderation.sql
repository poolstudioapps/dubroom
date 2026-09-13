-- ════════════════════════════════════════════════════════════════════
-- Createurs, certification, moderation des commentaires, invites.
--
--  1. Une scene porte la langue parlee des sa creation : elle guide la
--     transcription et pre-remplit la publication.
--  2. La liste des invites dit le role de chacun et qui peut le retirer.
--  3. Les commentaires vivent aussi sur les profils, acceptent des
--     reponses et des signalements. Cinq signalements retirent un
--     commentaire et avertissent son auteur ; trois avertissements
--     suspendent le compte.
--  4. Chaque createur a un profil public et peut etre certifie.
-- ════════════════════════════════════════════════════════════════════

-- ── 1. La langue de la scene ─────────────────────────────────────────

alter table sessions add column if not exists source_lang text;
alter table sessions drop constraint if exists sessions_source_lang_check;
alter table sessions add constraint sessions_source_lang_check
  check (source_lang is null or source_lang ~ '^[a-z]{2}$');

drop function if exists create_session(text, text, text, text, text, boolean, boolean);

create or replace function create_session(
  p_code text,
  p_title text,
  p_source_type text,
  p_source_ref text,
  p_display_name text,
  p_keep_as_pack boolean default false,
  p_is_song boolean default false,
  p_source_lang text default null
)
returns sessions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session sessions;
  v_keep boolean;
  v_lang text := nullif(lower(btrim(coalesce(p_source_lang, ''))), '');
begin
  if not app_is_allowed() then
    raise exception 'NOT_ALLOWED' using errcode = 'P0001';
  end if;
  if p_source_type = 'youtube' and not app_is_admin() then
    raise exception 'ADMIN_ONLY' using errcode = 'P0001';
  end if;
  if v_lang is not null and v_lang !~ '^[a-z]{2}$' then
    raise exception 'PACK_LANG_REQUIRED' using errcode = 'P0001';
  end if;

  v_keep := coalesce(p_keep_as_pack, false)
            and app_pack_eligible(p_source_type, p_source_ref);

  insert into sessions (
    code, host_id, title, source_type, source_ref, status, keep_as_pack, is_song, source_lang
  )
  values (
    upper(p_code), auth.uid(), nullif(p_title, ''), p_source_type,
    nullif(p_source_ref, ''), 'draft', v_keep, coalesce(p_is_song, false), v_lang
  )
  returning * into v_session;

  insert into participants (session_id, user_id, display_name, is_host)
  values (v_session.id, auth.uid(), p_display_name, true);

  return v_session;
end;
$$;

-- ── 2. Invites : role, suspension, droit de retrait ──────────────────

alter table allowed_emails add column if not exists banned_at timestamptz;

-- Un compte suspendu n'est plus invite : toutes les politiques qui
-- s'appuient sur cette fonction lui ferment la porte d'un coup.
create or replace function app_is_allowed()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from allowed_emails
    where lower(email) = app_current_email() and banned_at is null
  );
$$;

drop function if exists list_guests();

create or replace function list_guests()
returns table (
  email text,
  added_at timestamptz,
  has_account boolean,
  role text,
  banned boolean,
  can_remove boolean
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
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
  order by
    case a.role when 'owner' then 0 when 'admin' then 1 else 2 end,
    a.added_at;
end;
$$;

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
  if not app_is_admin() then
    raise exception 'ADMIN_ONLY' using errcode = 'P0001';
  end if;
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

-- Reinviter une adresse suspendue la reactive, mais seulement pour un
-- administrateur : un membre ne leve pas une suspension.
create or replace function allow_guest(p_email text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := lower(btrim(p_email));
begin
  if not app_is_allowed() then
    raise exception 'NOT_ALLOWED' using errcode = 'P0001';
  end if;
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'INVALID_EMAIL' using errcode = 'P0001';
  end if;

  insert into allowed_emails (email) values (v_email)
  on conflict (email) do update
    set banned_at = case when app_is_admin() then null else allowed_emails.banned_at end;

  return v_email;
end;
$$;

-- ── 3. Commentaires : profils, reponses, signalements ────────────────

alter table pack_comments alter column pack_id drop not null;
alter table pack_comments add column if not exists profile_id uuid references auth.users (id) on delete cascade;
alter table pack_comments add column if not exists parent_id uuid references pack_comments (id) on delete cascade;
alter table pack_comments drop constraint if exists pack_comments_cible;
alter table pack_comments add constraint pack_comments_cible
  check ((pack_id is null) <> (profile_id is null));
create index if not exists pack_comments_profile_idx on pack_comments (profile_id, created_at desc);
create index if not exists pack_comments_parent_idx on pack_comments (parent_id);

create table if not exists comment_reports (
  comment_id uuid not null references pack_comments (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, reporter_id)
);

create table if not exists user_warnings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  excerpt text not null,
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz
);
create index if not exists user_warnings_user_idx on user_warnings (user_id, created_at desc);

alter table comment_reports enable row level security;
alter table user_warnings enable row level security;
revoke all on comment_reports, user_warnings from anon, authenticated;

-- ── 4. Createurs et certification ────────────────────────────────────

/*
 * Ce qu'un createur a publie, et ce qu'on en a pense.
 *
 * `packs_10up` compte les scenes qui ont recu au moins dix avis positifs :
 * c'est le premier chemin vers la certification, qui recompense la
 * regularite plutot qu'un seul succes.
 */
create or replace function app_creator_stats(p_user_id uuid)
returns table (pack_count int, up_total int, down_total int, packs_10up int)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    count(p.id)::int,
    coalesce(sum(v.up), 0)::int,
    coalesce(sum(v.down), 0)::int,
    count(p.id) filter (where coalesce(v.up, 0) >= 10)::int
  from packs p
  left join (
    select
      pack_id,
      count(*) filter (where value = 1) as up,
      count(*) filter (where value = -1) as down
    from pack_votes
    group by pack_id
  ) v on v.pack_id = p.id
  where p.created_by = p_user_id;
$$;

/*
 * Certifie : cinquante scenes a dix avis positifs chacune, ou cinq mille
 * avis positifs au total. Les deux seuils vivent ici et nulle part
 * ailleurs : l'interface les lit dans le profil.
 */
create or replace function app_is_certified(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(s.packs_10up >= 50 or s.up_total >= 5000, false)
  from app_creator_stats(p_user_id) s;
$$;

revoke all on function app_creator_stats(uuid) from public, anon;
revoke all on function app_is_certified(uuid) from public, anon;

create or replace function get_creator_profile(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_stats record;
  v_created timestamptz;
begin
  if not app_is_allowed() then
    raise exception 'NOT_ALLOWED' using errcode = 'P0001';
  end if;

  select coalesce(p.created_at, u.created_at) into v_created
  from auth.users u left join profiles p on p.user_id = u.id
  where u.id = p_user_id;
  if not found then
    raise exception 'PROFILE_NOT_FOUND' using errcode = 'P0002';
  end if;

  select * into v_stats from app_creator_stats(p_user_id);

  return jsonb_build_object(
    'user_id', p_user_id,
    'display_name', app_nom_public(p_user_id),
    'avatar_path', (select avatar_path from profiles where user_id = p_user_id),
    'member_since', v_created,
    'is_me', p_user_id = auth.uid(),
    'pack_count', v_stats.pack_count,
    'up_total', v_stats.up_total,
    'down_total', v_stats.down_total,
    'packs_10up', v_stats.packs_10up,
    'certified', v_stats.packs_10up >= 50 or v_stats.up_total >= 5000,
    'certified_via', case
      when v_stats.packs_10up >= 50 then 'packs'
      when v_stats.up_total >= 5000 then 'votes'
    end,
    'cert_packs_goal', 50,
    'cert_min_up', 10,
    'cert_votes_goal', 5000,
    'comment_count', (select count(*) from pack_comments where profile_id = p_user_id)
  );
end;
$$;

-- ── Les commentaires, pour une scene ou pour un profil ───────────────

create or replace function app_list_comments(p_pack_id uuid, p_profile_id uuid)
returns table (
  id uuid,
  parent_id uuid,
  body text,
  created_at timestamptz,
  author_id uuid,
  author_name text,
  author_avatar text,
  author_certified boolean,
  is_mine boolean,
  can_delete boolean,
  can_report boolean,
  score integer,
  up_count integer,
  down_count integer,
  my_vote integer
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    c.id,
    c.parent_id,
    c.body,
    c.created_at,
    c.user_id,
    app_nom_public(c.user_id),
    (select avatar_path from profiles where user_id = c.user_id),
    app_is_certified(c.user_id),
    c.user_id = auth.uid(),
    -- L'auteur, un administrateur, ou la personne dont c'est le profil.
    c.user_id = auth.uid() or app_is_admin() or c.profile_id = auth.uid(),
    c.user_id <> auth.uid()
      and not exists (
        select 1 from comment_reports r
        where r.comment_id = c.id and r.reporter_id = auth.uid()
      ),
    coalesce(v.score, 0)::int,
    coalesce(v.up_count, 0)::int,
    coalesce(v.down_count, 0)::int,
    coalesce(mine.value, 0)::int
  from pack_comments c
  left join (
    select
      comment_id,
      sum(value) as score,
      count(*) filter (where value = 1) as up_count,
      count(*) filter (where value = -1) as down_count
    from pack_comment_votes
    group by comment_id
  ) v on v.comment_id = c.id
  left join pack_comment_votes mine
    on mine.comment_id = c.id and mine.user_id = auth.uid()
  where app_is_allowed()
    and (
      (p_pack_id is not null and c.pack_id = p_pack_id)
      or (p_profile_id is not null and c.profile_id = p_profile_id)
    )
  order by c.created_at desc;
$$;

revoke all on function app_list_comments(uuid, uuid) from public, anon;

-- Le type de retour change : la fonction se recree plutot que de se
-- remplacer.
drop function if exists list_pack_comments(uuid);

create or replace function list_pack_comments(p_pack_id uuid)
returns table (
  id uuid, parent_id uuid, body text, created_at timestamptz, author_id uuid,
  author_name text, author_avatar text, author_certified boolean, is_mine boolean,
  can_delete boolean, can_report boolean, score integer, up_count integer,
  down_count integer, my_vote integer
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$ select * from app_list_comments(p_pack_id, null); $$;

create or replace function list_profile_comments(p_user_id uuid)
returns table (
  id uuid, parent_id uuid, body text, created_at timestamptz, author_id uuid,
  author_name text, author_avatar text, author_certified boolean, is_mine boolean,
  can_delete boolean, can_report boolean, score integer, up_count integer,
  down_count integer, my_vote integer
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$ select * from app_list_comments(null, p_user_id); $$;

create or replace function app_add_comment(
  p_pack_id uuid,
  p_profile_id uuid,
  p_body text,
  p_parent_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_body text := btrim(coalesce(p_body, ''));
  v_parent pack_comments;
  v_racine uuid;
  v_id uuid;
begin
  if not app_is_allowed() then
    raise exception 'NOT_ALLOWED' using errcode = 'P0001';
  end if;
  if v_body = '' then
    raise exception 'COMMENT_EMPTY' using errcode = 'P0001';
  end if;
  if char_length(v_body) > 1000 then
    raise exception 'COMMENT_TOO_LONG' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from pack_comments
    where user_id = auth.uid() and created_at > now() - interval '5 seconds'
  ) then
    raise exception 'COMMENT_TOO_FAST' using errcode = 'P0001';
  end if;

  if p_parent_id is not null then
    select * into v_parent from pack_comments where id = p_parent_id;
    if not found then
      raise exception 'COMMENT_NOT_FOUND' using errcode = 'P0002';
    end if;
    -- Une reponse vit sous la meme scene ou le meme profil que ce a quoi
    -- elle repond, et les fils ne s'enfoncent pas : repondre a une
    -- reponse range sous le premier commentaire.
    if v_parent.pack_id is distinct from p_pack_id
       or v_parent.profile_id is distinct from p_profile_id then
      raise exception 'CROSS_SESSION' using errcode = 'P0001';
    end if;
    v_racine := coalesce(v_parent.parent_id, v_parent.id);
  end if;

  insert into pack_comments (pack_id, profile_id, parent_id, user_id, body)
  values (p_pack_id, p_profile_id, v_racine, auth.uid(), v_body)
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function app_add_comment(uuid, uuid, text, uuid) from public, anon;

drop function if exists add_pack_comment(uuid, text);

create or replace function add_pack_comment(p_pack_id uuid, p_body text, p_parent_id uuid default null)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (select 1 from packs where id = p_pack_id) then
    raise exception 'PACK_NOT_FOUND' using errcode = 'P0002';
  end if;
  return app_add_comment(p_pack_id, null, p_body, p_parent_id);
end;
$$;

create or replace function add_profile_comment(p_user_id uuid, p_body text, p_parent_id uuid default null)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'PROFILE_NOT_FOUND' using errcode = 'P0002';
  end if;
  return app_add_comment(null, p_user_id, p_body, p_parent_id);
end;
$$;

create or replace function delete_pack_comment(p_comment_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  delete from pack_comments
  where id = p_comment_id
    and (user_id = auth.uid() or app_is_admin() or profile_id = auth.uid());
  if not found then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
end;
$$;

/*
 * Signaler un commentaire.
 *
 * Un signalement par personne. Au cinquieme, le commentaire disparait et
 * son auteur recoit un avertissement ; au troisieme avertissement, son
 * acces est suspendu. Les proprietaires du projet ne sont jamais
 * suspendus : sans eux, personne ne pourrait lever une suspension.
 */
create or replace function report_comment(p_comment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_comment pack_comments;
  v_reports int;
  v_warnings int;
  v_banned boolean := false;
begin
  if not app_is_allowed() then
    raise exception 'NOT_ALLOWED' using errcode = 'P0001';
  end if;

  select * into v_comment from pack_comments where id = p_comment_id;
  if not found then
    raise exception 'COMMENT_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_comment.user_id = auth.uid() then
    raise exception 'CANNOT_REPORT_SELF' using errcode = 'P0001';
  end if;

  insert into comment_reports (comment_id, reporter_id)
  values (p_comment_id, auth.uid())
  on conflict do nothing;

  select count(*) into v_reports from comment_reports where comment_id = p_comment_id;
  if v_reports < 5 then
    return jsonb_build_object('removed', false, 'reports', v_reports);
  end if;

  insert into user_warnings (user_id, excerpt)
  values (v_comment.user_id, left(v_comment.body, 280));
  delete from pack_comments where id = p_comment_id;

  select count(*) into v_warnings from user_warnings where user_id = v_comment.user_id;
  if v_warnings >= 3 then
    update allowed_emails
    set banned_at = coalesce(banned_at, now())
    where lower(email) = (select lower(email) from auth.users where id = v_comment.user_id)
      and role <> 'owner';
    v_banned := found;
  end if;

  return jsonb_build_object('removed', true, 'reports', v_reports, 'banned', v_banned);
end;
$$;

-- Ce que la moderation dit a la personne concernee. Lisible meme
-- suspendue : c'est la seule chose qu'elle peut encore lire.
create or replace function my_moderation()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'banned', exists (
      select 1 from allowed_emails
      where lower(email) = app_current_email() and banned_at is not null
    ),
    'warning_count', (select count(*) from user_warnings where user_id = auth.uid()),
    'warnings', coalesce((
      select jsonb_agg(jsonb_build_object('id', w.id, 'excerpt', w.excerpt, 'created_at', w.created_at)
                       order by w.created_at)
      from user_warnings w
      where w.user_id = auth.uid() and w.acknowledged_at is null
    ), '[]'::jsonb)
  );
$$;

create or replace function acknowledge_warnings()
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update user_warnings set acknowledged_at = now()
  where user_id = auth.uid() and acknowledged_at is null;
$$;

-- ── Le catalogue connait ses createurs ───────────────────────────────

drop function if exists list_packs();

create or replace function list_packs()
returns table (
  id uuid,
  title text,
  kind text,
  source_url text,
  description text,
  duration_ms integer,
  character_count integer,
  line_count integer,
  size_bytes bigint,
  created_at timestamptz,
  is_mine boolean,
  score integer,
  up_count integer,
  down_count integer,
  my_vote integer,
  source_lang text,
  genre text,
  characters jsonb,
  tags text[],
  author_name text,
  author_avatar text,
  can_edit boolean,
  comment_count integer,
  author_id uuid,
  author_certified boolean
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with certifies as (
    select distinct p.created_by as user_id, app_is_certified(p.created_by) as ok
    from packs p
  )
  select
    p.id,
    p.title,
    p.kind,
    p.source_url,
    p.description,
    p.duration_ms,
    p.character_count,
    p.line_count,
    p.size_bytes,
    p.created_at,
    p.created_by = auth.uid() as is_mine,
    coalesce(v.score, 0)::int as score,
    coalesce(v.up_count, 0)::int as up_count,
    coalesce(v.down_count, 0)::int as down_count,
    coalesce(mine.value, 0)::int as my_vote,
    p.source_lang,
    p.genre::text,
    coalesce(
      (
        select jsonb_agg(jsonb_build_object('name', pc.name, 'color', pc.color) order by pc.sort_order)
        from pack_characters pc
        where pc.pack_id = p.id
      ),
      '[]'::jsonb
    ) as characters,
    p.tags,
    app_nom_public(p.created_by) as author_name,
    (select avatar_path from profiles where user_id = p.created_by) as author_avatar,
    p.created_by = auth.uid() or app_is_admin() as can_edit,
    (select count(*) from pack_comments pcm where pcm.pack_id = p.id)::int as comment_count,
    p.created_by as author_id,
    coalesce(c.ok, false) as author_certified
  from packs p
  left join (
    select
      pack_id,
      sum(value) as score,
      count(*) filter (where value = 1) as up_count,
      count(*) filter (where value = -1) as down_count
    from pack_votes
    group by pack_id
  ) v on v.pack_id = p.id
  left join pack_votes mine on mine.pack_id = p.id and mine.user_id = auth.uid()
  left join certifies c on c.user_id = p.created_by
  where app_is_allowed()
  order by coalesce(v.score, 0) desc, p.created_at desc;
$$;
