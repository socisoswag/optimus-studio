/*
 * Séquence « Génocide : ce que disent les textes » (chapitre 35), ≈ 1 min 36. Modèle : timelines/apartheid-textes.js.
 *
 * Entre crochets doubles [[ ]] : passage surligné à l'écran. Textes à confirmer mot pour mot avant la voix
 * (script/A-FABRIQUER.md, section 8) :
 *   Convention pour la prévention et la répression du crime de génocide, Paris, 9 décembre 1948, article II, texte
 *     français officiel (« ou tout ou en partie » : c'est la lettre du texte). Le mot est forgé en 1944 par Raphael
 *     Lemkin, juriste juif polonais (Axis Rule in Occupied Europe).
 *   Amnesty International, rapport du 5 décembre 2024 (« On a l'impression d'être des sous-humains »), déclaration
 *     d'Agnès Callamard.
 *   Human Rights Watch, rapport du 19 décembre 2024, « Extermination et actes de génocide ».
 *   B'Tselem et Médecins pour les droits humains-Israël (PHRI), « Notre génocide », 28 juillet 2025.
 *   Association internationale des chercheurs sur le génocide (IAGS), résolution du 1er septembre 2025.
 *   Omer Bartov, « I'm a Genocide Scholar. I Know It When I See It. », The New York Times, 15 juillet 2025.
 *   Commission internationale indépendante d'enquête de l'ONU (présidée par Navi Pillay), rapport du 16 septembre 2025.
 * Israël rejette ces conclusions ; la CIJ n'a pas jugé le fond de l'affaire Afrique du Sud c. Israël (la voix le dit).
 */
(function (root) {
  const segments = [
    {
      id: 'mot', type: 'beat', dur: 6.2, hitAt: 0.9, rgb: 16,
      kicker: 'De 1948 à 2025 · Paris · Londres · New York · Jérusalem · Genève', word: 'Génocide',
      sub: 'Le crime le plus grave du droit international.', subAt: 1.8,
      cam: { lon: 34.45, lat: 31.45, w: 0.3, pitch: 36, bearing: -8 },
      camEnd: { lon: 34.45, lat: 31.45, w: 0.22, pitch: 42, bearing: 4 },
    },
    {
      id: 'convention', type: 'doc', dur: 14.0, fly: 1.8, layout: 'L', anchor: [460, 40],
      ghost: '1948', eyebrow: 'Paris · 9 décembre 1948', title: ['La convention', 'sur le génocide'],
      meta: 'Adoptée par l’ONU après la Shoah · le mot est forgé en 1944 par Raphael Lemkin, juriste juif polonais',
      quote: 'Le génocide s’entend de l’un quelconque des actes ci-après, [[commis dans l’intention de détruire, ou tout ou en partie, un groupe national, ethnique, racial ou religieux]], comme tel.',
      ref: 'Convention pour la prévention et la répression du crime de génocide · article II',
      note: 'Parmi ces actes : le meurtre, et la soumission du groupe à des conditions d’existence devant entraîner sa destruction.', noteAt: 7.6,
      lon: 2.29, lat: 48.862,
      cam: { lon: 2.29, lat: 48.862, w: 0.05, pitch: 46, bearing: -8 },
      camEnd: { lon: 2.29, lat: 48.862, w: 0.035, pitch: 52, bearing: 4 },
    },
    {
      id: 'amnesty', type: 'doc', dur: 11.5, fly: 2.2, layout: 'L', anchor: [470, 40],
      ghost: '2024', eyebrow: 'Londres · 5 décembre 2024', title: ['Amnesty', 'International'],
      meta: 'Rapport « On a l’impression d’être des sous-humains »',
      quote: 'Israël [[a commis et continue de commettre un génocide]] contre les Palestiniens dans la bande de Gaza occupée.',
      ref: 'Amnesty International · conclusion du rapport · traduit de l’anglais',
      lon: -0.13, lat: 51.51,
      cam: { lon: -0.12, lat: 51.51, w: 0.05, pitch: 46, bearing: 10 },
      camEnd: { lon: -0.12, lat: 51.51, w: 0.035, pitch: 52, bearing: 0 },
    },
    {
      id: 'hrw', type: 'doc', dur: 10.5, fly: 2.4, layout: 'L', anchor: [470, 40],
      ghost: '2024', eyebrow: 'New York · 19 décembre 2024', title: ['Human Rights', 'Watch'],
      meta: 'Rapport sur la privation d’eau à Gaza',
      quote: '[[Extermination et actes de génocide]] : Israël prive délibérément d’eau les Palestiniens de Gaza.',
      ref: 'Human Rights Watch · titre du rapport du 19 décembre 2024',
      lon: -74.0, lat: 40.71,
      cam: { lon: -74.0, lat: 40.73, w: 0.05, pitch: 48, bearing: -14 },
      camEnd: { lon: -74.0, lat: 40.73, w: 0.035, pitch: 54, bearing: -4 },
    },
    {
      id: 'btselem', type: 'doc', dur: 12.0, fly: 2.2, layout: 'L', anchor: [460, 40],
      ghost: '2025', eyebrow: 'Jérusalem · 28 juillet 2025', title: ['« Notre', 'génocide »'],
      meta: 'B’Tselem et Médecins pour les droits humains-Israël · deux ONG israéliennes',
      quote: '[[Israël commet un génocide]] dans la bande de Gaza.',
      ref: 'B’Tselem · rapport du 28 juillet 2025 · traduit de l’anglais',
      lon: 35.22, lat: 31.78, heat: { R: 900, amt: 0.8 },
      cam: { lon: 35.2, lat: 31.8, w: 0.06, pitch: 46, bearing: -8 },
      camEnd: { lon: 35.2, lat: 31.8, w: 0.04, pitch: 52, bearing: 4 },
    },
    {
      id: 'iags', type: 'doc', dur: 11.0, fly: 2.0, layout: 'L', anchor: [470, 40],
      ghost: '2025', eyebrow: '1er septembre 2025', title: ['Les chercheurs', 'du génocide'],
      meta: 'Association internationale des chercheurs sur le génocide · résolution',
      quote: 'Les politiques et les actions d’Israël à Gaza [[répondent à la définition juridique du génocide]] de l’article II de la Convention de 1948.',
      ref: 'IAGS · résolution adoptée à 86 % des votants · traduit de l’anglais',
      lon: 34.45, lat: 31.45,
      cam: { lon: 34.45, lat: 31.45, w: 0.06, pitch: 46, bearing: -10 },
      camEnd: { lon: 34.45, lat: 31.45, w: 0.045, pitch: 52, bearing: 2 },
    },
    {
      id: 'bartov', type: 'doc', dur: 11.0, fly: 2.0, layout: 'L', anchor: [470, 40],
      ghost: '2025', eyebrow: 'The New York Times · 15 juillet 2025', title: ['Omer', 'Bartov'],
      meta: 'Historien israélien de la Shoah et des génocides',
      quote: 'Ma conclusion inévitable est désormais qu’[[Israël commet un génocide contre le peuple palestinien]].',
      ref: 'Omer Bartov · traduit de l’anglais',
      lon: -74.0, lat: 40.75,
      cam: { lon: -74.0, lat: 40.75, w: 0.05, pitch: 48, bearing: -10 },
      camEnd: { lon: -74.0, lat: 40.75, w: 0.035, pitch: 54, bearing: 2 },
    },
    {
      id: 'onu', type: 'doc', dur: 13.0, fly: 1.6, layout: 'L', anchor: [470, 40],
      ghost: '2025', eyebrow: 'Nations unies · Genève · 16 septembre 2025', title: ['La commission', 'd’enquête de l’ONU'],
      meta: 'Présidée par Navi Pillay, ancienne juge du tribunal pour le Rwanda',
      quote: 'Il est clair qu’il existe [[une intention de détruire les Palestiniens à Gaza]] par des actes répondant aux critères de la Convention sur le génocide.',
      ref: 'Navi Pillay, présidente de la commission · 16 septembre 2025',
      note: 'Quatre des cinq actes de la Convention retenus. Israël rejette le rapport.', noteAt: 7.0,
      lon: 6.14, lat: 46.22,
      cam: { lon: 6.14, lat: 46.22, w: 0.05, pitch: 46, bearing: -10 },
      camEnd: { lon: 6.14, lat: 46.22, w: 0.035, pitch: 52, bearing: 2 },
    },
    {
      id: 'fin', type: 'outro', dur: 6.8,
      eyebrow: '1948 · 2024 · 2025',
      lines: ['Paris.', 'Londres, New York, Jérusalem.', 'Genève.'],
      cam: { lon: 34.45, lat: 31.45, w: 0.36, pitch: 28, bearing: 0 },
    },
  ];

  root.TL = root.buildTL({
    name: 'genocide-textes',
    seed: 1948,
    segments,
    hud: { label: ['Sion', 'Chapitre 35 · Le poids des mots'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: [0.6, 89.5] },
  });
})(typeof window !== 'undefined' ? window : globalThis);
