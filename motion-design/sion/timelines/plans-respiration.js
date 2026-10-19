/*
 * Plans aériens « de respiration » (drone.html) : cinq plans de 9 s, sans aucun texte, à poser sous la voix.
 * Rendus d'un seul tenant (coupes franches), puis découpés plan par plan par tools/build_intro.sh (PLANS=1)
 * dans output/plans-respiration/. Relief SRTM, images Sentinel-2 du 11 mai 2025, lumières précalculées.
 */
(function (root) {
  const base = { waves: 1.0, bloomThr: 1.9, flare: 0.5, sat: 0.98, detail: 0.8, clouds: 0.22 };
  const dawn = { ...base, sun: [3.6, 1.85, 0.9], sky: [0.22, 0.27, 0.38], haze: [0.50, 0.40, 0.34], glow: [1.35, 0.68, 0.32],
    zenith: [0.07, 0.13, 0.30], horizon: [0.92, 0.60, 0.38], fogA: 2.2e-5, fogB: 1 / 1300, rayK: 4e-6, exposure: 1.05, albedo: 0.5, flare: 0.9 };
  const morning = { ...base, sun: [4.4, 3.1, 2.0], sky: [0.26, 0.33, 0.46], haze: [0.50, 0.50, 0.52], glow: [1.0, 0.76, 0.52],
    zenith: [0.06, 0.15, 0.38], horizon: [0.66, 0.64, 0.64], fogA: 2.0e-5, fogB: 1 / 1100, rayK: 5e-6, exposure: 1.0, albedo: 0.48 };
  const desert = { ...base, sun: [3.5, 2.75, 1.95], sky: [0.27, 0.34, 0.48], haze: [0.54, 0.52, 0.52], glow: [0.95, 0.80, 0.60],
    zenith: [0.06, 0.16, 0.40], horizon: [0.68, 0.66, 0.66], fogA: 1.9e-5, fogB: 1 / 1600, rayK: 5e-6, exposure: 0.95, albedo: 0.38, waves: 1.3 };
  const dusk = { ...base, sun: [3.2, 1.55, 0.75], sky: [0.20, 0.22, 0.32], haze: [0.42, 0.34, 0.33], glow: [1.25, 0.62, 0.32],
    zenith: [0.05, 0.08, 0.20], horizon: [0.80, 0.50, 0.36], fogA: 2.2e-5, fogB: 1 / 1300, rayK: 4e-6, exposure: 1.0, albedo: 0.46, flare: 0.9 };
  const P = (id, t0, light, sun, env, a, b, extra = {}) => ({ id, t0, t1: t0 + 9, light, sun, env, wobble: 0.7, ...extra,
    keys: [{ t: -0.3, ...a }, { t: 9.3, ...b }] });
  root.INTRO = {
    name: 'plans-respiration',
    total: 45,
    fov: 38,
    fadeIn: 0.4,
    fadeOut: 0.4,
    shots: [
      // Jérusalem au couchant, à contre-jour, depuis l'est
      P('jerusalem', 0, 'crepuscule', [262, 5], dusk,
        { lon: 35.300, lat: 31.772, alt: 2600, hdg: 268, pitch: -9 }, { lon: 35.288, lat: 31.773, alt: 2550, hdg: 269, pitch: -8.5 }, { detail: 'collines' }),
      // Hébron et ses collines
      P('hebron', 9, 'titre', [118, 14], morning,
        { lon: 35.020, lat: 31.462, alt: 2800, hdg: 50, pitch: -10 }, { lon: 35.033, lat: 31.472, alt: 2820, hdg: 52, pitch: -10 }),
      // Ramallah à l'aube
      P('ramallah', 18, 'cote', [101, 3.2], dawn,
        { lon: 35.130, lat: 31.840, alt: 2600, hdg: 35, pitch: -8 }, { lon: 35.142, lat: 31.853, alt: 2620, hdg: 36, pitch: -8 }),
      // le soleil se lève sur la mer Morte, derrière les monts de Moab
      P('mer-morte', 27, 'cote', [101, 3.2], dawn,
        { lon: 35.385, lat: 31.560, alt: 1350, hdg: 100, pitch: -5 }, { lon: 35.398, lat: 31.558, alt: 1320, hdg: 101, pitch: -4.5 }, { detail: 'desert' }),
      // les monts de Judée, plan large
      P('judee', 36, 'collines', [128, 11], morning,
        { lon: 35.060, lat: 31.735, alt: 2750, hdg: 82, pitch: -11 }, { lon: 35.078, lat: 31.739, alt: 2800, hdg: 84, pitch: -11 }, { detail: 'collines' }),
    ],
    plans: true,
    sound: { },
  };
})(typeof window !== 'undefined' ? window : globalThis);
