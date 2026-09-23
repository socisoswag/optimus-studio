/* =========================================================
   Lisière - démo Optimus Studio
   Lampe torche du hero (été → automne), quatre saisons pilotées
   par le scroll avec leurs particules (pollen, lucioles, feuilles,
   flocons), compteurs, calcul du crédit d'impôt, formulaire.
   Chaque boucle d'animation ne tourne que si sa section est à
   l'écran ; tout est coupé en mouvement réduit.
   ========================================================= */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  function surEcran(el, cb) {
    if (!hasIO) return;
    new IntersectionObserver(function (e) { cb(e[0].isIntersecting); }).observe(el);
  }

  /* ─── En-tête ─── */
  var top = document.querySelector('.top');
  if (top && hasIO) {
    var s = document.createElement('div');
    s.setAttribute('aria-hidden', 'true');
    s.style.cssText = 'position:absolute;top:120px;height:1px;width:1px;';
    document.body.prepend(s);
    new IntersectionObserver(function (e) { top.classList.toggle('is-stuck', !e[0].isIntersecting); }).observe(s);
  }

  /* ─── Révélations ─── */
  var reveals = document.querySelectorAll('.reveal');
  if (reduced || !hasIO) {
    Array.prototype.forEach.call(reveals, function (el) { el.classList.add('is-in'); });
  } else {
    var ioR = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); ioR.unobserve(e.target); } });
    }, { threshold: 0.2 });
    Array.prototype.forEach.call(reveals, function (el) { ioR.observe(el); });
  }

  /* ─── Compteurs ─── */
  Array.prototype.forEach.call(document.querySelectorAll('.js-compte'), function (el) {
    var cible = +el.dataset.cible;
    if (reduced || !hasIO) { el.textContent = cible; return; }
    var io = new IntersectionObserver(function (e) {
      if (!e[0].isIntersecting) return;
      io.disconnect();
      var t0 = null;
      function pas(t) {
        if (t0 === null) t0 = t;
        var x = Math.min(1, (t - t0) / 1800);
        el.textContent = Math.round(cible * (1 - Math.pow(1 - x, 3)));
        if (x < 1) requestAnimationFrame(pas);
      }
      requestAnimationFrame(pas);
    }, { threshold: 0.5 });
    io.observe(el);
  });

  /* ─── Lampe torche ───
     La position suit le pointeur avec un amorti ; au repos, le
     disque fait une petite ronde pour montrer qu'il y a quelque
     chose à découvrir. */
  (function torche() {
    var hero = document.querySelector('.hero');
    var t = document.getElementById('torche');
    if (!hero || !t || reduced) return;
    var cx = 0, cy = 0, tx = 0, ty = 0, actif = false, running = false, init = false;

    function repos() {
      var r = hero.getBoundingClientRect();
      var mobile = r.width < 768;
      return { x: r.width * (mobile ? 0.6 : 0.68), y: r.height * (mobile ? 0.34 : 0.5) };
    }
    function viser(x, y) {
      var r = hero.getBoundingClientRect();
      tx = x - r.left; ty = y - r.top; actif = true;
    }
    hero.addEventListener('pointermove', function (e) { viser(e.clientX, e.clientY); });
    hero.addEventListener('pointerleave', function () { actif = false; });
    hero.addEventListener('touchmove', function (e) { if (e.touches[0]) viser(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
    hero.addEventListener('touchend', function () { actif = false; });

    function tick(now) {
      if (!init) { var p = repos(); cx = tx = p.x; cy = ty = p.y; init = true; }
      if (!actif) {
        var b = repos(), k = now * 0.0011;
        tx = b.x + Math.cos(k) * 70;
        ty = b.y + Math.sin(k * 1.3) * 45;
      }
      var ease = actif ? 0.16 : 0.05;
      cx += (tx - cx) * ease;
      cy += (ty - cy) * ease;
      t.style.setProperty('--mx', cx.toFixed(1) + 'px');
      t.style.setProperty('--my', cy.toFixed(1) + 'px');
      if (running) requestAnimationFrame(tick);
    }
    surEcran(hero, function (v) {
      if (v && !running) { running = true; requestAnimationFrame(tick); }
      if (!v) running = false;
    });
  })();

  /* ─── Les quatre saisons ─── */
  (function saisons() {
    var section = document.querySelector('.saisons');
    if (!section || reduced || !hasIO) return;
    var photos = section.querySelectorAll('.saisons__photos img');
    var blocs = section.querySelectorAll('.saison');
    var etiquettes = section.querySelectorAll('.saisons__barre span');
    var jauge = document.getElementById('saisons-jauge');
    var canvas = document.getElementById('particules');
    var ctx = canvas.getContext && canvas.getContext('2d');
    var actif = 0, running = false, W = 0, H = 0, dpr = 1;
    section.dataset.actif = 0;

    function taille() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    taille();
    if (window.ResizeObserver) new ResizeObserver(taille).observe(canvas);

    /* Une particule par saison : pollen qui monte, lucioles qui
       flottent, feuilles qui tombent en tournant, flocons. */
    var pts = [];
    var N = W < 700 ? 26 : 50;
    function nouvelle(saison, partout) {
      var p = { x: Math.random() * W, y: partout ? Math.random() * H : 0, t: Math.random() * 6.28, s: saison };
      if (saison === 0) { p.r = 1 + Math.random() * 1.6; p.vy = -(0.15 + Math.random() * 0.3); p.y = partout ? p.y : H + 10; }
      if (saison === 1) { p.r = 1.2 + Math.random() * 2; p.vy = (Math.random() - 0.5) * 0.2; p.a = Math.random(); }
      if (saison === 2) { p.r = 5 + Math.random() * 5; p.vy = 0.6 + Math.random() * 0.9; p.rot = Math.random() * 6.28; p.vr = (Math.random() - 0.5) * 0.06; p.c = ['#B5461E', '#D7802F', '#8E2A17', '#E3A13B'][Math.floor(Math.random() * 4)]; p.y = partout ? p.y : -20; }
      if (saison === 3) { p.r = 1 + Math.random() * 2.4; p.vy = 0.35 + Math.random() * 0.8; p.y = partout ? p.y : -10; }
      return p;
    }
    function peupler(saison) { pts = []; for (var i = 0; i < N; i++) pts.push(nouvelle(saison, true)); }
    peupler(0);

    function dessiner() {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      pts.forEach(function (p, i) {
        p.t += 0.02;
        p.y += p.vy;
        p.x += Math.sin(p.t) * (p.s === 2 ? 1.1 : 0.35);
        if (p.s === 0) {
          ctx.fillStyle = 'rgba(246, 236, 180, .55)';
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
          if (p.y < -10) pts[i] = nouvelle(0, false);
        } else if (p.s === 1) {
          var a = 0.25 + 0.6 * Math.abs(Math.sin(p.t * 1.7 + p.a * 6));
          var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
          g.addColorStop(0, 'rgba(255, 224, 140,' + a + ')');
          g.addColorStop(1, 'rgba(255, 200, 90, 0)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 5, 0, 6.283); ctx.fill();
          if (p.y < -20 || p.y > H + 20) pts[i] = nouvelle(1, true);
        } else if (p.s === 2) {
          p.rot += p.vr;
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.fillStyle = p.c; ctx.globalAlpha = .85;
          ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * .45, 0, 0, 6.283); ctx.fill();
          ctx.restore(); ctx.globalAlpha = 1;
          if (p.y > H + 20) pts[i] = nouvelle(2, false);
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, .8)';
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
          if (p.y > H + 10) pts[i] = nouvelle(3, false);
        }
      });
    }

    function progression() {
      var r = section.getBoundingClientRect();
      var c = r.height - window.innerHeight;
      return c <= 0 ? 0 : Math.min(1, Math.max(0, -r.top / c));
    }
    function tick() {
      var p = progression();
      var i = Math.min(3, Math.floor(p * 4));
      if (i !== actif) {
        photos[actif].classList.remove('is-on'); photos[i].classList.add('is-on');
        blocs[actif].classList.remove('is-on'); blocs[i].classList.add('is-on');
        etiquettes[actif].classList.remove('is-on'); etiquettes[i].classList.add('is-on');
        section.dataset.actif = i;
        actif = i;
        peupler(i);
      }
      jauge.style.width = (p * 100).toFixed(1) + '%';
      dessiner();
      if (running) requestAnimationFrame(tick);
    }
    surEcran(section, function (v) {
      if (v && !running) { running = true; requestAnimationFrame(tick); }
      if (!v) running = false;
    });
  })();

  /* ─── Crédit d'impôt ───
     50 % des dépenses, plafond de 5 000 € de dépenses par an pour
     les petits travaux de jardinage. */
  (function credit() {
    var r = document.getElementById('budget');
    if (!r) return;
    var out = document.getElementById('budget-val');
    var cr = document.getElementById('calc-credit');
    var net = document.getElementById('calc-net');
    var mois = document.getElementById('calc-mois');
    var note = document.getElementById('calc-note');
    function eur(n) { return Math.round(n).toLocaleString('fr-FR') + ' €'; }
    function maj() {
      var b = +r.value;
      var c = Math.min(b, 5000) * 0.5;
      out.textContent = eur(b);
      cr.textContent = '− ' + eur(c);
      net.textContent = eur(b - c);
      mois.textContent = eur((b - c) / 12);
      note.hidden = b <= 5000;
    }
    r.addEventListener('input', maj);
    maj();
  })();

  /* ─── Formulaire ─── */
  var form = document.getElementById('form-contact');
  if (!form) return;
  var statut = document.getElementById('status');
  var bouton = document.getElementById('submit');
  function valider(c) {
    var v = c.value.trim();
    var ok = v !== '';
    if (ok && c.id === 'tel') ok = v.replace(/[^0-9]/g, '').length >= 10;
    var m = form.querySelector('[data-err-for="' + c.id + '"]');
    if (m) m.hidden = ok;
    c.setAttribute('aria-invalid', ok ? 'false' : 'true');
    return ok;
  }
  var requis = ['nom', 'tel', 'commune'].map(function (id) { return document.getElementById(id); });
  requis.forEach(function (c) {
    c.addEventListener('blur', function () { valider(c); });
    c.addEventListener('input', function () { if (c.getAttribute('aria-invalid') === 'true') valider(c); });
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
    setTimeout(function () {
      Array.prototype.forEach.call(form.querySelectorAll('.field'), function (f) { f.hidden = true; });
      bouton.hidden = true;
      statut.textContent = 'Merci ! On vous appelle sous 48 heures pour fixer la visite.';
    }, 700);
  });
})();
