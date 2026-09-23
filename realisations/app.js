/* =========================================================
   Réalisations — Optimus Studio
   Rubriques, filtres par secteur, et aperçu live en iframe.
   Aucune dépendance.
   ========================================================= */

(function () {
  'use strict';

  /* Ajouter un projet = ajouter une entrée ici. Rien d'autre à toucher. */
  /* Rangés par secteur, dans l'ordre des filtres. Le numéro suit l'ordre
     d'affichage ; il est recalculé plus bas, inutile de le tenir à jour. */
  var PROJETS = [
    { slug: 'berthier-energies', nom: 'Berthier Énergies', secteur: 'btp',
      desc: 'Chauffagiste. Le radiateur se démonte au scroll : séquence de 121 images, télémétrie thermique.',
      tags: ['Scroll canvas', 'Chauffagiste', 'JSON-LD'], url: '/demos/berthier-energies/' },
    { slug: 'serrurier', nom: 'Delorme Serrurerie', secteur: 'btp',
      desc: 'Serrurier. Le cylindre se démonte pièce par pièce au scroll, un message par écran.',
      tags: ['Scroll canvas', 'Urgence 24 h/24', 'Rappel'], url: '/demos/serrurier/' },
    { slug: 'moreau-electricite', nom: 'Moreau Électricité', secteur: 'btp',
      desc: 'Électricien. Le tableau passe de hors tension à sous tension au fil du scroll, relevé en direct.',
      tags: ['Scroll', 'Électricien', 'Devis'], url: '/demos/moreau-electricite/' },
    { slug: 'plomberie-vasseur', nom: 'Plomberie Vasseur', secteur: 'btp',
      desc: 'Plombier. Fiche technique sombre et diagnostic de fuite en trois questions.',
      tags: ['Diagnostic', 'Plombier', 'Tarifs'], url: '/demos/plomberie-vasseur/' },
    { slug: 'couverture-marchal', nom: 'Couverture Marchal', secteur: 'btp',
      desc: 'Couvreur. Le même toit avant et après travaux, à comparer au curseur.',
      tags: ['Avant / après', 'Couvreur', 'Visite'], url: '/demos/couverture-marchal/' },
    { slug: 'lisiere-paysage', nom: 'Lisière', secteur: 'btp',
      desc: 'Paysagiste. Une lampe torche révèle le jardin en automne, puis les quatre saisons défilent au scroll.',
      tags: ['Lampe torche', 'Paysagiste', 'Crédit d’impôt'], url: '/demos/lisiere-paysage/' },
    { slug: 'maison-verrier', nom: 'Maison Verrier', secteur: 'resto',
      desc: 'Restaurant. Structure pilotée par la photographie : bandes pleine largeur et sections de texte, thème sombre du début à la fin.',
      tags: ['Photo pleine largeur', 'Restaurant', 'Réservation'], url: '/demos/maison-verrier/' },
    { slug: 'pizzeria-brace', nom: 'Brace', secteur: 'resto',
      desc: 'Pizzeria napolitaine. Trois pizzas, trois univers au scroll, et une carte en photos avec commande à emporter.',
      tags: ['Univers au scroll', 'Pizzeria', 'Carte visuelle'], url: '/demos/pizzeria-brace/' },
    { slug: 'maison-solene', nom: 'Maison Solène', secteur: 'beaute',
      desc: 'Institut de beauté. Carte des soins qui se déplie, réservation en quatre étapes.',
      tags: ['Réservation', 'Institut', 'Carte des soins'], url: '/demos/maison-solene/' },
    { slug: 'barbier-lacroix', nom: 'Barbier Lacroix', secteur: 'beaute',
      desc: 'Barbier. Noir acier et bleu électrique, les prestations s’empilent comme des cartes au scroll.',
      tags: ['Cartes empilées', 'Barbier', 'Tarifs'], url: '/demos/barbier-lacroix/' },
    { slug: 'forge-studio', nom: 'Forge Studio', secteur: 'sport',
      desc: 'Salle de sport. Planning des cours filtrable, fiche de chaque cours, séance d’essai.',
      tags: ['Planning', 'Salle de sport', 'Tarifs'], url: '/demos/forge-studio/' },
    { slug: 'cabinet-arcel', nom: 'Cabinet Arcel', secteur: 'sport',
      desc: 'Ostéo et kiné du sport. On touche la zone qui fait mal, la fiche de prise en charge s’ouvre.',
      tags: ['Corps cliquable', 'Santé', 'Rendez-vous'], url: '/demos/cabinet-arcel/' },
    { slug: 'belval-proprete', nom: 'Belval Propreté', secteur: 'services',
      desc: 'Nettoyage de bureaux. Estimation mensuelle en direct selon la surface et la fréquence.',
      tags: ['Simulateur', 'B2B', 'Devis'], url: '/demos/belval-proprete/' },
    { slug: 'cabinet-delaunay', nom: 'Cabinet Delaunay', secteur: 'services',
      desc: 'Avocate. Le délai légal à connaître selon votre situation, texte de loi à l’appui.',
      tags: ['Guide juridique', 'Avocat', 'Rendez-vous'], url: '/demos/cabinet-delaunay/' },
    { slug: 'garage-ferrand', nom: 'Garage Ferrand', secteur: 'services',
      desc: 'Garage auto. Devis d’entretien selon la voiture et le kilométrage, services qui changent la photo.',
      tags: ['Devis en ligne', 'Garage', 'Rendez-vous'], url: '/demos/garage-ferrand/' },
    { slug: 'auto-ecole-lumiere', nom: 'Auto-école Lumière', secteur: 'services',
      desc: 'Auto-école. La voiture traverse Paris au scroll, le parcours du permis défile, le prix se calcule en direct.',
      tags: ['Vidéo au scroll', 'Auto-école', 'Simulateur'], url: '/demos/auto-ecole-lumiere/' }
  ].map(function (p, i) {
    p.no = String(i + 1).padStart(3, '0');
    return p;
  });

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
  /* Le nombre de projets s'affiche sur chaque filtre, calculé depuis PROJETS. */
  chips.forEach(function (chip) {
    var s = chip.dataset.secteur;
    var n = s === 'all' ? PROJETS.length : PROJETS.filter(function (p) { return p.secteur === s; }).length;
    var badge = document.createElement('span');
    badge.className = 'chip__n';
    badge.textContent = n;
    chip.appendChild(badge);
  });

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) {
        c.classList.toggle('is-on', c === chip);
        c.setAttribute('aria-pressed', c === chip ? 'true' : 'false');
      });
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
