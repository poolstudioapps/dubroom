-- Dub’Up — acceptation des conditions generales.
--
-- Une case cochee qui ne laisse pas de trace ne sert a rien : ce qui a
-- une valeur, c'est de savoir qui a accepte quelle version et quand. Les
-- deux colonnes vivent sur le profil parce que c'est la ligne qui
-- represente la personne, et qu'elle est deja creee au premier passage.
--
-- Les comptes existants demarrent a `null` : l'application le voit et
-- demande l'acceptation a la prochaine connexion.

alter table profiles
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists terms_version text;

comment on column profiles.terms_accepted_at is
  'Quand cette personne a accepte les conditions, ou null si jamais.';
comment on column profiles.terms_version is
  'La version acceptee, sous forme de date. Voir config/terms.ts.';

/**
 * Enregistre l'acceptation des conditions.
 *
 * Toujours ecrite, meme si une acceptation plus ancienne existe : quand
 * les regles changent, c'est la date du nouveau consentement qui compte,
 * pas celle du premier.
 *
 * La version vient du client, ce qui est sans consequence : elle n'ouvre
 * aucun droit et ne sert qu'a dire quel texte etait affiche. La seule
 * chose que cette fonction accorde, c'est d'ecrire sur sa propre ligne.
 */
create or replace function accept_terms(p_version text)
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

  if p_version is null or btrim(p_version) = '' then
    raise exception 'EMPTY_VERSION' using errcode = 'P0001';
  end if;

  -- S'assure que la ligne existe avant de la modifier.
  perform get_my_profile();

  update profiles
  set terms_accepted_at = now(),
      terms_version = btrim(p_version),
      updated_at = now()
  where user_id = auth.uid()
  returning * into v_profile;

  return v_profile;
end;
$$;

revoke execute on function accept_terms(text) from public;
grant execute on function accept_terms(text) to authenticated, service_role;
