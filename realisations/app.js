/* =========================================================
   Réalisations — Optimus Studio
   Rubriques, filtres par secteur, et aperçu live en iframe.
   Aucune dépendance.
   ========================================================= */

(function () {
  'use strict';

  /* Ajouter un projet = ajouter une entrée ici. Rien d'autre à toucher. */
  var PROJETS = [
    {
      no: '001',
      slug: 'berthier-energies',
      nom: 'Berthier Énergies',
      secteur: 'btp',
      desc: 'Chauffagiste. Séquence de 121 images pilotée au scroll, télémétrie thermique, rénovation énergétique.',
      tags: ['Scroll canvas', 'Chauffagiste', 'JSON-LD'],
      url: '/demos/berthier-energies/'
    },
    {
      no: '002',
      slug: 'plomberie-vasseur',
      nom: 'Plomberie Vasseur',
      secteur: 'btp',
      desc: 'Plombier chauffagiste. Le téléphone est la conversion : aucune animation, tout lisible à l’arrêt.',
      tags: ['Vitrine', 'Artisan', 'Formulaire'],
      url: '/demos/plomberie-vasseur/'
    },
    {
      no: '003',
      slug: 'maison-verrier',
      nom: 'Maison Verrier',
      secteur: 'resto',
      desc: 'Restaurant. Structure pilotée par la photographie : bandes pleine largeur et sections de texte, thème sombre du début à la fin.',
      tags: ['Photo pleine largeur', 'Restaurant', 'Réservation'],
      url: '/demos/maison-verrier/'
    },
    {
      no: '004',
      slug: 'barbier-lacroix',
      nom: 'Barbier Lacroix',
      secteur: 'beaute',
      desc: 'Barbier. Monochrome froid et angles vifs, à l’opposé du sombre et doré du secteur.',
      tags: ['Vitrine', 'Barbier', 'Tarifs'],
      url: '/demos/barbier-lacroix/'
    }
  ];

  var grid     = document.getElementById('grid-sites');
  var tabs     = Array.prototype.slice.call(document.querySelectorAll('.tab'));
  var chips    = Array.prototype.slice.call(document.querySelectorAll('.chip'));
  var viewer   = document.getElementById('viewer');
  var frame    = document.getElementById('v-frame');
  var stage    = document.getElementById('v-stage');
  var vNo      = document.getElementById('v-no');
  var vName    = document.getElementById('v-name');
  var vOpen    = document.getElementById('v-open');
  var vClose   = document.getElementById('v-close');
  var btnDesk  = document.getElementById('v-desktop');
  var btnMob   = document.getElementById('v-mobile');

  var lastFocus = null;

  /* ─── Rendu des cartes ─── */
  function carte(p) {
    var el = document.createElement('button');
    el.className = 'card';
    el.type = 'button';
    el.dataset.secteur = p.secteur;
    el.setAttribute('aria-label', 'Ouvrir l’aperçu de ' + p.nom);

    el.innerHTML =
      '<span class="card__shot">' +
        '<img src="shots/' + p.slug + '.webp" alt="Aperçu du site ' + p.nom + '"' +
             ' width="800" height="500" loading="lazy" decoding="async">' +
        '<span class="card__play"><span>Voir en direct</span></span>' +
      '</span>' +
      '<span class="card__body">' +
        '<span class="card__no">' + p.no + ' / Site</span>' +
        '<span class="card__name">' + p.nom + '</span>' +
        '<span class="card__desc">' + p.desc + '</span>' +
        '<span class="card__tags">' +
          p.tags.map(function (t) { return '<span>' + t + '</span>'; }).join('') +
        '</span>' +
      '</span>';

    el.addEventListener('click', function () { ouvrir(p, el); });
    return el;
  }

  PROJETS.forEach(function (p) { grid.appendChild(carte(p)); });

  /* ─── Rubriques ─── */
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      document.querySelectorAll('.panel').forEach(function (panel) {
        panel.hidden = panel.dataset.panel !== tab.dataset.tab;
      });
    });
  });

  /* ─── Filtres par secteur ─── */
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) { c.classList.toggle('is-on', c === chip); });
      var s = chip.dataset.secteur;
      Array.prototype.forEach.call(grid.children, function (card) {
        card.hidden = s !== 'all' && card.dataset.secteur !== s;
      });
    });
  });

  /* ─── Aperçu live ─── */
  function format(mobile) {
    stage.classList.toggle('is-mobile', mobile);
    btnMob.classList.toggle('is-on', mobile);
    btnDesk.classList.toggle('is-on', !mobile);
  }

  function ouvrir(p, source) {
    lastFocus = source || null;
    vNo.textContent = p.no + ' / Site';
    vName.textContent = p.nom;
    vOpen.href = p.url;
    frame.src = p.url;
    format(false);
    viewer.hidden = false;
    document.body.style.overflow = 'hidden';
    vClose.focus();
  }

  function fermer() {
    viewer.hidden = true;
    frame.src = 'about:blank';   // coupe le site chargé, libère la mémoire
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  vClose.addEventListener('click', fermer);
  btnDesk.addEventListener('click', function () { format(false); });
  btnMob.addEventListener('click', function () { format(true); });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !viewer.hidden) fermer();
  });
})();
