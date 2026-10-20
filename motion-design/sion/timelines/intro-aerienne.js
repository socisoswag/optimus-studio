/*
 * Intro aérienne du film (drone.html), environ 1 min 14, sans voix.
 *
 * L'espace et la mer sont en 3D ; la terre est filmée pour de vrai :
 *   1. la nuit sur la Méditerranée vue de l'espace, puis la plongée jusqu'au large de Jaffa (3D) ;
 *   2. la sortie des nuages au-dessus de la mer, face au soleil qui se lève (3D) ;
 *   2 bis. Jaffa, la vieille ville et le port (vrai plan, Adobe Stock 390879149), après un fondu ;
 *   3. le désert de Judée, le ouadi Qelt et le monastère Saint-Georges (vrai plan, Adobe Stock 593067850) ;
 *   4. la mer Morte vue du ciel, l'altimètre à -430 m, le titre (vrai plan, Adobe Stock 198345828).
 * Les plans 3 et 4 (« plate ») ne sont pas calculés en 3D : la page n'en rend que les textes, sur fond transparent
 * (render.mjs --alpha), et tools/intro_hybride.sh les pose sur les vrais plans.
 *
 * Relief : SRTM (NASA). Images : Copernicus Sentinel-2 L2A du 11 mai 2025 ; globe : NASA Blue Marble, Black Marble 2016
 * et couverture nuageuse (domaine public). Préparation : tools/prep_drone.py, tools/prep_globe.py.
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
    total: 77.28,
    fov: 38,
    fadeStart: 1.2,
    fadeIn: 2.6,
    fadeOut: 1.6,
    dips: [],
    // effets : turbulence à l'entrée dans l'atmosphère, coupes en filé, flash et impact avant le titre, bandes cinéma
    fx: {
      letterbox: 2.39, streak: 0.35,
      cuts: [
        { t: 28.6, type: 'fondu', dur: 0.8 },
        { t: 56.72, type: 'flash', col: [1, 0.86, 0.7], pre: 0.14, dur: 0.45 },
        { t: 63.2, type: 'flash', col: [1, 0.55, 0.25], k: 0.28, pre: 0.05, dur: 0.5 },
      ],
      shakes: [[16.8, 2.2, 1.4], [18.9, 3.2, 1.1], [20.6, 4.5, 0.9]],
    },
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
        id: 'cote', t0: 23, t1: 28.6, ramp: [[0, 1.9], [1.6, 0.95], [10.6, 0.95], [12, 1.8]], cloudPass: [[0, 1], [0.35, 1], [1.7, 0]], light: 'cote', detail: 'cote', sun: [101, 3.2], env: dawn,
        label: { at: 3.2, eyebrow: '32°02′ N · 34°41′ E', place: 'Mer Méditerranée', sub: 'Au large de Jaffa' },
        pins: [{ name: 'Jaffa', lon: 34.7525, lat: 32.0540, at: 5.4, out: 10.6, h: 40 }],
        keys: [
          { t: 0, lon: 34.668, lat: 32.031, alt: 640, hdg: 90, pitch: -5.5 },
          { t: 7, lon: 34.678, lat: 32.029, alt: 590, hdg: 89.4, pitch: -5.0 },
          { t: 14.6, lon: 34.689, lat: 32.026, alt: 540, hdg: 88.6, pitch: -4.4 },
        ],
      },
      {
        // vrai plan : Jaffa, le clocher, la vieille ville et le port ; on y arrive par un fondu depuis la mer en 3D
        id: 'jaffa', t0: 28.6, t1: 38.6, plate: { src: 'output/plans-reels/jaffa-clocher-vieille-ville-aerien.mp4', stock: '390879149' },
        light: 'cote', detail: 'cote', sun: [101, 3.2], env: dawn,
        label: { at: 1.4, eyebrow: '32°03′ N · 34°45′ E', place: 'Jaffa', sub: 'La vieille ville, face à la Méditerranée' },
        keys: [
          { t: 0, lon: 34.668, lat: 32.031, alt: 640, hdg: 90, pitch: -5.5 },
          { t: 10, lon: 34.689, lat: 32.026, alt: 540, hdg: 88.6, pitch: -4.4 },
        ],
      },
      {
        // vrai plan : le ouadi Qelt, entre Jérusalem et Jéricho (Cisjordanie)
        id: 'desert', t0: 38.6, t1: 56.72, plate: { src: 'output/plans-reels/desert-judee-ouadi-qelt-saint-georges.mp4', stock: '593067850' },
        light: 'desert', detail: 'desert', sun: [114, 17], env: desert,
        label: { at: 2.2, eyebrow: '31°51′ N · 35°25′ E', place: 'Désert de Judée', sub: 'Le ouadi Qelt, entre Jérusalem et Jéricho' },
        keys: [
          { t: 0, lon: 35.336, lat: 31.4712, alt: 2350, hdg: 88, pitch: -13 },
          { t: 18.2, lon: 35.392, lat: 31.4694, alt: 2330, hdg: 92, pitch: -7.5 },
        ],
      },
      {
        // vrai plan : la mer Morte vue du ciel, le point le plus bas de la Terre, puis le titre
        id: 'titre', t0: 56.72, t1: 77.28, plate: { src: 'output/plans-reels/mer-morte-aerien.mp4', stock: '198345828' },
        light: 'titre', detail: 'desert', sun: [118, 14], env: title,
        gauge: { at: 0.6, dur: 3.0, from: 150, to: -430, out: 5.4, k: 'Altitude du sol', done: 'Le point le plus bas de la Terre' },
        keys: [
          { t: 0, lon: 35.49, lat: 31.785, alt: 2500, hdg: 184, pitch: -14 },
          { t: 20.6, lon: 35.49, lat: 31.755, alt: 2850, hdg: 182, pitch: -9.5 },
        ],
      },
    ],
    title: { at: 63.2, out: 74.6, word: 'SION', scripts: ['ציון', 'صهيون'], sub: 'L’idée, la terre, le choc' },
    sound: { space: [0, 15], sunrise: 6.4, entry: [12, 22.8], surf: [23, 39.2], reveal: 56.9, titleSilence: 0.7,
      whips: [[38.6, 1]], risers: [[55.1, 56.72]], impacts: [[56.72, 1]] }, // ressac sous le plan de la mer, grondement quand la mer Morte apparaît
  };
})(typeof window !== 'undefined' ? window : globalThis);
