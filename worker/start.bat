@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js est introuvable.
  echo Installe-le depuis https://nodejs.org puis relance ce fichier.
  pause
  exit /b 1
)

node scripts\bootstrap.mjs
if errorlevel 1 (
  echo.
  echo L'installation des dependances a echoue. Rien n'a ete lance.
  pause
  exit /b 1
)

node worker.js
pause
