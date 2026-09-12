-- Dub’Up — packs sans media.
--
-- Un pack conserve le travail de preparation d'une scene. Jusqu'ici il
-- gardait aussi la video et les pistes separees : 13 Mo par pack.
--
-- Quand la scene vient d'un lien, on n'a pas besoin de tout cela. Il
-- suffit de garder le lien et la preparation — personnages, repliques,
-- mots horodates — et de refaire le telechargement et la separation au
-- moment ou quelqu'un veut la rejouer. Le pack tombe alors a quelques
-- kilo-octets, et surtout on ne conserve aucune copie de l'oeuvre.
--
-- La transcription, elle, n'est pas refaite : c'est la partie payante et
-- celle que l'hote a corrigee a la main. C'est tout l'interet.
--
-- Deux natures de pack coexistent donc :
--   'media' — la scene venait d'un fichier importe, on garde les medias ;
--   'url'   — la scene venait d'un lien, on garde la recette.

alter table packs
  alter column video_path drop not null,
  alter column stem_voice_path drop not null,
  alter column stem_music_path drop not null;

alter table packs
  add column kind text not null default 'media'
    check (kind in ('media', 'url')),
  add column source_url text;

-- Un pack est soit l'un, soit l'autre, jamais ni l'un ni l'autre.
alter table packs add constraint packs_payload_check check (
  (kind = 'media' and video_path is not null
     and stem_voice_path is not null and stem_music_path is not null)
  or (kind = 'url' and source_url is not null)
);

comment on column packs.kind is
  'media = fichiers conserves ; url = lien conserve, tout est refait a la demande.';

/**
 * Demarre une scene depuis un pack, quelle que soit sa nature.
 *
 * Pour un pack `media`, la scene pointe vers les fichiers du pack et
 * arrive directement en lobby.
 *
 * Pour un pack `url`, la scene repart d'une ingestion : telechargement,
 * encodage, separation. La transcription et le decoupage, eux, sont
 * repris du pack — le worker les recopie au lieu d'appeler Scribe.
 */
create or replace function start_from_pack(
  p_pack_id uuid,
  p_code text,
  p_display_name text,
  p_gap_ms int,
  p_margin_ms int
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

  if v_pack.kind = 'media' then
    insert into sessions (
      code, host_id, title, status, source_type, from_pack_id,
      video_path, stem_voice_path, stem_music_path, stem_music_preview_path,
      voice_peaks, voice_peaks_hz, duration_ms
    )
    values (
      upper(p_code), auth.uid(), v_pack.title, 'lobby', 'pack', v_pack.id,
      v_pack.video_path, v_pack.stem_voice_path, v_pack.stem_music_path,
      v_pack.stem_music_path,
      v_pack.voice_peaks, v_pack.voice_peaks_hz, v_pack.duration_ms
    )
    returning * into v_session;
  else
    -- Tout est a refaire sauf la comprehension de la scene.
    insert into sessions (
      code, host_id, title, status, source_type, source_ref, from_pack_id,
      duration_ms
    )
    values (
      upper(p_code), auth.uid(), v_pack.title, 'ingest_queued', 'youtube',
      v_pack.source_url, v_pack.id, v_pack.duration_ms
    )
    returning * into v_session;

    insert into jobs (session_id, type, status)
    values (v_session.id, 'ingest', 'queued');
  end if;

  insert into participants (session_id, user_id, display_name, is_host)
  values (v_session.id, auth.uid(), p_display_name, true);

  -- Les personnages et repliques sont copies dans les deux cas : pour un
  -- pack `url`, ils attendront simplement que les medias arrivent.
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

  perform recompute_clips(v_session.id, p_gap_ms, p_margin_ms);

  return v_session;
end;
$$;

/** Le catalogue expose desormais la nature du pack et son poids reel. */
-- La signature de sortie change : Postgres refuse un `create or replace`
-- qui modifie les colonnes rendues, il faut retirer l'ancienne d'abord.
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
    p.character_count, p.line_count, p.size_bytes, p.kind, p.created_at,
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
