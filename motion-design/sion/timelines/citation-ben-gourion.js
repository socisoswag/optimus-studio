/*
 * Citation « Ben Gourion, 1938 » (chapitre 16), ≈ 14 s.
 *
 * Réunion conjointe de l'Exécutif de l'Agence juive et du comité politique du Comité d'action sioniste,
 * 12 juin 1938 (Archives sionistes centrales, S100-24B), citée par Benny Morris, The Birth of the
 * Palestinian Refugee Problem Revisited, Cambridge University Press, 2004, p. 50 : « I support
 * compulsory transfer. I don't see in it anything immoral. »
 */
(function (root) {
  const segments = [
    {
      id: 'ben-gourion', type: 'quote', dur: 12.0, fly: 1.2, hitAt: 0.8,
      faces: [root.face('ben-gourion', { x: 1560, h: 800, at: 0.7, tag: false })],
      text: 'Je suis pour le transfert forcé. [[Je n’y vois rien d’immoral.]]',
      author: 'David Ben Gourion · Agence juive, 12 juin 1938',
      context: 'Procès-verbal de la séance, cité par l’historien israélien Benny Morris.',
      cam: { lon: 35.22, lat: 31.78, w: 0.05, pitch: 40, bearing: 6 },
      camEnd: { lon: 35.22, lat: 31.78, w: 0.04, pitch: 46, bearing: -4 },
    },
  ];

  root.TL = root.buildTL({
    name: 'citation-ben-gourion',
    seed: 8838,
    segments,
    hud: { label: ['Sion', 'Chapitre 16 · Ben Gourion'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: null },
  });
})(typeof window !== 'undefined' ? window : globalThis);
