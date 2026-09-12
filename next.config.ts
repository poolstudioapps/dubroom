import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
