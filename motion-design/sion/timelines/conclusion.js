/*
 * Pièce « Ouverture de la conclusion » : Conclusion (≈ 14 s).
 *
 * Lent recul au-dessus de Jérusalem, dans le calme : les braises
 * retombent, le sommaire des trois derniers chapitres s’écrit.
 */
(function (root) {
  const segments = [
    {"id": "pc", "type": "part", "dur": 14.0, "hitAt": 0.9, "layout": "L", "anchor": [440, 40], "pin": false, "cam": {"lon": 35.22, "lat": 31.78, "w": 0.06, "pitch": 50, "bearing": -4}, "label": null, "camEnd": {"lon": 33.5, "lat": 33.5, "w": 0.6, "pitch": 32, "bearing": 6}, "flashRate": 0.25, "span": 14.0},
  ];
  const p = segments[0];
  Object.assign(p, {
    numeral: "", label: "Chapitres 37 à 39", titleLines: ["Conclusion"],
    firstChapter: 37,
    chapters: ["Le droit des peuples : libre arbitre contre dogme", "La souffrance palestinienne : entre mémoire, poésie et lumière", "Pour une paix juste : aimer la terre, pas la détruire"],
    chapAt: [3.0, 3.8, 4.6],
  });

  // Lieux des chapitres (apparaissent avec la ligne du sommaire)
  const markers = [

  ];

  root.TL = root.buildTL({
    name: "conclusion",
    seed: 2026,
    segments,
    markers,
    hud: { label: ['Sion', "Conclusion"], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.6,
    sound: {
      ticks: null,
      chords: [[0.0, "Dm9"], [6.0, "Bb"], [10.0, "Dm9"]],
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
