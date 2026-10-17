/*
 * Pièce « Ouverture de la partie iv » : Résistances et oppressions (≈ 14 s).
 *
 * La Cisjordanie, les camps du Liban, puis Gaza et le camp de Jabalia
 * où commence la première Intifada (1987).
 */
(function (root) {
  const segments = [
    {"id": "p4", "type": "part", "dur": 4.2, "hitAt": 0.9, "layout": "L", "anchor": [440, 40], "pin": false, "cam": {"lon": 35.2, "lat": 31.95, "w": 0.08, "pitch": 48, "bearing": 6}, "span": 13.6},
    {"id": "liban", "type": "camera", "dur": 4.0, "fly": 1.3, "layout": "L", "anchor": [440, 40], "pin": false, "cam": {"lon": 36.0, "lat": 33.0, "w": 0.2, "pitch": 44, "bearing": -6}},
    {"id": "gaza", "type": "camera", "dur": 5.4, "fly": 1.3, "layout": "L", "anchor": [440, 40], "pin": false, "cam": {"lon": 34.9, "lat": 31.7, "w": 0.11, "pitch": 50, "bearing": -10}},
  ];
  const p = segments[0];
  Object.assign(p, {
    numeral: "IV", label: "Partie IV", titleLines: ["Résistances et", "oppressions"],
    firstChapter: 19,
    chapters: ["Cisjordanie, Gaza, Jérusalem : terres volées, peuples divisés", "Les camps palestiniens et la vie dans l’exil", "Yasser Arafat : l’icône d’un peuple sans drapeau", "Les intifadas : pierres contre tanks", "Colonisation rampante et colonies illégales"],
    chapAt: [2.2, 5.6, 6.2, 9.7, 10.3],
  });

  // Lieux des chapitres (apparaissent avec la ligne du sommaire)
  const markers = [
    {"seg": "p4", "at": 2.2, "num": "19", "label": "Cisjordanie", "lon": 35.25, "lat": 32.0, "dir": [1, -1], "off": 64, "area": true, "R": 900},
    {"seg": "p4", "at": 5.6, "num": "20", "label": "Camps du Liban", "lon": 35.5, "lat": 33.86, "dir": [1, -1]},
    {"seg": "p4", "at": 9.7, "num": "22", "label": "Jabalia, 1987", "lon": 34.48, "lat": 31.53, "dir": [-1, -1]},
  ];

  // visages : apparaissent avec la ligne de leur chapitre, reliés à leur repère sur la carte
  segments[0].faces = [
      root.face('arafat', { tagPos: 'above', x: 1580, h: 640, at: 6.2, until: 9.6 }),
  ];

  root.TL = root.buildTL({
    name: "partie-4",
    seed: 1987,
    segments,
    markers,
    hud: { label: ['Sion', "Partie IV · Résistances et oppressions"], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 0.8,
    sound: {
      ticks: [0.8, 12.8],
      chords: [[0.0, "Dm"], [4.2, "Bb"], [8.2, "A"]],
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
