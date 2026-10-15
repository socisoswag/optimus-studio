/*
 * Pièce « Générique » : SION — L'idée, la terre, le choc (≈ 40 s).
 *
 * Trois mots-chocs qui suivent le fil du film (1896 l'idée, 1917 la terre,
 * 1948 le choc), noir, puis le titre en trois écritures et le crédit.
 */
(function (root) {
  // Nom affiché dans le crédit : [prénom, nom]
  const REALISATEUR = ['Prénom', 'Nom'];

  const segments = [
    {
      id: 'idee', type: 'beat', dur: 8.6, hitAt: 2.0,
      kicker: 'Vienne · 1896', word: 'L’idée', year: 1896,
      lon: 16.37, lat: 48.21, pin: true,
      cam: { lon: 10.5, lat: 45.0, w: 0.95, pitch: 30, bearing: -10 },
      camEnd: { lon: 16.37, lat: 48.21, w: 0.2, pitch: 46, bearing: 6 },
    },
    {
      id: 'terre', type: 'beat', dur: 8.4, fly: 1.7,
      kicker: 'Jérusalem · 1917', word: 'La terre', year: 1917,
      lon: 35.22, lat: 31.78, pin: true, heat: { R: 1500, amt: 1 },
      cam: { w: 0.075, pitch: 46, bearing: 12 },
    },
    {
      id: 'choc', type: 'beat', dur: 8.0, fly: 1.0,
      kicker: '1948 · Indépendance · Nakba', word: 'Le choc', year: 1948, rgb: 18,
      lon: 34.95, lat: 31.7, pin: false, heat: { R: 2100, amt: 1.15, flicker: true },
      cam: { w: 0.12, pitch: 54, bearing: -14 },
      flashRate: 4, flashNear: 0.9,
      extraHits: [[0.75, 0.75], [1.45, 0.6], [2.6, 0.5], [4.1, 0.45]],
    },
    {
      // noir, coupure du son, puis le titre (la caméra change de place dans le noir)
      id: 'titre', type: 'title', dur: 8.2, fly: 0, hitAt: 0.3,
      blackBefore: 0.6, silenceBefore: 0.6, flashRate: 0.6,
      title: 'Sion', sub: 'L’idée, la terre, le choc',
      scripts: [{ text: 'ציון', lang: 'he' }, { text: 'صهيون', lang: 'ar' }],
      cam: { lon: 29.0, lat: 38.5, w: 0.75, pitch: 36, bearing: -4 },
    },
    {
      id: 'credit', type: 'credit', dur: 6.6, fly: 0, hitAt: 0.6, camFollow: true, flashRate: 0.6,
      by: 'Un film de', name: REALISATEUR,
    },
  ];

  root.TL = root.buildTL({
    name: 'generique',
    seed: 1896,
    segments,
    hud: { label: null, index: false, coords: true, ruler: false, odo: false, from: 0.8 },
    fadeIn: 1.2,
    fadeOut: 1.4,
    sound: {
      ticks: [1.2, 24.6],
      chords: [[0.0, 'Dm'], [8.6, 'Bb'], [16.6, 'A'], [25.3, 'Dm9']],
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
