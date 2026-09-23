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
      tags: ['Vidéo au scroll', 'Auto-école', 'Simulateur'], url: '/demos/auto-ecole-lumiere/' },
    { slug: 'maison-alba', nom: 'Maison Alba', secteur: 'services',
      desc: 'Agence immobilière. On visite l’appartement au scroll, pièce par pièce, le regard suit la souris. Carte des secteurs et estimation en direct.',
      tags: ['Visite immersive', 'Immobilier', 'Estimation'], url: '/demos/maison-alba/' }
  ].map(function (p, i) {
    p.no = String(i + 1).padStart(3, '0');
    return p;
  });

  /* ─── Vidéos ───
     Ajouter une vidéo = ajouter une ligne ici.
     yt     : l'identifiant YouTube (ce qui suit « v= » ou « youtu.be/ »)
     tiktok : le numéro de la vidéo TikTok (la fin du lien) et compte : le @
     titre  : facultatif. Sans titre, celui de YouTube ou de TikTok est
              récupéré à l'ouverture de l'onglet Vidéo.
     Exemple :
     { yt: 'dQw4w9WgXcQ', titre: 'Lancement de la collection' },
     { tiktok: '7687523983314390305', compte: 'paname_in_my_belly' }, */
  var VIDEOS = [
    { yt: 'hny3jneSdMg' },
    { yt: 'uHnE6ZkSBh4' },
    { yt: 'U2ksM3blOFE' },
    { yt: 'EbnobJxHsoU' },
    { yt: '5yXDjX9CjoU' },
    { yt: 'kYt3gplx3Dg' },
    { tiktok: '7687523983314390305', compte: 'paname_in_my_belly' },
    { tiktok: '7658950856695483680', compte: 'paname_in_my_belly' },
    { tiktok: '7683567405494308128', compte: 'the_foodologiste' },
    { tiktok: '7621598466858323222', compte: 'lemondedugout' },
    { tiktok: '7658700263158484256', compte: 'sortiesparis' }
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
        if (tab.dataset.tab === 'video' && !panel.hidden) chargerVideos();
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

  /* ─── Vidéos : deux rangées (formats longs, formats verticaux),
     lecteur chargé au clic seulement ───
     Les titres et les vignettes TikTok sont demandés à l'ouverture de
     l'onglet Vidéo, pas au chargement de la page. Si la demande échoue,
     la carte garde un intitulé générique et une vignette aux couleurs
     du site : rien ne casse. */
  var chargerVideos = function () {};
  (function videos() {
    var grille = document.getElementById('grid-videos');
    var vide = document.getElementById('videos-vide');
    var note = document.getElementById('note-video');
    if (!grille || !VIDEOS.length) return;
    vide.hidden = true; note.hidden = false;

    function echap(t) { return String(t || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    /* Une légende TikTok, c'est souvent trois lignes de hashtags :
       on garde la phrase, on coupe proprement. */
    function propre(t) {
      t = String(t || '').split('#')[0].replace(/\s+/g, ' ').trim();
      if (t.length > 72) t = t.slice(0, 70).replace(/\s+\S*$/, '') + '…';
      return t;
    }

    function bloc(titre, n, classe) {
      var b = document.createElement('div');
      b.className = 'videos-bloc';
      b.innerHTML = '<h2 class="videos-bloc__titre">' + titre + ' <span>' + n + '</span></h2>' +
        '<div class="videos ' + classe + '"></div>';
      grille.appendChild(b);
      return b.querySelector('.videos');
    }
    var longs = VIDEOS.filter(function (v) { return v.yt; });
    var courts = VIDEOS.filter(function (v) { return v.tiktok; });
    var gLongs = longs.length ? bloc('Formats longs', longs.length, '') : null;
    var gCourts = courts.length ? bloc('Reels &amp; TikTok', courts.length, 'videos--courts') : null;

    var aCharger = [];
    VIDEOS.forEach(function (v) {
      var tiktok = !!v.tiktok;
      var el = document.createElement('article');
      el.className = 'video' + (tiktok ? ' video--short' : '');
      var titre = v.titre || (tiktok ? 'Montage vertical' : 'Montage vidéo');
      el.innerHTML =
        '<div class="video__ecran">' +
          '<button class="video__lancer" type="button" aria-label="Lire la vidéo : ' + echap(titre) + '">' +
            (tiktok
              ? '<span class="video__fond" aria-hidden="true"><span>@' + echap(v.compte) + '</span></span><img alt="" hidden>'
              : '<img src="https://i.ytimg.com/vi/' + encodeURIComponent(v.yt) + '/hqdefault.jpg" alt="" loading="lazy" decoding="async" onerror="this.style.visibility=\'hidden\'">') +
            '<span class="video__play" aria-hidden="true"></span>' +
          '</button>' +
        '</div>' +
        '<div class="video__corps">' +
          '<p class="video__type">' + (tiktok ? 'TikTok' : 'YouTube') + '</p>' +
          '<h3 class="video__titre">' + echap(titre) + '</h3>' +
          (tiktok ? '<p class="video__client">@' + echap(v.compte) + '</p>' : '') +
        '</div>';
      var bouton = el.querySelector('.video__lancer');
      bouton.addEventListener('click', function () {
        var f = document.createElement('iframe');
        f.src = tiktok
          ? 'https://www.tiktok.com/player/v1/' + encodeURIComponent(v.tiktok) + '?autoplay=1&rel=0&description=1&music_info=0'
          : 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(v.yt) + '?autoplay=1&rel=0&modestbranding=1';
        f.title = el.querySelector('.video__titre').textContent;
        f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
        f.allowFullscreen = true;
        f.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        var ecran = el.querySelector('.video__ecran');
        ecran.innerHTML = '';
        ecran.appendChild(f);
        f.focus();
      });
      (tiktok ? gCourts : gLongs).appendChild(el);
      if (!v.titre || tiktok) aCharger.push({ v: v, el: el });
    });

    function lire(url) {
      return fetch(url).then(function (r) { if (!r.ok) throw r; return r.json(); });
    }
    var fait = false;
    chargerVideos = function () {
      if (fait || !window.fetch) return;
      fait = true;
      aCharger.forEach(function (o) {
        var v = o.v, el = o.el;
        var page = v.tiktok
          ? 'https://www.tiktok.com/@' + v.compte + '/video/' + v.tiktok
          : 'https://www.youtube.com/watch?v=' + v.yt;
        var direct = v.tiktok
          ? 'https://www.tiktok.com/oembed?url=' + encodeURIComponent(page)
          : 'https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent(page);
        lire(direct).catch(function () {
          return lire('https://noembed.com/embed?url=' + encodeURIComponent(page));
        }).then(function (d) {
          if (!d || d.error) return;
          var t = propre(d.title);
          if (t && !v.titre) {
            el.querySelector('.video__titre').textContent = t;
            el.querySelector('.video__lancer').setAttribute('aria-label', 'Lire la vidéo : ' + t);
          }
          var img = el.querySelector('.video__lancer img');
          if (v.tiktok && d.thumbnail_url && img) {
            img.onload = function () { img.hidden = false; };
            img.src = d.thumbnail_url;
          }
        }).catch(function () {});
      });
    };
  })();

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
