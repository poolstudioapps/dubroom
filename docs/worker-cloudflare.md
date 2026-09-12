# Faire tourner le worker sur Cloudflare

Écrit pour la personne qui administre DubRoom, c'est-à-dire toi.

Réponse courte : **oui sur Cloudflare Containers, non sur Cloudflare
Workers**, et le passage coûte la séparation par Demucs. Le détail
ci-dessous dit pourquoi, ce qu'il faut changer, et ce que ça coûte.

---

## 1. Pourquoi Workers ne peut pas marcher

Un Worker est un isolat V8. Pas de système de fichiers, pas de création de
processus. Or le worker de DubRoom passe son temps à lancer des binaires :

| Binaire | À quoi il sert | Où il est appelé |
| --- | --- | --- |
| `ffmpeg` | extraction, mixage, muxage | `worker/src/lib/ffmpeg.ts` |
| `ffprobe` | sonder la source | `worker/src/lib/ffmpeg.ts` |
| `yt-dlp` | télécharger depuis un lien | `worker/src/lib/ytdlp.ts` |
| `python -m demucs` | séparer voix et musique | `worker/src/separation/demucs.ts` |

Ce n'est pas un réglage à trouver, c'est une incompatibilité d'exécution.
Réécrire le mixage en WebAssembly serait un autre produit.

## 2. Ce que Containers permet, et à quel prix

Containers exécute une vraie image Docker : Node, `ffmpeg` et `yt-dlp`
s'y installent normalement. Trois contraintes décident de tout.

**Pas de GPU.** L'accès GPU de la plateforme conteneur est en accès
anticipé, sur formulaire, sans tarif public. Le worker sépare aujourd'hui
avec Demucs sur ta RTX 4080. Sur 4 cœurs de processeur, une scène de dix
minutes dépasserait le délai de trente minutes fixé dans
`worker/src/config.ts`, et tu paierais chaque seconde de calcul.

Conséquence directe : il faut basculer sur `SEPARATION_MODE=elevenlabs`.
Le code le prévoit déjà, `worker/src/separation/index.ts` ne choisit
qu'entre deux implémentations. Mais lis le commentaire en tête de
`worker/src/separation/elevenlabs.ts` avant de décider : cette voie
reconstruit le fond par soustraction de phase, et laisse un résidu de voix
si l'API ne renvoie pas du PCM. C'est un vrai changement de qualité, pas
un changement d'hébergeur.

**Le disque est éphémère.** À chaque réveil, le conteneur repart de
l'image. Ça tombe bien : le worker traite déjà son dossier de travail
comme du jetable et pousse tout vers Supabase. Rien à changer.

**Une instance plafonne à 4 vCPU, 12 Gio de mémoire, 20 Go de disque.**
C'est le gabarit `standard-4`. Suffisant : une source fait au plus 2 Go
(`MAX_UPLOAD_BYTES`) et une scène au plus dix minutes.

## 3. Le vrai travail : changer la forme du worker

Aujourd'hui `worker/src/main.ts` est une boucle infinie qui interroge
`claim_job` toutes les quelques secondes. Sur Containers, un conteneur
n'est pas maître de sa vie : il est démarré par un Worker, et il s'endort
après une période d'inactivité.

Deux montages possibles, et un seul est raisonnable.

**Garder la boucle, garder le conteneur éveillé.** Tu allonges
`sleepAfter` et tu ne touches à rien d'autre. Sauf que la mémoire et le
disque sont facturés sur ce qui est *provisionné*, pas sur ce qui est
utilisé : 12 Gio en permanence, c'est de l'ordre de 79 $ par mois pour une
machine qui ne fait rien la plupart du temps. À écarter.

**Réveiller le conteneur quand il y a du travail.** C'est la bonne forme,
et elle colle au contrat existant `claim_job` / `heartbeat` / `finishJob` :

1. un déclencheur Cron sur un Worker, toutes les minutes, ou un webhook
   Supabase sur insertion dans la table des tâches ;
2. le Worker démarre le conteneur ;
3. le conteneur prend **une** tâche, la traite, se termine ;
4. s'il reste des tâches, le tour suivant en reprend une.

Le seul changement de code est dans `main.ts` : sortir de la boucle après
une tâche traitée, au lieu de dormir. Une vingtaine de lignes.

## 4. Ce que ça coûte

Il faut le plan Workers payant, 5 $ par mois, puis l'usage. Pour un rendu
de cinq minutes sur `standard-4` :

| Poste | Calcul | Montant |
| --- | --- | --- |
| Processeur | 1 200 vCPU·s | 0,024 $ |
| Mémoire | 3 600 Gio·s | 0,009 $ |
| Disque | 6 000 Go·s | 0,0004 $ |
| **Par rendu** | | **≈ 0,033 $** |

L'enveloppe mensuelle incluse (375 vCPU·minutes, 25 Gio·heures,
200 Go·heures) couvre à peu près dix-huit rendus. Au-delà, c'est quelques
centimes pièce. S'ajoutent la sortie réseau, et surtout le coût
ElevenLabs de la séparation, qui était gratuit tant qu'elle tournait chez
toi.

## 5. Les étapes, si tu y vas

1. Passer le worker en « une tâche puis on sort » dans `main.ts`.
2. Écrire un `Dockerfile` : base Node, `apt-get install ffmpeg`, `yt-dlp`
   par pip ou par binaire, puis le dossier `worker/`. Pas de Python
   Torch, pas de Demucs, pas de `bootstrap.mjs` — tout ce que ce script
   installe devient inutile dans ce montage.
3. Un `wrangler.jsonc` avec la liaison conteneur, l'instance
   `standard-4`, et un déclencheur Cron.
4. Les secrets par `wrangler secret put` : `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`, `ELEVENLABS_API_KEY`, et
   `SEPARATION_MODE=elevenlabs`.
5. `wrangler deploy`.

## 6. Mon avis

Le PRD §5.3.1 a choisi ton ordinateur exprès : aucun port à ouvrir,
aucune facture, et un GPU qui fait la séparation gratuitement et mieux.
Cloudflare t'achète une seule chose, ne plus avoir de machine à laisser
allumée. Tu la paies en qualité de séparation, en facture mensuelle, et
en un jour de travail.

Ça vaut le coup si l'ordinateur allumé est vraiment le problème. Si c'est
juste l'idée d'un worker « propre » dans le nuage, ça n'en vaut pas le
prix. Un intermédiaire existe : garder le worker chez toi et n'y toucher
que le jour où il gêne.

---

Sources : [gabarits et limites](https://developers.cloudflare.com/containers/platform-details/limits/),
[tarifs](https://developers.cloudflare.com/containers/pricing/),
[cycle de vie d'un conteneur](https://developers.cloudflare.com/containers/platform-details/architecture/),
[questions fréquentes](https://developers.cloudflare.com/containers/faq/),
[GPU en accès anticipé](https://blog.cloudflare.com/container-platform-preview/).
