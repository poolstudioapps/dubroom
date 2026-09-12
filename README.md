# DubRoom

Studio de doublage collaboratif dans le navigateur. Une scène de film, des amis,
chacun prend un personnage, enregistre ses répliques de son côté, et on découvre
le résultat mixé à la fin.

Spécification complète : [PRD-dubroom.md](PRD-dubroom.md).

---

## Ce qui tourne où

| Couche | Où | Rôle |
|---|---|---|
| Front Next.js 15 | Vercel | Toutes les pages, l'enregistrement des prises, le lobby temps réel |
| Postgres, Auth, Storage, Realtime | Supabase | Données, liste blanche, fichiers, file d'attente |
| Worker Node | PC de l'hôte | ffmpeg, yt-dlp, Demucs — les trois seules choses impossibles en serverless |

Le worker est le seul à initier la connexion : il interroge Supabase en boucle.
Aucun port à ouvrir, aucun tunnel, rien à configurer sur la box.

---

## Mise en route

### 1. Supabase

Crée un projet sur [supabase.com](https://supabase.com), puis :

```bash
npm install
npx supabase link --project-ref <ref-du-projet>
npx supabase db push          # applique supabase/migrations/
```

Ajoute ensuite les adresses autorisées. Personne d'autre ne pourra ni créer ni
rejoindre une scène :

```sql
insert into allowed_emails (email) values ('toi@exemple.fr') on conflict do nothing;
```

Dans **Authentication → URL Configuration**, renseigne l'URL du site et ajoute
`https://<ton-domaine>/auth/callback` aux redirections autorisées. L'adresse de
retour du magic link est déduite de `window.location.origin`, donc si tu veux que
les déploiements de prévisualisation Vercel fonctionnent aussi, ajoute le motif
correspondant.

Les trois buckets (`sources`, `takes`, `renders`) sont créés par la migration,
en privé. Rien n'est jamais accessible sans URL signée.

### 2. Front

```bash
cp .env.example .env.local     # remplis les deux variables
npm run dev
```

| Variable | Où la trouver |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | idem |

La clé service Supabase et la clé ElevenLabs **ne doivent jamais** arriver ici.

### 3. Worker

Sur la machine qui fera les traitements, un seul geste :

```
worker\start.bat
```

Le script vérifie l'environnement et installe ce qui manque — ffmpeg, yt-dlp,
Python, PyTorch, Demucs, les poids du modèle — puis démarre la boucle. Il ne
pose qu'une question, la première fois : les clés à mettre dans `worker/.env`.

Node.js est la seule chose qu'il ne peut pas installer lui-même : si absent, il
renvoie vers [nodejs.org](https://nodejs.org).

Relancé ensuite, il démarre en moins de trois secondes sans rien réinstaller.

Sous Linux ou macOS, `./worker/start.sh` fait la même chose.

---

## Commandes utiles

```bash
npm run dev          # front en développement
npm run build        # build de production
npm run typecheck    # TypeScript strict, front
npm run db:push      # applique les migrations
npm run db:types     # régénère lib/supabase/database.types.ts

cd worker
npm run check        # vérifie l'environnement sans rien installer
npm run setup        # installe ce qui manque
npm run selftest     # auto-test du moteur de mixage, avec ffmpeg réel
npm run probe:scribe # confronte l'adaptateur Scribe à la vraie réponse de l'API
npm run typecheck    # TypeScript strict, worker
```

`npm run selftest` fabrique une scène synthétique et rejoue le chemin complet du
rendu. C'est le test à lancer en premier si un mixage part de travers : il isole
le filtergraph du reste du pipeline.

---

## Choix qui méritent une explication

**Le découpage en clips vit en SQL.** Il est rejoué après chaque correction de
l'hôte sur l'écran de préparation. Le mettre dans le worker aurait imposé un job
là où le PRD demande un recalcul instantané, et deux implémentations du même
algorithme. Les seuils, eux, restent dans `config/constants.ts` et sont passés
en paramètre : la base ne les connaît pas.

**Toutes les transitions d'état passent par une fonction Postgres.** Le front
ne fait jamais d'`UPDATE` sur une colonne de statut. C'est ce qui permet de
tenir les invariants — un seul joueur par personnage, une seule prise retenue
par clip, plus rien de modifiable après l'ouverture du lobby — sans les
disperser dans des policies RLS illisibles. La clé service reste sur le worker.

**Supprimer une réplique ne l'efface pas.** Le PRD demande que la VO d'origine
soit conservée à cet endroit dans le rendu, ce qui suppose de connaître encore
ses bornes. La réplique est donc marquée `is_deleted` : exclue des clips,
réinjectée au mixage, et rétablissable d'un clic.

**La séparation de sources est isolée derrière une interface unique.** Basculer
entre Demucs et ElevenLabs ne touche qu'à `SEPARATION_MODE` ; le reste du
pipeline ne connaît que `voicePath` et `musicPath`. Le stem voix n'est jamais
jeté : il sert à réinjecter la VO des personnages non doublés.

**La syntaxe du filtergraph est détectée, pas devinée.** ffmpeg 8 a supprimé
`-filter_complex_script` au profit de `-/filter_complex`. Le worker essaie la
forme moderne et retombe sur l'ancienne si ffmpeg ne la connaît pas, plutôt que
de déduire la syntaxe d'un numéro de version qui ne dit rien des builds système.

---

## Points de vigilance

- **La roue PyTorch se choisit, elle ne se code pas en dur.** Les index CUDA
  abandonnent les anciens à chaque sortie de torch, et tous ne publient pas pour
  toutes les versions de Python. Le bootstrap interroge `cu130`, `cu128` puis
  `cu126` et garde le premier qui propose vraiment une roue CUDA. S'il n'en
  trouve aucune, il le dit au lieu d'installer une version CPU en silence, et il
  remplace une version CPU déjà présente sur une machine à GPU.
- **Demucs ne déclare pas numpy**, et torch a cessé de le tirer. Sans lui,
  `pip install demucs` réussit et le premier appel meurt. Le bootstrap installe
  `numpy` et `soundfile` explicitement.
- **yt-dlp casse régulièrement.** C'est dans la nature de l'outil. Mets-le à jour
  avec `worker\bin\yt-dlp.exe -U`. Ne l'automatise pas au démarrage du worker :
  une mise à jour ratée bloquerait tout. L'import de fichier reste le chemin
  principal et ne dépend de rien.
- **Quota Supabase gratuit** : 1 Go de stockage, 2 Go de bande passante sortante
  par mois. Un rendu de 3 min en 720p pèse ~30 Mo. L'écran des scènes affiche la
  consommation et alerte à 80 %.
- **Le mixage n'est pas testé sur une vraie scène** tant que la séparation n'a
  pas été validée sur trois extraits représentatifs (PRD §5.4, lot 0).

---

## Usage

Strictement privé, entre amis. Pas de galerie publique, pas de partage hors
session, pas d'indexation — `robots.txt` en `Disallow: /` et `noindex` sur
toutes les pages. Cette contrainte est structurelle et doit le rester.
