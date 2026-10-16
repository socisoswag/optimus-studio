/*
 * Séquence « Suez, 1956 » (chapitre 19), ≈ 1 min 10.
 *
 * Tracés simplifiés ; positions approchées. Faits et chiffres retenus :
 *   - 26 juillet 1956 : Nasser nationalise la Compagnie du canal de Suez ; 22-24 octobre : protocole
 *     secret de Sèvres entre Israël, la France et le Royaume-Uni ;
 *   - 29 octobre : opération Kadesh, parachutistes israéliens au col de Mitla, blindés à travers le
 *     Sinaï ; Gaza occupée ; Charm el-Cheikh prise le 5 novembre ;
 *   - 29 octobre au soir, Kafr Qassem : la police des frontières tue 49 villageois, citoyens
 *     d'Israël, qui rentraient des champs sans connaître le couvre-feu décrété dans l'après-midi ;
 *   - 31 octobre - 6 novembre : opération Mousquetaire, bombardements franco-britanniques des bases
 *     égyptiennes, débarquement à Port-Saïd le 6 novembre ; cessez-le-feu sous la pression des
 *     États-Unis et de l'URSS ;
 *   - Gaza occupée : environ 275 morts à Khan Younès le 3 novembre, 111 à Rafah le 12 novembre
 *     (rapport de l'UNRWA) ;
 *   - mars 1957 : Israël se retire du Sinaï et de Gaza ; casques bleus de la FUNU.
 */
(function (root) {
  const segments = [
    {
      id: 'suez', type: 'beat', dur: 6.0, hitAt: 1.0, reveal: 'slam', rgb: 14,
      kicker: '29 octobre — 7 novembre 1956', word: 'Suez',
      sub: 'Israël, la France et le Royaume-Uni attaquent l’Égypte de Nasser.', subAt: 1.4,
      cam: { lon: 32.9, lat: 30.6, w: 0.12, pitch: 30, bearing: -4 },
      camEnd: { lon: 32.9, lat: 30.6, w: 0.1, pitch: 34, bearing: 2 },
    },
    {
      id: 'canal', type: 'cap', dur: 9.5, fly: 1.5, anchor: [300, -60], textW: 900,
      kicker: '26 juillet — 24 octobre 1956', title: 'Le canal nationalisé',
      text: 'Nasser nationalise la Compagnie du canal de Suez. À Sèvres, Israël, la France et le Royaume-Uni préparent la guerre en secret.',
      cam: { lon: 32.55, lat: 30.55, w: 0.03, pitch: 44, bearing: -14 },
      camEnd: { lon: 32.55, lat: 30.6, w: 0.027, pitch: 48, bearing: -8 },
    },
    {
      id: 'kadesh', type: 'cap', dur: 12.0, fly: 1.5, anchor: [300, -60], textW: 900,
      kicker: '29 octobre — 5 novembre 1956 · opération Kadesh', title: 'Le Sinaï envahi',
      text: 'Des parachutistes israéliens sautent sur le col de Mitla. Les blindés traversent le Sinaï jusqu’au canal ; la bande de Gaza est occupée.',
      cam: { lon: 33.4, lat: 30.3, w: 0.07, pitch: 40, bearing: -4 },
      camEnd: { lon: 33.3, lat: 30.2, w: 0.064, pitch: 44, bearing: 2 },
    },
    {
      id: 'kafr', type: 'cap', dur: 11.0, fly: 1.8, anchor: [330, -150], textW: 900,
      kicker: '29 octobre 1956, au soir · Israël', title: 'Kafr Qassem',
      text: 'La police des frontières israélienne abat [[49 villageois palestiniens]], citoyens d’Israël, qui rentraient des champs sans savoir qu’un couvre-feu venait d’être décrété.',
      cam: { lon: 34.9745, lat: 32.1138, w: 0.00048, pitch: 52, bearing: -10 },
      camEnd: { lon: 34.9745, lat: 32.1138, w: 0.0004, pitch: 56, bearing: 2 },
    },
    {
      id: 'mousquetaire', type: 'cap', dur: 11.0, fly: 1.8, anchor: [300, -60], textW: 900,
      kicker: '31 octobre — 6 novembre 1956 · opération Mousquetaire', title: 'Paris et Londres bombardent',
      text: 'Les aviations française et britannique détruisent l’aviation égyptienne au sol. Le 6 novembre, leurs troupes débarquent à Port-Saïd.',
      cam: { lon: 32.0, lat: 30.8, w: 0.04, pitch: 42, bearing: -10 },
      camEnd: { lon: 32.15, lat: 30.95, w: 0.034, pitch: 46, bearing: -4 },
    },
    {
      id: 'gaza56', type: 'cap', dur: 11.0, fly: 1.6, anchor: [300, -60], textW: 900,
      kicker: 'Novembre 1956 · Gaza occupée', title: 'Khan Younès et Rafah',
      text: 'L’armée israélienne tue environ 275 personnes à Khan Younès le 3 novembre, et 111 à Rafah le 12 novembre, selon l’UNRWA.',
      cam: { lon: 34.33, lat: 31.36, w: 0.0105, pitch: 46, bearing: -44 },
      camEnd: { lon: 34.32, lat: 31.35, w: 0.0094, pitch: 50, bearing: -40 },
    },
    {
      id: 'fin', type: 'outro', dur: 9.0, fly: 2.0, hitAt: 1.2,
      eyebrow: 'Mars 1957 · sous la pression de Washington et de Moscou',
      lines: ['Huit jours de guerre.', 'Israël doit rendre', 'le Sinaï et Gaza.'],
      cam: { lon: 33.4, lat: 30.6, w: 0.1, pitch: 34, bearing: 0 },
      camEnd: { lon: 33.4, lat: 30.6, w: 0.09, pitch: 38, bearing: 2 },
    },
  ];

  const units = [], strikes = [], markers = [], arrows = [], zones = [], plans = [], blocks = [], flares = [];
  const rnd = (() => { let a = 1956; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();

  // ---- le canal
  const CANAL = [[32.31, 31.26], [32.31, 31.0], [32.33, 30.75], [32.28, 30.6], [32.33, 30.45], [32.42, 30.3], [32.5, 30.1], [32.55, 29.95]];
  plans.push({ seg: 'canal', at: 0.6, dur: 3.2, any: true, path: CANAL, style: 'focus', label: 'Canal de Suez', labelAt: [32.12, 30.6], until: 76 });
  [['Port-Saïd', 32.3, 31.26, [1, -1]], ['Ismaïlia', 32.27, 30.6, [1, -1]], ['Suez', 32.55, 29.97, [1, 1]]]
    .forEach(([label, lon, lat, dir], i) => markers.push({ seg: 'canal', at: 1.6 + 0.5 * i, label, lon, lat, dir, off: 34 }));
  units.push({ seg: 'canal', at: 1.0, dur: 7.5, kind: 'ship', n: 2, path: [[32.31, 31.3], [32.31, 31.0], [32.33, 30.75], [32.28, 30.6]], size: 18, until: 9.6 });

  // ---- Kadesh : parachutage sur Mitla, trois axes de blindés, Charm el-Cheikh
  units.push({ seg: 'kadesh', at: 0.3, dur: 2.4, kind: 'plane', n: 4, path: [[34.6, 30.6], [33.8, 30.3], [32.95, 30.02]], alt: 60, size: 26 });
  for (let j = 0; j < 10; j++) flares.push({ seg: 'kadesh', at: 2.4 + j * 0.12, lon: 32.93 + (rnd() - 0.5) * 0.12, lat: 30.02 + (rnd() - 0.5) * 0.08, dur: 3.0, alt: 160 });
  markers.push({ seg: 'kadesh', at: 2.8, label: 'Col de Mitla · parachutistes', lon: 32.93, lat: 30.02, dir: [-1, -1], off: 40 });
  const AXES = [
    { at: 1.4, path: [[34.25, 31.28], [33.8, 31.13], [33.2, 31.05], [32.4, 31.0]], fire: [[3.4, [33.8, 31.12]]] },
    { at: 1.8, path: [[34.45, 30.9], [34.1, 30.85], [33.6, 30.6], [32.6, 30.5]], fire: [[3.0, [34.1, 30.85]]] },
    { at: 2.2, path: [[34.8, 29.9], [34.2, 29.95], [33.4, 30.0], [32.95, 30.02]], fire: [] },
    { at: 3.4, path: [[34.9, 29.55], [34.7, 28.9], [34.5, 28.3], [34.33, 27.92]], fire: [] },
  ];
  AXES.forEach((a) => {
    arrows.push({ seg: 'kadesh', at: a.at - 0.2, dur: 6.0, path: a.path, w: 11 });
    units.push({ seg: 'kadesh', at: a.at, dur: 6.0, kind: 'tank', n: 4, path: a.path, size: 15, fire: a.fire.map(([at, to]) => ({ at, to })) });
  });
  markers.push({ seg: 'kadesh', at: 9.0, label: 'Charm el-Cheikh · 5 novembre', lon: 34.33, lat: 27.92, dir: [1, -1], off: 36 });
  zones.push({ seg: 'kadesh', at: 3.0, dur: 6.5, name: 'sinai', from: [34.5, 30.5], until: 12.4 });
  zones.push({ seg: 'kadesh', at: 1.6, dur: 1.4, name: 'gaza', from: [34.45, 31.5], until: 12.4 });

  // ---- Kafr Qassem : le village, l'entrée où les ouvriers sont arrêtés
  const mLon = 1 / 94300, mLat = 1 / 111000;
  for (let gy = -12; gy <= 12; gy++) for (let gx = -12; gx <= 12; gx++) {
    if (rnd() < 0.3 || gx * gx + gy * gy > 135) continue;
    const lon = 34.9765 + gx * 18 * mLon + (rnd() - 0.5) * 6 * mLon, lat = 32.1145 + gy * 18 * mLat + (rnd() - 0.5) * 6 * mLat;
    blocks.push({ seg: 'kafr', at: 0.6 + rnd() * 1.2, lon, lat, w: 9 + rnd() * 5, d: 9 + rnd() * 5, h: 3.5 + rnd() * 4, rot: 0.2 + (rnd() - 0.5) * 0.3, lit: rnd() < 0.35 });
  }
  plans.push({ seg: 'kafr', at: 0.5, dur: 1.2, style: 'grid', bbox: [34.968, 32.105, 34.985, 32.123], step: 25 });
  plans.push({ seg: 'kafr', at: 1.4, dur: 2.0, path: [[34.9705, 32.1118], [34.9722, 32.1127], [34.9738, 32.1134]], style: 'focus', label: 'Entrée ouest du village', labelAt: [34.9712, 32.1135], labelAt2: 0.6 });
  units.push({ seg: 'kafr', at: 1.6, dur: 1.0, kind: 'truck', n: 2, path: [[34.9712, 32.1118], [34.9722, 32.1124]], size: 24, until: 11.3 });
  markers.push({ seg: 'kafr', at: 4.0, label: '49 morts · dont 23 enfants', lon: 34.9726, lat: 32.1128, dir: [-1, -1], off: 90 });

  // ---- Mousquetaire : bases bombardées, débarquement à Port-Saïd
  const BASES = [[30.92, 30.12], [31.4, 30.09], [31.45, 30.33], [32.08, 30.55], [32.45, 30.2]];
  units.push({ seg: 'mousquetaire', at: 0.3, dur: 2.6, kind: 'plane', n: 4, path: [[32.9, 34.5], [32.4, 32.6], [31.6, 30.8], [31.0, 30.15]], alt: 60, size: 26 });
  units.push({ seg: 'mousquetaire', at: 0.8, dur: 2.4, kind: 'plane', n: 3, path: [[33.4, 32.2], [32.7, 31.3], [32.1, 30.56]], alt: 60, size: 26 });
  BASES.forEach(([lon, lat], i) => { for (let j = 0; j < 3; j++) strikes.push({ seg: 'mousquetaire', at: 2.6 + 0.3 * i + 0.15 * j, lon: lon + (j - 1) * 0.03, lat: lat + (j % 2 ? 0.015 : -0.015), power: 0.85, burn: 6 }); });
  units.push({ seg: 'mousquetaire', at: 5.4, dur: 3.2, kind: 'ship', n: 5, path: [[32.6, 31.9], [32.45, 31.55], [32.32, 31.3]], size: 22 });
  for (let j = 0; j < 8; j++) strikes.push({ seg: 'mousquetaire', at: 7.4 + rnd() * 2.4, lon: 32.29 + rnd() * 0.04, lat: 31.24 + rnd() * 0.03, power: 0.6, burn: 4 });
  markers.push({ seg: 'mousquetaire', at: 8.4, label: 'Port-Saïd · 6 novembre', lon: 32.3, lat: 31.26, dir: [1, -1], off: 36 });

  // ---- Gaza occupée : Khan Younès, Rafah
  units.push({ seg: 'gaza56', at: 0.6, dur: 3.0, kind: 'tank', n: 5, path: [[34.4, 31.24], [34.33, 31.31], [34.31, 31.345]], size: 18 });
  markers.push({ seg: 'gaza56', at: 3.0, label: 'Khan Younès · 3 novembre · ~275 morts', lon: 34.305, lat: 31.345, erase: true, ghost: true, R: 90, eraseDur: 3, dir: [1, -1], off: 50 });
  markers.push({ seg: 'gaza56', at: 6.0, label: 'Rafah · 12 novembre · 111 morts', lon: 34.25, lat: 31.285, erase: true, ghost: true, R: 90, eraseDur: 3, dir: [1, 1], off: 50 });
  zones.push({ seg: 'gaza56', at: 0.4, dur: 1.2, name: 'gaza', from: [34.3, 31.35] });

  const DUR = Object.fromEntries(segments.map((sg) => [sg.id, sg.dur]));
  markers.forEach((m) => { if (m.endAt === undefined) m.endAt = DUR[m.seg] + 0.3; });

  const clock = [
    { seg: 'canal', at: 0.2, text: '26 juillet 1956' }, { seg: 'canal', at: 5.0, text: '24 octobre 1956 · Sèvres' },
    { seg: 'kadesh', at: 0.2, text: '29 octobre 1956' }, { seg: 'kadesh', at: 8.8, text: '5 novembre 1956' },
    { seg: 'kafr', at: 0.2, text: '29 octobre 1956 · 17 h' },
    { seg: 'mousquetaire', at: 0.2, text: '31 octobre 1956' }, { seg: 'mousquetaire', at: 7.0, text: '6 novembre 1956' },
    { seg: 'gaza56', at: 0.2, text: '3 novembre 1956' }, { seg: 'gaza56', at: 5.8, text: '12 novembre 1956' },
    { seg: 'fin', at: 0.2, text: '' },
  ];

  root.TL = root.buildTL({
    name: 'suez-1956',
    seed: 1956,
    segments,
    cities: root.CITIES.filter(([n]) => !['Jaffa', 'Rishon LeZion', 'Le Golan', 'Eilat', 'Suez', 'Port-Saïd'].includes(n)),
    markers,
    units,
    arrows,
    zones,
    strikes,
    plans,
    blocks,
    flares,
    clock,
    hud: { label: ['Sion', 'Chapitre 19 · Suez, 1956'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: null },
  });
})(typeof window !== 'undefined' ? window : globalThis);
