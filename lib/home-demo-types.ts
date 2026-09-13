/**
 * La scene de demonstration de l'accueil, telle que la vitrine la lit.
 *
 * Dans son propre fichier, sans aucune dependance : le chargement vit
 * cote serveur et la lecture cote client, et les deux doivent partager
 * ce type sans que l'un n'embarque les imports de l'autre.
 */
export interface HomeDemoWord {
  w: string;
  start_ms: number;
  end_ms: number;
}

export interface HomeDemoLine {
  start: number;
  end: number;
  text: string;
  character: string;
  words: HomeDemoWord[];
}

export interface HomeDemoCharacter {
  key: string;
  name: string;
  color: string;
}

export interface HomeDemo {
  /** La video, servie par le site lui-meme. */
  videoSrc: string;
  /** Son image fixe, pour qui a demande moins d'animation. */
  posterSrc: string;
  durationMs: number;
  characters: HomeDemoCharacter[];
  lines: HomeDemoLine[];
}
