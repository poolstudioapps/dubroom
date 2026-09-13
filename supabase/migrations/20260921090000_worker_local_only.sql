-- Dub'Up — retour au seul worker local.
--
-- Pendant deux jours, une tache entrant dans la file reveillait un job
-- Cloud Run avec GPU. La chaine fonctionnait de bout en bout, sauf a sa
-- toute premiere etape : YouTube refuse les adresses de centre de
-- donnees, et celles de Google plus que toutes. Verifie trois fois —
-- depuis Cloud Run, depuis Cloud Build, et a travers dix intermediaires
-- gratuits, tous marques en quelques heures. Sans adresse residentielle
-- payante, l'import YouTube ne peut pas passer, et c'est l'import par
-- lequel arrive la plupart des scenes.
--
-- Le worker redevient donc celui du PC de l'hote, qui telecharge depuis
-- une connexion domestique sans aucune difficulte.
--
-- Supprimer la fonction supprime aussi le jeton qu'elle portait en
-- clair : il n'a plus rien a garder.

drop trigger if exists jobs_reveillent_le_worker on public.jobs;
drop function if exists public.reveiller_worker();
