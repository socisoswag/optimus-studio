/*
 * Cartons à poser sur les images d'archive (fond transparent) : lieu et date, puis mentions
 * de source. Fabriqués par tools/build_cartons.sh → output/cartons/*.mov (codec PNG, couche
 * alpha), à glisser au-dessus des images dans le logiciel de montage.
 */
(function (root) {
  const CARD = 5.5; // durée de chaque carton (il entre, tient, puis sort avant la fin)
  const LIEUX = [
    ['vienne-1896', 'Février 1896', 'Vienne', 'Theodor Herzl publie « L’État des Juifs ».'],
    ['bale-1897', 'Août 1897', 'Bâle', 'Premier congrès sioniste.'],
    ['londres-1917', '2 novembre 1917', 'Londres', 'La déclaration Balfour.'],
    ['jerusalem-1917', 'Décembre 1917', 'Jérusalem', 'Les troupes britanniques entrent dans la ville.'],
    ['jaffa-1936', 'Avril 1936', 'Jaffa', 'Début de la grande révolte arabe.'],
    ['new-york-1947', '29 novembre 1947', 'New York', 'L’Assemblée générale de l’ONU vote le plan de partage.'],
    ['deir-yassin-1948', '9 avril 1948', 'Deir Yassin', 'Le massacre.'],
    ['tel-aviv-1948', '14 mai 1948', 'Tel-Aviv', 'Proclamation de l’État d’Israël.'],
    ['lydda-1948', 'Juillet 1948', 'Lydda', 'Les habitants sont expulsés.'],
    ['jerusalem-1967', 'Juin 1967', 'Jérusalem-Est', 'La vieille ville passe sous contrôle israélien.'],
    ['amman-1970', 'Septembre 1970', 'Amman', 'Septembre noir.'],
    ['beyrouth-1982', 'Septembre 1982', 'Beyrouth', 'Sabra et Chatila.'],
    ['jabaliya-1987', 'Décembre 1987', 'Jabaliya, Gaza', 'Début de la première intifada.'],
    ['washington-1993', '13 septembre 1993', 'Washington', 'Signature des accords d’Oslo.'],
    ['tel-aviv-1995', '4 novembre 1995', 'Tel-Aviv', 'Assassinat d’Yitzhak Rabin.'],
    ['jerusalem-2000', 'Septembre 2000', 'Jérusalem', 'Début de la seconde intifada.'],
    ['cisjordanie-2002', 'Juin 2002', 'Cisjordanie', 'Début de la construction du mur.'],
    ['gaza-2007', 'Juin 2007', 'Gaza', 'Début du blocus.'],
    ['gaza-2023', 'Octobre 2023', 'Gaza', 'Début de la guerre.'],
    ['cisjordanie-aujourdhui', 'Aujourd’hui', 'Cisjordanie', 'Colonies et points de contrôle.'],
  ];
  const SOURCES = [
    ['source-onu', 'Source : Nations unies'],
    ['source-unrwa', 'Source : UNRWA'],
    ['source-ocha', 'Source : OCHA (ONU)'],
    ['source-btselem', 'Source : B’Tselem'],
    ['source-sante-gaza', 'Source : ministère de la Santé de Gaza'],
    ['source-archives', 'Images d’archives'],
  ];
  const cam = { lon: 35.2, lat: 31.8, w: 0.1, pitch: 30, bearing: 0 };
  const segments = [
    ...LIEUX.map(([id, kicker, title, text]) => ({ id, type: 'cap', layout: 'small', dur: CARD, out: CARD - 0.4, fly: 0.15, capAt: 0.2, kicker, title, text, cam, camEnd: cam })),
    ...SOURCES.map(([id, kicker]) => ({ id, type: 'cap', layout: 'source', dur: CARD, out: CARD - 0.4, fly: 0.15, capAt: 0.2, kicker, title: '', cam, camEnd: cam })),
  ];
  root.TL = root.buildTL({
    name: 'cartons',
    seed: 7,
    segments,
    route: false,
    hud: { label: ['', ''], index: false, coords: false, ruler: false, odo: false, from: 99 },
    fadeIn: 0,
    fadeOut: 0,
    sound: { ticks: null },
  });
  root.TL.cardDur = CARD;
})(typeof window !== 'undefined' ? window : globalThis);
