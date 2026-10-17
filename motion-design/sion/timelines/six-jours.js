/*
 * Séquence « Six jours, la Naksa » (chapitre 19), ≈ 1 min 15.
 *
 * Juin 1967 vu depuis la Palestine. Tracés des offensives simplifiés, d'après les grands atlas
 * historiques. Faits et chiffres retenus (sources concordantes, estimations signalées) :
 *   - 5 juin, 7 h 45 : frappe aérienne israélienne ; l'essentiel de l'aviation égyptienne est
 *     détruit au sol en trois heures environ ;
 *   - Sinaï : trois divisions (Tal, Yoffe, Sharon) atteignent le canal de Suez le 8 juin ;
 *     la bande de Gaza est occupée ;
 *   - Cisjordanie : Jérusalem-Est est prise le 7 juin ; près de Latroun, Imwas, Yalu et
 *     Beit Nuba sont vidés puis rasés (environ 10 000 habitants, Zochrot, Al-Haq) ;
 *   - nuit du 10 au 11 juin : le quartier des Maghrébins est rasé (environ 135 maisons,
 *     650 habitants) ;
 *   - Naksa : 280 000 à 325 000 Palestiniens déplacés, surtout vers la rive est du Jourdain ;
 *   - Golan : Quneitra tombe le 10 juin ; plus de 100 000 habitants fuient ou sont chassés ;
 *   - cessez-le-feu le 10 juin. Le Sinaï est rendu à l'Égypte en 1982 ; la Cisjordanie,
 *     Jérusalem-Est, Gaza et le Golan sont considérés comme occupés par l'ONU.
 */
(function (root) {
  const segments = [
    {
      id: 'naksa', type: 'beat', dur: 6.0, hitAt: 1.0, reveal: 'slam', rgb: 14,
      kicker: 'Du 5 au 10 juin 1967 · la guerre des Six Jours', word: 'Naksa',
      sub: '« Le revers » : c’est ainsi que les Palestiniens nomment juin 1967.', subAt: 1.4,
      cam: { lon: 33.6, lat: 31.2, w: 0.3, pitch: 30, bearing: -4 },
      camEnd: { lon: 33.2, lat: 31.0, w: 0.22, pitch: 34, bearing: 2 },
    },
    {
      id: 'frappe', type: 'cap', dur: 9.0, fly: 1.4, anchor: [0, -110],
      kicker: 'Opération Moked', title: 'Frappe aérienne',
      text: 'En trois heures, l’essentiel de l’aviation égyptienne est détruit au sol.',
      cam: { lon: 32.9, lat: 31.05, w: 0.135, pitch: 34, bearing: -6 },
      camEnd: { lon: 32.6, lat: 30.8, w: 0.12, pitch: 38, bearing: 3 },
    },
    {
      id: 'sinai', type: 'cap', dur: 11.0, fly: 1.3, anchor: [0, -110],
      kicker: 'Du 5 au 8 juin 1967', title: 'Sinaï et Gaza',
      text: 'Les blindés israéliens atteignent le canal de Suez. Gaza passe sous occupation.',
      cam: { lon: 33.45, lat: 30.75, w: 0.13, pitch: 40, bearing: 4 },
      camEnd: { lon: 33.25, lat: 30.65, w: 0.115, pitch: 44, bearing: -3 },
    },
    {
      id: 'cisjordanie', type: 'cap', dur: 13.0, fly: 1.5, anchor: [120, -70],
      kicker: 'Du 5 au 7 juin 1967', title: 'Cisjordanie et Jérusalem-Est',
      text: 'Jérusalem-Est est prise le 7 juin. Près de Latroun, [[Imwas, Yalu et Beit Nuba]] sont vidés puis rasés : environ 10 000 habitants chassés.',
      cam: { lon: 35.2, lat: 31.92, w: 0.064, pitch: 42, bearing: -6 },
      camEnd: { lon: 35.18, lat: 31.88, w: 0.055, pitch: 47, bearing: 4 },
    },
    {
      id: 'maghrebins', type: 'cap', dur: 10.0, fly: 1.9, anchor: [340, -110],
      kicker: 'Jérusalem · nuit du 10 au 11 juin 1967', title: 'Quartier des Maghrébins',
      text: 'Au pied du mur Al-Buraq, le mur occidental, environ [[135 maisons sont rasées]] en une nuit. 650 habitants sont chassés.',
      cam: { lon: 35.2343, lat: 31.7768, w: 0.00019, pitch: 50, bearing: -14 },
      camEnd: { lon: 35.2340, lat: 31.7764, w: 0.000135, pitch: 56, bearing: -4 },
    },
    {
      id: 'deplaces', type: 'stat', dur: 12.0, fly: 1.6, layout: 'L', anchor: [470, 40],
      ghost: '1967', kicker: 'Juin 1967 · Cisjordanie et Gaza', pre: 'Environ', value: 300000,
      label: 'Palestiniens déplacés : la Naksa',
      text: 'La plupart traversent le Jourdain vers l’est. Pour beaucoup, c’est [[le deuxième exil]] après 1948.',
      textAt: 1.6, hlAt: 6.0, source: 'Estimations : 280 000 à 325 000', sourceAt: 5.0,
      countAt: 0.3, countDur: 4.5,
      cam: { lon: 35.55, lat: 31.95, w: 0.1, pitch: 42, bearing: -6 },
      camEnd: { lon: 35.6, lat: 31.95, w: 0.085, pitch: 47, bearing: 4 },
    },
    {
      id: 'golan', type: 'cap', dur: 9.0, fly: 1.4, anchor: [120, -80],
      kicker: '9 et 10 juin 1967', title: 'Plateau du Golan',
      text: 'Quneitra tombe le 10 juin. Plus de 100 000 habitants fuient ou sont chassés.',
      cam: { lon: 35.74, lat: 33.05, w: 0.05, pitch: 46, bearing: 8 },
      camEnd: { lon: 35.76, lat: 33.08, w: 0.043, pitch: 50, bearing: -2 },
    },
    {
      id: 'fin', type: 'outro', dur: 10.0, fly: 2.4, hitAt: 2.4,
      eyebrow: '10 juin 1967 · cessez-le-feu',
      lines: ['Six jours de guerre.', 'Une occupation', 'qui dure encore.'],
      cam: { lon: 34.2, lat: 30.9, w: 0.2, pitch: 30, bearing: 0 },
      camEnd: { lon: 34.4, lat: 31.1, w: 0.17, pitch: 34, bearing: 2 },
    },
  ];

  // ---- frappe aérienne : vols bas au-dessus de la mer, puis virage au sud vers les bases égyptiennes
  const AIR = [
    { at: 0.6, n: 4, path: [[34.82, 31.84], [33.6, 32.15], [32.2, 31.85], [31.6, 30.9], [31.45, 30.33]], target: [31.45, 30.33], name: 'Inshas' },
    { at: 0.9, n: 4, path: [[34.73, 31.76], [33.4, 32.05], [32.4, 31.6], [32.1, 30.9], [32.08, 30.55]], target: [32.08, 30.55], name: 'Abou Souweir' },
    { at: 1.3, n: 3, path: [[34.82, 31.84], [33.5, 32.25], [31.9, 32.0], [31.1, 30.8], [30.92, 30.12]], target: [30.92, 30.12], name: 'Le Caire-Ouest' },
    { at: 1.1, n: 3, path: [[34.66, 31.23], [34.2, 31.2], [33.84, 31.07]], target: [33.84, 31.07], name: 'El-Arich' },
    { at: 1.6, n: 3, path: [[34.66, 31.23], [33.9, 30.9], [33.14, 30.41]], target: [33.14, 30.41], name: 'Bir Gifgafa' },
    { at: 2.0, n: 3, path: [[34.73, 31.76], [33.3, 31.95], [32.5, 31.2], [32.32, 30.33]], target: [32.32, 30.33], name: 'Fayid' },
  ];
  const units = [], strikes = [], markers = [], arrows = [], zones = [];
  AIR.forEach((a) => {
    const dur = 1.2 + 0.85 * Math.hypot(a.path[0][0] - a.target[0], a.path[0][1] - a.target[1]);
    units.push({ seg: 'frappe', at: a.at, dur, kind: 'plane', n: a.n, path: a.path, alt: 60, size: 30, until: 8.6 });
    for (let j = 0; j < 4; j++) strikes.push({ seg: 'frappe', at: a.at + dur + j * 0.16, lon: a.target[0] + (j - 1.5) * 0.03, lat: a.target[1] + (j % 2 ? 0.015 : -0.015), power: 0.9, burn: 7 });
    markers.push({ seg: 'frappe', at: a.at + dur + 0.2, label: a.name, lon: a.target[0], lat: a.target[1], dir: [1, -1], off: 30, endAt: 9.0 });
  });

  // ---- Sinaï : trois colonnes blindées vers le canal, Gaza
  const SINAI = [
    { name: 'Tal', path: [[34.25, 31.29], [34.1, 31.21], [33.8, 31.13], [33.2, 31.05], [32.65, 31.02], [32.33, 30.86]], fire: [[1.8, [34.23, 31.27]], [3.6, [33.8, 31.12]]] },
    { name: 'Yoffe', path: [[34.38, 30.95], [33.95, 30.86], [33.5, 30.62], [33.13, 30.42], [32.42, 30.58]], fire: [[4.4, [33.5, 30.6]]] },
    { name: 'Sharon', path: [[34.43, 30.88], [34.1, 30.83], [33.75, 29.92], [33.2, 29.98], [32.95, 30.02], [32.6, 30.0]], fire: [[2.4, [34.08, 30.82]]] },
  ];
  SINAI.forEach((c, i) => {
    units.push({ seg: 'sinai', at: 0.6 + 0.3 * i, dur: 8.6, kind: 'tank', n: 5, path: c.path, size: 20, fire: c.fire.map(([at, to]) => ({ at, to })) });
    arrows.push({ seg: 'sinai', at: 0.4 + 0.3 * i, dur: 8.8, path: c.path, w: 12, label: `Division ${c.name}` });
  });
  arrows.push({ seg: 'sinai', at: 0.8, dur: 2.2, path: [[34.55, 31.36], [34.46, 31.47], [34.44, 31.53]], w: 9, label: 'Gaza' });
  units.push({ seg: 'sinai', at: 0.9, dur: 2.4, kind: 'tank', n: 3, path: [[34.55, 31.36], [34.46, 31.47], [34.44, 31.53]], size: 18 });
  zones.push({ seg: 'sinai', at: 1.6, dur: 2.0, name: 'gaza', from: [34.55, 31.36] });
  zones.push({ seg: 'sinai', at: 1.2, dur: 8.6, name: 'sinai', from: [34.6, 30.7] });

  // ---- Cisjordanie et Jérusalem-Est
  const WB = [
    { at: 0.8, path: [[35.25, 32.64], [35.3, 32.46], [35.27, 32.32], [35.26, 32.22]], fire: [[2.6, [35.3, 32.46]]], label: 'Jénine · Naplouse' },
    { at: 1.1, path: [[34.92, 31.86], [34.99, 31.84], [35.08, 31.88], [35.2, 31.9]], fire: [[2.2, [35.0, 31.84]]], label: 'Latroun · Ramallah' },
    { at: 2.4, path: [[35.19, 31.79], [35.22, 31.82], [35.245, 31.79], [35.44, 31.86]], fire: [[4.4, [35.234, 31.778]]], label: 'Jérusalem-Est · Jéricho' },
    { at: 4.6, path: [[35.21, 31.75], [35.2, 31.7], [35.15, 31.6], [35.1, 31.53]], fire: [], label: 'Bethléem · Hébron' },
  ];
  WB.forEach((c) => {
    units.push({ seg: 'cisjordanie', at: c.at, dur: 5.5, kind: 'tank', n: 4, path: c.path, size: 18, fire: c.fire.map(([at, to]) => ({ at, to })) });
    arrows.push({ seg: 'cisjordanie', at: c.at - 0.2, dur: 5.6, path: c.path, w: 10 });
  });
  zones.push({ seg: 'cisjordanie', at: 1.0, dur: 8.5, name: 'cisjordanie', from: [34.95, 31.9] });
  zones.push({ seg: 'cisjordanie', at: 6.3, dur: 1.0, name: 'jerusalem-est', from: [35.2, 31.78] });
  const LATRUN = [['Imwas', 34.99, 31.839], ['Yalu', 35.018, 31.835], ['Beit Nuba', 35.06, 31.85]];
  LATRUN.forEach(([n, lon, lat], i) => {
    markers.push({ seg: 'cisjordanie', at: 8.6 + 0.3 * i, label: i === 1 ? 'Imwas · Yalu · Beit Nuba' : '', lon, lat, erase: true, R: 70, eraseDur: 2.6, dir: [-1, 1], off: 40, endAt: 13.2 });
    strikes.push({ seg: 'cisjordanie', at: 8.9 + 0.35 * i, lon, lat, power: 0.6, burn: 4 });
  });
  units.push({ seg: 'cisjordanie', at: 8.2, dur: 3.2, kind: 'dozer', n: 2, path: [[34.97, 31.835], [35.06, 31.848]], size: 16, until: 12.8 });

  // ---- quartier des Maghrébins : plan de la vieille ville (tracés approchés), 135 maisons rasées
  const plans = [], blocks = [];
  const OLD_CITY = [[35.2276, 31.7766], [35.2268, 31.7788], [35.2271, 31.7800], [35.2302, 31.7816], [35.2331, 31.7820], [35.2362, 31.7820], [35.2368, 31.7809],
    [35.2373, 31.7787], [35.2372, 31.7754], [35.2344, 31.7757], [35.2338, 31.7743], [35.2297, 31.7720], [35.2283, 31.7722]];
  const HARAM = [[35.2344, 31.7757], [35.2338, 31.7801], [35.2370, 31.7799], [35.2372, 31.7754]];
  const DOME = Array.from({ length: 8 }, (_, i) => [35.2354 + 0.000275 * Math.cos(i * Math.PI / 4 + 0.39), 31.7780 + 0.000234 * Math.sin(i * Math.PI / 4 + 0.39)]);
  const AQSA = [[35.23541, 31.77584], [35.23599, 31.77584], [35.23599, 31.77656], [35.23541, 31.77656]];
  const QUARTER = [[35.23433, 31.77580], [35.23423, 31.77718], [35.23300, 31.77728], [35.23262, 31.77622], [35.23290, 31.77505], [35.23365, 31.77455]];
  plans.push({ seg: 'maghrebins', at: 0.3, dur: 1.2, style: 'grid', bbox: [35.2262, 31.7712, 35.2385, 31.7830], step: 25 });
  plans.push({ seg: 'maghrebins', at: 0.5, dur: 2.4, path: OLD_CITY, closed: true, style: 'wall', label: 'Vieille ville', labelAt: [35.2312, 31.7790] });
  plans.push({ seg: 'maghrebins', at: 0.9, dur: 1.8, path: HARAM, closed: true, style: 'sacred', fill: 0.05, label: 'Haram al-Sharif', labelAt: [35.2360, 31.7792], big: true });
  plans.push({ seg: 'maghrebins', at: 1.3, dur: 1.0, path: DOME, closed: true, style: 'sacred', fill: 0.16, label: 'Dôme du Rocher', labelAt: [35.2354, 31.7774] });
  plans.push({ seg: 'maghrebins', at: 1.4, dur: 1.0, path: AQSA, closed: true, style: 'sacred', fill: 0.12, label: 'Al-Aqsa', labelAt: [35.2357, 31.7754] });
  plans.push({ seg: 'maghrebins', at: 2.2, dur: 0.8, path: [[35.23446, 31.77612], [35.23438, 31.77706]], style: 'focus', label: 'Mur Al-Buraq', labelAt: [35.23505, 31.77690], labelAt2: 0.4 });
  // maisons : grille serrée alignée sur le mur, ruelles tirées au hasard, exactement 135
  const rnd = (() => { let a = 1967; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();
  const inPoly = (x, y, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > y) !== (P[j][1] > y) && x < ((P[j][0] - P[i][0]) * (y - P[i][1])) / (P[j][1] - P[i][1]) + P[i][0]) c = !c; return c; };
  const ROT = 0.117, mLon = 1 / 94650, mLat = 1 / 111000, cell = 13;
  const cells = [];
  for (let gy = -12; gy <= 12; gy++) for (let gx = -8; gx <= 8; gx++) {
    const ex = gx * cell, ny = gy * cell;
    const lon = 35.2335 + (ex * Math.cos(ROT) - ny * Math.sin(ROT)) * mLon, lat = 31.7759 + (ex * Math.sin(ROT) + ny * Math.cos(ROT)) * mLat;
    if (inPoly(lon, lat, QUARTER)) cells.push([lon, lat]);
  }
  while (cells.length > 135) cells.splice(Math.floor(rnd() * cells.length), 1);
  const DOZ = { at: 2.8, dur: 4.8, east: 35.2343, west: 35.2327 };
  cells.forEach(([lon, lat]) => {
    const q = Math.min(1, Math.max(0, (DOZ.east - lon) / (DOZ.east - DOZ.west)));
    blocks.push({
      seg: 'maghrebins', at: 0.9 + 0.6 * rnd() + 0.9 * (1 - q), lon: lon + (rnd() - 0.5) * 2 * mLon, lat: lat + (rnd() - 0.5) * 2 * mLat,
      w: 8 + rnd() * 3.5, d: 8 + rnd() * 3.5, h: 5 + rnd() * 6, rot: ROT + (rnd() - 0.5) * 0.12, lit: rnd() < 0.3,
      fall: DOZ.at + DOZ.dur * Math.acos(1 - 2 * q) / Math.PI + 0.15 + rnd() * 0.35,
    });
  });
  [31.7751, 31.7759, 31.7767].forEach((lat, i) => units.push({ seg: 'maghrebins', at: DOZ.at + 0.1 * i, dur: DOZ.dur, kind: 'dozer', n: 1, path: [[DOZ.east + 0.0001, lat], [DOZ.west - 0.0001, lat + 0.0001]], size: 26 }));
  markers.push({ seg: 'maghrebins', at: 2.0, label: 'Quartier des Maghrébins', lon: 35.2331, lat: 31.7768, dir: [-1, -1], off: 70, endAt: 8.0 });
  markers.push({ seg: 'maghrebins', at: 8.1, label: 'Aujourd’hui : l’esplanade du Mur', lon: 35.2336, lat: 31.7760, dir: [-1, 1], off: 70, endAt: 10.2 });

  // ---- Naksa : traversée du Jourdain (ponts Allenby et Damiya)
  const flows = [
    { seg: 'deplaces', at: 1.8, dur: 4.0, n: 130, from: [[35.45, 31.86], [35.2, 31.9], [35.1, 31.53]], to: [35.93, 31.95], travel: [2.0, 3.0], bend: 0.12, originHeat: 0.7, R: 240 },
    { seg: 'deplaces', at: 2.1, dur: 3.6, n: 90, from: [[35.26, 32.22], [35.3, 32.46]], to: [35.85, 32.25], travel: [2.0, 3.0], bend: -0.15, originHeat: 0.7, R: 220 },
  ];
  markers.push({ seg: 'deplaces', at: 4.0, label: 'Rive est du Jourdain', lon: 35.9, lat: 32.1, dir: [1, -1], endAt: 12.2 });

  // ---- Golan
  const GOLAN = [
    { at: 0.8, path: [[35.6, 33.21], [35.68, 33.22], [35.75, 33.2], [35.82, 33.12]], fire: [[2.2, [35.69, 33.22]]] },
    { at: 1.2, path: [[35.63, 32.82], [35.72, 32.86], [35.8, 32.97], [35.82, 33.1]], fire: [[3.0, [35.8, 32.97]]] },
  ];
  GOLAN.forEach((c) => {
    units.push({ seg: 'golan', at: c.at, dur: 5.5, kind: 'tank', n: 5, path: c.path, size: 18, fire: c.fire.map(([at, to]) => ({ at, to })) });
    arrows.push({ seg: 'golan', at: c.at - 0.2, dur: 5.6, path: c.path, w: 10 });
  });
  units.push({ seg: 'golan', at: 0.4, dur: 2.6, kind: 'plane', n: 2, path: [[35.3, 33.0], [35.9, 33.15], [36.4, 33.3]], alt: 50, size: 26 });
  zones.push({ seg: 'golan', at: 1.2, dur: 5.0, name: 'golan', from: [35.6, 33.05] });
  markers.push({ seg: 'golan', at: 6.0, label: 'Quneitra · 10 juin', lon: 35.82, lat: 33.12, dir: [1, -1], endAt: 9.2 });

  // ---- fin : les territoires occupés
  [['Sinaï · rendu à l’Égypte en 1982', 33.6, 29.6, [-1, 1]], ['Gaza', 34.42, 31.45, [-1, -1]], ['Cisjordanie · Jérusalem-Est', 35.25, 31.95, [1, -1]], ['Golan', 35.78, 33.0, [1, -1]]]
    .forEach(([label, lon, lat, dir], i) => markers.push({ seg: 'fin', at: 1.4 + 0.35 * i, label, lon, lat, dir, off: 34, hideAt: 3.9 }));

  const clock = [
    { seg: 'frappe', at: 0.2, text: '5 juin 1967 · 7 h 45' },
    { seg: 'sinai', at: 0.2, text: '5 juin 1967' }, { seg: 'sinai', at: 4.0, text: '6 juin 1967' }, { seg: 'sinai', at: 8.4, text: '8 juin · canal de Suez' },
    { seg: 'cisjordanie', at: 0.2, text: '5 juin 1967' }, { seg: 'cisjordanie', at: 6.3, text: '7 juin · Jérusalem-Est' },
    { seg: 'maghrebins', at: 0.2, text: 'Nuit du 10 au 11 juin' },
    { seg: 'deplaces', at: 0.2, text: 'Juin 1967' },
    { seg: 'golan', at: 0.2, text: '9 juin 1967' }, { seg: 'golan', at: 5.8, text: '10 juin · Quneitra' },
    { seg: 'fin', at: 0.2, text: '' },
  ];

  root.TL = root.buildTL({
    name: 'six-jours',
    seed: 1967,
    segments,
    cities: root.CITIES.filter(([n]) => !['Jaffa', 'Rishon LeZion', 'Ramallah'].includes(n)),
    markers,
    flows,
    units,
    arrows,
    zones,
    strikes,
    plans,
    blocks,
    clock,
    hud: { label: ['Sion', 'Chapitre 19 · Six jours, la Naksa'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: null },
  });
})(typeof window !== 'undefined' ? window : globalThis);
