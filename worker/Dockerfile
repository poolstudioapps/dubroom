# Image du worker Dub'Up, pour un job Cloud Run avec GPU.
#
# Trois mondes cohabitent ici, et c'est ce qui rend cette image grosse :
# Node pour le worker, Python et PyTorch pour Demucs, ffmpeg et yt-dlp
# pour tout ce qui touche aux fichiers. Compter trois a quatre gigas.
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

# Ces deux-la changent souvent, PyTorch jamais : elles viennent donc
# apres, pour qu'une mise a jour de yt-dlp ne reconstruise pas quatre
# gigaoctets de bibliotheques de calcul.
# ── Deno, moteur JavaScript pour yt-dlp ───────────────────────────────
#
# YouTube protege ses flux par un defi a resoudre en JavaScript. Sans
# moteur pour l'executer, yt-dlp ne peut pas y repondre et YouTube le
# traite comme un robot : « Sign in to confirm you're not a bot ». C'est
# exactement l'erreur qu'on a vue, et elle n'avait rien a voir avec
# l'adresse du serveur — la meme requete passe depuis la meme machine
# des que le defi est resolu.
#
# Deno est le seul moteur que yt-dlp active par defaut.
# L'archive est decompressee par Python plutot que par `unzip`, absent
# de cette base. L'ajouter au `apt install` du debut aurait marche aussi,
# mais aurait invalide toutes les couches suivantes — dont PyTorch, et
# ses dix minutes de telechargement.
RUN curl -fsSL -o /tmp/deno.zip \
      https://github.com/denoland/deno/releases/latest/download/deno-x86_64-unknown-linux-gnu.zip \
 && python -c "import zipfile; zipfile.ZipFile('/tmp/deno.zip').extractall('/usr/local/bin')" \
 && chmod +x /usr/local/bin/deno \
 && rm /tmp/deno.zip \
 && /usr/local/bin/deno --version | head -1

# ── yt-dlp ────────────────────────────────────────────────────────────
#
# Par pip avec l'extra `default`, et non le binaire autonome des
# « releases » GitHub.
#
# C'est cet extra qui tire `yt-dlp-ejs`, le jeu de scripts qui resout le
# defi JavaScript de YouTube. Le binaire autonome ne l'embarque pas :
# c'est lui qui manquait, bien plus que la fraicheur de la version — pip
# installe d'ailleurs exactement la meme, 2026.8.19.
#
# Ensemble avec Deno installe juste au-dessus, yt-dlp a de quoi repondre
# au defi au lieu de se faire prendre pour un robot.
#
# pip met le script dans /usr/local/bin, la ou YTDLP_PATH le cherche ;
# aucun lien a creer.
RUN pip install --no-cache-dir -U "yt-dlp[default]" \
 && test -x /usr/local/bin/yt-dlp \
 && yt-dlp --version

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
ENV FFMPEG_PATH=/usr/bin/ffmpeg \
    FFPROBE_PATH=/usr/bin/ffprobe \
    YTDLP_PATH=/usr/local/bin/yt-dlp \
    PYTHON_PATH=/usr/local/bin/python \
    WORK_DIR=/tmp/work \
    DEMUCS_DEVICE=cuda \
    SEPARATION_MODE=demucs \
    SKIP_ENV_CHECK=1 \
    EXIT_WHEN_IDLE=1

WORKDIR /app/worker
CMD ["node", "worker.js"]
