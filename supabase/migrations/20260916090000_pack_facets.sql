-- DubRoom — de quoi trier le catalogue.
--
-- Une liste de scenes triee par score marche tant qu'elle en compte dix.
-- Au-dela, la question n'est plus « laquelle est la mieux decoupee » mais
-- « laquelle correspond a ce qu'on veut faire ce soir ». Et ce qu'on veut
-- faire, en pratique, tient en trois questions : dans quelle langue est
-- l'original, quel genre, et combien de temps ca va prendre.
--
-- Trois criteres, pas huit : au-dela, plus personne ne s'en sert et il
-- reste des listes deroulantes vides a remplir a chaque publication.

create type pack_genre as enum (
  'action',
  'comedie',
  'drame',
  'animation',
  'science_fiction',
  'horreur',
  'documentaire',
  'autre'
);

alter table packs
  -- Code ISO 639-1 de la langue parlee dans l'extrait. Ce n'est pas la
  -- langue de l'interface : on double un extrait anglais depuis une
  -- interface francaise tous les jours.
  add column source_lang text check (source_lang ~ '^[a-z]{2}$'),
  add column genre pack_genre not null default 'autre';

comment on column packs.source_lang is
  'Langue parlee dans l''extrait, code ISO 639-1. Nulle si inconnue.';

-- Le nombre de personnages decide a combien on peut y jouer, et c'est
-- la premiere chose qu'on regarde quand on est trois dans le salon.
create index packs_facets_idx on packs (genre, source_lang, character_count);

/**
 * Renseigner les criteres d'une scene publiee.
 *
 * Reserve a qui l'a publiee : ce sont ses metadonnees, et laisser tout
 * le monde les changer ferait du catalogue un terrain de bagarre.
 */
create or replace function set_pack_facets(
  p_pack_id uuid,
  p_source_lang text default null,
  p_genre text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from packs where id = p_pack_id and created_by = auth.uid()
  ) then
    raise exception 'OWNER_ONLY' using errcode = 'P0001';
  end if;

  update packs
  set source_lang = case
        when p_source_lang is null then source_lang
        when p_source_lang = '' then null
        else lower(p_source_lang)
      end,
      genre = coalesce(nullif(p_genre, '')::pack_genre, genre)
  where id = p_pack_id;
end;
$$;

-- `list_packs` rend les nouveaux champs. La signature de sortie change,
-- donc la fonction se recree entierement.
drop function if exists list_packs();

create function list_packs()
returns table (
  id uuid,
  title text,
  kind text,
  source_url text,
  description text,
  duration_ms int,
  character_count int,
  line_count int,
  size_bytes bigint,
  created_at timestamptz,
  is_mine boolean,
  score int,
  up_count int,
  down_count int,
  my_vote int,
  source_lang text,
  genre text,
  characters jsonb
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
    ) as characters
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

-- La publication d'une recette accepte desormais les criteres, pour ne
-- pas obliger a repasser par un second ecran juste apres.
create or replace function publish_recipe_pack(
  p_session_id uuid,
  p_title text default null,
  p_source_lang text default null,
  p_genre text default null
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
  if v_session.source_ref is null then
    raise exception 'NO_SOURCE_URL' using errcode = 'P0001';
  end if;

  select count(*) into v_characters
  from characters where session_id = p_session_id;
  if v_characters = 0 then
    raise exception 'NOTHING_TO_PUBLISH' using errcode = 'P0001';
  end if;

  insert into packs (
    created_by, title, duration_ms, kind, source_url, source_session_id,
    voice_peaks, voice_peaks_hz, character_count, line_count,
    source_lang, genre
  )
  values (
    auth.uid(),
    coalesce(nullif(btrim(coalesce(p_title, '')), ''), v_session.title, 'Scène sans titre'),
    coalesce(v_session.duration_ms, 0),
    'url',
    v_session.source_ref,
    v_session.id,
    v_session.voice_peaks,
    v_session.voice_peaks_hz,
    v_characters,
    (select count(*) from lines where session_id = p_session_id and not is_deleted),
    nullif(lower(coalesce(p_source_lang, '')), ''),
    coalesce(nullif(p_genre, '')::pack_genre, 'autre')
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

revoke execute on function set_pack_facets(uuid, text, text) from public;
revoke execute on function list_packs() from public;
revoke execute on function publish_recipe_pack(uuid, text, text, text) from public;

grant execute on function set_pack_facets(uuid, text, text) to authenticated, service_role;
grant execute on function list_packs() to authenticated, service_role;
grant execute on function publish_recipe_pack(uuid, text, text, text) to authenticated, service_role;
