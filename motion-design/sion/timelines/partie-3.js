/*
 * Pièce « Ouverture de la partie iii » : La catastrophe fondatrice (≈ 16 s).
 *
 * L’ONU à New York (1947), vol transatlantique jusqu’en Palestine
 * (Deir Yassin, Tel-Aviv), puis recul vers Bagdad et Jérusalem.
 */
(function (root) {
  const segments = [
    {"id": "p3", "type": "part", "dur": 3.8, "hitAt": 0.9, "layout": "L", "anchor": [440, 40], "pin": false, "cam": {"lon": -73.9, "lat": 40.75, "w": 0.1, "pitch": 44, "bearing": 6}, "span": 15.8},
    {"id": "palestine", "type": "camera", "dur": 6.6, "fly": 2.0, "layout": "L", "anchor": [440, 40], "pin": false, "cam": {"lon": 35.0, "lat": 31.85, "w": 0.085, "pitch": 48, "bearing": -8}},
    {"id": "region", "type": "camera", "dur": 5.4, "fly": 1.5, "layout": "L", "anchor": [440, 40], "pin": false, "cam": {"lon": 40.0, "lat": 32.0, "w": 0.55, "pitch": 36, "bearing": 4}},
  ];
  const p = segments[0];
  Object.assign(p, {
    numeral: "III", label: "Partie III", titleLines: ["La catastrophe", "fondatrice"],
    firstChapter: 12,
    chapters: ["1947 : le plan de partage de l’ONU", "1948 : la création d’Israël et la Nakba", "Les milices juives : Haganah, Irgoun, Lehi", "Le massacre de Deir Yassin", "Ben Gourion : bâtir un État, effacer un peuple", "L’exode des juifs arabes et sépharades", "Golda Meir : « Les Palestiniens n’existent pas »"],
    chapAt: [2.2, 6.0, 6.6, 7.2, 7.8, 12.0, 12.6],
  });

  // Lieux des chapitres (apparaissent avec la ligne du sommaire)
  const markers = [
    {"seg": "p3", "at": 2.2, "num": "12", "label": "ONU · New York", "lon": -73.84, "lat": 40.74, "dir": [1, -1]},
    {"seg": "p3", "at": 6.0, "num": "13", "label": "Palestine", "hideAt": 10.6, "lon": 34.95, "lat": 31.75, "dir": [-1, 1], "off": 64, "area": true, "R": 1200},
    {"seg": "p3", "at": 7.2, "num": "15", "label": "Deir Yassin", "hideAt": 10.6, "lon": 35.178, "lat": 31.786, "dir": [1, -1]},
    {"seg": "p3", "at": 7.8, "num": "16", "label": "Tel-Aviv", "hideAt": 10.6, "lon": 34.78, "lat": 32.08, "dir": [-1, -1]},
    {"seg": "p3", "at": 12.0, "num": "17", "label": "Bagdad", "lon": 44.37, "lat": 33.31, "dir": [1, -1]},
    {"seg": "p3", "at": 12.6, "num": "18", "label": "Jérusalem", "lon": 35.22, "lat": 31.78, "dir": [1, 1]},
  ];

  root.TL = root.buildTL({
    name: "partie-3",
    seed: 1947,
    segments,
    markers,
    hud: { label: ['Sion', "Partie III · La catastrophe fondatrice"], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 0.8,
    sound: {
      ticks: [0.8, 15.0],
      chords: [[0.0, "Gm"], [5.0, "A"], [11.0, "Dm"]],
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
