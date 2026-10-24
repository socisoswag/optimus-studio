/*
 * Séquence « 1948, la Nakba » (chapitre 13), ≈ 1 min 30.
 *
 * La guerre de 1947-1949 vue depuis la Palestine. Tracés simplifiés d'après les grands atlas
 * historiques ; positions des villages approchées (à 1 ou 2 km). Faits et chiffres retenus :
 *   - plan Dalet (10 mars 1948) ; Deir Yassin le 9 avril ; Tibériade le 18 avril ; Haïfa les
 *     21-22 avril (une grande partie des habitants arabes fuit, beaucoup par la mer vers Acre et
 *     le Liban) ; Safed le 10 mai ; Jaffa se rend le 13 mai (environ 4 000 habitants restent sur
 *     70 000 environ) : W. Khalidi, B. Morris, Zochrot ;
 *   - 14 mai : proclamation de l'État d'Israël ; 15 mai : entrée des armées égyptienne,
 *     transjordanienne (Légion arabe), irakienne, syrienne et libanaise ; dès juillet, les forces
 *     israéliennes sont plus nombreuses que les forces arabes engagées (A. Shlaim, B. Morris) ;
 *   - 12-13 juillet, opération Dani : 50 000 à 70 000 habitants de Lydda et Ramle expulsés à
 *     pied vers l'est ;
 *   - octobre 1948 : opération Yoav (Beersheba tombe le 21 octobre), opération Hiram (Galilée,
 *     29-31 octobre) ;
 *   - 418 villages vidés (W. Khalidi, All That Remains, 1992) ; 531 localités selon
 *     S. Abu Sitta (villes et terres tribales comprises) ;
 *   - armistices de 1949 (Égypte 24 février, Liban 23 mars, Jordanie 3 avril, Syrie 20 juillet) :
 *     Israël contrôle 78 % de la Palestine mandataire ;
 *   - plus de 700 000 réfugiés ; résolution 194 de l'ONU (11 décembre 1948) sur leur retour.
 */
(function (root) {
  const segments = [
    {
      id: 'nakba', type: 'beat', dur: 6.0, hitAt: 1.0, reveal: 'slam', rgb: 14,
      kicker: 'De 1947 à 1949 · Palestine', word: 'Nakba',
      sub: '« La catastrophe » : plus de 700 000 Palestiniens chassés de leur terre.', subAt: 1.4,
      cam: { lon: 35.1, lat: 31.9, w: 0.16, pitch: 30, bearing: -4 },
      camEnd: { lon: 35.0, lat: 31.85, w: 0.12, pitch: 34, bearing: 2 },
    },
    {
      id: 'dalet', type: 'cap', dur: 14.0, fly: 1.6, anchor: [330, -60], textW: 880,
      kicker: 'Avril et mai 1948 · plan Dalet', title: 'Les villes tombent',
      text: 'Avant même l’entrée des armées arabes, Tibériade, Haïfa, Safed et Jaffa sont prises. Leurs habitants arabes [[fuient ou sont chassés]].',
      cam: { lon: 35.12, lat: 32.56, w: 0.066, pitch: 34, bearing: -6 },
      camEnd: { lon: 35.08, lat: 32.5, w: 0.06, pitch: 38, bearing: 2 },
    },
    {
      id: 'armees', type: 'cap', dur: 12.0, fly: 1.4, anchor: [300, -60], textW: 880,
      kicker: '14 et 15 mai 1948', title: 'Les armées arabes entrent',
      text: 'Le 14 mai, Ben Gourion proclame l’État d’Israël. Le 15, cinq armées arabes entrent en Palestine. Dès juillet, [[les forces israéliennes sont les plus nombreuses]].',
      cam: { lon: 35.15, lat: 32.15, w: 0.078, pitch: 36, bearing: -4 },
      camEnd: { lon: 35.1, lat: 32.1, w: 0.07, pitch: 40, bearing: 4 },
    },
    {
      id: 'lydda', type: 'cap', dur: 12.0, fly: 1.5, anchor: [300, -60], textW: 880,
      kicker: '12 et 13 juillet 1948 · opération Dani', title: 'Lydda et Ramle',
      text: 'Entre [[50 000 et 70 000 habitants]] sont expulsés et marchent vers l’est, en pleine chaleur. Beaucoup meurent en chemin.',
      cam: { lon: 35.0, lat: 31.95, w: 0.0125, pitch: 46, bearing: -6 },
      camEnd: { lon: 35.04, lat: 31.94, w: 0.0105, pitch: 50, bearing: 3 },
    },
    {
      id: 'yoav', type: 'cap', dur: 7.5, fly: 1.5, anchor: [330, -40], textW: 880,
      kicker: 'Du 15 au 22 octobre 1948 · opération Yoav', title: 'Néguev',
      text: 'Raids aériens, puis offensive au sol. Beersheba tombe le 21 octobre.',
      cam: { lon: 34.72, lat: 31.45, w: 0.03, pitch: 40, bearing: -6 },
      camEnd: { lon: 34.74, lat: 31.42, w: 0.027, pitch: 44, bearing: 0 },
    },
    {
      id: 'hiram', type: 'cap', dur: 7.5, fly: 1.6, anchor: [330, -40], textW: 880,
      kicker: 'Du 29 au 31 octobre 1948 · opération Hiram', title: 'Galilée',
      text: 'La Haute-Galilée est conquise en trois jours. Les habitants de dizaines de villages fuient ou sont chassés vers le Liban.',
      cam: { lon: 35.3, lat: 33.0, w: 0.03, pitch: 42, bearing: 2 },
      camEnd: { lon: 35.32, lat: 33.0, w: 0.027, pitch: 46, bearing: 6 },
    },
    {
      id: 'villages', type: 'stat', dur: 13.0, fly: 1.6, layout: 'L', anchor: [480, 30],
      ghost: '1948', kicker: 'De 1947 à 1949', value: 418, label: 'villages palestiniens vidés',
      text: 'La plupart sont rasés. [[Leurs habitants n’ont jamais pu revenir.]] Sur les ruines : des forêts, des parcs, de nouvelles localités.',
      textAt: 1.8, hlAt: 6.5, source: 'W. Khalidi, All That Remains · 531 localités selon S. Abu Sitta', sourceAt: 5.5,
      countAt: 0.4, countDur: 6.0,
      cam: { lon: 35.12, lat: 32.25, w: 0.05, pitch: 40, bearing: -6 },
      camEnd: { lon: 35.12, lat: 32.2, w: 0.044, pitch: 45, bearing: 3 },
    },
    {
      id: 'armistice', type: 'cap', dur: 11.0, fly: 1.5, anchor: [330, -60], textW: 880,
      kicker: 'De février à juillet 1949 · armistices', title: '78 % de la Palestine',
      text: 'Israël garde 78 % de la Palestine mandataire. La Cisjordanie passe sous contrôle jordanien, Gaza sous contrôle égyptien.',
      cam: { lon: 35.05, lat: 31.98, w: 0.1, pitch: 32, bearing: -4 },
      camEnd: { lon: 35.05, lat: 31.98, w: 0.09, pitch: 36, bearing: 3 },
    },
    {
      id: 'fin', type: 'outro', dur: 10.0, fly: 2.2, hitAt: 2.2,
      eyebrow: '11 décembre 1948 · résolution 194 de l’ONU',
      lines: ['Plus de 700 000', 'réfugiés. Leur retour,', 'voté par l’ONU,', 'jamais permis.'],
      cam: { lon: 34.95, lat: 31.7, w: 0.11, pitch: 32, bearing: 0 },
      camEnd: { lon: 35.0, lat: 31.75, w: 0.095, pitch: 36, bearing: 2 },
    },
  ];

  const units = [], strikes = [], markers = [], arrows = [], zones = [], flows = [];

  // ---- avril – mai : les villes
  // opération Nachshon : la route de Jérusalem
  const NACHSHON = [[34.86, 31.83], [34.95, 31.82], [35.02, 31.815], [35.1, 31.8], [35.15, 31.793]];
  units.push({ seg: 'dalet', at: 0.6, dur: 6.0, kind: 'truck', n: 4, path: NACHSHON, size: 15 });
  arrows.push({ seg: 'dalet', at: 0.4, dur: 6.2, path: NACHSHON, w: 9 });
  markers.push({ seg: 'dalet', at: 1.1, label: 'Deir Yassin · 9 avril', lon: 35.178, lat: 31.786, dir: [1, 1], off: 34 });
  // Tibériade
  markers.push({ seg: 'dalet', at: 1.8, label: 'Tibériade · 18 avril', lon: 35.53, lat: 32.79, erase: true, R: 60, eraseDur: 2.5, dir: [1, 1], off: 34 });
  flows.push({ seg: 'dalet', at: 2.2, dur: 2.6, n: 30, from: [[35.53, 32.79]], to: [35.31, 32.7], travel: [1.6, 2.4], bend: 0.2, originHeat: 0.6, R: 120 });
  // Haïfa : obus de mortier sur les quartiers arabes, fuite par la mer vers Acre et le Liban
  for (let j = 0; j < 6; j++) strikes.push({ seg: 'dalet', at: 3.0 + j * 0.28, lon: 34.99 + (j % 3) * 0.012, lat: 32.81 + (j % 2) * 0.01, power: 0.5, burn: 4 });
  markers.push({ seg: 'dalet', at: 3.4, label: 'Haïfa · 22 avril', lon: 34.99, lat: 32.81, erase: true, R: 80, eraseDur: 3.0, dir: [-1, -1], off: 40 });
  units.push({ seg: 'dalet', at: 4.0, dur: 3.2, kind: 'ship', n: 2, path: [[34.995, 32.83], [35.01, 32.87], [35.05, 32.905], [35.065, 32.92]], size: 18 });
  units.push({ seg: 'dalet', at: 4.4, dur: 6.0, kind: 'ship', n: 3, path: [[34.98, 32.84], [34.96, 32.98], [35.06, 33.2], [35.15, 33.45]], size: 18 });
  flows.push({ seg: 'dalet', at: 4.2, dur: 3.4, n: 70, from: [[34.99, 32.81]], to: [35.28, 33.15], travel: [2.0, 3.0], bend: -0.15, originHeat: 0.7, R: 160 });
  // Safed : tirs de mortier, la ville se vide vers le nord
  for (let j = 0; j < 4; j++) strikes.push({ seg: 'dalet', at: 5.9 + j * 0.3, lon: 35.495 + (j % 2) * 0.01, lat: 32.962 + (j % 3) * 0.006, power: 0.45, burn: 3.5 });
  markers.push({ seg: 'dalet', at: 6.4, label: 'Safed · 10 mai', lon: 35.5, lat: 32.965, erase: true, R: 60, eraseDur: 2.5, dir: [1, -1], off: 34 });
  flows.push({ seg: 'dalet', at: 6.8, dur: 2.6, n: 40, from: [[35.5, 32.965]], to: [35.62, 33.22], travel: [1.6, 2.4], bend: 0.15, originHeat: 0.6, R: 120 });
  // Jaffa : bombardée depuis fin avril, se rend le 13 mai ; fuite par la mer vers Gaza
  for (let j = 0; j < 7; j++) strikes.push({ seg: 'dalet', at: 8.0 + j * 0.24, lon: 34.75 + (j % 3) * 0.008, lat: 32.045 + (j % 2) * 0.008, power: 0.5, burn: 4 });
  markers.push({ seg: 'dalet', at: 8.8, label: 'Jaffa · 13 mai', lon: 34.752, lat: 32.05, erase: true, R: 80, eraseDur: 3.0, dir: [-1, -1], off: 40 });
  units.push({ seg: 'dalet', at: 9.4, dur: 4.2, kind: 'ship', n: 3, path: [[34.74, 32.05], [34.66, 31.9], [34.53, 31.66], [34.45, 31.53]], size: 18 });
  flows.push({ seg: 'dalet', at: 9.4, dur: 3.2, n: 60, from: [[34.752, 32.05]], to: [34.47, 31.52], travel: [2.0, 3.0], bend: 0.1, originHeat: 0.7, R: 160 });

  // ---- 15 mai : les armées arabes (flèches couleur pierre)
  const ARAB = [
    { at: 0.8, label: 'Égypte', path: [[34.25, 31.22], [34.42, 31.45], [34.58, 31.68], [34.65, 31.77]] },
    { at: 1.1, label: '', path: [[34.45, 30.95], [34.79, 31.25], [35.1, 31.53], [35.2, 31.7]] },
    { at: 1.4, label: 'Légion arabe', path: [[35.75, 31.97], [35.5, 31.88], [35.32, 31.83], [35.24, 31.785]] },
    { at: 1.9, label: '', path: [[35.36, 31.86], [35.18, 31.86], [34.99, 31.84]] },
    { at: 1.7, label: 'Irak', path: [[35.62, 32.62], [35.45, 32.5], [35.3, 32.4], [35.18, 32.3]] },
    { at: 2.0, label: 'Syrie', path: [[35.78, 32.74], [35.66, 32.71], [35.585, 32.7]] },
    { at: 2.3, label: 'Liban', path: [[35.56, 33.27], [35.52, 33.12]] },
  ];
  ARAB.forEach((a) => {
    arrows.push({ seg: 'armees', at: a.at, dur: 4.2, path: a.path, w: 10, label: a.label, tone: 'stone' });
    units.push({ seg: 'armees', at: a.at + 0.2, dur: 4.2, kind: 'truck', n: 3, path: a.path, size: 14 });
  });
  markers.push({ seg: 'armees', at: 0.5, label: 'Tel-Aviv · 14 mai', lon: 34.78, lat: 32.08, dir: [-1, -1], off: 36, endAt: 12.2 });

  // ---- Lydda et Ramle
  units.push({ seg: 'lydda', at: 0.5, dur: 3.2, kind: 'truck', n: 4, path: [[34.95, 32.06], [34.93, 32.0], [34.9, 31.958]], size: 18 });
  units.push({ seg: 'lydda', at: 0.8, dur: 3.0, kind: 'truck', n: 3, path: [[34.8, 31.86], [34.84, 31.9], [34.862, 31.925]], size: 18 });
  arrows.push({ seg: 'lydda', at: 0.3, dur: 3.4, path: [[34.95, 32.06], [34.93, 32.0], [34.9, 31.958]], w: 11 });
  arrows.push({ seg: 'lydda', at: 0.6, dur: 3.2, path: [[34.8, 31.86], [34.84, 31.9], [34.862, 31.925]], w: 11 });
  markers.push({ seg: 'lydda', at: 2.6, label: 'Lydda', lon: 34.895, lat: 31.951, erase: true, R: 110, eraseDur: 5.0, dir: [-1, -1], off: 40, endAt: 12.3 });
  markers.push({ seg: 'lydda', at: 2.9, label: 'Ramle', lon: 34.866, lat: 31.928, erase: true, R: 110, eraseDur: 5.0, dir: [-1, 1], off: 40, endAt: 12.3 });
  flows.push({ seg: 'lydda', at: 3.4, dur: 6.0, n: 200, from: [[34.895, 31.951], [34.866, 31.928]], to: [35.19, 31.9], travel: [3.5, 5.5], bend: 0.08, originHeat: 0.8, R: 220 });

  // ---- octobre : Néguev (Yoav) puis Galilée (Hiram)
  const YOAV = [[34.66, 31.66], [34.74, 31.48], [34.79, 31.27]];
  units.push({ seg: 'yoav', at: 0.2, dur: 2.0, kind: 'plane', n: 3, path: [[34.7, 31.95], [34.55, 31.7], [34.47, 31.52]], alt: 50, size: 24 });
  [[34.47, 31.52], [34.5, 31.5], [34.573, 31.668]].forEach(([lon, lat], j) => strikes.push({ seg: 'yoav', at: 2.1 + 0.25 * j, lon, lat, power: 0.6, burn: 4 }));
  [[34.71, 31.6], [34.745, 31.62], [34.76, 31.45]].forEach(([lon, lat], j) => strikes.push({ seg: 'yoav', at: 2.6 + 0.5 * j, lon, lat, power: 0.5, burn: 3.5 }));
  arrows.push({ seg: 'yoav', at: 1.8, dur: 3.4, path: YOAV, w: 11 });
  units.push({ seg: 'yoav', at: 2.0, dur: 3.4, kind: 'truck', n: 4, path: YOAV, size: 16 });
  markers.push({ seg: 'yoav', at: 5.2, label: 'Beersheba · 21 octobre', lon: 34.79, lat: 31.25, erase: true, R: 70, eraseDur: 2.5, dir: [1, 1], off: 36 });
  const HIRAM = [
    [[35.5, 32.96], [35.45, 33.0], [35.39, 33.03]],
    [[35.12, 33.0], [35.26, 33.02], [35.38, 33.03]],
    [[35.51, 33.1], [35.45, 33.07], [35.4, 33.04]],
  ];
  HIRAM.forEach((p, i) => {
    arrows.push({ seg: 'hiram', at: 1.2 + 0.25 * i, dur: 2.8, path: p, w: 10 });
    units.push({ seg: 'hiram', at: 1.4 + 0.25 * i, dur: 2.8, kind: 'truck', n: 3, path: p, size: 15 });
  });
  flows.push({ seg: 'hiram', at: 3.2, dur: 3.0, n: 110, from: [[35.3, 33.0], [35.42, 32.98], [35.25, 32.9], [35.45, 33.04]], to: [35.45, 33.3], travel: [1.8, 2.8], bend: -0.1, originHeat: 0.7, R: 200 });

  // ---- les villages : chaque point s'éteint (positions approchées)
  const VILLAGES = [
    ['al-Zib', 35.105, 33.05], ['al-Bassa', 35.143, 33.075, [-1, -1]], ['al-Kabri', 35.15, 33.01], ['Iqrit', 35.29, 33.073, [1, -1]],
    ['Kafr Bir’im', 35.414, 33.043, [1, -1]], ['Safsaf', 35.445, 33.012], ['Ayn al-Zaytun', 35.497, 32.985],
    ['Saffuriya', 35.279, 32.749, [-1, -1]], ['Lubya', 35.43, 32.776], ['Hittin', 35.45, 32.8], ['Balad al-Shaykh', 35.05, 32.77],
    ['Ayn Hawd', 34.982, 32.697], ['Ijzim', 34.995, 32.648], ['al-Tantura', 34.918, 32.607, [-1, -1]], ['al-Lajjun', 35.17, 32.57],
    ['Zir’in', 35.32, 32.56], ['Beisan', 35.5, 32.5, [1, 1]], ['Qaqun', 34.99, 32.36], ['al-Shaykh Muwannis', 34.803, 32.113, [-1, -1]],
    ['Salama', 34.808, 32.046], ['Yazur', 34.81, 32.03], ['Bayt Dajan', 34.83, 31.995], ['Abu Shusha', 34.9, 31.86], ['Yibna', 34.744, 31.866],
    ['Isdud', 34.655, 31.755, [-1, -1]], ['Zakariyya', 34.946, 31.705], ['Bayt Jibrin', 34.896, 31.603], ['al-Dawayima', 34.918, 31.535, [1, 1]],
    ['al-Faluja', 34.745, 31.624], ['Iraq al-Manshiyya', 34.775, 31.611], ['Bayt Mahsir', 35.04, 31.8], ['al-Qastal', 35.149, 31.793],
    ['Lifta', 35.197, 31.795, [1, -1]], ['Deir Yassin', 35.178, 31.786, [1, 1]], ['Ayn Karim', 35.161, 31.768], ['al-Maliha', 35.18, 31.75],
  ];
  VILLAGES.forEach(([n, lon, lat, dir], i) => {
    const at = 1.0 + (i / VILLAGES.length) * 5.6;
    markers.push({ seg: 'villages', at, label: dir ? n : '', lon, lat, erase: true, ghost: true, R: 60, eraseDur: 1.6, dir: dir || [1, -1], off: 30 });
    strikes.push({ seg: 'villages', at: at + 0.3, lon, lat, power: 0.25, burn: 1.4 });
  });

  // ---- armistices de 1949
  zones.push({ seg: 'armistice', at: 0.8, dur: 3.2, name: 'israel-1949', from: [35.4, 33.1] });
  zones.push({ seg: 'armistice', at: 3.6, dur: 1.4, name: 'cisjordanie', from: [35.3, 32.0], tone: 'stone' });
  zones.push({ seg: 'armistice', at: 4.0, dur: 1.0, name: 'gaza', from: [34.4, 31.45], tone: 'stone' });
  markers.push({ seg: 'armistice', at: 2.4, label: 'Israël · 78 %', lon: 35.05, lat: 32.55, dir: [-1, -1], off: 40 });
  markers.push({ seg: 'armistice', at: 4.4, label: 'Cisjordanie · Jordanie', lon: 35.3, lat: 32.05, dir: [1, -1], off: 40 });
  markers.push({ seg: 'armistice', at: 4.8, label: 'Gaza · Égypte', lon: 34.4, lat: 31.42, dir: [-1, 1], off: 40 });

  // chaque repère s'efface à la fin de sa séquence
  const DUR = Object.fromEntries(segments.map((sg) => [sg.id, sg.dur]));
  markers.forEach((m) => { if (m.endAt === undefined) m.endAt = DUR[m.seg] + 0.3; });

  const clock = [
    { seg: 'dalet', at: 0.2, text: 'Avril 1948' }, { seg: 'dalet', at: 7.6, text: 'Mai 1948' },
    { seg: 'armees', at: 0.2, text: '15 mai 1948' },
    { seg: 'lydda', at: 0.2, text: '12 juillet 1948' }, { seg: 'lydda', at: 5.0, text: '13 juillet 1948' },
    { seg: 'yoav', at: 0.2, text: '15 octobre 1948' }, { seg: 'yoav', at: 5.0, text: '21 octobre 1948' }, { seg: 'hiram', at: 0.2, text: '29 octobre 1948' },
    { seg: 'villages', at: 0.2, text: '1948 et 1949' },
    { seg: 'armistice', at: 0.2, text: '1949' },
    { seg: 'fin', at: 0.2, text: '' },
  ];

  root.TL = root.buildTL({
    name: 'nakba-1948',
    seed: 1948,
    segments,
    relief: true,
    cities: root.CITIES.filter(([n]) => !['Jaffa', 'Rishon LeZion', 'Le Golan', 'Sinaï', 'Eilat'].includes(n)),
    markers,
    flows,
    units,
    arrows,
    zones,
    strikes,
    clock,
    hud: { label: ['Sion', 'Chapitre 13 · 1948, la Nakba'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: null },
  });
})(typeof window !== 'undefined' ? window : globalThis);
