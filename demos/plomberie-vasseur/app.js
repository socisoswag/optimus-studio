/* Plomberie Vasseur - démo Optimus Studio
   Pas de révélations au scroll ici : le parti pris est que tout reste
   lisible à l'arrêt. Uniquement la validation du formulaire de devis. */

(function () {
  'use strict';

  var form = document.getElementById('form-devis');
  if (!form) return;

  var statut = document.getElementById('status');
  var bouton = document.getElementById('submit');

  function afficherErreur(champ, actif) {
    var msg = form.querySelector('[data-err-for="' + champ.id + '"]');
    if (msg) msg.hidden = !actif;
    champ.setAttribute('aria-invalid', actif ? 'true' : 'false');
  }

  function valider(champ) {
    var v = champ.value.trim();
    var ok = v !== '';

    if (ok && champ.id === 'tel') {
      // 10 chiffres minimum, séparateurs tolérés.
      ok = v.replace(/[^0-9]/g, '').length >= 10;
    }

    afficherErreur(champ, !ok);
    return ok;
  }

  var requis = ['nom', 'tel', 'ville']
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  requis.forEach(function (champ) {
    champ.addEventListener('blur', function () { valider(champ); });
    champ.addEventListener('input', function () {
      if (champ.getAttribute('aria-invalid') === 'true') valider(champ);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var valide = requis.map(valider).every(Boolean);

    if (!valide) {
      statut.textContent = 'Merci de compléter les champs signalés.';
      var premier = requis.find(function (c) {
        return c.getAttribute('aria-invalid') === 'true';
      });
      if (premier) premier.focus();
      return;
    }

    // DÉMO : aucun envoi réel. En production, brancher Netlify Forms
    // (data-netlify="true" sur le <form>) ou un service tiers.
    bouton.disabled = true;
    statut.textContent = 'Envoi en cours...';

    window.setTimeout(function () {
      form.hidden = true;
      statut.textContent =
        'Demande reçue. Vous serez rappelé pendant les horaires d’ouverture.';
    }, 700);
  });
})();
