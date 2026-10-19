/*
 * « La cicatrice » (drone.html), 40 s, sans voix : au crépuscule, le tracé réel du mur de séparation s'allume
 * comme une braise sur le relief et court du nord au sud, de Qalandia à Bethléem, sous la caméra.
 *
 * Tracé : OCHA, janvier 2018 (CC BY), tronçons construits et prévus (data/ocha.js, tools/prep_mur.py) ;
 * le trait est dessiné plus large que le mur réel (8 m environ) pour rester visible de haut.
 * Chiffres : en janvier 2018, 464 km construits sur 714 prévus, en grande partie à l'intérieur de la
 * Cisjordanie (OCHA), comme oslo-mur.js. Lumière : soleil couchant à l'ouest (LIGHT_ONLY=crepuscule).
 */
(function (root) {
  const dusk = {
    sun: [3.2, 1.55, 0.75], sky: [0.20, 0.22, 0.32], haze: [0.42, 0.34, 0.33], glow: [1.25, 0.62, 0.32],
    zenith: [0.05, 0.08, 0.20], horizon: [0.80, 0.50, 0.36], fogA: 2.2e-5, fogB: 1 / 1300, rayK: 4e-6,
    clouds: 0.3, exposure: 1.0, waves: 1.0, bloomThr: 1.0, flare: 0.5, albedo: 0.46, sat: 1.05, detail: 0.6, spec: 0.5,
  };
  root.INTRO = {
    name: 'mur-cicatrice',
    total: 40,
    fov: 38,
    fadeIn: 2.0,
    fadeOut: 1.8,
    shots: [
      {
        id: 'mur', t0: 0, t1: 40, light: 'crepuscule', detail: 'collines', sun: [262, 5], env: dusk, wobble: 0.6,
        label: { at: 3.0, out: 8.0, eyebrow: 'Depuis 2002', place: 'Le mur', sub: 'Tracé relevé par l’ONU (OCHA), janvier 2018' },
        // ordre le long du tracé : 0 au nord (32,6° N), 1 au sud (31,3° N) ; Qalandia vers 0,56, Bethléem vers 0,69
        wall: { at: 0.4, prog: [[0, 0.50], [5, 0.56], [30, 0.95], [40, 1.0]], k: 1.0, planned: 0.6 },
        pins: [
          { name: 'Qalandia', lon: 35.2131, lat: 31.8656, at: 1.6, out: 6.0, h: 40 },
          { name: 'Jérusalem', lon: 35.2345, lat: 31.7767, at: 8.0, out: 21.0, h: 60 },
          { name: 'Abu Dis', lon: 35.2611, lat: 31.7617, at: 11.0, out: 21.0, h: 40 },
          { name: 'Bethléem', lon: 35.2024, lat: 31.7054, at: 17.5, out: 34.0, h: 50 },
        ],
        keys: [
          { t: -0.5, lon: 35.225, lat: 31.935, alt: 3500, hdg: 176, pitch: -19 },
          { t: 12, lon: 35.232, lat: 31.865, alt: 3700, hdg: 180, pitch: -20 },
          { t: 25, lon: 35.236, lat: 31.800, alt: 4100, hdg: 184, pitch: -23 },
          { t: 40.5, lon: 35.232, lat: 31.735, alt: 5700, hdg: 188, pitch: -26 },
        ],
      },
    ],
    outro: { at: 33.6, out: 38.4, eyebrow: 'Janvier 2018', lines: ['464 km construits', 'sur 714 prévus'] },
    fx: { streak: 0.5, cuts: [{ t: 33.6, type: 'flash', col: [1, 0.6, 0.3], k: 0.3, pre: 0.08, dur: 0.6 }], shakes: [[33.6, 4, 0.7]] },
    sound: { crackle: [5.0, 30.0], risers: [[32.0, 33.6]], impacts: [[33.6, 0.8]], counts: [[33.9, 1.4], [34.06, 1.4]] },
  };
})(typeof window !== 'undefined' ? window : globalThis);
