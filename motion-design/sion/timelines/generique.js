/*
 * Pièce « Générique » : SION — L'idée, la terre, le choc (≈ 35 s).
 *
 * Trois mots-chocs qui suivent le fil du film (1896 l'idée, 1917 la terre,
 * 1948 le choc), noir, puis le titre en trois écritures.
 */
(function (root) {
  const segments = [
    {
      // L'IDÉE : la caméra descend sur l'Europe, le mot apparaît comme une mise au point
      id: 'idee', type: 'beat', dur: 8.6, hitAt: 2.0, reveal: 'focus', k: 0.4, hitKind: 'soft',
      word: 'L’idée', year: 1896, place: 'Vienne, 1896', pinLabel: true,
      lon: 16.37, lat: 48.21, pin: true,
      cam: { lon: 10.5, lat: 45.0, w: 0.95, pitch: 30, bearing: -10 },
      camEnd: { lon: 16.37, lat: 48.21, w: 0.2, pitch: 46, bearing: 6 },
    },
    {
      // LA TERRE : vol jusqu'à Jérusalem, le mot tombe à l'arrivée, la terre s'embrase
      id: 'terre', type: 'beat', dur: 8.4, fly: 1.7,
      word: 'La terre', year: 1917, place: 'Jérusalem, 1917', pinLabel: true,
      lon: 35.22, lat: 31.78, pin: true, heat: { R: 1500, amt: 1 },
      cam: { w: 0.075, pitch: 46, bearing: 12 },
    },
    {
      // LE CHOC : rafale, une lettre par impact, coupes franches de caméra
      id: 'choc', type: 'beat', dur: 8.0, fly: 1.0, reveal: 'staccato', rgb: 18,
      word: 'Le choc', year: 1948,
      sub: '1948 : indépendance pour les Israéliens, Nakba pour les Palestiniens.', subAt: 2.0,
      letterHits: [0, 0.28, 0.28, 0.6, 0.86, 1.1, 1.38],
      lon: 34.95, lat: 31.7, pin: false, heat: { R: 2100, amt: 1.15, flicker: true },
      cam: { w: 0.12, pitch: 54, bearing: -14 },
      cuts: [
        { at: 0.28, lon: 34.47, lat: 31.45, w: 0.045, pitch: 60, bearing: 28 },
        { at: 0.6, lon: 35.1, lat: 32.2, w: 0.22, pitch: 22, bearing: -36 },
        { at: 0.86, lon: 35.0, lat: 32.8, w: 0.04, pitch: 58, bearing: 5 },
        { at: 1.1, lon: 35.2, lat: 31.75, w: 0.1, pitch: 50, bearing: 24 },
        { at: 1.38, lon: 34.95, lat: 31.7, w: 0.12, pitch: 54, bearing: -14 },
      ],
      flashRate: 4, flashNear: 0.9,
      extraHits: [[0.28, 0.7], [0.6, 0.8], [0.86, 0.7], [1.1, 0.8], [1.38, 1.1], [2.9, 0.45], [4.4, 0.4]],
    },
    {
      // noir, coupure du son, puis le titre (la caméra change de place dans le noir)
      id: 'titre', type: 'title', dur: 9.6, fly: 0, hitAt: 0.3,
      blackBefore: 0.6, silenceBefore: 0.6, flashRate: 0.6,
      title: 'Sion', sub: 'L’idée, la terre, le choc',
      scripts: [{ text: 'ציון', lang: 'he' }, { text: 'صهيون', lang: 'ar' }],
      cam: { lon: 29.0, lat: 38.5, w: 0.75, pitch: 36, bearing: -4 },
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
