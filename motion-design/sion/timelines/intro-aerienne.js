/*
 * Intro aérienne du film (drone.html), environ 1 min, sans voix.
 *
 * Quatre plans d'un même matin, reliés par des passages dans la brume :
 *   1. l'arrivée par la mer, au large de Jaffa, face au soleil qui se lève sur les collines ;
 *   2. les monts de Judée à l'ouest de Jérusalem, lumière rasante du sud-est ;
 *   3. le plateau du désert de Judée qui s'arrête net : la falaise d'Ein Gedi, la mer Morte 500 m plus bas ;
 *   4. au-dessus de la mer Morte vers le sud, le titre.
 *
 * Relief : SRTM (NASA). Images : Sentinel-2 cloudless 2016 d'EOX (CC BY 4.0). Préparation : tools/prep_drone.py.
 * La surface de la mer Morte est aujourd'hui à plus de 430 m sous le niveau de la mer (environ -438 m en 2024).
 * Points clés : t (s, depuis le début du plan), lon, lat, alt (m), hdg (cap, degrés), pitch (degrés, négatif vers le bas).
 */
(function (root) {
  const dawn = {
    sun: [3.6, 1.85, 0.9], sky: [0.22, 0.27, 0.38], haze: [0.50, 0.40, 0.34], glow: [1.35, 0.68, 0.32],
    zenith: [0.07, 0.13, 0.30], horizon: [0.92, 0.60, 0.38], fogA: 2.4e-5, fogB: 1 / 1300, rayK: 4e-6,
    clouds: 0.34, exposure: 1.05, waves: 1.0, bloomThr: 1.4, flare: 1.0, albedo: 0.5, sat: 0.98,
  };
  const morning = {
    sun: [4.4, 3.1, 2.0], sky: [0.26, 0.33, 0.46], haze: [0.50, 0.50, 0.52], glow: [1.0, 0.76, 0.52],
    zenith: [0.06, 0.15, 0.38], horizon: [0.66, 0.64, 0.64], fogA: 2.0e-5, fogB: 1 / 1100, rayK: 5e-6,
    clouds: 0.26, exposure: 1.0, waves: 1.0, bloomThr: 2.0, flare: 0.6, albedo: 0.46, sat: 0.95,
  };
  const desert = {
    sun: [3.5, 2.75, 1.95], sky: [0.27, 0.34, 0.48], haze: [0.54, 0.52, 0.52], glow: [0.95, 0.80, 0.60],
    zenith: [0.06, 0.16, 0.40], horizon: [0.68, 0.66, 0.66], fogA: 1.9e-5, fogB: 1 / 1600, rayK: 5e-6,
    clouds: 0.14, exposure: 0.95, waves: 1.3, bloomThr: 1.9, flare: 0.5, albedo: 0.38, sat: 0.98,
  };
  const title = { ...desert, fogA: 2.1e-5, fogB: 1 / 1900, glow: [1.05, 0.82, 0.58], clouds: 0.2, exposure: 0.9, albedo: 0.36 };

  const space = { sunI: 20, mie: 1.3e-5, night: 0.6, clouds: 1, stars: 1, day: 0.85, albedo: 0.5, specLo: 140,
    sun: [3.0, 2.2, 1.6], bloomThr: 1.6, flare: 0.6, tint: 0.15 };
  root.INTRO = {
    name: 'intro-aerienne',
    total: 84,
    fov: 38,
    fadeStart: 1.2,
    fadeIn: 2.6,
    fadeOut: 1.6,
    dips: [[35, 0.5], [49, 0.5], [64, 0.5]],
    dipCol: [0.93, 0.87, 0.79],
    shots: [
      {
        // la nuit sur la Méditerranée vue de 7 000 km, le soleil se lève derrière le bord de la Terre,
        // puis la plongée continue jusqu'aux nuages au large de Jaffa
        id: 'espace', type: 'space', t0: 0, t1: 23, light: 'cote', sun: [101, 3.2], env: space, fov: 42,
        lapse: [[0, 59], [6.4, 53.4], [11, 40], [16, 15], [19.5, 3], [23, -2.5]],
        expo: [[0, 1.8], [6, 1.25], [10, 1.0], [16, 1.0], [20, 0.9], [23, 0.9]],
        nightKeys: [[0, 1], [14, 1], [16.5, 0.45], [18.5, 0.12], [20, 0]],
        fovKeys: [[0, 44], [14, 40], [23, 38]],
        cloudPass: [[21.3, 0], [22.6, 1], [23, 1]],
        hud: [3.5, 21.6],
        deck: { lon: 34.56, lat: 32.03, alt: 3600, r: 34000 },
        keys: [
          { t: 0, lon: 11.0, lat: 26.0, alt: 7.4e6, hdg: 54, pitch: -69 },
          { t: 6, lon: 13.0, lat: 26.6, alt: 6.8e6, hdg: 55, pitch: -68 },
          { t: 11, lon: 21.5, lat: 29.0, alt: 3.2e6, hdg: 68, pitch: -54 },
          { t: 15, lon: 30.5, lat: 31.3, alt: 5.5e5, hdg: 86, pitch: -36 },
          { t: 18, lon: 33.6, lat: 31.95, alt: 6.0e4, hdg: 99, pitch: -30 },
          { t: 20.5, lon: 34.43, lat: 32.03, alt: 1.2e4, hdg: 104, pitch: -20 },
          { t: 23, lon: 34.62, lat: 32.033, alt: 3.0e3, hdg: 103, pitch: -8 },
        ],
      },
      {
        id: 'cote', t0: 23, t1: 35, cloudPass: [[0, 1], [0.35, 1], [1.7, 0]], light: 'cote', detail: 'cote', sun: [101, 3.2], env: dawn,
        label: { at: 3.2, eyebrow: '32°02′ N · 34°41′ E', place: 'Mer Méditerranée', sub: 'Au large de Jaffa' },
        pins: [{ name: 'Jaffa', lon: 34.7525, lat: 32.0540, at: 5.4, out: 10.6, h: 40 }],
        keys: [
          { t: 0, lon: 34.668, lat: 32.031, alt: 640, hdg: 103, pitch: -5.5 },
          { t: 7, lon: 34.678, lat: 32.029, alt: 590, hdg: 102.4, pitch: -5.0 },
          { t: 14.6, lon: 34.689, lat: 32.026, alt: 540, hdg: 101.6, pitch: -4.4 },
        ],
      },
      {
        id: 'collines', t0: 35, t1: 49, light: 'collines', detail: 'collines', sun: [128, 11], env: morning,
        label: { at: 2.4, eyebrow: '31°46′ N · 35°06′ E', place: 'Monts de Judée', sub: 'À l’ouest de Jérusalem' },
        pins: [
          { name: 'Jérusalem', lon: 35.2345, lat: 31.7767, at: 4.6, out: 12.4, h: 60 },
          { name: 'Bethléem', lon: 35.2024, lat: 31.7054, at: 5.6, out: 12.4, h: 60 },
        ],
        keys: [
          { t: -0.6, lon: 35.040, lat: 31.7580, alt: 2700, hdg: 79, pitch: -11, roll: -1.2 },
          { t: 7, lon: 35.058, lat: 31.7620, alt: 2680, hdg: 80.5, pitch: -10.3, roll: -0.6 },
          { t: 14.6, lon: 35.076, lat: 31.766, alt: 2700, hdg: 82, pitch: -9.6, roll: 0 },
        ],
      },
      {
        id: 'desert', t0: 49, t1: 64, light: 'desert', detail: 'desert', sun: [114, 17], env: desert,
        label: { at: 8.6, eyebrow: '31°28′ N · 35°23′ E', place: 'Désert de Judée', sub: 'La mer Morte, à plus de 430 mètres sous le niveau de la mer' },
        gauge: { at: 6.2, dur: 3.2, from: 150, to: -430, out: 13.6, k: 'Altitude du sol', done: 'Le point le plus bas de la Terre' },
        keys: [
          { t: -0.6, lon: 35.336, lat: 31.4712, alt: 2350, hdg: 88, pitch: -13 },
          { t: 5, lon: 35.355, lat: 31.4706, alt: 2330, hdg: 89, pitch: -12 },
          { t: 10, lon: 35.373, lat: 31.4700, alt: 2320, hdg: 90.5, pitch: -9.5 },
          { t: 15.6, lon: 35.392, lat: 31.4694, alt: 2330, hdg: 92, pitch: -7.5 },
        ],
      },
      {
        id: 'titre', t0: 64, t1: 84, light: 'titre', detail: 'desert', sun: [118, 14], env: title,
        keys: [
          { t: -0.6, lon: 35.49, lat: 31.785, alt: 2500, hdg: 184, pitch: -14 },
          { t: 9, lon: 35.49, lat: 31.770, alt: 2650, hdg: 183, pitch: -11.5 },
          { t: 18.6, lon: 35.49, lat: 31.755, alt: 2850, hdg: 182, pitch: -9.5 },
        ],
      },
    ],
    title: { at: 67.8, out: 80.2, word: 'SION', scripts: ['ציון', 'صهيون'], sub: 'L’idée, la terre, le choc' },
    sound: { space: [0, 15], sunrise: 6.4, entry: [12, 22.8], surf: [23, 35.6], reveal: 56.6, titleSilence: 0.7 }, // ressac sous le plan de la mer, grondement quand la mer Morte apparaît
  };
})(typeof window !== 'undefined' ? window : globalThis);
