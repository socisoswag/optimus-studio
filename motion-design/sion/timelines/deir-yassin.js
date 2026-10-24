/*
 * Séquence « Deir Yassin » (chapitre 15), ≈ 50 s.
 *
 * Plan du village approché. Faits et chiffres retenus :
 *   - 9 avril 1948 : les milices Irgoun (commandée par Menahem Begin) et Lehi attaquent Deir Yassin,
 *     village d'environ 600 habitants à l'ouest de Jérusalem ;
 *   - 101 à 140 villageois tués selon les estimations ; environ 107 selon les recherches de
 *     l'université de Birzeit (S. Kanaana) ; l'Irgoun annonce alors 254 morts ;
 *   - des survivants sont exhibés dans Jérusalem ; le récit du massacre se répand et accélère
 *     l'exode ;
 *   - aujourd'hui, une partie des maisons du village abrite l'hôpital psychiatrique israélien
 *     de Kfar Shaul.
 */
(function (root) {
  const C = [35.1785, 31.7862]; // centre du village
  const segments = [
    {
      id: 'deir', type: 'beat', dur: 6.0, hitAt: 1.0, reveal: 'slam', rgb: 14,
      kicker: '9 avril 1948 · à l’ouest de Jérusalem', word: 'Deir Yassin',
      sub: 'Un village d’environ 600 habitants, sur une colline face à Jérusalem.', subAt: 1.4,
      cam: { lon: 35.2, lat: 31.78, w: 0.012, pitch: 40, bearing: -6 },
      camEnd: { lon: 35.19, lat: 31.782, w: 0.008, pitch: 44, bearing: 0 },
    },
    {
      id: 'attaque', type: 'cap', dur: 13.0, fly: 2.0, anchor: [330, -110], textW: 900,
      kicker: '9 avril 1948, à l’aube', title: 'L’attaque',
      text: 'Les miliciens de l’Irgoun et du Lehi entrent dans le village par deux côtés. Maison après maison, les habitants sont tués.',
      faces: [root.face('begin', { side: 'R', at: 6.2, until: 12.6, name: 'Menahem Begin', dates: 'chef de l’Irgoun' })],
      cam: { lon: C[0], lat: C[1], w: 0.00052, pitch: 52, bearing: -12 },
      camEnd: { lon: C[0], lat: C[1], w: 0.00044, pitch: 56, bearing: 0 },
    },
    {
      id: 'morts', type: 'stat', dur: 11.0, fly: 1.2, layout: 'L', anchor: [480, 20],
      ghost: '1948', kicker: 'Deir Yassin · 9 avril 1948', pre: 'Environ', value: 107, label: 'villageois tués',
      text: 'Selon les recherches de l’université de Birzeit ; les estimations vont de 101 à 140. Sur le moment, [[l’Irgoun annonce 254 morts]].',
      textAt: 1.4, hlAt: 5.5, source: 'S. Kanaana, université de Birzeit', sourceAt: 4.6, countAt: 0.3, countDur: 3.0,
      cam: { lon: C[0] + 0.001, lat: C[1], w: 0.0007, pitch: 50, bearing: 6 },
      camEnd: { lon: C[0] + 0.001, lat: C[1], w: 0.0008, pitch: 48, bearing: 10 },
    },
    {
      id: 'peur', type: 'cap', dur: 11.0, fly: 2.2, anchor: [320, -60], textW: 900,
      kicker: 'Avril et mai 1948', title: 'La peur',
      text: 'Des survivants sont exhibés dans Jérusalem. Le récit du massacre se répand dans toute la Palestine et [[accélère l’exode]].',
      cam: { lon: 35.05, lat: 32.1, w: 0.05, pitch: 40, bearing: -6 },
      camEnd: { lon: 35.05, lat: 32.1, w: 0.044, pitch: 44, bearing: 2 },
    },
    {
      id: 'fin', type: 'outro', dur: 9.0, fly: 2.4, hitAt: 1.0,
      eyebrow: 'Deir Yassin, aujourd’hui · dans les maisons du village',
      lines: ['Un hôpital', 'psychiatrique', 'israélien.'],
      cam: { lon: C[0], lat: C[1], w: 0.0011, pitch: 46, bearing: 14 },
      camEnd: { lon: C[0], lat: C[1], w: 0.0013, pitch: 44, bearing: 18 },
    },
  ];

  const units = [], strikes = [], markers = [], plans = [], blocks = [], flows = [], lights = [];
  const rnd = (() => { let a = 4948; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();
  const mLon = 1 / 94800, mLat = 1 / 111000;

  // ---- le village : maisons de pierre sur la colline
  for (let gy = -11; gy <= 11; gy++) for (let gx = -12; gx <= 12; gx++) {
    if (rnd() < 0.42 || (gx * gx) / 1.2 + gy * gy > 120) continue;
    blocks.push({
      seg: 'deir', at: 4.6 + rnd() * 1.2, lon: C[0] + gx * 17 * mLon + (rnd() - 0.5) * 5 * mLon, lat: C[1] + gy * 17 * mLat + (rnd() - 0.5) * 5 * mLat,
      w: 9 + rnd() * 4, d: 9 + rnd() * 4, h: 4 + rnd() * 4, rot: 0.35 + (rnd() - 0.5) * 0.25,
      fall: rnd() < 0.1 ? 6 + 2 + 8 * rnd() : undefined, // quelques maisons dynamitées pendant l'attaque (temps relatifs à « deir »)
    });
  }
  plans.push({ seg: 'attaque', at: 0.4, dur: 1.2, style: 'grid', bbox: [35.172, 31.781, 35.185, 31.792], step: 25 });
  // deux colonnes : par l'est et par le sud
  const EAST = [[35.1875, 31.7874], [35.1835, 31.7868], [35.1805, 31.7864]];
  const SOUTH = [[35.1772, 31.7805], [35.1778, 31.7832], [35.1782, 31.7852]];
  units.push({ seg: 'attaque', at: 1.6, dur: 4.5, kind: 'truck', n: 3, path: EAST, size: 22, until: 13.2 });
  units.push({ seg: 'attaque', at: 2.0, dur: 4.5, kind: 'truck', n: 3, path: SOUTH, size: 22, until: 13.2 });
  for (let j = 0; j < 9; j++) strikes.push({ seg: 'attaque', at: 4.0 + j * 0.8 + rnd() * 0.4, lon: C[0] + (rnd() - 0.5) * 0.003, lat: C[1] + (rnd() - 0.5) * 0.0024, power: 0.35, burn: 3 });
  markers.push({ seg: 'attaque', at: 2.4, label: 'Irgoun · par l’est', lon: EAST[0][0], lat: EAST[0][1], dir: [1, -1], off: 40 });
  markers.push({ seg: 'attaque', at: 2.8, label: 'Lehi · par le sud', lon: SOUTH[0][0], lat: SOUTH[0][1], dir: [1, 1], off: 40 });

  // ---- la peur : l'exode qui s'accélère (la vie palestinienne, en olive)
  markers.push({ seg: 'peur', at: 1.6, label: 'Deir Yassin', lon: C[0], lat: C[1], dir: [-1, 1], off: 40 });
  [[[34.75, 32.05]], [[34.99, 32.81]], [[35.5, 32.965]], [[35.53, 32.79]], [[34.87, 31.93], [34.9, 31.95]]].forEach((from, i) =>
    flows.push({ seg: 'peur', at: 2.4 + 0.5 * i, dur: 3.4, n: 60, from, to: [[35.95, 32.0], [35.9, 32.6], [35.7, 33.3], [35.85, 32.55], [35.2, 31.92]][i], travel: [2.2, 3.2], bend: 0.15 * (i % 2 ? 1 : -1), originHeat: 0.6, R: 160 }));

  const DUR = Object.fromEntries(segments.map((sg) => [sg.id, sg.dur]));
  markers.forEach((m) => { if (m.endAt === undefined) m.endAt = DUR[m.seg] + 0.3; });

  const clock = [
    { seg: 'attaque', at: 0.2, text: '9 avril 1948 · 4 h 30' },
    { seg: 'morts', at: 0.2, text: '9 avril 1948' },
    { seg: 'peur', at: 0.2, text: 'Avril 1948' }, { seg: 'peur', at: 6.0, text: 'Mai 1948' },
    { seg: 'fin', at: 0.2, text: '' },
  ];

  root.TL = root.buildTL({
    name: 'deir-yassin',
    seed: 1948,
    segments,
    relief: true,
    cities: root.CITIES.filter(([n]) => !['Jaffa', 'Rishon LeZion', 'Le Golan', 'Sinaï', 'Eilat'].includes(n)),
    markers,
    flows,
    units,
    strikes,
    plans,
    blocks,
    lights,
    clock,
    hud: { label: ['Sion', 'Chapitre 15 · Deir Yassin'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: null },
  });
})(typeof window !== 'undefined' ? window : globalThis);
