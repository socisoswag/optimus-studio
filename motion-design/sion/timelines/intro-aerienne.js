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
    clouds: 0.34, exposure: 1.05, waves: 1.0, bloomThr: 1.15, flare: 1.0, albedo: 0.5, sat: 1.1,
  };
  const morning = {
    sun: [4.4, 3.1, 2.0], sky: [0.26, 0.33, 0.46], haze: [0.50, 0.50, 0.52], glow: [1.0, 0.76, 0.52],
    zenith: [0.06, 0.15, 0.38], horizon: [0.66, 0.64, 0.64], fogA: 2.0e-5, fogB: 1 / 1100, rayK: 5e-6,
    clouds: 0.26, exposure: 1.0, waves: 1.0, bloomThr: 1.3, flare: 0.6, albedo: 0.5, sat: 1.2,
  };
  const desert = {
    sun: [3.5, 2.75, 1.95], sky: [0.27, 0.34, 0.48], haze: [0.54, 0.52, 0.52], glow: [0.95, 0.80, 0.60],
    zenith: [0.06, 0.16, 0.40], horizon: [0.68, 0.66, 0.66], fogA: 1.9e-5, fogB: 1 / 1600, rayK: 5e-6,
    clouds: 0.14, exposure: 0.95, waves: 0.35, bloomThr: 1.4, flare: 0.5, albedo: 0.38, sat: 1.15,
  };
  const title = { ...desert, fogA: 2.1e-5, fogB: 1 / 1900, glow: [1.05, 0.82, 0.58], clouds: 0.2, exposure: 0.9, albedo: 0.36 };

  root.INTRO = {
    name: 'intro-aerienne',
    total: 61,
    fov: 38,
    fadeIn: 2.4,
    fadeOut: 1.6,
    dips: [[14, 0.5], [28, 0.5], [43, 0.5]],
    dipCol: [0.93, 0.87, 0.79],
    shots: [
      {
        id: 'cote', t0: 0, t1: 14, light: 'cote', detail: 'cote', sun: [101, 3.2], env: dawn,
        label: { at: 3.2, eyebrow: '32°02′ N · 34°41′ E', place: 'Mer Méditerranée', sub: 'Au large de Jaffa' },
        keys: [
          { t: 0, lon: 34.668, lat: 32.031, alt: 640, hdg: 103, pitch: -5.5 },
          { t: 7, lon: 34.678, lat: 32.029, alt: 590, hdg: 102.4, pitch: -5.0 },
          { t: 14.6, lon: 34.689, lat: 32.026, alt: 540, hdg: 101.6, pitch: -4.4 },
        ],
      },
      {
        id: 'collines', t0: 14, t1: 28, light: 'collines', detail: 'collines', sun: [128, 11], env: morning,
        label: { at: 2.4, eyebrow: '31°46′ N · 35°06′ E', place: 'Monts de Judée', sub: 'À l’ouest de Jérusalem' },
        keys: [
          { t: -0.6, lon: 35.082, lat: 31.7638, alt: 1170, hdg: 79, pitch: -9.5, roll: -1.2 },
          { t: 7, lon: 35.097, lat: 31.7675, alt: 1160, hdg: 80.5, pitch: -8.6, roll: -0.6 },
          { t: 14.6, lon: 35.112, lat: 31.771, alt: 1175, hdg: 82, pitch: -7.6, roll: 0 },
        ],
      },
      {
        id: 'desert', t0: 28, t1: 43, light: 'desert', detail: 'desert', sun: [114, 17], env: desert,
        label: { at: 8.6, eyebrow: '31°28′ N · 35°23′ E', place: 'Désert de Judée', sub: 'La mer Morte, à plus de 430 mètres sous le niveau de la mer' },
        keys: [
          { t: -0.6, lon: 35.343, lat: 31.4712, alt: 1060, hdg: 88, pitch: -12 },
          { t: 5, lon: 35.3605, lat: 31.4706, alt: 1050, hdg: 89, pitch: -11 },
          { t: 10, lon: 35.376, lat: 31.4700, alt: 1045, hdg: 90.5, pitch: -8.5 },
          { t: 15.6, lon: 35.393, lat: 31.4694, alt: 1050, hdg: 92, pitch: -6.5 },
        ],
      },
      {
        id: 'titre', t0: 43, t1: 61, light: 'titre', detail: 'desert', sun: [118, 14], env: title,
        keys: [
          { t: -0.6, lon: 35.49, lat: 31.785, alt: 2500, hdg: 184, pitch: -14 },
          { t: 9, lon: 35.49, lat: 31.770, alt: 2650, hdg: 183, pitch: -11.5 },
          { t: 18.6, lon: 35.49, lat: 31.755, alt: 2850, hdg: 182, pitch: -9.5 },
        ],
      },
    ],
    title: { at: 46.6, out: 57.6, word: 'SION', scripts: ['ציון', 'صهيون'], sub: 'L’idée, la terre, le choc' },
    sound: { surf: [0, 14.6], reveal: 35.6 }, // ressac sous le plan de la mer, grondement quand la mer Morte apparaît
  };
})(typeof window !== 'undefined' ? window : globalThis);
