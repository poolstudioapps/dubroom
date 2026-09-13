-- Redoubler une scene avec les memes joueurs, et garder le son des packs.

-- ══ 1. Le son des packs ══════════════════════════════════════════════
--
-- Un pack garde desormais les deux pistes separees de sa scene d'origine
-- (voix et fond sonore) : rejouer un pack n'a plus a refaire la
-- separation. La video, elle, n'est toujours jamais gardee.
alter table packs add column if not exists stem_music_preview_path text;

-- ══ 2. Redoubler ═════════════════════════════════════════════════════
--
-- La meme scene, les memes joueurs, une nouvelle manche. Rien a
-- reconstruire : la video, les pistes, les personnages et le decoupage
-- sont encore la pendant l'heure qui suit le montage. On efface les
-- prises, on remet tout le monde « pas pret » en gardant les roles — chacun
-- pourra en changer dans le lobby — et on y retourne.
--
-- L'ancien rendu est marque a echeance : la purge l'efface a son prochain
-- passage, sans toucher aux sources puisque la scene n'est plus terminee.
create or replace function redoubler_scene(p_session_id uuid)
returns sessions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_session sessions;
begin
  select * into v_session from sessions where id = p_session_id for update;
  if not found then
    raise exception 'SESSION_NOT_FOUND' using errcode = 'P0002';
  end if;
  if not app_is_host(p_session_id) then
    raise exception 'HOST_ONLY' using errcode = 'P0001';
  end if;
  if v_session.status <> 'done' then
    raise exception 'SESSION_LOCKED' using errcode = 'P0001';
  end if;
  if v_session.video_path is null
     or v_session.stem_voice_path is null
     or v_session.stem_music_path is null then
    raise exception 'SOURCES_PURGED' using errcode = 'P0001';
  end if;

  delete from takes t
  using clips c
  where c.id = t.clip_id and c.session_id = p_session_id;

  update participants set is_ready = false
  where session_id = p_session_id;

  update sessions
  set status = 'lobby',
      recording_started_at = null,
      render_expires_at = case when render_path is not null then now() else render_expires_at end
  where id = p_session_id
  returning * into v_session;

  return v_session;
end;
$$;

revoke all on function redoubler_scene(uuid) from public, anon;
grant execute on function redoubler_scene(uuid) to authenticated;

-- ══ 3. Pas de « video supprimee » pour une manche qui repart ═════════
create or replace function app_notifier_session()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_kind text;
  r record;
begin
  if new.status = 'render_queued'
     and old.status is distinct from 'render_queued'
     and old.status is distinct from 'rendering' then
    v_kind := 'render_started';
  elsif new.status = 'done' and new.render_path is not null
     and (old.status is distinct from 'done' or old.render_path is null) then
    v_kind := 'render_done';
  elsif new.render_deleted_at is not null and old.render_deleted_at is null
     and new.status = 'done' then
    v_kind := 'render_deleted';
  else
    return new;
  end if;

  for r in
    select distinct user_id from participants
    where session_id = new.id and not is_kicked and user_id is not null
  loop
    perform app_notifier(
      r.user_id, v_kind, new.id, null, null, null,
      jsonb_build_object('title', coalesce(new.title, ''), 'code', new.code)
    );
  end loop;
  return new;
end;
$$;
