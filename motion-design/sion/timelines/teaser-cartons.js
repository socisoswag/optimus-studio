/*
 * Cartons du teaser (environ 50 s, sans voix) : ils s'intercalent entre des plans tirés des pièces du
 * film, assemblés par tools/teaser.sh. Chaque carton est un segment ; l'assemblage les découpe.
 */
(function (root) {
  const DARK = { lon: 18.0, lat: 34.5, w: 1.1, pitch: 26, bearing: 0 };
  const segments = [
    {
      id: 'mot', type: 'beat', dur: 2.4, hitAt: 0.5, reveal: 'focus', rgb: 10, quiet: true,
      word: 'Une idée.',
      cam: DARK, camEnd: { ...DARK, w: 1.04 },
    },
    {
      id: 'terre', type: 'beat', dur: 2.4, fly: 0.1, hitAt: 0.45, rgb: 14, quiet: true, noWhoosh: true,
      word: 'Une terre.',
      cam: { ...DARK, lon: 30.0, lat: 33.0, w: 0.9 }, camEnd: { ...DARK, lon: 30.5, lat: 33.0, w: 0.86 },
    },
    {
      id: 'choc', type: 'beat', dur: 2.6, fly: 0.1, hitAt: 0.35, reveal: 'staccato', rgb: 18, quiet: true, noWhoosh: true,
      word: 'Un choc.', letterHits: [0, 0, 0.18, 0.18, 0.18, 0.18, 0.18, 0.18],
      extraHits: [[0.18, 1.0]],
      cam: { ...DARK, lon: 34.0, lat: 32.0, w: 0.5 }, camEnd: { ...DARK, lon: 34.2, lat: 32.0, w: 0.47 },
    },
    {
      id: 'siecle', type: 'beat', dur: 3.6, fly: 0.1, hitAt: 0.5, reveal: 'focus', rgb: 10, quiet: true, noWhoosh: true,
      kicker: 'De 1897 à aujourd’hui', word: 'Un siècle',
      sub: 'Raconter les choses telles qu’elles sont.', subAt: 1.0,
      cam: { ...DARK, lon: 22.0, lat: 38.0, w: 1.3 }, camEnd: { ...DARK, lon: 22.5, lat: 38.0, w: 1.24 },
    },
    {
      id: 'bientot', type: 'beat', dur: 3.8, fly: 0.1, hitAt: 0.5, reveal: 'focus', rgb: 10, quiet: true, noWhoosh: true,
      kicker: 'Documentaire · 1 h 10', word: 'Bientôt',
      cam: { ...DARK, lon: 35.0, lat: 31.8, w: 0.7 }, camEnd: { ...DARK, lon: 35.1, lat: 31.8, w: 0.66 },
    },
  ];

  root.TL = root.buildTL({
    name: 'teaser-cartons',
    seed: 2026,
    segments,
    cities: [],
    hud: { label: null, index: false, coords: false, ruler: false, odo: false, from: 99 },
    fadeIn: 0.3,
    fadeOut: 0.6,
    sound: { ticks: null },
  });
})(typeof window !== 'undefined' ? window : globalThis);
