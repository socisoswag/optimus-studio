/* Devis — Optimus Studio
   Validation côté client uniquement. L'envoi reste un POST natif vers
   Netlify Forms : si ce script ne se charge pas, le formulaire part
   quand même et le prospect n'est pas perdu. */

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
      // Dix chiffres minimum ; espaces, points et indicatif tolérés.
      ok = v.replace(/[^0-9]/g, '').length >= 10;
    }
    if (ok && champ.id === 'email') {
      ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    }

    afficherErreur(champ, !ok);
    return ok;
  }

  var requis = ['nom', 'email', 'tel'].map(function (id) {
    return document.getElementById(id);
  }).filter(Boolean);

  requis.forEach(function (champ) {
    champ.addEventListener('blur', function () { valider(champ); });
    champ.addEventListener('input', function () {
      if (champ.getAttribute('aria-invalid') === 'true') valider(champ);
    });
  });

  form.addEventListener('submit', function (e) {
    var valide = requis.map(valider).every(Boolean);

    if (!valide) {
      e.preventDefault();
      statut.textContent = 'Merci de corriger les champs signalés.';
      var premier = requis.find(function (c) {
        return c.getAttribute('aria-invalid') === 'true';
      });
      if (premier) premier.focus();
      return;
    }

    // Valide : on laisse partir le POST vers Netlify.
    bouton.disabled = true;
    statut.textContent = 'Envoi en cours...';
  });
})();
