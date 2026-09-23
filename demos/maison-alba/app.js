/* =========================================================
   Maison Alba - démo Optimus Studio
   La visite : 176 images tirées de trois vidéos (entrée → salon,
   salon → cuisine, cuisine → terrasse), rangées par 16 dans 11
   planches. La planche n contient les images n, n+11, n+22... :
   dès la première reçue, toute la visite est jouable en gros
   grain, chaque planche suivante l'affine. Le scroll fait
   avancer, avec une pause dans chaque pièce ; la souris (ou le
   téléphone qu'on penche) fait tourner le regard.
   Puis : filtres des biens, carte des secteurs reliée à
   l'estimation, compteurs, parallaxe, formulaire.
   Boucles requestAnimationFrame limitées aux sections visibles,
   aucun écouteur scroll, aucune dépendance.
   ========================================================= */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  var root = document.documentElement;
  if (reduced || !hasIO) root.classList.add('no-anim');

  function surEcran(el, cb, opts) {
    if (!hasIO || !el) return;
    new IntersectionObserver(function (e) { cb(e[0].isIntersecting); }, opts).observe(el);
  }
  function progression(section) {
    var r = section.getBoundingClientRect();
    var c = r.height - window.innerHeight;
    return c <= 0 ? 0 : Math.min(1, Math.max(0, -r.top / c));
  }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function eur(n) { return Math.round(n).toLocaleString('fr-FR') + ' €'; }

  /* ─── En-tête ─── */
  var top = document.querySelector('.top');
  if (top && hasIO) {
    var s = document.createElement('div');
    s.setAttribute('aria-hidden', 'true');
    s.style.cssText = 'position:absolute;top:80px;height:1px;width:1px;';
    document.body.prepend(s);
    new IntersectionObserver(function (e) { top.classList.toggle('is-stuck', !e[0].isIntersecting); }).observe(s);
  }

  /* ─── La visite ─── */
  var visite = document.querySelector('.visite');
  var ALLER = [0, 0.35, 0.66, 0.975];   // où s'arrêter dans chaque pièce

  function allerA(n) {
    if (!visite) return;
    if (root.classList.contains('no-anim')) { visite.scrollIntoView(); return; }
    var y = visite.offsetTop + ALLER[n] * (visite.offsetHeight - window.innerHeight);
    window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-aller]'), function (b) {
    b.addEventListener('click', function () { allerA(+b.dataset.aller); });
  });

  (function visiteImmersive() {
    var canvas = document.getElementById('visite-canvas');
    if (!visite || !canvas || !canvas.getContext || root.classList.contains('no-anim')) return;
    var ctx = canvas.getContext('2d');
    var cam = visite.querySelector('.visite__cam');
    var eclat = document.getElementById('visite-eclat');
    var jauge = document.getElementById('visite-jauge');
    var etapes = Array.prototype.slice.call(visite.querySelectorAll('.etape'));
    var boutons = Array.prototype.slice.call(visite.querySelectorAll('.visite__plan button'));
    var pieceNo = document.getElementById('piece-no');
    var pieceNom = document.getElementById('piece-nom');
    var PIECES = ['L’entrée', 'Le salon', 'La cuisine', 'La terrasse'];
    var regard = visite.querySelector('.js-regard');
    if (regard && window.matchMedia('(pointer: coarse)').matches) regard.textContent = 'penchez votre téléphone';

    var N = 176, PLANCHES = 11, FW = 1024, FH = 560;
    /* Progression → image, avec une pause dans chaque pièce. */
    var CLES = [[0, 0], [0.08, 0], [0.30, 58], [0.40, 59], [0.62, 116], [0.70, 117], [0.93, 175], [1, 175]];
    var PAUSES = [[0, 0.08], [0.30, 0.40], [0.62, 0.70], [0.93, 1]];
    var ECLAT = 145.5;   // raccord de la baie vitrée, masqué par la lumière

    var frames = new Array(N);
    var courante = -1, dirty = true, running = false;
    var suivi = 0, piece = -1;

    function image(p) {
      for (var k = 1; k < CLES.length; k++) {
        if (p <= CLES[k][0]) {
          var a = CLES[k - 1], b = CLES[k];
          var t = b[0] === a[0] ? 1 : (p - a[0]) / (b[0] - a[0]);
          t = t * t * (3 - 2 * t);   // on démarre et on s'arrête en douceur
          return a[1] + (b[1] - a[1]) * t;
        }
      }
      return N - 1;
    }
    function enPause(p) {
      return PAUSES.some(function (z) { return p >= z[0] && p <= z[1]; });
    }

    /* Chargement : la planche 0 d'abord (elle contient l'image 0),
       puis des planches qui se répartissent au mieux les trous. */
    var ORDRE = [0, 6, 3, 9, 1, 7, 4, 10, 2, 8, 5];
    var k = 0, enVol = 0;
    function decouper(img, a) {
      for (var j = 0; j < 16; j++) {
        var g = a + PLANCHES * j;
        if (g >= N) break;
        (function (g, sx, sy) {
          if (window.createImageBitmap) {
            createImageBitmap(img, sx, sy, FW, FH).then(function (bm) {
              frames[g] = { s: bm, x: 0, y: 0 }; dirty = true;
            }, function () { frames[g] = { s: img, x: sx, y: sy }; dirty = true; });
          } else {
            frames[g] = { s: img, x: sx, y: sy }; dirty = true;
          }
        })(g, (j % 4) * FW, (j >> 2) * FH);
      }
    }
    function suivant() {
      while (enVol < 2 && k < ORDRE.length) {
        (function (a) {
          enVol++;
          var img = new Image();
          img.decoding = 'async';
          img.onload = function () { enVol--; decouper(img, a); suivant(); };
          img.onerror = function () { enVol--; suivant(); };
          img.src = 'visite/atlas-' + String(a).padStart(2, '0') + '.webp';
        })(ORDRE[k++]);
      }
    }
    suivant();

    function dimensionner() {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      dirty = true;
    }
    function proche(i) {
      for (var d = 0; d < N; d++) {
        if (frames[i - d]) return frames[i - d];
        if (frames[i + d]) return frames[i + d];
      }
      return null;
    }
    function dessiner(i) {
      var f = proche(i);
      if (!f) return false;
      var cw = canvas.width, ch = canvas.height;
      var sc = Math.max(cw / FW, ch / FH);
      var dw = FW * sc, dh = FH * sc;
      ctx.drawImage(f.s, f.x, f.y, FW, FH, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      return true;
    }

    /* Le regard : la souris sur ordinateur, l'inclinaison sur
       téléphone, sinon une lente dérive, comme une tête qui tourne. */
    var lx = 0, ly = 0, tx = 0, ty = 0, dernier = -1e9, gyro = false, force = 1;
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      tx = e.clientX / window.innerWidth * 2 - 1;
      ty = e.clientY / window.innerHeight * 2 - 1;
      dernier = performance.now();
    }, { passive: true });
    window.addEventListener('deviceorientation', function (e) {
      if (e.gamma === null || e.beta === null) return;
      gyro = true;
      tx = clamp(e.gamma / 22, -1, 1);
      ty = clamp((e.beta - 50) / 22, -1, 1);
      dernier = performance.now();
    }, { passive: true });

    function tick(now) {
      var p = progression(visite);
      var cible = image(p);
      suivi += (cible - suivi) * 0.14;
      if (Math.abs(cible - suivi) < 0.02) suivi = cible;
      var i = Math.round(suivi);
      if (i !== courante || dirty) {
        if (dessiner(i)) { courante = i; dirty = false; }
      }
      visite.classList.toggle('is-live', courante > 0 && suivi > 0.3);
      visite.classList.toggle('is-avance', p > 0.02);

      if (!gyro && now - dernier > 3000) {
        tx = Math.sin(now / 2600) * 0.55;
        ty = Math.sin(now / 3900) * 0.22;
      }
      lx += (tx - lx) * 0.05;
      ly += (ty - ly) * 0.05;
      force += ((enPause(p) ? 1 : 0.45) - force) * 0.06;
      cam.style.transform = 'translate3d(' + (-lx * 4.2 * force).toFixed(2) + '%,' + (-ly * 2.8 * force).toFixed(2) + '%,0) scale(1.1)';

      var d = Math.abs(suivi - ECLAT);
      eclat.style.opacity = d < 7 ? (Math.pow(1 - d / 7, 1.4) * 0.9).toFixed(3) : 0;

      var texte = false;
      etapes.forEach(function (e, m) {
        var on = p >= parseFloat(e.dataset.from) && p < parseFloat(e.dataset.to);
        e.classList.toggle('is-on', on);
        if (on && m > 0) texte = true;
      });
      visite.classList.toggle('is-texte', texte);
      var n = p < 0.19 ? 0 : p < 0.51 ? 1 : p < 0.81 ? 2 : 3;
      if (n !== piece) {
        piece = n;
        pieceNo.textContent = '0' + (n + 1);
        pieceNom.textContent = PIECES[n];
        boutons.forEach(function (b, m) {
          b.classList.toggle('is-on', m === n);
          if (m === n) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
        });
      }
      jauge.style.width = (p * 100).toFixed(1) + '%';
      if (running) requestAnimationFrame(tick);
    }

    surEcran(visite, function (v) {
      if (v && !running) { running = true; requestAnimationFrame(tick); }
      if (!v) running = false;
    });
    dimensionner();
    if (window.ResizeObserver) new ResizeObserver(dimensionner).observe(canvas);
  })();

  /* ─── Apparitions ─── */
  var reveals = document.querySelectorAll('.reveal');
  if (hasIO && !reduced) {
    var ioR = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); ioR.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
    Array.prototype.forEach.call(reveals, function (el) { ioR.observe(el); });
  } else {
    Array.prototype.forEach.call(reveals, function (el) { el.classList.add('is-in'); });
  }

  /* ─── Filtres des biens ─── */
  var filtres = document.querySelectorAll('.filtres button');
  var biens = document.querySelectorAll('.bien');
  Array.prototype.forEach.call(filtres, function (b) {
    b.addEventListener('click', function () {
      var f = b.dataset.filtre;
      Array.prototype.forEach.call(filtres, function (x) {
        x.classList.toggle('is-on', x === b);
        x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
      });
      Array.prototype.forEach.call(biens, function (c) {
        c.classList.toggle('is-cache', f !== 'tous' && c.dataset.type !== f);
      });
    });
  });

  /* ─── Compteurs ─── */
  Array.prototype.forEach.call(document.querySelectorAll('.js-compte'), function (el) {
    var cible = +el.dataset.cible;
    if (reduced || !hasIO) { el.textContent = cible; return; }
    el.textContent = '0';
    var io = new IntersectionObserver(function (e) {
      if (!e[0].isIntersecting) return;
      io.disconnect();
      var t0 = null;
      function pas(t) {
        if (t0 === null) t0 = t;
        var x = Math.min(1, (t - t0) / 1600);
        el.textContent = Math.round(cible * (1 - Math.pow(1 - x, 3)));
        if (x < 1) requestAnimationFrame(pas);
      }
      requestAnimationFrame(pas);
    }, { threshold: 0.6 });
    io.observe(el);
  });

  /* ─── Parallaxe de la photo de l'agence ─── */
  (function parallaxe() {
    var img = document.getElementById('agence-img');
    if (!img || reduced || !hasIO) return;
    var boite = img.parentNode, running = false;
    function tick() {
      var r = boite.getBoundingClientRect();
      var p = clamp((r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight, -1, 1);
      img.style.transform = 'translate3d(0,' + (-6.5 + p * 6).toFixed(2) + '%,0)';
      if (running) requestAnimationFrame(tick);
    }
    surEcran(boite, function (v) {
      if (v && !running) { running = true; requestAnimationFrame(tick); }
      if (!v) running = false;
    });
  })();

  /* ─── Carte des secteurs et estimation ─── */
  var QUARTIERS = {
    'vieille-ville':   { nom: 'Vieille ville',         m2: 7200, evo: '+2,1 %', ligne: 'Canaux, ruelles piétonnes, marché du mardi.' },
    'albigny':         { nom: 'Albigny',               m2: 9800, evo: '+3,4 %', ligne: 'La rive des grands hôtels, le lac au bout de la rue.' },
    'annecy-le-vieux': { nom: 'Annecy-le-Vieux',       m2: 7600, evo: '+1,8 %', ligne: 'Résidentiel et calme, écoles réputées, vue sur les toits.' },
    'cran-gevrier':    { nom: 'Cran-Gevrier',          m2: 5200, evo: '+0,9 %', ligne: 'Anciennes manufactures, lofts et prix plus doux.' },
    'sevrier':         { nom: 'Sévrier',               m2: 7000, evo: '+2,4 %', ligne: 'Rive ouest, plages publiques et piste cyclable.' },
    'veyrier':         { nom: 'Veyrier-du-Lac',        m2: 9200, evo: '+2,8 %', ligne: 'Villas à flanc de colline, soleil couchant sur le lac.' },
    'menthon':         { nom: 'Menthon-Saint-Bernard', m2: 8800, evo: '+2,2 %', ligne: 'Un village, un château et un petit port.' },
    'talloires':       { nom: 'Talloires',             m2: 9500, evo: '+3,1 %', ligne: 'La baie la plus préservée du lac.' }
  };
  var simu = document.getElementById('simu');
  var points = document.querySelectorAll('.pt');
  var quartier = document.getElementById('quartier');
  var surface = document.getElementById('surface');

  function choisirQuartier(q) {
    var d = QUARTIERS[q];
    if (!d) return;
    quartier.value = q;
    Array.prototype.forEach.call(points, function (b) {
      var on = b.dataset.q === q;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    document.getElementById('q-nom').textContent = d.nom;
    document.getElementById('q-m2').textContent = eur(d.m2);
    document.getElementById('q-evo').textContent = d.evo + ' sur un an';
    document.getElementById('q-ligne').textContent = d.ligne;
  }

  var affiche = { bas: 0, haut: 0 }, raf = null;
  function compter(bas, haut) {
    var elB = document.getElementById('est-bas'), elH = document.getElementById('est-haut');
    if (reduced) { elB.textContent = eur(bas); elH.textContent = eur(haut); affiche = { bas: bas, haut: haut }; return; }
    cancelAnimationFrame(raf);
    var d0 = { bas: affiche.bas, haut: affiche.haut }, t0 = null;
    function pas(t) {
      if (t0 === null) t0 = t;
      var x = Math.min(1, (t - t0) / 550), e = 1 - Math.pow(1 - x, 3);
      affiche.bas = d0.bas + (bas - d0.bas) * e;
      affiche.haut = d0.haut + (haut - d0.haut) * e;
      elB.textContent = eur(Math.round(affiche.bas / 1000) * 1000);
      elH.textContent = eur(Math.round(affiche.haut / 1000) * 1000);
      if (x < 1) raf = requestAnimationFrame(pas);
    }
    raf = requestAnimationFrame(pas);
  }

  function estimer() {
    var q = QUARTIERS[quartier.value];
    var type = simu.querySelector('[name="type"]:checked').value;
    var etat = parseFloat(simu.querySelector('[name="etat"]:checked').value);
    var atouts = Array.prototype.reduce.call(simu.querySelectorAll('[name="atout"]:checked'), function (t, c) {
      return t + parseFloat(c.value);
    }, 0);
    var s = +surface.value;
    var degressif = s > 150 ? 0.93 : s > 110 ? 0.97 : s < 40 ? 1.06 : 1;
    var m2 = q.m2 * (1 + etat + atouts) * (type === 'maison' ? 1.05 : 1) * degressif;
    var milieu = m2 * s;
    var bas = Math.round(milieu * 0.94 / 5000) * 5000;
    var haut = Math.round(milieu * 1.06 / 5000) * 5000;

    document.getElementById('surface-val').textContent = s + ' m²';
    surface.style.setProperty('--pc', ((s - surface.min) / (surface.max - surface.min) * 100).toFixed(1) + '%');
    document.getElementById('est-m2').textContent = 'Soit environ ' + eur(Math.round(m2 / 10) * 10) + ' le m², secteur ' + q.nom + '.';
    compter(bas, haut);
    simu.dataset.resume = 'Estimation en ligne : ' + (type === 'maison' ? 'maison' : 'appartement') + ' de ' + s +
      ' m², secteur ' + q.nom + ', entre ' + eur(bas) + ' et ' + eur(haut) + '. Je souhaite un avis de valeur signé.';
  }

  if (simu) {
    Array.prototype.forEach.call(points, function (b) {
      b.addEventListener('click', function () { choisirQuartier(b.dataset.q); estimer(); });
    });
    quartier.addEventListener('change', function () { choisirQuartier(quartier.value); });
    simu.addEventListener('input', estimer);
    simu.addEventListener('change', estimer);
    simu.addEventListener('submit', function (e) { e.preventDefault(); });
    choisirQuartier(quartier.value);
    estimer();
  }

  /* ─── Liens qui préremplissent le contact ─── */
  var objet = document.getElementById('objet');
  var message = document.getElementById('message');
  function preremplir(o, m) {
    if (objet && o) objet.value = o;
    if (message && m) message.value = m;
    setTimeout(function () {
      var nom = document.getElementById('nom');
      if (nom) nom.focus({ preventScroll: true });
    }, reduced ? 0 : 700);
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-objet]'), function (a) {
    a.addEventListener('click', function () { preremplir(a.dataset.objet, a.dataset.message); });
  });
  var estCta = document.getElementById('est-cta');
  if (estCta) estCta.addEventListener('click', function () { preremplir('estimer', simu.dataset.resume); });

  /* ─── Formulaire de contact ─── */
  var form = document.getElementById('form-contact');
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
    // On ne signale un champ vide qu'une fois qu'on a commencé à le remplir.
    ch.addEventListener('blur', function () { if (ch.dataset.touche) valider(ch); });
    ch.addEventListener('input', function () {
      ch.dataset.touche = '1';
      if (ch.getAttribute('aria-invalid') === 'true') valider(ch);
    });
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
      statut.textContent = 'Merci ! Un conseiller vous rappelle dans la journée.';
    }, 700);
  });
})();
