/*
 * Les événements récents, sans images libres et sans IA (on ne reconstitue jamais un événement récent ni une
 * tuerie) : un fait par fiche sur la carte, à la durée du plan (plans marqués output/documents-3.mp4 dans
 * script/*.yaml). Modèle : timelines/documents-2.js.
 *
 * Sources (voir aussi les plans du script) :
 *   Septembre noir, Jordanie, septembre 1970 à juillet 1971 : environ 3 400 morts.
 *   Camp de Jabaliya, 9 décembre 1987 : un camion israélien percute des voitures, quatre ouvriers palestiniens tués.
 *   Ministère israélien de la Santé, directive de janvier 2013 (Haaretz, 27 janvier 2013) ; manifestations de mai 2015.
 *   Neturei Karta, fondé à Jérusalem en 1938.
 *   Jewish Voice for Peace, fondé en septembre 1996 à Berkeley ; plus de 32 000 membres cotisants en 2024.
 *   Sit-in du 18 octobre 2023 dans un bâtiment du Congrès à Washington ; gare de Grand Central, 27 octobre 2023.
 *   Briser le silence (Shovrim Shtika), fondée en 2004 ; objecteurs emprisonnés, par exemple Tal Mitnick (2023-2024).
 *   Cour suprême d'Israël, arrêt du 25 juin 2024 sur la conscription des étudiants des yeshivas.
 *   Manifestations de 2023 contre la réforme judiciaire (des centaines de milliers de personnes, 26 mars 2023).
 *   Parents Circle-Families Forum, fondé en 1995.
 */
(function (root) {
  const D = { type: 'doc', layout: 'L', anchor: [540, 40] };
  const segments = [
    {
      ...D, id: 'd20-7', dur: 11, fly: 2.4, hitAt: 0.8,
      ghost: '1970', eyebrow: 'Jordanie · septembre 1970', title: ['Septembre', 'noir'],
      rows: [['L’armée jordanienne', 'écrase les combattants palestiniens'], ['Jusqu’en juillet 1971', 'environ 3 400 morts']],
      rowAt: [2.2, 5.0],
      note: 'L’OLP part pour le Liban.', noteAt: 7.6,
      lon: 35.93, lat: 31.95, pin: true, place: 'Amman', pinLabel: true,
      cam: { lon: 35.7, lat: 31.9, w: 0.2, pitch: 40, bearing: -4 },
      camEnd: { lon: 35.7, lat: 31.9, w: 0.17, pitch: 46, bearing: 4 },
    },
    {
      ...D, id: 'd22-2', dur: 13, fly: 2.4, hitAt: 0.8,
      ghost: '1987', eyebrow: 'Gaza · 9 décembre 1987', title: ['Le camp', 'de Jabaliya'],
      meta: 'Un camion israélien percute des voitures',
      rows: [['Tués', 'quatre ouvriers palestiniens']],
      rowAt: [5.0],
      lon: 34.48, lat: 31.53, pin: true, place: 'Jabaliya', pinLabel: true,
      cam: { lon: 34.55, lat: 31.5, w: 0.08, pitch: 42, bearing: -6 },
      camEnd: { lon: 34.55, lat: 31.5, w: 0.065, pitch: 48, bearing: 3 },
    },
    {
      ...D, id: 'd22-3', dur: 13, fly: 1.6, hitAt: 0.6,
      ghost: '1987', eyebrow: 'Gaza, Cisjordanie · décembre 1987', title: ['Intifada', '« le soulèvement »'],
      rows: [['Toute une génération', 'se soulève'], ['Grèves, boycotts', 'pierres contre les soldats']],
      rowAt: [2.0, 5.4],
      lon: 35.0, lat: 31.8, pin: false,
      cam: { lon: 34.9, lat: 31.8, w: 0.2, pitch: 40, bearing: -4 },
      camEnd: { lon: 34.9, lat: 31.8, w: 0.17, pitch: 46, bearing: 4 },
    },
    {
      ...D, id: 'd28-4', dur: 16, fly: 2.4, hitAt: 0.8,
      ghost: '2015', eyebrow: 'Israël · 2013-2015', title: ['Les Israéliens', 'éthiopiens'],
      rows: [['Janvier 2013', 'le ministère de la Santé fait cesser les injections d’un contraceptif'], ['Mai 2015', 'des milliers manifestent contre les violences policières']],
      rowAt: [2.0, 8.4],
      lon: 34.78, lat: 32.08, pin: true, place: 'Tel-Aviv', pinLabel: true,
      cam: { lon: 34.85, lat: 32.0, w: 0.1, pitch: 42, bearing: -4 },
      camEnd: { lon: 34.85, lat: 32.0, w: 0.085, pitch: 48, bearing: 4 },
    },
    {
      ...D, id: 'd29-2', dur: 16, fly: 2.4, hitAt: 0.8,
      ghost: '1938', eyebrow: 'Jérusalem · 1938', title: ['Neturei Karta', '« les gardiens de la cité »'],
      meta: 'Des Juifs qui refusent le sionisme au nom de leur foi',
      note: 'Pour eux, un État juif avant le Messie est une faute.', noteAt: 8.2,
      lon: 35.21, lat: 31.79, pin: true, place: 'Jérusalem', pinLabel: true,
      cam: { lon: 35.2, lat: 31.78, w: 0.05, pitch: 44, bearing: -6 },
      camEnd: { lon: 35.2, lat: 31.78, w: 0.042, pitch: 50, bearing: 3 },
    },
    {
      ...D, id: 'd29-3', dur: 13, fly: 2.6, hitAt: 0.8,
      ghost: '1996', eyebrow: 'États-Unis · 1996', title: ['Jewish Voice', 'for Peace'],
      rows: [['Fondé en 1996', 'à Berkeley, en Californie'], ['En 2024', 'plus de 32 000 membres']],
      rowAt: [2.4, 6.0],
      lon: -122.27, lat: 37.87, pin: true, place: 'Berkeley', pinLabel: true,
      cam: { lon: -122.3, lat: 37.8, w: 0.12, pitch: 40, bearing: -4 },
      camEnd: { lon: -122.3, lat: 37.8, w: 0.1, pitch: 46, bearing: 4 },
    },
    {
      ...D, id: 'd29-4', dur: 13, fly: 2.6, hitAt: 0.8,
      ghost: '2023', eyebrow: 'Washington, New York · octobre 2023', title: ['« Pas', 'en notre nom »'],
      rows: [['18 octobre 2023', 'sit-in dans un bâtiment du Congrès'], ['27 octobre 2023', 'la gare de Grand Central, à New York']],
      rowAt: [2.0, 5.6],
      lon: -73.98, lat: 40.75, pin: true, place: 'New York', pinLabel: true,
      cam: { lon: -75.6, lat: 39.8, w: 0.5, pitch: 40, bearing: -4 },
      camEnd: { lon: -75.6, lat: 39.8, w: 0.42, pitch: 46, bearing: 4 },
    },
    {
      ...D, id: 'd29-5', dur: 16, fly: 2.6, hitAt: 0.8,
      ghost: '2004', eyebrow: 'Israël · depuis 2004', title: ['Briser', 'le silence'],
      rows: [['D’anciens soldats', 'racontent ce qu’ils ont fait dans les territoires'], ['Chaque année', 'des jeunes choisissent la prison plutôt que l’armée']],
      rowAt: [2.4, 8.6],
      lon: 35.0, lat: 31.9, pin: false,
      cam: { lon: 34.95, lat: 31.85, w: 0.16, pitch: 42, bearing: 6 },
      camEnd: { lon: 34.95, lat: 31.85, w: 0.14, pitch: 48, bearing: -2 },
    },
    {
      ...D, id: 'd30-5', dur: 11, fly: 2.0, hitAt: 0.8,
      ghost: '2024', eyebrow: 'Jérusalem · 25 juin 2024', title: ['La Cour suprême', 'et les yeshivas'],
      meta: 'Les étudiants ultra-orthodoxes doivent être mobilisés',
      lon: 35.2, lat: 31.78, pin: true, place: 'Jérusalem', pinLabel: true,
      cam: { lon: 35.2, lat: 31.78, w: 0.05, pitch: 46, bearing: 6 },
      camEnd: { lon: 35.2, lat: 31.78, w: 0.042, pitch: 52, bearing: -2 },
    },
    {
      ...D, id: 'd36-4', dur: 13, fly: 2.4, hitAt: 0.8,
      ghost: '2023', eyebrow: 'Israël · 2023', title: ['Contre la réforme', 'de la justice'],
      rows: [['26 mars 2023', 'des centaines de milliers de manifestants'], ['Leur mot d’ordre', 'défendre la démocratie']],
      rowAt: [2.0, 6.4],
      lon: 34.78, lat: 32.08, pin: true, place: 'Tel-Aviv', pinLabel: true,
      cam: { lon: 34.85, lat: 32.0, w: 0.1, pitch: 42, bearing: 4 },
      camEnd: { lon: 34.85, lat: 32.0, w: 0.085, pitch: 48, bearing: -3 },
    },
    {
      ...D, id: 'd36-6', dur: 9, fly: 1.0, hitAt: 0.4, noWhoosh: true, k: 0.5, hitKind: 'soft',
      ghost: '2024', eyebrow: 'Israël · aujourd’hui', title: ['Tout est', 'contesté'],
      meta: 'L’armée, l’État, la loi juive',
      lon: 35.0, lat: 31.9, pin: false,
      cam: { lon: 34.95, lat: 31.85, w: 0.14, pitch: 48, bearing: -2 },
      camEnd: { lon: 34.95, lat: 31.85, w: 0.12, pitch: 52, bearing: 4 },
    },
    {
      ...D, id: 'd38-5', dur: 15, fly: 2.4, hitAt: 0.8,
      ghost: '1995', eyebrow: 'Israël et Palestine · depuis 1995', title: ['Le Cercle', 'des parents'],
      meta: 'Des familles israéliennes et palestiniennes qui ont perdu un enfant',
      quote: '« Nous ne voulons plus de [[nouveaux membres]]. »',
      lon: 35.1, lat: 31.85, pin: false,
      cam: { lon: 35.0, lat: 31.85, w: 0.16, pitch: 42, bearing: 4 },
      camEnd: { lon: 35.0, lat: 31.85, w: 0.14, pitch: 48, bearing: -2 },
    },
  ];

  root.TL = root.buildTL({
    name: 'documents-3',
    seed: 1987,
    segments,
    hud: { label: ['Sion', 'Les faits'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: null },
  });
})(typeof window !== 'undefined' ? window : globalThis);
