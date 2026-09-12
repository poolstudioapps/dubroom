-- Dub’Up — le compte.
--
-- Jusqu'ici, un joueur n'existait que dans une scene : son nom etait
-- devine depuis son adresse e-mail a chaque fois, et il pouvait le
-- changer scene par scene. Resultat, la meme personne s'appelait
-- « ienders pro » ici et « Cassou » la, sans qu'on sache que c'etait
-- elle.
--
-- Un profil regle les deux : un pseudo choisi une fois, une photo, et
-- les deux suivent la personne partout.

create table profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (btrim(display_name) <> ''),
  -- Chemin dans le bucket `avatars`, jamais une URL : les URL signees
  -- expirent, et une URL publique rendrait la photo devinable.
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table profiles is
  'Identite d''un joueur, commune a toutes ses scenes.';

alter table profiles enable row level security;

-- Tout invite voit les profils : c'est ce qui permet d'afficher la photo
-- des autres joueurs dans un lobby. Personne n'ecrit celui d'un autre.
create policy profiles_select on profiles
  for select to authenticated using (app_is_allowed());

create policy profiles_insert on profiles
  for insert to authenticated with check (user_id = auth.uid());

create policy profiles_update on profiles
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ── Les photos ────────────────────────────────────────────────────────
-- Bucket prive, deux mega-octets, images seulement. Le chemin commence
-- par l'identifiant du proprietaire : c'est lui qui porte la regle
-- d'ecriture, sans jointure.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars', 'avatars', false, 2097152,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy avatars_select on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and app_is_allowed());

create policy avatars_write on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy avatars_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy avatars_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

/**
 * Lit son propre profil, en le creant au premier passage.
 *
 * Le nom de depart vient de l'adresse e-mail, comme avant : personne ne
 * doit etre oblige de remplir un formulaire pour jouer. La difference,
 * c'est qu'il est desormais pose une fois et modifiable.
 */
create or replace function get_my_profile()
returns profiles
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile profiles;
  v_email text;
begin
  if not app_is_allowed() then
    raise exception 'NOT_ALLOWED' using errcode = 'P0001';
  end if;

  select * into v_profile from profiles where user_id = auth.uid();
  if found then
    return v_profile;
  end if;

  select email into v_email from auth.users where id = auth.uid();

  insert into profiles (user_id, display_name)
  values (
    auth.uid(),
    coalesce(nullif(btrim(split_part(coalesce(v_email, ''), '@', 1)), ''), 'Joueur')
  )
  returning * into v_profile;

  return v_profile;
end;
$$;

/**
 * Met a jour son profil.
 *
 * `p_avatar_path` distingue trois intentions, et il faut les trois :
 * absent (null) ne touche pas a la photo, une chaine vide la retire, un
 * chemin la remplace. Sans ce troisieme cas, changer son pseudo effacait
 * sa photo.
 */
create or replace function update_my_profile(
  p_display_name text default null,
  p_avatar_path text default null
)
returns profiles
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile profiles;
begin
  if not app_is_allowed() then
    raise exception 'NOT_ALLOWED' using errcode = 'P0001';
  end if;

  -- S'assure que la ligne existe avant de la modifier.
  perform get_my_profile();

  if p_display_name is not null and btrim(p_display_name) = '' then
    raise exception 'EMPTY_NAME' using errcode = 'P0001';
  end if;

  if p_avatar_path is not null
     and p_avatar_path <> ''
     and split_part(p_avatar_path, '/', 1) <> auth.uid()::text then
    raise exception 'FOREIGN_AVATAR' using errcode = 'P0001';
  end if;

  update profiles
  set display_name = coalesce(nullif(btrim(coalesce(p_display_name, '')), ''), display_name),
      avatar_path = case
        when p_avatar_path is null then avatar_path
        when p_avatar_path = '' then null
        else p_avatar_path
      end,
      updated_at = now()
  where user_id = auth.uid()
  returning * into v_profile;

  -- Le nom porte dans les scenes suit le pseudo : sans ca, changer son
  -- pseudo ne changeait rien la ou les autres le lisent.
  if p_display_name is not null then
    update participants
    set display_name = v_profile.display_name
    where user_id = auth.uid();
  end if;

  return v_profile;
end;
$$;

/**
 * Combien de packs cette personne a publies.
 *
 * Sert a decider si l'onglet « Mes packs » a lieu d'etre : un onglet qui
 * ouvre sur une page vide est un onglet de trop.
 */
create or replace function my_pack_count()
returns integer
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select count(*)::int from packs where created_by = auth.uid();
$$;

revoke execute on function get_my_profile() from public;
revoke execute on function update_my_profile(text, text) from public;
revoke execute on function my_pack_count() from public;

grant execute on function get_my_profile() to authenticated, service_role;
grant execute on function update_my_profile(text, text) to authenticated, service_role;
grant execute on function my_pack_count() to authenticated, service_role;
