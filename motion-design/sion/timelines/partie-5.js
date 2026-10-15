/*
 * Pièce « Ouverture de la partie v » : La dérive d’un projet (≈ 14 s).
 *
 * Jérusalem (la Knesset), Gaza, puis la caméra recule dans la nuit.
 */
(function (root) {
  const segments = [
    {"id": "p5", "type": "part", "dur": 4.2, "hitAt": 0.9, "layout": "L", "anchor": [440, 40], "pin": false, "cam": {"lon": 35.205, "lat": 31.777, "w": 0.05, "pitch": 50, "bearing": -10}, "span": 14.0},
    {"id": "gaza", "type": "camera", "dur": 4.6, "fly": 1.2, "layout": "L", "anchor": [440, 40], "pin": false, "cam": {"lon": 34.42, "lat": 31.45, "w": 0.06, "pitch": 52, "bearing": 14}},
    {"id": "nuit", "type": "camera", "dur": 5.2, "fly": 1.4, "layout": "L", "anchor": [440, 40], "pin": false, "cam": {"lon": 33.0, "lat": 33.0, "w": 0.6, "pitch": 30, "bearing": 0}},
  ];
  const p = segments[0];
  Object.assign(p, {
    numeral: "V", label: "Partie V", titleLines: ["La dérive", "d’un projet"],
    firstChapter: 24,
    chapters: ["Netanyahou, Lieberman, et la haine institutionnalisée", "Gaza, un champ d’expérimentation militaire", "Le Talmud : quand les textes nourrissent les extrêmes", "La guerre numérique : désinformation, faux profils et chaos en ligne (Mossad)", "Le racisme en Israël : mizrahim, éthiopiens et palestiniens"],
    chapAt: [2.2, 5.6, 10.4, 11.0, 11.6],
  });

  // Lieux des chapitres (apparaissent avec la ligne du sommaire)
  const markers = [
    {"seg": "p5", "at": 2.2, "num": "24", "label": "Jérusalem · Knesset", "lon": 35.205, "lat": 31.777, "dir": [1, -1]},
    {"seg": "p5", "at": 5.6, "num": "25", "label": "Gaza", "lon": 34.45, "lat": 31.45, "dir": [-1, 1], "off": 64, "area": true, "R": 800},
  ];

  root.TL = root.buildTL({
    name: "partie-5",
    seed: 2000,
    segments,
    markers,
    hud: { label: ['Sion', "Partie V · La dérive d’un projet"], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 0.8,
    sound: {
      ticks: [0.8, 13.2],
      chords: [[0.0, "Gm"], [4.2, "A"], [8.8, "Gm"]],
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
