# Faire tourner le worker sur Cloud Run

Écrit pour la personne qui administre Dub'Up, c'est-à-dire toi. Objectif :
que les scènes se préparent et se rendent même quand ton PC est éteint.

Rien de ce document ne me demande un secret. Tu exécutes les commandes,
les clés restent chez toi et chez Google. La seule chose dont j'ai besoin
en retour tient en deux lignes, et elle est tout en bas.

---

## Pourquoi des jobs et pas un service

Un service Cloud Run répond à des requêtes HTTP et s'endort entre deux.
Le worker, lui, tire des tâches d'une file et travaille pendant plusieurs
minutes : c'est un **job**, pas un serveur. Un job se déclenche, tourne
jusqu'au bout, s'arrête, et n'est facturé que pendant ce temps-là.

C'est le bon modèle ici : trois scènes par semaine coûtent trois quarts
d'heure de GPU par semaine, pas un GPU allumé en permanence.

---

## Ce qu'il faut décider avant

**La région.** Le L4 est disponible à `europe-west1` (Belgique) et
`europe-west4` (Pays-Bas), entre autres. Prends une des deux : la base
Supabase est en Irlande, et garder le traitement en Europe évite un
aller-retour transatlantique par fichier — et une question de plus dans
la politique de confidentialité.

**Le GPU.** `nvidia-l4`, 24 Go de mémoire vidéo. C'est très au-dessus de
ce que demande Demucs, et c'est le moins cher des deux modèles proposés.
L'autre, le RTX PRO 6000, exige 20 processeurs et 80 Go de mémoire : hors
sujet.

**Le quota.** Au premier déploiement dans une région, Google accorde
automatiquement 3 GPU L4. Tu n'as rien à demander tant que tu ne fais pas
tourner plus de trois scènes en parallèle.

---

## Étape 0 — installer l'outil

`gcloud` ne vient pas avec Windows. En PowerShell :

```powershell
winget install --id Google.CloudSDK -e
```

Ferme la fenêtre et rouvres-en une : le `PATH` n'est pas rechargé dans un
terminal déjà ouvert, et c'est la cause numéro un du « terme gcloud n'est
pas reconnu » juste après l'installation.

## Étape 1 — le projet

Le projet Dub'Up existe déjà. Ce qu'il faut maintenant, c'est son
**identifiant**, qui n'est pas son nom d'affichage : il ressemble à
`dub-up-473...`. On le lit en haut de la console, ou ici :

```powershell
gcloud auth login
gcloud projects list
```

Pose ensuite les deux valeurs une fois pour toutes. Tout ce qui suit s'en
sert, et une fenêtre fermée les oublie : si tu reprends plus tard, rejoue
ces deux lignes.

```powershell
$PROJET = "IDENTIFIANT_DU_PROJET"
$REGION = "europe-west1"
gcloud config set project $PROJET
```

Vérifie que la facturation est active sur ce projet depuis la console
web, puis :

```powershell
gcloud services enable `
  run.googleapis.com `
  artifactregistry.googleapis.com `
  cloudbuild.googleapis.com `
  secretmanager.googleapis.com
```

## Étape 2 — les secrets

Trois valeurs, et aucune ne doit se retrouver dans l'image ni dans une
variable d'environnement en clair.

Elles sont dans `worker/.env` sur ta machine. Le passage par un fichier
temporaire n'est pas de la coquetterie : en PowerShell, tout ce qui part
dans un tuyau se voit ajouter un retour à la ligne, et ce caractère
invisible se retrouve dans la clé. L'authentification échoue alors avec un
message qui ne dit jamais pourquoi.

```powershell
function Set-Secret($nom, $valeur) {
  $f = New-TemporaryFile
  [System.IO.File]::WriteAllText($f, $valeur)   # sans retour à la ligne
  gcloud secrets create $nom --data-file="$f" --replication-policy=automatic
  Remove-Item $f
}

Set-Secret SUPABASE_URL             "https://xxxx.supabase.co"
Set-Secret SUPABASE_SERVICE_ROLE_KEY "eyJ..."
Set-Secret ELEVENLABS_API_KEY        "sk_..."
```

## Étape 3 — l'image

Le `Dockerfile` est écrit : `worker/Dockerfile`. Il embarque Node, ffmpeg,
yt-dlp, PyTorch et Demucs, et télécharge le modèle au build pour que la
première scène ne le paie pas pendant que le GPU tourne.

D'abord le dépôt qui recevra l'image :

```powershell
gcloud artifacts repositories create worker `
  --repository-format=docker `
  --location=$REGION
```

Puis la construction. Elle se lance depuis **la racine du dépôt**, pas
depuis `worker/` : le worker importe `config/` et `lib/`, partagés avec
l'application.

```powershell
$IMAGE = "$REGION-docker.pkg.dev/$PROJET/worker/dubup:1"
$SA = "1074035688713-compute@developer.gserviceaccount.com"

gcloud builds submit --config cloudbuild.yaml `
  --substitutions=_IMAGE=$IMAGE `
  --service-account="projects/$PROJET/serviceAccounts/$SA" `
  --default-buckets-behavior=regional-user-owned-bucket
```

Le `--service-account` n'est pas optionnel, et c'est la surprise du
parcours : depuis 2024, un projet neuf ne reçoit plus l'identité de
build historique, et une soumission sans compte nommé échoue sur un
`PERMISSION_DENIED` — y compris quand on est propriétaire du projet. Le
compte de calcul par défaut fait l'affaire, à condition de lui avoir
donné de quoi construire, journaliser et pousser une image :

```powershell
foreach ($r in @("roles/cloudbuild.builds.builder","roles/logging.logWriter",
                 "roles/artifactregistry.writer","roles/storage.admin")) {
  gcloud projects add-iam-policy-binding $PROJET `
    --member="serviceAccount:$SA" --role=$r --condition=None
}
```

Compte un quart d'heure la première fois, et trois à quatre gigaoctets
d'image : PyTorch et ses bibliothèques CUDA pèsent ce qu'elles pèsent.

## Étape 4 — le job

```powershell
gcloud run jobs create dubup-worker `
  --image=$IMAGE `
  --region=$REGION `
  --gpu=1 `
  --gpu-type=nvidia-l4 `
  --no-gpu-zonal-redundancy `
  --cpu=4 `
  --memory=16Gi `
  --max-retries=1 `
  --task-timeout=30m `
  --set-secrets="SUPABASE_URL=SUPABASE_URL:latest,SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY:latest,ELEVENLABS_API_KEY=ELEVENLABS_API_KEY:latest"
```

Les guillemets autour de `--set-secrets` sont indispensables sous
PowerShell : sans eux, la virgule y construit un tableau, l'argument part
en trois morceaux séparés par des espaces, et gcloud se plaint d'un
« Invalid secret spec » qui ne dit rien de la vraie cause. La règle vaut
pour tout argument gcloud contenant une virgule.

Le job lit ses secrets au démarrage, ce qui suppose qu'on l'y ait
autorisé. À faire une fois, avant la première exécution :

```powershell
foreach ($s in @("SUPABASE_URL","SUPABASE_SERVICE_ROLE_KEY","ELEVENLABS_API_KEY")) {
  gcloud secrets add-iam-policy-binding $s `
    --member="serviceAccount:$SA" --role="roles/secretmanager.secretAccessor"
}
```

`--no-gpu-zonal-redundancy` est **obligatoire** pour un job avec GPU, et
c'est aussi le tarif le moins cher. `--max-retries=1` parce que le worker
sait déjà reprendre une tâche abandonnée : laisser Google réessayer en
plus ferait tourner deux fois le même rendu.

Le worker sait déjà qu'il tourne dans un job : l'image pose
`EXIT_WHEN_IDLE=1`, et il s'arrête de lui-même après cinq interrogations
sans rien à faire. Sans cela il attendrait indéfiniment, et le GPU serait
facturé pour une boucle vide.

## Étape 5 — le déclenchement

**C'est fait.** Un job ne se lance pas tout seul, et plutôt qu'un minuteur
qui regarde la file toutes les cinq minutes, c'est la base qui prévient
au moment où une tâche y entre. Une scène part donc dans la seconde, et
rien ne tourne à vide.

Le trajet, de l'insertion au GPU :

```
INSERT dans jobs
  └─ déclencheur Postgres  jobs_reveillent_le_worker
      └─ pg_net            appel HTTP sortant
          └─ fonction Edge reveiller-worker
              ├─ signe une assertion avec la clé du compte de service
              ├─ l'échange contre un jeton d'accès Google
              └─ POST jobs/dubup-worker:run
```

Trois pièces, et ce qui justifie chacune :

**Le compte de service `dubup-trigger`.** Il n'a qu'un droit,
`run.invoker` sur ce job précis. Pas de quoi lire la base, pas de quoi
créer quoi que ce soit, pas de quoi toucher un autre service.

**La fonction Edge.** Elle existe parce que l'API de Cloud Run n'accepte
que des jetons OAuth, et que signer une assertion RS256 est précisément
ce que Postgres ne sait pas faire. Quarante lignes de cryptographie
standard, et la clé du compte de service ne quitte jamais les secrets du
projet Supabase — ni Vercel, ni le navigateur, ni le dépôt n'en voient la
couleur.

**Le jeton partagé.** La fonction est déclarée sans vérification de jeton
utilisateur, puisque c'est Postgres qui l'appelle et qu'il n'a pas de
session à présenter. Elle serait donc ouverte à qui connaît son adresse,
et chaque appel démarre un GPU. Un en-tête `x-reveil-token` ferme la
porte.

Un détail qui a coûté une correction : `pg_net` s'installe **toujours**
dans un schéma nommé `net`, même quand on demande `with schema
extensions`. Un déclencheur écrit avec `extensions.net.http_post` échoue
à la première scène, et silencieusement.

Et un cas qui n'est pas une erreur : trois répliques enregistrées coup
sur coup produisent trois réveils, et Cloud Run refuse les deux derniers
avec un 409. La fonction le traite comme un succès — le job déjà en cours
videra la file de toute façon.

### Ce qui reste à éprouver

Aucune scène réelle n'est encore passée par ce worker. Ce qui est vérifié
s'arrête à : l'image démarre, le GPU est attribué, les secrets se lisent,
la base répond, l'arrêt automatique fonctionne, et le déclencheur lance
bien le job.

Restent quatre inconnues, à lever par un seul test :

- **Demucs sur GPU** n'a jamais tourné là-bas ;
- **yt-dlp depuis un centre de données** — le vrai risque, YouTube
  bloquant souvent les adresses des hébergeurs ;
- **le rendu et l'envoi** depuis Cloud Run ;
- **deux workers pour une file.** Tant que le PC en fait tourner un, on
  ne sait pas lequel a pris la tâche, et aucun test n'est concluant.

Le test décisif tient en deux gestes : arrêter le worker du PC, puis
importer une scène depuis un lien YouTube. Si elle arrive au lobby avec
ses personnages, c'est bon.

## Ce que ça coûte

Un L4 à `europe-west1`, sans redondance zonale, est facturé à la seconde,
GPU et processeur compris. Une scène d'une minute mobilise la machine
deux à trois minutes — séparation comprise, qui est de loin la partie la
plus lourde.

Trois scènes par semaine, c'est de l'ordre de dix minutes de GPU par
semaine. Le stockage des images dans Artifact Registry coûte quelques
centimes par mois. Rien de tout cela ne se compare à un GPU réservé.

Deux garde-fous à poser dès le premier jour :

- un **budget** avec alerte sur le projet, dans la console de facturation ;
- `--task-timeout=30m`, déjà dans la commande : une tâche qui part en
  boucle s'arrête d'elle-même au lieu de tourner la nuit.

---

## Ce dont j'ai besoin de toi

Deux lignes, et rien de secret :

1. **l'identifiant du projet** que tu as créé, et **la région** choisie ;
2. le retour de `gcloud run jobs describe dubup-worker --region=$REGION`
   une fois l'étape 4 passée, ou le message d'erreur si elle échoue.

Avec ça j'écris le déclencheur — la fonction Supabase qui lance un job
dès qu'une tâche entre dans la file, pour ne plus rien faire tourner à
vide.

Le reste est déjà fait : le `Dockerfile`, le répertoire de travail
éphémère, et l'arrêt automatique quand la file se vide.

Ne m'envoie **jamais** une clé de compte de service, ni le contenu des
secrets. Tout ce qui précède s'exécute chez toi.
