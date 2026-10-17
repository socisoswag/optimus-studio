/*
 * Chiffre-clé « zone-c » (chapitre 19), ≈ 14 s.
 *
 * Accords d'Oslo II (1995) : la Cisjordanie est divisée en zones A, B et C. La zone C, plus de 60 % du
 * territoire, reste sous contrôle israélien total (sécurité, terres, urbanisme). Les plans approuvés
 * pour les Palestiniens y couvrent moins de 1 % de la zone. Source : OCHA, « Restricting Space: The
 * Planning Regime Applied by Israel in Area C of the West Bank », et fiches Area C de l'OCHA.
 */
(function (root) {
  const segments = [
    {
      id: 'zone-c', type: 'stat', dur: 12.5, fly: 1.2, layout: 'L', anchor: [470, 30],
      ghost: '1995', kicker: 'Accords d’Oslo II · 1995 — aujourd’hui', pre: 'Plus de', value: 60, unit: '%', label: 'de la Cisjordanie en zone C',
      text: 'L’armée israélienne y garde tout le contrôle, jusqu’aux permis de construire. [[Moins de 1 % de la zone]] est planifié pour les Palestiniens.',
      textAt: 1.6, hlAt: 5.6, source: 'OCHA (ONU)', sourceAt: 4.8, countAt: 0.3, countDur: 2.6,
      cam: { lon: 34.86, lat: 31.95, w: 0.052, pitch: 40, bearing: -6 },
      camEnd: { lon: 34.89, lat: 31.95, w: 0.047, pitch: 46, bearing: 2 },
    },
  ];
  const markers = [], zones = [], lights = [];
  zones.push({ seg: 'zone-c', at: 0.8, dur: 3.0, name: 'cisjordanie', from: [35.25, 31.95] });
  markers.push({ seg: 'zone-c', at: 2.2, label: 'Cisjordanie', lon: 35.3, lat: 32.15, dir: [1, -1], off: 40, endAt: 12.8 });
  markers.push({ seg: 'zone-c', at: 3.0, label: 'Ramallah', lon: 35.2, lat: 31.9, dir: [1, 1], off: 34, endAt: 12.8 });

  root.TL = root.buildTL({
    name: 'chiffre-zone-c',
    seed: 9520,
    segments,
    markers,
    zones,
    hud: { label: ['Sion', 'Chapitre 19 · Cisjordanie'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: null },
  });
})(typeof window !== 'undefined' ? window : globalThis);
