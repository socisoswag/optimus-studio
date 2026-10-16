/*
 * Séquence « Gaza » (chapitre 25), ≈ 1 min 30.
 *
 * De 2007 à aujourd'hui. Positions approchées. Faits et chiffres retenus (à dater à l'écran) :
 *   - 365 km² ; plus de deux millions d'habitants, dont plus des deux tiers de réfugiés (UNRWA) ;
 *   - blocus israélien depuis juin 2007, avec l'Égypte au point de passage de Rafah ; zone de pêche
 *     limitée en mer ; espace aérien contrôlé par Israël ;
 *   - Plomb durci (2008-2009) : environ 1 400 morts (B'Tselem, PCHR), 13 en Israël ; Bordure
 *     protectrice (2014) : 2 251 morts dont 551 enfants (OCHA), 73 en Israël ; mai 2021 : plus de
 *     250 morts (OCHA), 13 en Israël ;
 *   - 7 octobre 2023 : l'attaque menée par le Hamas tue environ 1 200 personnes en Israël ; 251 otages ;
 *   - 9 octobre : « siège complet » (électricité, nourriture, carburant) ; 13 octobre : ordre
 *     d'évacuation de 1,1 million d'habitants du nord vers le sud de l'oued Gaza ;
 *   - ministère de la Santé de Gaza : plus de 74 000 morts (octobre 2026) ; une étude de The Lancet
 *     Global Health juge ce décompte inférieur à la réalité ;
 *   - environ 90 % des habitants déplacés (ONU) ; la plupart des logements endommagés ou détruits
 *     (UNOSAT) ; famine déclarée par l'IPC en août 2025 ;
 *   - CIJ, 26 janvier 2024 : mesures conservatoires ; CPI, 21 novembre 2024 : mandats d'arrêt contre
 *     B. Netanyahou, Y. Gallant et M. Deif ; commission d'enquête de l'ONU, 16 septembre 2025 :
 *     conclut à un génocide ; cessez-le-feu le 10 octobre 2025.
 */
(function (root) {
  const segments = [
    {
      id: 'gaza', type: 'beat', dur: 6.0, hitAt: 1.0, reveal: 'slam', rgb: 14,
      kicker: 'Bande de Gaza · 365 km²', word: 'Gaza',
      sub: 'Plus de deux millions d’habitants, dont plus des deux tiers de réfugiés.', subAt: 1.4,
      cam: { lon: 34.42, lat: 31.42, w: 0.03, pitch: 34, bearing: -40 },
      camEnd: { lon: 34.4, lat: 31.42, w: 0.024, pitch: 38, bearing: -44 },
    },
    {
      id: 'blocus', type: 'cap', dur: 11.0, fly: 1.5, anchor: [300, -40], textW: 900,
      kicker: 'Depuis juin 2007', title: 'Le blocus',
      text: 'Après la prise du pouvoir par le Hamas, Israël, avec l’Égypte, boucle Gaza par terre, par mer et par air. Personnes et marchandises passent au compte-gouttes.',
      cam: { lon: 34.38, lat: 31.4, w: 0.0165, pitch: 44, bearing: -48 },
      camEnd: { lon: 34.38, lat: 31.4, w: 0.0152, pitch: 48, bearing: -44 },
    },
    {
      id: 'offensives', type: 'cap', dur: 13.0, fly: 1.2, anchor: [300, -40], textW: 900,
      kicker: '2008 — 2021', title: 'Les offensives',
      text: 'Plomb durci, 2008-2009 : environ 1 400 morts. Bordure protectrice, 2014 : 2 251 morts, dont 551 enfants. Mai 2021 : plus de 250 morts. En Israël : 13, 73 et 13 morts.',
      cam: { lon: 34.38, lat: 31.4, w: 0.015, pitch: 46, bearing: -44 },
      camEnd: { lon: 34.39, lat: 31.41, w: 0.014, pitch: 50, bearing: -40 },
    },
    {
      id: 'octobre', type: 'cap', dur: 9.0, fly: 1.3, anchor: [300, -40], textW: 900,
      kicker: '7 octobre 2023', title: '7 octobre',
      text: 'L’attaque menée par le Hamas tue environ 1 200 personnes en Israël ; 251 otages sont emmenés à Gaza.',
      cam: { lon: 34.45, lat: 31.47, w: 0.0075, pitch: 48, bearing: -40 },
      camEnd: { lon: 34.46, lat: 31.47, w: 0.007, pitch: 52, bearing: -36 },
    },
    {
      id: 'siege', type: 'cap', dur: 11.0, fly: 1.3, anchor: [300, -40], textW: 900,
      kicker: '9 — 13 octobre 2023', title: 'Siège complet',
      text: 'Israël coupe l’électricité, la nourriture et le carburant. Puis ordonne à 1,1 million d’habitants du nord de partir au sud. [[Le sud est bombardé lui aussi.]]',
      cam: { lon: 34.38, lat: 31.4, w: 0.0165, pitch: 44, bearing: -46 },
      camEnd: { lon: 34.37, lat: 31.39, w: 0.0152, pitch: 48, bearing: -42 },
    },
    {
      id: 'morts', type: 'stat', dur: 12.0, fly: 1.4, layout: 'L', anchor: [480, 20],
      ghost: '2023', kicker: '7 octobre 2023 — octobre 2026', pre: 'Plus de', value: 74000, label: 'Palestiniens tués à Gaza',
      text: 'Selon le ministère de la Santé de Gaza. [[Un décompte sans doute inférieur à la réalité]], selon une étude publiée dans The Lancet.',
      textAt: 1.6, hlAt: 6.0, source: 'Ministère de la Santé de Gaza, octobre 2026 · The Lancet Global Health', sourceAt: 5.0,
      countAt: 0.3, countDur: 5.0,
      cam: { lon: 34.38, lat: 31.4, w: 0.0175, pitch: 42, bearing: -44 },
      camEnd: { lon: 34.38, lat: 31.4, w: 0.016, pitch: 46, bearing: -40 },
    },
    {
      id: 'ruines', type: 'cap', dur: 11.5, fly: 2.0, anchor: [330, -90], textW: 900,
      kicker: '2023 — 2025 · Gaza-ville', title: 'Un champ de ruines',
      text: '[[Environ 90 % des habitants]] ont été déplacés, souvent plusieurs fois. La plupart des logements sont endommagés ou détruits. En août 2025, la famine est déclarée.',
      cam: { lon: 34.4555, lat: 31.5195, w: 0.0004, pitch: 52, bearing: -40 },
      camEnd: { lon: 34.4555, lat: 31.5195, w: 0.00033, pitch: 56, bearing: -30 },
    },
    {
      id: 'justice', type: 'cap', dur: 11.0, fly: 1.3, anchor: [330, -90], textW: 900,
      kicker: '2024 — 2025 · justice internationale', title: 'Devant les juges',
      text: 'La Cour internationale de justice ordonne d’empêcher un génocide. La CPI émet des mandats d’arrêt contre Benyamin Netanyahou, Yoav Gallant et un chef du Hamas. Une commission d’enquête de l’ONU conclut à un génocide.',
      faces: [root.face('netanyahou', { side: 'R', at: 0.9 })],
      cam: { lon: 34.4555, lat: 31.5195, w: 0.00062, pitch: 50, bearing: -24 },
      camEnd: { lon: 34.4555, lat: 31.5195, w: 0.00072, pitch: 48, bearing: -20 },
    },
    {
      id: 'fin', type: 'outro', dur: 9.0, fly: 2.0, hitAt: 1.2,
      eyebrow: '10 octobre 2025 · cessez-le-feu',
      lines: ['Une prison', 'à ciel ouvert devenue', 'un champ de ruines.'],
      cam: { lon: 34.38, lat: 31.42, w: 0.016, pitch: 40, bearing: -40 },
      camEnd: { lon: 34.38, lat: 31.42, w: 0.014, pitch: 44, bearing: -36 },
    },
  ];

  const units = [], strikes = [], markers = [], arrows = [], zones = [], plans = [], blocks = [], lights = [], flows = [];
  const rnd = (() => { let a = 2007; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();
  const inPoly = (x, y, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > y) !== (P[j][1] > y) && x < ((P[j][0] - P[i][0]) * (y - P[i][1])) / (P[j][1] - P[i][1]) + P[i][0]) c = !c; return c; };
  const GAZA = [[34.4812, 31.5831], [34.556, 31.5398], [34.4804, 31.4856], [34.3673, 31.3928], [34.3458, 31.3577], [34.3538, 31.3064], [34.3509, 31.2893], [34.3159, 31.2569], [34.2484, 31.2114], [34.2246, 31.2757], [34.2003, 31.3143], [34.2227, 31.3266], [34.2814, 31.3767], [34.3016, 31.4077], [34.3484, 31.4376], [34.3682, 31.4682], [34.4434, 31.5346]];
  const inGaza = () => { for (;;) { const lon = 34.2 + rnd() * 0.36, lat = 31.21 + rnd() * 0.37; if (inPoly(lon, lat, GAZA)) return [lon, lat]; } };
  const SEGDUR = Object.fromEntries(segments.map((sg) => [sg.id, sg.dur]));
  const span = (from, to) => segments.slice(segments.findIndex((sg) => sg.id === from), segments.findIndex((sg) => sg.id === to) + 1).reduce((a, sg) => a + sg.dur, 0);

  // ---- la bande, la nuit : lumières (plus denses dans les villes et les camps)
  const CITIES_G = [
    [[34.43, 31.53], [34.48, 31.535], [34.49, 31.49], [34.44, 31.48]], [[34.47, 31.548], [34.505, 31.548], [34.505, 31.525], [34.47, 31.525]],
    [[34.33, 31.43], [34.39, 31.47], [34.4, 31.44], [34.35, 31.41]], [[34.28, 31.36], [34.32, 31.36], [34.32, 31.33], [34.28, 31.33]],
    [[34.23, 31.3], [34.27, 31.3], [34.27, 31.27], [34.23, 31.27]],
  ];
  const OFF = span('gaza', 'octobre') + 1.0; // électricité coupée : 1 s après le début de « siège »
  lights.push({ seg: 'gaza', at: 0.3, poly: GAZA, n: 1300, off: OFF, keep: 0.03 });
  CITIES_G.forEach((poly) => lights.push({ seg: 'gaza', at: 0.3, poly, n: 140, off: OFF, keep: 0.03 }));
  zones.push({ seg: 'gaza', at: 1.2, dur: 1.6, name: 'gaza', from: [34.45, 31.5] });

  // ---- le blocus : clôture, limite en mer, patrouilleurs, points de passage
  plans.push({ seg: 'blocus', at: 0.8, dur: 2.4, any: true, path: [[34.1, 31.36], [34.2, 31.46], [34.3, 31.56], [34.39, 31.645]], style: 'dash', label: 'Zone de pêche limitée', labelAt: [34.29, 31.6] });
  units.push({ seg: 'blocus', at: 1.6, dur: 9, kind: 'ship', n: 2, path: [[34.12, 31.38], [34.22, 31.48], [34.32, 31.58]], size: 22, until: span('blocus', 'morts') });
  units.push({ seg: 'blocus', at: 2.4, dur: 9, kind: 'ship', n: 1, path: [[34.36, 31.62], [34.27, 31.53], [34.18, 31.44]], size: 22, until: span('blocus', 'morts') });
  [['Erez', 34.555, 31.556, [1, -1]], ['Kerem Shalom', 34.283, 31.226, [1, 1]], ['Rafah · Égypte', 34.252, 31.247, [-1, 1]]]
    .forEach(([label, lon, lat, dir], i) => markers.push({ seg: 'blocus', at: 3.2 + 0.5 * i, label, lon, lat, dir, off: 40 }));

  // ---- les offensives : trois vagues de frappes
  [[0.6, 26, 'Décembre 2008 — janvier 2009'], [4.4, 40, 'Juillet — août 2014'], [8.9, 22, 'Mai 2021']].forEach(([at, n]) => {
    for (let j = 0; j < n; j++) { const [lon, lat] = inGaza(); strikes.push({ seg: 'offensives', at: at + rnd() * 3.2, lon, lat, power: 0.5 + rnd() * 0.5, burn: 3.5 }); }
  });
  units.push({ seg: 'offensives', at: 4.6, dur: 2.0, kind: 'plane', n: 3, path: [[34.6, 31.35], [34.4, 31.47], [34.2, 31.6]], alt: 50, size: 24 });
  units.push({ seg: 'offensives', at: 5.4, dur: 3.0, kind: 'tank', n: 5, path: [[34.53, 31.47], [34.49, 31.49], [34.475, 31.5]], size: 18 });
  markers.push({ seg: 'offensives', at: 6.2, label: 'Chajaïya · 20 juillet 2014', lon: 34.485, lat: 31.505, dir: [1, -1], off: 46 });

  // ---- 7 octobre (flèches couleur pierre : l'attaque du Hamas)
  [[[34.5, 31.52], [34.535, 31.485]], [[34.45, 31.45], [34.49, 31.425]], [[34.41, 31.4], [34.46, 31.39]], [[34.52, 31.53], [34.59, 31.525]]]
    .forEach((p, i) => arrows.push({ seg: 'octobre', at: 0.6 + 0.2 * i, dur: 1.4, path: p, w: 9, tone: 'stone', until: 8.8 }));
  [['Kfar Aza', 34.535, 31.485, [1, -1]], ['Be’eri', 34.49, 31.425, [1, 1]], ['Festival Nova · Réïm', 34.46, 31.39, [1, 1]], ['Sdérot', 34.59, 31.525, [1, -1]]]
    .forEach(([label, lon, lat, dir], i) => markers.push({ seg: 'octobre', at: 1.6 + 0.3 * i, label, lon, lat, dir, off: 36 }));
  for (let j = 0; j < 24; j++) { const [lon, lat] = inGaza(); strikes.push({ seg: 'octobre', at: 4.8 + rnd() * 4, lon, lat, power: 0.6 + rnd() * 0.4, burn: 5 }); }

  // ---- siège complet, ordre d'évacuation, le sud bombardé
  plans.push({ seg: 'siege', at: 2.6, dur: 1.2, any: true, path: [[34.37, 31.405], [34.41, 31.44], [34.44, 31.46]], style: 'dash', label: 'Oued Gaza', labelAt: [34.43, 31.47], until: 10.5 });
  flows.push({ seg: 'siege', at: 3.4, dur: 5.2, n: 320, from: [[34.46, 31.51], [34.49, 31.535], [34.44, 31.5], [34.5, 31.55]], to: [34.31, 31.35], travel: [3.0, 4.5], bend: 0.05, originHeat: 0.6, R: 260 });
  for (let j = 0; j < 60; j++) { const [lon, lat] = inGaza(); strikes.push({ seg: 'siege', at: 0.6 + rnd() * 10, lon, lat, power: 0.6 + rnd() * 0.5, burn: 6 }); }
  for (let j = 0; j < 40; j++) { const [lon, lat] = inGaza(); strikes.push({ seg: 'morts', at: rnd() * 11, lon, lat, power: 0.6 + rnd() * 0.5, burn: 6 }); }

  // ---- Gaza-ville : immeubles qui s'effondrent, vague après vague
  const mLon = 1 / 94900, mLat = 1 / 111000, cell = 25, ROT = -0.6;
  for (let gy = -11; gy <= 11; gy++) for (let gx = -14; gx <= 14; gx++) {
    if (rnd() < 0.2) continue;
    const ex = gx * cell, ny = gy * cell;
    const lon = 34.4555 + (ex * Math.cos(ROT) - ny * Math.sin(ROT)) * mLon, lat = 31.5195 + (ex * Math.sin(ROT) + ny * Math.cos(ROT)) * mLat;
    const falls = rnd() < 0.9;
    blocks.push({ seg: 'ruines', at: 0.4 + rnd() * 1.2, lon, lat, w: 12 + rnd() * 8, d: 12 + rnd() * 8, h: 9 + rnd() * 18, rot: ROT + (rnd() - 0.5) * 0.12, lit: false, fall: falls ? 2.6 + rnd() * 6.5 : undefined });
  }
  for (let j = 0; j < 20; j++) strikes.push({ seg: 'ruines', at: 2.4 + rnd() * 6.6, lon: 34.4555 + (rnd() - 0.5) * 0.007, lat: 31.5195 + (rnd() - 0.5) * 0.005, power: 0.7, burn: 4 });

  const DUR = SEGDUR;
  markers.forEach((m) => { if (m.endAt === undefined) m.endAt = DUR[m.seg] + 0.3; });

  const clock = [
    { seg: 'blocus', at: 0.2, text: 'Juin 2007' },
    { seg: 'offensives', at: 0.2, text: 'Décembre 2008' }, { seg: 'offensives', at: 4.2, text: 'Juillet 2014' }, { seg: 'offensives', at: 8.7, text: 'Mai 2021' },
    { seg: 'octobre', at: 0.2, text: '7 octobre 2023' },
    { seg: 'siege', at: 0.2, text: '9 octobre 2023' }, { seg: 'siege', at: 3.0, text: '13 octobre 2023' },
    { seg: 'morts', at: 0.2, text: 'Octobre 2026' },
    { seg: 'ruines', at: 0.2, text: '2023 — 2025' },
    { seg: 'justice', at: 0.2, text: '2024 — 2025' },
    { seg: 'fin', at: 0.2, text: '' },
  ];

  root.TL = root.buildTL({
    name: 'gaza',
    seed: 2007,
    segments,
    cities: root.CITIES.filter(([n]) => !['Jaffa', 'Rishon LeZion', 'Le Golan', 'Sinaï', 'Eilat'].includes(n)),
    markers,
    flows,
    units,
    arrows,
    zones,
    strikes,
    plans,
    blocks,
    lights,
    clock,
    hud: { label: ['Sion', 'Chapitre 25 · Gaza'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: null },
  });
})(typeof window !== 'undefined' ? window : globalThis);
