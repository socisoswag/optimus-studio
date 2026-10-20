/*
 * Les personnages des chapitres 24 à 38, en motion design à la place des photos fixes du script : un segment par plan,
 * à la durée du plan (script/05-partie-V.yaml à 08-conclusion.yaml, plans marqués output/portraits-3.mp4).
 * Citations traduites par nous ; texte d'origine et date dans SOURCES.md 6 et dans les plans du script.
 *
 *   Netanyahou, vidéo du jour des élections, 17 mars 2015 (« Le pouvoir de droite est en danger. Les électeurs arabes
 *     se rendent en masse aux urnes ») ; Instagram, 10 mars 2019 ; 21 septembre 2025 ; discours du 28 octobre 2023
 *     (Deutéronome 25, 17) ; 37e congrès sioniste, 20 octobre 2015, et réponse de Steffen Seibert, 21 octobre 2015.
 *   Lieberman, entretien avec Oudi Segal, Herzliya, 8 mars 2015 (texte hébreu de N12 / Mako, phrase entière).
 *   Ben Gvir, chaîne 12, 23 août 2023 (« My right, my wife's right, my children's right to move around on the roads
 *     of Judea and Samaria is more important than the right of movement for Arabs »).
 *   Smotrich, 1er mars 2023 (« le village de Huwara doit être effacé ») ; 5 août 2024 (« No one will let us starve two
 *     million people, even though it might be justified and moral, until they return the hostages »).
 *   Bernard-Henri Lévy : Tel-Aviv, mai 2010 ; Le Figaro, 18 mars 2024 ; The Wall Street Journal, 25 septembre 2025.
 *   Alain Finkielkraut : Haaretz, novembre 2005 ; Le Figaro, 25 octobre 2024 ; Le Monde, 12 mai 2025.
 *   Edgar Morin, Sami Naïr, Danièle Sallenave, Le Monde, 4 juin 2002 ; cour d'appel de Versailles, 26 mai 2005 ;
 *     Cour de cassation, 12 juillet 2006 (procédure civile : ni « condamné » ni « relaxé »).
 */
(function (root) {
  const P = (key) => `portraits/${key}.png`;
  const Q = (key, at = 0.6) => [root.face(key, { x: 1560, h: 800, at, tag: false })];
  const segments = [
    {
      id: 'p24-4', type: 'quote', dur: 12, fly: 0, hitAt: 3.4,
      faces: Q('netanyahou', 0.5),
      text: 'Le pouvoir de droite est en danger. [[Les électeurs arabes se rendent en masse aux urnes.]]',
      author: 'Benyamin Netanyahou · Jour des élections, 17 mars 2015',
      context: 'Traduit de l’hébreu. Un citoyen israélien sur cinq est arabe.',
      cam: { lon: 35.2, lat: 31.78, w: 0.06, pitch: 40, bearing: -6 },
      camEnd: { lon: 35.2, lat: 31.78, w: 0.05, pitch: 46, bearing: 4 },
    },
    {
      id: 'p24-6', type: 'quote', dur: 9, fly: 1.4, hitAt: 1.0,
      faces: Q('netanyahou'),
      text: '[[Israël n’est pas l’État de tous ses citoyens.]]',
      author: 'Benyamin Netanyahou · Instagram, 10 mars 2019',
      context: 'Selon la loi de 2018, ajoute-t-il, Israël est l’État-nation du peuple juif, « et de lui seul ».',
      cam: { lon: 35.205, lat: 31.777, w: 0.05, pitch: 44, bearing: 6 },
      camEnd: { lon: 35.205, lat: 31.777, w: 0.042, pitch: 50, bearing: -2 },
    },
    {
      id: 'p24-8', type: 'quote', dur: 24, fly: 1.8, hitAt: 1.8, wordStep: 0.13,
      faces: Q('lieberman', 0.8),
      text: 'Celui qui est avec nous doit tout recevoir, jusqu’à la moitié du royaume. Celui qui est contre nous, il n’y a rien à faire : [[il faut lever une hache, et lui couper la tête.]] Sinon, nous ne survivrons pas ici.',
      author: 'Avigdor Lieberman · Herzliya, 8 mars 2015',
      context: 'À propos des citoyens arabes d’Israël. Traduit de l’hébreu.',
      cam: { lon: 34.84, lat: 32.17, w: 0.05, pitch: 40, bearing: -8 },
      camEnd: { lon: 34.84, lat: 32.17, w: 0.038, pitch: 48, bearing: 4 },
    },
    {
      id: 'p24-9', type: 'quote', dur: 14, fly: 1.8, hitAt: 2.0,
      faces: Q('netanyahou'),
      text: '[[Pendant des années, j’ai empêché la création de cet État terroriste.]]',
      author: 'Benyamin Netanyahou · 21 septembre 2025',
      context: 'Traduit de l’hébreu. Il parle de l’État palestinien.',
      cam: { lon: 35.2, lat: 31.9, w: 0.2, pitch: 38, bearing: -4 },
      camEnd: { lon: 35.2, lat: 31.9, w: 0.17, pitch: 44, bearing: 4 },
    },
    {
      id: 'p25-8', type: 'quote', dur: 9, fly: 1.8, hitAt: 1.0,
      faces: Q('netanyahou'),
      text: '[[Souviens-toi de ce que t’a fait Amalek.]]',
      author: 'Benyamin Netanyahou · 28 octobre 2023',
      context: 'Il cite la Bible (Deutéronome 25, 17).',
      cam: { lon: 34.45, lat: 31.45, w: 0.08, pitch: 42, bearing: -6 },
      camEnd: { lon: 34.45, lat: 31.45, w: 0.065, pitch: 48, bearing: 4 },
    },
    {
      id: 'p26-5', type: 'figure', dur: 16, layout: 'L', fly: 2.2,
      year: 2022, place: 'Kiryat Arba', lon: 35.12, lat: 31.53,
      eyebrow: 'Ministre de la Sécurité nationale à partir de décembre 2022',
      name: ['Itamar', 'Ben Gvir'], native: 'איתמר בן גביר', lang: 'he', life: 'né en 1976',
      text: 'Condamné en 2007 pour incitation au racisme et soutien à une organisation terroriste. Chez lui, il a longtemps gardé le portrait de Baruch Goldstein, qui a tué 29 Palestiniens à Hébron en 1994.',
      photo: P('ben-gvir'),
      cam: { w: 0.04, pitch: 48, bearing: -6 },
    },
    {
      id: 'p26-6', type: 'quote', dur: 13, fly: 1.2, hitAt: 0.6, noWhoosh: true, wordStep: 0.1,
      faces: Q('ben-gvir'),
      text: 'Mon droit, celui de ma femme et de mes enfants, de circuler sur les routes de Judée et de Samarie [[passe avant la liberté de circulation des Arabes.]]',
      author: 'Itamar Ben Gvir · Chaîne 12, 23 août 2023',
      context: 'Traduit de l’hébreu. La Judée et la Samarie : la Cisjordanie occupée.',
      cam: { lon: 35.15, lat: 31.6, w: 0.08, pitch: 44, bearing: 6 },
      camEnd: { lon: 35.15, lat: 31.6, w: 0.065, pitch: 50, bearing: -2 },
    },
    {
      id: 'p26-7', type: 'quote', dur: 13, fly: 1.8, hitAt: 4.2,
      faces: Q('smotrich'),
      text: 'Je pense que [[le village de Huwara doit être effacé.]] L’État d’Israël doit le faire.',
      author: 'Bezalel Smotrich · Ministre des Finances, 1er mars 2023',
      context: 'Après une attaque de colons contre Huwara. Traduit de l’hébreu.',
      cam: { lon: 35.26, lat: 32.15, w: 0.04, pitch: 46, bearing: -6 },
      camEnd: { lon: 35.26, lat: 32.15, w: 0.033, pitch: 52, bearing: 4 },
    },
    {
      id: 'p26-8', type: 'quote', dur: 15, fly: 1.2, hitAt: 2.0, noWhoosh: true, wordStep: 0.1,
      faces: Q('smotrich'),
      text: 'Personne au monde ne nous laissera affamer deux millions de personnes, [[même si cela pouvait être justifié et moral]], jusqu’à ce qu’ils rendent les otages.',
      author: 'Bezalel Smotrich · 5 août 2024',
      context: 'Il parle des habitants de Gaza. Traduit de l’hébreu.',
      cam: { lon: 34.45, lat: 31.45, w: 0.09, pitch: 42, bearing: 6 },
      camEnd: { lon: 34.45, lat: 31.45, w: 0.075, pitch: 48, bearing: -3 },
    },
    {
      id: 'p31-2', type: 'doc', dur: 13, fly: 2.6, layout: 'L', anchor: [500, 40], hitAt: 0.8,
      faces: [root.face('bhl', { tagPos: 'above', x: 1240, h: 620, at: 1.4 }), root.face('finkielkraut', { tagPos: 'above', x: 1730, h: 660, at: 1.9 })],
      eyebrow: 'Paris · sur les plateaux depuis quarante ans', title: ['Deux', 'philosophes'],
      meta: 'Bernard-Henri Lévy, né en 1948 · Alain Finkielkraut, né en 1949',
      note: 'Tous deux défendent Israël, chacun à sa manière.', noteAt: 5.4,
      lon: 2.35, lat: 48.86, pin: true, place: 'Paris', pinLabel: true,
      cam: { w: 0.05, pitch: 44, bearing: -6 },
      camEnd: { w: 0.042, pitch: 50, bearing: 3 },
    },
    {
      id: 'p31-3', type: 'quote', dur: 12, fly: 2.4, hitAt: 2.6,
      faces: Q('bhl'),
      text: '[[Je n’ai jamais vu une armée aussi démocratique]], qui se pose autant de questions morales.',
      author: 'Bernard-Henri Lévy · Tel-Aviv, mai 2010',
      context: 'Colloque « Democracy and its Challenges ». Traduit de l’anglais.',
      cam: { lon: 34.78, lat: 32.08, w: 0.05, pitch: 42, bearing: -6 },
      camEnd: { lon: 34.78, lat: 32.08, w: 0.042, pitch: 48, bearing: 4 },
    },
    {
      id: 'p31-4', type: 'quote', dur: 11, fly: 2.4, hitAt: 1.6,
      faces: Q('bhl'),
      text: 'Il faut le redire, [[la mort des civils de Gaza n’est pas un massacre.]]',
      author: 'Bernard-Henri Lévy · Le Figaro, 18 mars 2024',
      cam: { lon: 2.35, lat: 48.86, w: 0.05, pitch: 42, bearing: 6 },
      camEnd: { lon: 2.35, lat: 48.86, w: 0.042, pitch: 48, bearing: -2 },
    },
    {
      id: 'p31-5', type: 'quote', dur: 15, fly: 2.4, hitAt: 2.0,
      faces: Q('bhl'),
      text: '[[Parler de génocide à Gaza est une offense au bon sens]], une manœuvre pour diaboliser Israël.',
      author: 'Bernard-Henri Lévy · The Wall Street Journal, 25 septembre 2025',
      context: 'Traduit de l’anglais. Neuf jours plus tôt, une commission d’enquête de l’ONU concluait au génocide.',
      cam: { lon: -74.0, lat: 40.71, w: 0.05, pitch: 42, bearing: -6 },
      camEnd: { lon: -74.0, lat: 40.71, w: 0.042, pitch: 48, bearing: 4 },
    },
    {
      id: 'p31-6', type: 'quote', dur: 17, fly: 2.4, hitAt: 5.0,
      faces: [root.face('finkielkraut', { x: 1660, h: 740, at: 0.6, tag: false })],
      text: 'Aujourd’hui, elle est [[black-black-black]], ce qui fait ricaner toute l’Europe.',
      author: 'Alain Finkielkraut · Haaretz, novembre 2005',
      context: 'Sur l’équipe de France, pendant les émeutes des banlieues. Il dira avoir été mal traduit.',
      cam: { lon: 2.35, lat: 48.86, w: 0.06, pitch: 42, bearing: 6 },
      camEnd: { lon: 2.35, lat: 48.86, w: 0.05, pitch: 48, bearing: -2 },
    },
    {
      id: 'p31-7', type: 'quote', dur: 16, fly: 1.6, hitAt: 1.8, wordStep: 0.11,
      faces: Q('finkielkraut'),
      text: 'Quoi qu’on pense de la riposte israélienne, [[le mot de génocide est fou, ignoble.]] Il permet de nazifier les Juifs, de leur faire perdre leur crédit victimaire.',
      author: 'Alain Finkielkraut · Le Figaro, 25 octobre 2024',
      cam: { lon: 2.35, lat: 48.86, w: 0.05, pitch: 46, bearing: -4 },
      camEnd: { lon: 2.35, lat: 48.86, w: 0.042, pitch: 52, bearing: 4 },
    },
    {
      id: 'p31-8', type: 'quote', dur: 13, fly: 1.6, hitAt: 2.6,
      faces: Q('finkielkraut'),
      text: 'Le gouvernement Netanyahou [[« mène une guerre atroce »]] et [[« sacrifie délibérément les otages »]].',
      author: 'Alain Finkielkraut · cité par Le Monde, 12 mai 2025',
      cam: { lon: 2.35, lat: 48.86, w: 0.042, pitch: 50, bearing: 4 },
      camEnd: { lon: 2.35, lat: 48.86, w: 0.036, pitch: 54, bearing: 8 },
    },
    {
      id: 'p31-9', type: 'doc', dur: 15, fly: 2.0, layout: 'L', anchor: [540, 40], hitAt: 0.8,
      faces: [root.face('morin', { tagPos: 'above', x: 1520, h: 720, at: 1.4 })],
      ghost: '2002', eyebrow: 'Le Monde · 4 juin 2002', title: ['Edgar Morin', '« Le cancer »'],
      meta: 'Tribune « Israël-Palestine : le cancer », avec Sami Naïr et Danièle Sallenave',
      rows: [['2005', 'une cour d’appel y voit une diffamation raciale'], ['2006', 'la Cour de cassation annule cette décision']],
      rowAt: [6.0, 9.4],
      lon: 2.35, lat: 48.86, pin: true, place: 'Paris', pinLabel: true,
      cam: { w: 0.06, pitch: 44, bearing: -6 },
      camEnd: { w: 0.05, pitch: 50, bearing: 3 },
    },
    {
      id: 'p32-5', type: 'doc', dur: 17, fly: 2.6, layout: 'L', anchor: [540, 40], hitAt: 0.8,
      faces: [root.face('netanyahou', { tagPos: 'above', x: 1520, h: 720, at: 1.4 })],
      ghost: '2015', eyebrow: 'Jérusalem · 20 octobre 2015', title: ['Le mufti', 'et Hitler'],
      meta: 'Discours de Benyamin Netanyahou au 37e congrès sioniste',
      rows: [['Netanyahou', 'le mufti de Jérusalem aurait donné à Hitler l’idée d’exterminer les Juifs'], ['Les historiens', 'le démentent'],
        ['Berlin, le lendemain', 'la responsabilité de la Shoah est allemande']],
      rowAt: [1.2, 8.0, 10.4],
      lon: 35.2, lat: 31.78, pin: true, place: 'Jérusalem', pinLabel: true,
      cam: { w: 0.05, pitch: 46, bearing: -6 },
      camEnd: { w: 0.042, pitch: 52, bearing: 3 },
    },
    {
      id: 'p36-3', type: 'doc', dur: 13, fly: 2.6, layout: 'L', anchor: [540, 40], hitAt: 0.8,
      faces: [root.face('rabin', { tagPos: 'above', x: 1520, h: 720, at: 1.4 })],
      ghost: '1995', eyebrow: 'Tel-Aviv · 4 novembre 1995', title: ['L’assassinat', 'de Rabin'],
      rows: [['Le tueur', 'Yigal Amir, étudiant juif religieux, opposé aux accords d’Oslo']],
      rowAt: [1.2],
      note: 'Pour beaucoup, la paix meurt avec lui.', noteAt: 6.8,
      lon: 34.781, lat: 32.081, pin: true, place: 'Tel-Aviv', pinLabel: true,
      cam: { w: 0.04, pitch: 48, bearing: -4 },
      camEnd: { w: 0.034, pitch: 54, bearing: 4 },
    },
    {
      id: 'p38-2', type: 'figure', dur: 10, layout: 'R', fly: 2.4,
      year: 1941, place: 'al-Birwa', lon: 35.17, lat: 32.92,
      eyebrow: 'Poète national palestinien',
      name: ['Mahmoud', 'Darwich'], native: 'محمود درويش', lang: 'ar', life: '1941-2008',
      text: 'Né à al-Birwa, en Galilée. Le village est vidé en 1948, puis rasé.',
      photo: P('darwich'),
      cam: { w: 0.05, pitch: 46, bearing: 6 },
    },
  ];

  root.TL = root.buildTL({
    name: 'portraits-3',
    seed: 2015,
    segments,
    hud: { label: ['Sion', 'Les personnages'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: null },
  });
})(typeof window !== 'undefined' ? window : globalThis);
