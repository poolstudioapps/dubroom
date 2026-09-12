# Où faire tourner le worker sans rien changer au rendu

Écrit pour la personne qui administre DubRoom, c'est-à-dire toi. Décision
à prendre plus tard, rien n'est implémenté.

Réponse courte : **Cloud Run Jobs avec GPU L4**. C'est le seul candidat
qui garde ton conteneur tel quel, te rend la séparation Demucs sur carte
graphique à l'identique, tombe à zéro quand personne ne double, et se
facture à la seconde.

---

## 1. Ce qu'il faut préserver

Tu as demandé « pile poil notre rendu actuel ». Ça veut dire quatre
choses concrètes, et c'est ce qui élimine presque tout le marché.

| Exigence | Pourquoi elle contraint |
| --- | --- |
| `ffmpeg`, `ffprobe`, `yt-dlp` | Binaires natifs. Exclut tout runtime JavaScript isolé. |
| Demucs `htdemucs` sur carte graphique | Sur processeur, une scène de dix minutes dépasse le délai de trente minutes du worker. Et basculer sur ElevenLabs change le son. |
| Fichiers de plusieurs centaines de mégaoctets | Exclut les plateformes à disque minuscule ou à charge utile plafonnée. |
| Quelques minutes par job, zéro job la plupart du temps | Une machine allumée en permanence coûte cent fois ce que coûte l'usage. |

La troisième ligne est celle qu'on oublie. `htdemucs` a besoin d'environ
quatre gigaoctets de mémoire vidéo à `segment=7`. N'importe quelle carte
récente suffit, mais il en faut une.

## 2. Ce que j'ai écarté, et pourquoi

**Cloudflare Workers.** Un isolat V8 ne crée pas de processus. Déjà
traité dans l'autre note.

**Cloudflare Containers.** Des conteneurs, oui, mais pas de carte
graphique publique. Il faudrait basculer la séparation sur ElevenLabs,
donc changer le son. Ça ne répond pas à ta question.

**Vast.ai.** Le moins cher du marché à l'heure, autour de trente
centimes pour une 4090. Mais c'est une place de marché de machines chez
des particuliers : pas de mise à zéro, pas de garantie de disponibilité,
et une instance qui disparaît au milieu d'un rendu. Bon pour de
l'entraînement qu'on relance, mauvais pour une soirée entre amis.

**Une machine réservée chez un hébergeur classique.** Entre 150 et 400 €
par mois pour du L4 ou du A10 en continu. Pour une charge qui tourne
peut-être deux heures par semaine, c'est absurde.

## 3. Les trois qui tiennent, comparés

Les trois savent faire tourner un conteneur avec carte graphique et
tomber à zéro. Ils se départagent sur le détail.

| | Cloud Run Jobs | Modal | RunPod Serverless |
| --- | --- | --- | --- |
| Modèle | Conteneur OCI standard | Fonctions Python décorées | Conteneur + handler |
| Ton code | Inchangé | À envelopper | À envelopper |
| Carte | L4, 24 Go | T4 à B200 | A4000 à H100 |
| Facturation | À la centaine de millisecondes | À la seconde | À la seconde |
| Zéro à l'arrêt | Oui | Oui | Oui |
| Démarrage à froid | ~5 s | quelques secondes | variable |
| Disque | Éphémère, suffisant | Éphémère + volumes | Éphémère + volumes |

**Cloud Run gagne sur la première ligne**, et c'est celle qui compte ici.
Ton worker est un programme Node qui lance des binaires ; les deux autres
attendent qu'on découpe le travail en fonctions qu'ils appellent. Sur
Cloud Run Jobs, tu écris un `Dockerfile`, tu pousses l'image, et le
programme démarre comme sur ta machine.

Le prix à payer : L4 impose au minimum quatre processeurs et seize
gigaoctets de mémoire, facturés pendant toute la vie de l'instance. Tu ne
choisis donc pas une configuration plus petite même si Demucs s'en
contenterait.

## 4. Ce que ça coûte

Hypothèse : une scène de deux minutes, environ cinq minutes de traitement
dont trois de séparation sur carte graphique. Région `europe-west4`, sans
redondance zonale.

| Volume | Temps de calcul | Ordre de grandeur |
| --- | --- | --- |
| 20 rendus par mois | 100 min | quelques euros |
| 200 rendus par mois | ~17 h | quelques dizaines d'euros |
| 2 000 rendus par mois | ~167 h | quelques centaines d'euros |

Deux remarques qui valent plus que les chiffres eux-mêmes.

D'abord, **ça monte linéairement et ça part de zéro**. C'est exactement
ce que tu as demandé : rien quand personne ne joue, et une facture
proportionnelle si ça prend.

Ensuite, **le vrai levier n'est pas le fournisseur, c'est la mise en
cache**. Une scène publiée dans la communauté est retraitée intégralement
à chaque fois que quelqu'un la lance. Garder les pistes séparées d'une
recette déjà traitée supprime la séparation, qui est la partie chère. À
deux mille rendus par mois, ça compte plus que le choix entre les trois
plateformes ci-dessus.

## 5. Ce qu'il faudra changer dans le code

Moins que pour Cloudflare, parce qu'on garde le conteneur.

1. **`main.ts` : une tâche puis on sort.** La boucle infinie devient une
   exécution qui prend un job, le traite et se termine. Un job Cloud Run
   est fait pour ça. Une vingtaine de lignes.
2. **Un `Dockerfile`.** Base CUDA, `apt-get install ffmpeg`, `yt-dlp`,
   Node, PyTorch et Demucs. `bootstrap.mjs` devient inutile : il installe
   au démarrage ce que l'image contiendra déjà.
3. **Un déclencheur.** Cloud Scheduler toutes les minutes, ou un webhook
   Supabase sur insertion dans la table des jobs. Le second est plus
   propre et évite les réveils pour rien.
4. **Les secrets** dans Secret Manager, montés en variables
   d'environnement.

Le contrat `claim_job` / `heartbeat` / `finishJob` ne bouge pas : il a été
écrit pour plusieurs workers concurrents, ce qui est exactement le cas
ici.

## 6. Mon avis

Le PRD §5.3.1 a choisi ton ordinateur exprès, et ce choix reste le bon
tant que DubRoom est un jeu entre amis : zéro facture, zéro
configuration, et une carte graphique que tu as déjà payée.

Cloud Run Jobs est ce vers quoi basculer le jour où l'une de ces trois
phrases devient vraie :

- quelqu'un veut doubler une scène et ton PC est éteint ;
- tu ne veux plus être le point de défaillance du produit ;
- il y a assez de monde pour que deux rendus se croisent.

D'ici là, migrer coûte une journée de travail et ne rapporte rien.

Si tu veux un intermédiaire sans rien réécrire : la même image Docker
tourne sur une machine louée à l'heure, que tu allumes avant une soirée
et que tu éteins après. C'est manuel, c'est un peu bête, et ça coûte
quelques dizaines de centimes par soirée.

---

Sources : [Cloud Run, GPU pour les jobs](https://docs.cloud.google.com/run/docs/configuring/jobs/gpu),
[tarifs Cloud Run](https://cloud.google.com/run/pricing),
[GPU Cloud Run en disponibilité générale](https://cloud.google.com/blog/products/serverless/cloud-run-gpus-are-now-generally-available),
[tarifs Modal](https://www.spheron.network/blog/modal-gpu-pricing-2026-per-second-billing/),
[tarifs RunPod](https://www.runpod.io/pricing),
[comparatif des prix GPU](https://getdeploying.com/gpus/nvidia-rtx-4090).
