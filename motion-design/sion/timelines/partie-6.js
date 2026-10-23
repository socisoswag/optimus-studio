/*
 * Pièce « Ouverture de la partie vi » : Voix et contre-voix (≈ 14 s).
 *
 * Mea Shearim à Jérusalem, New York, puis Paris : les voix juives et
 * religieuses opposées au sionisme, et le débat intellectuel français.
 */
(function (root) {
  const segments = [
    {"id": "p6", "type": "part", "dur": 4.2, "hitAt": 0.9, "layout": "L", "anchor": [440, 40], "pin": false, "cam": {"lon": 35.222, "lat": 31.788, "w": 0.045, "pitch": 50, "bearing": 8}, "span": 14.4},
    {"id": "ny", "type": "camera", "dur": 5.2, "fly": 2.0, "layout": "L", "anchor": [440, 40], "pin": false, "cam": {"lon": -73.97, "lat": 40.75, "w": 0.1, "pitch": 44, "bearing": -6}},
    {"id": "paris", "type": "camera", "dur": 5.0, "fly": 2.0, "layout": "L", "anchor": [440, 40], "pin": false, "cam": {"lon": 2.35, "lat": 48.86, "w": 0.12, "pitch": 44, "bearing": 10}},
  ];
  const p = segments[0];
  Object.assign(p, {
    numeral: "VI", label: "Partie VI", titleLines: ["Voix et", "contre-voix"],
    firstChapter: 29,
    chapters: ["Les Juifs antisionistes : Neturei Karta, Jewish Voice for Peace", "Les religieux contre le sionisme : foi ou nationalisme ?", "Les intellectuels français : BHL, Finkielkraut et le débat public"],
    chapAt: [2.2, 7.0, 11.6],
  });

  // Lieux des chapitres (apparaissent avec la ligne du sommaire)
  const markers = [
    {"seg": "p6", "at": 2.2, "num": "29", "label": "Mea Shearim", "lon": 35.222, "lat": 31.788, "dir": [1, -1]},
    {"seg": "p6", "at": 6.4, "num": "29", "label": "New York", "lon": -73.97, "lat": 40.75, "dir": [1, -1]},
    {"seg": "p6", "at": 11.6, "num": "31", "label": "Paris", "lon": 2.35, "lat": 48.86, "dir": [1, -1]},
  ];

  // visages : apparaissent avec la ligne de leur chapitre, reliés à leur repère sur la carte
  segments[0].faces = [
      root.face('bhl', { tagPos: 'above', x: 1330, h: 680, at: 11.6, until: 14.4, link: { lon: 2.35, lat: 48.86 } }),
      root.face('finkielkraut', { tagPos: 'above', x: 1690, h: 700, at: 12.0, until: 14.4 }),
  ];

  root.TL = root.buildTL({
    name: "partie-6",
    seed: 1938,
    segments,
    relief: true,
    markers,
    hud: { label: ['Sion', "Partie VI · Voix et contre-voix"], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 0.8,
    sound: {
      ticks: [0.8, 13.6],
      chords: [[0.0, "Dm"], [4.2, "Bb"], [9.4, "Dm"]],
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
