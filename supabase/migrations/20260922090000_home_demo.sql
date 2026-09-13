-- Dub'Up — la scene de demonstration de l'accueil.
--
-- La bande rythmo de l'accueil jouait des repliques ecrites pour
-- l'occasion, sur un cadre vide. Elle joue maintenant une vraie scene :
-- la video tourne, et le texte de la preparation defile dessous, cale au
-- mot pres, exactement comme dans le studio.
--
-- La video n'est pas hebergee ici. Elle est lue depuis YouTube par son
-- lecteur integre, et seule la preparation vient de la base.
--
-- Trois pieces, chacune pour une raison :
--
--  - `packs.featured_home` designe la scene. Un index partiel garantit
--    qu'il n'y en a qu'une : changer de demonstration revient a deplacer
--    ce drapeau, sans deploiement.
--
--  - `pack_characters.public_name` donne un nom de vitrine. Les noms d'un
--    pack sont ceux que le groupe a choisis, et entre amis ils peuvent
--    etre des surnoms qui n'ont rien a faire sur une page publique. Le nom
--    d'origine reste intact ; la vitrine lit celui-ci s'il existe.
--
--  - `home_demo()` est la seule porte ouverte sans compte, et elle ne
--    s'ouvre que sur la scene designee. Le catalogue, lui, reste reserve
--    aux invites.

alter table packs
  add column if not exists featured_home boolean not null default false;

comment on column packs.featured_home is
  'Scène jouée en démonstration sur l’accueil. Une seule à la fois.';

create unique index if not exists packs_une_seule_en_vitrine
  on packs (featured_home)
  where featured_home;

alter table pack_characters
  add column if not exists public_name text;

comment on column pack_characters.public_name is
  'Nom affiché sur l’accueil quand ce pack y est en démonstration.';

create or replace function home_demo()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'source_url', p.source_url,
    'duration_ms', p.duration_ms,
    'characters', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'key', c.id,
          'name', coalesce(nullif(btrim(c.public_name), ''), c.name),
          'color', c.color
        )
        order by c.sort_order
      )
      from pack_characters c
      where c.pack_id = p.id
    ), '[]'::jsonb),
    'lines', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'start', l.start_ms,
          'end', l.end_ms,
          'text', l.text,
          'character', l.pack_character_id,
          'words', l.words
        )
        order by l.start_ms
      )
      from pack_lines l
      where l.pack_id = p.id and not l.is_deleted
    ), '[]'::jsonb)
  )
  from packs p
  where p.featured_home
    and p.kind = 'url'
    and p.source_url is not null
  limit 1;
$$;

revoke all on function home_demo() from public;
grant execute on function home_demo() to anon, authenticated;
