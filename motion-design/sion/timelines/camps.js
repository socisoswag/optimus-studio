/*
 * Séquence « Les camps » (chapitre 20), ≈ 40 s.
 *
 * Faits et chiffres retenus (UNRWA) :
 *   - 58 camps de réfugiés de Palestine reconnus : Jordanie 10, Liban 12, Syrie 9, Cisjordanie 19,
 *     Gaza 8 ; plus de 1,5 million de personnes y vivent ;
 *   - janvier — février 2025, opération « Mur de fer » de l'armée israélienne dans le nord de la
 *     Cisjordanie : environ 40 000 réfugiés chassés des camps de Jénine, Tulkarem, Nur Shams et
 *     El Far'a, le plus grand déplacement en Cisjordanie depuis 1967 (UNRWA, ONU).
 * Les camps sont repérés à l'échelle de leur ville (positions approchées).
 */
(function (root) {
  const segments = [
    {
      id: 'camps', type: 'beat', dur: 6.5, hitAt: 1.0, reveal: 'slam', rgb: 12,
      kicker: 'Depuis 1948', word: 'Les camps',
      sub: 'Des tentes d’abord, puis des quartiers de béton. Les réfugiés de 1948 et leurs descendants y vivent toujours.', subAt: 1.4,
      cam: { lon: 36.4, lat: 32.6, w: 0.2, pitch: 32, bearing: -4 },
      camEnd: { lon: 36.4, lat: 32.6, w: 0.18, pitch: 36, bearing: 0 },
    },
    {
      id: 'champs', type: 'cap', dur: 12.0, fly: 1.4, anchor: [330, -60], textW: 860,
      kicker: 'UNRWA · cinq territoires', title: '58 camps',
      text: 'Reconnus par l’ONU en Jordanie, au Liban, en Syrie, en Cisjordanie et à Gaza. [[Plus de 1,5 million de personnes]] y vivent.',
      cam: { lon: 35.05, lat: 32.55, w: 0.13, pitch: 36, bearing: -2 },
      camEnd: { lon: 35.1, lat: 32.55, w: 0.118, pitch: 40, bearing: 3 },
    },
    {
      id: 'nord', type: 'cap', dur: 12.5, fly: 1.8, anchor: [330, -60], textW: 860,
      kicker: 'Janvier — février 2025 · nord de la Cisjordanie', title: 'Des camps vidés',
      text: 'L’armée israélienne chasse environ 40 000 réfugiés des camps de Jénine, Tulkarem, Nur Shams et El Far’a : [[le plus grand déplacement en Cisjordanie depuis 1967.]]',
      cam: { lon: 35.06, lat: 32.33, w: 0.027, pitch: 44, bearing: -6 },
      camEnd: { lon: 35.08, lat: 32.34, w: 0.024, pitch: 48, bearing: 2 },
    },
    {
      id: 'fin', type: 'outro', dur: 8.5, fly: 1.6, hitAt: 1.0,
      eyebrow: '1948 — aujourd’hui',
      lines: ['Réfugiés', 'depuis', 'quatre générations.'],
      cam: { lon: 35.6, lat: 32.6, w: 0.12, pitch: 36, bearing: 0 },
      camEnd: { lon: 35.6, lat: 32.6, w: 0.125, pitch: 34, bearing: 4 },
    },
  ];
  const markers = [], lights = [], strikes = [];
  // les cinq territoires de l'UNRWA et leurs camps (repérés à l'échelle des villes)
  [['Cisjordanie · 19 camps', 35.25, 32.0, [-1, -1]], ['Gaza · 8 camps', 34.42, 31.45, [-1, 1]], ['Jordanie · 10 camps', 35.93, 31.95, [1, 1]],
   ['Liban · 12 camps', 35.5, 33.75, [-1, -1]], ['Syrie · 9 camps', 36.29, 33.51, [1, -1]]]
    .forEach(([label, lon, lat, dir], i) => markers.push({ seg: 'champs', at: 2.0 + 0.55 * i, label, lon, lat, dir, off: 64, area: true, R: 200, endAt: 12.3 }));
  [[35.25, 32.0, 19], [34.42, 31.45, 8], [35.93, 31.95, 10], [35.5, 33.75, 12], [36.29, 33.51, 9]].forEach(([lon, lat, n], i) => {
    const d = 0.1;
    lights.push({ seg: 'champs', at: 2.0 + 0.55 * i, poly: [[lon - d, lat + d], [lon + d, lat + d], [lon + d, lat - d], [lon - d, lat - d]], n: 26 * n, until: 12.3 });
  });
  // nord de la Cisjordanie : les quatre camps s'éteignent
  const NORD = [['Jénine', 35.287, 32.461, [1, -1]], ['Tulkarem', 35.04, 32.315, [-1, -1]], ['Nur Shams', 35.066, 32.318, [1, 1]], ['El Far’a', 35.337, 32.293, [1, 1]]];
  NORD.forEach(([label, lon, lat, dir], i) => {
    markers.push({ seg: 'nord', at: 2.0 + 0.5 * i, label: `Camp de ${label}`, lon, lat, dir, off: 44, endAt: 12.8 });
    const d = 0.006;
    lights.push({ seg: 'nord', at: 0.6, poly: [[lon - d, lat + d], [lon + d, lat + d], [lon + d, lat - d], [lon - d, lat - d]], n: 320, off: 4.4 + 0.6 * i, keep: 0.04, until: 12.8 });
    strikes.push({ seg: 'nord', at: 3.6 + 0.6 * i, lon, lat, power: 0.3, burn: 3 });
  });
  const clock = [{ seg: 'champs', at: 0.2, text: 'Aujourd’hui' }, { seg: 'nord', at: 0.2, text: 'Janvier 2025' }, { seg: 'fin', at: 0.2, text: '' }];

  root.TL = root.buildTL({
    name: 'camps',
    seed: 1950,
    segments,
    markers,
    lights,
    strikes,
    clock,
    hud: { label: ['Sion', 'Chapitre 20 · Les camps'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: null },
  });
})(typeof window !== 'undefined' ? window : globalThis);
