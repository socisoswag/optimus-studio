/*
 * Le gouvernement militaire sur les citoyens arabes d'Israël (1948-1966), en fiche sur la carte : pas de photo libre
 * d'un contrôle de laissez-passer (plan 16.6, output/documents-4.mp4 dans script/03-partie-III.yaml).
 * Modèle : timelines/documents-3.js.
 *
 * Source : Shira Robinson, Citizen Strangers, Stanford University Press, 2013 (gouvernement militaire de 1948
 * à décembre 1966 sur les régions arabes : Galilée, Triangle, Néguev ; permis de sortie).
 */
(function (root) {
  const D = { type: 'doc', layout: 'L', anchor: [540, 40] };
  const segments = [
    {
      ...D, id: 'd16-6', dur: 13, fly: 2.4, hitAt: 0.8,
      ghost: '1948', eyebrow: 'Galilée, Triangle, Néguev · 1948 à 1966', title: ['Le gouvernement', 'militaire'],
      rows: [['Les Arabes restés en Israël', 'deviennent citoyens'], ['Jusqu’en 1966', 'un permis pour quitter son village']],
      rowAt: [2.2, 6.4],
      lon: 35.1, lat: 32.4, pin: false,
      cam: { lon: 35.05, lat: 32.2, w: 0.3, pitch: 40, bearing: -4 },
      camEnd: { lon: 35.05, lat: 32.2, w: 0.26, pitch: 46, bearing: 4 },
    },
  ];

  root.TL = root.buildTL({
    name: 'documents-4',
    seed: 1966,
    segments,
    relief: true,
    hud: { label: ['Sion', 'Les faits'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: null },
  });
})(typeof window !== 'undefined' ? window : globalThis);
