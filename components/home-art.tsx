'use client';

import { characterColorVar } from '@/config/constants';

/*
 * Illustrations de l'accueil, dessinees en SVG.
 *
 * Elles reprennent les elements reels du produit — bande rythmo, forme
 * d'onde, personnages colores — plutot que des images decoratives : on
 * montre ce qu'on fait, pas un decor. Et rien a telecharger.
 */

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 480 270" className="w-full" role="img" aria-hidden>
      <rect width="480" height="270" fill="var(--color-stage)" />
      {children}
    </svg>
  );
}

/** Une scène arrive, on en tire une piste image et une piste son. */
export function ArtImport() {
  return (
    <Frame>
      <rect x="40" y="30" width="180" height="100" rx="6" fill="#000" stroke="var(--color-stage-raised)" strokeWidth="2" />
      <polygon points="118,68 148,80 118,92" fill="var(--color-stage-faint)" />
      <path d="M240 80 h60" stroke="var(--color-accent)" strokeWidth="3" markerEnd="url(#a)" />
      <defs>
        <marker id="a" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0 0 L8 4 L0 8 z" fill="var(--color-accent)" />
        </marker>
      </defs>
      <rect x="320" y="36" width="120" height="40" rx="4" fill="var(--color-stage-raised)" />
      <text x="330" y="61" fontSize="14" fill="var(--color-stage-faint)" fontFamily="sans-serif">image</text>
      <rect x="320" y="90" width="120" height="40" rx="4" fill="var(--color-stage-raised)" />
      <text x="330" y="115" fontSize="14" fill="var(--color-stage-faint)" fontFamily="sans-serif">son</text>

      {[...Array(26)].map((_, i) => (
        <rect
          key={i}
          x={40 + i * 17}
          y={175 - Math.abs(Math.sin(i * 0.8)) * 35}
          width="8"
          height={Math.abs(Math.sin(i * 0.8)) * 70 + 6}
          rx="3"
          fill="var(--color-character-5)"
          opacity="0.55"
        />
      ))}
    </Frame>
  );
}

/** Les voix sont separees et attribuees a des personnages. */
export function ArtCharacters() {
  const rows = ['character-1', 'character-4', 'character-3'];
  return (
    <Frame>
      {rows.map((token, r) => (
        <g key={token}>
          <circle cx="46" cy={64 + r * 70} r="10" fill={characterColorVar(token)} />
          <rect x="68" y={52 + r * 70} width={150 - r * 30} height="10" rx="5" fill={characterColorVar(token)} opacity="0.9" />
          <rect x="68" y={70 + r * 70} width={230 - r * 45} height="8" rx="4" fill="var(--color-stage-raised)" />
          {[...Array(4 - r)].map((_, i) => (
            <rect
              key={i}
              x={250 + i * 52}
              y={50 + r * 70}
              width="44"
              height="30"
              rx="4"
              fill={characterColorVar(token)}
              opacity="0.28"
            />
          ))}
        </g>
      ))}
    </Frame>
  );
}

/** Le texte defile sous la tete de lecture, chacun sa couleur. */
export function ArtRythmo() {
  return (
    <Frame>
      <rect x="0" y="86" width="480" height="98" fill="var(--color-stage-raised)" opacity="0.5" />
      <text x="40" y="132" fontSize="30" fontWeight="700" fill="var(--color-character-1)" fontFamily="sans-serif" opacity="0.45">
        je bois
      </text>
      <text x="168" y="132" fontSize="30" fontWeight="700" fill="var(--color-character-1)" fontFamily="sans-serif">
        et je sais
      </text>
      <text x="330" y="132" fontSize="30" fontWeight="700" fill="var(--color-character-1)" fontFamily="sans-serif" opacity="0.75">
        des choses
      </text>
      <text x="60" y="200" fontSize="15" fill="var(--color-character-4)" fontFamily="sans-serif" opacity="0.4">
        tu bois surtout
      </text>
      <line x1="168" y1="66" x2="168" y2="204" stroke="var(--color-accent)" strokeWidth="3" />
      <circle cx="168" cy="60" r="6" fill="var(--color-accent)" />
    </Frame>
  );
}

/** Tout se recolle : image d'origine, musique d'origine, vos voix. */
export function ArtRender() {
  return (
    <Frame>
      {[
        ['musique d’origine', 'character-5', 40],
        ['vos voix', 'character-2', 100],
        ['image d’origine', 'character-7', 160],
      ].map(([label, token, y]) => (
        <g key={label as string}>
          <rect x="36" y={y as number} width="300" height="34" rx="6" fill={characterColorVar(token as string)} opacity="0.3" />
          <text x="50" y={(y as number) + 23} fontSize="15" fill="var(--color-stage-text)" fontFamily="sans-serif">
            {label as string}
          </text>
        </g>
      ))}
      <path d="M352 57 q40 60 0 120" stroke="var(--color-accent)" strokeWidth="3" fill="none" />
      <rect x="372" y="92" width="76" height="52" rx="6" fill="var(--color-accent)" />
      <polygon points="398,105 420,118 398,131" fill="var(--color-accent-ink)" />
    </Frame>
  );
}
