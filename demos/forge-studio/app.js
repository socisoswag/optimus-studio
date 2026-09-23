/* =========================================================
   Forge Studio - démo Optimus Studio
   Planning de la semaine filtrable (discipline, jour sur mobile),
   fiche du cours choisi reliée au formulaire de séance d'essai,
   bascule des tarifs. IntersectionObserver pour les apparitions,
   jamais d'écouteur scroll. Aucune dépendance.
   ========================================================= */

(function () {
  'use strict';

  var TYPES = {
    force: { nom: 'Force',           coach: 'Karim', duree: 60, intensite: 2,
             desc: 'Squat, soulevé de terre, développé couché. Les charges sont notées à chaque séance, la progression se fait sur douze semaines.' },
    /* « court » porte une césure conditionnelle : dans une colonne étroite
       du planning, le mot se coupe en « Condition- / nement », pas au hasard. */
    cond:  { nom: 'Conditionnement', court: 'Condition­nement', coach: 'Inès', duree: 45, intensite: 3,
             desc: 'Intervalles courts : rameur, cordes, vélo à air. On travaille le souffle, pas le chrono du voisin.' },
    mob:   { nom: 'Mobilité',        coach: 'Léa',   duree: 45, intensite: 1,
             desc: 'Amplitude, gainage, respiration. La séance qui fait durer toutes les autres.' }
  };
  var JOURS  = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  var COURTS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  var PLACES = 12;

  var COURS = [
    [0, '07:00', 'force'], [0, '12:30', 'cond'], [0, '18:30', 'force'], [0, '19:45', 'mob'],
    [1, '07:00', 'cond'],  [1, '12:30', 'mob'],  [1, '18:30', 'cond'],  [1, '19:45', 'force'],
    [2, '07:00', 'force'], [2, '12:30', 'cond'], [2, '18:30', 'force'], [2, '19:45', 'mob'],
    [3, '07:00', 'cond'],  [3, '12:30', 'force'], [3, '18:30', 'cond'], [3, '19:45', 'mob'],
    [4, '07:00', 'force'], [4, '12:30', 'cond'], [4, '18:30', 'force'], [4, '19:45', 'mob'],
    [5, '09:00', 'cond'],  [5, '10:15', 'force'], [5, '11:30', 'mob']
  ].map(function (c, i) {
    /* Places restantes tirées d'un hachage : stables d'un chargement à l'autre. */
    var x = 0, cle = c[0] + c[1] + c[2];
    for (var k = 0; k < cle.length; k++) x = (x * 31 + cle.charCodeAt(k)) % 997;
    return { i: i, j: c[0], h: c[1], t: c[2], libres: x % (PLACES + 1) };
  });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function heure(h) {
    var p = h.split(':'), hh = parseInt(p[0], 10);
    return hh + ' h' + (p[1] !== '00' ? ' ' + p[1] : '');
  }
  function libelle(c) { return JOURS[c.j] + ' ' + heure(c.h) + ' · ' + TYPES[c.t].nom; }

  /* ─── Apparitions ─── */
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

  /* ─── Planning ─── */
  var grille = document.getElementById('grille');
  var detail = document.getElementById('detail');
  var tabs   = document.querySelector('.jours-tabs');
  var aujourdhui = (new Date().getDay() + 6) % 7;      // lundi = 0
  if (aujourdhui > 5) aujourdhui = 0;                   // dimanche : on montre lundi
  var selection = null;

  JOURS.forEach(function (nom, j) {
    var col = document.createElement('div');
    col.className = 'jour' + (j === aujourdhui ? ' is-today is-active' : '');
    col.dataset.j = j;
    col.id = 'jour-' + j;
    col.setAttribute('role', 'tabpanel');
    col.innerHTML = '<p class="jour__nom">' + nom + '</p><div class="jour__cours"></div>';
    var liste = col.querySelector('.jour__cours');
    COURS.filter(function (c) { return c.j === j; }).forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'cours cours--' + c.t + (c.libres === 0 ? ' is-plein' : '');
      b.dataset.i = c.i;
      b.setAttribute('aria-pressed', 'false');
      b.setAttribute('aria-label', libelle(c) + (c.libres === 0 ? ', complet' : ''));
      b.innerHTML = '<span class="cours__h">' + heure(c.h) + '</span>' +
                    '<span class="cours__t">' + (TYPES[c.t].court || TYPES[c.t].nom) + '</span>' +
                    '<span class="cours__c">' + TYPES[c.t].coach + '</span>';
      liste.appendChild(b);
    });
    grille.appendChild(col);

    var t = document.createElement('button');
    t.type = 'button';
    t.setAttribute('role', 'tab');
    t.setAttribute('aria-controls', 'jour-' + j);
    t.setAttribute('aria-selected', j === aujourdhui ? 'true' : 'false');
    t.setAttribute('aria-label', nom);
    t.textContent = COURTS[j];
    t.dataset.j = j;
    tabs.appendChild(t);
  });

  tabs.addEventListener('click', function (e) {
    var t = e.target.closest('button');
    if (!t) return;
    Array.prototype.forEach.call(tabs.children, function (b) { b.setAttribute('aria-selected', b === t ? 'true' : 'false'); });
    Array.prototype.forEach.call(grille.children, function (col) { col.classList.toggle('is-active', col.dataset.j === t.dataset.j); });
  });

  function afficher(c) {
    var T = TYPES[c.t];
    var barres = [1, 2, 3].map(function (n) { return '<i class="' + (n <= T.intensite ? 'on' : '') + '"></i>'; }).join('');
    var places = c.libres === 0 ? 'Complet cette semaine' : c.libres + ' sur ' + PLACES;
    detail.innerHTML =
      '<p class="detail__quand">' + JOURS[c.j] + ' · ' + heure(c.h) + '</p>' +
      '<h3>' + T.nom + '</h3>' +
      '<p class="detail__desc">' + T.desc + '</p>' +
      '<dl>' +
        '<dt>Coach</dt><dd>' + T.coach + '</dd>' +
        '<dt>Durée</dt><dd>' + T.duree + ' min</dd>' +
        '<dt>Intensité</dt><dd><span class="intensite" role="img" aria-label="' + T.intensite + ' sur 3">' + barres + '</span></dd>' +
        '<dt>Places</dt><dd>' + places + '</dd>' +
      '</dl>' +
      (c.libres === 0
        ? '<p class="detail__desc">Ce cours est complet. Le même a lieu d’autres jours : filtrez par discipline.</p>'
        : '<a class="btn btn--block" href="#essai" data-essai="' + c.i + '">Essayer ce cours</a>');
  }

  function choisir(i) {
    selection = COURS[i];
    Array.prototype.forEach.call(grille.querySelectorAll('.cours'), function (b) {
      var on = parseInt(b.dataset.i, 10) === i;
      b.classList.toggle('is-sel', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    afficher(selection);
  }

  grille.addEventListener('click', function (e) {
    var b = e.target.closest('.cours');
    if (b) choisir(parseInt(b.dataset.i, 10));
  });

  /* Filtres : une discipline à la fois, ou tout le planning. */
  var filtres = Array.prototype.slice.call(document.querySelectorAll('.filtre'));
  filtres.forEach(function (f) {
    f.addEventListener('click', function () {
      filtres.forEach(function (g) {
        var on = g === f;
        g.classList.toggle('is-on', on);
        g.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      var type = f.dataset.type;
      Array.prototype.forEach.call(grille.querySelectorAll('.cours'), function (b) {
        var off = type !== 'tous' && !b.classList.contains('cours--' + type);
        b.classList.toggle('is-off', off);
        b.tabIndex = off ? -1 : 0;
        if (off) b.setAttribute('aria-hidden', 'true'); else b.removeAttribute('aria-hidden');
      });
      /* Si le cours affiché ne correspond plus au filtre, on montre le premier qui correspond. */
      if (selection && type !== 'tous' && selection.t !== type) {
        var suivant = COURS.filter(function (c) { return c.t === type && c.j >= aujourdhui && c.libres > 0; })[0] ||
                      COURS.filter(function (c) { return c.t === type && c.libres > 0; })[0];
        if (suivant) choisir(suivant.i);
      }
    });
  });

  /* Au chargement, le premier cours disponible du jour est déjà ouvert. */
  var initial = COURS.filter(function (c) { return c.j === aujourdhui && c.libres > 0; })[0] ||
                COURS.filter(function (c) { return c.libres > 0; })[0];
  if (initial) choisir(initial.i);

  /* ─── Formulaire de séance d'essai ─── */
  var creneau = document.getElementById('creneau');
  var vide = document.createElement('option');
  vide.value = ''; vide.textContent = 'Je choisirai plus tard';
  creneau.appendChild(vide);
  COURS.forEach(function (c) {
    if (c.libres === 0) return;
    var o = document.createElement('option');
    o.value = c.i; o.textContent = libelle(c);
    creneau.appendChild(o);
  });

  detail.addEventListener('click', function (e) {
    var a = e.target.closest('[data-essai]');
    if (!a) return;
    creneau.value = a.dataset.essai;
    setTimeout(function () { document.getElementById('prenom').focus({ preventScroll: true }); }, reduced ? 0 : 500);
  });

  /* ─── Tarifs ─── */
  var bascule = document.querySelectorAll('.bascule button');
  Array.prototype.forEach.call(bascule, function (b) {
    b.addEventListener('click', function () {
      Array.prototype.forEach.call(bascule, function (x) {
        var on = x === b;
        x.classList.toggle('is-on', on);
        x.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      var eng = b.dataset.eng;
      Array.prototype.forEach.call(document.querySelectorAll('.formule__prix span'), function (s) {
        var v = s.dataset[eng];
        if (s.textContent === v) return;
        if (reduced) { s.textContent = v; return; }
        s.classList.add('is-flip');
        setTimeout(function () { s.textContent = v; s.classList.remove('is-flip'); }, 180);
      });
    });
  });

  /* ─── Envoi ─── */
  var form = document.getElementById('form-essai');
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
  var requis = ['prenom', 'tel'].map(function (id) { return document.getElementById(id); });
  requis.forEach(function (c) {
    c.addEventListener('blur', function () { valider(c); });
    c.addEventListener('input', function () { if (c.getAttribute('aria-invalid') === 'true') valider(c); });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!requis.map(valider).every(Boolean)) {
      statut.textContent = 'Il manque votre prénom ou votre numéro.';
      requis.filter(function (c) { return c.getAttribute('aria-invalid') === 'true'; })[0].focus();
      return;
    }
    // DÉMO : aucun envoi réel. En production, brancher le logiciel de réservation.
    bouton.disabled = true;
    statut.textContent = 'Envoi en cours...';
    window.setTimeout(function () {
      var c = creneau.value !== '' ? COURS[parseInt(creneau.value, 10)] : null;
      form.querySelectorAll('.field').forEach(function (f) { if (!f.contains(statut)) f.hidden = true; });
      bouton.hidden = true;
      statut.textContent = 'C’est réservé, ' + document.getElementById('prenom').value.trim() + '. ' +
        (c ? 'On vous attend ' + JOURS[c.j].toLowerCase() + ' à ' + heure(c.h) + ', vingt minutes avant le cours.'
           : 'On vous appelle pour choisir le créneau.');
    }, 700);
  });
})();

/* ─── La bande qui s'emballe ───
   Vitesse de base, plus la vitesse du scroll : plus on descend vite,
   plus la bande file et s'incline. En remontant, elle repart en sens
   inverse. Tourne seulement quand elle est visible. */
(function () {
  'use strict';
  var bande = document.querySelector('.defile');
  var piste = bande && bande.querySelector('.defile__piste');
  if (!piste || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  bande.classList.add('is-js');
  var x = 0, sens = 1, vitesse = 0, dernierY = window.scrollY, running = false, t0 = null;
  function tick(t) {
    var dt = t0 === null ? 16 : Math.min(50, t - t0); t0 = t;
    var y = window.scrollY, dy = y - dernierY; dernierY = y;
    if (dy > 0.5) sens = 1; else if (dy < -0.5) sens = -1;
    vitesse += (Math.min(60, Math.abs(dy)) - vitesse) * 0.12;
    var moitie = piste.scrollWidth / 2;
    x -= sens * (0.06 + vitesse * 0.045) * dt;
    if (x <= -moitie) x += moitie;
    if (x > 0) x -= moitie;
    piste.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
    bande.style.setProperty('--skew', (Math.max(-3, Math.min(3, dy * 0.08))).toFixed(2) + 'deg');
    if (running) requestAnimationFrame(tick);
  }
  new IntersectionObserver(function (e) {
    var v = e[0].isIntersecting;
    if (v && !running) { running = true; t0 = null; dernierY = window.scrollY; requestAnimationFrame(tick); }
    if (!v) running = false;
  }).observe(bande);
})();

/* ─── En-tête : fond plein dès qu'on quitte le haut de la page ─── */
(function () {
  var top = document.querySelector('.top');
  if (!top || !('IntersectionObserver' in window)) return;
  var s = document.createElement('div');
  s.setAttribute('aria-hidden', 'true');
  s.style.cssText = 'position:absolute;top:120px;height:1px;width:1px;';
  document.body.prepend(s);
  new IntersectionObserver(function (e) { top.classList.toggle('is-stuck', !e[0].isIntersecting); }).observe(s);
})();
