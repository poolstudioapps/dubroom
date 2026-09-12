#!/usr/bin/env node
/**
 * Dub’Up — installation automatique de l'environnement du worker
 * (PRD §20.1).
 *
 * Exigence produit : l'hote ne lance jamais qu'une chose, start.bat. Si
 * une dependance manque, elle s'installe ; si elle est la, on passe.
 *
 * Ce fichier n'a AUCUNE dependance npm — il doit tourner avant le
 * premier `npm install`. Uniquement des modules `node:`.
 *
 * Il est idempotent : le relancer dix fois ne reinstalle rien et ne
 * casse rien. Aucun fichier marqueur, aucun etat persiste — la
 * verification elle-meme est la source de verite, elle prend une seconde
 * et ne peut pas se desynchroniser de la realite.
 *
 * Options :
 *   --check        verifie seulement, n'installe rien, code de sortie != 0
 *   --force        reinstalle tout, meme ce qui est present
 *   --skip-demucs  ignore Python, PyTorch et Demucs
 */

import { spawn, spawnSync } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline/promises';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BIN = path.join(ROOT, 'bin');
const IS_WINDOWS = process.platform === 'win32';
const EXE = IS_WINDOWS ? '.exe' : '';

const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has('--check');
const FORCE = args.has('--force');
let SKIP_DEMUCS = args.has('--skip-demucs');

const FFMPEG_ZIP =
  'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip';
const YTDLP_RELEASE =
  'https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest';

let failures = 0;

// ── Affichage ───────────────────────────────────────────────────────────

const ok = (label) => console.log(`  ✓ ${label}`);
const work = (label) => console.log(`  … ${label}`);
const warn = (label) => console.log(`  ! ${label}`);

/** Chaque echec doit etre actionnable : jamais une stacktrace seule. */
function fail(label, advice) {
  failures += 1;
  console.log(`  ✗ ${label}`);
  if (advice) {
    for (const line of advice.split('\n')) console.log(`    ${line}`);
  }
}

// ── Utilitaires ─────────────────────────────────────────────────────────

function exec(command, commandArgs, options = {}) {
  return spawnSync(command, commandArgs, {
    encoding: 'utf8',
    windowsHide: true,
    ...options,
  });
}

function execOk(command, commandArgs, options = {}) {
  const result = exec(command, commandArgs, options);
  return result.status === 0;
}

function stream(command, commandArgs, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, commandArgs, {
      stdio: 'inherit',
      windowsHide: true,
      ...options,
    });
    child.on('error', () => resolve(1));
    child.on('close', (code) => resolve(code ?? 1));
  });
}

async function exists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

/** Telechargement avec progression : une console figee passe pour un plantage. */
async function download(url, destination, label) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: { 'user-agent': 'dubup-bootstrap' },
  });
  if (!response.ok || !response.body) {
    throw new Error(`HTTP ${response.status} sur ${url}`);
  }

  const total = Number(response.headers.get('content-length') ?? 0);
  let received = 0;
  let lastShown = -1;

  const reporter = new TransformStream({
    transform(chunk, controller) {
      received += chunk.length;
      if (total > 0) {
        const pct = Math.floor((received / total) * 100);
        if (pct !== lastShown && pct % 5 === 0) {
          lastShown = pct;
          process.stdout.write(`\r  … ${label} ${pct} %   `);
        }
      }
      controller.enqueue(chunk);
    },
  });

  await pipeline(
    Readable.fromWeb(response.body.pipeThrough(reporter)),
    createWriteStream(destination),
  );
  process.stdout.write(`\r  … ${label} 100 %   \n`);
}

/** Recherche recursive : le nom du dossier racine change a chaque version. */
async function findFile(root, name) {
  const entries = await fs.readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      const found = await findFile(full, name);
      if (found) return found;
    } else if (entry.name.toLowerCase() === name.toLowerCase()) {
      return full;
    }
  }
  return null;
}

// ── 1. Dependances npm ──────────────────────────────────────────────────

async function stepNpm() {
  const installed = await exists(path.join(ROOT, 'node_modules', 'tsx'));
  if (installed && !FORCE) {
    ok('dépendances npm');
    return;
  }
  if (CHECK_ONLY) {
    fail('dépendances npm absentes', 'Lance start.bat, ou `npm install` dans worker/.');
    return;
  }

  work('installation des dépendances npm');
  const hasLock = await exists(path.join(ROOT, 'package-lock.json'));
  const npm = IS_WINDOWS ? 'npm.cmd' : 'npm';
  const code = await stream(npm, [hasLock ? 'ci' : 'install'], { cwd: ROOT });
  if (code !== 0) {
    fail(
      'npm install a échoué',
      'Vérifie ta connexion, puis relance start.bat.',
    );
    return;
  }
  ok('dépendances npm');
}

// ── 2. ffmpeg et ffprobe ────────────────────────────────────────────────

function ffmpegVersion(binary) {
  const result = exec(binary, ['-version']);
  if (result.status !== 0) return null;
  return /ffmpeg version (\S+)/.exec(result.stdout ?? '')?.[1] ?? 'inconnue';
}

async function stepFfmpeg() {
  const ffmpeg = path.join(BIN, `ffmpeg${EXE}`);
  const ffprobe = path.join(BIN, `ffprobe${EXE}`);

  if (!FORCE) {
    const version = ffmpegVersion(ffmpeg);
    if (version && ffmpegVersion(ffprobe)) {
      ok(`ffmpeg ${version}`);
      ok('ffprobe');
      return;
    }
  }
  if (CHECK_ONLY) {
    fail('ffmpeg absent', 'Lance start.bat pour l’installer automatiquement.');
    return;
  }

  await fs.mkdir(BIN, { recursive: true });

  if (!IS_WINDOWS) {
    // Sous Linux et macOS les binaires viennent du gestionnaire de
    // paquets : on ne telecharge rien, on lie ce qui est deja la.
    const system = exec('which', ['ffmpeg']).stdout?.trim();
    if (system) {
      await fs.symlink(system, ffmpeg).catch(() => undefined);
      const probe = exec('which', ['ffprobe']).stdout?.trim();
      if (probe) await fs.symlink(probe, ffprobe).catch(() => undefined);
      ok('ffmpeg (système)');
      return;
    }
    fail(
      'ffmpeg introuvable',
      'Installe-le : `sudo apt install ffmpeg` ou `brew install ffmpeg`,\npuis relance ce script.',
    );
    return;
  }

  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'dubup-ffmpeg-'));
  const zip = path.join(temp, 'ffmpeg.zip');

  try {
    await download(FFMPEG_ZIP, zip, 'téléchargement de ffmpeg');

    work('décompression');
    // PowerShell est present partout ; ni curl, ni tar, ni unzip ne le sont.
    const unzip = exec('powershell', [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      `Expand-Archive -Path '${zip}' -DestinationPath '${temp}' -Force`,
    ]);
    if (unzip.status !== 0) {
      fail(
        'décompression de ffmpeg impossible',
        'Télécharge ffmpeg depuis https://www.gyan.dev/ffmpeg/builds/\net copie ffmpeg.exe et ffprobe.exe dans worker/bin/.',
      );
      return;
    }

    // Le dossier racine de l'archive change de nom a chaque version :
    // on cherche les executables au lieu de deviner le chemin.
    const foundFfmpeg = await findFile(temp, 'ffmpeg.exe');
    const foundFfprobe = await findFile(temp, 'ffprobe.exe');
    if (!foundFfmpeg || !foundFfprobe) {
      fail('archive ffmpeg inattendue', 'Copie manuellement les .exe dans worker/bin/.');
      return;
    }

    await fs.copyFile(foundFfmpeg, ffmpeg);
    await fs.copyFile(foundFfprobe, ffprobe);
    ok(`ffmpeg ${ffmpegVersion(ffmpeg) ?? ''}`.trim());
    ok('ffprobe');
  } catch (error) {
    fail(`téléchargement de ffmpeg impossible : ${error.message}`, 'Vérifie ta connexion.');
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
}

// ── 3. yt-dlp ───────────────────────────────────────────────────────────

async function stepYtDlp() {
  const ytdlp = path.join(BIN, `yt-dlp${EXE}`);

  if (!FORCE) {
    const result = exec(ytdlp, ['--version']);
    if (result.status === 0) {
      ok(`yt-dlp ${(result.stdout ?? '').trim()}`);
      return;
    }
  }
  if (CHECK_ONLY) {
    fail('yt-dlp absent', 'Lance start.bat pour l’installer automatiquement.');
    return;
  }

  await fs.mkdir(BIN, { recursive: true });
  const assetName = IS_WINDOWS
    ? 'yt-dlp.exe'
    : process.platform === 'darwin'
      ? 'yt-dlp_macos'
      : 'yt-dlp';

  try {
    const response = await fetch(YTDLP_RELEASE, {
      headers: { 'user-agent': 'dubup-bootstrap' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const release = await response.json();
    const asset = (release.assets ?? []).find((a) => a.name === assetName);
    if (!asset) throw new Error(`asset ${assetName} introuvable`);

    await download(asset.browser_download_url, ytdlp, 'téléchargement de yt-dlp');
    if (!IS_WINDOWS) await fs.chmod(ytdlp, 0o755);

    const version = exec(ytdlp, ['--version']);
    ok(`yt-dlp ${(version.stdout ?? '').trim()}`);
  } catch (error) {
    fail(
      `téléchargement de yt-dlp impossible : ${error.message}`,
      'yt-dlp ne sert qu’aux liens YouTube. L’import de fichier fonctionne sans.',
    );
  }
}

// ── 4. Python ───────────────────────────────────────────────────────────

function pythonCommand() {
  const candidates = IS_WINDOWS ? ['python', 'py', 'python3'] : ['python3', 'python'];
  for (const candidate of candidates) {
    const result = exec(candidate, ['--version']);
    if (result.status === 0) {
      const raw = `${result.stdout ?? ''}${result.stderr ?? ''}`;
      const version = /Python (\d+)\.(\d+)\.?(\d+)?/.exec(raw);
      if (version) {
        return {
          command: candidate,
          major: Number(version[1]),
          minor: Number(version[2]),
          label: `${version[1]}.${version[2]}${version[3] ? `.${version[3]}` : ''}`,
        };
      }
    }
  }
  return null;
}

async function stepPython() {
  let python = pythonCommand();

  if (python && (python.major > 3 || python.minor >= 10)) {
    ok(`Python ${python.label}`);
    return python;
  }

  if (CHECK_ONLY) {
    fail('Python 3.10+ absent', 'Lance start.bat, ou passe SEPARATION_MODE=elevenlabs.');
    return null;
  }

  if (!IS_WINDOWS) {
    fail(
      'Python 3.10+ introuvable',
      'Installe-le : `sudo apt install python3 python3-pip` ou `brew install python`,\npuis relance ce script.',
    );
    return null;
  }

  if (!execOk('winget', ['--version'])) {
    fail(
      'Python introuvable et winget indisponible sur cette machine.',
      'Installe Python 3.11 depuis https://www.python.org/downloads/\nen cochant « Add python.exe to PATH », puis relance start.bat.',
    );
    return null;
  }

  work('installation de Python 3.11 (quelques minutes)');
  await stream('winget', [
    'install', '-e', '--id', 'Python.Python.3.11',
    '--silent', '--accept-package-agreements', '--accept-source-agreements',
  ]);

  python = pythonCommand();
  if (!python) {
    fail(
      'Python reste introuvable après installation',
      'Ferme et rouvre cette fenêtre pour recharger le PATH, puis relance start.bat.',
    );
    return null;
  }
  ok(`Python ${python.label}`);
  return python;
}

// ── 5. PyTorch ──────────────────────────────────────────────────────────

/** Version installee et disponibilite reelle de CUDA. */
function torchState(python) {
  const result = exec(python.command, [
    '-c',
    'import torch; print(torch.__version__, torch.cuda.is_available())',
  ]);
  if (result.status !== 0) return { installed: false, version: null, cuda: false };
  const [version, cuda] = (result.stdout ?? '').trim().split(' ');
  return { installed: true, version, cuda: cuda === 'True' };
}

/**
 * Choisit l'index PyTorch a utiliser.
 *
 * Les index CUDA ne publient pas de roue pour toutes les versions de
 * Python, et les plus anciens sont abandonnes a chaque sortie de torch.
 * Coder `cu121` en dur revient a installer silencieusement une version
 * CPU des que l'un ou l'autre bouge — exactement le piege que le PRD
 * signale. On interroge donc les index, du plus recent au plus ancien, et
 * on garde le premier qui propose vraiment une roue CUDA. La resolution
 * se fait a vide : rien n'est telecharge a ce stade.
 */
function pickCudaIndex(python) {
  for (const tag of ['cu130', 'cu128', 'cu126']) {
    const url = `https://download.pytorch.org/whl/${tag}`;
    const result = exec(python.command, [
      '-m', 'pip', 'install', '--dry-run', '--no-deps', '--ignore-installed',
      'torch', '--index-url', url,
    ]);
    const match = /Would install torch-(\S+)/.exec(result.stdout ?? '');
    if (match && match[1].includes('+cu')) return { url, tag, version: match[1] };
  }
  return null;
}

async function stepTorch(python) {
  const hasNvidia = execOk('nvidia-smi', []);
  const state = torchState(python);

  if (state.installed && !FORCE) {
    // Le cas qui coute le plus cher : une roue CPU sur une machine a GPU.
    // Demucs tourne alors dix fois plus lentement sans que rien ne le dise.
    if (!(hasNvidia && !state.cuda)) {
      ok(`PyTorch ${state.version} (${state.cuda ? 'CUDA disponible' : 'CPU'})`);
      return state.cuda;
    }
    if (CHECK_ONLY) {
      warn(
        `PyTorch ${state.version} est une version CPU alors qu'un GPU NVIDIA est présent.`,
      );
      console.log('    Demucs sera très lent. Relance start.bat pour corriger.');
      return false;
    }
    work('PyTorch est en version CPU sur une machine à GPU : remplacement');
  } else if (CHECK_ONLY) {
    fail('PyTorch absent', 'Lance start.bat pour l’installer automatiquement.');
    return false;
  }

  const cuda = hasNvidia ? pickCudaIndex(python) : null;
  if (hasNvidia && !cuda) {
    warn(`Aucune roue CUDA pour Python ${python.label} : PyTorch sera en version CPU.`);
    console.log('    Demucs fonctionnera, mais lentement. Python 3.11 ou 3.12 a plus de choix.');
  }

  // pip considere une version CPU deja presente comme satisfaisante et ne
  // la remplacerait pas : il faut la retirer avant.
  if (state.installed && cuda) {
    work('désinstallation de la version CPU');
    await stream(python.command, ['-m', 'pip', 'uninstall', '-y', 'torch']);
  }

  work(
    cuda
      ? `installation de PyTorch ${cuda.version} (~3 Go, une seule fois)`
      : 'installation de PyTorch CPU (~200 Mo)',
  );

  const installArgs = cuda
    ? ['-m', 'pip', 'install', '--upgrade', 'torch', '--index-url', cuda.url]
    : ['-m', 'pip', 'install', '--upgrade', 'torch'];

  const code = await stream(python.command, installArgs);
  if (code !== 0) {
    fail(
      'installation de PyTorch impossible',
      'Passe SEPARATION_MODE=elevenlabs dans worker/.env pour te passer de Demucs.',
    );
    return false;
  }

  // La seule verification qui compte vraiment.
  const after = torchState(python);
  if (hasNvidia && !after.cuda) {
    warn('GPU NVIDIA détecté mais PyTorch ne voit toujours pas CUDA.');
    console.log('    Vérifie le pilote avec nvidia-smi, puis relance avec --force.');
  } else if (after.cuda) {
    ok(`GPU NVIDIA détecté → PyTorch ${after.version}, CUDA disponible`);
  } else {
    ok(`PyTorch ${after.version} (CPU)`);
  }
  return after.cuda;
}

// ── 6. Demucs ───────────────────────────────────────────────────────────

async function stepDemucs(python) {
  if (execOk(python.command, ['-m', 'demucs', '--help']) && !FORCE) {
    const version = exec(python.command, [
      '-c',
      'import demucs; print(getattr(demucs, "__version__", ""))',
    ]);
    ok(`Demucs ${(version.stdout ?? '').trim()}`.trim());
    return true;
  }
  if (CHECK_ONLY) {
    fail('Demucs absent', 'Lance start.bat pour l’installer automatiquement.');
    return false;
  }

  work('installation de Demucs');
  // numpy et soundfile sont explicites : Demucs 4.1 ne les declare pas,
  // et torch a cesse de tirer numpy. Sans eux, pip reussit mais le
  // premier appel meurt sur un ModuleNotFoundError.
  const code = await stream(python.command, [
    '-m', 'pip', 'install', '-U', 'demucs', 'numpy', 'soundfile',
  ]);
  if (code !== 0 || !execOk(python.command, ['-m', 'demucs', '--help'])) {
    fail(
      'installation de Demucs impossible',
      'Passe SEPARATION_MODE=elevenlabs dans worker/.env pour t’en passer.',
    );
    return false;
  }
  ok('Demucs');
  return true;
}

// ── 7. Poids du modele ──────────────────────────────────────────────────

/**
 * Emplacements possibles des poids.
 *
 * Demucs 4.1 telecharge ses modeles depuis le Hub Hugging Face ; les
 * versions anterieures passaient par le cache torch.hub. Les deux
 * existent dans la nature, on regarde donc les deux plutot que de
 * supposer. Se tromper d'emplacement ne casse rien de visible : le
 * bootstrap re-telecharge simplement 300 Mo a chaque lancement, ou
 * pire, refuse de demarrer le worker.
 */
async function weightsCached() {
  const home = os.homedir();
  const hfRoot =
    process.env.HF_HOME ??
    process.env.HUGGINGFACE_HUB_CACHE ??
    path.join(home, '.cache', 'huggingface');

  // Hub HF : un dossier models--<org>--<nom> par modele.
  for (const base of [path.join(hfRoot, 'hub'), hfRoot]) {
    try {
      const entries = await fs.readdir(base);
      if (entries.some((name) => /^models--.*demucs/i.test(name))) return true;
    } catch {
      // Dossier absent : on essaie le suivant.
    }
  }

  // Cache torch.hub des versions plus anciennes. On teste la presence
  // d'un .th plutot que de deviner un nom de fichier qui porte un hash.
  try {
    const checkpoints = path.join(home, '.cache', 'torch', 'hub', 'checkpoints');
    const entries = await fs.readdir(checkpoints);
    if (entries.some((name) => name.endsWith('.th'))) return true;
  } catch {
    // Absent aussi.
  }

  return false;
}

async function stepWeights(python, model) {
  if ((await weightsCached()) && !FORCE) {
    ok(`poids ${model} en cache`);
    return;
  }
  if (CHECK_ONLY) {
    fail(
      'poids du modèle absents',
      'Lance start.bat : ils seront téléchargés une fois pour toutes.',
    );
    return;
  }

  // Telechargement force a froid : si ca arrivait pendant un vrai job,
  // l'utilisateur verrait une etape bloquee plusieurs minutes sans
  // explication (PRD §20.1.6).
  work(`préchargement des poids ${model} (~300 Mo, une seule fois)`);
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'dubup-warmup-'));
  const silence = path.join(temp, 'warmup.wav');

  try {
    const ffmpeg = path.join(BIN, `ffmpeg${EXE}`);
    const generated = exec(ffmpeg, [
      '-hide_banner', '-f', 'lavfi',
      '-i', 'anullsrc=r=44100:cl=stereo',
      '-t', '2', '-y', silence,
    ]);
    if (generated.status !== 0) {
      warn('préchargement ignoré : ffmpeg indisponible');
      return;
    }

    const code = await stream(python.command, [
      '-m', 'demucs',
      '--two-stems=vocals',
      '-n', model,
      '-o', path.join(temp, 'out'),
      silence,
    ]);

    // On re-verifie le cache : un demucs qui sort en 0 ne prouve pas que
    // les poids sont la ou on les cherchera au prochain lancement, et
    // c'est exactement ce qui ferait echouer `--check` ensuite.
    if (code === 0 && (await weightsCached())) {
      ok(`poids ${model} en cache`);
    } else if (code === 0) {
      warn(
        `Demucs fonctionne mais ses poids ne sont pas la ou ${path.basename(process.argv[1])} les cherche.`,
      );
      console.log('    Sans conséquence sur le rendu ; signale-le si --check le répète.');
    } else {
      warn('préchargement des poids échoué : il se fera au premier import');
    }
  } finally {
    await fs.rm(temp, { recursive: true, force: true });
  }
}

// ── 8. Fichier .env ─────────────────────────────────────────────────────

const REQUIRED_ENV = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'ELEVENLABS_API_KEY'];

function parseEnv(content) {
  const values = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    values[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return values;
}

function setEnvLine(content, key, value) {
  const pattern = new RegExp(`^${key}=.*$`, 'm');
  if (pattern.test(content)) return content.replace(pattern, `${key}=${value}`);
  return `${content.replace(/\s*$/, '')}\n${key}=${value}\n`;
}

async function stepEnv() {
  const envPath = path.join(ROOT, '.env');
  const examplePath = path.join(ROOT, '.env.example');

  if (!(await exists(envPath))) {
    if (CHECK_ONLY) {
      fail('worker/.env absent', 'Lance start.bat : il te demandera les clés.');
      return null;
    }
    await fs.copyFile(examplePath, envPath);
    work('worker/.env créé depuis .env.example');
  }

  let content = await fs.readFile(envPath, 'utf8');
  let values = parseEnv(content);

  // WORKER_ID se remplit tout seul.
  if (!values.WORKER_ID) {
    content = setEnvLine(content, 'WORKER_ID', os.hostname());
    await fs.writeFile(envPath, content, 'utf8');
    values = parseEnv(content);
  }

  // Inutile d'installer un gigaoctet de PyTorch pour quelqu'un qui ne
  // s'en servira pas (PRD §20.1.9).
  if ((values.SEPARATION_MODE ?? '').toLowerCase() === 'elevenlabs') {
    SKIP_DEMUCS = true;
  }

  const missing = REQUIRED_ENV.filter((key) => !values[key]);
  if (missing.length === 0) {
    ok('.env complet');
    return values;
  }

  if (CHECK_ONLY) {
    fail(
      `clés manquantes dans worker/.env : ${missing.join(', ')}`,
      'Lance start.bat pour les saisir.',
    );
    return values;
  }

  // Sans terminal (double-clic redirige, CI, service Windows), une
  // question attendrait une reponse qui n'arrivera jamais : on echoue
  // avec la marche a suivre plutot que de boucler.
  if (!process.stdin.isTTY) {
    fail(
      `clés manquantes dans worker/.env : ${missing.join(', ')}`,
      'Ouvre worker/.env et renseigne-les à la main, puis relance start.bat.',
    );
    return values;
  }

  // Seule interaction du script. Une fois faite, elle ne se reproduit plus.
  console.log('');
  console.log('  Il manque quelques clés. Colle-les ici, une par ligne.');
  console.log('');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    for (const key of missing) {
      let value = '';
      while (!value) {
        value = (await rl.question(`  ${key} : `)).trim();
      }
      content = setEnvLine(content, key, value);
    }
  } finally {
    rl.close();
  }

  await fs.writeFile(envPath, content, 'utf8');
  console.log('');
  ok('.env complet');
  return parseEnv(content);
}

// ── Orchestration ───────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('Dub’Up worker — vérification de l’environnement');
  console.log('');

  await stepNpm();
  await stepFfmpeg();
  await stepYtDlp();

  const env = await stepEnv();
  const model = env?.DEMUCS_MODEL || 'htdemucs';

  if (SKIP_DEMUCS) {
    ok(
      args.has('--skip-demucs')
        ? 'Demucs ignoré (--skip-demucs)'
        : 'Demucs ignoré (SEPARATION_MODE=elevenlabs)',
    );
  } else {
    const python = await stepPython();
    if (python) {
      const cudaReady = await stepTorch(python);
      const demucsReady = await stepDemucs(python);
      if (demucsReady) await stepWeights(python, model);

      // On note le device reellement disponible, pas celui qu'on espere.
      if (env && !CHECK_ONLY) {
        const envPath = path.join(ROOT, '.env');
        let content = await fs.readFile(envPath, 'utf8');
        content = setEnvLine(content, 'DEMUCS_DEVICE', cudaReady ? 'cuda' : 'cpu');
        if (python.command !== 'python') {
          content = setEnvLine(content, 'PYTHON_PATH', python.command);
        }
        await fs.writeFile(envPath, content, 'utf8');
      }
    }
  }

  console.log('');
  if (failures > 0) {
    console.log(`  ${failures} élément(s) manquant(s).`);
    console.log('');
    process.exit(1);
  }

  console.log(CHECK_ONLY ? '  Tout est prêt.' : '  Tout est prêt. Démarrage du worker…');
  console.log('');
}

main().catch((error) => {
  console.error('');
  console.error(`  Erreur inattendue : ${error.message}`);
  console.error('');
  process.exit(1);
});
