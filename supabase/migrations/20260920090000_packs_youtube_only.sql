-- Dub'Up — un pack public ne peut venir que d'un lien.
--
-- Jusqu'ici, une scene montee depuis un fichier importe pouvait devenir
-- un pack : le worker stockait alors une copie de la video et des stems,
-- soit une quinzaine de megaoctets par pack.
--
-- Deux raisons d'y mettre fin, et la premiere suffirait.
--
-- 1. HEBERGER L'OEUVRE. Une recette ne contient qu'une adresse et le
--    travail de preparation : le decoupage, les personnages, le texte
--    corrige a la main. C'est ce travail qui a de la valeur et qui
--    appartient a celui qui l'a fait. Un pack media, lui, redistribue
--    la video elle-meme depuis nos serveurs, ce que les conditions
--    d'utilisation font porter a l'utilisateur et qu'on ne veut pas
--    proposer.
--
-- 2. LE POIDS. Treize megaoctets par pack contre quelques kilo-octets.
--
-- Verifie avant d'ecrire cette migration : aucun pack `media` n'existe,
-- et les quatorze sessions marquees pour publication viennent toutes de
-- YouTube. La regle ne retire donc rien a personne, elle ferme une porte
-- que personne n'avait franchie.

/**
 * Une session peut-elle devenir un pack ?
 *
 * Extrait en fonction plutot que recopie dans les deux appelants : la
 * regle est la meme des deux cotes et doit le rester.
 */
create or replace function app_pack_eligible(p_source_type text, p_source_ref text)
returns boolean
language sql
immutable
as $$
  select p_source_type = 'youtube' and nullif(btrim(coalesce(p_source_ref, '')), '') is not null;
$$;

comment on function app_pack_eligible(text, text) is
  'Seule une scène venue d''un lien YouTube peut être publiée en pack.';

create or replace function create_session(
  p_code text,
  p_title text,
  p_source_type text,
  p_source_ref text,
  p_display_name text,
  p_keep_as_pack boolean default false,
  p_is_song boolean default false
)
returns sessions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session sessions;
  v_keep boolean;
begin
  if not app_is_allowed() then
    raise exception 'NOT_ALLOWED' using errcode = 'P0001';
  end if;

  /*
   * L'intention est ignoree plutot que refusee.
   *
   * Le formulaire ne propose deja plus la case pour un fichier importe ;
   * si elle arrive quand meme, c'est un client obsolete ou bricole. Faire
   * echouer la creation de la scene pour autant serait disproportionne :
   * la scene est parfaitement jouable, elle ne sera simplement pas
   * publiee.
   */
  v_keep := coalesce(p_keep_as_pack, false)
            and app_pack_eligible(p_source_type, p_source_ref);

  insert into sessions (
    code, host_id, title, source_type, source_ref, status, keep_as_pack, is_song
  )
  values (
    upper(p_code), auth.uid(), nullif(p_title, ''), p_source_type,
    nullif(p_source_ref, ''), 'draft', v_keep,
    coalesce(p_is_song, false)
  )
  returning * into v_session;

  insert into participants (session_id, user_id, display_name, is_host)
  values (v_session.id, auth.uid(), p_display_name, true);

  return v_session;
end;
$$;

/**
 * Bascule en cours de partie.
 *
 * Ici on refuse franchement, au lieu d'ignorer : l'hote a clique sur une
 * case, il doit savoir pourquoi elle ne prend pas. Le front traduit
 * `PACK_NEEDS_URL` en une phrase lisible.
 */
create or replace function set_keep_as_pack(p_session_id uuid, p_keep boolean)
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
  -- Apres le rendu il est trop tard : les fichiers sont purges.
  perform app_assert_status(
    p_session_id,
    array['prepping', 'lobby', 'recording']::session_status[]
  );

  select * into v_session from sessions where id = p_session_id;

  if p_keep and not app_pack_eligible(v_session.source_type::text, v_session.source_ref) then
    raise exception 'PACK_NEEDS_URL' using errcode = 'P0001';
  end if;

  update sessions set keep_as_pack = p_keep where id = p_session_id
  returning * into v_session;
  return v_session;
end;
$$;
