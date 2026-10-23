/*
 * Pièce « Les figures d'aujourd'hui » (chapitres 24 et 26) : la suite de la chronologie des
 * figures, de 1996 à aujourd'hui, avec le même modèle de fiche.
 * Tout le texte affiché à l'écran est ici : modifiez-le puis relancez le rendu.
 *
 * Les fiches sont écrites au passé daté (« à partir de 2022 ») pour rester justes quel que soit
 * le résultat des législatives israéliennes du 27 octobre 2026.
 *
 * Sources :
 *   Netanyahou : Cour pénale internationale, communiqué du 21 novembre 2024 (mandats d'arrêt contre
 *     Benyamin Netanyahou et Yoav Gallant : crime de guerre d'affamement, crimes contre l'humanité) ;
 *     plus long temps au pouvoir d'un chef du gouvernement israélien depuis juillet 2019.
 *   Lieberman : slogan de campagne d'Israël Beitenou aux législatives de février 2009,
 *     « Sans loyauté, pas de citoyenneté » (Reuters, NBC News, Ynet, 2009) ; il vit à Nokdim.
 *   Smotrich : discours de Paris, 19 mars 2023 (« Il n'y a pas de Palestiniens, car il n'y a pas de
 *     peuple palestinien »), condamné par les États-Unis, l'UE, la France et la Jordanie.
 *   Ben Gvir : condamné en 2007 par le tribunal de Jérusalem pour incitation au racisme et soutien
 *     à une organisation terroriste (Kach).
 *   Smotrich (Finances) et Ben Gvir (Sécurité nationale) entrent au gouvernement le 29 décembre 2022 ;
 *     ils vivent dans les colonies de Kedumim et de Kiryat Arba.
 *   Photos : Wikimedia Commons, voir portraits/LISEZMOI.md.
 */
(function (root) {
  const FIG = 4.8; // une fiche, vol de caméra compris (un peu plus que la chronologie : textes plus longs)

  const segments = [
    {
      type: 'intro', dur: 5.4,
      eyebrow: 'Chronologie · de 1996 à aujourd’hui',
      title: ['Israël', 'depuis 1996'],
      sub: 'Les figures de la droite au pouvoir',
      year: 1996,
      cam: { lon: 35.0, lat: 31.9, w: 0.42, pitch: 30, bearing: -4 },
      camEnd: { lon: 35.1, lat: 31.85, w: 0.3, pitch: 38, bearing: 4 },
    },
    {
      id: 'netanyahou', type: 'figure', dur: FIG, layout: 'L',
      year: 1996, place: 'Jérusalem', lon: 35.22, lat: 31.78,
      eyebrow: 'Premier ministre d’Israël · Likoud',
      name: ['Benyamin', 'Netanyahou'], native: 'בנימין נתניהו', lang: 'he',
      life: 'né en 1949',
      text: "Le dirigeant resté le plus longtemps au pouvoir en Israël. Visé en novembre 2024 par un mandat d’arrêt de la CPI.",
      photo: 'portraits/netanyahou.png',
      cam: { w: 0.05, pitch: 46, bearing: -10 },
    },
    {
      id: 'lieberman', type: 'figure', dur: FIG, layout: 'R',
      year: 2009, place: 'Nokdim', lon: 35.243, lat: 31.645,
      eyebrow: 'Fondateur d’Israël Beitenou · Colon de Nokdim',
      name: ['Avigdor', 'Lieberman'], native: 'אביגדור ליברמן', lang: 'he',
      life: 'né en 1958',
      text: "En 2009, son slogan « Pas de loyauté, pas de citoyenneté » vise les citoyens arabes d’Israël, un sur cinq.",
      photo: 'portraits/lieberman.png',
      cam: { w: 0.03, pitch: 50, bearing: 12 },
    },
    {
      id: 'smotrich-ben-gvir', type: 'pair', dur: FIG + 0.6,
      year: 2022, place: 'Cisjordanie', lon: 35.2, lat: 31.9,
      eyebrow: 'Sionisme religieux · Ministres à partir de décembre 2022',
      // norm : têtes un peu plus petites que la paire par défaut, pour laisser respirer le « & »
      people: [
        { name: ['Bezalel', 'Smotrich'], native: 'בצלאל סמוטריץ׳', lang: 'he', life: 'né en 1980', photo: 'portraits/smotrich.png', norm: 226,
          text: 'Aux Finances. À Paris, en mars 2023 : « Il n’y a pas de peuple palestinien ».' },
        { name: ['Itamar', 'Ben Gvir'], native: 'איתמר בן גביר', lang: 'he', life: 'né en 1976', photo: 'portraits/ben-gvir.png', norm: 226,
          text: 'À la Sécurité nationale. Condamné en 2007 pour incitation au racisme et soutien au groupe terroriste Kach.' },
      ],
      text: 'Tous deux vivent dans des colonies de Cisjordanie.',
      cam: { w: 0.1, pitch: 40, bearing: -6 },
    },
  ];

  // Repères de la frise du bas (année, libellé, [fin] pour une période).
  const events = [
    [1995, 'Assassinat de Rabin'],
    [2000, 'Seconde Intifada', 2005],
    [2002, 'Construction du mur'],
    [2007, 'Blocus de Gaza'],
    [2018, 'Loi État-nation'],
    [2023, '7 octobre, guerre à Gaza'],
  ];

  root.TL = root.buildTL({
    name: 'figures-aujourdhui',
    segments,
    relief: true,
    events,
    hud: { label: ['Israël · Palestine', 'Chronologie des figures'], index: true, coords: true, ruler: true, odo: true, from: 4.0 },
    sound: { ticks: [2.0, 19.6] },
  });
})(typeof window !== 'undefined' ? window : globalThis);
