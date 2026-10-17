/*
 * Chiffre-clé « colons » (chapitre 23), ≈ 14 s.
 *
 * Haut-Commissariat des Nations unies aux droits de l'homme, rapport sur les colonies présenté au
 * Conseil des droits de l'homme en mars 2024 : environ 700 000 colons israéliens dans quelque 300
 * colonies et avant-postes en Cisjordanie, Jérusalem-Est comprise. Cour internationale de justice, avis
 * consultatif du 19 juillet 2024 : la présence d'Israël dans le territoire palestinien occupé est
 * illicite ; Israël doit cesser toute nouvelle colonisation et évacuer tous les colons.
 */
(function (root) {
  const segments = [
    {
      id: 'colons', type: 'stat', dur: 13.0, fly: 1.2, layout: 'L', anchor: [470, 30],
      ghost: '2024', kicker: 'Cisjordanie et Jérusalem-Est · 2024', pre: 'Environ', value: 700000, label: 'colons israéliens',
      text: 'Dans quelque 300 colonies et avant-postes, illégaux au regard du droit international. Le 19 juillet 2024, [[la Cour internationale de justice demande l’évacuation de tous les colons.]]',
      textAt: 1.6, hlAt: 6.0, source: 'Haut-Commissariat de l’ONU aux droits de l’homme · Cour internationale de justice', sourceAt: 5.0, countAt: 0.3, countDur: 3.4,
      cam: { lon: 34.86, lat: 31.9, w: 0.05, pitch: 42, bearing: 6 },
      camEnd: { lon: 34.89, lat: 31.9, w: 0.045, pitch: 48, bearing: -2 },
    },
  ];
  const markers = [], zones = [], lights = [];
  zones.push({ seg: 'colons', at: 0.8, dur: 2.6, name: 'cisjordanie', from: [35.25, 31.95], tone: 'stone' });
  zones.push({ seg: 'colons', at: 2.6, dur: 1.0, name: 'jerusalem-est', from: [35.23, 31.78] });
  markers.push({ seg: 'colons', at: 3.0, label: 'Jérusalem-Est', lon: 35.23, lat: 31.78, dir: [1, 1], off: 38, endAt: 13.3 });
  markers.push({ seg: 'colons', at: 3.6, label: 'Cisjordanie', lon: 35.3, lat: 32.2, dir: [1, -1], off: 38, endAt: 13.3 });

  root.TL = root.buildTL({
    name: 'chiffre-colons',
    seed: 9982,
    segments,
    markers,
    zones,
    hud: { label: ['Sion', 'Chapitre 23 · Les colonies'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: null },
  });
})(typeof window !== 'undefined' ? window : globalThis);
