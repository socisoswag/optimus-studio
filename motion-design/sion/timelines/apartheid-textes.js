/*
 * Séquence « Apartheid : ce que disent les textes » (chapitre 35), ≈ 1 min.
 *
 * Quatre textes, cités mot pour mot. Entre crochets doubles [[ ]] : passage surligné à l'écran.
 *   B'Tselem, « A regime of Jewish supremacy from the Jordan River to the Mediterranean Sea: This is
 *     apartheid », prise de position du 12 janvier 2021 (btselem.org), traduit de l'anglais :
 *     « A regime that uses laws, practices and organized violence to cement the supremacy of one
 *     group over another is an apartheid regime. »
 *   Human Rights Watch, « Un seuil franchi », 27 avril 2021, communiqué en français (hrw.org/fr).
 *   Amnesty International, « L'apartheid d'Israël contre la population palestinienne : un système
 *     cruel de domination et un crime contre l'humanité », 1er février 2022, communiqué d'Amnesty
 *     France : déclaration d'Agnès Callamard, secrétaire générale.
 *   Cour internationale de justice, avis consultatif du 19 juillet 2024, texte français officiel,
 *     paragraphe 229 ; paragraphe 225 pour l'article 3 de la CIEDR ; point 3 du dispositif
 *     (présence continue d'Israël illicite) adopté par 11 voix contre 4.
 * La Cour n'emploie pas le mot « apartheid » : elle conclut à une violation de l'article 3 de la
 * Convention, qui condamne « la ségrégation raciale et l'apartheid ». Le texte à l'écran le dit tel quel.
 * Israël rejette l'accusation d'apartheid et les conclusions de la Cour.
 */
(function (root) {
  const segments = [
    {
      id: 'mot', type: 'beat', dur: 6.2, hitAt: 0.9, rgb: 16,
      kicker: 'De 2021 à 2024 · Jérusalem · New York · Londres · La Haye', word: 'Apartheid',
      sub: 'Une ONG israélienne, deux ONG internationales, la Cour de l’ONU.', subAt: 1.8,
      cam: { lon: 35.1, lat: 31.8, w: 0.3, pitch: 36, bearing: -8 },
      camEnd: { lon: 35.15, lat: 31.8, w: 0.22, pitch: 42, bearing: 4 },
    },
    {
      id: 'btselem', type: 'doc', dur: 11.6, fly: 1.8, layout: 'L', anchor: [460, 40],
      ghost: '2021', eyebrow: 'Jérusalem · 12 janvier 2021', title: ['B’Tselem', 'ONG israélienne'],
      meta: 'Rapport « C’est un apartheid » · traduit de l’anglais',
      quote: 'Un régime qui utilise des lois, des pratiques et une violence organisée pour asseoir la suprématie d’un groupe sur un autre est [[un régime d’apartheid]].',
      ref: 'B’Tselem · prise de position du 12 janvier 2021',
      note: 'Fondée en 1989, B’Tselem documente les violations des droits humains dans les territoires occupés.', noteAt: 6.2,
      lon: 35.22, lat: 31.78, heat: { R: 900, amt: 0.8 },
      cam: { lon: 35.2, lat: 31.8, w: 0.06, pitch: 46, bearing: -8 },
      camEnd: { lon: 35.2, lat: 31.8, w: 0.04, pitch: 52, bearing: 4 },
    },
    {
      id: 'hrw', type: 'doc', dur: 10.4, fly: 2.4, layout: 'L', anchor: [470, 40],
      ghost: '2021', eyebrow: 'New York · 27 avril 2021', title: ['Human Rights', 'Watch'],
      meta: 'Rapport « Un seuil franchi » · 213 pages',
      quote: 'Les autorités israéliennes commettent [[les crimes contre l’humanité d’apartheid et de persécution]].',
      ref: 'Human Rights Watch · communiqué du 27 avril 2021',
      lon: -74.0, lat: 40.71,
      cam: { lon: -74.0, lat: 40.73, w: 0.05, pitch: 48, bearing: -14 },
      camEnd: { lon: -74.0, lat: 40.73, w: 0.035, pitch: 54, bearing: -4 },
    },
    {
      id: 'amnesty', type: 'doc', dur: 11.8, fly: 2.2, layout: 'L', anchor: [470, 40],
      ghost: '2022', eyebrow: 'Londres · 1er février 2022', title: ['Amnesty', 'International'],
      meta: 'Rapport « L’apartheid d’Israël contre la population palestinienne »',
      quote: 'Nous avons conclu que les politiques cruelles de ségrégation, de dépossession et d’exclusion mises en œuvre par Israël dans tous les territoires sous son contrôle [[constituent clairement un apartheid]].',
      ref: 'Agnès Callamard, secrétaire générale d’Amnesty International',
      lon: -0.13, lat: 51.51,
      cam: { lon: -0.12, lat: 51.51, w: 0.05, pitch: 46, bearing: 10 },
      camEnd: { lon: -0.12, lat: 51.51, w: 0.035, pitch: 52, bearing: 0 },
    },
    {
      id: 'cij', type: 'doc', dur: 15.0, fly: 1.4, layout: 'L', anchor: [470, 40],
      ghost: '2024', eyebrow: 'Nations unies · La Haye · 19 juillet 2024', title: ['Cour internationale', 'de justice'],
      meta: 'Avis consultatif · présence illicite : 11 voix contre 4',
      quote: [
        'La Cour observe que les lois et mesures d’Israël imposent et permettent de maintenir en Cisjordanie et à Jérusalem-Est [[une séparation quasi complète]] entre les communautés de colons et les communautés palestiniennes.',
        'Elle considère, pour cette raison, que les lois et mesures d’Israël emportent [[violation de l’article 3]] de la CIEDR.',
      ],
      ref: 'Avis consultatif du 19 juillet 2024 · paragraphe 229',
      note: 'L’article 3 condamne « la ségrégation raciale et l’apartheid ». L’avis n’est pas contraignant. Israël rejette ces conclusions.', noteAt: 8.2,
      lon: 4.30, lat: 52.08,
      cam: { lon: 4.31, lat: 52.08, w: 0.05, pitch: 46, bearing: -10 },
      camEnd: { lon: 4.31, lat: 52.08, w: 0.035, pitch: 52, bearing: 2 },
    },
    {
      id: 'fin', type: 'outro', dur: 6.8,
      eyebrow: '2021 · 2022 · 2024',
      lines: ['Jérusalem.', 'New York, Londres.', 'La Haye.'],
      cam: { lon: 35.2, lat: 31.8, w: 0.36, pitch: 28, bearing: 0 },
    },
  ];

  root.TL = root.buildTL({
    name: 'apartheid-textes',
    seed: 35,
    segments,
    hud: { label: ['Sion', 'Chapitre 35 · Le poids des mots'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: [0.6, 54.0] },
  });
})(typeof window !== 'undefined' ? window : globalThis);
