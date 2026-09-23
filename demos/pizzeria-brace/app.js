/* =========================================================
   Brace - démo Optimus Studio
   Braises dans le hero, badge « four allumé » selon l'heure de
   Toulouse, trois mondes pilotés par le scroll, carte visuelle
   générée depuis un tableau, commande à emporter, réservation.
   requestAnimationFrame uniquement quand la section est à l'écran,
   aucun écouteur scroll, aucune dépendance.
   ========================================================= */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* ─── En-tête : fond plein hors du hero ─── */
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
    var ioR = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        ioR.unobserve(e.target);
      });
    }, { threshold: 0.2 });
    Array.prototype.forEach.call(reveals, function (el) { ioR.observe(el); });
  }

  /* ─── Four allumé ? Calculé à l'heure de Toulouse, pas celle du visiteur ─── */
  (function statut() {
    var el = document.getElementById('statut');
    var txt = document.getElementById('statut-txt');
    if (!el || !txt) return;
    // [jour 0 = dimanche] → créneaux en minutes
    var H = {
      0: [[19 * 60, 22 * 60]],
      1: [],
      2: [[12 * 60, 14 * 60 + 30], [19 * 60, 22 * 60 + 30]],
      3: [[12 * 60, 14 * 60 + 30], [19 * 60, 22 * 60 + 30]],
      4: [[12 * 60, 14 * 60 + 30], [19 * 60, 22 * 60 + 30]],
      5: [[12 * 60, 14 * 60 + 30], [19 * 60, 22 * 60 + 30]],
      6: [[12 * 60, 14 * 60 + 30], [19 * 60, 22 * 60 + 30]]
    };
    var JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    function hm(m) { var h = Math.floor(m / 60), mm = m % 60; return h + 'h' + (mm ? String(mm).padStart(2, '0') : ''); }

    var maintenant;
    try {
      var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
      var o = {}; parts.forEach(function (p) { o[p.type] = p.value; });
      var idx = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[o.weekday];
      maintenant = { j: idx, m: (parseInt(o.hour, 10) % 24) * 60 + parseInt(o.minute, 10) };
    } catch (e) {
      var d = new Date(); maintenant = { j: d.getDay(), m: d.getHours() * 60 + d.getMinutes() };
    }

    var ouvert = null;
    H[maintenant.j].forEach(function (c) { if (maintenant.m >= c[0] && maintenant.m < c[1]) ouvert = c; });
    if (ouvert) {
      txt.textContent = 'Four allumé · ouvert jusqu’à ' + hm(ouvert[1]);
      return;
    }
    el.classList.add('is-ferme');
    // Prochaine ouverture : aujourd'hui plus tard, sinon les jours suivants.
    for (var k = 0; k < 8; k++) {
      var j = (maintenant.j + k) % 7;
      var suivant = H[j].filter(function (c) { return k > 0 || c[0] > maintenant.m; })[0];
      if (suivant) {
        txt.textContent = 'Fermé · ouvre ' + (k === 0 ? 'à ' : k === 1 ? 'demain à ' : JOURS[j] + ' à ') + hm(suivant[0]);
        return;
      }
    }
  })();

  /* ─── Braises : des points orange qui montent du four ─── */
  (function braises() {
    var canvas = document.getElementById('braises');
    if (!canvas || !canvas.getContext || reduced || !hasIO) return;
    var ctx = canvas.getContext('2d');
    var pts = [], running = false, W = 0, Hh = 0, dpr = 1;

    function taille() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth; Hh = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = Hh * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function nouvelle(bas) {
      // Les braises naissent surtout dans la moitié gauche, là où est le feu.
      return {
        x: W * (0.2 + Math.random() * 0.45),
        y: bas ? Hh * (0.55 + Math.random() * 0.3) : Math.random() * Hh,
        r: 0.6 + Math.random() * 1.8,
        vy: 0.25 + Math.random() * 0.7,
        vx: (Math.random() - 0.5) * 0.25,
        a: 0.35 + Math.random() * 0.6,
        t: Math.random() * 6.28
      };
    }
    taille();
    var n = W < 700 ? 22 : 45;
    for (var i = 0; i < n; i++) pts.push(nouvelle(false));

    function frame() {
      ctx.clearRect(0, 0, W, Hh);
      ctx.globalCompositeOperation = 'lighter';
      pts.forEach(function (p, i) {
        p.t += 0.03;
        p.y -= p.vy;
        p.x += p.vx + Math.sin(p.t) * 0.3;
        p.a -= 0.0018;
        if (p.y < -10 || p.a <= 0) pts[i] = nouvelle(true);
        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        g.addColorStop(0, 'rgba(255, 190, 90,' + Math.max(0, p.a) + ')');
        g.addColorStop(1, 'rgba(255, 90, 20, 0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, 6.283); ctx.fill();
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

  /* ─── Les trois mondes ───
     La section fait 330 vh, son contenu est collant. On lit la
     progression à chaque image tant qu'elle est visible : un tiers
     par pizza, et la pizza active tourne avec le scroll. */
  (function mondes() {
    var section = document.querySelector('.mondes');
    if (!section || reduced || !hasIO) return;
    var items = Array.prototype.slice.call(section.querySelectorAll('.monde'));
    var imgs = items.map(function (m) { return m.querySelector('.monde__pizza img'); });
    var no = document.getElementById('monde-no');
    var actif = 0, running = false;

    function progression() {
      var r = section.getBoundingClientRect();
      var course = r.height - window.innerHeight;
      return course <= 0 ? 0 : Math.min(1, Math.max(0, -r.top / course));
    }
    function tick() {
      var p = progression();
      var i = Math.min(2, Math.floor(p * 3));
      if (i !== actif) {
        items[actif].classList.remove('is-on');
        items[i].classList.add('is-on');
        section.dataset.actif = i;
        if (no) no.textContent = '0' + (i + 1);
        actif = i;
      }
      // Un tour complet par pizza, en douceur.
      var local = p * 3 - i;
      imgs[i].style.setProperty('--rot', (local * 140 - 20).toFixed(2) + 'deg');
      if (running) requestAnimationFrame(tick);
    }
    section.dataset.actif = 0;
    new IntersectionObserver(function (e) {
      var v = e[0].isIntersecting;
      if (v && !running) { running = true; requestAnimationFrame(tick); }
      if (!v) running = false;
    }).observe(section);
  })();

  /* ─── Commande à emporter ─── */
  var panier = [];
  var liste = document.getElementById('panier-liste');
  var vide = document.getElementById('panier-vide');
  var total = document.getElementById('panier-total');
  function prix(n) { return (Number.isInteger(n) ? n : n.toFixed(2).replace('.', ',')) + ' €'; }
  function rendrePanier() {
    if (!liste) return;
    liste.innerHTML = '';
    var somme = 0;
    panier.forEach(function (l, i) {
      somme += l.prix * l.qte;
      var li = document.createElement('li');
      li.innerHTML = '<span>' + l.qte + ' × ' + l.nom + '</span><span>' + prix(l.prix * l.qte) +
        '<button type="button" data-i="' + i + '">retirer</button></span>';
      liste.appendChild(li);
    });
    vide.hidden = panier.length > 0;
    total.hidden = panier.length === 0;
    total.innerHTML = '<span>Total</span><span>' + prix(somme) + '</span>';
  }
  function ajouter(nom, p, bouton) {
    var l = panier.filter(function (x) { return x.nom === nom; })[0];
    if (l) l.qte++; else panier.push({ nom: nom, prix: p, qte: 1 });
    rendrePanier();
    if (bouton) {
      bouton.classList.add('is-ajoute');
      var ancien = bouton.getAttribute('data-label') || bouton.innerHTML;
      bouton.setAttribute('data-label', ancien);
      bouton.firstChild.nodeValue = 'Ajoutée ';
      setTimeout(function () { bouton.classList.remove('is-ajoute'); bouton.innerHTML = ancien; }, 1400);
    }
  }
  if (liste) {
    liste.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-i]');
      if (!b) return;
      var l = panier[+b.dataset.i];
      if (--l.qte <= 0) panier.splice(+b.dataset.i, 1);
      rendrePanier();
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll('.js-ajout'), function (b) {
    b.addEventListener('click', function () {
      var tmp = document.createElement('span'); tmp.innerHTML = b.dataset.nom;
      ajouter(tmp.textContent, parseFloat(b.dataset.prix), b);
    });
  });

  /* ─── Carte visuelle ───
     img: null → visuel de remplacement (disque coloré + initiale),
     le temps que la photo du plat arrive. c / c2 : couleurs du disque. */
  var CARTE = {
    pizze: [
      { nom: 'Margherita', prix: 11, desc: 'Tomate San Marzano, fior di latte, basilic, huile d’olive.', img: 'img/margherita-rond.webp', tags: ['Rossa'], c: '#6B1A10' },
      { nom: 'Patate & rosmarino', prix: 14, desc: 'Crème de mozzarella, pommes de terre, romarin, sel de Guérande.', img: 'img/patate-rond.webp', tags: ['Bianca'], c: '#5E4520' },
      { nom: 'Diavola', prix: 14, desc: 'Salami piquant de Calabre, olives noires, huile au piment.', img: 'img/diavola-rond.webp', tags: ['Rossa', 'Piquante'], c: '#5A1A0C' },
      { nom: 'Bufala', prix: 14, desc: 'Tomate, mozzarella di bufala posée à la sortie du four, basilic.', img: null, tags: ['Rossa'], c: '#7A1E12', c2: '#E8D9BF' },
      { nom: 'Quattro formaggi', prix: 15, desc: 'Fior di latte, gorgonzola, provola fumée, parmesan.', img: null, tags: ['Bianca'], c: '#6A5222', c2: '#F0D98C' },
      { nom: 'Crudo, burrata & pistacchio', prix: 16, desc: 'Jambon cru posé à froid, burrata, pistache, olives, roquette, balsamique.', img: null, tags: ['Bianca'], c: '#4E5A26', c2: '#E7B7B0' }
    ],
    cocktails: [
      { nom: 'Spritz', prix: 9, desc: 'Apérol, prosecco, eau gazeuse, tranche d’orange.', img: null, tags: [], c: '#8A3312', c2: '#F29A45' },
      { nom: 'Negroni', prix: 10, desc: 'Gin, Campari, vermouth rouge, zeste d’orange, un seul gros glaçon.', img: null, tags: [], c: '#5E0F12', c2: '#C8342F' },
      { nom: 'Limoncello tonic', prix: 9, desc: 'Limoncello maison, tonic, citron, feuille de basilic.', img: null, tags: [], c: '#6E6412', c2: '#F2E27A' },
      { nom: 'Limonade de Sicile', prix: 4.5, desc: 'Citron de Sicile pressé, sucre de canne, eau pétillante.', img: null, tags: ['Sans alcool'], c: '#556A1C', c2: '#E9EFA0' }
    ],
    dolci: [
      { nom: 'Tiramisù', prix: 7, desc: 'Mascarpone, biscuits imbibés de café serré, cacao amer.', img: null, tags: [], c: '#3E2414', c2: '#C8A27A' },
      { nom: 'Pizza Nutella', prix: 9, desc: 'À partager : pâte gonflée au four, Nutella, noisettes torréfiées.', img: 'img/nutella-rond.webp', tags: ['À partager'], c: '#3A1F12', c2: '#9C6A3E' },
      { nom: 'Cannoli siciliens', prix: 7, desc: 'Trois cannoli, ricotta sucrée, pistache, écorce d’orange confite.', img: 'img/cannoli-rond.webp', tags: [], c: '#5B4A1E', c2: '#EBD7A6' }
    ]
  };

  var grille = document.getElementById('plats');
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.onglets [role="tab"]'));
  var panneau = document.getElementById('p-carte');

  function carteDe(cat) {
    grille.innerHTML = '';
    CARTE[cat].forEach(function (p, i) {
      var li = document.createElement('li');
      li.className = 'plat plat--' + cat;
      li.style.setProperty('--i', i);
      li.style.setProperty('--c', p.c);
      if (p.c2) li.style.setProperty('--c2', p.c2);
      var visuel = p.img
        ? '<img src="' + p.img + '" alt="' + p.nom + '" width="900" height="900" loading="lazy">'
        : '<span class="plat__disque" aria-hidden="true">' + p.nom.charAt(0) + '</span>';
      var tags = p.tags.map(function (t) {
        var cls = t === 'Piquante' ? ' class="is-pique"' : t === 'Sans alcool' ? ' class="is-sans"' : '';
        return '<span' + cls + '>' + t + '</span>';
      }).join('');
      var ajout = cat === 'cocktails' ? '' :
        '<button class="plat__ajout" type="button" data-nom="' + p.nom + '" data-prix="' + p.prix + '">+ Ajouter</button>';
      li.innerHTML =
        '<div class="plat__visuel">' + visuel + '</div>' +
        '<span class="plat__prix">' + prix(p.prix) + '</span>' +
        (tags ? '<span class="plat__tags">' + tags + '</span>' : '') +
        '<div class="plat__corps"><h3 class="plat__nom">' + p.nom + '</h3>' +
        '<p class="plat__desc">' + p.desc + '</p>' + ajout + '</div>';
      grille.appendChild(li);
    });
  }

  if (grille && tabs.length) {
    grille.addEventListener('click', function (e) {
      var b = e.target.closest('.plat__ajout');
      if (!b) return;
      ajouter(b.dataset.nom, parseFloat(b.dataset.prix), null);
      b.classList.add('is-ajoute'); b.textContent = '✓ Ajoutée';
      setTimeout(function () { b.classList.remove('is-ajoute'); b.textContent = '+ Ajouter'; }, 1400);
    });

    function activer(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
      });
      panneau.setAttribute('aria-labelledby', tab.id);
      carteDe(tab.dataset.cat);
      if (focus) tab.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { activer(t); });
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        activer(tabs[(i + d + tabs.length) % tabs.length], true);
      });
    });
    carteDe('pizze');
  }

  /* ─── Réservation ─── */
  var form = document.getElementById('form-resa');
  if (!form) return;
  var statutF = document.getElementById('status');
  var bouton = document.getElementById('submit');
  var date = document.getElementById('date');
  var auj = new Date();
  date.min = auj.getFullYear() + '-' + String(auj.getMonth() + 1).padStart(2, '0') + '-' + String(auj.getDate()).padStart(2, '0');

  function valider(champ) {
    var v = champ.value.trim();
    var ok = v !== '';
    if (ok && champ.id === 'tel') ok = v.replace(/[^0-9]/g, '').length >= 10;
    var msg = form.querySelector('[data-err-for="' + champ.id + '"]');
    if (msg) msg.hidden = ok;
    champ.setAttribute('aria-invalid', ok ? 'false' : 'true');
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
      statutF.textContent = 'Merci de compléter les champs signalés.';
      requis.filter(function (c) { return c.getAttribute('aria-invalid') === 'true'; })[0].focus();
      return;
    }
    // DÉMO : aucun envoi réel. En production, brancher Netlify Forms.
    bouton.disabled = true;
    statutF.textContent = 'Envoi en cours...';
    setTimeout(function () {
      Array.prototype.forEach.call(form.querySelectorAll('.field'), function (f) { f.hidden = true; });
      bouton.hidden = true;
      statutF.textContent = 'Table réservée. On vous envoie un SMS de confirmation dans l’heure.';
    }, 700);
  });
})();
