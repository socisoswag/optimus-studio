/*
 * Chiffre-clé « gaza » (chapitre 25), ≈ 14 s.
 *
 * Haut-Commissariat des Nations unies aux droits de l'homme, rapport du 8 novembre 2024 sur les morts
 * vérifiés une à une par ses équipes pendant les six premiers mois de la guerre (novembre 2023 —
 * avril 2024) : près de 70 % de femmes et d'enfants.
 */
(function (root) {
  const segments = [
    {
      id: 'gaza', type: 'stat', dur: 12.5, fly: 1.2, layout: 'L', anchor: [470, 30],
      ghost: '2024', kicker: 'Gaza · les six premiers mois de la guerre', pre: 'Près de', value: 70, unit: '%', label: 'de femmes et d’enfants parmi les morts vérifiés',
      text: 'L’ONU a vérifié elle-même l’identité de milliers de victimes. [[Près de sept sur dix]] étaient des femmes et des enfants.',
      textAt: 1.6, hlAt: 5.2, source: 'Haut-Commissariat de l’ONU aux droits de l’homme, novembre 2024', sourceAt: 4.6, countAt: 0.3, countDur: 2.6,
      cam: { lon: 34.18, lat: 31.4, w: 0.026, pitch: 42, bearing: -18 },
      camEnd: { lon: 34.21, lat: 31.4, w: 0.023, pitch: 48, bearing: -14 },
    },
  ];
  const markers = [], zones = [], lights = [];
  zones.push({ seg: 'gaza', at: 0.8, dur: 1.6, name: 'gaza', from: [34.45, 31.5] });
  // la vie de Gaza qui s'éteint par endroits
  lights.push({ seg: 'gaza', at: 0.4, poly: [[34.22, 31.32], [34.5, 31.6], [34.57, 31.55], [34.3, 31.22]], n: 900, off: 3.0, keep: 0.25 });

  root.TL = root.buildTL({
    name: 'chiffre-gaza',
    seed: 8337,
    segments,
    zones,
    lights,
    hud: { label: ['Sion', 'Chapitre 25 · Gaza'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: null },
  });
})(typeof window !== 'undefined' ? window : globalThis);
