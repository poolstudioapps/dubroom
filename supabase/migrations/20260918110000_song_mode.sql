-- Dub’Up — le mode chanson.
--
-- Une reprise n'a pas besoin de transcription. La reconnaissance rend
-- surtout des syllabes etirees et des onomatopees sur une voix chantee,
-- pour un cout par minute qui n'a aucune contrepartie : celui qui
-- reprend une chanson en connait les paroles.
--
-- Ce qu'il faut savoir, en revanche, c'est QUAND chanter — et
-- l'enveloppe de la voix separee le dit deja. Le worker s'en sert pour
-- decouper les entrees, cree une seule voix, et va droit a la
-- preparation ou l'hote pourra la scinder s'ils sont deux a chanter.

alter table sessions
  add column if not exists is_song boolean not null default false;

comment on column sessions.is_song is
  'Reprise musicale : découpage à l''enveloppe, sans transcription.';

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
begin
  if not app_is_allowed() then
    raise exception 'NOT_ALLOWED' using errcode = 'P0001';
  end if;

  insert into sessions (
    code, host_id, title, source_type, source_ref, status, keep_as_pack, is_song
  )
  values (
    upper(p_code), auth.uid(), nullif(p_title, ''), p_source_type,
    nullif(p_source_ref, ''), 'draft', coalesce(p_keep_as_pack, false),
    coalesce(p_is_song, false)
  )
  returning * into v_session;

  insert into participants (session_id, user_id, display_name, is_host)
  values (v_session.id, auth.uid(), p_display_name, true);

  return v_session;
end;
$$;

-- L'ancienne signature a six arguments laisserait deux fonctions
-- candidates pour un appel a six : PostgREST ne saurait pas choisir.
drop function if exists create_session(text, text, text, text, text, boolean);

revoke execute on function
  create_session(text, text, text, text, text, boolean, boolean) from public;
grant execute on function
  create_session(text, text, text, text, text, boolean, boolean)
  to authenticated, service_role;
