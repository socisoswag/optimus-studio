/*
 * Séquence « Liban, 1982 » (chapitre 20), ≈ 1 min 20.
 *
 * L'invasion, le siège de Beyrouth-Ouest, le départ de l'OLP, Sabra et Chatila. Tracés simplifiés ;
 * plan des camps approché. Faits et chiffres retenus :
 *   - 3 juin 1982 : l'ambassadeur israélien à Londres est blessé par le groupe d'Abou Nidal, ennemi
 *     de l'OLP ; 6 juin : opération « Paix en Galilée » ; débarquement à l'embouchure de l'Awali ;
 *     9 juin : destruction des batteries syriennes de la Bekaa ;
 *   - siège de Beyrouth-Ouest de la mi-juin à la mi-août ; eau et électricité coupées ; 12 août :
 *     le bombardement le plus lourd ;
 *   - police libanaise : 19 085 morts du 4 juin au 31 août 1982, dont 6 775 à Beyrouth (84 % de
 *     civils) ;
 *   - 21 août – 1er septembre : plus de 14 000 combattants de l'OLP évacués de Beyrouth ; Arafat
 *     embarque le 30 août, l'OLP s'installe à Tunis ;
 *   - 16-18 septembre : massacre de Sabra et Chatila par les Phalanges libanaises, dans un secteur
 *     encerclé par l'armée israélienne, qui tire des fusées éclairantes ; poste de commandement
 *     israélien à 200 m environ au sud-ouest de Chatila (rapport Kahan) ; de 700-800 morts
 *     (renseignement israélien) à 2 000-3 500 selon d'autres sources ;
 *   - février 1983 : la commission Kahan conclut à la « responsabilité personnelle » d'Ariel Sharon ;
 *   - 16 décembre 1982 : résolution 37/123 D de l'Assemblée générale : « le massacre était un acte
 *     de génocide ».
 */
(function (root) {
  const segments = [
    {
      id: 'liban', type: 'beat', dur: 6.0, hitAt: 1.0, reveal: 'slam', rgb: 14,
      kicker: '6 juin 1982 · opération « Paix en Galilée »', word: 'Liban',
      sub: 'L’armée israélienne envahit le Liban pour en chasser l’OLP.', subAt: 1.4,
      cam: { lon: 35.4, lat: 33.4, w: 0.09, pitch: 30, bearing: -4 },
      camEnd: { lon: 35.45, lat: 33.45, w: 0.07, pitch: 34, bearing: 2 },
    },
    {
      id: 'invasion', type: 'cap', dur: 12.0, fly: 1.6, anchor: [330, -50], textW: 880,
      kicker: 'Du 6 au 13 juin 1982', title: 'L’invasion',
      text: 'Le prétexte : un attentat à Londres contre l’ambassadeur israélien, commis par un groupe ennemi de l’OLP. En une semaine, les blindés sont aux portes de Beyrouth.',
      cam: { lon: 35.42, lat: 33.5, w: 0.036, pitch: 40, bearing: -10 },
      camEnd: { lon: 35.45, lat: 33.56, w: 0.032, pitch: 44, bearing: -4 },
    },
    {
      id: 'siege', type: 'cap', dur: 12.0, fly: 1.7, anchor: [330, -60], textW: 880,
      kicker: 'De la mi-juin à la mi-août 1982', title: 'Beyrouth-Ouest assiégée',
      text: 'Deux mois de bombardements, par terre, par mer et par air. Israël coupe l’eau et l’électricité de la ville.',
      cam: { lon: 35.492, lat: 33.872, w: 0.0032, pitch: 50, bearing: -12 },
      camEnd: { lon: 35.492, lat: 33.87, w: 0.0026, pitch: 54, bearing: -4 },
    },
    {
      id: 'morts', type: 'stat', dur: 11.0, fly: 1.4, layout: 'L', anchor: [470, 30],
      ghost: '1982', kicker: 'Du 4 juin au 31 août 1982', value: 19085, label: 'morts au Liban',
      text: 'Dont 6 775 à Beyrouth : [[84 % de civils]].', textAt: 1.6, hlAt: 5.5,
      source: 'Police libanaise', sourceAt: 5.0, countAt: 0.3, countDur: 4.5,
      cam: { lon: 35.5, lat: 33.865, w: 0.0045, pitch: 46, bearing: -6 },
      camEnd: { lon: 35.5, lat: 33.865, w: 0.004, pitch: 50, bearing: 2 },
    },
    {
      id: 'depart', type: 'cap', dur: 10.0, fly: 1.6, anchor: [330, -60], textW: 880,
      kicker: 'Du 21 août au 1er septembre 1982', title: 'L’OLP quitte Beyrouth',
      text: 'Plus de 14 000 combattants partent par la mer. Arafat embarque le 30 août ; l’OLP s’installe à Tunis.',
      cam: { lon: 35.46, lat: 33.915, w: 0.0075, pitch: 46, bearing: -16 },
      camEnd: { lon: 35.4, lat: 33.93, w: 0.0095, pitch: 48, bearing: -10 },
    },
    {
      id: 'sabra', type: 'cap', dur: 13.0, fly: 1.9, anchor: [340, -90], textW: 900,
      kicker: 'Beyrouth · du 16 au 18 septembre 1982', title: 'Sabra et Chatila',
      text: 'Encerclés par l’armée israélienne, qui éclaire la nuit de fusées, les camps sont livrés aux miliciens phalangistes. [[Des centaines, peut-être des milliers de civils]] sont tués.',
      cam: { lon: 35.4978, lat: 33.8648, w: 0.00048, pitch: 52, bearing: -10 },
      camEnd: { lon: 35.4976, lat: 33.8642, w: 0.00038, pitch: 57, bearing: 4 },
    },
    {
      id: 'kahan', type: 'cap', dur: 9.5, fly: 1.2, anchor: [340, -90], textW: 900,
      kicker: 'Février 1983 · commission Kahan (Israël)', title: 'Responsabilité personnelle',
      text: 'L’enquête israélienne conclut que le ministre de la Défense, Ariel Sharon, porte une « responsabilité personnelle ». Il quitte ce poste. En 2001, il devient Premier ministre.',
      faces: [root.face('sharon', { side: 'R', at: 0.9 })],
      cam: { lon: 35.4976, lat: 33.8642, w: 0.00062, pitch: 50, bearing: 8 },
      camEnd: { lon: 35.4976, lat: 33.8642, w: 0.0007, pitch: 48, bearing: 12 },
    },
    {
      id: 'fin', type: 'outro', dur: 9.0, fly: 2.0, hitAt: 1.2,
      eyebrow: '16 décembre 1982 · Assemblée générale de l’ONU',
      lines: ['Sabra et Chatila :', 'un « acte de génocide »', 'selon l’ONU.'],
      cam: { lon: 35.49, lat: 33.86, w: 0.012, pitch: 40, bearing: 0 },
      camEnd: { lon: 35.49, lat: 33.86, w: 0.01, pitch: 44, bearing: 4 },
    },
  ];

  const units = [], strikes = [], markers = [], arrows = [], zones = [], plans = [], blocks = [], flares = [], lights = [];
  const rnd = (() => { let a = 1982; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();

  // ---- l'invasion : la côte, le centre, la Bekaa ; débarquement sur l'Awali
  const COAST = [[35.11, 33.11], [35.19, 33.24], [35.25, 33.36], [35.33, 33.5], [35.39, 33.61], [35.45, 33.72], [35.47, 33.79]];
  const CENTER = [[35.55, 33.25], [35.49, 33.38], [35.58, 33.54], [35.6, 33.68], [35.6, 33.79]];
  const BEKAA = [[35.66, 33.3], [35.69, 33.4], [35.75, 33.52], [35.8, 33.62]];
  [[COAST, 0.6, 8.6], [CENTER, 1.0, 7.8], [BEKAA, 1.4, 6.0]].forEach(([p, at, dur]) => {
    arrows.push({ seg: 'invasion', at: at - 0.2, dur, path: p, w: 11 });
    units.push({ seg: 'invasion', at, dur, kind: 'tank', n: 5, path: p, size: 16 });
  });
  units.push({ seg: 'invasion', at: 1.6, dur: 3.0, kind: 'ship', n: 3, path: [[35.18, 33.5], [35.3, 33.57], [35.375, 33.59]], size: 18 });
  units.push({ seg: 'invasion', at: 0.4, dur: 2.2, kind: 'plane', n: 3, path: [[34.9, 33.1], [35.1, 33.2], [35.3, 33.3]], alt: 50, size: 22 });
  units.push({ seg: 'invasion', at: 4.6, dur: 2.4, kind: 'plane', n: 4, path: [[35.2, 33.3], [35.55, 33.45], [35.8, 33.58]], alt: 50, size: 22 });
  const CAMPS_SUD = [[35.215, 33.235], [35.24, 33.265], [35.21, 33.27], [35.383, 33.543], [35.388, 33.548], [35.378, 33.538]];
  CAMPS_SUD.forEach(([lon, lat], j) => strikes.push({ seg: 'invasion', at: (j < 3 ? 1.9 : 3.6) + 0.3 * (j % 3), lon, lat, power: 0.7, burn: 5 }));
  [[35.72, 33.55], [35.76, 33.6], [35.8, 33.64]].forEach(([lon, lat], j) => strikes.push({ seg: 'invasion', at: 6.4 + 0.3 * j, lon, lat, power: 0.8, burn: 4.5 }));
  [[35.452, 33.728], [35.46, 33.74]].forEach(([lon, lat], j) => strikes.push({ seg: 'invasion', at: 6.2 + 0.4 * j, lon, lat, power: 0.6, burn: 4 }));
  markers.push({ seg: 'invasion', at: 2.2, label: 'Tyr · camps de Rachidiyé et Bourj al-Chemali', lon: 35.2, lat: 33.255, dir: [1, -1], off: 36 });
  markers.push({ seg: 'invasion', at: 4.0, label: 'Saïda · Aïn al-Héloué', lon: 35.38, lat: 33.548, dir: [1, 1], off: 36 });
  markers.push({ seg: 'invasion', at: 6.8, label: 'Bekaa · batteries syriennes, 9 juin', lon: 35.76, lat: 33.6, dir: [1, -1], off: 36 });
  markers.push({ seg: 'invasion', at: 8.8, label: 'Damour', lon: 35.452, lat: 33.728, dir: [-1, -1], off: 30 });

  // ---- le siège : Beyrouth-Ouest encerclée, bombardée par terre, mer et air
  const WEST = [[35.468, 33.9], [35.51, 33.902], [35.513, 33.876], [35.502, 33.845], [35.482, 33.836], [35.47, 33.86]];
  plans.push({ seg: 'siege', at: 0.6, dur: 2.2, path: WEST, closed: true, style: 'sacred', fill: 0.06, label: 'Beyrouth-Ouest', labelAt: [35.483, 33.892], big: true, until: 23.5 });
  [[35.47, 33.775, 0.6], [35.49, 33.82, 0.3], [35.54, 33.835, -0.8], [35.517, 33.872, -1.6], [35.523, 33.893, -1.9]].forEach(([lon, lat, a], i) => {
    const d = 0.002;
    units.push({ seg: 'siege', at: 0.8 + 0.15 * i, dur: 1.4, kind: 'tank', n: 3, path: [[lon - d * Math.cos(a), lat - d * Math.sin(a)], [lon, lat]], size: 18, fire: [{ at: 3 + i * 1.1, to: [35.49 + (i % 3) * 0.008, 33.87 + (i % 2) * 0.012] }], until: 23.0 });
  });
  units.push({ seg: 'siege', at: 0.6, dur: 9, kind: 'ship', n: 2, path: [[35.43, 33.87], [35.432, 33.9]], size: 20, fire: [{ at: 2.6, to: [35.48, 33.893] }, { at: 6.2, to: [35.475, 33.88] }], until: 23.0 });
  units.push({ seg: 'siege', at: 2.0, dur: 2.0, kind: 'plane', n: 3, path: [[35.42, 33.8], [35.5, 33.88], [35.58, 33.95]], alt: 50, size: 24 });
  units.push({ seg: 'siege', at: 6.8, dur: 2.0, kind: 'plane', n: 3, path: [[35.6, 33.8], [35.49, 33.87], [35.4, 33.94]], alt: 50, size: 24 });
  for (let j = 0; j < 34; j++) {
    const lon = 35.472 + rnd() * 0.036, lat = 33.842 + rnd() * 0.056;
    strikes.push({ seg: 'siege', at: 1.8 + j * 0.27 + rnd() * 0.2, lon, lat, power: 0.5 + rnd() * 0.4, burn: 6 });
  }
  markers.push({ seg: 'siege', at: 8.6, label: '12 août · le bombardement le plus lourd', lon: 35.486, lat: 33.875, dir: [1, 1], off: 40 });
  // la ville la nuit ; l'électricité coupée, les lumières s'éteignent (quelques groupes électrogènes)
  const EAST = [[35.51, 33.902], [35.56, 33.9], [35.58, 33.87], [35.56, 33.84], [35.53, 33.83], [35.502, 33.845], [35.513, 33.876]];
  lights.push({ seg: 'siege', at: 0.4, poly: EAST, n: 700, until: 23.5 });
  lights.push({ seg: 'siege', at: 0.4, poly: WEST, n: 800, off: 5.2, keep: 0.05, until: 23.5 });

  // ---- le départ : navires vers le large
  for (let w = 0; w < 4; w++) units.push({ seg: 'depart', at: 0.8 + w * 1.6, dur: 6.5, kind: 'ship', n: 3, path: [[35.515, 33.905], [35.47, 33.925], [35.38, 33.955], [35.25, 33.98]], size: 30, spacing: 2.2 });
  markers.push({ seg: 'depart', at: 1.2, label: 'Port de Beyrouth', lon: 35.515, lat: 33.903, dir: [1, -1], off: 34 });
  markers.push({ seg: 'depart', at: 5.0, label: 'Vers Tunis, Chypre, la Syrie, le Yémen', lon: 35.33, lat: 33.968, dir: [1, -1], off: 50 });

  // ---- Sabra et Chatila : plan approché, maisons, encerclement, fusées éclairantes
  const SHATILA = [[35.4968, 33.8639], [35.5002, 33.8639], [35.5004, 33.8611], [35.4970, 33.8610]];
  const SABRA = [[35.4955, 33.8695], [35.4975, 33.8695], [35.4979, 33.8644], [35.4961, 33.8644]];
  const inPoly = (x, y, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > y) !== (P[j][1] > y) && x < ((P[j][0] - P[i][0]) * (y - P[i][1])) / (P[j][1] - P[i][1]) + P[i][0]) c = !c; return c; };
  const mLon = 1 / 92500, mLat = 1 / 111000, cell = 15, ROT = 0.05;
  for (let gy = -24; gy <= 24; gy++) for (let gx = -16; gx <= 16; gx++) {
    if (rnd() < 0.24) continue; // ruelles
    const ex = gx * cell, ny = gy * cell;
    const lon = 35.4979 + (ex * Math.cos(ROT) - ny * Math.sin(ROT)) * mLon, lat = 33.8652 + (ex * Math.sin(ROT) + ny * Math.cos(ROT)) * mLat;
    if (!inPoly(lon, lat, SHATILA) && !inPoly(lon, lat, SABRA)) continue;
    blocks.push({ seg: 'sabra', at: 0.6 + rnd() * 1.4, lon: lon + (rnd() - 0.5) * 2 * mLon, lat: lat + (rnd() - 0.5) * 2 * mLat, w: 9 + rnd() * 4, d: 9 + rnd() * 4, h: 4 + rnd() * 9, rot: ROT + (rnd() - 0.5) * 0.15, lit: rnd() < 0.18 });
  }
  blocks.push({ seg: 'sabra', at: 1.2, lon: 35.4962, lat: 33.8597, w: 18, d: 14, h: 30, rot: 0.1 });
  plans.push({ seg: 'sabra', at: 0.4, dur: 1.2, style: 'grid', bbox: [35.493, 33.857, 35.503, 33.872], step: 25 });
  plans.push({ seg: 'sabra', at: 0.8, dur: 1.8, path: SHATILA, closed: true, style: 'wall', label: 'Chatila', labelAt: [35.5012, 33.8633], big: true });
  plans.push({ seg: 'sabra', at: 1.0, dur: 1.8, path: SABRA, closed: true, style: 'wall', label: 'Sabra', labelAt: [35.4951, 33.8688], big: true });
  markers.push({ seg: 'sabra', at: 2.6, label: 'Poste de commandement israélien', lon: 35.4962, lat: 33.8597, dir: [1, -1], off: 70, endAt: 22.8 });
  const RING = [[35.4945, 33.8665], [35.4948, 33.8625], [35.4975, 33.8598], [35.5012, 33.8603], [35.5018, 33.8628], [35.4995, 33.8662], [35.4985, 33.8705]];
  RING.forEach(([lon, lat], i) => units.push({ seg: 'sabra', at: 1.4 + 0.15 * i, dur: 1.2, kind: 'tank', n: 1, path: [[lon + 0.0003, lat - 0.0002], [lon, lat]], size: 22, until: 22.8 }));
  for (let j = 0; j < 26; j++) flares.push({ seg: 'sabra', at: 3.2 + j * 0.34 + rnd() * 0.2, lon: 35.4958 + rnd() * 0.0045, lat: 33.8608 + rnd() * 0.0085, dur: 4.5 + rnd() * 1.5, alt: 260 + rnd() * 120 });
  for (let j = 0; j < 14; j++) flares.push({ seg: 'kahan', at: j * 0.55 + rnd() * 0.2, lon: 35.4958 + rnd() * 0.0045, lat: 33.8608 + rnd() * 0.0085, dur: 4.5 + rnd() * 1.5, alt: 260 + rnd() * 120 });

  // chaque repère s'efface à la fin de sa séquence
  const DUR = Object.fromEntries(segments.map((sg) => [sg.id, sg.dur]));
  markers.forEach((m) => { if (m.endAt === undefined) m.endAt = DUR[m.seg] + 0.3; });

  const clock = [
    { seg: 'invasion', at: 0.2, text: '6 juin 1982' }, { seg: 'invasion', at: 6.2, text: '9 juin 1982' },
    { seg: 'siege', at: 0.2, text: 'Juin 1982' }, { seg: 'siege', at: 4.9, text: 'Juillet 1982 · électricité coupée' }, { seg: 'siege', at: 8.4, text: '12 août 1982' },
    { seg: 'morts', at: 0.2, text: 'Été 1982' },
    { seg: 'depart', at: 0.2, text: '21 août 1982' }, { seg: 'depart', at: 5.6, text: '30 août 1982' },
    { seg: 'sabra', at: 0.2, text: '16 septembre 1982 · nuit' },
    { seg: 'kahan', at: 0.2, text: 'Février 1983' },
    { seg: 'fin', at: 0.2, text: '' },
  ];

  root.TL = root.buildTL({
    name: 'liban-1982',
    relief: true,
    seed: 1982,
    segments,
    cities: root.CITIES.filter(([n]) => !['Jaffa', 'Rishon LeZion', 'Le Golan', 'Sinaï', 'Eilat'].includes(n)),
    markers,
    units,
    arrows,
    zones,
    strikes,
    plans,
    blocks,
    flares,
    lights,
    clock,
    hud: { label: ['Sion', 'Chapitre 20 · Liban, 1982'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: null },
  });
})(typeof window !== 'undefined' ? window : globalThis);
