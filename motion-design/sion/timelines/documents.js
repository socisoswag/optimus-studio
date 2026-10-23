/*
 * Les documents du script (journaux, lettres, textes de loi), en motion design à la place des photos de page :
 * un segment par plan, à la durée du plan (voir script/*.yaml, plans marqués output/documents.mp4).
 *
 * Sources (SOURCES.md 5 et 6) :
 *   Filastin : quotidien fondé à Jaffa en 1911 par Issa al-Issa et son cousin Youssef al-Issa (Bibliothèque
 *     nationale d'Israël, collection Jrayed) ; al-Karmil, Haïfa, fondé en 1908 par Najib Nassar.
 *   Balfour : texte de la déclaration du 2 novembre 1917 (traduction française usuelle) ; population de 1918 :
 *     Justin McCarthy, The Population of Palestine, 1990, tableau 2.3 (58 728 juifs sur 748 128 habitants).
 *   Lettre au New York Times du 4 décembre 1948 (« a political party closely akin in its organization, methods,
 *     political philosophy and social appeal to the Nazi and Fascist parties »), signée notamment par Albert Einstein
 *     et Hannah Arendt, contre la venue de Menahem Begin (parti Herout) ; notre traduction.
 *   Déclaration d'indépendance d'Israël, 14 mai 1948 (« complete equality of social and political rights to all its
 *     inhabitants irrespective of religion, race or sex ») ; notre traduction.
 *   Loi fondamentale : Israël, État-nation du peuple juif, 19 juillet 2018, articles 1 (c) et 4 ; notre traduction.
 *   Antony Loewenstein, The Palestine Laboratory: How Israel Exports the Technology of Occupation Around the World,
 *     Verso, 2023.
 *   Talmud de Babylone, Ketoubot 110b-111a : les trois serments.
 */
(function (root) {
  const segments = [
    {
      id: 'filastin', type: 'doc', dur: 11, layout: 'L', anchor: [520, 40], hitAt: 0.6,
      ghost: '1911', eyebrow: 'Jaffa · 1911', title: ['Filastin', '« Palestine »'],
      meta: 'Quotidien fondé par Issa al-Issa et son cousin Youssef al-Issa',
      rows: [['Haïfa, 1908', 'al-Karmil, de Najib Nassar, fait campagne contre les ventes de terres'], ['Jaffa, 1911', 'Filastin : un journal au nom du pays']],
      rowAt: [2.2, 4.4],
      lon: 34.75, lat: 32.05, pin: true, place: 'Jaffa', pinLabel: true,
      cam: { lon: 35.0, lat: 32.4, w: 0.16, pitch: 40, bearing: -6 },
      camEnd: { lon: 34.9, lat: 32.2, w: 0.12, pitch: 46, bearing: 3 },
    },
    {
      id: 'filastin-lecteurs', type: 'doc', dur: 12, fly: 1.6, layout: 'L', anchor: [520, 40], hitAt: 1.2,
      ghost: '1911', eyebrow: 'Jaffa · dès 1911', title: ['Filastin', '« Palestine »'],
      meta: 'Un quotidien arabe qui s’adresse à ses lecteurs comme à des Palestiniens',
      lon: 34.75, lat: 32.05, pin: true, place: 'Jaffa', pinLabel: true,
      cam: { lon: 34.85, lat: 32.1, w: 0.07, pitch: 46, bearing: 8 },
      camEnd: { lon: 34.8, lat: 32.07, w: 0.055, pitch: 50, bearing: -2 },
    },
    {
      id: 'balfour-habitants', type: 'doc', dur: 15, fly: 2.0, layout: 'L', anchor: [500, 40], hitAt: 0.8,
      ghost: '1917', eyebrow: 'Déclaration Balfour · 2 novembre 1917', title: ['Collectivités', 'non juives'],
      quote: '…étant clairement entendu que rien ne sera fait qui puisse porter atteinte aux [[droits civils et religieux des collectivités non juives]] existant en Palestine…',
      rows: [['Habitants en 1918', '748 128'], ['Non juifs', '689 400, soit 92 %'], ['Juifs', '58 728, soit 8 %']],
      rowAt: [5.0, 6.0, 7.0],
      ref: 'Population : Justin McCarthy, The Population of Palestine, 1990',
      note: 'Leurs droits politiques ne sont pas cités.', noteAt: 9.2,
      lon: 35.1, lat: 31.85, pin: true, place: 'Palestine', pinLabel: true,
      cam: { lon: 35.0, lat: 31.6, w: 0.34, pitch: 36, bearing: -4 },
      camEnd: { lon: 35.0, lat: 31.6, w: 0.28, pitch: 42, bearing: 4 },
    },
    {
      id: 'lettre-1948', type: 'doc', dur: 17, fly: 2.2, layout: 'L', anchor: [540, 40], hitAt: 1.4, k: 0.5, hitKind: 'soft',
      faces: [root.face('begin', { tagPos: 'above', x: 1520, h: 700, at: 2.6 })],
      ghost: '1948', eyebrow: 'New York · 4 décembre 1948', title: ['Lettre au', 'New York Times'],
      meta: 'Signée notamment par Albert Einstein et Hannah Arendt',
      quote: 'Un parti politique [[très proche, par son organisation, ses méthodes, sa philosophie politique et son attrait social, des partis nazi et fasciste.]]',
      ref: 'Sur le parti Herout de Menahem Begin, en visite aux États-Unis · traduit de l’anglais',
      lon: -74.0, lat: 40.71, pin: true, place: 'New York', pinLabel: true,
      cam: { w: 0.06, pitch: 44, bearing: -8 },
      camEnd: { w: 0.048, pitch: 50, bearing: 2 },
    },
    {
      id: 'independance', type: 'doc', dur: 14, fly: 2.2, layout: 'L', anchor: [540, 40], hitAt: 0.8,
      faces: [root.face('ben-gourion', { tagPos: 'above', x: 1520, h: 700, at: 2.0 })],
      ghost: '1948', eyebrow: 'Tel-Aviv · 14 mai 1948', title: ['Déclaration', 'd’indépendance'],
      meta: 'Lue par David Ben Gourion',
      quote: 'L’État d’Israël assurera [[l’égalité complète des droits sociaux et politiques à tous ses habitants, sans distinction de religion, de race ou de sexe.]]',
      ref: 'Traduit de l’hébreu',
      lon: 34.773, lat: 32.064, pin: true, place: 'Tel-Aviv', pinLabel: true,
      cam: { w: 0.06, pitch: 44, bearing: 6 },
      camEnd: { w: 0.05, pitch: 50, bearing: -3 },
    },
    {
      id: 'loi-2018', type: 'doc', dur: 15, fly: 1.8, layout: 'L', anchor: [540, 40], hitAt: 1.6,
      ghost: '2018', eyebrow: 'Knesset · 19 juillet 2018', title: ['Loi fondamentale', 'État-nation'],
      meta: 'Israël, État-nation du peuple juif',
      rows: [['Article 1 (c)', 'Le droit à l’autodétermination nationale dans l’État d’Israël est propre au peuple juif.'],
        ['Article 4', 'L’hébreu est la langue de l’État. L’arabe reçoit un « statut spécial ».']],
      rowAt: [1.2, 6.4],
      ref: 'Traduit de l’hébreu',
      lon: 35.205, lat: 31.777, pin: true, place: 'Jérusalem', pinLabel: true,
      cam: { w: 0.05, pitch: 46, bearing: -6 },
      camEnd: { w: 0.04, pitch: 52, bearing: 4 },
    },
    {
      id: 'laboratoire', type: 'doc', dur: 15, fly: 1.8, layout: 'L', anchor: [540, 40], hitAt: 1.0,
      ghost: '2023', eyebrow: 'Antony Loewenstein · Verso, 2023', title: ['The Palestine', 'Laboratory'],
      meta: 'Comment Israël exporte dans le monde la technologie de l’occupation',
      note: 'Armes, drones, logiciels de surveillance : utilisés à Gaza et en Cisjordanie, puis vendus comme [[« éprouvés au combat »]].', noteAt: 4.6,
      lon: 34.45, lat: 31.5, pin: true, place: 'Gaza', pinLabel: true,
      cam: { lon: 34.7, lat: 31.6, w: 0.14, pitch: 42, bearing: 6 },
      camEnd: { lon: 34.7, lat: 31.6, w: 0.11, pitch: 48, bearing: -4 },
    },
    {
      id: 'trois-serments', type: 'doc', dur: 14, fly: 2.2, layout: 'L', anchor: [540, 40], hitAt: 0.8,
      eyebrow: 'Talmud de Babylone · traité Ketoubot, 110b-111a', title: ['Les trois', 'serments'],
      rows: [['1', 'Ne pas monter en masse, « comme un mur », vers la terre d’Israël.'],
        ['2', 'Ne pas se révolter contre les nations.'],
        ['3', 'Les nations, de leur côté, ne doivent pas opprimer Israël à l’excès.']],
      rowAt: [2.4, 5.2, 7.6],
      lon: 44.42, lat: 32.54, pin: true, place: 'Babylonie', pinLabel: true,
      cam: { lon: 41.0, lat: 32.4, w: 0.55, pitch: 34, bearing: 4 },
      camEnd: { lon: 41.0, lat: 32.4, w: 0.47, pitch: 40, bearing: -3 },
    },
    {
      // chapitre 3 : la dégradation n'a jamais été filmée (le film de Méliès, 1899, commence après)
      id: 'degradation', type: 'doc', dur: 11, fly: 2.4, layout: 'L', anchor: [540, 40], hitAt: 0.9,
      faces: [root.face('dreyfus', { tagPos: 'above', x: 1520, h: 720, at: 1.6 })],
      ghost: '1895', eyebrow: 'Paris · cour de l’École militaire · 5 janvier 1895', title: ['La dégradation', 'du capitaine Dreyfus'],
      meta: 'On arrache ses galons, on brise son sabre',
      quote: 'La foule crie : « [[Mort aux juifs !]] »',
      lon: 2.3036, lat: 48.8512, pin: true, place: 'Paris', pinLabel: true,
      cam: { w: 0.05, pitch: 44, bearing: -6 },
      camEnd: { w: 0.04, pitch: 50, bearing: 3 },
    },
    {
      // chapitre 6 : lettre de Herzl à Youssouf Diya al-Khalidi, 19 mars 1899, écrite en français (transcription PalQuest,
      // Institut d'études palestiniennes, d'après W. Khalidi, From Haven to Conquest, 1987 ; « Mans » y est une coquille
      // pour « Mais ») ; la valeur de leurs terres va « quintupler et décupler »
      id: 'lettre-herzl-1899', type: 'doc', dur: 16, fly: 2.4, layout: 'L', anchor: [540, 40], hitAt: 0.8,
      faces: [root.face('herzl', { tagPos: 'above', x: 1520, h: 720, at: 1.8 })],
      ghost: '1899', eyebrow: 'Vienne · 19 mars 1899', title: ['Herzl répond', 'à al-Khalidi'],
      meta: 'Theodor Herzl → Youssouf Diya al-Khalidi',
      quote: 'Vous voyez une autre difficulté, Excellence, dans l’existence de la population non juive en Palestine. [[Mais qui donc songerait à les éloigner ?]]',
      ref: 'Traduit de l’anglais',
      note: 'Le prix de leurs terres, promet-il, montera « de cinq et dix fois ».', noteAt: 9.0,
      lon: 16.37, lat: 48.21, pin: true, place: 'Vienne', pinLabel: true,
      cam: { w: 0.06, pitch: 44, bearing: 6 },
      camEnd: { w: 0.05, pitch: 50, bearing: -3 },
    },
    {
      // chapitre 8 : commission Shaw, 1930 ; le nombre de Juifs cachés par des voisins arabes est débattu : pas de chiffre
      id: 'hebron-1929', type: 'doc', dur: 12, fly: 2.4, layout: 'L', anchor: [540, 40], hitAt: 0.8,
      ghost: '1929', eyebrow: 'Hébron · 24 août 1929', title: ['Le massacre', 'd’Hébron'],
      meta: 'Une communauté juive présente depuis des siècles',
      rows: [['Tués', '67 Juifs'], ['Sauvés', 'des familles cachées chez leurs voisins arabes']],
      rowAt: [1.6, 5.4],
      ref: 'Commission Shaw, 1930',
      lon: 35.10, lat: 31.53, pin: true, place: 'Hébron', pinLabel: true,
      cam: { w: 0.05, pitch: 46, bearing: -4 },
      camEnd: { w: 0.04, pitch: 52, bearing: 4 },
    },
    {
      // chapitre 15 : condamnation de Deir Yassin par l'Agence juive et la Haganah, excuses de Ben Gourion au roi
      // Abdallah ; convoi de l'hôpital Hadassah attaqué le 13 avril 1948, 78 morts
      id: 'convoi-hadassah', type: 'doc', dur: 21, fly: 2.0, layout: 'L', anchor: [540, 40], hitAt: 0.8,
      ghost: '1948', eyebrow: 'Jérusalem · avril 1948', title: ['Le convoi', 'de Hadassah'],
      rows: [['Après Deir Yassin', 'l’Agence juive et la Haganah condamnent ; Ben Gourion s’excuse auprès du roi Abdallah'],
        ['13 avril 1948', 'un convoi de l’hôpital Hadassah est attaqué sur la route du mont Scopus'],
        ['78 morts', 'médecins, infirmières et patients']],
      rowAt: [1.2, 9.4, 12.6],
      lon: 35.243, lat: 31.795, pin: true, place: 'Mont Scopus', pinLabel: true,
      cam: { w: 0.05, pitch: 46, bearing: 6 },
      camEnd: { w: 0.04, pitch: 52, bearing: -4 },
    },
  ];

  root.TL = root.buildTL({
    name: 'documents',
    seed: 1911,
    segments,
    relief: true,
    hud: { label: ['Sion', 'Les textes'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: null },
  });
})(typeof window !== 'undefined' ? window : globalThis);
