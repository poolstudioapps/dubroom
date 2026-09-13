/**
 * Les apparitions au defilement.
 *
 * Un script en ligne dans `<head>` plutot qu'un composant React, pour une
 * raison de moment : il pose sa classe avant la premiere peinture. Un
 * composant ne s'execute qu'apres l'hydratation, si bien que la page
 * s'affichait entiere, disparaissait, puis revenait en fondu — un
 * clignotement au lieu d'une entree.
 *
 * Il ne cache rien lui-meme. Il marque les elements `data-reveal` quand
 * ils entrent a l'ecran, et c'est la feuille de style qui decide de les
 * animer.
 *
 * Il attend l'hydratation avant de marquer quoi que ce soit. Marquer
 * plus tot posait un attribut que React ne connaissait pas sur des
 * elements qu'il allait hydrater, et chaque page s'ouvrait sur un
 * avertissement de HTML different entre serveur et client. La classe
 * qui cache, elle, se pose tout de suite sur la racine, que React ne
 * compare pas ; `Providers` signale l'hydratation par un evenement.
 *
 * Deux filets de securite : sans `IntersectionObserver`, si
 * l'hydratation ne vient pas, ou si quoi que ce soit leve une erreur, la
 * classe est retiree et tout est visible. Une animation ratee ne doit
 * jamais laisser une page vide.
 */
export const REVEAL_SCRIPT = `(function () {
  var racine = document.documentElement;
  function toutReveler() {
    racine.classList.remove('reveal-pret');
  }
  function quandHydrate(fn) {
    if (racine.hasAttribute('data-hydrated')) return fn();
    var fait = false;
    var lancer = function (ok) {
      if (fait) return;
      fait = true;
      if (ok) fn(); else toutReveler();
    };
    document.addEventListener('dubblers:hydrated', function () { lancer(true); }, { once: true });
    setTimeout(function () { lancer(false); }, 2500);
  }
  try {
    if (!('IntersectionObserver' in window)) return;
    racine.classList.add('reveal-pret');
    var observateur = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (entree) {
        if (entree.isIntersecting) {
          entree.target.setAttribute('data-revealed', '');
          observateur.unobserve(entree.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    function suivre(noeud) {
      if (!noeud || noeud.nodeType !== 1) return;
      if (noeud.matches('[data-reveal]:not([data-revealed])')) observateur.observe(noeud);
      noeud.querySelectorAll('[data-reveal]:not([data-revealed])').forEach(function (el) {
        observateur.observe(el);
      });
    }
    function demarrer() {
      try {
        suivre(document.body);
        new MutationObserver(function (mutations) {
          mutations.forEach(function (m) { m.addedNodes.forEach(suivre); });
        }).observe(document.body, { childList: true, subtree: true });
      } catch (e) {
        toutReveler();
      }
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { quandHydrate(demarrer); });
    } else {
      quandHydrate(demarrer);
    }
  } catch (e) {
    toutReveler();
  }
})();`;
