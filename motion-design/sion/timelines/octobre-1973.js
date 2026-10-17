/*
 * Séquence « Octobre 1973 » (chapitre 21), ≈ 1 min 10.
 *
 * Guerre de Kippour pour Israël, guerre d'Octobre (ou du Ramadan) pour le monde arabe.
 * Tracés simplifiés. Faits retenus :
 *   - 6 octobre 1973 : l'Égypte franchit le canal de Suez et perce la ligne Bar-Lev ; la Syrie
 *     attaque sur le Golan ;
 *   - à partir du 10 : Israël reprend le Golan et avance vers Damas ; 15-16 octobre : franchissement
 *     du canal à Déversoir, encerclement de la IIIe armée égyptienne ; ponts aériens américain et
 *     soviétique ;
 *   - 17 octobre : les producteurs arabes de l'OPAEP réduisent leur production, puis décrètent un
 *     embargo contre les alliés d'Israël ; le prix du baril quadruple en quelques mois ;
 *   - 22 octobre : résolution 338 (cessez-le-feu, application de la 242) ;
 *   - 26-29 octobre 1974, sommet de Rabat : l'OLP, « seul représentant légitime du peuple
 *     palestinien » ; 13 novembre 1974 : Arafat à la tribune de l'ONU (« Ne laissez pas le rameau
 *     d'olivier tomber de ma main »).
 */
(function (root) {
  const segments = [
    {
      id: 'octobre', type: 'beat', dur: 6.0, hitAt: 1.0, reveal: 'slam', rgb: 14,
      kicker: 'Du 6 au 25 octobre 1973 · Kippour, Ramadan', word: 'Octobre',
      sub: 'L’Égypte et la Syrie attaquent pour reprendre le Sinaï et le Golan, occupés depuis 1967.', subAt: 1.4,
      cam: { lon: 34.2, lat: 31.4, w: 0.13, pitch: 30, bearing: -4 },
      camEnd: { lon: 34.2, lat: 31.4, w: 0.11, pitch: 34, bearing: 2 },
    },
    {
      id: 'canal', type: 'cap', dur: 11.0, fly: 1.6, anchor: [300, -60], textW: 900,
      kicker: '6 octobre 1973 · 14 h', title: 'Le canal franchi',
      text: 'L’armée égyptienne traverse le canal de Suez et perce la ligne Bar-Lev. Au nord, les chars syriens avancent sur le Golan.',
      cam: { lon: 32.55, lat: 30.5, w: 0.026, pitch: 46, bearing: -16 },
      camEnd: { lon: 32.6, lat: 30.5, w: 0.024, pitch: 50, bearing: -10 },
    },
    {
      id: 'golan', type: 'cap', dur: 9.0, fly: 1.6, anchor: [300, -60], textW: 900,
      kicker: 'Du 6 au 22 octobre 1973', title: 'Le Golan',
      text: 'Les Syriens percent, puis sont repoussés. L’armée israélienne avance jusqu’à une quarantaine de kilomètres de Damas.',
      cam: { lon: 35.85, lat: 33.1, w: 0.03, pitch: 46, bearing: 6 },
      camEnd: { lon: 35.9, lat: 33.15, w: 0.028, pitch: 50, bearing: 10 },
    },
    {
      id: 'contre', type: 'cap', dur: 11.0, fly: 1.6, anchor: [300, -60], textW: 900,
      kicker: 'Du 15 au 24 octobre 1973', title: 'La contre-offensive',
      text: 'Israël franchit le canal à son tour et encercle la IIIe armée égyptienne. Washington et Moscou ravitaillent chacun leur camp par avion.',
      cam: { lon: 32.5, lat: 30.3, w: 0.03, pitch: 46, bearing: -14 },
      camEnd: { lon: 32.45, lat: 30.25, w: 0.028, pitch: 50, bearing: -8 },
    },
    {
      id: 'petrole', type: 'cap', dur: 10.0, fly: 1.8, anchor: [300, -40], textW: 900,
      kicker: '17 octobre 1973 · l’arme du pétrole', title: 'Le choc pétrolier',
      text: 'Les producteurs arabes réduisent leur production et frappent d’embargo les alliés d’Israël. [[Le prix du baril est multiplié par quatre.]]',
      cam: { lon: 44.0, lat: 28.5, w: 0.26, pitch: 36, bearing: -4 },
      camEnd: { lon: 44.5, lat: 28.5, w: 0.23, pitch: 40, bearing: 2 },
    },
    {
      id: 'rabat', type: 'cap', dur: 10.0, fly: 1.8, anchor: [300, -60], textW: 900,
      kicker: 'Rabat · du 26 au 29 octobre 1974', title: 'Un peuple reconnu',
      text: 'Les États arabes reconnaissent l’OLP comme seul représentant légitime du peuple palestinien. Le 13 novembre, Arafat parle à la tribune de l’ONU.',
      faces: [root.face('arafat', { side: 'R', at: 0.9 })],
      cam: { lon: 35.0, lat: 31.8, w: 0.06, pitch: 38, bearing: -4 },
      camEnd: { lon: 35.0, lat: 31.8, w: 0.054, pitch: 42, bearing: 2 },
    },
    {
      id: 'fin', type: 'outro', dur: 9.5, fly: 2.0, hitAt: 1.0,
      eyebrow: 'Yasser Arafat · Assemblée générale de l’ONU, 13 novembre 1974',
      lines: ['« Ne laissez pas', 'le rameau d’olivier', 'tomber de ma main. »'],
      cam: { lon: 35.0, lat: 31.8, w: 0.09, pitch: 34, bearing: 0 },
      camEnd: { lon: 35.0, lat: 31.8, w: 0.08, pitch: 38, bearing: 2 },
    },
  ];

  const units = [], strikes = [], markers = [], arrows = [], zones = [], plans = [], lights = [];

  // ---- le canal et la ligne Bar-Lev
  const CANAL = [[32.31, 31.26], [32.31, 31.0], [32.33, 30.75], [32.28, 30.6], [32.33, 30.45], [32.42, 30.3], [32.5, 30.1], [32.55, 29.95]];
  const BARLEV = CANAL.map(([lo, la]) => [lo + 0.035, la]);
  plans.push({ seg: 'canal', at: 0.4, dur: 2.0, any: true, path: CANAL, style: 'focus', label: 'Canal de Suez', labelAt: [32.12, 30.62], until: 32 });
  plans.push({ seg: 'canal', at: 0.9, dur: 2.0, any: true, path: BARLEV, style: 'dash', label: 'Ligne Bar-Lev', labelAt: [32.52, 30.72], until: 11 });
  // passages égyptiens (couleur pierre : l'autre camp), forts de la ligne frappés
  [30.85, 30.65, 30.45, 30.2, 30.0].forEach((lat, i) => {
    const lo = CANAL.reduce((b, p) => (Math.abs(p[1] - lat) < Math.abs(b[1] - lat) ? p : b))[0];
    const p = [[lo - 0.12, lat + 0.01], [lo + 0.02, lat], [lo + 0.17, lat - 0.01]];
    arrows.push({ seg: 'canal', at: 1.6 + 0.3 * i, dur: 4.0, path: p, w: 9, tone: 'stone', until: 11 });
    units.push({ seg: 'canal', at: 1.8 + 0.3 * i, dur: 4.0, kind: 'tank', n: 3, path: p, size: 14, until: 11 });
    strikes.push({ seg: 'canal', at: 2.4 + 0.3 * i, lon: lo + 0.04, lat, power: 0.7, burn: 5 });
  });
  units.push({ seg: 'canal', at: 1.0, dur: 2.0, kind: 'plane', n: 4, path: [[31.6, 30.4], [32.4, 30.5], [33.2, 30.6]], alt: 50, size: 22 });
  markers.push({ seg: 'canal', at: 6.0, label: '6 octobre · la ligne est percée', lon: 32.37, lat: 30.45, dir: [1, -1], off: 50 });

  // ---- le Golan : percée syrienne, puis contre-attaque israélienne vers Damas
  [[[36.05, 32.95], [35.88, 32.95], [35.75, 32.98]], [[36.0, 33.15], [35.85, 33.1], [35.77, 33.05]]]
    .forEach((p, i) => { arrows.push({ seg: 'golan', at: 0.4 + 0.2 * i, dur: 2.6, path: p, w: 9, tone: 'stone', until: 4.6 }); units.push({ seg: 'golan', at: 0.5 + 0.2 * i, dur: 2.6, kind: 'tank', n: 3, path: p, size: 15, until: 4.6 }); });
  const PUSH = [[35.72, 33.08], [35.88, 33.16], [36.03, 33.3]];
  arrows.push({ seg: 'golan', at: 4.0, dur: 3.0, path: PUSH, w: 11 });
  units.push({ seg: 'golan', at: 4.2, dur: 3.0, kind: 'tank', n: 5, path: PUSH, size: 16, fire: [{ at: 5.6, to: [35.95, 33.22] }] });
  zones.push({ seg: 'golan', at: 0.6, dur: 1.2, name: 'golan', from: [35.75, 33.1], until: 9.3 });
  markers.push({ seg: 'golan', at: 6.4, label: 'Saassaa · à 40 km de Damas', lon: 36.03, lat: 33.3, dir: [1, -1], off: 40 });

  // ---- la contre-offensive : Déversoir, encerclement de la IIIe armée, ponts aériens
  const DEV = [[32.6, 30.48], [32.38, 30.42], [32.26, 30.36], [32.3, 30.18], [32.47, 30.02]];
  arrows.push({ seg: 'contre', at: 0.8, dur: 5.0, path: DEV, w: 12 });
  units.push({ seg: 'contre', at: 1.0, dur: 5.0, kind: 'tank', n: 5, path: DEV, size: 15, fire: [{ at: 3.0, to: [32.3, 30.3] }, { at: 4.4, to: [32.4, 30.1] }] });
  markers.push({ seg: 'contre', at: 1.6, label: 'Déversoir · 16 octobre', lon: 32.36, lat: 30.41, dir: [-1, -1], off: 40 });
  markers.push({ seg: 'contre', at: 5.6, label: 'IIIe armée égyptienne encerclée', lon: 32.6, lat: 30.05, dir: [1, 1], off: 46 });
  units.push({ seg: 'contre', at: 5.0, dur: 3.5, kind: 'plane', n: 3, path: [[28.0, 33.3], [31.5, 32.6], [34.85, 32.0]], alt: 60, size: 24 });
  units.push({ seg: 'contre', at: 5.6, dur: 3.5, kind: 'plane', n: 3, path: [[33.5, 35.8], [32.7, 33.0], [31.4, 30.1]], alt: 60, size: 24 });
  markers.push({ seg: 'contre', at: 7.6, label: 'Pont aérien américain', lon: 31.5, lat: 32.6, dir: [-1, -1], off: 40 });
  markers.push({ seg: 'contre', at: 8.2, label: 'Pont aérien soviétique', lon: 32.7, lat: 33.0, dir: [1, -1], off: 40 });

  // ---- le pétrole : le Golfe s'allume
  [['Arabie saoudite', 46.72, 24.69, [1, 1]], ['Koweït', 47.98, 29.37, [1, -1]], ['Irak', 44.37, 33.31, [1, -1]]]
    .forEach(([label, lon, lat, dir], i) => markers.push({ seg: 'petrole', at: 1.2 + 0.3 * i, label, lon, lat, dir, off: 36, area: true, R: 300 }));

  // ---- 1974 : la Palestine, ses villes
  zones.push({ seg: 'rabat', at: 0.6, dur: 1.6, name: 'cisjordanie', from: [35.25, 31.9], until: 20 });
  zones.push({ seg: 'rabat', at: 0.8, dur: 1.2, name: 'gaza', from: [34.45, 31.5], until: 20 });
  lights.push({ seg: 'rabat', at: 0.8, poly: [[34.95, 32.55], [35.55, 32.55], [35.55, 31.35], [34.88, 31.35]], n: 500, until: 19.5 });

  const DUR = Object.fromEntries(segments.map((sg) => [sg.id, sg.dur]));
  markers.forEach((m) => { if (m.endAt === undefined) m.endAt = DUR[m.seg] + 0.3; });

  const clock = [
    { seg: 'canal', at: 0.2, text: '6 octobre 1973 · 14 h' },
    { seg: 'golan', at: 0.2, text: '6 octobre 1973' }, { seg: 'golan', at: 4.0, text: '11 octobre 1973' },
    { seg: 'contre', at: 0.2, text: '16 octobre 1973' }, { seg: 'contre', at: 5.4, text: '24 octobre 1973' },
    { seg: 'petrole', at: 0.2, text: '17 octobre 1973' },
    { seg: 'rabat', at: 0.2, text: 'Octobre 1974' },
    { seg: 'fin', at: 0.2, text: '' },
  ];

  root.TL = root.buildTL({
    name: 'octobre-1973',
    seed: 1973,
    segments,
    cities: root.CITIES.filter(([n]) => !['Jaffa', 'Rishon LeZion', 'Eilat', 'Suez', 'Port-Saïd'].includes(n)),
    markers,
    units,
    arrows,
    zones,
    strikes,
    plans,
    lights,
    clock,
    hud: { label: ['Sion', 'Chapitre 21 · Octobre 1973'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: null },
  });
})(typeof window !== 'undefined' ? window : globalThis);
