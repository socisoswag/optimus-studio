/* =========================================================
   Moreau Électricité - démo Optimus Studio
   Le tableau passe de « hors tension » à « sous tension » au scroll :
   deux photos identiques superposées, l'opacité de la seconde suit la
   position dans la section. Le relevé (volts, circuits, état) suit la
   même progression.

   Aucune bibliothèque. La boucle requestAnimationFrame ne tourne que
   lorsque la section est à l'écran (IntersectionObserver) : pas
   d'écouteur scroll, rien à charger depuis un CDN.
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

  initFormulaire();

  /* ─── Le tableau ─── */
  var section = document.querySelector('.volt');
  var media   = document.querySelector('.volt__media');
  var imgOn   = document.getElementById('volt-on');
  var glow    = document.getElementById('volt-glow');
  var rVolt   = document.getElementById('r-volt');
  var rCirc   = document.getElementById('r-circ');
  var rEtat   = document.getElementById('r-etat');
  var msgs    = Array.prototype.slice.call(document.querySelectorAll('.msg'));
  if (!section || !imgOn) return;

  var CIRCUITS  = 38;
  var TESTS     = [0.34, 0.66];   // les circuits se comptent pendant le message 2
  var ALLUMAGE  = [0.66, 0.76];   // le tableau s'allume au début du message 3

  function clamp01(x) { return Math.min(1, Math.max(0, x)); }
  function entre(p, a, b) { return clamp01((p - a) / (b - a)); }

  var etaitAllume = false;

  function appliquer(p) {
    var allume = entre(p, ALLUMAGE[0], ALLUMAGE[1]);
    imgOn.style.opacity = allume.toFixed(3);
    if (glow) glow.style.opacity = allume.toFixed(3);

    rVolt.textContent = Math.round(230 * allume);
    rCirc.textContent = Math.round(CIRCUITS * entre(p, TESTS[0], TESTS[1]));

    var estAllume = allume > 0.5;
    if (estAllume !== etaitAllume) {
      document.body.classList.toggle('is-on', estAllume);
      rEtat.textContent = estAllume ? 'Sous tension' : 'Hors tension';
      /* Le vacillement ne joue qu'à l'allumage, pas à l'extinction. */
      if (estAllume && !reduced) {
        media.classList.remove('is-flicker');
        void media.offsetWidth;
        media.classList.add('is-flicker');
      }
      etaitAllume = estAllume;
    }

    msgs.forEach(function (m) {
      m.classList.toggle('is-on', p >= parseFloat(m.dataset.from) && p < parseFloat(m.dataset.to));
    });
  }

  /* Mouvement réduit : pas de scène, on montre directement le tableau allumé. */
  if (reduced || !('IntersectionObserver' in window)) {
    appliquer(1);
    return;
  }

  var running = false;
  var dernier = -1;

  function progression() {
    var r = section.getBoundingClientRect();
    var course = r.height - window.innerHeight;
    return course > 0 ? clamp01(-r.top / course) : 0;
  }

  function tick() {
    var p = progression();
    if (Math.abs(p - dernier) > 0.0005) { appliquer(p); dernier = p; }
    if (running) requestAnimationFrame(tick);
  }

  new IntersectionObserver(function (entries) {
    var visible = entries[0].isIntersecting;
    if (visible && !running) { running = true; requestAnimationFrame(tick); }
    if (!visible) running = false;
  }).observe(section);

  media.addEventListener('animationend', function () { media.classList.remove('is-flicker'); });

  /* ─── Formulaire ─── */
  function initFormulaire() {
    var form = document.getElementById('form-devis');
    if (!form) return;
    var statut = document.getElementById('status');
    var bouton = document.getElementById('submit');

    function valider(champ) {
      var v = champ.value.trim();
      var ok = v !== '';
      if (ok && champ.id === 'tel') ok = v.replace(/[^0-9]/g, '').length >= 10;
      var msg = form.querySelector('[data-err-for="' + champ.id + '"]');
      if (msg) msg.hidden = ok;
      champ.setAttribute('aria-invalid', ok ? 'false' : 'true');
      return ok;
    }

    var requis = ['nom', 'tel'].map(function (id) { return document.getElementById(id); });
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
        statut.textContent = 'Demande reçue. On vous rappelle sous 24 heures pour fixer la visite.';
      }, 700);
    });
  }
})();
