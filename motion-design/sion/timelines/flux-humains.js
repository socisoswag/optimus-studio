/*
 * Séquence « Exodes » (chapitres 13 et 17), ≈ 45 s.
 *
 * Deux déplacements de population, montés l'un après l'autre, sans les mettre en équivalence :
 *   - 1947 – 1949 : environ 700 000 Palestiniens expulsés ou en fuite (estimation de l'ONU
 *     en 1950 : 711 000 réfugiés), vers le Liban, la Syrie, la Transjordanie, la Cisjordanie et Gaza ;
 *   - 1948 – années 1970 : environ 850 000 juifs quittent les pays arabes (ordre de grandeur le
 *     plus cité), surtout vers Israël ; d'Algérie, surtout vers la France (1962).
 *     Pont aérien du Yémen (« Tapis volant », 1949 – 1950, environ 49 000 personnes),
 *     d'Irak (« Ezra et Néhémie », 1951 – 1952, 120 000 à 130 000 personnes).
 * Les trajets sont schématiques (des villes de départ vers les régions d'arrivée).
 */
(function (root) {
  const ISRAEL = [34.85, 32.0];
  const segments = [
    {
      id: 'exodes', type: 'beat', dur: 6.2, hitAt: 1.0, reveal: 'slam', rgb: 12,
      kicker: 'Proche-Orient · 1947 — années 1970', word: 'Exodes',
      sub: 'Partir. Fuir. Être chassé.', subAt: 1.4,
      cam: { lon: 22.0, lat: 33.0, w: 0.95, pitch: 26, bearing: 4 },
      camEnd: { lon: 28.0, lat: 32.5, w: 0.7, pitch: 32, bearing: -3 },
    },
    {
      id: 'nakba', type: 'stat', dur: 14.5, fly: 1.8, layout: 'L', anchor: [470, 40],
      ghost: '1948', kicker: '1947 — 1949 · Palestine', pre: 'Environ', value: 700000,
      label: 'Palestiniens expulsés ou en fuite',
      text: 'Ils deviennent réfugiés au Liban, en Syrie, en Transjordanie, en Cisjordanie et à Gaza. En arabe, on l’appelle la [[Nakba]] : « la catastrophe ».',
      textAt: 1.7, hlAt: 6.2, source: 'Estimation de l’ONU en 1950 : 711 000 réfugiés', sourceAt: 5.0,
      countAt: 0.3, countDur: 4.5,
      cam: { lon: 35.45, lat: 32.35, w: 0.13, pitch: 42, bearing: -8 },
      camEnd: { lon: 35.45, lat: 32.35, w: 0.1, pitch: 48, bearing: 4 },
    },
    {
      id: 'pays-arabes', type: 'stat', dur: 17.0, fly: 2.2, layout: 'B', anchor: [0, -150],
      kicker: '1948 — années 1970 · Du Maroc à l’Irak', pre: 'Environ', value: 850000,
      label: 'Juifs quittent les pays arabes',
      text: 'La plupart s’installent en Israël. D’Algérie, en 1962, la grande majorité part pour la France.',
      textAt: 2.2, source: 'Ordre de grandeur le plus cité par les historiens', sourceAt: 5.5,
      countAt: 0.4, countDur: 7.0,
      cam: { lon: 9.0, lat: 35.5, w: 1.0, pitch: 22, bearing: -4 },
      camEnd: { lon: 33.0, lat: 27.5, w: 1.02, pitch: 24, bearing: 3 },
    },
    {
      id: 'fin', type: 'outro', dur: 6.8,
      eyebrow: '1948 — années 1970',
      lines: ['Deux exils.', 'Deux mémoires.', 'Une même terre.'],
      cam: { lon: 35.2, lat: 31.9, w: 0.32, pitch: 30, bearing: 0 },
    },
  ];

  // Flux : villes de départ → région d'arrivée (temps relatifs au début de la séquence)
  const flows = [
    // 1947 – 1949
    { seg: 'nakba', at: 2.1, dur: 3.4, n: 110, from: [[34.99, 32.79], [35.08, 32.92]], to: [35.33, 33.33], travel: [1.8, 2.8], bend: 0.22, originHeat: 1, R: 260 },
    { seg: 'nakba', at: 2.4, dur: 3.0, n: 80, from: [[35.50, 32.96], [35.53, 32.79]], to: [36.12, 33.28], travel: [1.8, 2.6], bend: -0.18, originHeat: 1, R: 260 },
    { seg: 'nakba', at: 2.1, dur: 3.6, n: 130, from: [[34.75, 32.05], [34.57, 31.67], [34.79, 31.25]], to: [34.42, 31.44], travel: [1.8, 2.8], bend: -0.25, originHeat: 1, spreadTo: 0.08, R: 240 },
    { seg: 'nakba', at: 2.7, dur: 3.0, n: 100, from: [[34.89, 31.95], [34.87, 31.93]], to: [35.22, 31.92], travel: [1.6, 2.4], bend: 0.2, originHeat: 1, spreadTo: 0.1, R: 240 },
    { seg: 'nakba', at: 2.9, dur: 3.0, n: 60, from: [[35.50, 32.50], [35.40, 32.60]], to: [35.88, 32.28], travel: [1.6, 2.4], bend: 0.2, originHeat: 1, R: 240 },
    { seg: 'nakba', at: 3.1, dur: 3.0, n: 60, from: [[35.18, 31.78], [35.15, 31.80]], to: [35.45, 31.86], travel: [1.6, 2.4], bend: -0.2, originHeat: 1, spreadTo: 0.08, R: 220 },
    // 1948 – années 1970
    { seg: 'pays-arabes', at: 2.5, dur: 6.0, n: 170, from: [[-7.59, 33.57], [-5.0, 34.03], [-8.0, 31.63]], to: ISRAEL, travel: [5.0, 6.8], bend: 0.1, spread: 0.6, spreadTo: 0.25, R: 130 },
    { seg: 'pays-arabes', at: 3.0, dur: 4.0, n: 110, from: [[3.06, 36.75], [-0.63, 35.70], [6.61, 36.36]], to: [4.2, 44.6], travel: [2.4, 3.4], bend: 0.12, spread: 0.4, spreadTo: 1.2, R: 220 },
    { seg: 'pays-arabes', at: 3.6, dur: 5.0, n: 70, from: [[10.18, 36.80], [10.86, 33.80]], to: ISRAEL, travel: [4.2, 5.6], bend: 0.1, spread: 0.3, spreadTo: 0.25, R: 130 },
    { seg: 'pays-arabes', at: 4.3, dur: 4.0, n: 50, from: [[13.19, 32.89], [20.07, 32.12]], to: ISRAEL, travel: [3.6, 4.6], bend: 0.1, spread: 0.3, spreadTo: 0.25, R: 130 },
    { seg: 'pays-arabes', at: 5.4, dur: 4.0, n: 60, from: [[31.24, 30.04], [29.92, 31.20]], to: ISRAEL, travel: [1.8, 2.8], bend: 0.18, spread: 0.3, spreadTo: 0.25, R: 130 },
    { seg: 'pays-arabes', at: 6.4, dur: 4.0, n: 130, from: [[44.37, 33.31], [47.8, 30.5]], to: ISRAEL, travel: [2.4, 3.4], bend: -0.22, spread: 0.4, spreadTo: 0.25, R: 130 },
    { seg: 'pays-arabes', at: 7.2, dur: 4.0, n: 55, from: [[44.21, 15.35], [45.03, 12.79]], to: ISRAEL, travel: [3.0, 4.0], bend: 0.22, spread: 0.4, spreadTo: 0.25, R: 130 },
    { seg: 'pays-arabes', at: 7.8, dur: 3.0, n: 30, from: [[36.29, 33.51], [37.16, 36.20], [35.50, 33.89]], to: ISRAEL, travel: [1.4, 2.2], bend: 0.2, spread: 0.2, spreadTo: 0.2, R: 130 },
  ];

  const markers = [
    { seg: 'nakba', at: 4.6, label: 'Liban', lon: 35.33, lat: 33.33, dir: [1, -1], endAt: 14.8 },
    { seg: 'nakba', at: 4.9, label: 'Syrie', lon: 36.12, lat: 33.28, dir: [1, -1], endAt: 14.8 },
    { seg: 'nakba', at: 4.6, label: 'Gaza', lon: 34.42, lat: 31.44, dir: [-1, 1], endAt: 14.8 },
    { seg: 'nakba', at: 5.1, label: 'Cisjordanie', lon: 35.22, lat: 31.92, dir: [1, 1], off: 40, endAt: 14.8 },
    { seg: 'nakba', at: 5.3, label: 'Transjordanie', lon: 35.88, lat: 32.28, dir: [1, -1], endAt: 14.8 },
    { seg: 'pays-arabes', at: 5.8, label: 'France · 1962', lon: 4.2, lat: 44.6, dir: [1, -1], endAt: 17.5 },
    { seg: 'pays-arabes', at: 7.0, label: 'Irak · « Ezra et Néhémie » · 1951 – 1952', lon: 44.37, lat: 33.31, dir: [1, -1], endAt: 17.5 },
    { seg: 'pays-arabes', at: 7.8, label: 'Yémen · « Tapis volant » · 1949 – 1950', lon: 44.21, lat: 15.35, dir: [1, -1], endAt: 17.5 },
    { seg: 'pays-arabes', at: 10.5, label: 'Israël', lon: 34.85, lat: 32.0, dir: [-1, -1], endAt: 17.5 },
  ];

  root.TL = root.buildTL({
    name: 'flux-humains',
    seed: 1949,
    segments,
    markers,
    flows,
    hud: { label: ['Sion', 'Chapitres 13 et 17 · Exodes'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: {
      ticks: [0.6, 38.0],
      chords: [[0.0, 'Gm'], [6.2, 'Dm'], [20.7, 'Bb'], [37.7, 'Dm9']],
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
