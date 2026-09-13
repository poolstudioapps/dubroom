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

    /*
     * Les en-tetes de securite, sur tout ce qui sort.
     *
     * La politique de contenu (CSP) n'est pas ici : elle porte un nonce
     * tire a chaque requete, et vit donc dans le middleware. Le reste est
     * fixe : pas d'affichage dans un cadre tiers (un site qui nous
     * encadrerait pourrait faire cliquer sur « Lancer le rendu » a
     * l'insu de la personne), pas de devinette de type de contenu, un
     * referent reduit vers l'exterieur, et seules les permissions
     * navigateur dont le studio a besoin — le micro — restent ouvertes,
     * pour notre origine seulement.
     */
    const securite = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Permissions-Policy',
        value:
          'camera=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), microphone=(self)',
      },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
    ];

    return [
      { source: '/:path*', headers: [...securite, ...ferme] },
      { source: '/', headers: ouvert },
      { source: '/mentions-legales', headers: ouvert },
      { source: '/confidentialite', headers: ouvert },
      { source: '/llms.txt', headers: ouvert },
    ];
  },
};

export default nextConfig;
