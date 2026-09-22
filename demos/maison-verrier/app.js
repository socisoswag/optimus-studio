/* Maison Verrier - démo Optimus Studio
   Révélations au scroll via IntersectionObserver (jamais d'écouteur scroll)
   + validation de formulaire côté client. */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─── En-tête : fond plein dès qu'on quitte le hero ───
     Observé via IntersectionObserver sur une sentinelle, jamais avec
     un écouteur scroll. */
  var nav = document.getElementById('nav');
  if (nav && 'IntersectionObserver' in window) {
    var sentinelle = document.createElement('div');
    sentinelle.setAttribute('aria-hidden', 'true');
    sentinelle.style.cssText = 'position:absolute;top:80px;height:1px;width:1px;';
    document.body.prepend(sentinelle);

    new IntersectionObserver(function (e) {
      nav.classList.toggle('is-stuck', !e[0].isIntersecting);
    }).observe(sentinelle);
  }

  /* ─── Révélations ─── */
  var targets = document.querySelectorAll('.reveal');

  if (reduced || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(targets, function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });

    Array.prototype.forEach.call(targets, function (el) { io.observe(el); });
  }

  /* ─── Formulaire de réservation ─── */
  var form = document.getElementById('form-reservation');
  if (!form) return;

  var statut = document.getElementById('status');
  var bouton = document.getElementById('submit');

  // La date du jour comme minimum : on ne réserve pas dans le passé.
  var champDate = document.getElementById('date');
  if (champDate) champDate.min = new Date().toISOString().slice(0, 10);

  function afficherErreur(champ, actif) {
    var msg = form.querySelector('[data-err-for="' + champ.id + '"]');
    if (msg) msg.hidden = !actif;
    champ.setAttribute('aria-invalid', actif ? 'true' : 'false');
  }

  function valider(champ) {
    var v = champ.value.trim();
    var ok = v !== '';

    if (ok && champ.id === 'tel') {
      // 10 chiffres minimum, espaces et séparateurs tolérés.
      ok = v.replace(/[^0-9]/g, '').length >= 10;
    }

    afficherErreur(champ, !ok);
    return ok;
  }

  var requis = ['nom', 'tel', 'date'].map(function (id) {
    return document.getElementById(id);
  }).filter(Boolean);

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

    // DÉMO : aucun envoi réel. En production, brancher ici Netlify Forms
    // (ajouter data-netlify="true" sur le <form>) ou un service tiers.
    bouton.disabled = true;
    statut.textContent = 'Envoi en cours...';

    window.setTimeout(function () {
      form.hidden = true;
      statut.textContent =
        'Demande bien reçue. Nous vous confirmons par téléphone sous deux heures.';
    }, 700);
  });
})();
