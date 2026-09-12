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
    return [
      {
        // Produit strictement prive (PRD 14) : aucune indexation nulle part.
        source: '/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
      },
    ];
  },
};

export default nextConfig;
