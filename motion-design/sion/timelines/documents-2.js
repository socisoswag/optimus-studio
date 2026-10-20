/*
 * Les cartons et citations « à fabriquer » du script, en motion design : un segment par plan, à la durée du plan
 * (plans marqués output/documents-2.mp4 dans script/*.yaml).
 *
 * Sources (voir aussi les plans du script) :
 *   Balfour, mémorandum du 11 août 1919, Documents on British Foreign Policy 1919-1939, 1re série, vol. IV, p. 345
 *     (« in Palestine we do not propose even to go through the form of consulting the wishes of the present
 *     inhabitants of the country » ; « the desires and prejudices of the 700,000 Arabs ») ; notre traduction.
 *   Tibériade, 2 octobre 1938 ; bombes de l'Irgoun sur les marchés arabes de Haïfa et de Jérusalem, juillet 1938.
 *   Commission Peel, rapport du 7 juillet 1937 (transfert proposé : jusqu'à 225 000 Arabes et 1 250 Juifs).
 *   Accord Haavara, août 1933 (Edwin Black, 1984 ; Yehuda Bauer, 1994) : environ 60 000 Juifs allemands, 105 millions
 *     de reichsmarks de marchandises.
 *   Déclaration de Pittsburgh, 16-19 novembre 1885, article 5 (« We consider ourselves no longer a nation, but a
 *     religious community, and therefore expect neither a return to Palestine… ») ; notre traduction.
 *   Jabotinsky, « Le Mur de fer », 1923.
 *   Terres en propriété juive en 1945 : moins de 6 % (Village Statistics, 1945).
 *   Rue Ben Yehuda, Jérusalem, 22 février 1948.
 *   Intifadas : B'Tselem (1987-1993 : de 1 087 à 1 204 Palestiniens tués dont 241 enfants, 100 civils et 60 soldats
 *     israéliens ; 2000-2005 : de 3 179 à 3 354 Palestiniens et environ 1 010 Israéliens, dont 644 à 773 civils).
 *   Joel Teitelbaum, Vayoel Moshe ; Yeshayahou Leibowitz, textes de la fin des années 1960.
 */
(function (root) {
  const D = { type: 'doc', layout: 'L', anchor: [540, 40] };
  const segments = [
    {
      id: 'd7-10', type: 'quote', dur: 19, hitAt: 3.4,
      faces: [root.face('balfour', { x: 1560, h: 800, at: 0.6, tag: false })],
      text: 'En Palestine, [[nous ne proposons même pas de consulter les habitants actuels du pays.]]',
      author: 'Arthur Balfour · Mémorandum, 11 août 1919',
      context: 'Le sionisme, ajoute-t-il, compte plus que « les désirs et les préjugés de 700 000 Arabes ». Traduit de l’anglais.',
      cam: { lon: -0.13, lat: 51.51, w: 0.05, pitch: 40, bearing: -6 },
      camEnd: { lon: -0.13, lat: 51.51, w: 0.042, pitch: 46, bearing: 4 },
    },
    {
      ...D, id: 'd8-15', dur: 17, fly: 2.4, hitAt: 0.8,
      ghost: '1938', eyebrow: 'Les civils, des deux côtés · 1938', title: ['Tibériade', 'Haïfa, Jérusalem'],
      rows: [['Tibériade, 2 octobre 1938', '19 Juifs tués, dont 11 enfants'], ['Haïfa et Jérusalem, juillet 1938', 'des bombes de l’Irgoun sur des marchés arabes']],
      rowAt: [3.4, 8.6],
      lon: 35.3, lat: 32.4, pin: false,
      cam: { lon: 35.25, lat: 32.3, w: 0.22, pitch: 40, bearing: -4 },
      camEnd: { lon: 35.25, lat: 32.3, w: 0.18, pitch: 46, bearing: 4 },
    },
    {
      ...D, id: 'd8-16', dur: 17, fly: 1.6, hitAt: 0.8,
      ghost: '1937', eyebrow: 'Commission Peel · 7 juillet 1937', title: ['Le premier plan', 'de partage'],
      rows: [['La proposition', 'un État juif ; le reste rattaché à la Transjordanie'], ['Le transfert', 'jusqu’à 225 000 Arabes et 1 250 Juifs déplacés'],
        ['Les dirigeants arabes', 'refusent'], ['Les sionistes', 'acceptent le principe, pas ce tracé']],
      rowAt: [1.0, 4.0, 8.4, 10.6],
      lon: 35.1, lat: 31.9, pin: false,
      cam: { lon: 35.1, lat: 31.9, w: 0.3, pitch: 36, bearing: 4 },
      camEnd: { lon: 35.1, lat: 31.9, w: 0.25, pitch: 42, bearing: -4 },
    },
    {
      ...D, id: 'd9-3', dur: 16, fly: 2.6, hitAt: 0.8,
      ghost: '1933', eyebrow: 'Août 1933 · avec l’Allemagne nazie', title: ['L’accord', 'Haavara'],
      meta: '« Le transfert », en hébreu',
      rows: [['Le principe', 'les Juifs qui partent pour la Palestine sauvent une partie de leurs biens, en marchandises allemandes']],
      rowAt: [4.0],
      lon: 13.40, lat: 52.52, pin: true, place: 'Berlin', pinLabel: true,
      cam: { lon: 24.0, lat: 42.0, w: 0.7, pitch: 32, bearing: -6 },
      camEnd: { lon: 24.0, lat: 42.0, w: 0.6, pitch: 38, bearing: 2 },
    },
    {
      ...D, id: 'd9-4', dur: 13, fly: 1.0, hitAt: 0.4, noWhoosh: true, k: 0.5, hitKind: 'soft',
      ghost: '1933', eyebrow: 'De 1933 à 1939', title: ['L’accord', 'Haavara'],
      rows: [['Environ 60 000', 'Juifs allemands gagnent la Palestine'], ['105 millions', 'de reichsmarks de marchandises allemandes'],
        ['Le prix', 'l’accord brise le boycott des produits allemands lancé par des Juifs du monde entier']],
      rowAt: [0.6, 3.0, 6.0],
      lon: 13.40, lat: 52.52, pin: true, place: 'Berlin', pinLabel: true,
      cam: { lon: 24.0, lat: 42.0, w: 0.6, pitch: 38, bearing: 2 },
      camEnd: { lon: 24.0, lat: 42.0, w: 0.54, pitch: 42, bearing: 6 },
    },
    {
      id: 'd10-2', type: 'quote', dur: 16, fly: 2.6, hitAt: 3.6,
      text: 'Nous ne nous considérons plus comme une nation, mais comme une communauté religieuse, [[et n’attendons donc pas de retour en Palestine.]]',
      author: 'Déclaration de Pittsburgh · rabbins réformés, novembre 1885',
      context: 'Article 5. Traduit de l’anglais.',
      cam: { lon: -79.99, lat: 40.44, w: 0.06, pitch: 40, bearing: -6 },
      camEnd: { lon: -79.99, lat: 40.44, w: 0.05, pitch: 46, bearing: 4 },
    },
    {
      id: 'd11-4', type: 'quote', dur: 13, fly: 2.6, hitAt: 0.8,
      faces: [root.face('jabotinsky', { x: 1560, h: 800, at: 0.6, tag: false })],
      text: 'La colonisation sioniste ne peut avancer […] [[que derrière un mur de fer, que la population indigène ne pourra pas percer.]]',
      author: 'Ze’ev Jabotinsky · « Le Mur de fer », 1923',
      context: 'Traduit du russe.',
      cam: { lon: 35.1, lat: 31.9, w: 0.16, pitch: 44, bearing: 4 },
      camEnd: { lon: 35.1, lat: 31.9, w: 0.13, pitch: 50, bearing: -4 },
    },
    {
      ...D, id: 'd12-11', dur: 24, fly: 2.4, hitAt: 0.8,
      ghost: '1947', eyebrow: 'Le plan de partage · 29 novembre 1947', title: ['Deux lectures', 'du partage'],
      rows: [['Le récit israélien', 'ils acceptaient un compromis, on leur a fait la guerre'],
        ['La question palestinienne', 'pourquoi les deux tiers des habitants céderaient-ils plus de la moitié du pays ?'],
        ['Terres en propriété juive', 'moins de 6 % en 1945']],
      rowAt: [1.0, 8.6, 15.6],
      ref: 'Terres : Village Statistics, 1945',
      lon: 35.1, lat: 31.9, pin: false,
      cam: { lon: 35.0, lat: 31.6, w: 0.34, pitch: 36, bearing: -4 },
      camEnd: { lon: 35.0, lat: 31.6, w: 0.28, pitch: 42, bearing: 4 },
    },
    {
      ...D, id: 'd14-8', dur: 11, fly: 2.4, hitAt: 0.8,
      ghost: '1948', eyebrow: 'Jérusalem · 22 février 1948', title: ['Rue', 'Ben Yehuda'],
      rows: [['Une bombe', 'des dizaines de civils juifs tués']],
      rowAt: [3.6],
      lon: 35.217, lat: 31.781, pin: true, place: 'Jérusalem', pinLabel: true,
      cam: { w: 0.04, pitch: 48, bearing: -4 },
      camEnd: { w: 0.034, pitch: 54, bearing: 4 },
    },
    {
      ...D, id: 'd22-4', dur: 15, fly: 2.4, hitAt: 0.8,
      ghost: '1987', eyebrow: 'Première intifada · 1987-1993', title: ['Six ans', 'de soulèvement'],
      rows: [['Palestiniens tués', 'plus de 1 000, dont plus de 200 enfants'], ['Israéliens tués', 'environ 160, dont 100 civils']],
      rowAt: [1.0, 6.2],
      ref: 'B’Tselem',
      lon: 34.45, lat: 31.5, pin: true, place: 'Gaza', pinLabel: true,
      cam: { lon: 34.9, lat: 31.8, w: 0.2, pitch: 40, bearing: -4 },
      camEnd: { lon: 34.9, lat: 31.8, w: 0.17, pitch: 46, bearing: 4 },
    },
    {
      ...D, id: 'd22-9', dur: 13, fly: 2.0, hitAt: 0.8,
      ghost: '2000', eyebrow: 'Deuxième intifada · 2000-2005', title: ['La deuxième', 'intifada'],
      rows: [['En Israël', 'attentats-suicides dans les bus, les cafés, les hôtels'], ['Dans les villes palestiniennes', 'chars et hélicoptères']],
      rowAt: [2.0, 5.6],
      lon: 35.2, lat: 31.9, pin: false,
      cam: { lon: 35.0, lat: 31.9, w: 0.18, pitch: 42, bearing: 6 },
      camEnd: { lon: 35.0, lat: 31.9, w: 0.15, pitch: 48, bearing: -2 },
    },
    {
      ...D, id: 'd22-10', dur: 12, fly: 1.0, hitAt: 0.4, noWhoosh: true, k: 0.5, hitKind: 'soft',
      ghost: '2005', eyebrow: 'Deuxième intifada · 2000-2005', title: ['Cinq ans', 'de guerre'],
      rows: [['Palestiniens tués', 'plus de 3 000'], ['Israéliens tués', 'environ 1 000, en majorité des civils']],
      rowAt: [0.6, 3.0],
      note: 'Beaucoup de civils, des deux côtés.', noteAt: 6.0,
      ref: 'B’Tselem',
      lon: 35.2, lat: 31.9, pin: false,
      cam: { lon: 35.0, lat: 31.9, w: 0.15, pitch: 48, bearing: -2 },
      camEnd: { lon: 35.0, lat: 31.9, w: 0.13, pitch: 52, bearing: 4 },
    },
    {
      ...D, id: 'd30-3', dur: 14, fly: 2.6, hitAt: 0.8,
      faces: [root.face('teitelbaum', { tagPos: 'above', x: 1520, h: 720, at: 1.4 })],
      ghost: '1959', eyebrow: 'New York · fin des années 1950', title: ['Le rabbin', 'de Satmar'],
      meta: 'Joel Teitelbaum, auteur de Vayoel Moshe',
      rows: [['Son livre', 'un réquisitoire entier contre l’État d’Israël'], ['Aujourd’hui', 'des dizaines de milliers de fidèles s’en réclament']],
      rowAt: [2.2, 6.4],
      lon: -73.96, lat: 40.71, pin: true, place: 'New York', pinLabel: true,
      cam: { w: 0.05, pitch: 44, bearing: -6 },
      camEnd: { w: 0.042, pitch: 50, bearing: 3 },
    },
    {
      ...D, id: 'd30-4', dur: 12, fly: 2.6, hitAt: 0.8,
      faces: [root.face('leibowitz', { tagPos: 'above', x: 1520, h: 720, at: 1.4 })],
      ghost: '1968', eyebrow: 'Jérusalem · fin des années 1960', title: ['Yeshayahou', 'Leibowitz'],
      meta: 'Philosophe, juif religieux et sioniste',
      note: 'Il prévient : l’occupation corrompra Israël.', noteAt: 4.4,
      lon: 35.21, lat: 31.77, pin: true, place: 'Jérusalem', pinLabel: true,
      cam: { w: 0.05, pitch: 46, bearing: 6 },
      camEnd: { w: 0.042, pitch: 52, bearing: -2 },
    },
  ];

  root.TL = root.buildTL({
    name: 'documents-2',
    seed: 1937,
    segments,
    hud: { label: ['Sion', 'Les textes'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: null },
  });
})(typeof window !== 'undefined' ? window : globalThis);
