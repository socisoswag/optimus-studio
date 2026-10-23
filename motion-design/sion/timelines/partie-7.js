/*
 * Pièce « Ouverture de la partie vii » : Une histoire universelle ? (≈ 13 s).
 *
 * Le monde vu de haut, puis la Palestine où les points de la carte
 * s’éteignent un à un (villages détruits, noms effacés).
 */
(function (root) {
  const segments = [
    {"id": "p7", "type": "part", "dur": 4.4, "hitAt": 0.9, "layout": "L", "anchor": [440, 40], "pin": false, "cam": {"lon": 10.0, "lat": 38.0, "w": 2.6, "pitch": 24, "bearing": 0}, "span": 12.8},
    {"id": "palestine", "type": "camera", "dur": 8.4, "fly": 2.0, "layout": "L", "anchor": [440, 40], "pin": false, "cam": {"lon": 35.05, "lat": 31.85, "w": 0.1, "pitch": 48, "bearing": 6}},
  ];
  const p = segments[0];
  Object.assign(p, {
    numeral: "VII", label: "Partie VII", titleLines: ["Une histoire", "universelle ?"],
    firstChapter: 32,
    chapters: ["La mémoire de la Shoah : entre deuil et usage politique", "Les résolutions de l’ONU ignorées : 194, 242, 338", "L’effacement culturel : villages détruits, noms effacés", "Colonialisme, apartheid : le poids des mots", "La fracture en Israël : la démocratie en question"],
    chapAt: [2.2, 2.8, 6.6, 8.6, 9.2],
  });

  // Lieux des chapitres (apparaissent avec la ligne du sommaire)
  const markers = [
    {"seg": "p7", "at": 6.6, "num": "34", "label": "Villages effacés", "lon": 35.0, "lat": 31.9, "dir": [-1, 1], "off": 64, "erase": true, "R": 1500, "eraseDur": 4.0},
  ];

  root.TL = root.buildTL({
    name: "partie-7",
    seed: 1949,
    segments,
    relief: true,
    markers,
    hud: { label: ['Sion', "Partie VII · Une histoire universelle ?"], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 0.8,
    sound: {
      ticks: [0.8, 12.0],
      chords: [[0.0, "Dm"], [4.4, "Gm"], [9.0, "Bb"]],
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
