/* =========================================================
   Maison Solène - démo Optimus Studio
   Carte des soins en onglets (chaque soin s'ouvre au survol ou au
   clic) et réservation en quatre étapes : soin, jour, heure,
   coordonnées. La carte et la réservation lisent la même liste SOINS.
   IntersectionObserver pour l'en-tête et les apparitions, jamais
   d'écouteur scroll. Aucune dépendance.
   ========================================================= */

(function () {
  'use strict';

  var SOINS = [
    { id: 'eclat',     cat: 'visage',  nom: 'Soin éclat',                 duree: 45,  prix: 65,
      desc: 'Nettoyage, gommage enzymatique, masque à l’argile verte et massage du visage. Pour une peau terne ou fatiguée.' },
    { id: 'hydra',     cat: 'visage',  nom: 'Hydratation profonde',       duree: 60,  prix: 85,
      desc: 'Sérum à l’acide hyaluronique, modelage liftant, masque crème. Pour les peaux qui tiraillent en hiver.' },
    { id: 'signature', cat: 'visage',  nom: 'Le soin Solène',             duree: 90,  prix: 120,
      desc: 'Notre soin le plus long : diagnostic, double nettoyage, massage kobido, masque et massage du cuir chevelu.' },
    { id: 'relax',     cat: 'corps',   nom: 'Massage relaxant',           duree: 60,  prix: 80,
      desc: 'Huile d’amande douce tiédie, pressions lentes et enveloppantes, du dos jusqu’aux pieds.' },
    { id: 'pierres',   cat: 'corps',   nom: 'Massage aux pierres chaudes', duree: 75, prix: 100,
      desc: 'Des basaltes chauffés posés le long du dos, puis le massage : la chaleur fait la moitié du travail.' },
    { id: 'gommage',   cat: 'corps',   nom: 'Gommage au sel rose',        duree: 45,  prix: 60,
      desc: 'Sel rose et huile d’amande, puis enveloppement au beurre de karité. La peau reste douce une semaine.' },
    { id: 'rituel',    cat: 'rituels', nom: 'Rituel Solène',              duree: 120, prix: 170,
      desc: 'Gommage au sel rose, massage aux pierres chaudes, soin éclat du visage. Un thé vous attend à la sortie.' },
    { id: 'duo',       cat: 'rituels', nom: 'Rituel à deux',              duree: 90,  prix: 190, aDeux: true,
      desc: 'Deux tables côte à côte : massage relaxant puis soin du visage, pour deux personnes.' },
    { id: 'maman',     cat: 'rituels', nom: 'Rituel future maman',        duree: 75,  prix: 95,
      desc: 'À partir du quatrième mois : massage allongée sur le côté, huiles neutres, jambes légères.' }
  ];
  var CATS = { visage: 'Visage', corps: 'Corps', rituels: 'Rituels' };

  /* Ouvert du mardi au samedi, jusqu'à 20 h 30 le jeudi. */
  var FERMETURE = { 2: 19, 3: 19, 4: 20.5, 5: 19, 6: 19 };
  var DEPARTS   = [10, 11.5, 14, 15.5, 17, 18.5];
  var NB_JOURS  = 8;

  var reduced  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var survol   = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasIO    = 'IntersectionObserver' in window;

  function duree(min) {
    if (min < 60) return min + ' min';
    var h = Math.floor(min / 60), m = min % 60;
    return h + ' h' + (m ? ' ' + String(m).padStart(2, '0') : '');
  }
  function prix(s) { return s.prix + ' €' + (s.aDeux ? ' à deux' : ''); }
  function heure(h) {
    var hh = Math.floor(h), mm = Math.round((h - hh) * 60);
    return hh + ' h' + (mm ? ' ' + String(mm).padStart(2, '0') : '');
  }
  function trouver(id) { return SOINS.filter(function (s) { return s.id === id; })[0]; }

  /* ─── En-tête ─── */
  var top = document.querySelector('.top');
  if (top && hasIO) {
    var sentinelle = document.createElement('div');
    sentinelle.setAttribute('aria-hidden', 'true');
    sentinelle.style.cssText = 'position:absolute;top:60px;height:1px;width:1px;';
    document.body.prepend(sentinelle);
    new IntersectionObserver(function (e) { top.classList.toggle('is-stuck', !e[0].isIntersecting); }).observe(sentinelle);
  }

  /* ─── Apparitions ─── */
  var reveals = document.querySelectorAll('.reveal');
  if (reduced || !hasIO) {
    Array.prototype.forEach.call(reveals, function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.25 });
    Array.prototype.forEach.call(reveals, function (el) { io.observe(el); });
  }

  /* ─── La carte ─── */
  Object.keys(CATS).forEach(function (cat) {
    var panneau = document.getElementById('cat-' + cat);
    if (!panneau) return;
    SOINS.filter(function (s) { return s.cat === cat; }).forEach(function (s) {
      var el = document.createElement('div');
      el.className = 'soin';
      el.innerHTML =
        '<button class="soin__tete" type="button" aria-expanded="false" aria-controls="desc-' + s.id + '">' +
          '<span class="soin__nom">' + s.nom + '</span>' +
          '<span class="soin__duree">' + duree(s.duree) + '</span>' +
          '<span class="soin__prix">' + prix(s) + '</span>' +
        '</button>' +
        '<div class="soin__desc" id="desc-' + s.id + '"><div>' +
          '<p>' + s.desc + '</p>' +
          '<button class="lien" type="button" data-reserver="' + s.id + '">Réserver ce soin</button>' +
        '</div></div>';
      panneau.appendChild(el);
    });
  });

  function ouvrir(soin, oui) {
    soin.classList.toggle('is-open', oui);
    soin.querySelector('.soin__tete').setAttribute('aria-expanded', oui ? 'true' : 'false');
  }
  function fermerAutres(soin) {
    Array.prototype.forEach.call(soin.parentNode.children, function (s) { if (s !== soin) ouvrir(s, false); });
  }

  document.querySelectorAll('.soins').forEach(function (liste) {
    liste.addEventListener('click', function (e) {
      var tete = e.target.closest('.soin__tete');
      if (tete) {
        var soin = tete.parentNode;
        var oui = !soin.classList.contains('is-open');
        fermerAutres(soin);
        ouvrir(soin, oui);
        return;
      }
      var b = e.target.closest('[data-reserver]');
      if (b) choisirSoin(b.dataset.reserver, true);
    });
    /* Au survol, sur un écran avec souris : la ligne s'ouvre d'elle-même. */
    if (survol) {
      liste.addEventListener('mouseover', function (e) {
        var soin = e.target.closest('.soin');
        if (!soin || soin.classList.contains('is-open')) return;
        fermerAutres(soin);
        ouvrir(soin, true);
      });
    }
  });

  /* Onglets : clic, et flèches gauche / droite comme le veut le motif ARIA. */
  var onglets = Array.prototype.slice.call(document.querySelectorAll('.onglet'));
  function activer(tab, focus) {
    onglets.forEach(function (t) {
      var on = t === tab;
      t.classList.toggle('is-on', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  }
  onglets.forEach(function (t, i) {
    t.addEventListener('click', function () { activer(t); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      activer(onglets[(i + d + onglets.length) % onglets.length], true);
    });
  });

  /* Première ligne ouverte d'office : on voit tout de suite que la carte se déplie. */
  var premier = document.querySelector('#cat-visage .soin');
  if (premier) ouvrir(premier, true);

  /* ─── Réservation ─── */
  var form    = document.getElementById('form-rdv');
  var select  = document.getElementById('rdv-soin');
  var boxJour = document.getElementById('jours');
  var boxH    = document.getElementById('heures');
  var rSoin   = document.getElementById('recap-soin');
  var rQuand  = document.getElementById('recap-quand');
  var rPrix   = document.getElementById('recap-prix');
  var statut  = document.getElementById('status');
  var bouton  = document.getElementById('submit');
  if (!form) return;

  var choix = { soin: SOINS[0].id, jour: null, heure: null };

  Object.keys(CATS).forEach(function (cat) {
    var g = document.createElement('optgroup');
    g.label = CATS[cat];
    SOINS.filter(function (s) { return s.cat === cat; }).forEach(function (s) {
      var o = document.createElement('option');
      o.value = s.id;
      o.textContent = s.nom + ' · ' + duree(s.duree) + ' · ' + prix(s);
      g.appendChild(o);
    });
    select.appendChild(g);
  });

  /* Les jours ouverts à venir, à partir de demain. */
  var fJourCourt = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' });
  var fJourLong  = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  var jours = [];
  var d = new Date(); d.setHours(12, 0, 0, 0);
  while (jours.length < NB_JOURS) {
    d.setDate(d.getDate() + 1);
    if (FERMETURE[d.getDay()]) jours.push(new Date(d));
  }

  /* Créneaux déjà pris : tirés d'un hachage de la date, pour que la
     démo reste identique d'un chargement à l'autre. */
  function pris(date, h) {
    var cle = date.toISOString().slice(0, 10) + h;
    var x = 0;
    for (var i = 0; i < cle.length; i++) x = (x * 31 + cle.charCodeAt(i)) % 9973;
    return x % 10 < 3;
  }

  function puce(texteHaut, texteBas, label) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'puce';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', 'false');
    b.setAttribute('aria-label', label);
    b.innerHTML = (texteHaut ? '<span class="puce__j">' + texteHaut + '</span>' : '') + '<span class="puce__d">' + texteBas + '</span>';
    return b;
  }

  jours.forEach(function (date, i) {
    var b = puce(fJourCourt.format(date).replace('.', ''), String(date.getDate()), fJourLong.format(date));
    b.dataset.i = i;
    b.tabIndex = i === 0 ? 0 : -1;
    boxJour.appendChild(b);
  });

  function cocher(groupe, bouton) {
    Array.prototype.forEach.call(groupe.querySelectorAll('.puce'), function (p) {
      var on = p === bouton;
      p.setAttribute('aria-checked', on ? 'true' : 'false');
      p.tabIndex = on ? 0 : -1;
    });
  }

  function heuresDuJour() {
    boxH.innerHTML = '';
    if (choix.jour === null) {
      boxH.innerHTML = '<p class="heures__vide">Choisissez d’abord un jour.</p>';
      return;
    }
    var date = jours[choix.jour];
    var s = trouver(choix.soin);
    var ferme = FERMETURE[date.getDay()];
    var dispo = 0;
    DEPARTS.forEach(function (h) {
      if (h + s.duree / 60 > ferme) return;
      var b = puce('', heure(h), heure(h) + (pris(date, h) ? ', complet' : ''));
      b.dataset.h = h;
      if (pris(date, h)) b.disabled = true; else dispo++;
      boxH.appendChild(b);
    });
    if (!dispo) boxH.innerHTML = '<p class="heures__vide">Complet ce jour-là pour ce soin.</p>';
    var actifs = boxH.querySelectorAll('.puce:not(:disabled)');
    if (actifs.length) actifs[0].tabIndex = 0;
    Array.prototype.forEach.call(boxH.querySelectorAll('.puce'), function (p) { if (p !== actifs[0]) p.tabIndex = -1; });
  }

  function recap() {
    var s = trouver(choix.soin);
    rSoin.textContent = s.nom;
    rPrix.textContent = duree(s.duree) + ' · ' + prix(s);
    if (choix.jour !== null && choix.heure !== null) {
      rQuand.textContent = fJourLong.format(jours[choix.jour]).replace(/^./, function (c) { return c.toUpperCase(); }) + ', ' + heure(choix.heure);
    } else if (choix.jour !== null) {
      rQuand.textContent = fJourLong.format(jours[choix.jour]).replace(/^./, function (c) { return c.toUpperCase(); }) + ' : choisissez l’heure.';
    } else {
      rQuand.textContent = 'Choisissez un jour et une heure.';
    }
  }

  function choisirSoin(id, defiler) {
    choix.soin = id;
    select.value = id;
    choix.heure = null;
    heuresDuJour();
    recap();
    if (defiler) {
      document.getElementById('rendez-vous').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
      setTimeout(function () { select.focus({ preventScroll: true }); }, reduced ? 0 : 700);
    }
  }

  select.addEventListener('change', function () { choisirSoin(select.value, false); });

  boxJour.addEventListener('click', function (e) {
    var b = e.target.closest('.puce');
    if (!b) return;
    cocher(boxJour, b);
    choix.jour = parseInt(b.dataset.i, 10);
    choix.heure = null;
    heuresDuJour();
    recap();
  });

  boxH.addEventListener('click', function (e) {
    var b = e.target.closest('.puce');
    if (!b || b.disabled) return;
    cocher(boxH, b);
    choix.heure = parseFloat(b.dataset.h);
    recap();
  });

  /* Flèches dans les groupes de puces (motif radiogroup). */
  [boxJour, boxH].forEach(function (groupe) {
    groupe.addEventListener('keydown', function (e) {
      var d = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 0;
      if (!d) return;
      var puces = Array.prototype.slice.call(groupe.querySelectorAll('.puce:not(:disabled)'));
      var i = puces.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      var suivant = puces[(i + d + puces.length) % puces.length];
      suivant.focus();
      suivant.click();
    });
  });

  heuresDuJour();
  recap();

  /* ─── Validation et confirmation ─── */
  function valider(champ) {
    var v = champ.value.trim();
    var ok = v !== '';
    if (ok && champ.id === 'tel') ok = v.replace(/[^0-9]/g, '').length >= 10;
    var msg = form.querySelector('[data-err-for="' + champ.id + '"]');
    if (msg) msg.hidden = ok;
    champ.setAttribute('aria-invalid', ok ? 'false' : 'true');
    return ok;
  }
  var requis = ['nom', 'tel'].map(function (id) { return document.getElementById(id); });
  requis.forEach(function (c) {
    c.addEventListener('blur', function () { valider(c); });
    c.addEventListener('input', function () { if (c.getAttribute('aria-invalid') === 'true') valider(c); });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (choix.jour === null || choix.heure === null) {
      statut.textContent = 'Choisissez un jour et une heure.';
      (boxJour.querySelector('[tabindex="0"]') || boxJour.querySelector('.puce')).focus();
      return;
    }
    if (!requis.map(valider).every(Boolean)) {
      statut.textContent = 'Il manque vos coordonnées.';
      requis.filter(function (c) { return c.getAttribute('aria-invalid') === 'true'; })[0].focus();
      return;
    }
    // DÉMO : aucun envoi réel. En production, brancher l'agenda de l'institut.
    bouton.disabled = true;
    statut.textContent = 'Envoi en cours...';
    window.setTimeout(function () {
      var prenom = document.getElementById('nom').value.trim().split(/\s+/)[0];
      Array.prototype.forEach.call(form.querySelectorAll('.etape'), function (el) { el.hidden = true; });
      form.classList.add('is-done');
      bouton.hidden = true;
      statut.textContent = 'C’est noté, ' + prenom + '. Vous recevrez la confirmation par SMS dans l’heure.';
    }, 800);
  });
})();
