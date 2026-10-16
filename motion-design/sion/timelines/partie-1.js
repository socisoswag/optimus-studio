/*
 * Pièce « Ouverture de la partie I » : L'idée — Le rêve d'un mot (≈ 15 s).
 *
 * Le sommaire s'écrit ligne à ligne ; chaque chapitre allume son lieu sur la
 * carte. La caméra part de Jérusalem (Sion), remonte vers l'Europe où naît
 * l'idée, puis revient sur la Palestine.
 */
(function (root) {
  const ANCHOR = [440, 40]; // la carte vit à droite, le texte à gauche

  const segments = [
    {
      id: 'p1', type: 'part', dur: 4.0, span: 15.0, hitAt: 0.9, layout: 'L', anchor: ANCHOR, pin: false,
      numeral: 'I', label: 'Partie I', title: 'L’idée', sub: 'Le rêve d’un mot',
      firstChapter: 1,
      chapters: [
        'Sion : un mot, un mythe, un monde',
        'L’Europe en feu : entre antisémitisme et émancipation',
        'L’affaire Dreyfus : fracture française et choc identitaire',
        'Theodor Herzl : le prophète du retour',
        'Les premiers colons juifs en Palestine',
        'La Palestine ottomane : coexistence et tensions sous la surface',
      ],
      chapAt: [2.2, 5.6, 6.2, 6.8, 10.8, 11.4],
      lon: 35.22, lat: 31.78,
      cam: { lon: 35.1, lat: 31.85, w: 0.09, pitch: 46, bearing: -8 },
    },
    {
      id: 'europe', type: 'camera', dur: 5.2, fly: 1.5, layout: 'L', anchor: ANCHOR, pin: false,
      cam: { lon: 12.85, lat: 47.0, w: 1.17, pitch: 34, bearing: 0 },
    },
    {
      id: 'palestine', type: 'camera', dur: 5.8, fly: 1.5, layout: 'L', anchor: ANCHOR, pin: false,
      cam: { lon: 35.0, lat: 31.9, w: 0.075, pitch: 46, bearing: 10 },
    },
  ];

  // Lieux des chapitres (apparaissent avec la ligne du sommaire)
  const markers = [
    { seg: 'p1', at: 2.2, num: '01', label: 'Jérusalem', lon: 35.22, lat: 31.78, dir: [1, -1] },
    { seg: 'p1', at: 5.6, num: '02', label: 'Zone de résidence', lon: 27.5, lat: 50.2, dir: [-1, -1] },
    { seg: 'p1', at: 6.2, num: '03', label: 'Paris', lon: 2.35, lat: 48.86, dir: [1, -1] },
    { seg: 'p1', at: 6.8, num: '04', label: 'Vienne', lon: 16.37, lat: 48.21, dir: [1, 1] },
    { seg: 'p1', at: 10.8, num: '05', label: 'Rishon LeZion', lon: 34.80, lat: 31.96, dir: [-1, -1] },
    { seg: 'p1', at: 11.4, num: '06', label: 'Palestine ottomane', lon: 35.0, lat: 31.9, dir: [-1, 1], off: 64, area: true, R: 1100 },
  ];

  // visages : apparaissent avec la ligne de leur chapitre, reliés à leur repère sur la carte
  segments[0].faces = [
      root.face('dreyfus', { tagPos: 'above', x: 1290, h: 640, at: 6.2, until: 10.5, link: { lon: 2.35, lat: 48.86 } }),
      root.face('herzl', { tagPos: 'above', x: 1660, h: 700, at: 6.8, until: 10.5, link: { lon: 16.37, lat: 48.21 } }),
  ];

  root.TL = root.buildTL({
    name: 'partie-1',
    seed: 1897,
    segments,
    markers,
    hud: { label: ['Sion', 'Partie I · L’idée'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 0.8,
    sound: {
      ticks: [0.8, 14.0],
      chords: [[0.0, 'Dm'], [5.0, 'Bb'], [10.0, 'Dm']],
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
