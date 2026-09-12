-- Liste blanche (PRD §14).
-- Ajoute ici l'adresse de chaque personne autorisee a creer ou rejoindre
-- une scene. Une adresse absente recoit un message clair, pas une erreur.
--
-- Pour ajouter quelqu'un plus tard, sans rejouer ce fichier :
--   insert into allowed_emails (email) values ('ami@exemple.fr')
--   on conflict do nothing;

insert into allowed_emails (email) values
  ('ienders.pro@gmail.com')
on conflict (email) do nothing;
