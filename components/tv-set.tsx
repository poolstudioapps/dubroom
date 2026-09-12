/**
 * Le poste de television.
 *
 * Tout le produit est joue devant un ecran, entre amis : autant que
 * l'interface soit ce poste. Le cadre est entierement en CSS — pas une
 * image a charger, et il suit le theme si les couleurs changent.
 *
 * Il vit dans son propre fichier parce que deux entrees s'en servent :
 * l'application connectee (`AppShell`) et l'accueil, qui n'a ni barre de
 * deconnexion ni session. Les avoir dessines separement les avait deja
 * fait diverger — l'accueil avait perdu le haut-parleur et la console.
 *
 * Deux tailles, decidees par `slim`, qui distingue les ecrans de travail
 * des menus. La preparation et le studio recoivent un cadre mince : ils
 * ont besoin de la place, et on n'y contemple pas le decor.
 */
export function TvSet({
  children,
  slim,
  fill,
}: {
  children: React.ReactNode;
  slim?: boolean;
  /**
   * Occuper la hauteur restante au lieu de la reclamer.
   *
   * Sert au studio : pendant une prise, tout doit tenir a l'ecran d'un
   * seul coup. Faire defiler pour retrouver le bouton d'arret, c'est
   * rater la fin de la replique.
   */
  fill?: boolean;
}) {
  return (
    <div className={['flex flex-col', fill ? 'min-h-0 flex-1' : ''].join(' ')}>
      <div
        className={[
          'tv-frame flex gap-3 rounded-[1.75rem] border-[3px] border-bezel-dark bg-bezel',
          'shadow-[0_24px_60px_-16px_rgb(0_0_0/0.7),inset_0_2px_0_0_rgb(255_255_255/0.18)]',
          slim ? 'p-3' : 'p-4 sm:p-6',
          fill ? 'min-h-0 flex-1' : '',
        ].join(' ')}
      >
        {/* L'ecran. Le contenu de l'application vit ici. */}
        <div
          className={[
            'tv-screen relative min-w-0 flex-1 overflow-hidden rounded-[1.25rem] bg-screen',
            'shadow-[inset_0_0_0_3px_oklch(0.32_0.12_300),inset_0_0_40px_10px_rgb(0_0_0/0.12)]',
            slim ? 'p-4' : 'p-5 sm:p-8',
            fill ? 'flex min-h-0 flex-col' : '',
          ].join(' ')}
        >
          {/* Reflet diagonal, tres discret : il donne le verre. */}
          <div
            className="tv-gloss pointer-events-none absolute inset-0 bg-gradient-to-br from-white/35 via-transparent to-transparent"
            aria-hidden
          />
          <div className={['relative', fill ? 'flex min-h-0 flex-1 flex-col' : ''].join(' ')}>
            {children}
          </div>
        </div>

        {/* Colonne de droite : haut-parleur et boutons, decor pur. */}
        {!slim ? (
          <div
            className="tv-speaker hidden w-14 shrink-0 flex-col items-center gap-4 py-2 lg:flex"
            aria-hidden
          >
            <div className="grille h-28 w-10 rounded-md bg-bezel-dark/60" />
            <Knob />
            <Knob />
            <div className="grille h-28 w-10 rounded-md bg-bezel-dark/60" />
          </div>
        ) : null}
      </div>

      {/* La console, sous le poste. Decor egalement. */}
      {!slim ? (
        <div
          className="tv-console mx-auto -mt-1 flex w-[85%] items-center justify-between gap-4 rounded-b-2xl border-x-[3px] border-b-[3px] border-console-dark bg-console px-4 py-3 shadow-[0_12px_24px_-8px_rgb(0_0_0/0.6)]"
          aria-hidden
        >
          <div className="flex gap-2">
            <span className="h-4 w-4 rounded-full bg-console-dark/70 shadow-[inset_0_1px_2px_rgb(0_0_0/0.4)]" />
            <span className="h-4 w-4 rounded-full bg-console-dark/70 shadow-[inset_0_1px_2px_rgb(0_0_0/0.4)]" />
          </div>
          <div className="grille h-3 max-w-40 flex-1 rounded-sm bg-console-dark/40" />
          <div className="flex gap-2">
            <span className="h-4 w-4 rounded-full bg-accent shadow-[0_2px_0_oklch(0.5_0.15_143)]" />
            <span className="h-4 w-4 rounded-full bg-danger shadow-[0_2px_0_oklch(0.36_0.16_25)]" />
            <span className="h-4 w-4 rounded-full bg-warn shadow-[0_2px_0_oklch(0.5_0.12_75)]" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Knob() {
  return (
    <div className="relative h-10 w-10 rounded-full border-2 border-bezel-dark bg-[oklch(0.2_0.05_300)] shadow-[inset_0_2px_4px_rgb(0_0_0/0.6)]">
      <span className="absolute top-1/2 left-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-full rotate-[35deg] rounded-full bg-white/80" />
    </div>
  );
}
