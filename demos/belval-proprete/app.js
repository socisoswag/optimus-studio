/* =========================================================
   Belval Propreté - démo Optimus Studio
   Estimation mensuelle en direct (surface, fréquence, options),
   report de l'estimation dans le formulaire, révélations au scroll
   par IntersectionObserver. Aucune dépendance.
   ========================================================= */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─── Révélations ─── */
  var reveals = document.querySelectorAll('.reveal');
  if (reduced || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(reveals, function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.2 });
    Array.prototype.forEach.call(reveals, function (el) { io.observe(el); });
  }

  /* ─── Estimation ───
     Hypothèses d'un bureau standard, à ajuster pour un vrai client :
     un agent entretient environ 250 m² à l'heure, facturés 27 € HT,
     avec un minimum d'une heure par passage. */
  var PRODUCTIVITE = 250;         // m² par heure
  var TAUX         = 27;          // € HT par heure
  var SEMAINES     = 52 / 12;     // semaines par mois
  var OPTIONS = {
    vitres:   function (s) { return Math.max(60, s * 0.20 * 2.4); },      // 20 % de vitrage, 2,40 €/m² par mois
    conso:    function (s) { return (s / 12) * 4.5; },                    // un poste pour 12 m², 4,50 € par poste
    moquette: function (s) { return (s * 0.6 * 3.5 * 2) / 12; }           // 60 % de moquette, 3,50 €/m², deux fois par an
  };
  var NOMS = { vitres: 'vitrerie mensuelle', conso: 'fourniture des consommables', moquette: 'moquettes deux fois par an' };

  var calc = document.getElementById('calc');
  var dernier = null;

  if (calc) {
    var surface  = document.getElementById('surface');
    var surfVal  = document.getElementById('surface-val');
    var rHeures  = document.getElementById('r-heures');
    var rPass    = document.getElementById('r-passages');
    var rPrix    = document.getElementById('r-prix');
    var annonce  = document.getElementById('r-annonce');
    var fmt      = new Intl.NumberFormat('fr-FR');
    var minuteur = null;

    function duree(h) {
      var totalMin = Math.round(h * 60 / 5) * 5;
      var hh = Math.floor(totalMin / 60), mm = totalMin % 60;
      return mm ? hh + ' h ' + String(mm).padStart(2, '0') : hh + ' h';
    }

    function calculer() {
      var s = parseInt(surface.value, 10);
      var freq = parseInt(calc.querySelector('input[name="freq"]:checked').value, 10);
      var heures = Math.max(1, s / PRODUCTIVITE);
      var passages = freq * SEMAINES;
      var total = heures * passages * TAUX;
      var choisies = [];
      Object.keys(OPTIONS).forEach(function (k) {
        if (calc.querySelector('input[name="' + k + '"]').checked) {
          total += OPTIONS[k](s);
          choisies.push(NOMS[k]);
        }
      });
      total = Math.round(total / 10) * 10;

      surfVal.textContent = fmt.format(s) + ' m²';
      surface.style.setProperty('--fill', ((s - surface.min) / (surface.max - surface.min) * 100).toFixed(1) + '%');
      rHeures.textContent = duree(heures);
      rPass.textContent = Math.round(passages);
      rPrix.textContent = fmt.format(total);

      dernier = { s: s, freq: freq, total: total, options: choisies };

      /* Annonce pour les lecteurs d'écran, seulement quand le réglage
         se stabilise : sinon chaque cran du curseur serait lu. */
      clearTimeout(minuteur);
      minuteur = setTimeout(function () {
        annonce.textContent = 'Environ ' + fmt.format(total) + ' euros hors taxes par mois, pour ' +
          fmt.format(s) + ' mètres carrés et ' + freq + ' passage' + (freq > 1 ? 's' : '') + ' par semaine.';
      }, 600);
    }

    calc.addEventListener('input', calculer);
    calc.addEventListener('change', calculer);
    calculer();

    /* Le bouton reporte l'estimation dans le formulaire de contact. */
    document.getElementById('calc-cta').addEventListener('click', function () {
      var msg = document.getElementById('message');
      if (!msg || !dernier) return;
      msg.value = 'Estimation en ligne : ' + fmt.format(dernier.s) + ' m², ' + dernier.freq +
        ' passage' + (dernier.freq > 1 ? 's' : '') + ' par semaine' +
        (dernier.options.length ? ', ' + dernier.options.join(', ') : '') +
        '. Environ ' + fmt.format(dernier.total) + ' € HT par mois.\n';
      setTimeout(function () { document.getElementById('societe').focus({ preventScroll: true }); }, 450);
    });
  }

  /* ─── Formulaire ─── */
  var form = document.getElementById('form-contact');
  if (!form) return;
  var statut = document.getElementById('status');
  var bouton = document.getElementById('submit');

  function valider(champ) {
    var v = champ.value.trim();
    var ok = v !== '';
    if (ok && champ.type === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    var msg = form.querySelector('[data-err-for="' + champ.id + '"]');
    if (msg) msg.hidden = ok;
    champ.setAttribute('aria-invalid', ok ? 'false' : 'true');
    return ok;
  }

  var requis = ['societe', 'nom', 'email'].map(function (id) { return document.getElementById(id); });
  requis.forEach(function (c) {
    c.addEventListener('blur', function () { valider(c); });
    c.addEventListener('input', function () {
      if (c.getAttribute('aria-invalid') === 'true') valider(c);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!requis.map(valider).every(Boolean)) {
      statut.textContent = 'Merci de compléter les champs signalés.';
      requis.filter(function (c) { return c.getAttribute('aria-invalid') === 'true'; })[0].focus();
      return;
    }
    // DÉMO : aucun envoi réel. En production, brancher Netlify Forms.
    bouton.disabled = true;
    statut.textContent = 'Envoi en cours...';
    window.setTimeout(function () {
      form.querySelectorAll('.field').forEach(function (f) {
        if (!f.contains(statut)) f.hidden = true;
      });
      bouton.hidden = true;
      statut.textContent = 'Merci. Votre responsable de secteur vous appelle sous 24 heures pour fixer la visite.';
    }, 700);
  });
})();
