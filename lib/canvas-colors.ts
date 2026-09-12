'use client';

/**
 * Resolution des jetons de couleur pour le canvas.
 *
 * `ctx.fillStyle = 'var(--color-character-1)'` ne leve pas d'erreur : la
 * valeur est simplement invalide, donc ignoree, et fillStyle reste au
 * noir par defaut. Sur la bande rythmo, cela donnait du texte noir sur
 * fond noir — dessine correctement, et parfaitement invisible.
 *
 * On passe donc par un element temporaire : le navigateur resout la
 * variable et rend une couleur `rgb(...)` que le canvas comprend. Le
 * resultat est memorise, la resolution coute un reflow.
 */

const cache = new Map<string, string>();

export function resolveCssColor(value: string, fallback = '#ffffff'): string {
  if (!value) return fallback;
  if (typeof window === 'undefined') return fallback;

  const cached = cache.get(value);
  if (cached) return cached;

  const probe = document.createElement('span');
  probe.style.color = value;
  probe.style.display = 'none';
  document.body.appendChild(probe);
  const resolved = window.getComputedStyle(probe).color;
  probe.remove();

  const result = resolved && resolved !== 'rgba(0, 0, 0, 0)' ? resolved : fallback;
  cache.set(value, result);
  return result;
}

/** Couleur concrete d'un personnage, prete pour le canvas. */
export function resolveCharacterColor(token: string): string {
  return resolveCssColor(`var(--color-${token})`, '#9aa4ff');
}

/** Vide le cache si le theme change en cours de session. */
export function clearColorCache(): void {
  cache.clear();
}
