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
     vues   : facultatif, affiché sur la vignette
     mp4    : true si l'extrait muet existe (videos/tt-<numéro>.mp4)
     apercu : true si l'extrait de 8 s existe (videos/yt-<id>.mp4)
     Vignette : videos/yt-<id>.webp ou videos/tt-<numéro>.webp
     La première vidéo YouTube est mise à la une, en grand.
     Exemple :
     { yt: 'dQw4w9WgXcQ', titre: 'Lancement de la collection' },
     { tiktok: '7687523983314390305', compte: 'paname_in_my_belly', titre: 'Paname in my belly' }, */
  var VIDEOS = [
    { yt: 'gM9F3izKATM', titre: 'L’histoire du pilote MAUDIT de Ferrari', chaine: 'DRYV', vues: '186 k', apercu: true },
    { yt: 'xJzXGaQgzy0', titre: 'L’épisode qui a TRAUMATISÉ 5 Millions de personnes - THE WALKING DEAD', chaine: 'TheOutsiderStories', vues: '149 k', apercu: true },
    { yt: 'kYt3gplx3Dg', titre: 'À Quel Point Le REAL MADRID de ZIDANE Était-Il BON ?', chaine: 'Elite Foot', vues: '654 k', apercu: true },
    { yt: 'U2ksM3blOFE', titre: 'Tommy McMillen : la rockstar invaincue qui débarque à l’UFC', chaine: 'Art et Violence', apercu: true },
    { yt: 'gueRo7C4HlA', titre: 'Le jour où Fatalis est devenu Iron Man', chaine: 'Le Lore', vues: '182 k', apercu: true },
    { yt: 'DtIzz6s7mvU', titre: 'Du prodige au scandale : la vraie histoire de Salvador Dalí', chaine: 'klemo', vues: '258 k', apercu: true },
    { yt: 'EbnobJxHsoU', titre: 'Le génie derrière le meilleur PSG de l’histoire', chaine: 'FMchronik', vues: '296 k', apercu: true },
    { yt: '5yXDjX9CjoU', titre: 'Pourquoi la BBC était scientifiquement IMBATTABLE', chaine: 'FMchronik', vues: '204 k', apercu: true },
    { yt: 'uHnE6ZkSBh4', titre: 'Les Hackers qui en Savaient Trop', chaine: 'Vzion', vues: '665 k', apercu: true },
    { yt: '8T3lJ9z-8gA', titre: 'J’ai filmé le quotidien des humoristes parisiens', chaine: 'klemo', apercu: true },
    { yt: 'hny3jneSdMg', titre: 'Le Dealer du DarkWeb qui a Disparu avec 300 Millions €', chaine: 'Vzion', vues: '274 k', apercu: true },
    { yt: 'kNb02pRGVjA', titre: 'Les hommes qui ont rétréci le monde', chaine: 'ARVA', apercu: true },
    { yt: 'rn6Raqw2b-M', titre: 'L’État qui n’a jamais existé', chaine: 'ARVA', apercu: true },
    { tiktok: '7621598466858323222', mp4: true, compte: 'lemondedugout', titre: 'Notre autre gamme de sandwichs va vous régaler', chaine: 'Le Monde du Goût', vues: '1,7 M' },
    { tiktok: '7658700263158484256', mp4: true, compte: 'sortiesparis', titre: 'Le nouveau resto immersif fusion Japon-Corée', chaine: 'Sorties Paris', vues: '193 k' },
    { tiktok: '7610182661763566870', mp4: true, compte: 'localfoodparis', titre: 'Little Havana, un restaurant cubain immersif à Paris', chaine: 'Local Food Paris', vues: '172 k' },
    { tiktok: '7683145313061801249', mp4: true, compte: 'bestfood93400', titre: 'La box à 5 € qui fait la queue à Saint-Ouen', chaine: 'Best Food 93400', vues: '152 k' },
    { tiktok: '7644868706975223062', mp4: true, compte: 'thesmokedmeat', titre: 'Le « Mama Lova », un burger en édition limitée', chaine: 'The Smoked Meat', vues: '136 k' },
    { tiktok: '7640580305128148256', mp4: true, compte: 'kunafamily', titre: 'Naan cheesy crunchy : la nouvelle édition limitée', chaine: 'KunaFamily', vues: '132 k' },
    { tiktok: '7683567405494308128', mp4: true, compte: 'the_foodologiste', titre: 'Les panuozzo les plus chargés d’Île-de-France à 8,90 €', chaine: 'Foodologiste', vues: '126 k' },
    { tiktok: '7658950856695483680', mp4: true, compte: 'paname_in_my_belly', titre: 'Je comprends enfin pourquoi les Libanais adorent ce sandwich', chaine: 'Paname in my belly', vues: '110 k' },
    { tiktok: '7687523983314390305', mp4: true, compte: 'paname_in_my_belly', titre: 'Le nouveau temple des dim sum et bao à Paris', chaine: 'Paname in my belly', vues: '69 k' },
    { tiktok: '7686905831299878146', mp4: true, compte: 'isma_labrigade', titre: 'Streetalia, le spécialiste du panuozzo italien', chaine: 'ISMA', vues: '38 k' }
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

  /* La dernière case de la grille : le prochain projet. Elle reste
     visible quel que soit le filtre. */
  var prochain = document.createElement('a');
  prochain.className = 'card card--cta';
  prochain.href = '/devis/';
  prochain.dataset.toujours = '1';
  prochain.innerHTML =
    '<span class="card__cta">' +
      '<span class="card__no">' + String(PROJETS.length + 1).padStart(3, '0') + ' / Votre site</span>' +
      '<span class="card__cta-titre">Le prochain,<br>c’est le vôtre.</span>' +
      '<span class="card__desc">Un site de ce niveau pour votre activité, livré en 10 jours. Prix affiché, devis gratuit.</span>' +
      '<span class="card__cta-bouton">Demander un devis →</span>' +
    '</span>';
  grid.appendChild(prochain);

  /* Les chiffres du haut de page, recalculés depuis les listes. */
  (function chiffres() {
    var nS = document.getElementById('n-sites'), nV = document.getElementById('n-videos'), nVues = document.getElementById('n-vues');
    if (nS) nS.textContent = PROJETS.length;
    if (nV) nV.textContent = VIDEOS.length;
    if (nVues) {
      var total = VIDEOS.reduce(function (t, v) {
        var m = String(v.vues || '').replace(',', '.').match(/([\d.]+)\s*([kM])/);
        return t + (m ? parseFloat(m[1]) * (m[2] === 'M' ? 1e6 : 1e3) : 0);
      }, 0);
      nVues.textContent = (total / 1e6).toFixed(1).replace('.', ',');
    }
  })();

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
        card.hidden = !card.dataset.toujours && s !== 'all' && card.dataset.secteur !== s;
      });
    });
  });

  /* ─── Vidéos ───
     Formats longs : une vidéo à la une, puis une grille. Au survol, un
     extrait muet de 8 secondes (videos/yt-<id>.mp4) remplace la vignette ;
     au clic, le lecteur YouTube s'intègre sur le vrai site, ailleurs la
     vidéo s'ouvre sur YouTube.
     Reels & TikTok : un carrousel qu'on fait glisser. Les TikTok sont
     hébergés sur le site (videos/tt-<numéro>.mp4) : ils se lisent partout,
     muets au survol ou quand ils passent au centre sur téléphone, avec le
     son au clic. */
  (function videos() {
    var grille = document.getElementById('grid-videos');
    var vide = document.getElementById('videos-vide');
    var note = document.getElementById('note-video');
    if (!grille || !VIDEOS.length) return;
    vide.hidden = true; note.hidden = false;

    var INTEGRE = /(^|\.)optimusstudio\.fr$|\.netlify\.app$|^localhost$|^127\.0\.0\.1$/.test(location.hostname);
    var souris = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* Si la page bloque quand même le lecteur YouTube, la carte affiche un lien. */
    document.addEventListener('securitypolicyviolation', function (e) {
      if (!/youtube|tiktok/.test(e.blockedURI || '')) return;
      Array.prototype.forEach.call(grille.querySelectorAll('.video__ecran iframe'), function (f) {
        var carte = f.closest('.video');
        f.parentNode.innerHTML = '<a class="video__secours" href="' + carte.querySelector('.video__lien').href +
          '" target="_blank" rel="noopener">Lire la vidéo sur YouTube ↗</a>';
      });
    });

    function echap(t) { return String(t || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function lienDe(v) {
      return v.tiktok
        ? 'https://www.tiktok.com/@' + encodeURIComponent(v.compte) + '/video/' + encodeURIComponent(v.tiktok)
        : 'https://www.youtube.com/watch?v=' + encodeURIComponent(v.yt);
    }
    function corps(v, une) {
      return '<div class="video__corps">' +
        '<p class="video__type">' + (une ? 'À la une · ' : '') + (v.tiktok ? 'TikTok' : 'YouTube') + '</p>' +
        '<h3 class="video__titre">' + echap(v.titre) + '</h3>' +
        (v.chaine ? '<p class="video__client">' + echap(v.chaine) + '</p>' : '') +
        '<a class="video__lien" href="' + lienDe(v) + '" target="_blank" rel="noopener">Voir sur ' + (v.tiktok ? 'TikTok' : 'YouTube') + ' ↗</a>' +
      '</div>';
    }
    function tete(titre, n, nav) {
      var h = document.createElement('div');
      h.className = 'videos-bloc__tete';
      h.innerHTML = '<h2 class="videos-bloc__titre">' + titre + ' <span>' + n + '</span></h2>' +
        (nav ? '<div class="carrousel__nav"><button type="button" class="carrousel__fleche" data-sens="-1" aria-label="Vidéos précédentes">←</button>' +
               '<button type="button" class="carrousel__fleche" data-sens="1" aria-label="Vidéos suivantes">→</button></div>' : '');
      return h;
    }

    var longs = VIDEOS.filter(function (v) { return v.yt; });
    var courts = VIDEOS.filter(function (v) { return v.tiktok; });

    /* ── Formats longs ── */
    if (longs.length) {
      var bl = document.createElement('div');
      bl.className = 'videos-bloc';
      bl.appendChild(tete('Formats longs', longs.length));
      var gl = document.createElement('div');
      gl.className = 'videos';
      bl.appendChild(gl);
      grille.appendChild(bl);

      longs.forEach(function (v, i) {
        var une = i === 0;
        var el = document.createElement('article');
        el.className = 'video' + (une ? ' video--une' : '');
        el.innerHTML =
          '<div class="video__ecran">' +
            '<button class="video__lancer" type="button" aria-label="Lire la vidéo : ' + echap(v.titre) + '">' +
              '<img src="videos/yt-' + v.yt + '.webp" alt="" width="640" height="360" loading="lazy" decoding="async">' +
              (v.vues ? '<span class="video__likes">▶ ' + echap(v.vues) + ' vues</span>' : '') +
              (v.apercu ? '<video class="video__apercu" src="videos/yt-' + v.yt + '.mp4" muted loop playsinline preload="none" aria-hidden="true"></video>' : '') +
              '<span class="video__play" aria-hidden="true"></span>' +
            '</button>' +
          '</div>' + corps(v, une);
        gl.appendChild(el);

        var apercu = el.querySelector('.video__apercu');
        function jouer() { if (apercu && !reduit) { apercu.play().then(function () { el.classList.add('is-apercu'); }, function () {}); } }
        function stop() { if (apercu) { apercu.pause(); el.classList.remove('is-apercu'); } }
        if (apercu && souris) {
          el.querySelector('.video__ecran').addEventListener('mouseenter', jouer);
          el.querySelector('.video__ecran').addEventListener('mouseleave', stop);
        }
        /* À la souris, la vidéo à la une joue son extrait dès qu'elle est à l'écran.
           Au doigt, c'est la vidéo qui passe au milieu de l'écran qui joue. */
        if (apercu && 'IntersectionObserver' in window) {
          if (souris && une) {
            new IntersectionObserver(function (e) { if (e[0].isIntersecting) jouer(); else stop(); }, { threshold: 0.5 }).observe(el);
          } else if (!souris) {
            new IntersectionObserver(function (e) { if (e[0].isIntersecting) jouer(); else stop(); }, { rootMargin: '-38% 0px -38% 0px' }).observe(el.querySelector('.video__ecran'));
          }
        }

        el.querySelector('.video__lancer').addEventListener('click', function () {
          if (!INTEGRE) { window.open(lienDe(v), '_blank', 'noopener'); return; }
          var f = document.createElement('iframe');
          f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(v.yt) + '?autoplay=1&rel=0&modestbranding=1';
          f.title = v.titre;
          f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen';
          f.allowFullscreen = true;
          f.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
          var ecran = el.querySelector('.video__ecran');
          ecran.innerHTML = '';
          ecran.appendChild(f);
          f.focus();
        });
      });
    }

    /* ── Reels & TikTok : le carrousel ── */
    if (courts.length) {
      var bc = document.createElement('div');
      bc.className = 'videos-bloc';
      bc.appendChild(tete('Reels &amp; TikTok', courts.length, true));
      var piste = document.createElement('div');
      piste.className = 'carrousel';
      piste.tabIndex = 0;
      piste.setAttribute('role', 'region');
      piste.setAttribute('aria-label', 'Reels et TikTok : faites glisser pour voir la suite');
      bc.appendChild(piste);
      grille.appendChild(bc);

      /* Chaque carte : la vignette, et par-dessus un extrait muet de six
         secondes qui tourne en boucle (au survol sur ordinateur, quand la
         carte passe au centre sur téléphone). Le clic ouvre la vraie vidéo,
         avec le son : lecteur TikTok intégré sur le site, TikTok ailleurs. */
      var clips = [];
      courts.forEach(function (v) {
        var el = document.createElement('article');
        el.className = 'video video--short';
        el.innerHTML =
          '<div class="video__ecran">' +
            '<button class="video__lancer" type="button" aria-label="Lire la vidéo : ' + echap(v.titre) + '">' +
              '<img src="videos/tt-' + v.tiktok + '.webp" alt="" width="360" height="640" loading="lazy" decoding="async">' +
              (v.mp4 ? '<video class="video__apercu" src="videos/tt-' + v.tiktok + '.mp4" muted loop playsinline preload="none" aria-hidden="true"></video>' : '') +
              '<span class="video__play" aria-hidden="true"></span>' +
            '</button>' +
            (v.vues ? '<span class="video__likes">▶ ' + echap(v.vues) + ' vues</span>' : v.likes ? '<span class="video__likes">♥ ' + echap(v.likes) + '</span>' : '') +
          '</div>' + corps(v, false);
        piste.appendChild(el);

        var clip = el.querySelector('.video__apercu');
        if (clip) {
          clips.push(clip);
          clip._jouer = function () { if (!reduit) clip.play().then(function () { el.classList.add('is-apercu'); }, function () {}); };
          clip._stop = function () { clip.pause(); el.classList.remove('is-apercu'); };
          if (souris) {
            el.querySelector('.video__ecran').addEventListener('mouseenter', clip._jouer);
            el.querySelector('.video__ecran').addEventListener('mouseleave', clip._stop);
          }
        }

        el.querySelector('.video__lancer').addEventListener('click', function () {
          if (piste.dataset.glisse === '1') return;
          if (!INTEGRE) { window.open(lienDe(v), '_blank', 'noopener'); return; }
          var f = document.createElement('iframe');
          f.src = 'https://www.tiktok.com/player/v1/' + encodeURIComponent(v.tiktok) + '?autoplay=1&rel=0&description=0&music_info=0';
          f.title = v.titre;
          f.allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
          f.allowFullscreen = true;
          var ecran = el.querySelector('.video__ecran');
          ecran.innerHTML = '';
          ecran.appendChild(f);
          f.focus();
        });
      });

      /* Sur téléphone, l'extrait de la carte bien centrée se lance. */
      if (!souris && !reduit && 'IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.intersectionRatio >= 0.8) e.target._jouer(); else e.target._stop();
          });
        }, { root: piste, threshold: [0, 0.8] });
        clips.forEach(function (c) { io.observe(c); });
      }

      /* Flèches : on avance d'environ deux cartes. */
      Array.prototype.forEach.call(bc.querySelectorAll('.carrousel__fleche'), function (b) {
        b.addEventListener('click', function () {
          var pas = piste.firstElementChild.getBoundingClientRect().width * 2;
          piste.scrollBy({ left: pas * +b.dataset.sens, behavior: reduit ? 'auto' : 'smooth' });
        });
      });
      function flechesAJour() {
        var fl = bc.querySelectorAll('.carrousel__fleche');
        fl[0].disabled = piste.scrollLeft < 4;
        fl[1].disabled = piste.scrollLeft + piste.clientWidth > piste.scrollWidth - 4;
      }
      piste.addEventListener('scroll', function () { requestAnimationFrame(flechesAJour); }, { passive: true });
      flechesAJour();

      /* À la souris, on attrape le carrousel et on le fait glisser. */
      if (souris) {
        var x0 = 0, s0 = 0, tenu = false;
        piste.addEventListener('pointerdown', function (e) {
          if (e.pointerType !== 'mouse' || e.button !== 0) return;
          tenu = true; x0 = e.clientX; s0 = piste.scrollLeft; piste.dataset.glisse = '0';
        });
        window.addEventListener('pointermove', function (e) {
          if (!tenu) return;
          var dx = e.clientX - x0;
          if (Math.abs(dx) > 6 && piste.dataset.glisse !== '1') { piste.dataset.glisse = '1'; piste.classList.add('is-glisse'); }
          if (piste.dataset.glisse === '1') piste.scrollLeft = s0 - dx;
        });
        window.addEventListener('pointerup', function () {
          if (!tenu) return;
          tenu = false; piste.classList.remove('is-glisse');
          setTimeout(function () { piste.dataset.glisse = '0'; }, 0);
        });
      }
    }
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
