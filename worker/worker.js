// Point d'entree du worker.
//
// Le PRD impose que l'hote ne lance jamais qu'une chose : start.bat.
// Ce fichier reste donc du JavaScript pur, executable par `node worker.js`
// sans compilation prealable ; il enregistre tsx puis passe la main au
// vrai worker ecrit en TypeScript.

import { register } from 'tsx/esm/api';

register();
await import('./src/main.ts');
