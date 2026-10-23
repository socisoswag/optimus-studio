/*
 * Citation « Herzl, 1895 » (chapitre 4), ≈ 15 s.
 *
 * Theodor Herzl, Journal, entrée du 12 juin 1895 (Paris). Texte anglais : The Complete Diaries of
 * Theodor Herzl, éd. R. Patai, 1960, vol. 1, p. 88 : « We shall try to spirit the penniless population
 * across the border by procuring employment for it in the transit countries, while denying it any
 * employment in our own country. » La coupe […] retire « en lui procurant du travail dans les pays de
 * transit ». Le territoire n'est pas encore choisi (Palestine ou Argentine).
 */
(function (root) {
  const segments = [
    {
      id: 'herzl', type: 'quote', dur: 13.0, fly: 1.2, hitAt: 0.8,
      faces: [root.face('herzl', { x: 1560, h: 800, at: 0.7, tag: false })],
      text: 'Nous tenterons de faire passer discrètement la population sans ressources de l’autre côté de la frontière […] [[en lui refusant tout travail dans notre propre pays.]]',
      author: 'Theodor Herzl · Journal, 12 juin 1895',
      context: 'Traduit de l’allemand. Herzl hésite encore entre la Palestine et l’Argentine pour le futur État.',
      cam: { lon: 2.35, lat: 48.86, w: 0.05, pitch: 40, bearing: -6 },
      camEnd: { lon: 2.35, lat: 48.86, w: 0.04, pitch: 46, bearing: 4 },
    },
  ];

  root.TL = root.buildTL({
    name: 'citation-herzl',
    seed: 9365,
    segments,
    relief: true,
    hud: { label: ['Sion', 'Chapitre 4 · Theodor Herzl'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: null },
  });
})(typeof window !== 'undefined' ? window : globalThis);
