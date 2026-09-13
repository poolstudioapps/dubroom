-- Packs : lien d'origine obligatoire, retouche signalee, brouillon de pack.
--
-- 1. Un pack sans lien ne se rejoue pas : on ne sait ni l'apercevoir ni ou
--    recuperer la video. Le lien devient obligatoire a la publication et a
--    la retouche, quelle que soit l'origine de la scene.
-- 2. Quand son createur retouche un pack (titre, langue, genre, tags,
--    lien), la date est gardee : la fiche le signale.
-- 3. « Creer un pack » depuis la communaute renseigne la fiche des le
--    depart. Elle est gardee sur la scene (`pack_draft`) jusqu'a la
--    publication, qui se fait des la preparation, sans passer par le
--    lobby.

alter table packs add column if not exists edited_at timestamptz;
alter table sessions add column if not exists pack_draft jsonb;

-- ── Un lien qui ressemble a un lien ────────────────────────────────────
create or replace function app_lien_valide(p_url text)
returns boolean
language sql
immutable
as $$
  select p_url is not null
    and length(p_url) <= 500
    and p_url ~* '^https?://[^[:space:]/$.?#][^[:space:]]*$';
$$;

-- ── Le brouillon de pack, pose a la creation ───────────────────────────
create or replace function set_pack_draft(
  p_session_id uuid,
  p_source_url text,
  p_genre text default null,
  p_tags text[] default '{}'
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_url text := nullif(btrim(coalesce(p_source_url, '')), '');
  v_genre text := nullif(btrim(coalesce(p_genre, '')), '');
begin
  if not app_is_allowed() then
    raise exception 'NOT_ALLOWED' using errcode = 'P0001';
  end if;
  if not app_is_host(p_session_id) then
    raise exception 'HOST_ONLY' using errcode = 'P0001';
  end if;
  if not app_lien_valide(v_url) then
    raise exception 'PACK_URL_REQUIRED' using errcode = 'P0001';
  end if;
  if v_genre is not null and not app_genre_valide(v_genre) then
    raise exception 'PACK_GENRE_REQUIRED' using errcode = 'P0001';
  end if;

  update sessions
  set pack_draft = jsonb_build_object(
    'source_url', v_url,
    'genre', v_genre,
    'tags', to_jsonb(app_normaliser_tags(coalesce(p_tags, '{}')))
  )
  where id = p_session_id;
end;
$$;

-- ── Publier : le lien est exige ────────────────────────────────────────
drop function if exists publish_recipe_pack(uuid, text, text, text, text[]);

create function publish_recipe_pack(
  p_session_id uuid,
  p_title text,
  p_source_lang text,
  p_genre text,
  p_tags text[] default '{}',
  p_source_url text default null
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
  v_url text := nullif(btrim(coalesce(p_source_url, '')), '');
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

  -- Le lien : celui qu'on vient de saisir, sinon celui de la fiche de
  -- depart, sinon celui de la video YouTube importee.
  v_url := coalesce(
    v_url,
    nullif(btrim(v_session.pack_draft ->> 'source_url'), ''),
    case when v_session.source_type = 'youtube' then v_session.source_ref end
  );

  if v_title is null then
    raise exception 'PACK_TITLE_REQUIRED' using errcode = 'P0001';
  end if;
  if v_lang !~ '^[a-z]{2}$' then
    raise exception 'PACK_LANG_REQUIRED' using errcode = 'P0001';
  end if;
  if not app_genre_valide(p_genre) then
    raise exception 'PACK_GENRE_REQUIRED' using errcode = 'P0001';
  end if;
  if not app_lien_valide(v_url) then
    raise exception 'PACK_URL_REQUIRED' using errcode = 'P0001';
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
    v_url,
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

-- ── Retoucher : lien compris, et la retouche du createur se voit ───────
drop function if exists set_pack_facets(uuid, text, text, text, text[]);

create function set_pack_facets(
  p_pack_id uuid,
  p_title text,
  p_source_lang text,
  p_genre text,
  p_tags text[],
  p_source_url text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_pack packs;
  v_title text := nullif(btrim(coalesce(p_title, '')), '');
  v_lang text := lower(btrim(coalesce(p_source_lang, '')));
  v_url text := nullif(btrim(coalesce(p_source_url, '')), '');
  v_tags text[];
  v_change boolean;
begin
  select * into v_pack from packs where id = p_pack_id;
  if not found or not (v_pack.created_by = auth.uid() or app_is_admin()) then
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

  v_url := coalesce(v_url, v_pack.source_url);
  if not app_lien_valide(v_url) then
    raise exception 'PACK_URL_REQUIRED' using errcode = 'P0001';
  end if;

  v_tags := app_normaliser_tags(p_tags);
  v_change := left(v_title, 120) is distinct from v_pack.title
    or v_lang is distinct from v_pack.source_lang
    or p_genre is distinct from v_pack.genre::text
    or v_tags is distinct from v_pack.tags
    or v_url is distinct from v_pack.source_url;

  update packs
  set title = left(v_title, 120),
      source_lang = v_lang,
      genre = p_genre::pack_genre,
      tags = v_tags,
      source_url = v_url,
      -- Seule la retouche de son createur est signalee : un administrateur
      -- qui complete une fiche n'en change pas l'auteur.
      edited_at = case
        when v_change and v_pack.created_by = auth.uid() then now()
        else v_pack.edited_at
      end
  where id = p_pack_id;
end;
$$;

-- ── Le catalogue expose la date de retouche ────────────────────────────
drop function if exists list_packs();

create function list_packs()
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
  author_certified boolean,
  edited_at timestamptz
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
    coalesce(c.ok, false) as author_certified,
    p.edited_at
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
