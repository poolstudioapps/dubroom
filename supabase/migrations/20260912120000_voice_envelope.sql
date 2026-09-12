-- Dub’Up — enveloppe de la voix d'origine.
--
-- Le studio doit montrer au joueur quand l'acteur parle, pour qu'il
-- anticipe son entree au lieu de la decouvrir. Servir le stem voix au
-- navigateur repondrait a la question, mais c'est un WAV 48 kHz rejoue a
-- chaque prise par chaque joueur : exactement le depassement de bande
-- passante que le PRD §13.3 signale comme le plus sournois.
--
-- On stocke donc une enveloppe d'amplitude calculee une fois a
-- l'ingestion : un octet par intervalle, encode en base64. Pour une scene
-- de dix minutes a 20 Hz, cela fait 12 000 octets, soit 16 Ko de texte —
-- transmis avec les metadonnees de la scene, sans requete de plus.

alter table sessions
  add column voice_peaks text,
  add column voice_peaks_hz int;

comment on column sessions.voice_peaks is
  'Enveloppe d''amplitude du stem voix, un octet (0-255) par intervalle, en base64.';
comment on column sessions.voice_peaks_hz is
  'Nombre d''intervalles par seconde de voice_peaks.';
