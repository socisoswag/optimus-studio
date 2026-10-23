/*
 * Citation « Golda Meir, 1969 » (chapitre 18), ≈ 14 s.
 *
 * Entretien avec Frank Giles, « Golda Meir: Who can blame Israel », The Sunday Times, 15 juin 1969,
 * p. 12 : « There was no such thing as Palestinians. [...] They did not exist. »
 * À l'écran, les villes palestiniennes d'avant 1948 s'allument pendant la phrase.
 */
(function (root) {
  const segments = [
    {
      id: 'meir', type: 'quote', dur: 12.0, fly: 1.2, hitAt: 0.8,
      faces: [root.face('meir', { x: 1560, h: 780, at: 0.7, tag: false })],
      text: 'Il n’y avait pas de Palestiniens. […] [[Ils n’existaient pas.]]',
      author: 'Golda Meir · The Sunday Times, 15 juin 1969',
      context: 'Première ministre d’Israël. Traduit de l’anglais.',
      cam: { lon: 35.05, lat: 32.0, w: 0.12, pitch: 38, bearing: -4 },
      camEnd: { lon: 35.05, lat: 32.0, w: 0.1, pitch: 44, bearing: 4 },
    },
  ];

  // pendant qu'elle parle, les villes palestiniennes de 1948 s'allument : la vie qu'elle nie
  const TOWNS = [['Jaffa', 34.75, 32.05], ['Haïfa', 34.99, 32.81], ['Lydda', 34.89, 31.95], ['Ramla', 34.87, 31.93],
    ['Acre', 35.07, 32.93], ['Safed', 35.5, 32.965], ['Nazareth', 35.3, 32.7], ['Tibériade', 35.53, 32.79],
    ['Beersheba', 34.79, 31.25], ['Gaza', 34.46, 31.5], ['Jérusalem', 35.22, 31.78], ['Naplouse', 35.26, 32.22],
    ['Hébron', 35.1, 31.53], ['Jénine', 35.3, 32.46], ['Al-Majdal', 34.57, 31.67], ['Bethléem', 35.2, 31.7]];
  const markers = [], lights = [];
  TOWNS.forEach(([n, lon, lat], i) => {
    const d = 0.022;
    lights.push({ seg: 'meir', at: 2.2 + 0.28 * i, poly: [[lon - d, lat + d], [lon + d, lat + d], [lon + d, lat - d], [lon - d, lat - d]], n: 90 });
  });
  [['Jaffa', 34.75, 32.05, [-1, 1]], ['Haïfa', 34.99, 32.81, [-1, -1]], ['Naplouse', 35.26, 32.22, [1, -1]], ['Gaza', 34.46, 31.5, [-1, 1]]]
    .forEach(([label, lon, lat, dir], i) => markers.push({ seg: 'meir', at: 3.0 + 1.1 * i, label, lon, lat, dir, off: 36, endAt: 12.3 }));

  root.TL = root.buildTL({
    name: 'citation-meir',
    seed: 8504,
    segments,
    relief: true,
    markers, lights,
    hud: { label: ['Sion', 'Chapitre 18 · Golda Meir'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: null },
  });
})(typeof window !== 'undefined' ? window : globalThis);
