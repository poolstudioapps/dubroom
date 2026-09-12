import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Un `package-lock.json` traine dans le dossier utilisateur, au-dessus du
  // projet. Next remontait jusqu'a lui pour deviner la racine, et tracait
  // les dependances depuis le mauvais endroit. On la nomme.
  outputFileTracingRoot: path.resolve(import.meta.dirname),
  // Aucune <Image> dans ce produit : la seule media est la video de la
  // scene, servie par URL signee. Couper l'optimiseur evite d'embarquer
  // sharp et sa chaine libvips/libheif pour rien.
  images: { unoptimized: true },
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
  },
  async headers() {
    /*
     * L'indexation est fermee par defaut et ouverte par exception.
     *
     * Les ecrans du produit portent des extraits d'oeuvres protegees :
     * les laisser indexer transformerait un usage prive en catalogue
     * public, ce que le PRD §14 interdit et ce qui ne serait pas tenable
     * juridiquement. La facade, elle, ne montre aucune oeuvre : c'est une
     * page de presentation, et c'est la seule qui a vocation a etre
     * trouvee.
     *
     * L'ordre compte, et pas dans le sens qu'on croit : Next applique
     * toutes les regles qui correspondent, et pour une meme entete c'est
     * la derniere qui l'emporte. Le fourre-tout `/:path*` attrape aussi
     * la racine ; les exceptions doivent donc venir APRES lui, sans quoi
     * il les recouvre et tout reste ferme.
     */
    const ouvert = [
      { key: 'X-Robots-Tag', value: 'index, follow, max-image-preview:large, max-snippet:-1' },
    ];
    const ferme = [
      { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
    ];

    return [
      { source: '/:path*', headers: ferme },
      { source: '/', headers: ouvert },
      { source: '/mentions-legales', headers: ouvert },
      { source: '/confidentialite', headers: ouvert },
      { source: '/llms.txt', headers: ouvert },
    ];
  },
};

export default nextConfig;
