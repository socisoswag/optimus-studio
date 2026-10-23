/*
 * Les personnages des chapitres 14 à 23, en motion design à la place des photos fixes du script : un segment par plan,
 * à la durée du plan (script/03-partie-III.yaml et 04-partie-IV.yaml, plans marqués output/portraits-2.mp4).
 *
 * Sources :
 *   Lord Moyne, tué au Caire le 6 novembre 1944 ; Folke Bernadotte, tué à Jérusalem le 17 septembre 1948.
 *   Mémoires d'Yitzhak Rabin, passage censuré publié par The New York Times, 23 octobre 1979 (« Ben-Gurion waved his
 *     hand in a gesture which said, "Drive them out!" ») ; notre traduction.
 *   Yasser Arafat, Assemblée générale de l'ONU, 13 novembre 1974 (« Ne laissez pas le rameau d'olivier tomber de ma
 *     main ») ; déclaration de principes d'Oslo, Washington, 13 septembre 1993.
 */
(function (root) {
  const P = (key) => `portraits/${key}.png`;
  const segments = [
    {
      id: 'p14-4', type: 'figure', dur: 12, layout: 'L',
      year: 1946, place: 'Jérusalem', lon: 35.22, lat: 31.78,
      eyebrow: 'Chef de l’Irgoun de 1943 à 1948',
      name: ['Menahem', 'Begin'], native: 'מנחם בגין', lang: 'he', life: '1913-1992',
      text: 'Il sera Premier ministre d’Israël en 1977, et prix Nobel de la paix l’année suivante.',
      photo: P('begin'),
      cam: { w: 0.05, pitch: 46, bearing: -8 },
    },
    {
      id: 'p14-5', type: 'doc', dur: 14, fly: 2.4, layout: 'L', anchor: [540, 40], hitAt: 0.8,
      faces: [root.face('bernadotte', { tagPos: 'above', x: 1520, h: 720, at: 1.4 })],
      ghost: '1948', eyebrow: 'Le Lehi · 1944 et 1948', title: ['Deux', 'assassinats'],
      rows: [['Le Caire, 6 novembre 1944', 'Lord Moyne, ministre britannique'], ['Jérusalem, 17 septembre 1948', 'Folke Bernadotte, médiateur de l’ONU']],
      rowAt: [1.4, 4.6],
      note: 'Un des chefs du Lehi, Yitzhak Shamir, sera lui aussi Premier ministre d’Israël.', noteAt: 8.4,
      lon: 35.21, lat: 31.77, pin: true, place: 'Jérusalem', pinLabel: true,
      cam: { lon: 33.4, lat: 31.0, w: 0.34, pitch: 36, bearing: -4 },
      camEnd: { lon: 33.4, lat: 31.0, w: 0.29, pitch: 42, bearing: 4 },
    },
    {
      id: 'p14-7', type: 'figure', dur: 9, layout: 'R', fly: 2.4,
      year: 1948, place: 'al-Qastal', lon: 35.14, lat: 31.79,
      eyebrow: 'Commandant palestinien',
      name: ['Abd al-Qadir', 'al-Husseini'], native: 'عبد القادر الحسيني', lang: 'ar', life: '1907-1948',
      text: 'Le chef le plus populaire des combattants palestiniens. Tué le 8 avril 1948 à al-Qastal.',
      photo: P('abd-al-qadir'),
      cam: { w: 0.04, pitch: 48, bearing: 8 },
    },
    {
      id: 'p16-2', type: 'figure', dur: 14, layout: 'L', fly: 2.0,
      year: 1948, place: 'Tel-Aviv', lon: 34.773, lat: 32.064,
      eyebrow: 'Premier chef du gouvernement d’Israël',
      name: ['David', 'Ben Gourion'], native: 'דוד בן-גוריון', lang: 'he', life: '1886-1973',
      text: 'Pour la plupart des Israéliens, le père de la nation : un État, une armée, des centaines de milliers de réfugiés juifs accueillis.',
      photo: P('ben-gourion'),
      cam: { w: 0.05, pitch: 46, bearing: -6 },
    },
    {
      id: 'p16-5', type: 'quote', dur: 19, fly: 1.8, hitAt: 6.0,
      faces: [root.face('rabin', { x: 1560, h: 800, at: 0.8, tag: false })],
      text: 'Ben Gourion fit un geste de la main, qui voulait dire : [[« Chassez-les ! »]]',
      author: 'Yitzhak Rabin · Mémoires, passage censuré en Israël',
      context: 'Lydda, juillet 1948. Publié par le New York Times le 23 octobre 1979 ; traduit de l’anglais.',
      cam: { lon: 34.89, lat: 31.95, w: 0.05, pitch: 42, bearing: -6 },
      camEnd: { lon: 34.89, lat: 31.95, w: 0.04, pitch: 48, bearing: 4 },
    },
    {
      id: 'p18-3', type: 'figure', dur: 14, layout: 'R', fly: 2.0,
      year: 1969, place: 'Jérusalem', lon: 35.21, lat: 31.78,
      eyebrow: 'Première ministre d’Israël de 1969 à 1974',
      name: ['Golda', 'Meir'], native: 'גולדה מאיר', lang: 'he', life: '1898-1978',
      text: 'Née à Kiev, élevée aux États-Unis, elle signe la déclaration d’indépendance en 1948.',
      photo: P('meir'),
      cam: { w: 0.05, pitch: 46, bearing: 8 },
    },
    {
      id: 'p21-3', type: 'figure', dur: 14, layout: 'L', fly: 2.4,
      year: 1969, place: 'Amman', lon: 35.93, lat: 31.95,
      eyebrow: 'Chef du mouvement national palestinien',
      name: ['Yasser', 'Arafat'], native: 'ياسر عرفات', lang: 'ar', life: '1929-2004',
      text: 'Il fonde le Fatah à la fin des années cinquante et prend la tête de l’OLP en 1969. Pour son peuple, le visage de la résistance.',
      photo: P('arafat'),
      cam: { w: 0.06, pitch: 46, bearing: -8 },
    },
    {
      id: 'p21-12', type: 'quote', dur: 6, fly: 1.4, hitAt: 0.2,
      faces: [root.face('arafat', { x: 1560, h: 800, at: 0.4, tag: false })],
      text: '[[Ne laissez pas le rameau d’olivier tomber de ma main.]]',
      author: 'Yasser Arafat · ONU, 13 novembre 1974',
      context: 'Traduit de l’arabe.',
      cam: { lon: -73.968, lat: 40.749, w: 0.03, pitch: 44, bearing: -6 },
      camEnd: { lon: -73.968, lat: 40.749, w: 0.026, pitch: 48, bearing: 2 },
    },
    {
      id: 'p22-6', type: 'figure', dur: 8, layout: 'R', fly: 2.6,
      year: 1987, place: 'Gaza', lon: 34.46, lat: 31.50,
      eyebrow: 'Fondateur du Hamas',
      name: ['Cheikh Ahmed', 'Yassine'], native: 'أحمد ياسين', lang: 'ar', life: '1936-2004',
      text: 'La même année que l’intifada, il fonde le Hamas, à Gaza.',
      photo: P('yassine'),
      cam: { w: 0.05, pitch: 46, bearing: 6 },
    },
    {
      id: 'p23-3', type: 'doc', dur: 12, fly: 2.6, layout: 'L', anchor: [500, 40], hitAt: 0.8,
      faces: [root.face('rabin', { tagPos: 'above', x: 1240, h: 620, at: 1.4 }), root.face('arafat', { tagPos: 'above', x: 1690, h: 640, at: 1.9 })],
      ghost: '1993', eyebrow: 'Washington · 13 septembre 1993', title: ['Les accords', 'd’Oslo'],
      rows: [['Israël et l’OLP', 'se reconnaissent pour la première fois'], ['Les Palestiniens', 'espèrent un État'], ['Les Israéliens', 'espèrent la sécurité']],
      rowAt: [1.0, 4.4, 6.4],
      lon: -77.037, lat: 38.898, pin: true, place: 'Washington', pinLabel: true,
      cam: { w: 0.05, pitch: 44, bearing: -6 },
      camEnd: { w: 0.042, pitch: 50, bearing: 3 },
    },
  ];

  root.TL = root.buildTL({
    name: 'portraits-2',
    seed: 1948,
    segments,
    relief: true,
    hud: { label: ['Sion', 'Les personnages'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: null },
  });
})(typeof window !== 'undefined' ? window : globalThis);
