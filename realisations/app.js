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
     titre, chaine : le titre et la chaîne pour qui la vidéo a été montée
     likes  : facultatif, affiché sur la vignette
     Vignette : videos/yt-<id>.webp ou videos/tt-<numéro>.webp
     La première vidéo YouTube est mise à la une, en grand.
     Exemple :
     { yt: 'dQw4w9WgXcQ', titre: 'Lancement de la collection' },
     { tiktok: '7687523983314390305', compte: 'paname_in_my_belly', titre: 'Paname in my belly' }, */
  var VIDEOS = [
    { yt: 'U2ksM3blOFE', titre: 'Tommy McMillen : la rockstar invaincue qui débarque à l’UFC', chaine: 'Art et Violence' },
    { yt: 'hny3jneSdMg', titre: 'Le Dealer du DarkWeb qui a Disparu avec 300 Millions €', chaine: 'Vzion' },
    { yt: 'uHnE6ZkSBh4', titre: 'Les Hackers qui en Savaient Trop', chaine: 'Vzion' },
    { yt: 'EbnobJxHsoU', titre: 'Le génie derrière le meilleur PSG de l’histoire', chaine: 'FMchronik' },
    { yt: '5yXDjX9CjoU', titre: 'Pourquoi la BBC était scientifiquement IMBATTABLE', chaine: 'FMchronik' },
    { yt: 'kYt3gplx3Dg', titre: 'À Quel Point Le REAL MADRID de ZIDANE Était-Il BON ?', chaine: 'Elite Foot' },
    { yt: 'gueRo7C4HlA', titre: 'Le jour où Fatalis est devenu Iron Man', chaine: 'Le Lore' },
    { tiktok: '7621598466858323222', compte: 'lemondedugout', titre: 'Notre autre gamme de sandwichs va vous régaler', chaine: 'Le Monde du Goût', likes: '70,3 k' },
    { tiktok: '7683567405494308128', compte: 'the_foodologiste', titre: 'Les panuozzo les plus chargés d’Île-de-France à 8,90 €', chaine: 'Foodologiste', likes: '9,5 k' },
    { tiktok: '7658700263158484256', compte: 'sortiesparis', titre: 'Le nouveau resto immersif fusion Japon-Corée', chaine: 'Sorties Paris', likes: '6 k' },
    { tiktok: '7658950856695483680', compte: 'paname_in_my_belly', titre: 'Je comprends enfin pourquoi les Libanais adorent ce sandwich', chaine: 'Paname in my belly', likes: '4,5 k' },
    { tiktok: '7687523983314390305', compte: 'paname_in_my_belly', titre: 'Le nouveau temple des dim sum et bao à Paris', chaine: 'Paname in my belly', likes: '3,3 k' }
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
     Chaque carte garde aussi un lien direct vers YouTube ou TikTok :
     si le lecteur intégré est bloqué (navigateur, extension), la vidéo
     reste visible en un clic. */
  (function videos() {
    var grille = document.getElementById('grid-videos');
    var vide = document.getElementById('videos-vide');
    var note = document.getElementById('note-video');
    if (!grille || !VIDEOS.length) return;
    vide.hidden = true; note.hidden = false;

    var INTEGRE = /(^|\.)optimusstudio\.fr$|\.netlify\.app$|^localhost$|^127\.0\.0\.1$/.test(location.hostname);
    /* Si la page bloque quand même le lecteur (politique de sécurité),
       la vignette laisse place à un lien vers la plateforme. */
    document.addEventListener('securitypolicyviolation', function (e) {
      if (!/youtube|tiktok/.test(e.blockedURI || '')) return;
      Array.prototype.forEach.call(grille.querySelectorAll('.video__ecran iframe'), function (f) {
        var carte = f.closest('.video');
        f.parentNode.innerHTML = '<a class="video__secours" href="' + carte.querySelector('.video__lien').href +
          '" target="_blank" rel="noopener">Lire la vidéo sur ' + (carte.classList.contains('video--short') ? 'TikTok' : 'YouTube') + ' ↗</a>';
      });
    });

    function echap(t) { return String(t || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

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

    VIDEOS.forEach(function (v) {
      var tiktok = !!v.tiktok;
      var une = !tiktok && v === longs[0];
      var el = document.createElement('article');
      el.className = 'video' + (tiktok ? ' video--short' : '') + (une ? ' video--une' : '');
      var titre = v.titre || (tiktok ? '@' + v.compte : 'Montage vidéo');
      el.innerHTML =
        '<div class="video__ecran">' +
          '<button class="video__lancer" type="button" aria-label="Lire la vidéo : ' + echap(titre) + '">' +
            '<img src="videos/' + (tiktok ? 'tt-' + v.tiktok : 'yt-' + v.yt) + '.webp" alt="" width="' + (tiktok ? 360 : 640) + '" height="' + (tiktok ? 640 : 360) + '" loading="lazy" decoding="async">' +
            (v.likes ? '<span class="video__likes">♥ ' + echap(v.likes) + '</span>' : '') +
            '<span class="video__play" aria-hidden="true"></span>' +
          '</button>' +
        '</div>' +
        '<div class="video__corps">' +
          '<p class="video__type">' + (une ? 'À la une · ' : '') + (tiktok ? 'TikTok' : 'YouTube') + '</p>' +
          '<h3 class="video__titre">' + echap(titre) + '</h3>' +
          (v.chaine ? '<p class="video__client">' + echap(v.chaine) + '</p>' : '') +
          '<a class="video__lien" href="' + (tiktok
            ? 'https://www.tiktok.com/@' + encodeURIComponent(v.compte) + '/video/' + encodeURIComponent(v.tiktok)
            : 'https://www.youtube.com/watch?v=' + encodeURIComponent(v.yt)) +
            '" target="_blank" rel="noopener">Voir sur ' + (tiktok ? 'TikTok' : 'YouTube') + ' ↗</a>' +
        '</div>';
      var bouton = el.querySelector('.video__lancer');
      var lien = el.querySelector('.video__lien').href;
      bouton.addEventListener('click', function () {
        /* Ailleurs que sur le vrai site (un aperçu, une copie), les
           lecteurs intégrés sont souvent bloqués : on ouvre directement
           la vidéo sur YouTube ou TikTok. */
        if (!INTEGRE) { window.open(lien, '_blank', 'noopener'); return; }
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
    });

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
