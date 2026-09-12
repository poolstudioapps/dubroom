#!/usr/bin/env bash
# Equivalent de start.bat pour Linux et macOS : le worker doit pouvoir
# tourner sur un petit VPS sans modification (PRD 5.3).
set -e
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js est introuvable. Installe-le puis relance ce script."
  exit 1
fi

node scripts/bootstrap.mjs
node worker.js
