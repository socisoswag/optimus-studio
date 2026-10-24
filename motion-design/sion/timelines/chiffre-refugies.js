/*
 * Chiffre-clé « refugies » (chapitre 20), ≈ 14 s.
 *
 * UNRWA (HDX, « UNRWA Palestine Refugees », 2025 T4) : 5 964 782 réfugiés de Palestine enregistrés au
 * 31 décembre 2025 (Jordanie 2 398 179, Gaza 1 545 991, Cisjordanie 938 589, Syrie 357 985, Liban
 * 228 274, non précisé 495 764). Près d'un tiers, plus de 1,5 million de personnes, vivent dans 58 camps reconnus (Jordanie, Liban, Syrie, Cisjordanie avec
 * Jérusalem-Est, Gaza). Résolution 194 de l'Assemblée générale de l'ONU, 11 décembre 1948, § 11.
 */
(function (root) {
  const segments = [
    {
      id: 'refugies', type: 'stat', dur: 12.5, fly: 1.2, layout: 'L', anchor: [470, 30],
      ghost: '1948', kicker: 'Réfugiés de Palestine · 31 décembre 2025', value: 5964782, label: 'réfugiés palestiniens enregistrés',
      text: 'Plus de 1,5 million vivent dans [[58 camps]] : en Jordanie, au Liban, en Syrie, en Cisjordanie et à Gaza. La résolution 194 de l’ONU prévoit leur retour, dès 1948.',
      textAt: 1.6, hlAt: 5.4, source: 'UNRWA (ONU), décembre 2025', sourceAt: 4.8, countAt: 0.3, countDur: 3.8,
      cam: { lon: 36.6, lat: 32.6, w: 0.17, pitch: 36, bearing: -4 },
      camEnd: { lon: 36.6, lat: 32.6, w: 0.15, pitch: 42, bearing: 3 },
    },
  ];
  const markers = [], zones = [], lights = [];
  // les cinq champs d'action de l'UNRWA, où se trouvent les camps
  [['Jordanie', 35.93, 31.95, [1, 1]], ['Liban', 35.5, 33.85, [1, -1]], ['Syrie', 36.29, 33.51, [1, -1]],
   ['Cisjordanie', 35.25, 32.0, [1, 1]], ['Gaza', 34.45, 31.45, [-1, 1]]]
    .forEach(([label, lon, lat, dir], i) => markers.push({ seg: 'refugies', at: 2.0 + 0.5 * i, label, lon, lat, dir, off: 38, area: true, R: 220, endAt: 12.8 }));
  [[35.93, 31.95], [35.5, 33.85], [36.29, 33.51], [35.25, 32.0], [34.45, 31.45]].forEach(([lon, lat], i) => {
    const d = 0.09;
    lights.push({ seg: 'refugies', at: 2.0 + 0.5 * i, poly: [[lon - d, lat + d], [lon + d, lat + d], [lon + d, lat - d], [lon - d, lat - d]], n: 160 });
  });

  root.TL = root.buildTL({
    name: 'chiffre-refugies',
    seed: 11410,
    segments,
    relief: true,
    markers,
    lights,
    hud: { label: ['Sion', 'Chapitre 20 · Les camps'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: null },
  });
})(typeof window !== 'undefined' ? window : globalThis);
