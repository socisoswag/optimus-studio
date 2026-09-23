/* =========================================================
   Delorme Serrurerie - démo Optimus Studio
   Le cylindre se démonte au scroll : 121 images dans un canvas.

   Aucune bibliothèque. Une boucle requestAnimationFrame lit la
   position de la section, et elle ne tourne que pendant que la
   section est à l'écran (IntersectionObserver). Pas d'écouteur
   scroll, pas de CDN : rien qui puisse bloquer un écran de
   chargement chez le prospect. Le poster (image 1) est affiché
   dès le HTML ; le canvas prend le relais quand il a dessiné.
   ========================================================= */

(function () {
  'use strict';

  var FRAME_COUNT = 121;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─── Révélations ─── */
  var reveals = document.querySelectorAll('.reveal');
  if (reduced || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(reveals, function (el) { el.classList.add('is-in'); });
  } else {
    var ioReveal = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        ioReveal.unobserve(e.target);
      });
    }, { threshold: 0.2 });
    Array.prototype.forEach.call(reveals, function (el) { ioReveal.observe(el); });
  }

  initFormulaire();

  if (reduced || !('IntersectionObserver' in window)) return;

  /* ─── Le cylindre ─── */
  var section = document.querySelector('.cyl');
  var canvas  = document.getElementById('cyl-canvas');
  var fill    = document.getElementById('cyl-fill');
  var count   = document.getElementById('cyl-count');
  var msgs    = Array.prototype.slice.call(document.querySelectorAll('.msg'));
  if (!section || !canvas || !canvas.getContext) return;

  var ctx = canvas.getContext('2d');
  var frames = new Array(FRAME_COUNT);
  var current = -1;
  var running = false;
  var dirty = true;

  function url(i) {
    return 'frames/frame_' + String(i + 1).padStart(4, '0') + '.webp';
  }

  /* Chargement en trois temps, quatre images à la fois : les 30
     premières, puis une sur huit jusqu'au bout (toute la course est
     déjà jouable), puis les trous. */
  var ordre = [], vu = {};
  function pousser(i) { if (i < FRAME_COUNT && !vu[i]) { vu[i] = 1; ordre.push(i); } }
  for (var a = 0; a < 30; a++) pousser(a);
  for (var b = 0; b < FRAME_COUNT; b += 8) pousser(b);
  pousser(FRAME_COUNT - 1);
  for (var c = 0; c < FRAME_COUNT; c++) pousser(c);
  var k = 0, enVol = 0;
  function charger() {
    while (enVol < 4 && k < ordre.length) {
      (function (i) {
        enVol++;
        var img = new Image();
        img.decoding = 'async';
        img.onload = function () {
          frames[i] = img; enVol--;
          if (i === 0) { dirty = true; tick(); }
          charger();
        };
        img.onerror = function () { enVol--; charger(); };
        img.src = url(i);
      })(ordre[k++]);
    }
  }
  charger();

  function dimensionner() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = Math.round(canvas.clientWidth  * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    dirty = true;
  }

  /* L'image la plus proche déjà chargée, si la bonne ne l'est pas encore. */
  function imageProche(i) {
    for (var d = 0; d < FRAME_COUNT; d++) {
      if (frames[i - d]) return frames[i - d];
      if (frames[i + d]) return frames[i + d];
    }
    return null;
  }

  function dessiner(i) {
    var img = imageProche(i);
    if (!img) return false;
    var cw = canvas.width, ch = canvas.height;
    var iw = img.naturalWidth, ih = img.naturalHeight;
    /* Écran large : l'image est un peu réduite et remontée, pour laisser
       sous le tapis une bande noire où se posent les messages. Les bords
       de l'image sont noirs, la réduction ne crée pas de cadre visible.
       Écran vertical : on garde toute la largeur du tapis, sinon les
       goupilles sortent du cadre. */
    var large = cw >= ch;
    /* Ces trois valeurs sont reprises telles quelles par le poster en
       CSS (.cyl__poster) : les changer ici impose de les changer là. */
    var s = large ? Math.max(cw / iw, ch / ih) * 0.78 : (cw / iw) * 1.5;
    var dw = iw * s, dh = ih * s;
    var dy = large ? (ch - dh) * 0.15 : (ch - dh) * 0.35;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, (cw - dw) / 2, dy, dw, dh);
    return true;
  }

  function progression() {
    var r = section.getBoundingClientRect();
    var course = r.height - window.innerHeight;
    if (course <= 0) return 0;
    return Math.min(1, Math.max(0, -r.top / course));
  }

  function tick() {
    var p = progression();
    var i = Math.min(FRAME_COUNT - 1, Math.round(p * (FRAME_COUNT - 1)));

    if (i !== current || dirty) {
      if (dessiner(i)) {
        current = i;
        dirty = false;
        section.classList.add('is-live');
      }
    }

    var actif = 0;
    msgs.forEach(function (m, k) {
      var on = p >= parseFloat(m.dataset.from) && p < parseFloat(m.dataset.to);
      m.classList.toggle('is-on', on);
      if (on) actif = k;
    });
    if (fill)  fill.style.height = (p * 100).toFixed(1) + '%';
    if (count) count.textContent = '0' + (actif + 1);

    if (running) requestAnimationFrame(tick);
  }

  new IntersectionObserver(function (entries) {
    var visible = entries[0].isIntersecting;
    if (visible && !running) { running = true; requestAnimationFrame(tick); }
    if (!visible) running = false;
  }).observe(section);

  dimensionner();
  if (window.ResizeObserver) new ResizeObserver(dimensionner).observe(canvas);

  /* ─── Formulaire de rappel ─── */
  function initFormulaire() {
    var form = document.getElementById('form-rappel');
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
        form.hidden = true;
        statut.textContent = 'C’est noté. On vous rappelle dans l’heure.';
      }, 700);
    });
  }
})();
