-- Le profil public dit aussi ce qu'on a joue.
--
-- Jusqu'ici il ne parlait que de ce qu'on avait publie. S'ajoutent les
-- scenes jouees jusqu'au rendu, le nombre de personnages doubles, et le
-- personnage le plus double : les memes noms d'une scene a l'autre sont
-- reunis, et on retient celui qui cumule le plus de temps de parole
-- double (la duree des repliques, supprimees exclues).
--
-- Seules comptent les scenes terminees, ou la personne tenait le role :
-- un personnage laisse en VO ou un joueur exclu ne comptent pas. Une scene
-- supprimee par son hote sort des comptes avec elle.

create or replace function public.get_creator_profile(p_user_id uuid)
 returns jsonb
 language plpgsql
 stable security definer
 set search_path to 'public', 'pg_temp'
as $function$
declare
  v_stats record;
  v_created timestamptz;
  v_jeu record;
  v_fetiche record;
begin
  if not app_is_allowed() then
    raise exception 'NOT_ALLOWED' using errcode = 'P0001';
  end if;

  select coalesce(p.created_at, u.created_at) into v_created
  from auth.users u left join profiles p on p.user_id = u.id
  where u.id = p_user_id;
  if not found then
    raise exception 'PROFILE_NOT_FOUND' using errcode = 'P0002';
  end if;

  select * into v_stats from app_creator_stats(p_user_id);

  with roles as (
    select s.id as session_id, c.id as character_id
    from participants pa
    join sessions s on s.id = pa.session_id and s.status = 'done'
    join characters c on c.assigned_to = pa.id and not c.is_released
    where pa.user_id = p_user_id and not pa.is_kicked
  )
  select count(distinct session_id)::int as scenes, count(*)::int as personnages
  into v_jeu
  from roles;

  with roles as (
    select
      s.id as session_id,
      btrim(c.name) as nom,
      coalesce((
        select sum(greatest(0, l.end_ms - l.start_ms))
        from lines l
        where l.character_id = c.id and not l.is_deleted
      ), 0) as ms
    from participants pa
    join sessions s on s.id = pa.session_id and s.status = 'done'
    join characters c on c.assigned_to = pa.id and not c.is_released
    where pa.user_id = p_user_id and not pa.is_kicked and btrim(c.name) <> ''
  )
  select
    mode() within group (order by nom) as nom,
    sum(ms)::bigint as ms,
    count(distinct session_id)::int as scenes
  into v_fetiche
  from roles
  group by lower(nom)
  order by sum(ms) desc, count(*) desc
  limit 1;

  return jsonb_build_object(
    'user_id', p_user_id,
    'display_name', app_nom_public(p_user_id),
    'avatar_path', (select avatar_path from profiles where user_id = p_user_id),
    'member_since', v_created,
    'is_me', p_user_id = auth.uid(),
    'pack_count', v_stats.pack_count,
    'up_total', v_stats.up_total,
    'down_total', v_stats.down_total,
    'packs_10up', v_stats.packs_10up,
    'certified', v_stats.packs_10up >= 50 or v_stats.up_total >= 5000,
    'certified_via', case
      when v_stats.packs_10up >= 50 then 'packs'
      when v_stats.up_total >= 5000 then 'votes'
    end,
    'cert_packs_goal', 50,
    'cert_min_up', 10,
    'cert_votes_goal', 5000,
    'comment_count', (select count(*) from pack_comments where profile_id = p_user_id),
    'scenes_played', coalesce(v_jeu.scenes, 0),
    'characters_dubbed', coalesce(v_jeu.personnages, 0),
    'top_character', case
      when v_fetiche.nom is null then null
      else jsonb_build_object('name', v_fetiche.nom, 'ms', v_fetiche.ms, 'scenes', v_fetiche.scenes)
    end
  );
end;
$function$;
