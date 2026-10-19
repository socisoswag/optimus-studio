/*
 * « Les villages vidés » (drone.html), 45 s, sans voix : la nuit, de l'entrée de Jérusalem jusqu'à la mer.
 * Chaque village palestinien dépeuplé s'allume à son emplacement exact, d'est en ouest, devant la caméra ;
 * à la fin la caméra s'élève au-dessus de la plaine côtière, la lune se reflète sur la Méditerranée.
 *
 * Villages : Wikidata, classe « village palestinien dépeuplé » (CC0), 428 points sans doublons, dont environ
 * 200 dans la zone du relief (entre Jaffa, Gaza et la vallée du Jourdain) ; voir data/villages-depeuples.js.
 * Nombre de 418 villages vidés en 1948 : Walid Khalidi, All That Remains, 1992 (comme nakba-1948.js).
 * Lune : lumière d'ouest, ombres précalculées (LIGHT_ONLY=lune tools/prep_drone.py).
 */
(function (root) {
  const night = {
    sun: [0.20, 0.25, 0.38], sky: [0.016, 0.024, 0.046], haze: [0.012, 0.016, 0.030], glow: [0.05, 0.055, 0.075],
    zenith: [0.002, 0.005, 0.014], horizon: [0.014, 0.019, 0.034], fogA: 1.5e-5, fogB: 1 / 1400, rayK: 3e-6,
    clouds: 0, stars: 1.4, exposure: 1.05, waves: 1.3, bloomThr: 0.7, flare: 0, albedo: 0.42, sat: 0.4, detail: 0.4, tint: 0.6, spec: 0.05,
  };
  root.INTRO = {
    name: 'villages-lumieres',
    total: 45,
    fov: 38,
    fadeIn: 2.2,
    fadeOut: 2.0,
    shots: [
      {
        id: 'nuit', t0: 0, t1: 45, light: 'lune', detail: 'collines', sun: [252, 22], env: night, wobble: 0.5,
        label: { at: 3.0, out: 9.5, eyebrow: '1947 · 1949', place: 'Les villages vidés', sub: 'Chaque lumière, un village palestinien dépeuplé' },
        lights: { lon0: 35.26, lon1: 34.45, at: [1.6, 29.0], size: 11.0, gain: 3.2 },
        pins: [
          { name: 'Lifta', lon: 35.1967, lat: 31.7944, at: 2.6, out: 11.0, h: 30 },
          { name: 'Deir Yassin', lon: 35.1781, lat: 31.7858, at: 3.6, out: 12.0, h: 30 },
          { name: 'al-Dawayima', lon: 34.9119, lat: 31.5361, at: 17.0, out: 30.0, h: 30 },
          { name: 'Bayt Jibrin', lon: 34.8983, lat: 31.6053, at: 16.0, out: 30.0, h: 30 },
          { name: 'Isdud', lon: 34.6617, lat: 31.7536, at: 22.0, out: 34.0, h: 30 },
        ],
        keys: [
          { t: -0.5, lon: 35.245, lat: 31.800, alt: 2500, hdg: 263, pitch: -14 },
          { t: 10, lon: 35.165, lat: 31.806, alt: 2700, hdg: 265, pitch: -15 },
          { t: 22, lon: 35.035, lat: 31.810, alt: 3600, hdg: 262, pitch: -18 },
          { t: 34, lon: 34.930, lat: 31.800, alt: 8600, hdg: 258, pitch: -31 },
          { t: 45.5, lon: 34.880, lat: 31.792, alt: 11800, hdg: 256, pitch: -34 },
        ],
      },
    ],
    outro: { at: 36.4, out: 42.6, eyebrow: '1947 · 1949', lines: ['418 villages', 'vidés de leurs habitants'] },
    sound: { night: true, crackle: [1.6, 29.0], hits: [36.6] },
  };
})(typeof window !== 'undefined' ? window : globalThis);
