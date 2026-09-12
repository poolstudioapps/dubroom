-- Dub’Up — gestion de la liste blanche depuis l'application.
--
-- Jusqu'ici la liste ne se modifiait qu'avec la cle service, donc depuis
-- le worker. En pratique le besoin arrive au pire moment : quelqu'un se
-- connecte par Discord avec une adresse differente de celle qui a ete
-- invitee, tout le monde attend, et il faut aller chercher un terminal.
--
-- N'importe quel invite peut donc desormais en inviter un autre. C'est
-- volontaire : ce produit est un salon prive entre amis, pas un service
-- avec des roles. Celui qui est deja entre est repute de confiance.

create or replace function list_guests()
returns table (email text, added_at timestamptz, has_account boolean)
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
    exists (select 1 from auth.users u where lower(u.email) = lower(a.email))
  from allowed_emails a
  order by a.added_at;
end;
$$;

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

  -- Verification volontairement sommaire : une adresse mal saisie se
  -- corrige en la retapant, et la liste n'est pas un formulaire public.
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'INVALID_EMAIL' using errcode = 'P0001';
  end if;

  insert into allowed_emails (email) values (v_email)
  on conflict (email) do nothing;

  return v_email;
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
begin
  if not app_is_allowed() then
    raise exception 'NOT_ALLOWED' using errcode = 'P0001';
  end if;

  -- On ne se retire pas soi-meme : ce serait se fermer la porte au nez,
  -- sans moyen de la rouvrir depuis l'application.
  if v_email = app_current_email() then
    raise exception 'CANNOT_REVOKE_SELF' using errcode = 'P0001';
  end if;

  delete from allowed_emails where email = v_email;
end;
$$;
