-- Dub’Up — le rendu debout.
--
-- Un doublage se montre aujourd'hui sur un telephone tenu a la
-- verticale, et une video 16/9 y occupe un bandeau au milieu de rien.
-- Le worker produit donc une seconde version recadree au centre, au
-- format 9/16, a cote du rendu d'origine.
--
-- Deux colonnes plutot qu'une convention de nommage : le rendu vertical
-- peut manquer — sur une scene rendue avant cette version, ou si son
-- encodage a echoue — et l'interface doit pouvoir le savoir sans aller
-- sonder le stockage.

alter table sessions
  add column if not exists render_vertical_path text,
  add column if not exists render_vertical_size_bytes bigint;

comment on column sessions.render_vertical_path is
  'Rendu recadré en 9/16, ou null si absent.';
