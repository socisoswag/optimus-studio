/*
 * « Gaza, vue du ciel » (drone.html), 36 s, sans voix : la bande de Gaza survolée depuis la mer, sur deux
 * images satellite de la même saison. Un front balaie la bande du nord-est au sud-ouest : derrière lui,
 * l'image du 11 septembre 2025 remplace celle du 17 septembre 2023.
 *
 * Images : Copernicus Sentinel-2 L2A en couleurs vraies (10 m), S2A du 17 septembre 2023 et S2B du
 * 11 septembre 2025, sans nuages, soleil à une hauteur voisine (57° et 59°). Relief : SRTM.
 * Préparation : python3 tools/prep_drone.py <cache> gaza ; fabrication : tools/build_intro.sh gaza-vue-du-ciel
 * À 10 m par pixel, on ne voit pas chaque bâtiment : on voit la ville, les camps et les champs changer
 * de couleur (gravats gris, cultures disparues), comme sur les analyses publiées à partir des mêmes images.
 */
(function (root) {
  const day = {
    sun: [3.9, 3.4, 2.8], sky: [0.30, 0.37, 0.50], haze: [0.62, 0.64, 0.68], glow: [0.95, 0.85, 0.70],
    zenith: [0.07, 0.17, 0.42], horizon: [0.70, 0.72, 0.75], fogA: 1.7e-5, fogB: 1 / 1500, rayK: 5e-6,
    clouds: 0.1, exposure: 0.9, waves: 1.6, bloomThr: 1.8, flare: 0.2, albedo: 0.34, sat: 1.15, detail: 0.6,
  };
  root.INTRO = {
    name: 'gaza-vue-du-ciel',
    data: 'drone-gaza',
    albedo: 'albedo-2023',
    albedoB: 'albedo-2025',
    total: 36,
    fov: 38,
    fadeIn: 1.6,
    fadeOut: 1.6,
    shots: [
      {
        id: 'gaza', t0: 0, t1: 36, light: 'gaza', sun: [228, 36], env: day, wobble: 0.6,
        label: { at: 2.0, out: 4.0, eyebrow: '31°31′ N · 34°27′ E', place: 'Gaza', sub: 'Vue du ciel, à deux ans d’écart' },
        stamp: {
          at: 1.4, out: 33.6, k: 'Image satellite', sub: 'Copernicus Sentinel-2 · 10 m',
          items: [[0, '17 septembre 2023'], [10.0, '11 septembre 2025']],
        },
        // le front part de Beit Hanoun vers le sud-ouest, toute la longueur de la bande
        wipe: { lon: 34.545, lat: 31.55, dir: 228, d0: -1500, d1: 47000, t0: 7.2, t1: 17.5, w: 140, glow: 1.0 },
        pins: [
          { name: 'Jabalia', lon: 34.483, lat: 31.531, at: 4.0, out: 14.5, h: 40 },
          { name: 'Gaza', lon: 34.456, lat: 31.507, at: 3.4, out: 30.0, h: 40 },
          { name: 'Deir al-Balah', lon: 34.351, lat: 31.418, at: 15.0, out: 27.0, h: 40 },
          { name: 'Khan Younis', lon: 34.306, lat: 31.346, at: 22.5, out: 34.4, h: 40 },
          { name: 'Rafah', lon: 34.25, lat: 31.287, at: 30.8, out: 34.4, h: 40 },
        ],
        keys: [
          { t: 0, lon: 34.385, lat: 31.598, alt: 5000, hdg: 130, pitch: -36 },
          { t: 9, lon: 34.366, lat: 31.560, alt: 5200, hdg: 136, pitch: -35 },
          { t: 18, lon: 34.335, lat: 31.508, alt: 5500, hdg: 144, pitch: -34 },
          { t: 27, lon: 34.296, lat: 31.458, alt: 5800, hdg: 156, pitch: -33 },
          { t: 36.5, lon: 34.258, lat: 31.408, alt: 6100, hdg: 168, pitch: -32 },
        ],
      },
    ],
    // grondement sourd quand le front se met en marche, souffle qui le suit
    fx: { streak: 0.45, cuts: [{ t: 7.2, type: 'flash', col: [1, 0.6, 0.3], k: 0.3, pre: 0.08, dur: 0.6 }], shakes: [[7.2, 4, 0.8]] },
    sound: { reveal: 7.6, sweeps: [[7.2, 10.5]], risers: [[5.6, 7.2]], impacts: [[7.2, 0.8]] },
  };
})(typeof window !== 'undefined' ? window : globalThis);
