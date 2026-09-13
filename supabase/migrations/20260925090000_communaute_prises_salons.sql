-- ════════════════════════════════════════════════════════════════════
-- Communaute, reglages de prise et salons qui se ferment.
--
--  1. Une scene publiee porte obligatoirement sa langue et son genre, et
--     des etiquettes (#starwars) pour la retrouver. Une scene importee
--     par fichier devient publiable : on partage le decoupage, jamais la
--     video.
--  2. Chaque scene du catalogue a sa page, et ses commentaires notes.
--  3. Le decalage micro et le gain se reglent prise par prise.
--  4. Un salon ouvert depuis plus d'une heure se ferme tout seul.
-- ════════════════════════════════════════════════════════════════════

-- ── 1. Etiquettes et criteres ────────────────────────────────────────

alter table packs add column if not exists tags text[] not null default '{}';

-- Une recette sans lien : la scene venait d'un fichier. Ceux qui la
-- rejouent apportent leur video, comme pour n'importe quelle recette.
alter table packs drop constraint if exists packs_payload_check;
alter table packs add constraint packs_payload_check check (
  (kind = 'media' and video_path is not null and stem_voice_path is not null
    and stem_music_path is not null)
  or kind = 'url'
);

/*
 * Des etiquettes propres, quoi qu'on tape.
 *
 * « #Star Wars », « starwars » et « STARWARS » doivent tomber sur la meme
 * etiquette, sinon la recherche en trouve une sur trois. Minuscules, sans
 * diese ni espace ni ponctuation, deux a trente caracteres, dix au plus,
 * sans doublon, dans l'ordre ou elles ont ete tapees.
 */
create or replace function app_normaliser_tags(p_tags text[])
returns text[]
language sql
immutable
set search_path = public, pg_temp
as $$
  select coalesce((array_agg(tag order by premier))[1:10], '{}')
  from (
    select tag, min(rang) as premier
    from (
      select
        left(regexp_replace(lower(btrim(brut)), '[^[:alnum:]_-]+', '', 'g'), 30) as tag,
        rang
      from unnest(coalesce(p_tags, '{}'::text[])) with ordinality as u(brut, rang)
    ) nettoyees
    where char_length(tag) >= 2
    group by tag
  ) uniques;
$$;

create or replace function app_genre_valide(p_genre text)
returns boolean
language sql
immutable
set search_path = public, pg_temp
as $$
  select coalesce(p_genre = any (enum_range(null::pack_genre)::text[]), false);
$$;

drop function if exists publish_recipe_pack(uuid, text, text, text);

create or replace function publish_recipe_pack(
  p_session_id uuid,
  p_title text,
  p_source_lang text,
  p_genre text,
  p_tags text[] default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session sessions;
  v_pack_id uuid;
  v_characters int;
  v_title text := nullif(btrim(coalesce(p_title, '')), '');
  v_lang text := lower(btrim(coalesce(p_source_lang, '')));
begin
  select * into v_session from sessions where id = p_session_id;
  if not found then
    raise exception 'SESSION_NOT_FOUND' using errcode = 'P0002';
  end if;
  if not app_is_host(p_session_id) then
    raise exception 'HOST_ONLY' using errcode = 'P0001';
  end if;
  if v_session.published_pack_id is not null then
    raise exception 'ALREADY_PUBLISHED' using errcode = 'P0001';
  end if;
  if v_session.from_pack_id is not null then
    raise exception 'ALREADY_IN_CATALOGUE' using errcode = 'P0001';
  end if;

  -- Les trois criteres sans lesquels le catalogue ne se trie plus.
  if v_title is null then
    raise exception 'PACK_TITLE_REQUIRED' using errcode = 'P0001';
  end if;
  if v_lang !~ '^[a-z]{2}$' then
    raise exception 'PACK_LANG_REQUIRED' using errcode = 'P0001';
  end if;
  if not app_genre_valide(p_genre) then
    raise exception 'PACK_GENRE_REQUIRED' using errcode = 'P0001';
  end if;

  select count(*) into v_characters
  from characters where session_id = p_session_id;
  if v_characters = 0 then
    raise exception 'NOTHING_TO_PUBLISH' using errcode = 'P0001';
  end if;

  insert into packs (
    created_by, title, duration_ms, kind, source_url, source_session_id,
    voice_peaks, voice_peaks_hz, character_count, line_count,
    source_lang, genre, tags
  )
  values (
    auth.uid(),
    left(v_title, 120),
    coalesce(v_session.duration_ms, 0),
    'url',
    -- Seul un lien se partage. Un fichier importe reste chez celui qui
    -- l'a apporte : la recette ne garde que le decoupage.
    case when v_session.source_type = 'youtube' then v_session.source_ref end,
    v_session.id,
    v_session.voice_peaks,
    v_session.voice_peaks_hz,
    v_characters,
    (select count(*) from lines where session_id = p_session_id and not is_deleted),
    v_lang,
    p_genre::pack_genre,
    app_normaliser_tags(p_tags)
  )
  returning id into v_pack_id;

  with copied as (
    insert into pack_characters (pack_id, speaker_key, name, color, sort_order)
    select v_pack_id, c.speaker_key, c.name, c.color, c.sort_order
    from characters c
    where c.session_id = p_session_id
    returning id, speaker_key
  )
  insert into pack_lines (
    pack_id, pack_character_id, start_ms, end_ms, text, words, is_deleted
  )
  select v_pack_id, copied.id, l.start_ms, l.end_ms, l.text, l.words, l.is_deleted
  from lines l
  join characters c on c.id = l.character_id
  join copied on copied.speaker_key = c.speaker_key
  where l.session_id = p_session_id;

  update sessions set published_pack_id = v_pack_id where id = p_session_id;

  return v_pack_id;
end;
$$;

drop function if exists set_pack_facets(uuid, text, text);

-- Retoucher une scene publiee : son auteur, ou un administrateur.
create or replace function set_pack_facets(
  p_pack_id uuid,
  p_title text,
  p_source_lang text,
  p_genre text,
  p_tags text[]
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_title text := nullif(btrim(coalesce(p_title, '')), '');
  v_lang text := lower(btrim(coalesce(p_source_lang, '')));
begin
  if not exists (
    select 1 from packs
    where id = p_pack_id and (created_by = auth.uid() or app_is_admin())
  ) then
    raise exception 'PACK_FORBIDDEN' using errcode = 'P0001';
  end if;
  if v_title is null then
    raise exception 'PACK_TITLE_REQUIRED' using errcode = 'P0001';
  end if;
  if v_lang !~ '^[a-z]{2}$' then
    raise exception 'PACK_LANG_REQUIRED' using errcode = 'P0001';
  end if;
  if not app_genre_valide(p_genre) then
    raise exception 'PACK_GENRE_REQUIRED' using errcode = 'P0001';
  end if;

  update packs
  set title = left(v_title, 120),
      source_lang = v_lang,
      genre = p_genre::pack_genre,
      tags = app_normaliser_tags(p_tags)
  where id = p_pack_id;
end;
$$;

-- Le choix de garder une scene a la creation disparait : il publiait sans
-- langue ni genre. On publie desormais depuis l'ecran du resultat, ou les
-- criteres sont demandes.
update sessions set keep_as_pack = false where keep_as_pack;

-- ── 2. Commentaires ──────────────────────────────────────────────────

create table if not exists pack_comments (
  id uuid primary key default gen_random_uuid(),
  pack_id uuid not null references packs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists pack_comments_pack_idx on pack_comments (pack_id, created_at desc);
create index if not exists pack_comments_user_idx on pack_comments (user_id, created_at desc);

create table if not exists pack_comment_votes (
  comment_id uuid not null references pack_comments (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

-- Aucune politique : tout passe par les fonctions ci-dessous, qui
-- verifient l'invitation. Une lecture directe ne rend rien.
alter table pack_comments enable row level security;
alter table pack_comment_votes enable row level security;
revoke all on pack_comments, pack_comment_votes from anon, authenticated;

/** Le nom qu'on affiche : celui du profil, a defaut le debut de l'adresse. */
create or replace function app_nom_public(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select nullif(btrim(display_name), '') from profiles where user_id = p_user_id),
    (select split_part(email, '@', 1) from auth.users where id = p_user_id),
    '?'
  );
$$;

revoke all on function app_nom_public(uuid) from public, anon, authenticated;

create or replace function list_pack_comments(p_pack_id uuid)
returns table (
  id uuid,
  body text,
  created_at timestamptz,
  author_name text,
  author_avatar text,
  is_mine boolean,
  can_delete boolean,
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
    c.body,
    c.created_at,
    app_nom_public(c.user_id),
    (select avatar_path from profiles where user_id = c.user_id),
    c.user_id = auth.uid(),
    c.user_id = auth.uid() or app_is_admin(),
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
  where c.pack_id = p_pack_id and app_is_allowed()
  order by c.created_at desc;
$$;

create or replace function add_pack_comment(p_pack_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_body text := btrim(coalesce(p_body, ''));
  v_id uuid;
begin
  if not app_is_allowed() then
    raise exception 'NOT_ALLOWED' using errcode = 'P0001';
  end if;
  if not exists (select 1 from packs where id = p_pack_id) then
    raise exception 'PACK_NOT_FOUND' using errcode = 'P0002';
  end if;
  if v_body = '' then
    raise exception 'COMMENT_EMPTY' using errcode = 'P0001';
  end if;
  if char_length(v_body) > 1000 then
    raise exception 'COMMENT_TOO_LONG' using errcode = 'P0001';
  end if;
  -- Un double clic ne doit pas publier deux fois le meme message.
  if exists (
    select 1 from pack_comments
    where user_id = auth.uid() and created_at > now() - interval '5 seconds'
  ) then
    raise exception 'COMMENT_TOO_FAST' using errcode = 'P0001';
  end if;

  insert into pack_comments (pack_id, user_id, body)
  values (p_pack_id, auth.uid(), v_body)
  returning id into v_id;
  return v_id;
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
  where id = p_comment_id and (user_id = auth.uid() or app_is_admin());
  if not found then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
end;
$$;

-- Meme regle que pour les scenes : revoter la meme valeur retire le vote.
create or replace function vote_pack_comment(p_comment_id uuid, p_value integer)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_existing smallint;
begin
  if not app_is_allowed() then
    raise exception 'NOT_ALLOWED' using errcode = 'P0001';
  end if;
  if p_value not in (-1, 0, 1) then
    raise exception 'BAD_VOTE' using errcode = 'P0001';
  end if;
  if not exists (select 1 from pack_comments where id = p_comment_id) then
    raise exception 'COMMENT_NOT_FOUND' using errcode = 'P0002';
  end if;

  select value into v_existing
  from pack_comment_votes where comment_id = p_comment_id and user_id = auth.uid();

  if p_value = 0 or v_existing = p_value then
    delete from pack_comment_votes
    where comment_id = p_comment_id and user_id = auth.uid();
    return 0;
  end if;

  insert into pack_comment_votes (comment_id, user_id, value)
  values (p_comment_id, auth.uid(), p_value::smallint)
  on conflict (comment_id, user_id) do update set value = excluded.value;
  return p_value;
end;
$$;

-- Le catalogue rend aussi les etiquettes, l'auteur et le nombre d'avis.
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
  comment_count integer
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
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
        select jsonb_agg(
          jsonb_build_object('name', pc.name, 'color', pc.color)
          order by pc.sort_order
        )
        from pack_characters pc
        where pc.pack_id = p.id
      ),
      '[]'::jsonb
    ) as characters,
    p.tags,
    app_nom_public(p.created_by) as author_name,
    (select avatar_path from profiles where user_id = p.created_by) as author_avatar,
    p.created_by = auth.uid() or app_is_admin() as can_edit,
    (select count(*) from pack_comments pcm where pcm.pack_id = p.id)::int as comment_count
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
  left join pack_votes mine
    on mine.pack_id = p.id and mine.user_id = auth.uid()
  where app_is_allowed()
  order by coalesce(v.score, 0) desc, p.created_at desc;
$$;

-- ── 3. Decalage micro et gain, prise par prise ───────────────────────

alter table takes add column if not exists mic_offset_ms integer not null default 0;
alter table takes add column if not exists gain_db numeric(3, 1) not null default 0;
alter table takes drop constraint if exists takes_gain_db_check;
alter table takes add constraint takes_gain_db_check check (gain_db between -12 and 12);

-- Le reglage « partout » du joueur : c'est lui que prend une prise neuve.
alter table participants add column if not exists gain_db numeric(3, 1) not null default 0;
alter table participants drop constraint if exists participants_gain_db_check;
alter table participants add constraint participants_gain_db_check check (gain_db between -12 and 12);

-- Les prises existantes gardent exactement le decalage qu'elles avaient.
update takes t
set mic_offset_ms = p.mic_offset_ms
from participants p
where p.id = t.participant_id and p.mic_offset_ms <> 0 and t.mic_offset_ms = 0;

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
    coalesce(v_prev.fx_reverb, 0), coalesce(v_prev.fx_pitch, 0), coalesce(v_prev.fx_tune, 0),
    coalesce(v_prev.mic_offset_ms, v_player.mic_offset_ms, 0),
    coalesce(v_prev.gain_db, v_player.gain_db, 0)
  )
  returning * into v_take;

  return v_take;
end;
$$;

/*
 * Regler le decalage et le gain d'une prise.
 *
 * `p_everywhere` etend la valeur a toutes mes prises de la scene, et en
 * fait le reglage de depart des suivantes. Une valeur `null` ne touche a
 * rien : on regle l'un sans l'autre.
 */
create or replace function set_take_mix(
  p_session_id uuid,
  p_take_id uuid,
  p_mic_offset_ms integer default null,
  p_gain_db numeric default null,
  p_everywhere boolean default false
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_me uuid;
  v_offset integer := case
    when p_mic_offset_ms is null then null
    else greatest(-300, least(300, p_mic_offset_ms))
  end;
  v_gain numeric := case
    when p_gain_db is null then null
    else round(greatest(-12, least(12, p_gain_db)), 1)
  end;
  v_count integer;
begin
  perform app_assert_status(p_session_id, array['recording']::session_status[]);
  v_me := app_my_participant(p_session_id);
  if v_me is null then
    raise exception 'NOT_A_PARTICIPANT' using errcode = 'P0001';
  end if;

  if p_everywhere then
    update participants
    set mic_offset_ms = coalesce(v_offset, mic_offset_ms),
        gain_db = coalesce(v_gain, gain_db)
    where id = v_me;

    update takes
    set mic_offset_ms = coalesce(v_offset, mic_offset_ms),
        gain_db = coalesce(v_gain, gain_db)
    where participant_id = v_me;
    get diagnostics v_count = row_count;
    return v_count;
  end if;

  if p_take_id is null then
    raise exception 'TAKE_NOT_FOUND' using errcode = 'P0002';
  end if;

  update takes
  set mic_offset_ms = coalesce(v_offset, mic_offset_ms),
      gain_db = coalesce(v_gain, gain_db)
  where id = p_take_id and participant_id = v_me;
  get diagnostics v_count = row_count;
  if v_count = 0 then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  return v_count;
end;
$$;

-- ── 4. Les salons se ferment apres une heure ─────────────────────────

alter table sessions add column if not exists lobby_opened_at timestamptz;

-- Les salons deja ouverts comptent depuis leur creation : ce sont des
-- salons oublies, pas des parties en cours.
update sessions set lobby_opened_at = created_at
where status = 'lobby' and lobby_opened_at is null;

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
  return new;
end;
$$;

drop trigger if exists sessions_salon_ouvert on sessions;
create trigger sessions_salon_ouvert
before insert or update of status on sessions
for each row execute function app_salon_ouvert();

/*
 * Un salon ferme ne bouge plus : personne n'y entre, personne ne s'y
 * declare pret, la partie ne s'y lance pas. L'hote peut le rouvrir, ou
 * supprimer la scene. La verification vit dans `app_assert_status`, le
 * passage oblige de toutes les actions du salon.
 */
create or replace function app_assert_status(p_session_id uuid, p_allowed session_status[])
returns session_status
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_status session_status;
  v_closed timestamptz;
begin
  select status, closed_at into v_status, v_closed from sessions where id = p_session_id;
  if v_status is null then
    raise exception 'SESSION_NOT_FOUND' using errcode = 'P0002';
  end if;
  if not (v_status = any (p_allowed)) then
    raise exception 'SESSION_LOCKED: statut % inattendu', v_status
      using errcode = 'P0001';
  end if;
  if v_status = 'lobby' and v_closed is not null then
    raise exception 'LOBBY_CLOSED' using errcode = 'P0001';
  end if;
  return v_status;
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

  -- Ceux qui y etaient deja peuvent revenir voir ; les autres, non.
  if v_session.status = 'lobby' and v_session.closed_at is not null
     and not exists (
       select 1 from participants
       where session_id = v_session.id and user_id = auth.uid()
     ) then
    raise exception 'LOBBY_CLOSED' using errcode = 'P0001';
  end if;

  insert into participants (session_id, user_id, display_name)
  values (v_session.id, auth.uid(), p_display_name)
  on conflict (session_id, user_id) do update
    set display_name = excluded.display_name
  where participants.is_kicked = false;

  return v_session;
end;
$$;

create or replace function reopen_lobby(p_session_id uuid)
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

  update sessions
  set closed_at = null, lobby_opened_at = now()
  where id = p_session_id and status = 'lobby'
  returning * into v_session;
  if not found then
    raise exception 'SESSION_LOCKED' using errcode = 'P0001';
  end if;
  return v_session;
end;
$$;

create or replace function app_fermer_salons()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  update sessions
  set closed_at = now()
  where status = 'lobby'
    and closed_at is null
    and lobby_opened_at < now() - interval '1 hour';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function app_fermer_salons() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'fermer-salons') then
    perform cron.unschedule('fermer-salons');
  end if;
  perform cron.schedule('fermer-salons', '*/5 * * * *', 'select public.app_fermer_salons()');
end;
$$;
