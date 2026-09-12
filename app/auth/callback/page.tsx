import { redirect } from 'next/navigation';

import { safeLanding } from '@/lib/auth-landing';
import { supabaseServer } from '@/lib/supabase/server';
import { HashSessionFallback } from './hash-fallback';

/**
 * Retour du lien magique.
 *
 * Supabase a deux facons d'achever une connexion, et il faut savoir
 * encaisser les deux :
 *
 *  - flot PKCE : un `code` arrive en parametre de requete, et on
 *    l'echange ici, cote serveur ;
 *  - flot implicite : le jeton arrive dans le FRAGMENT de l'URL, que le
 *    navigateur n'envoie jamais au serveur. Cote serveur, un tel lien
 *    ressemble a une URL vide — c'est exactement ce qui produisait
 *    « ce lien est incomplet ».
 *
 * D'ou cette page plutot qu'un simple gestionnaire de route : quand il
 * n'y a pas de code, on rend un composant client qui va lire le fragment.
 */
export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{
    code?: string;
    next?: string;
    error?: string;
    error_code?: string;
    error_description?: string;
  }>;
}) {
  const params = await searchParams;
  const landing = safeLanding(params.next);

  const failure = params.error_code ?? params.error;
  if (failure || params.error_description) {
    const expired = `${failure ?? ''} ${params.error_description ?? ''}`
      .toLowerCase()
      .includes('expired');
    redirect(`/auth/error?reason=${expired ? 'expired' : 'exchange'}`);
  }

  if (params.code) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) redirect('/auth/error?reason=exchange');

    const { data: allowed } = await supabase.rpc('app_is_allowed');
    if (!allowed) {
      await supabase.auth.signOut();
      redirect('/auth/error?reason=not_allowed');
    }

    redirect(landing);
  }

  return <HashSessionFallback landing={landing} />;
}
