/*
 * Séquence « Sous occupation » (chapitre 23, après le plan du checkpoint de Hizma), ≈ 33 s.
 * Modèles : timelines/eau.js (chiffres sur le relief de Cisjordanie), timelines/oslo-mur.js (zones d'Oslo).
 *
 * Faits retenus (sources primaires, relevées le 23 octobre 2026) :
 *   - fin décembre 2025, OCHA compte 925 obstacles à la circulation en Cisjordanie, Jérusalem-Est comprise, qui gênent
 *     3,4 millions de Palestiniens ; dont 89 postes de contrôle tenus jour et nuit ; 34 de ces 89 postes sont dans la
 *     zone H2 d'Hébron (OCHA, Movement and Access in the West Bank, avril 2026) ;
 *   - zone C, 2016 à 2020 : 2 550 demandes de permis de construire palestiniennes, 24 acceptées (données obtenues par
 *     l'association Bimkom, citées par La Paix maintenant, 10 août 2023) ; devant la commission des Affaires étrangères
 *     et de la Défense de la Knesset, l'administration civile reconnaît refuser 95 % des demandes ;
 *   - depuis 2009, 15 136 structures palestiniennes démolies ou saisies, 23 751 personnes déplacées, 75 % en zone C
 *     (OCHA, base de données des démolitions, mise à jour du 21 octobre 2026) ; les démolitions sont le plus souvent
 *     motivées par l'absence de permis israélien (OCHA).
 *   - position israélienne : les postes de contrôle sont présentés comme une mesure de sécurité.
 */
(function (root) {
  const cam = (lon, lat, w, pitch, bearing) => ({ lon, lat, w, pitch, bearing });
  const segments = [
    {
      id: 'obstacles', type: 'stat', dur: 11.0, fly: 1.6, layout: 'L', anchor: [480, 20],
      ghost: '2025', kicker: 'Cisjordanie · décembre 2025', pre: '', value: 925,
      label: 'obstacles sur les routes',
      text: 'Postes de contrôle, barrières, blocs de terre, pour 3,4 millions de Palestiniens. [[Israël les dit nécessaires à sa sécurité.]]',
      textAt: 1.6, hlAt: 6.0, source: 'OCHA, Movement and Access in the West Bank, avril 2026', sourceAt: 4.4,
      countAt: 0.3, countDur: 2.6,
      cam: cam(34.98, 31.92, 0.05, 40, -6), camEnd: cam(34.98, 31.93, 0.046, 44, -2),
    },
    {
      id: 'permis', type: 'stat', dur: 11.0, fly: 1.6, layout: 'L', anchor: [480, 20],
      ghost: 'C', kicker: 'Zone C · de 2016 à 2020', pre: '', value: 24,
      label: 'permis de construire sur 2 550 demandes palestiniennes',
      text: 'L’administration israélienne reconnaît elle-même refuser 95 % des demandes. [[Sans permis, une maison peut être démolie.]]',
      textAt: 1.6, hlAt: 6.0, source: 'Bimkom, cité par La Paix maintenant, 10 août 2023', sourceAt: 4.4,
      countAt: 0.3, countDur: 1.6,
      cam: cam(35.06, 31.95, 0.048, 44, -2), camEnd: cam(35.08, 31.95, 0.045, 48, 2),
    },
    {
      id: 'demolitions', type: 'stat', dur: 11.0, fly: 1.6, layout: 'L', anchor: [480, 20],
      ghost: '2009', kicker: 'Depuis 2009 · Cisjordanie et Jérusalem-Est', pre: '', value: 15136,
      label: 'constructions palestiniennes démolies',
      text: '23 751 personnes déplacées. [[Les trois quarts des démolitions en zone C.]]',
      textAt: 1.6, hlAt: 5.4, source: 'OCHA, données sur les démolitions, 21 octobre 2026', sourceAt: 4.4,
      countAt: 0.3, countDur: 3.0,
      cam: cam(35.08, 31.95, 0.045, 48, 2), camEnd: cam(35.06, 31.93, 0.051, 40, 6),
    },
  ];
  const zones = [
    { seg: 'obstacles', at: 0.5, dur: 1.6, name: 'cisjordanie', from: [35.25, 31.95], tone: 'stone', until: 11.0 },
    { seg: 'permis', at: 0.4, dur: 2.4, name: 'oslo-c', from: [35.45, 31.85] },
    { seg: 'demolitions', at: 0.6, dur: 1.6, name: 'jerusalem-est-annexee', from: [35.23, 31.78] },
  ];
  const markers = [
    { seg: 'obstacles', at: 3.0, label: 'Qalandia', lon: 35.2172, lat: 31.8635, dir: [-1, -1], off: 60, endAt: 11.0 },
    { seg: 'obstacles', at: 3.6, label: 'Hébron, zone H2 : 34 postes', lon: 35.1045, lat: 31.5245, dir: [-1, 1], off: 60, endAt: 11.0 },
  ];
  const clock = [{ seg: 'obstacles', at: 0.2, text: 'Décembre 2025' }, { seg: 'permis', at: 0.2, text: '2016 · 2020' }, { seg: 'demolitions', at: 0.2, text: '2009 · 2026' }];

  root.TL = root.buildTL({
    name: 'occupation',
    relief: true,
    seed: 2025,
    segments,
    zones,
    markers,
    clock,
    cities: [],
    hud: { label: ['Sion', 'Chapitre 23 · Sous occupation'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: null },
  });
})(typeof window !== 'undefined' ? window : globalThis);
