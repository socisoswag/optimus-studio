/* =========================================================
   Couverture Marchal - démo Optimus Studio
   Curseur avant / après, en-tête qui se remplit hors du hero,
   révélations au scroll. IntersectionObserver partout, jamais
   d'écouteur scroll. Aucune dépendance.
   ========================================================= */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* ─── En-tête : fond plein dès qu'on quitte le haut du hero ─── */
  var top = document.querySelector('.top');
  if (top && hasIO) {
    var sentinelle = document.createElement('div');
    sentinelle.setAttribute('aria-hidden', 'true');
    sentinelle.style.cssText = 'position:absolute;top:120px;height:1px;width:1px;';
    document.body.prepend(sentinelle);
    new IntersectionObserver(function (e) {
      top.classList.toggle('is-stuck', !e[0].isIntersecting);
    }).observe(sentinelle);
  }

  /* ─── Révélations ─── */
  var reveals = document.querySelectorAll('.reveal');
  if (reduced || !hasIO) {
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

  /* ─── Avant / après ───
     Un <input type="range"> invisible couvre toute l'image : souris,
     doigt et clavier passent tous par lui. On se contente de recopier
     sa valeur dans la variable CSS --pos. */
  var compare = document.getElementById('compare');
  if (compare) {
    var range = compare.querySelector('.compare__range');
    var touche = false;

    function placer(v) { compare.style.setProperty('--pos', v + '%'); }
    range.addEventListener('input', function () { touche = true; placer(range.value); });

    /* Au premier passage, la ligne fait un aller-retour pour montrer
       qu'on peut la déplacer. Jamais si le visiteur a déjà touché au
       curseur, jamais en mouvement réduit. */
    if (!reduced && hasIO) {
      var ioAA = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        ioAA.disconnect();
        var cles = [[0, 50], [700, 72], [1500, 28], [2200, 50]];
        var t0 = null;
        function anim(t) {
          if (touche) return;
          if (t0 === null) t0 = t;
          var dt = t - t0;
          for (var k = 1; k < cles.length; k++) {
            if (dt <= cles[k][0]) {
              var a = cles[k - 1], b = cles[k];
              var x = (dt - a[0]) / (b[0] - a[0]);
              var e = x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;   // easeInOutQuad
              var v = a[1] + (b[1] - a[1]) * e;
              placer(v.toFixed(2)); range.value = v;
              return requestAnimationFrame(anim);
            }
          }
          placer(50); range.value = 50;
        }
        setTimeout(function () { requestAnimationFrame(anim); }, 400);
      }, { threshold: 0.6 });
      ioAA.observe(compare);
    }
  }

  /* ─── Formulaire de visite ─── */
  var form = document.getElementById('form-visite');
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

  var requis = ['nom', 'tel', 'adresse'].map(function (id) { return document.getElementById(id); });
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
      statut.textContent = 'C’est noté. On vous appelle pour caler la visite, en général sous 48 heures.';
    }, 700);
  });
})();

/* ─── La pluie sur les ardoises ───
   Canvas léger : des traînées obliques qui tombent, et de petits
   éclats là où elles touchent l'ardoise. Ne tourne que visible. */
(function () {
  'use strict';
  var canvas = document.getElementById('pluie');
  if (!canvas || !canvas.getContext || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  var ctx = canvas.getContext('2d');
  var W = 0, H = 0, gouttes = [], eclats = [], running = false;
  function taille() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function goutte(partout) {
    return { x: Math.random() * (W + 120) - 60, y: partout ? Math.random() * H : -20 - Math.random() * 60,
             v: 9 + Math.random() * 7, l: 14 + Math.random() * 18, a: .18 + Math.random() * .3,
             sol: H * (.55 + Math.random() * .45) };
  }
  taille();
  var n = W < 600 ? 60 : 120;
  for (var i = 0; i < n; i++) gouttes.push(goutte(true));
  function frame() {
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round';
    gouttes.forEach(function (g, i) {
      g.y += g.v; g.x -= g.v * .18;
      ctx.strokeStyle = 'rgba(233, 214, 180,' + g.a + ')';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.lineTo(g.x + g.l * .18, g.y - g.l); ctx.stroke();
      if (g.y >= g.sol) {
        eclats.push({ x: g.x, y: g.sol, r: 1, a: .5 });
        gouttes[i] = goutte(false);
      }
    });
    eclats = eclats.filter(function (e) {
      e.r += .7; e.a -= .04;
      if (e.a <= 0) return false;
      ctx.strokeStyle = 'rgba(233, 214, 180,' + e.a + ')';
      ctx.beginPath(); ctx.ellipse(e.x, e.y, e.r * 1.8, e.r * .6, 0, 0, 6.283); ctx.stroke();
      return true;
    });
    if (running) requestAnimationFrame(frame);
  }
  new IntersectionObserver(function (e) {
    var v = e[0].isIntersecting;
    if (v && !running) { running = true; requestAnimationFrame(frame); }
    if (!v) running = false;
  }).observe(canvas);
  if (window.ResizeObserver) new ResizeObserver(taille).observe(canvas);
})();
