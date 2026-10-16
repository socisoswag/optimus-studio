/*
 * Pièce « Ouverture de la partie ii » : Le basculement (≈ 15 s).
 *
 * Londres (la déclaration Balfour), puis l’Europe jusqu’au Levant
 * (Jérusalem, Berlin), puis la Palestine sous mandat britannique.
 */
(function (root) {
  const segments = [
    {"id": "p2", "type": "part", "dur": 3.8, "hitAt": 0.9, "layout": "L", "anchor": [440, 40], "pin": false, "cam": {"lon": -0.13, "lat": 51.51, "w": 0.13, "pitch": 44, "bearing": -6}, "span": 14.6},
    {"id": "europe", "type": "camera", "dur": 5.0, "fly": 1.5, "layout": "L", "anchor": [440, 40], "pin": false, "cam": {"lon": 13.4, "lat": 43.0, "w": 1.62, "pitch": 32, "bearing": 0}},
    {"id": "palestine", "type": "camera", "dur": 5.8, "fly": 1.5, "layout": "L", "anchor": [440, 40], "pin": false, "cam": {"lon": 35.0, "lat": 31.9, "w": 0.085, "pitch": 46, "bearing": 8}},
  ];
  const p = segments[0];
  Object.assign(p, {
    numeral: "II", label: "Partie II", titleLines: ["Le", "basculement"],
    firstChapter: 7,
    chapters: ["La Déclaration Balfour (1917)", "Le mandat britannique : promesses brisées, haine semée", "Le traité Haavara et l’assassinat d’Arlozoroff", "Les juifs contre les juifs : sionistes, orthodoxes et antisionistes", "Congrès sionistes et montée des tensions avec les Arabes palestiniens"],
    chapAt: [2.2, 5.5, 6.1, 6.7, 10.6],
  });

  // Lieux des chapitres (apparaissent avec la ligne du sommaire)
  const markers = [
    {"seg": "p2", "at": 2.2, "num": "07", "label": "Londres", "lon": -0.13, "lat": 51.51, "dir": [1, -1]},
    {"seg": "p2", "at": 5.5, "num": "08", "label": "Jérusalem", "lon": 35.22, "lat": 31.78, "dir": [-1, -1]},
    {"seg": "p2", "at": 6.1, "num": "09", "label": "Berlin", "lon": 13.4, "lat": 52.52, "dir": [1, -1]},
    {"seg": "p2", "at": 10.6, "num": "11", "label": "Palestine mandataire", "lon": 35.0, "lat": 31.9, "dir": [-1, 1], "off": 64, "area": true, "R": 1100},
  ];

  // visages : apparaissent avec la ligne de leur chapitre, reliés à leur repère sur la carte
  segments[0].faces = [
      root.face('balfour', { x: 1560, h: 720, at: 2.2, until: 5.4, link: { lon: -0.13, lat: 51.51 } }),
      root.face('arlozoroff', { x: 1560, h: 720, at: 6.1, until: 10.4, link: { lon: 13.4, lat: 52.52 } }),
  ];

  root.TL = root.buildTL({
    name: "partie-2",
    seed: 1917,
    segments,
    markers,
    hud: { label: ['Sion', "Partie II · Le basculement"], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 0.8,
    sound: {
      ticks: [0.8, 13.8],
      chords: [[0.0, "Bb"], [5.0, "Gm"], [10.0, "Bb"]],
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
