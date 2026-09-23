/* =========================================================
   Auto-école Lumière - démo Optimus Studio
   La voiture avance au scroll : 121 images dessinées dans un
   canvas. Chargement en trois temps : les 30 premières, puis une
   sur huit pour couvrir toute la course, puis le reste en tâche
   de fond. Parcours du permis à l'horizontale, compteurs,
   simulateur de prix, formulaire d'inscription.
   Boucles requestAnimationFrame limitées aux sections visibles,
   aucun écouteur scroll, aucune dépendance.
   ========================================================= */

(function () {
  'use strict';

  var FRAME_COUNT = 121;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  function surEcran(el, cb) {
    if (!hasIO || !el) return;
    new IntersectionObserver(function (e) { cb(e[0].isIntersecting); }).observe(el);
  }
  function progression(section) {
    var r = section.getBoundingClientRect();
    var c = r.height - window.innerHeight;
    return c <= 0 ? 0 : Math.min(1, Math.max(0, -r.top / c));
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
        var x = Math.min(1, (t - t0) / 1400);
        el.textContent = Math.round(cible * (1 - Math.pow(1 - x, 3)));
        if (x < 1) requestAnimationFrame(pas);
      }
      requestAnimationFrame(pas);
    }, { threshold: 0.6 });
    io.observe(el);
  });

  /* ─── La route ─── */
  (function route() {
    var section = document.querySelector('.route');
    var canvas = document.getElementById('route-canvas');
    if (!section || !canvas || !canvas.getContext || reduced || !hasIO) return;
    var ctx = canvas.getContext('2d');
    var etapes = Array.prototype.slice.call(section.querySelectorAll('.etape'));
    var chiffres = Array.prototype.slice.call(section.querySelectorAll('.route__compteur span'));
    var jauge = document.getElementById('route-jauge');
    var frames = new Array(FRAME_COUNT);
    var courante = -1, dirty = true, running = false;
    var suivi = 0;   // position lissée, en images

    function url(i) { return 'frames/frame_' + String(i + 1).padStart(4, '0') + '.webp'; }

    /* Ordre de chargement : 1 à 30, puis une image sur huit jusqu'au
       bout (l'animation est déjà jouable partout), puis les trous. */
    var ordre = [], vu = {};
    function pousser(i) { if (i < FRAME_COUNT && !vu[i]) { vu[i] = 1; ordre.push(i); } }
    for (var a = 0; a < 30; a++) pousser(a);
    for (var b = 0; b < FRAME_COUNT; b += 8) pousser(b);
    pousser(FRAME_COUNT - 1);
    for (var c = 0; c < FRAME_COUNT; c++) pousser(c);

    var k = 0, enVol = 0;
    function suivant() {
      while (enVol < 4 && k < ordre.length) {
        (function (i) {
          enVol++;
          var img = new Image();
          img.decoding = 'async';
          img.onload = function () {
            frames[i] = img; enVol--;
            if (i === 0) { dirty = true; requestAnimationFrame(tick); }
            suivant();
          };
          img.onerror = function () { enVol--; suivant(); };
          img.src = url(i);
        })(ordre[k++]);
      }
    }
    suivant();

    function dimensionner() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      dirty = true;
    }
    function proche(i) {
      for (var d = 0; d < FRAME_COUNT; d++) {
        if (frames[i - d]) return frames[i - d];
        if (frames[i + d]) return frames[i + d];
      }
      return null;
    }
    /* Même cadrage que le poster en CSS : cover, centré à 50 % / 55 %
       (58 % / 50 % sur mobile). */
    function dessiner(i) {
      var img = proche(i);
      if (!img) return false;
      var cw = canvas.width, ch = canvas.height, iw = img.naturalWidth, ih = img.naturalHeight;
      var sc = Math.max(cw / iw, ch / ih);
      var dw = iw * sc, dh = ih * sc;
      var mobile = window.innerWidth < 768;
      var fx = mobile ? 0.58 : 0.5, fy = mobile ? 0.5 : 0.55;
      ctx.drawImage(img, (cw - dw) * fx, (ch - dh) * fy, dw, dh);
      return true;
    }

    function tick() {
      var p = progression(section);
      var cible = p * (FRAME_COUNT - 1);
      suivi += (cible - suivi) * 0.18;
      if (Math.abs(cible - suivi) < 0.05) suivi = cible;
      var i = Math.round(suivi);
      if (i !== courante || dirty) {
        if (dessiner(i)) { courante = i; dirty = false; section.classList.add('is-live'); }
      }
      var actif = 0;
      etapes.forEach(function (e, n) {
        var on = p >= parseFloat(e.dataset.from) && p < parseFloat(e.dataset.to);
        e.classList.toggle('is-on', on);
        if (on) actif = n;
      });
      chiffres.forEach(function (el) { el.classList.toggle('is-on', +el.dataset.i <= actif); });
      jauge.style.width = (p * 100).toFixed(1) + '%';
      if (running || Math.abs(cible - suivi) > 0.05) requestAnimationFrame(tick);
    }

    surEcran(section, function (v) {
      if (v && !running) { running = true; requestAnimationFrame(tick); }
      if (!v) running = false;
    });
    dimensionner();
    if (window.ResizeObserver) new ResizeObserver(dimensionner).observe(canvas);
  })();

  /* ─── Le parcours à l'horizontale ─── */
  (function parcours() {
    var section = document.querySelector('.parcours');
    var piste = document.getElementById('piste');
    var jauge = document.getElementById('piste-jauge');
    if (!section || !piste || reduced || !hasIO) return;
    var bas = window.matchMedia('(max-height: 560px)');
    var running = false;
    function tick() {
      if (bas.matches) { piste.style.transform = ''; }
      else {
        var p = progression(section);
        var course = piste.scrollWidth - document.documentElement.clientWidth;
        piste.style.transform = 'translate3d(' + (-Math.max(0, course) * p).toFixed(1) + 'px,0,0)';
        jauge.style.width = (p * 100).toFixed(1) + '%';
      }
      if (running) requestAnimationFrame(tick);
    }
    surEcran(section, function (v) {
      if (v && !running) { running = true; requestAnimationFrame(tick); }
      if (!v) running = false;
    });
  })();

  /* ─── Simulateur de prix ─── */
  var TARIFS = {
    inscription: 180,
    code: 190,
    examenCode: 30,
    heure: { manuelle: 58, auto: 62 },
    examen: 60,
    minimum: { manuelle: 20, auto: 13 }
  };
  var simu = document.getElementById('simu');
  var heures = document.getElementById('heures');
  var total = 0;

  function eur(n) { return n.toLocaleString('fr-FR') + ' €'; }
  function calculer() {
    var boite = simu.querySelector('[name="boite"]:checked').value;
    var code = simu.querySelector('[name="code"]:checked').value === 'avec';
    var cpf = simu.querySelector('[name="cpf"]').checked;
    var min = TARIFS.minimum[boite];
    heures.min = min;
    if (+heures.value < min) heures.value = min;
    var h = +heures.value;

    var lignes = [['Inscription et dossier ANTS', TARIFS.inscription]];
    if (code) {
      lignes.push(['Forfait code illimité', TARIFS.code]);
      lignes.push(['Examen du code (organisme agréé)', TARIFS.examenCode]);
    }
    lignes.push([h + ' h de conduite · ' + eur(TARIFS.heure[boite]) + ' l’heure', h * TARIFS.heure[boite]]);
    lignes.push(['Accompagnement à l’examen', TARIFS.examen]);
    var somme = lignes.reduce(function (s, l) { return s + l[1]; }, 0);

    document.getElementById('heures-val').textContent = h + ' h';
    document.getElementById('heures-aide').textContent = boite === 'auto'
      ? 'Treize heures minimum en boîte automatique. La plupart de nos élèves en font entre 18 et 25.'
      : 'Vingt heures minimum. La moyenne nationale tourne autour de 30 heures : on fait le point avec vous après l’évaluation de départ.';
    document.getElementById('ticket-titre').textContent = boite === 'auto' ? 'boîte automatique' : 'boîte manuelle';
    document.getElementById('ticket-lignes').innerHTML = lignes.map(function (l) {
      return '<li><span>' + l[0] + '</span><span>' + eur(l[1]) + '</span></li>';
    }).join('') + (cpf ? '<li class="is-moins"><span>Pris en charge par votre CPF</span><span>selon vos droits</span></li>' : '');
    document.getElementById('ticket-mois').textContent =
      'Soit ' + eur(Math.ceil(somme / 10)) + ' par mois en 10 fois sans frais' + (cpf ? ', moins la part financée par votre CPF.' : '.');
    compter(somme);
    simu.dataset.resume = 'Devis simulé : permis B ' + (boite === 'auto' ? 'boîte automatique' : 'boîte manuelle') +
      ', ' + h + ' h de conduite' + (code ? ', code compris' : ', code déjà obtenu') + ', ' + eur(somme) + (cpf ? ', financement CPF.' : '.');
  }
  var raf = null;
  function compter(cible) {
    var el = document.getElementById('ticket-total');
    if (reduced) { el.textContent = eur(cible); total = cible; return; }
    cancelAnimationFrame(raf);
    var depart = total, t0 = null;
    function pas(t) {
      if (t0 === null) t0 = t;
      var x = Math.min(1, (t - t0) / 450);
      total = Math.round(depart + (cible - depart) * (1 - Math.pow(1 - x, 3)));
      el.textContent = eur(total);
      if (x < 1) raf = requestAnimationFrame(pas);
    }
    raf = requestAnimationFrame(pas);
  }
  if (simu) {
    simu.addEventListener('input', calculer);
    simu.addEventListener('change', calculer);
    calculer();
    document.getElementById('ticket-cta').addEventListener('click', function () {
      var boite = simu.querySelector('[name="boite"]:checked').value;
      document.getElementById('formule').selectedIndex = boite === 'auto' ? 1 : 0;
      var msg = document.getElementById('message');
      if (!msg.value.trim()) msg.value = simu.dataset.resume;
      setTimeout(function () { document.getElementById('nom').focus({ preventScroll: true }); }, reduced ? 0 : 500);
    });
  }

  /* ─── Inscription ─── */
  var form = document.getElementById('form-inscription');
  if (!form) return;
  var statut = document.getElementById('status');
  var bouton = document.getElementById('submit');
  function valider(ch) {
    var v = ch.value.trim();
    var ok = v !== '';
    if (ok && ch.id === 'tel') ok = v.replace(/[^0-9]/g, '').length >= 10;
    var m = form.querySelector('[data-err-for="' + ch.id + '"]');
    if (m) m.hidden = ok;
    ch.setAttribute('aria-invalid', ok ? 'false' : 'true');
    return ok;
  }
  var requis = ['nom', 'tel'].map(function (id) { return document.getElementById(id); });
  requis.forEach(function (ch) {
    ch.addEventListener('blur', function () { valider(ch); });
    ch.addEventListener('input', function () { if (ch.getAttribute('aria-invalid') === 'true') valider(ch); });
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!requis.map(valider).every(Boolean)) {
      statut.textContent = 'Merci de compléter les champs signalés.';
      requis.filter(function (ch) { return ch.getAttribute('aria-invalid') === 'true'; })[0].focus();
      return;
    }
    // DÉMO : aucun envoi réel. En production, brancher Netlify Forms.
    bouton.disabled = true;
    statut.textContent = 'Envoi en cours...';
    setTimeout(function () {
      Array.prototype.forEach.call(form.querySelectorAll('.field'), function (f) { f.hidden = true; });
      bouton.hidden = true;
      statut.textContent = 'Bien reçu ! On vous rappelle sous 24 heures pour fixer l’évaluation de départ.';
    }, 700);
  });
})();
