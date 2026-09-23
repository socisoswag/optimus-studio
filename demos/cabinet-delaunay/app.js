/* =========================================================
   Cabinet Delaunay - démo Optimus Studio
   « Votre situation » : un domaine, une situation, et la fiche affiche
   le délai légal à connaître, la première étape, les pièces à apporter
   et le texte applicable. La fiche alimente ensuite le formulaire.

   Les délais sont ceux du droit français en vigueur (textes cités dans
   chaque fiche). Ils restent des repères généraux : la page le dit.
   IntersectionObserver pour les apparitions, aucune dépendance.
   ========================================================= */

(function () {
  'use strict';

  var DOMAINES = { famille: 'Famille', travail: 'Travail', immo: 'Immobilier' };

  var SITUATIONS = [
    { id: 'divorce', dom: 'famille', titre: 'Divorcer à l’amiable', chiffre: '15 jours',
      delai: 'de réflexion obligatoires entre la réception du projet de convention et sa signature.',
      etape: 'Chaque époux doit avoir son propre avocat : c’est la loi. On rédige ensemble la convention (partage, résidence des enfants, pension, prestation compensatoire), puis elle est déposée chez un notaire. Pas de juge, sauf si un enfant mineur demande à être entendu.',
      pieces: ['Acte de mariage et livret de famille', 'Trois derniers avis d’imposition', 'Liste des biens, des comptes et des crédits en cours'],
      ref: 'Code civil, articles 229-1 à 229-4' },
    { id: 'enfants', dom: 'famille', titre: 'Fixer ou changer la résidence des enfants', chiffre: 'Aucun',
      delai: 'délai légal : le juge aux affaires familiales peut être saisi à tout moment, y compris des années après un jugement, dès que la situation change.',
      etape: 'On cherche d’abord un accord, si besoin avec un médiateur familial. À défaut, on saisit le juge aux affaires familiales du tribunal où vivent les enfants.',
      pieces: ['Le jugement ou la convention en vigueur, s’il y en a un', 'Justificatifs de domicile des deux parents', 'L’organisation actuelle : école, activités, trajets'],
      ref: 'Code civil, article 373-2-13' },
    { id: 'pension', dom: 'famille', titre: 'Une pension alimentaire n’est plus payée', chiffre: '5 ans',
      delai: 'en arrière : c’est la période sur laquelle les pensions impayées peuvent être réclamées.',
      etape: 'Si la pension a été fixée par un jugement ou une convention homologuée, l’agence de recouvrement de la CAF (ARIPA) ou un commissaire de justice peut la récupérer directement. Après deux mois d’impayés, c’est aussi un délit : l’abandon de famille.',
      pieces: ['Le jugement ou la convention qui fixe la pension', 'Relevés bancaires des derniers mois', 'Adresse et employeur de l’autre parent, si vous les connaissez'],
      ref: 'Code civil, article 2224 · Code pénal, article 227-3' },

    { id: 'licenciement', dom: 'travail', titre: 'Contester un licenciement', chiffre: '12 mois',
      delai: 'à compter de la notification du licenciement pour saisir le conseil de prud’hommes.',
      etape: 'On relit d’abord la lettre de licenciement : ce sont les motifs écrits qui fixent le débat. Puis on vérifie la procédure, de la convocation à l’entretien préalable.',
      pieces: ['Contrat de travail et avenants', 'Convocation et lettre de licenciement', 'Douze derniers bulletins de salaire'],
      ref: 'Code du travail, article L1471-1' },
    { id: 'rupture', dom: 'travail', titre: 'On vous propose une rupture conventionnelle', chiffre: '15 jours',
      delai: 'calendaires pour vous rétracter après la signature, sans avoir à vous justifier.',
      etape: 'Avant de signer, on vérifie le montant : l’indemnité ne peut pas être inférieure à l’indemnité légale de licenciement. On regarde aussi la date de fin du contrat et son effet sur vos allocations chômage.',
      pieces: ['Le projet de convention', 'Contrat de travail', 'Douze derniers bulletins de salaire'],
      ref: 'Code du travail, article L1237-13' },
    { id: 'salaires', dom: 'travail', titre: 'Des salaires ou des heures supplémentaires impayés', chiffre: '3 ans',
      delai: 'pour réclamer des salaires, heures supplémentaires comprises.',
      etape: 'On reconstitue les heures réellement faites : agenda, mails, badgeuse, messages. En cas de litige, le juge examine les éléments apportés par les deux parties.',
      pieces: ['Bulletins de salaire de la période', 'Relevés d’horaires, plannings, agenda', 'Mails ou messages envoyés en dehors des horaires'],
      ref: 'Code du travail, article L3245-1' },

    { id: 'loyers', dom: 'immo', titre: 'Votre locataire ne paie plus le loyer', chiffre: '6 semaines',
      delai: 'laissées au locataire pour payer, après le commandement de payer qui vise la clause résolutoire du bail.',
      etape: 'Le commandement est délivré par un commissaire de justice et doit aussi être signifié à la caution dans les quinze jours. Prévenez votre assurance loyers impayés si vous en avez une.',
      pieces: ['Le bail et l’acte de caution', 'Le décompte des loyers et charges impayés', 'Vos échanges écrits avec le locataire'],
      ref: 'Loi du 6 juillet 1989, article 24' },
    { id: 'depot', dom: 'immo', titre: 'Votre dépôt de garantie n’est pas rendu', chiffre: '1 mois',
      delai: 'pour vous le rendre si l’état des lieux de sortie est conforme à celui d’entrée ; deux mois s’il y a des différences.',
      etape: 'Passé ce délai, le propriétaire vous doit en plus 10 % du loyer mensuel par mois de retard commencé. Une mise en demeure écrite suffit souvent à débloquer la situation.',
      pieces: ['Le bail', 'États des lieux d’entrée et de sortie', 'Preuve de remise des clés et de votre nouvelle adresse'],
      ref: 'Loi du 6 juillet 1989, article 22' },
    { id: 'vice', dom: 'immo', titre: 'Un vice caché découvert après un achat', chiffre: '2 ans',
      delai: 'à compter de la découverte du vice pour agir contre le vendeur.',
      etape: 'On fait constater le défaut, idéalement par un expert, puis on relit l’acte de vente : la clause qui exclut la garantie ne protège pas un vendeur qui connaissait le vice.',
      pieces: ['L’acte de vente et les diagnostics', 'Photos datées du défaut', 'Devis ou rapport de réparation'],
      ref: 'Code civil, articles 1641 et 1648' }
  ];

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ─── Apparitions ─── */
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

  /* ─── Votre situation ─── */
  var fiche = document.getElementById('fiche');
  var courante = null;

  Object.keys(DOMAINES).forEach(function (dom) {
    var panneau = document.getElementById('sit-' + dom);
    SITUATIONS.filter(function (s) { return s.dom === dom; }).forEach(function (s) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'sit';
      b.dataset.id = s.id;
      b.setAttribute('aria-pressed', 'false');
      b.setAttribute('aria-controls', 'fiche');
      b.innerHTML = '<span class="sit__t">' + s.titre + '</span><span class="sit__d">' + s.chiffre + '</span>';
      panneau.appendChild(b);
    });
  });

  function montrer(id) {
    var s = SITUATIONS.filter(function (x) { return x.id === id; })[0];
    if (!s) return;
    courante = s;
    Array.prototype.forEach.call(document.querySelectorAll('.sit'), function (b) {
      b.setAttribute('aria-pressed', b.dataset.id === id ? 'true' : 'false');
    });
    document.getElementById('fiche-titre').textContent = DOMAINES[s.dom] + ' · ' + s.titre;
    document.getElementById('fiche-chiffre').textContent = s.chiffre;
    document.getElementById('fiche-delai').textContent = s.delai;
    document.getElementById('fiche-etape').textContent = s.etape;
    document.getElementById('fiche-pieces').innerHTML = s.pieces.map(function (p) { return '<li>' + p + '</li>'; }).join('');
    document.getElementById('fiche-ref').textContent = s.ref;
    if (!reduced) {
      fiche.classList.remove('is-change');
      void fiche.offsetWidth;
      fiche.classList.add('is-change');
    }
  }

  document.querySelector('.guide__choix').addEventListener('click', function (e) {
    var b = e.target.closest('.sit');
    if (b) montrer(b.dataset.id);
  });

  /* Onglets de domaine : clic et flèches ; la première situation du domaine s'affiche. */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.domaines-tabs [role="tab"]'));
  function activer(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    var premier = document.querySelector('#' + tab.getAttribute('aria-controls') + ' .sit');
    if (premier) montrer(premier.dataset.id);
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

  montrer('divorce');

  /* La fiche prépare le formulaire : domaine et objet déjà remplis. */
  document.getElementById('fiche-cta').addEventListener('click', function () {
    if (!courante) return;
    var dom = document.getElementById('domaine');
    dom.value = DOMAINES[courante.dom];
    var msg = document.getElementById('message');
    if (!msg.value.trim()) msg.value = 'Situation : ' + courante.titre.toLowerCase() + '.\n';
    setTimeout(function () { document.getElementById('nom').focus({ preventScroll: true }); }, reduced ? 0 : 450);
  });

  /* ─── Formulaire ─── */
  var form = document.getElementById('form-rdv');
  var statut = document.getElementById('status');
  var bouton = document.getElementById('submit');

  function valider(champ) {
    var v = champ.value.trim();
    var ok = v !== '';
    if (ok && champ.type === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    var m = form.querySelector('[data-err-for="' + champ.id + '"]');
    if (m) m.hidden = ok;
    champ.setAttribute('aria-invalid', ok ? 'false' : 'true');
    return ok;
  }
  var requis = ['nom', 'email'].map(function (id) { return document.getElementById(id); });
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
    window.setTimeout(function () {
      Array.prototype.forEach.call(form.querySelectorAll('.field'), function (f) { if (!f.contains(statut)) f.hidden = true; });
      bouton.hidden = true;
      statut.textContent = 'Votre demande est bien arrivée. Je vous réponds sous quarante-huit heures ouvrées avec une date de rendez-vous.';
    }, 700);
  });
})();
