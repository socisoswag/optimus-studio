/* =========================================================
   Plomberie Vasseur - démo Optimus Studio
   Diagnostic de fuite en trois questions, révélations au scroll
   (IntersectionObserver, jamais d'écouteur scroll) et validation
   du formulaire de devis. Aucune dépendance.
   ========================================================= */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─── Révélations ─── */
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

  initDiagnostic();
  initFormulaire();
  initCompteur();

  /* ─── Compteur de fuite ───
     1 goutte par seconde ≈ 0,05 ml. Il apparaît une fois le titre
     lu (hors du hero) et disparaît au formulaire, pour ne rien cacher. */
  function initCompteur() {
    var el = document.getElementById('compteur');
    if (!el) return;
    var nG = document.getElementById('c-gouttes');
    var nV = document.getElementById('c-volume');
    var debut = Date.now();
    function maj() {
      var g = Math.floor((Date.now() - debut) / 1000);
      var ml = g * 0.05;
      nG.textContent = g.toLocaleString('fr-FR');
      nV.textContent = ml < 10 ? ml.toFixed(1).replace('.', ',') + ' ml'
        : ml < 1000 ? (ml / 10).toFixed(1).replace('.', ',') + ' cl'
        : (ml / 1000).toFixed(2).replace('.', ',') + ' l';
    }
    maj();
    setInterval(function () { if (!document.hidden) maj(); }, 1000);

    if (!('IntersectionObserver' in window)) { el.classList.add('is-visible'); return; }
    var dansHero = true, dansDevis = false;
    function afficher() { el.classList.toggle('is-visible', !dansHero && !dansDevis); }
    new IntersectionObserver(function (e) { dansHero = e[0].isIntersecting; afficher(); }, { threshold: 0.35 })
      .observe(document.querySelector('.hero'));
    var devis = document.getElementById('devis');
    if (devis) new IntersectionObserver(function (e) { dansDevis = e[0].isIntersecting; afficher(); }).observe(devis);
  }

  /* ─── Diagnostic ─── */
  function initDiagnostic() {
    var form = document.getElementById('diag');
    if (!form) return;

    var etapes = Array.prototype.slice.call(form.querySelectorAll('.q'));
    var puces  = Array.prototype.slice.call(document.querySelectorAll('.diag__steps li'));
    var rep = {};

    var TITRES = {
      evier:     { coule: 'Fuite active sous l’évier', goutte: 'Un raccord ou un siphon qui goutte', tache: 'Une fuite lente, sans doute un raccord' },
      wc:        { coule: 'Fuite active autour des WC', goutte: 'Joint ou alimentation des WC', tache: 'Une fuite lente au pied des WC' },
      plafond:   { coule: 'Dégât des eaux en cours', goutte: 'Infiltration active', tache: 'Une infiltration à localiser' },
      chauffage: { coule: 'Fuite sur la chaudière ou le ballon', goutte: 'Soupape ou raccord qui goutte', tache: 'Une trace sous la chaudière ou le ballon' }
    };

    function montrer(i) {
      etapes.forEach(function (q, k) { q.classList.toggle('is-on', k === i); });
      puces.forEach(function (p, k) {
        p.classList.toggle('is-on', k === i);
        p.classList.toggle('is-done', k < i);
      });
      var cible = etapes[i].querySelector('button, h3');
      if (cible && i > 0) {
        if (cible.tagName === 'H3') cible.setAttribute('tabindex', '-1');
        cible.focus({ preventScroll: true });
      }
    }

    function resultat() {
      var lieu = rep.lieu, debit = rep.debit, vanne = rep.vanne;
      var urgent = debit === 'coule' || (lieu === 'plafond' && debit === 'goutte');
      var gestes = [];

      var couper = vanne === 'oui'
        ? '<strong>Coupez l’eau</strong> au robinet d’arrêt général.'
        : '<strong>Coupez l’eau au robinet d’arrêt général.</strong> Il est le plus souvent près du compteur, sous l’évier de la cuisine ou dans la gaine technique du palier. Tournez dans le sens des aiguilles d’une montre.';

      if (urgent) {
        gestes.push(couper);
        if (lieu === 'chauffage') gestes.push('<strong>Coupez aussi la chaudière ou le ballon</strong>, à l’interrupteur ou au disjoncteur dédié.');
        else if (lieu === 'plafond') gestes.push('<strong>Si l’eau approche d’une prise ou d’un plafonnier</strong>, coupez le disjoncteur de la pièce.');
        else gestes.push('<strong>Épongez</strong> et placez un récipient sous la fuite.');
        gestes.push(lieu === 'plafond'
          ? '<strong>Prévenez le voisin du dessus ou le syndic</strong> : la fuite vient souvent de chez eux.'
          : '<strong>Prenez deux ou trois photos</strong> : votre assurance les demandera.');
        gestes.push('<strong>Appelez</strong> : on vient le jour même.');
      } else if (debit === 'goutte') {
        gestes.push('<strong>Placez un récipient</strong> et fermez la petite vanne de l’appareil, sous l’évier ou derrière les WC.');
        gestes.push(lieu === 'chauffage'
          ? '<strong>Notez la pression</strong> affichée sur le manomètre de la chaudière : entre 1 et 2 bar, c’est normal.'
          : '<strong>Resserrez à la main</strong> l’écrou du siphon ou du flexible, sans outil. Ça suffit parfois.');
        gestes.push('<strong>Si ça continue</strong>, on passe sous 24 heures.');
      } else {
        gestes.push('<strong>Entourez la tache au crayon</strong> et notez la date : si elle s’étend, la fuite est active.');
        gestes.push('<strong>Relevez le compteur d’eau le soir</strong>, n’utilisez rien la nuit, relevez-le le matin. S’il a tourné, il y a une fuite.');
        gestes.push(lieu === 'plafond'
          ? '<strong>Prévenez le voisin du dessus ou le syndic.</strong>'
          : '<strong>Une recherche de fuite sans casse</strong> la localise avant d’ouvrir quoi que ce soit.');
      }

      var niveau = document.getElementById('res-niveau');
      niveau.textContent = urgent ? 'Urgent · aujourd’hui' : (debit === 'goutte' ? 'Sous 24 heures' : 'Sur rendez-vous');
      niveau.classList.toggle('is-urgent', urgent);
      document.getElementById('res-titre').textContent = TITRES[lieu][debit];
      document.getElementById('res-gestes').innerHTML = gestes.map(function (g) { return '<li><span>' + g + '</span></li>'; }).join('');
      document.getElementById('res-prix').textContent = urgent
        ? 'Urgence : le prix est annoncé au téléphone, avant le départ.'
        : (debit === 'goutte'
            ? 'Réparation de raccord ou de joint : dès 85 €, fourniture comprise.'
            : 'Recherche de fuite sans casse : dès 90 €, rapport pour l’assurance compris.');
    }

    form.addEventListener('click', function (e) {
      var b = e.target.closest('.q__opts button');
      if (!b) return;
      var q = b.closest('.q');
      rep[q.dataset.q] = b.dataset.v;
      var i = etapes.indexOf(q);
      if (i === etapes.length - 2) resultat();
      montrer(i + 1);
    });

    document.getElementById('diag-reset').addEventListener('click', function () {
      rep = {};
      montrer(0);
      etapes[0].querySelector('button').focus({ preventScroll: true });
    });
  }

  /* ─── Formulaire de devis ─── */
  function initFormulaire() {
    var form = document.getElementById('form-devis');
    if (!form) return;
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

    var requis = ['nom', 'tel', 'ville'].map(function (id) { return document.getElementById(id); });
    requis.forEach(function (c) {
      c.addEventListener('blur', function () { valider(c); });
      c.addEventListener('input', function () {
        if (c.getAttribute('aria-invalid') === 'true') valider(c);
      });
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
      window.setTimeout(function () {
        form.hidden = true;
        statut.hidden = false;
        form.insertAdjacentElement('afterend', statut);
        statut.textContent = 'Demande reçue. Je vous rappelle dans les heures ouvrées.';
      }, 700);
    });
  }
})();
