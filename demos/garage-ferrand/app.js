/* =========================================================
   Garage Ferrand - démo Optimus Studio
   Badge d'ouverture à l'heure de Rennes, repères de section,
   liste des services qui change la photo, devis d'entretien
   calculé selon le gabarit, la motorisation et le kilométrage,
   compteurs animés, formulaire de rendez-vous.
   IntersectionObserver partout, aucune dépendance.
   ========================================================= */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* ─── Atelier ouvert ? À l'heure de Rennes ─── */
  (function statut() {
    var el = document.getElementById('statut');
    var txt = document.getElementById('statut-txt');
    if (!el || !txt) return;
    var semaine = [[8 * 60, 12 * 60], [14 * 60, 18 * 60 + 30]];
    var H = { 0: [], 1: semaine, 2: semaine, 3: semaine, 4: semaine, 5: semaine, 6: [[9 * 60, 12 * 60]] };
    var JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    function hm(m) { var h = Math.floor(m / 60), mm = m % 60; return h + 'h' + (mm ? String(mm).padStart(2, '0') : ''); }
    var now;
    try {
      var o = {};
      new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
        .formatToParts(new Date()).forEach(function (p) { o[p.type] = p.value; });
      now = { j: { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[o.weekday], m: (parseInt(o.hour, 10) % 24) * 60 + parseInt(o.minute, 10) };
    } catch (e) { var d = new Date(); now = { j: d.getDay(), m: d.getHours() * 60 + d.getMinutes() }; }

    var ouvert = H[now.j].filter(function (c) { return now.m >= c[0] && now.m < c[1]; })[0];
    if (ouvert) { txt.textContent = 'Atelier ouvert · jusqu’à ' + hm(ouvert[1]); return; }
    el.classList.add('is-ferme');
    for (var k = 0; k < 8; k++) {
      var j = (now.j + k) % 7;
      var s = H[j].filter(function (c) { return k > 0 || c[0] > now.m; })[0];
      if (s) { txt.textContent = 'Fermé · réouverture ' + (k === 0 ? 'à ' : k === 1 ? 'demain à ' : JOURS[j] + ' à ') + hm(s[0]); return; }
    }
  })();

  /* ─── Repères 01 à 04 : visibles hors du hero, section active en orange ─── */
  (function rail() {
    var rail = document.querySelector('.rail');
    if (!rail || !hasIO) return;
    var liens = Array.prototype.slice.call(rail.querySelectorAll('a'));
    new IntersectionObserver(function (e) {
      rail.classList.toggle('is-visible', !e[0].isIntersecting);
    }, { threshold: 0.35 }).observe(document.querySelector('.hero'));

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        liens.forEach(function (a) {
          var on = a.dataset.rail === e.target.id;
          a.classList.toggle('is-actif', on);
          if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    liens.forEach(function (a) { var s = document.getElementById(a.dataset.rail); if (s) io.observe(s); });
  })();

  /* ─── Atelier : un service choisi, la photo et le texte suivent ─── */
  (function atelier() {
    var boutons = Array.prototype.slice.call(document.querySelectorAll('.service'));
    var cadre = document.getElementById('atelier-photo');
    var texte = document.getElementById('atelier-txt');
    if (!boutons.length || !cadre) return;
    var cache = {};
    cache[cadre.querySelector('img').getAttribute('src')] = cadre.querySelector('img');

    function choisir(b) {
      boutons.forEach(function (x) {
        var on = x === b;
        x.classList.toggle('is-on', on);
        x.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      var src = b.dataset.img;
      var img = cache[src];
      if (!img) {
        img = document.createElement('img');
        img.src = src; img.alt = b.dataset.alt; img.width = 1920; img.height = 1047;
        cadre.appendChild(img); cache[src] = img;
        void img.offsetWidth;
      }
      Array.prototype.forEach.call(cadre.querySelectorAll('img'), function (i) { i.classList.toggle('is-on', i === img); });
      texte.textContent = b.dataset.txt;
    }
    boutons.forEach(function (b) {
      b.addEventListener('click', function () { choisir(b); });
      // Au survol aussi, sur un écran avec souris.
      if (window.matchMedia('(hover: hover)').matches) b.addEventListener('mouseenter', function () { choisir(b); });
    });
  })();

  /* ─── Devis d'entretien ───
     Prix TTC indicatifs pour Rennes, par gabarit :
     [citadine, compacte, SUV / familiale, utilitaire]. */
  var PRIX = {
    revision:     [169, 199, 239, 229],
    revisionEV:   [119, 129, 149, 149],
    plaquettes:   [139, 149, 179, 169],
    disques:      [289, 319, 389, 349],
    liquide:      [59, 59, 69, 69],
    bougies:      [69, 79, 89, 89],
    gasoil:       [49, 49, 59, 59],
    distribution: [590, 690, 790, 750],
    clim:         [89, 89, 99, 99],
    geo:          [69, 69, 79, 79]
  };
  var GABARITS = ['Citadine', 'Compacte', 'SUV / familiale', 'Utilitaire'];
  var MOTEURS = { essence: 'essence', diesel: 'diesel', hybride: 'hybride', electrique: 'électrique' };

  var reglages = document.getElementById('reglages');
  var lignesEl = document.getElementById('ticket-lignes');
  var totalEl = document.getElementById('ticket-total');
  var titreEl = document.getElementById('ticket-titre');
  var kmEl = document.getElementById('km');
  var kmVal = document.getElementById('km-val');
  var dernier = null;
  var totalAffiche = 0;

  function fmt(n) { return n.toLocaleString('fr-FR') + ' €'; }
  function km(n) { return n.toLocaleString('fr-FR') + ' km'; }

  function calculer() {
    var g = +reglages.querySelector('[name="gabarit"]:checked').value;
    var m = reglages.querySelector('[name="moteur"]:checked').value;
    var k = +kmEl.value;
    var ev = m === 'electrique';
    var l = [];

    if (ev) l.push({ n: 'Révision véhicule électrique', d: 'Contrôle batterie et circuit de refroidissement, filtre d’habitacle, 40 points.', p: PRIX.revisionEV[g] });
    else l.push({ n: 'Révision constructeur', d: 'Vidange, filtres à huile, à air et d’habitacle, carnet tamponné.', p: PRIX.revision[g] + (m === 'hybride' ? 10 : 0) });

    // Un véhicule électrique freine surtout au moteur : ses freins s'usent deux fois moins vite.
    var kf = ev ? k / 2 : k;
    if (kf >= 60000) l.push({ n: 'Disques et plaquettes avant', d: 'Épaisseur mesurée avant : si les disques sont bons, on ne les change pas.', p: PRIX.disques[g] });
    else if (kf >= 30000) l.push({ n: 'Plaquettes avant', d: 'Contrôle des disques au pied à coulisse inclus.', p: PRIX.plaquettes[g] });

    if (k >= 40000) l.push({ n: 'Purge du liquide de frein', d: 'Tous les deux ans environ, il absorbe l’humidité.', p: PRIX.liquide[g] });
    if (!ev && m !== 'diesel' && k >= 60000) l.push({ n: 'Bougies d’allumage', d: 'Consommation et démarrages à froid s’en ressentent.', p: PRIX.bougies[g] });
    if (m === 'diesel' && k >= 60000) l.push({ n: 'Filtre à gasoil', d: 'Il protège les injecteurs, bien plus chers.', p: PRIX.gasoil[g] });
    if (!ev && k >= 120000) l.push({ n: 'Kit de distribution et pompe à eau', d: 'Selon le moteur : certains ont une chaîne, on vérifie sur votre modèle.', p: PRIX.distribution[g] });

    if (reglages.querySelector('[name="clim"]').checked) l.push({ n: 'Recharge de climatisation', d: 'Contrôle d’étanchéité et désinfection du circuit.', p: PRIX.clim[g] });
    if (reglages.querySelector('[name="geo"]').checked) l.push({ n: 'Géométrie', d: 'Parallélisme réglé au banc, rapport imprimé.', p: PRIX.geo[g] });

    var total = l.reduce(function (s, x) { return s + x.p; }, 0);
    var cle = g + m + k + l.length;
    kmVal.textContent = km(k);
    titreEl.textContent = GABARITS[g] + ' ' + MOTEURS[m] + ', ' + km(k);

    if (cle !== dernier) {
      lignesEl.innerHTML = l.map(function (x) {
        return '<li><strong>' + x.n + '</strong><span class="p">' + fmt(x.p) + '</span><small>' + x.d + '</small></li>';
      }).join('');
      dernier = cle;
    }
    compter(total);
    reglages.dataset.resume = titreEl.textContent + ' : ' + l.map(function (x) { return x.n.toLowerCase(); }).join(', ') + ' (estimation ' + fmt(total) + ').';
  }

  /* Le total défile jusqu'à sa nouvelle valeur. */
  var raf = null;
  function compter(cible) {
    if (reduced) { totalEl.textContent = fmt(cible); totalAffiche = cible; return; }
    cancelAnimationFrame(raf);
    var depart = totalAffiche, t0 = null;
    function pas(t) {
      if (t0 === null) t0 = t;
      var x = Math.min(1, (t - t0) / 500);
      var e = 1 - Math.pow(1 - x, 3);
      totalAffiche = Math.round(depart + (cible - depart) * e);
      totalEl.textContent = fmt(totalAffiche);
      if (x < 1) raf = requestAnimationFrame(pas);
    }
    raf = requestAnimationFrame(pas);
  }

  if (reglages) {
    reglages.addEventListener('input', calculer);
    reglages.addEventListener('change', calculer);
    calculer();
    document.getElementById('ticket-cta').addEventListener('click', function () {
      var msg = document.getElementById('message');
      if (msg && !msg.value.trim()) msg.value = reglages.dataset.resume;
      setTimeout(function () { document.getElementById('nom').focus({ preventScroll: true }); }, reduced ? 0 : 500);
    });
  }

  /* ─── Compteurs ─── */
  var comptes = document.querySelectorAll('.js-compte');
  function finir(el) { el.textContent = (+el.dataset.cible).toLocaleString('fr-FR'); }
  if (reduced || !hasIO) {
    Array.prototype.forEach.call(comptes, finir);
  } else {
    var ioC = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        ioC.unobserve(e.target);
        var el = e.target, cible = +el.dataset.cible, t0 = null;
        function pas(t) {
          if (t0 === null) t0 = t;
          var x = Math.min(1, (t - t0) / 1600);
          el.textContent = Math.round(cible * (1 - Math.pow(1 - x, 3))).toLocaleString('fr-FR');
          if (x < 1) requestAnimationFrame(pas);
        }
        requestAnimationFrame(pas);
      });
    }, { threshold: 0.6 });
    Array.prototype.forEach.call(comptes, function (el) { ioC.observe(el); });
  }

  /* ─── Rendez-vous ─── */
  var form = document.getElementById('form-rdv');
  if (!form) return;
  var statut = document.getElementById('status');
  var bouton = document.getElementById('submit');
  var date = document.getElementById('date');
  var d = new Date(); d.setDate(d.getDate() + 1);
  date.min = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

  function valider(c) {
    var v = c.value.trim();
    var ok = v !== '';
    if (ok && c.id === 'tel') ok = v.replace(/[^0-9]/g, '').length >= 10;
    var msg = form.querySelector('[data-err-for="' + c.id + '"]');
    if (msg) msg.hidden = ok;
    c.setAttribute('aria-invalid', ok ? 'false' : 'true');
    return ok;
  }
  var requis = ['nom', 'tel', 'date'].map(function (id) { return document.getElementById(id); });
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
      statut.textContent = 'Demande reçue. On vous rappelle dans la journée pour confirmer le créneau.';
    }, 700);
  });
})();
