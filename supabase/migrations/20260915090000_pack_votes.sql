-- DubRoom — le jugement du groupe sur les scenes publiees.
--
-- Une scene preparee vaut par son decoupage : un mauvais decoupage donne
-- des repliques coupees au milieu, et la personne qui la lance perd sa
-- soiree sans savoir pourquoi. Le catalogue grossit, et rien ne distingue
-- une scene soignee d'une scene batclee.
--
-- Un vote par personne et par scene, dans un sens ou dans l'autre.

create table pack_votes (
  pack_id uuid not null references packs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  -- +1 ou -1. Un entier plutot qu'un booleen : la somme est alors une
  -- addition, et non un comptage conditionnel.
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (pack_id, user_id)
);

comment on table pack_votes is
  'Un avis par personne et par scene publiee. Revocable, modifiable.';

create index pack_votes_pack_idx on pack_votes (pack_id);

alter table pack_votes enable row level security;

-- Tout invite lit tous les votes : c'est ce qui permet d'afficher un
-- total. Personne n'ecrit a la place d'un autre.
create policy pack_votes_select on pack_votes
  for select to authenticated using (app_is_allowed());

create policy pack_votes_insert on pack_votes
  for insert to authenticated
  with check (user_id = auth.uid() and app_is_allowed());

create policy pack_votes_update on pack_votes
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy pack_votes_delete on pack_votes
  for delete to authenticated using (user_id = auth.uid());

/**
 * Voter, changer d'avis, ou retirer son vote.
 *
 * Revoter la meme valeur annule le vote : c'est le geste attendu partout
 * ailleurs, et il evite un deuxieme bouton pour defaire.
 */
create or replace function vote_pack(p_pack_id uuid, p_value int)
returns int
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

  select value into v_existing
  from pack_votes where pack_id = p_pack_id and user_id = auth.uid();

  if p_value = 0 or v_existing = p_value then
    delete from pack_votes where pack_id = p_pack_id and user_id = auth.uid();
    return 0;
  end if;

  insert into pack_votes (pack_id, user_id, value)
  values (p_pack_id, auth.uid(), p_value::smallint)
  on conflict (pack_id, user_id) do update set value = excluded.value;

  return p_value;
end;
$$;

-- `list_packs` doit rendre le score et mon propre vote. Les colonnes de
-- sortie changent, donc la fonction se recree entierement.
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
  -- Les mieux notees d'abord, puis les plus recentes : un catalogue trie
  -- par date seule enterre une bonne scene en une semaine.
  order by coalesce(v.score, 0) desc, p.created_at desc;
$$;

revoke execute on function vote_pack(uuid, int) from public;
revoke execute on function list_packs() from public;
grant execute on function vote_pack(uuid, int) to authenticated, service_role;
grant execute on function list_packs() to authenticated, service_role;
