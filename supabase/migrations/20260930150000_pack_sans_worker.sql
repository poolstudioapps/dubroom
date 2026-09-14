-- Rejouer un pack sans passer par le worker.
--
-- Un pack garde les deux pistes de sa scene d'origine, son enveloppe de
-- voix et son decoupage. Il ne manque que l'image, que le joueur apporte.
-- Quand son fichier est un MP4 que tout navigateur lit tel quel (le
-- navigateur le verifie avant l'envoi), il n'y a rien a convertir : le
-- fichier devient la video de la scene, les pistes du pack sont recopiees
-- dans son dossier par le stockage, et le lobby s'ouvre aussitot. Le
-- worker ne reste necessaire que pour les autres formats, et pour les
-- packs qui n'ont pas encore leurs pistes.
--
-- La fonction ne fait confiance a rien de ce que le navigateur annonce :
-- elle verifie que la scene est bien celle d'un pack, a l'hote, encore en
-- brouillon, et que la video et les pistes sont reellement dans le dossier
-- de la scene.

create or replace function public.demarrer_pack_direct(p_session_id uuid, p_video_path text)
 returns sessions
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
declare
  v_session sessions;
  v_pack packs;
  v_voix text;
  v_fond text;
  v_apercu text;
  v_attendus int;
  v_trouves int;
begin
  if not app_is_host(p_session_id) then
    raise exception 'HOST_ONLY' using errcode = 'P0001';
  end if;
  perform app_assert_status(p_session_id, array['draft', 'ingest_failed']::session_status[]);

  select * into v_session from sessions where id = p_session_id;
  if v_session.from_pack_id is null or v_session.source_type <> 'upload' then
    raise exception 'NOT_A_PACK_SCENE' using errcode = 'P0001';
  end if;

  select * into v_pack from packs where id = v_session.from_pack_id;
  if not found or v_pack.stem_voice_path is null or v_pack.stem_music_path is null then
    raise exception 'PACK_WITHOUT_SOUNDS' using errcode = 'P0001';
  end if;

  if p_video_path is null
     or p_video_path !~ ('^' || p_session_id::text || '/video\.(mp4|m4v)$') then
    raise exception 'FOREIGN_VIDEO' using errcode = 'P0001';
  end if;

  -- Les copies portent le nom des pistes du pack, dans le dossier de la scene.
  v_voix := p_session_id::text || '/' || regexp_replace(v_pack.stem_voice_path, '^.*/', '');
  v_fond := p_session_id::text || '/' || regexp_replace(v_pack.stem_music_path, '^.*/', '');
  v_apercu := case
    when v_pack.stem_music_preview_path is not null
      then p_session_id::text || '/' || regexp_replace(v_pack.stem_music_preview_path, '^.*/', '')
  end;

  v_attendus := case when v_apercu is null then 3 else 4 end;
  select count(distinct name) into v_trouves
  from storage.objects
  where bucket_id = 'sources'
    and name in (p_video_path, v_voix, v_fond, coalesce(v_apercu, p_video_path));
  if v_trouves < v_attendus then
    raise exception 'FILES_MISSING' using errcode = 'P0001';
  end if;

  update sessions
  set status = 'lobby',
      video_path = p_video_path,
      upload_path = null,
      stem_voice_path = v_voix,
      stem_music_path = v_fond,
      stem_music_preview_path = v_apercu,
      voice_peaks = coalesce(v_pack.voice_peaks, voice_peaks),
      voice_peaks_hz = coalesce(v_pack.voice_peaks_hz, voice_peaks_hz)
  where id = p_session_id
  returning * into v_session;

  -- Un import rate avant celui-ci n'a plus lieu d'etre.
  delete from jobs where session_id = p_session_id and type = 'ingest' and status = 'failed';

  return v_session;
end;
$function$;

revoke execute on function public.demarrer_pack_direct(uuid, text) from public, anon;
grant execute on function public.demarrer_pack_direct(uuid, text) to authenticated, service_role;
