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
 * Deux filets de securite : sans `IntersectionObserver`, ou si quoi que
 * ce soit leve une erreur, tout est revele et la classe retiree. Une
 * animation ratee ne doit jamais laisser une page vide.
 */
export const REVEAL_SCRIPT = `(function () {
  var racine = document.documentElement;
  function toutReveler() {
    var liste = document.querySelectorAll('[data-reveal]');
    for (var i = 0; i < liste.length; i++) liste[i].setAttribute('data-revealed', '');
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
        racine.classList.remove('reveal-pret');
      }
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', demarrer);
    } else {
      demarrer();
    }
  } catch (e) {
    toutReveler();
    racine.classList.remove('reveal-pret');
  }
})();`;
