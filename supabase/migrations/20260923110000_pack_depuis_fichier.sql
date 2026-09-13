-- Dub'Up — doubler une scene du catalogue avec sa propre video.
--
-- Une scene publiee ne garde que son lien YouTube et sa preparation. La
-- relancer voulait dire retelecharger la video, et seul le PC de l'hote
-- le peut : YouTube refuse les serveurs. Quand personne n'avait lance le
-- worker, la scene restait en file sans rien dire.
--
-- Cette fonction ouvre un second chemin : le joueur apporte le fichier.
-- La scene est creee comme un import ordinaire (`upload`), rattachee au
-- pack, avec ses personnages et ses repliques recopies. Le worker en
-- ligne la prepare sans rien retranscrire — c'est deja le comportement
-- d'une scene qui porte `from_pack_id` — et elle arrive au lobby.
--
-- Elle nait en brouillon et sans tache : le fichier n'est pas encore
-- envoye. Le site l'envoie, puis appelle `enqueue_ingest`, qui accepte
-- deja une scene en brouillon et met la tache en file.

create or replace function start_from_pack_file(
  p_pack_id uuid,
  p_code text,
  p_display_name text,
  p_gap_ms int,
  p_margin_ms int,
  p_max_ms int default 15000
)
returns sessions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_pack packs;
  v_session sessions;
begin
  if not app_is_allowed() then
    raise exception 'NOT_ALLOWED' using errcode = 'P0001';
  end if;

  select * into v_pack from packs where id = p_pack_id;
  if not found then
    raise exception 'PACK_NOT_FOUND' using errcode = 'P0002';
  end if;

  -- Un pack qui garde ses fichiers demarre sans video a fournir.
  if v_pack.kind <> 'url' then
    raise exception 'PACK_HAS_MEDIA' using errcode = 'P0001';
  end if;

  insert into sessions (
    code, host_id, title, status, source_type, from_pack_id, duration_ms
  )
  values (
    upper(p_code), auth.uid(), v_pack.title, 'draft', 'upload', v_pack.id,
    v_pack.duration_ms
  )
  returning * into v_session;

  insert into participants (session_id, user_id, display_name, is_host)
  values (v_session.id, auth.uid(), p_display_name, true);

  with copied as (
    insert into characters (session_id, speaker_key, name, color, sort_order)
    select v_session.id, c.speaker_key, c.name, c.color, c.sort_order
    from pack_characters c
    where c.pack_id = v_pack.id
    returning id, speaker_key
  )
  insert into lines (session_id, character_id, start_ms, end_ms, text, words, is_deleted)
  select v_session.id, copied.id, l.start_ms, l.end_ms, l.text, l.words, l.is_deleted
  from pack_lines l
  join pack_characters pc on pc.id = l.pack_character_id
  join copied on copied.speaker_key = pc.speaker_key
  where l.pack_id = v_pack.id;

  perform recompute_clips(v_session.id, p_gap_ms, p_margin_ms, p_max_ms);

  return v_session;
end;
$$;

revoke all on function start_from_pack_file(uuid, text, text, int, int, int)
  from public, anon;
grant execute on function start_from_pack_file(uuid, text, text, int, int, int)
  to authenticated, service_role;
