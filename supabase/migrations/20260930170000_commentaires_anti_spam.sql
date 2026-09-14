-- Un commentaire toutes les cinq minutes sous une meme publication.
--
-- Le garde-fou de cinq secondes arretait les doubles clics, pas le
-- bavardage : une personne pouvait remplir le fil d'un pack ou d'un profil
-- a elle seule. Desormais, apres un commentaire sous une publication, le
-- suivant sous la meme publication attend cinq minutes. Ailleurs, rien ne
-- change.

create or replace function public.app_add_comment(p_pack_id uuid, p_profile_id uuid, p_body text, p_parent_id uuid)
 returns uuid
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
declare
  v_body text := btrim(coalesce(p_body, ''));
  v_parent pack_comments;
  v_racine uuid;
  v_id uuid;
begin
  if not app_is_allowed() then
    raise exception 'NOT_ALLOWED' using errcode = 'P0001';
  end if;
  if v_body = '' then
    raise exception 'COMMENT_EMPTY' using errcode = 'P0001';
  end if;
  if char_length(v_body) > 1000 then
    raise exception 'COMMENT_TOO_LONG' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from pack_comments
    where user_id = auth.uid() and created_at > now() - interval '5 seconds'
  ) then
    raise exception 'COMMENT_TOO_FAST' using errcode = 'P0001';
  end if;
  -- Sous la meme publication, reponses comprises : cinq minutes d'ecart.
  if exists (
    select 1 from pack_comments
    where user_id = auth.uid()
      and pack_id is not distinct from p_pack_id
      and profile_id is not distinct from p_profile_id
      and created_at > now() - interval '5 minutes'
  ) then
    raise exception 'COMMENT_COOLDOWN' using errcode = 'P0001';
  end if;

  if p_parent_id is not null then
    select * into v_parent from pack_comments where id = p_parent_id;
    if not found then
      raise exception 'COMMENT_NOT_FOUND' using errcode = 'P0002';
    end if;
    -- Une reponse vit sous la meme scene ou le meme profil que ce a quoi
    -- elle repond, et les fils ne s'enfoncent pas : repondre a une
    -- reponse range sous le premier commentaire.
    if v_parent.pack_id is distinct from p_pack_id
       or v_parent.profile_id is distinct from p_profile_id then
      raise exception 'CROSS_SESSION' using errcode = 'P0001';
    end if;
    v_racine := coalesce(v_parent.parent_id, v_parent.id);
  end if;

  insert into pack_comments (pack_id, profile_id, parent_id, user_id, body)
  values (p_pack_id, p_profile_id, v_racine, auth.uid(), v_body)
  returning id into v_id;
  return v_id;
end;
$function$;
