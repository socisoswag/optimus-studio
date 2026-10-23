/*
 * Séquence « Quatre guerres » (chapitre 25, avant le 7 octobre), ≈ 1 min 12. Remplace la fiche « Les offensives » de gaza.js. Modèle : timelines/gaza.js (fiche « trêve »).
 *
 * Chiffres retenus :
 *   - Plomb durci, 27 décembre 2008 au 18 janvier 2009 : 1 387 Palestiniens tués, dont 773 qui ne prenaient pas part
 *     aux combats et 320 mineurs (B'Tselem, 9 septembre 2009) ; 13 Israéliens tués.
 *   - Rapport de la mission d'enquête de l'ONU présidée par Richard Goldstone, septembre 2009 (A/HRC/12/48) : actes
 *     assimilables à des crimes de guerre de l'armée israélienne, crimes de guerre des groupes armés palestiniens (tirs
 *     de roquettes sur des civils). Avril 2011, Washington Post : Goldstone revient sur la conclusion d'une politique
 *     visant délibérément les civils ; Hina Jilani, Christine Chinkin et Desmond Travers maintiennent le rapport.
 *   - Pilier de défense, 14 au 21 novembre 2012 : 167 Palestiniens tués, dont au moins 87 qui ne prenaient pas part aux
 *     combats ; quatre civils israéliens et deux membres des forces de sécurité tués (B'Tselem, mai 2013).
 *   - Bordure protectrice, 8 juillet au 26 août 2014 : 2 251 Palestiniens tués, dont 1 462 civils et 551 enfants ;
 *     67 soldats et 6 civils tués en Israël (commission d'enquête de l'ONU, juin 2015 ; OCHA).
 *   - Mai 2021, 10 au 21 mai : 261 Palestiniens tués, dont 67 enfants ; 13 morts en Israël, dont un soldat (OCHA, rapport
 *     de situation n° 10, septembre 2021, d'après le Haut-Commissariat aux droits de l'homme).
 *   Sources palestiniennes, à côté : Centre palestinien pour les droits de l'homme (PCHR), décembre 2011, 1 419 tués
 *   pendant Plomb durci, dont 1 167 civils ; ministère de la Santé de Gaza, janvier 2015, 2 310 tués en 2014 ; ministère
 *   de la Santé de Gaza, 21 mai 2021, 243 tués dont 66 enfants au cessez-le-feu ; ministère de la Santé palestinien,
 *   185 tués en 2012 (cité par Euro-Med Monitor, à confirmer sur la source).
 *   Fin : OCHA, données sur les victimes, 2008 à septembre 2023 : 6 407 Palestiniens et 308 Israéliens tués (Gaza,
 *   Cisjordanie et Israël ; relevé repris par The Wire et Al Jazeera, à confirmer sur le tableau d'OCHA).
 */
(function (root) {
  const G = { lon: 34.38, lat: 31.41 };
  const cam = (w, pitch, bearing) => ({ lon: G.lon, lat: G.lat, w, pitch, bearing });
  const segments = [
    {
      id: 'mot', type: 'beat', dur: 6.0, hitAt: 0.9, rgb: 14,
      kicker: 'De 2008 à 2021 · quatre offensives sur Gaza', word: 'Guerres',
      sub: 'Le blocus depuis 2007, puis une offensive tous les deux ou trois ans.', subAt: 1.8,
      cam: cam(0.034, 36, -46), camEnd: cam(0.03, 40, -42),
    },
    {
      id: 'plomb', type: 'stat', dur: 10.0, fly: 1.4, layout: 'L', anchor: [480, 20],
      ghost: '2009', kicker: 'Décembre 2008 · janvier 2009 · « Plomb durci »', pre: '', value: 1387, label: 'Palestiniens tués en trois semaines',
      text: 'Dont 320 mineurs, selon B’Tselem. Le Centre palestinien pour les droits de l’homme en compte 1 419, dont 1 167 civils. [[Côté israélien : 13 morts.]]',
      textAt: 1.6, hlAt: 6.0, source: 'B’Tselem, 9 septembre 2009 · Centre palestinien pour les droits de l’homme, 2011', sourceAt: 4.8,
      countAt: 0.3, countDur: 3.4,
      cam: cam(0.026, 42, -44), camEnd: cam(0.023, 46, -40),
    },
    {
      id: 'goldstone', type: 'doc', dur: 14.0, fly: 2.2, layout: 'L', anchor: [470, 40],
      ghost: '2009', eyebrow: 'Nations unies · Genève · septembre 2009', title: ['Le rapport', 'Goldstone'],
      meta: 'Mission d’enquête de l’ONU présidée par Richard Goldstone, juge sud-africain',
      rows: [['Pour l’armée israélienne', 'des actes assimilables à des crimes de guerre'], ['Pour les groupes armés palestiniens', 'des crimes de guerre, par les roquettes tirées sur des civils']],
      rowAt: [1.4, 3.2],
      note: 'En 2011, Goldstone revient sur un point : une politique visant délibérément les civils. Les trois autres auteurs maintiennent le rapport.', noteAt: 6.4,
      lon: 6.14, lat: 46.22,
      cam: { lon: 6.14, lat: 46.22, w: 0.05, pitch: 46, bearing: -10 },
      camEnd: { lon: 6.14, lat: 46.22, w: 0.035, pitch: 52, bearing: 2 },
    },
    {
      id: 'pilier', type: 'stat', dur: 9.0, fly: 2.0, layout: 'L', anchor: [480, 20],
      ghost: '2012', kicker: 'Novembre 2012 · « Pilier de défense »', pre: '', value: 167, label: 'Palestiniens tués en huit jours',
      text: 'Selon B’Tselem, dont au moins 87 qui ne prenaient pas part aux combats ; 185 selon le ministère de la Santé palestinien. [[Côté israélien : quatre civils et deux militaires.]]',
      textAt: 1.5, hlAt: 5.2, source: 'B’Tselem, mai 2013 · ministère de la Santé palestinien', sourceAt: 4.4,
      countAt: 0.3, countDur: 2.6,
      cam: cam(0.024, 42, -40), camEnd: cam(0.022, 46, -36),
    },
    {
      id: 'bordure', type: 'stat', dur: 13.0, fly: 1.4, layout: 'L', anchor: [480, 20],
      ghost: '2014', kicker: 'Juillet · août 2014 · « Bordure protectrice »', pre: '', value: 2251, label: 'Palestiniens tués en sept semaines',
      text: 'Dont 1 462 civils et 551 enfants, selon l’ONU ; 2 310 morts selon le ministère de la Santé de Gaza. [[Côté israélien : 67 soldats et 6 civils.]]',
      textAt: 1.6, hlAt: 6.4, source: 'Commission d’enquête de l’ONU, juin 2015 · OCHA · ministère de la Santé de Gaza, janvier 2015', sourceAt: 5.0,
      countAt: 0.3, countDur: 3.8,
      cam: cam(0.022, 44, -44), camEnd: cam(0.02, 48, -40),
    },
    {
      id: 'mai2021', type: 'stat', dur: 10.0, fly: 1.4, layout: 'L', anchor: [480, 20],
      ghost: '2021', kicker: 'Mai 2021 · « Gardien des murailles »', pre: '', value: 261, label: 'Palestiniens tués en onze jours',
      text: 'Dont 67 enfants, selon l’ONU ; le ministère de la Santé de Gaza en comptait 243 au cessez-le-feu, dont 66 enfants. [[En Israël : 13 morts, dont un soldat.]]',
      textAt: 1.5, hlAt: 5.6, source: 'ONU (OCHA, Haut-Commissariat aux droits de l’homme), septembre 2021 · ministère de la Santé de Gaza, 21 mai 2021', sourceAt: 4.4,
      countAt: 0.3, countDur: 2.6,
      cam: cam(0.024, 42, -38), camEnd: cam(0.022, 46, -34),
    },
    {
      id: 'fin', type: 'outro', dur: 10.0, fly: 1.8, hitAt: 1.1,
      eyebrow: 'ONU (OCHA) · tués à Gaza, en Cisjordanie et en Israël · 2008 à septembre 2023',
      lines: ['6 407 Palestiniens.', '308 Israéliens.', 'Avant le 7 octobre.'],
      cam: cam(0.03, 38, -42), camEnd: cam(0.028, 36, -38),
    },
  ];

  root.TL = root.buildTL({
    name: 'gaza-guerres',
    seed: 2008,
    segments,
    cities: root.CITIES.filter(([n]) => !['Jaffa', 'Rishon LeZion', 'Le Golan', 'Sinaï', 'Eilat'].includes(n)),
    hud: { label: ['Sion', 'Chapitre 25 · Quatre guerres'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: [0.6, 61.5] },
  });
})(typeof window !== 'undefined' ? window : globalThis);
