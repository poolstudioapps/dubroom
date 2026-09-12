-- Le catalogue a besoin du lien pour afficher un apercu sans requete
-- supplementaire par carte.
drop function if exists list_packs();

create function list_packs()
returns table (
  id uuid,
  title text,
  description text,
  duration_ms int,
  character_count int,
  line_count int,
  size_bytes bigint,
  kind text,
  source_url text,
  created_at timestamptz,
  is_mine boolean,
  characters jsonb
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
    p.id, p.title, p.description, p.duration_ms,
    p.character_count, p.line_count, p.size_bytes, p.kind, p.source_url,
    p.created_at,
    p.created_by = auth.uid(),
    coalesce(
      (
        select jsonb_agg(
                 jsonb_build_object('name', c.name, 'color', c.color)
                 order by c.sort_order
               )
        from pack_characters c where c.pack_id = p.id
      ),
      '[]'::jsonb
    )
  from packs p
  order by p.created_at desc;
end;
$$;

grant execute on function list_packs() to authenticated;
