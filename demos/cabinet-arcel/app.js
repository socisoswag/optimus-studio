/* =========================================================
   Cabinet Arcel - démo Optimus Studio
   Prochain créneau libre, corps cliquable (une zone → une fiche
   de prise en charge), formulaire prérempli depuis la fiche.
   Aucune dépendance.
   ========================================================= */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* ─── En-tête ─── */
  var top = document.querySelector('.top');
  if (top && hasIO) {
    var s = document.createElement('div');
    s.setAttribute('aria-hidden', 'true');
    s.style.cssText = 'position:absolute;top:120px;height:1px;width:1px;';
    document.body.prepend(s);
    new IntersectionObserver(function (e) { top.classList.toggle('is-stuck', !e[0].isIntersecting); }).observe(s);
  }

  /* ─── Révélations ─── */
  var reveals = document.querySelectorAll('.reveal');
  if (reduced || !hasIO) {
    Array.prototype.forEach.call(reveals, function (el) { el.classList.add('is-in'); });
  } else {
    var ioR = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); ioR.unobserve(e.target); } });
    }, { threshold: 0.2 });
    Array.prototype.forEach.call(reveals, function (el) { ioR.observe(el); });
  }

  /* ─── Prochain créneau (démo : calculé, pas lu dans un agenda) ─── */
  (function creneau() {
    var txt = document.getElementById('creneau-txt');
    if (!txt) return;
    var JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    var d = new Date(), j = d.getDay(), h = d.getHours();
    if (j >= 1 && j <= 5 && h < 16) { txt.textContent = 'Prochain créneau libre : aujourd’hui à 17h15'; return; }
    for (var k = 1; k < 8; k++) {
      var jj = (j + k) % 7;
      if (jj === 0) continue;
      txt.textContent = 'Prochain créneau libre : ' + (k === 1 ? 'demain' : JOURS[jj]) + ' à ' + (jj === 6 ? '10h' : '9h30');
      return;
    }
  })();

  /* ─── Corps cliquable ─── */
  var OSTEO = 'Julien Arcel, ostéopathe';
  var KINE = 'Thomas Morel, kinésithérapeute';
  var ZONES = {
    machoire: { nom: 'Mâchoire', titre: 'Mâchoire qui craque, dents serrées la nuit',
      soin: 'Travail de l’articulation de la mâchoire, de la nuque et du crâne. En lien avec votre dentiste si une gouttière est envisagée.',
      qui: OSTEO, seances: '2 à 3 séances, espacées de trois semaines.', photo: 'img/nuque.webp', pro: 0 },
    nuque: { nom: 'Nuque', titre: 'Torticolis, raideur, maux de tête qui partent du cou',
      soin: 'Mobilisations douces des cervicales, relâchement des muscles du cou et des épaules, conseils pour votre poste de travail.',
      qui: OSTEO, seances: '1 à 3 séances.', photo: 'img/nuque.webp', pro: 0 },
    epaule: { nom: 'Épaule', titre: 'Épaule douloureuse, bras qui ne monte plus',
      soin: 'Bilan des amplitudes, thérapie manuelle, puis renforcement progressif des muscles qui stabilisent l’épaule.',
      qui: KINE + ', sur prescription. Julien peut vous voir en premier.', seances: '6 à 12 séances de kiné.', photo: 'img/dos.webp', pro: 1 },
    dos: { nom: 'Haut du dos', titre: 'Dos bloqué, douleur entre les omoplates',
      soin: 'Travail des vertèbres dorsales et des côtes, respiration, posture. On regarde aussi comment vous êtes assis huit heures par jour.',
      qui: OSTEO, seances: '1 à 2 séances.', photo: 'img/dos.webp', pro: 0 },
    lombaires: { nom: 'Lombaires', titre: 'Lumbago, douleur en bas du dos',
      soin: 'On soulage, puis on vous apprend à bouger sans crainte : le repos complet retarde la guérison. Si la douleur descend sous le genou avec des fourmillements, voyez d’abord votre médecin.',
      qui: OSTEO + ', puis ' + KINE + ' si besoin.', seances: '2 à 4 séances.', photo: 'img/dos.webp', pro: 0 },
    poignet: { nom: 'Poignet', titre: 'Tendinite du poignet, fourmillements dans les doigts',
      soin: 'Bilan, mobilisation, attelle de repos si nécessaire, exercices à faire chez vous entre les séances.',
      qui: KINE, seances: '4 à 8 séances.', photo: null, pro: 1 },
    hanche: { nom: 'Hanche', titre: 'Douleur à l’aine ou sur le côté de la hanche',
      soin: 'Analyse de la marche et de la foulée, renforcement des fessiers, travail de mobilité.',
      qui: KINE, seances: '6 à 10 séances.', photo: 'img/genou.webp', pro: 1 },
    genou: { nom: 'Genou', titre: 'Entorse, ligaments, douleur du coureur',
      soin: 'Bilan de force, renforcement du quadriceps et des hanches, reprise de la course par paliers. Rééducation après opération des ligaments croisés.',
      qui: KINE, seances: '10 à 30 séances selon la blessure.', photo: 'img/genou.webp', pro: 1 },
    cheville: { nom: 'Cheville', titre: 'Entorse de cheville, pied qui se dérobe',
      soin: 'Proprioception, renforcement, retour progressif sur terrain instable. Une entorse mal rééduquée a tendance à récidiver.',
      qui: KINE, seances: '6 à 10 séances.', photo: null, pro: 1 }
  };

  var points = Array.prototype.slice.call(document.querySelectorAll('.point'));
  var fiche = document.getElementById('fiche');
  var courante = null;

  points.forEach(function (p) {
    if (parseFloat(p.style.left) < 40) p.classList.add('is-gauche');
    p.setAttribute('aria-controls', 'fiche');
    p.setAttribute('aria-label', ZONES[p.dataset.zone].nom);
  });

  function montrer(id, anime) {
    var z = ZONES[id];
    if (!z) return;
    courante = z;
    points.forEach(function (p) { p.setAttribute('aria-pressed', p.dataset.zone === id ? 'true' : 'false'); });
    document.getElementById('fiche-zone').textContent = z.nom;
    document.getElementById('fiche-titre').textContent = z.titre;
    document.getElementById('fiche-soin').textContent = z.soin;
    document.getElementById('fiche-qui').textContent = z.qui;
    document.getElementById('fiche-seances').textContent = z.seances;
    var cadre = document.getElementById('fiche-photo');
    cadre.hidden = !z.photo;
    if (z.photo) document.getElementById('fiche-img').src = z.photo;
    if (anime && !reduced) {
      fiche.classList.remove('is-change');
      void fiche.offsetWidth;
      fiche.classList.add('is-change');
    }
  }
  points.forEach(function (p) {
    p.addEventListener('click', function () { montrer(p.dataset.zone, true); });
  });
  montrer('nuque', false);

  document.getElementById('fiche-cta').addEventListener('click', function () {
    if (!courante) return;
    var motif = document.getElementById('motif');
    if (!motif.value.trim()) motif.value = courante.nom + ' : ' + courante.titre.charAt(0).toLowerCase() + courante.titre.slice(1) + '.';
    document.getElementById('praticien').selectedIndex = courante.pro;
    setTimeout(function () { document.getElementById('nom').focus({ preventScroll: true }); }, reduced ? 0 : 500);
  });

  /* ─── Formulaire ─── */
  var form = document.getElementById('form-rdv');
  if (!form) return;
  var statut = document.getElementById('status');
  var bouton = document.getElementById('submit');
  function valider(c) {
    var v = c.value.trim();
    var ok = v !== '';
    if (ok && c.id === 'tel') ok = v.replace(/[^0-9]/g, '').length >= 10;
    var m = form.querySelector('[data-err-for="' + c.id + '"]');
    if (m) m.hidden = ok;
    c.setAttribute('aria-invalid', ok ? 'false' : 'true');
    return ok;
  }
  var requis = ['nom', 'tel'].map(function (id) { return document.getElementById(id); });
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
      statut.textContent = 'C’est noté. Le secrétariat vous rappelle aujourd’hui pour vous proposer un créneau.';
    }, 700);
  });
})();
