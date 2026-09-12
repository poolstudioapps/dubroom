-- Dub’Up — de quoi ranger autre chose que des films.
--
-- Les huit genres de depart etaient des genres de cinema : action,
-- comedie, drame, horreur. Or ce que le groupe apporte n'est pas
-- toujours un film. Une scene d'anime, un passage de serie, une
-- cinematique de jeu, une chanson a reprendre : aucun ne trouvait sa
-- place ailleurs que dans « Autre », qui finissait par tout contenir et
-- donc par ne rien trier.
--
-- Aucun nom de studio ni de franchise dans cette liste, et c'est
-- volontaire : le service travaille des extraits proteges, et afficher
-- une marque en tete de rayon transforme un usage prive en vitrine.
-- « Animation » couvre ce que l'on range d'ordinaire sous un nom
-- propre, sans emprunter celui de personne.

alter type pack_genre add value if not exists 'anime';
alter type pack_genre add value if not exists 'serie';
alter type pack_genre add value if not exists 'super_heros';
alter type pack_genre add value if not exists 'jeu_video';
alter type pack_genre add value if not exists 'chanson';
