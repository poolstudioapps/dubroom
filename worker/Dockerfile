# Image du worker Dub'Up, pour un job Cloud Run avec GPU.
#
# Elle fait tout sauf telecharger depuis YouTube : preparation des
# fichiers importes, suite des preparations YouTube une fois la video mise
# en ligne par le PC de l'hote, et rendus.
#
# Trois mondes cohabitent ici, et c'est ce qui rend cette image grosse :
# Node pour le worker, Python et PyTorch pour Demucs, ffmpeg pour tout ce
# qui touche aux fichiers. Compter trois a quatre gigas.
#
# Le pilote de Cloud Run est un 580.x, soit CUDA 13. Les roues PyTorch
# compilees pour CUDA 12.8 tournent dessus sans rien changer : un pilote
# accepte toujours un runtime plus ancien que lui. On prend donc cu128,
# qui est la version stable la mieux testee, plutot que de courir apres
# la derniere.
#
# Ces roues embarquent elles-memes les bibliotheques CUDA dont elles ont
# besoin. Inutile de partir d'une image `nvidia/cuda` : une base Debian
# ordinaire suffit, et elle est bien plus legere.

FROM python:3.11-slim-bookworm

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    DEBIAN_FRONTEND=noninteractive

# ── Outils systeme ────────────────────────────────────────────────────
# ffmpeg et ffprobe viennent du depot Debian : c'est une version
# complete, avec rubberband et aecho, qui sont les deux filtres dont le
# mixage se sert pour les effets de voix.
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      ca-certificates curl ffmpeg xz-utils \
 && rm -rf /var/lib/apt/lists/*

# ── Node ──────────────────────────────────────────────────────────────
ARG NODE_VERSION=22.11.0
RUN curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz" \
      -o /tmp/node.tar.xz \
 && tar -xJf /tmp/node.tar.xz -C /usr/local --strip-components=1 \
 && rm /tmp/node.tar.xz \
 && node --version

# ── PyTorch et Demucs ─────────────────────────────────────────────────
RUN pip install --no-cache-dir \
      torch torchaudio --index-url https://download.pytorch.org/whl/cu128 \
 && pip install --no-cache-dir demucs soundfile

# Le modele est telecharge au build, pas au premier job : sans cela, la
# premiere scene paie deux cents megaoctets de telechargement pendant que
# le GPU tourne a vide et que la facture court.
RUN python -c "from demucs.pretrained import get_model; get_model('htdemucs')"

# ── Pas de yt-dlp ─────────────────────────────────────────────────────
#
# Cette image ne telecharge jamais depuis YouTube : YouTube refuse les
# adresses de centre de donnees, verifie depuis Cloud Run, Cloud Build et
# a travers dix proxys. Le telechargement est fait par le PC de l'hote,
# qui met la video en ligne puis passe le relais. yt-dlp et Deno, son
# moteur JavaScript, n'ont donc plus rien a faire ici.

# ── Le worker ─────────────────────────────────────────────────────────
WORKDIR /app
COPY worker/package.json worker/package-lock.json ./worker/
RUN cd worker && npm ci --omit=dev

# `config/` et `lib/` sont partages avec l'application : le worker
# importe la segmentation et les constantes depuis la racine du depot.
COPY config ./config
COPY lib ./lib
COPY worker/src ./worker/src
COPY worker/worker.js ./worker/

# ── Reglages propres au conteneur ─────────────────────────────────────
# WORKER_ROLE=cloud : la base ne confie a cette image aucune tache qui
# doit telecharger depuis YouTube. WORKER_ID fixe : sans lui, chaque
# execution se presenterait sous le nom de son conteneur, et la table des
# workers grossirait d'une ligne par scene.
ENV FFMPEG_PATH=/usr/bin/ffmpeg \
    FFPROBE_PATH=/usr/bin/ffprobe \
    PYTHON_PATH=/usr/local/bin/python \
    WORK_DIR=/tmp/work \
    DEMUCS_DEVICE=cuda \
    SEPARATION_MODE=demucs \
    SKIP_ENV_CHECK=1 \
    EXIT_WHEN_IDLE=1 \
    WORKER_ROLE=cloud \
    WORKER_ID=cloud-run

WORKDIR /app/worker
CMD ["node", "worker.js"]
