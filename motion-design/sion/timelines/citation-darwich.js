/*
 * Citation « Mahmoud Darwich » (chapitre 38), ≈ 15 s.
 *
 * Premier vers du poème « Sur cette terre » (على هذه الأرض ما يستحق الحياة), traduit de l'arabe.
 * Mahmoud Darwich est né le 13 mars 1941 à al-Birwa (Galilée), village dépeuplé en 1948 puis détruit.
 */
(function (root) {
  const segments = [
    {
      id: 'darwich', type: 'quote', dur: 13.0, fly: 1.2, hitAt: 0.8, wordStep: 0.16,
      faces: [root.face('darwich', { x: 1690, h: 760, at: 0.7, tag: false })],
      text: 'Sur cette terre, [[il y a ce qui mérite la vie.]]',
      native: 'على هذه الأرض ما يستحق الحياة',
      author: 'Mahmoud Darwich · « Sur cette terre »',
      context: 'Né en 1941 à al-Birwa, en Galilée. Le village est vidé de ses habitants en 1948, puis rasé.',
      cam: { lon: 35.2, lat: 32.9, w: 0.05, pitch: 42, bearing: -8 },
      camEnd: { lon: 35.2, lat: 32.9, w: 0.04, pitch: 48, bearing: 2 },
    },
  ];

  // al-Birwa, son village natal : vidé en 1948, puis rasé ; la vie autour, en olive
  const B = [35.175, 32.912];
  const markers = [{ seg: 'darwich', at: 2.4, label: 'Al-Birwa', lon: B[0], lat: B[1], dir: [-1, -1], off: 44, erase: true, ghost: true, R: 300, endAt: 12.8 }];
  const lights = [{ seg: 'darwich', at: 0.6, poly: [[34.95, 33.05], [35.45, 33.05], [35.45, 32.75], [34.95, 32.75]], n: 420 }];

  root.TL = root.buildTL({
    name: 'citation-darwich',
    seed: 7383,
    segments,
    relief: true,
    markers, lights,
    hud: { label: ['Sion', 'Chapitre 38 · Mémoire, poésie et lumière'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: null },
  });
})(typeof window !== 'undefined' ? window : globalThis);
