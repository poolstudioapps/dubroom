-- Les droits que recoit ce qu'on cree demain.
--
-- Le durcissement a retire les droits de l'anonyme et les ecritures du
-- navigateur sur tout ce qui existait. Mais Supabase pose des privileges
-- par defaut pour le role `postgres`, qui cree nos migrations : chaque
-- nouvelle table, sequence ou fonction les recevait de nouveau, anonyme
-- compris. La premiere fonction creee apres coup
-- (`demarrer_pack_direct`) est nee executable par l'anonyme.
--
-- On les aligne sur la regle : l'anonyme ne recoit rien, le navigateur
-- connecte lit les tables et appelle les fonctions qu'on lui ouvre
-- explicitement.

alter default privileges for role postgres in schema public
  revoke all on tables from anon;
alter default privileges for role postgres in schema public
  revoke insert, update, delete, truncate, references, trigger on tables from authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon;

revoke execute on function public.demarrer_pack_direct(uuid, text) from public, anon;
