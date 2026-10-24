/*
 * « Paroles » : les phrases que le script laissait sur fond noir, posées en cartes sur le relief de nuit (plans marqués
 * output/paroles.mp4 dans script/*.yaml). Une carte par plan, à la durée du plan ; deux pour Haavara et pour la
 * conclusion. Ordre du film. Le texte reprend la voix, vérifiée ; seuls les dates et les noms précis s'ajoutent.
 *
 * Sources des précisions à l'écran :
 *   Accord Haavara, août 1933 : Yehuda Bauer, Jews for Sale?, 1994 (lecture critique : Edwin Black, 1984).
 *   FPLP, membre de l'OLP depuis 1968 : détournements d'avions de 1968 à 1970 ; Munich, 5 et 6 septembre 1972 : onze
 *   membres de l'équipe olympique israélienne tués par Septembre noir.
 *   Alger, 15 novembre 1988 (déclaration d'indépendance) ; Genève, 14 décembre 1988 (résolution 242, droit d'Israël à
 *   exister) ; mort de Yasser Arafat, 11 novembre 2004.
 *   Charte du Hamas, 18 août 1988, article 32 ; document de principes, 1er mai 2017.
 *   7 octobre 2023 : environ 1 200 morts, 251 otages ; ONU, représentante spéciale sur les violences sexuelles en
 *   conflit, rapport du 4 mars 2024.
 *   Commission d'enquête de l'ONU, 16 septembre 2025 ; position du gouvernement israélien.
 *   Hébron, 25 février 1994 : Baruch Goldstein, colon de Kiryat Arba, 29 Palestiniens tués dans la mosquée Ibrahimi.
 *   Campagne de faux comptes : The New York Times, 5 juin 2024 (ministère de la Diaspora, qui dément).
 *   Octobre 2000 : treize manifestants arabes tués par la police (commission Or, 1er septembre 2003 : douze citoyens
 *   d'Israël et un habitant de Gaza ; d'autres décomptes donnent treize citoyens).
 *   Ra'am dans la coalition, juin 2021 ; Khaled Kabub, juge à la Cour suprême depuis 2022.
 *   Loi fondamentale « Israël, État-nation du peuple juif », 19 juillet 2018, article 1.
 *   Yehuda Elkana, « Pour l'oubli » (Bizkhout ha-shikheha), Haaretz, 2 mars 1988 ; déporté à Auschwitz en 1944.
 *   Primo Levi, Se non ora, quando?, Einaudi, 1982 (Maintenant ou jamais, Julliard, 1983) ; La Repubblica,
 *   24 septembre 1982.
 *   Idith Zertal, La Nation et la mort. La Shoah dans le discours et la politique d'Israël, La Découverte, 2004.
 *   Résolution 2334 du Conseil de sécurité, 23 décembre 2016.
 *   CIJ, Afrique du Sud c. Israël : pas de jugement au fond au 23 octobre 2026.
 */
(function (root) {
  const cam = (lon, lat, w, pitch, bearing) => ({ lon, lat, w, pitch, bearing });
  const D = { type: 'doc', layout: 'L', anchor: [540, 40], quiet: true };
  const O = { type: 'outro', quiet: true };
  const S = { type: 'split', quiet: true, pin: false };
  const DOUX = { noWhoosh: true, k: 0.35, hitKind: 'soft' };
  const PAL = cam(35.0, 31.6, 0.2, 34, -4), PAL2 = cam(35.05, 31.65, 0.18, 38, 3);
  const segments = [
    // 4.6 · Partie I
    {
      ...O, id: 'partage', dur: 5, hitAt: 0.5,
      eyebrow: 'Cinquante ans après Bâle', lines: ['Novembre 1947', 'l’ONU vote', 'le partage'],
      cam: PAL, camEnd: PAL2,
    },
    // 9.7 · Partie II
    {
      ...O, id: 'haavara-a', dur: 6, fly: 1.0, hitAt: 0.2,
      eyebrow: 'Accord Haavara · août 1933', lines: ['Un accord', 'repris par', 'des antisémites'],
      cam: cam(34.78, 32.07, 0.09, 40, -6), camEnd: cam(34.79, 32.07, 0.08, 43, -2),
    },
    {
      ...O, id: 'haavara-b', dur: 8, fly: 0.6, hitAt: 0.3, noWhoosh: true,
      eyebrow: 'Ce qu’en disent les historiens', lines: ['Un sauvetage', 'arraché', 'au régime nazi'],
      cam: cam(34.79, 32.07, 0.08, 43, -2), camEnd: cam(34.8, 32.07, 0.07, 47, 3),
    },
    // 16.8 · Partie III
    {
      ...S, id: 'ben-gourion', dur: 8, fly: 1.0, hitAt: 0.2,
      left: { kicker: 'Pour les uns', word: 'Bâtisseur', text: 'Il proclame l’État d’Israël en 1948, [[puis le bâtit]].' },
      right: { kicker: 'Pour les autres', word: 'Sans retour', text: 'L’homme qui a fermé [[la porte du retour]] aux réfugiés palestiniens.' },
      footer: 'David Ben Gourion',
      cam: cam(34.9, 31.9, 0.2, 44, -8), camEnd: cam(34.92, 31.9, 0.18, 48, -2),
    },
    // 18.7
    {
      ...O, id: 'la-parole', dur: 6, fly: 1.0, hitAt: 0.2,
      eyebrow: 'Et pourtant', lines: ['Ce peuple', 'va prendre', 'la parole'],
      cam: cam(35.05, 31.55, 0.21, 34, -4), camEnd: cam(35.07, 31.6, 0.19, 38, 3),
    },
    // 21.4 · Partie IV
    {
      ...D, id: 'olp-munich', dur: 14, fly: 1.2, hitAt: 0.6,
      ghost: '1972', eyebrow: 'Munich · 5 septembre 1972', title: ['Pour Israël', 'et l’Occident'],
      meta: 'L’OLP est alors une organisation terroriste',
      rows: [['1968 à 1970', 'des détournements d’avions, revendiqués par le FPLP, membre de l’OLP'], ['Munich, 1972', 'onze membres de l’équipe olympique israélienne tués par Septembre noir']],
      rowAt: [3.4, 7.6],
      lon: 11.55, lat: 48.17, pin: true, place: 'Munich', pinLabel: true,
      cam: cam(11.6, 48.15, 0.09, 42, -6), camEnd: cam(11.6, 48.15, 0.075, 48, 3),
    },
    // 21.14
    {
      ...D, id: 'arafat-1988', dur: 12, fly: 1.2, hitAt: 0.6,
      ghost: '1988', eyebrow: 'Alger et Genève · 1988', title: ['Yasser', 'Arafat'],
      rows: [['Alger, 15 novembre 1988', 'l’OLP proclame l’État de Palestine'], ['Genève, 14 décembre 1988', 'il accepte la résolution 242 et le droit d’Israël à exister']],
      rowAt: [1.8, 4.4],
      note: 'Il meurt le 11 novembre 2004, [[sans avoir vu cet État]].', noteAt: 7.4,
      lon: 6.14, lat: 46.22, pin: true, place: 'Genève', pinLabel: true,
      cam: cam(6.2, 46.2, 0.08, 42, -6), camEnd: cam(6.2, 46.2, 0.066, 48, 3),
    },
    // 22.7
    {
      ...D, id: 'hamas-charte', dur: 16, fly: 1.2, hitAt: 0.6,
      ghost: '1988', eyebrow: 'Gaza · 18 août 1988', title: ['La charte', 'du Hamas'],
      rows: [['Charte de 1988', 'des thèmes antisémites, jusqu’aux Protocoles des sages de Sion, un faux'], ['Document du 1er mai 2017', 'le Hamas dit combattre le sionisme, pas les Juifs']],
      rowAt: [2.0, 9.4],
      lon: 34.45, lat: 31.5, pin: true, place: 'Gaza', pinLabel: true,
      cam: cam(34.5, 31.45, 0.08, 42, -6), camEnd: cam(34.5, 31.45, 0.065, 48, 3),
    },
    // 25.23 · Partie V (silence presque total : pas de souffle, impact très doux)
    {
      ...D, ...DOUX, k: 0.2, id: 'sept-octobre', dur: 18, fly: 0.8, hitAt: 0.8,
      ghost: '2023', eyebrow: 'Sud d’Israël · 7 octobre 2023', title: ['Le 7', 'octobre'],
      rows: [['Les morts', 'environ 1 200, la plupart des civils, tués chez eux, dans les kibboutz, et au festival Nova'], ['Les otages', '251 personnes emmenées à Gaza']],
      rowAt: [1.6, 9.2],
      note: 'L’ONU documente [[des violences sexuelles]] · rapport du 4 mars 2024', noteAt: 12.4,
      lon: 34.5, lat: 31.42, pin: false,
      cam: cam(34.47, 31.42, 0.11, 44, -6), camEnd: cam(34.47, 31.42, 0.1, 47, -3),
    },
    // 25.36
    {
      ...S, id: 'genocide-onu', dur: 12, fly: 1.2, hitAt: 0.3,
      left: { kicker: 'Commission d’enquête de l’ONU', word: 'Génocide', text: 'En septembre 2025, elle conclut qu’Israël [[commet un génocide à Gaza]].' },
      right: { kicker: 'Gouvernement israélien', word: 'Rejet', text: 'Israël rejette ces accusations [[et parle de légitime défense]].' },
      footer: 'Gaza · 2025',
      cam: cam(34.45, 31.45, 0.16, 44, -8), camEnd: cam(34.45, 31.45, 0.14, 48, -2),
    },
    // 26.3
    {
      ...D, ...DOUX, id: 'hebron-1994', dur: 11, fly: 1.2, hitAt: 0.6,
      ghost: '1994', eyebrow: 'Hébron · 25 février 1994', title: ['Le tombeau', 'des Patriarches'],
      rows: [['Le tueur', 'Baruch Goldstein, colon de Kiryat Arba, ouvre le feu sur des fidèles en prière'], ['Les morts', '29 Palestiniens tués dans la mosquée Ibrahimi']],
      rowAt: [2.0, 5.6],
      lon: 35.1104, lat: 31.5247, pin: true, place: 'Mosquée Ibrahimi', pinLabel: true,
      cam: cam(35.1, 31.525, 0.03, 46, -6), camEnd: cam(35.1, 31.525, 0.025, 52, 3),
    },
    // 27.8
    {
      ...O, id: 'paye-par-un-etat', dur: 4, fly: 0.5, hitAt: 0.35, noWhoosh: true,
      eyebrow: 'Selon The New York Times · juin 2024', lines: ['Une campagne', 'payée', 'par un État'],
      cam: cam(35.21, 31.78, 0.06, 44, -6), camEnd: cam(35.21, 31.78, 0.055, 46, -3),
    },
    // 28.5
    {
      ...D, id: 'octobre-2000', dur: 13, fly: 1.2, hitAt: 0.6,
      ghost: '2000', eyebrow: 'Galilée · octobre 2000', title: ['Un citoyen', 'sur cinq'],
      rows: [['Aujourd’hui', 'les Palestiniens d’Israël sont environ un citoyen sur cinq'], ['Octobre 2000', 'la police tue treize manifestants arabes']],
      rowAt: [1.8, 5.4],
      note: 'Commission d’enquête Or, 2003', noteAt: 9.0,
      lon: 35.3, lat: 32.75, pin: false,
      cam: cam(35.25, 32.75, 0.12, 42, -4), camEnd: cam(35.25, 32.75, 0.1, 48, 4),
    },
    // 28.6
    {
      ...D, id: 'democratie', dur: 14, fly: 1.2, hitAt: 0.6,
      ghost: '2021', eyebrow: 'Pour ses défenseurs', title: ['Une', 'démocratie'],
      rows: [['Le vote', 'les citoyens arabes votent et ont des députés à la Knesset'], ['Depuis 2022', 'Khaled Kabub, juge arabe à la Cour suprême'], ['En 2021', 'Ra’am, parti arabe, entre dans la coalition au pouvoir']],
      rowAt: [2.2, 6.0, 8.6],
      lon: 35.205, lat: 31.776, pin: true, place: 'Knesset', pinLabel: true,
      cam: cam(35.2, 31.78, 0.05, 44, -6), camEnd: cam(35.2, 31.78, 0.042, 50, 3),
    },
    // 28.9
    {
      ...D, id: 'loi-2018', dur: 9, fly: 1.2, hitAt: 0.5,
      ghost: '2018', eyebrow: 'Knesset · 19 juillet 2018', title: ['La loi', 'État-nation'],
      quote: 'L’exercice du droit à l’autodétermination nationale dans l’État d’Israël [[est propre au peuple juif]].',
      ref: 'Loi fondamentale, article 1 · traduit de l’hébreu', quoteAt: 0.9,
      lon: 35.205, lat: 31.776, pin: true, place: 'Knesset', pinLabel: true,
      cam: cam(35.2, 31.78, 0.042, 50, 3), camEnd: cam(35.2, 31.78, 0.036, 54, 6),
    },
    // 29.6 · Partie VI
    {
      ...O, id: 'refuge', dur: 12, fly: 1.2, hitAt: 0.4,
      eyebrow: 'Pour la plupart des Juifs dans le monde', lines: ['Un refuge', 'et une part', 'd’eux-mêmes'],
      cam: cam(35.0, 31.75, 0.2, 36, -4), camEnd: cam(35.05, 31.75, 0.18, 40, 3),
    },
    // 30.6
    {
      ...O, id: 'priere', dur: 8, fly: 1.2, hitAt: 0.4,
      eyebrow: 'Foi ou nationalisme', lines: ['Un État', 'n’est pas', 'une prière'],
      cam: cam(35.234, 31.777, 0.02, 48, -6), camEnd: cam(35.234, 31.777, 0.017, 52, 3),
    },
    // 31.17
    {
      ...O, id: 'qui-parle', dur: 9, fly: 1.2, hitAt: 0.4,
      eyebrow: 'Une question revient sans cesse', lines: ['Qui parle', 'de cette terre', 'et qui l’on écoute'],
      cam: PAL2, camEnd: cam(35.1, 31.7, 0.16, 42, 6),
    },
    // 32.3 · Partie VII
    {
      ...D, ...DOUX, id: 'elkana', dur: 17, fly: 1.2, hitAt: 0.6,
      ghost: '1988', eyebrow: 'Haaretz · 2 mars 1988', title: ['Pour', 'l’oubli'],
      meta: 'Yehuda Elkana · philosophe, déporté enfant à Auschwitz',
      note: 'Selon lui, rien ne menace plus l’avenir d’Israël [[que d’avoir fait de la Shoah l’axe de sa conscience nationale]].', noteAt: 3.4,
      lon: 34.78, lat: 32.08, pin: false,
      cam: cam(34.8, 32.06, 0.07, 42, -6), camEnd: cam(34.8, 32.06, 0.055, 48, 3),
    },
    // 32.4
    {
      type: 'quote', quiet: true, ...DOUX, id: 'levi', dur: 17, fly: 1.2, hitAt: 0.6, wordStep: 0.22,
      text: 'Chacun est [[le Juif de quelqu’un]].',
      author: 'Primo Levi · « Maintenant ou jamais », 1982',
      context: 'Survivant d’Auschwitz, il prête ces mots à un personnage de son roman. Après Sabra et Chatila, il demande la démission de Menahem Begin.',
      cam: cam(7.68, 45.07, 0.08, 42, -8), camEnd: cam(7.68, 45.07, 0.065, 48, 2),
    },
    // 32.7
    {
      ...D, id: 'zertal', dur: 11, fly: 1.2, hitAt: 0.6,
      ghost: '2004', eyebrow: 'Idith Zertal · historienne israélienne', title: ['La nation', 'et la mort'],
      meta: 'La Shoah dans le discours et la politique d’Israël, 2004',
      note: 'Pour elle, cette mémoire sert aussi [[à justifier la politique de l’État envers les Palestiniens]].', noteAt: 3.0,
      lon: 35.21, lat: 31.78, pin: false,
      cam: cam(35.2, 31.78, 0.07, 42, -6), camEnd: cam(35.2, 31.78, 0.058, 48, 3),
    },
    // 33.12
    {
      ...D, id: 'reponse-israel', dur: 16, fly: 1.2, hitAt: 0.6,
      ghost: '2016', eyebrow: 'Nations unies · de 1948 à 2016', title: ['La réponse', 'd’Israël'],
      rows: [['Israël répond', 'ces textes engageaient aussi les États arabes, qui ont longtemps refusé de le reconnaître'], ['23 décembre 2016', 'résolution 2334 : les colonies, une « violation flagrante » du droit international']],
      rowAt: [1.8, 8.0],
      lon: 35.25, lat: 31.9, pin: false,
      cam: cam(35.2, 31.9, 0.2, 40, -6), camEnd: cam(35.2, 31.9, 0.17, 46, 3),
    },
    // 35.8
    {
      ...D, id: 'apartheid-non', dur: 12, fly: 1.2, hitAt: 0.6,
      eyebrow: 'Position du gouvernement israélien', title: ['Israël rejette', 'ce mot'],
      rows: [['Ses citoyens arabes', 'votent et siègent au Parlement'], ['Les territoires', 'relèvent, dit-il, d’un conflit, pas d’un système']],
      rowAt: [1.8, 5.2],
      lon: 35.2, lat: 31.8, pin: false,
      cam: cam(35.15, 31.85, 0.16, 42, -6), camEnd: cam(35.15, 31.85, 0.14, 48, 3),
    },
    // 35.18
    {
      ...D, id: 'genocide-non', dur: 12, fly: 1.2, hitAt: 0.6,
      eyebrow: 'Position du gouvernement israélien', title: ['Israël rejette', 'ces conclusions'],
      rows: [['Israël', 'dit combattre le Hamas, pas un peuple, et invoque la légitime défense'], ['La Haye', 'la Cour internationale de justice n’a pas encore jugé le fond']],
      rowAt: [1.8, 6.6],
      lon: 34.45, lat: 31.45, pin: false,
      cam: cam(34.5, 31.45, 0.12, 42, -6), camEnd: cam(34.5, 31.45, 0.1, 48, 3),
    },
    // 36.5
    {
      ...S, id: 'deux-israel', dur: 11, fly: 1.2, hitAt: 0.3,
      left: { kicker: 'Pour les manifestants · 2023', word: 'Démocratie', text: 'Des centaines de milliers d’Israéliens [[défendent leurs institutions]].' },
      right: { kicker: 'Pour beaucoup de Palestiniens', word: 'Occupation', text: 'Ces manifestations [[ne parlaient pas d’eux]].' },
      footer: 'Une démocratie pour les uns, l’occupation pour les autres',
      cam: cam(35.0, 32.0, 0.22, 44, -8), camEnd: cam(35.02, 32.0, 0.2, 48, -2),
    },
    // 39.3 · Conclusion
    {
      ...O, id: 'egalite-a', dur: 7.5, fly: 1.4, hitAt: 0.3,
      eyebrow: 'Entre la mer et le Jourdain', lines: ['L’égalité', 'des droits'],
      cam: cam(35.1, 31.75, 0.24, 32, -4), camEnd: cam(35.12, 31.75, 0.22, 35, 0),
    },
    {
      ...O, id: 'egalite-b', dur: 7.5, fly: 0.6, hitAt: 0.3, noWhoosh: true,
      eyebrow: 'Ce film ne demande à personne de partir', lines: ['Que personne', 'ne soit plus', 'chassé'],
      cam: cam(35.12, 31.75, 0.22, 35, 0), camEnd: cam(35.14, 31.75, 0.2, 38, 4),
    },
  ];

  // la terre entière, de la mer au Jourdain (frontières de 1922, tracé simplifié), Gaza, et les kibboutz autour de Gaza
  const TERRE = [[34.22, 31.32], [34.48, 31.6], [34.75, 32.05], [34.95, 32.6], [35.1, 33.09], [35.58, 33.27], [35.62, 32.68],
    [35.55, 32.2], [35.52, 31.5], [35.3, 30.9], [35.12, 30.2], [34.95, 29.55], [34.88, 29.6], [34.5, 30.6], [34.25, 31.2]];
  const GAZA = [[34.22, 31.32], [34.5, 31.6], [34.57, 31.55], [34.3, 31.22]];
  const ENVELOPPE = [[34.5, 31.6], [34.62, 31.55], [34.6, 31.3], [34.42, 31.22], [34.36, 31.28], [34.57, 31.55]];
  const lights = [
    { seg: 'la-parole', at: 0.8, poly: TERRE, n: 900, wide: true, until: 6.0 },
    { seg: 'sept-octobre', at: 0.6, poly: ENVELOPPE, n: 320, off: 3.6, keep: 0.3, wide: true, until: 18.0 },
    { seg: 'genocide-onu', at: 0.4, poly: GAZA, n: 900, off: 2.4, keep: 0.22, wide: true, until: 12.0 },
    { seg: 'genocide-non', at: 0.4, poly: GAZA, n: 900, off: 2.0, keep: 0.22, wide: true, until: 12.0 },
    { seg: 'egalite-a', at: 1.0, poly: TERRE, n: 1300, wide: true, until: 15.0 },
  ];
  const zones = [
    { seg: 'octobre-2000', at: 0.6, dur: 1.6, name: 'israel-1949', from: [35.3, 32.75], tone: 'stone' },
    { seg: 'democratie', at: 0.6, dur: 1.6, name: 'israel-1949', from: [35.2, 31.78], tone: 'stone', until: 23.0 },
    { seg: 'reponse-israel', at: 7.6, dur: 1.8, name: 'cisjordanie', from: [35.25, 31.95] },
    { seg: 'reponse-israel', at: 8.2, dur: 1.4, name: 'jerusalem-est-annexee', from: [35.23, 31.78] },
    { seg: 'apartheid-non', at: 1.6, dur: 1.6, name: 'israel-1949', from: [35.0, 32.0], tone: 'stone' },
    { seg: 'apartheid-non', at: 4.8, dur: 1.8, name: 'cisjordanie', from: [35.25, 31.95] },
    { seg: 'apartheid-non', at: 5.2, dur: 1.4, name: 'gaza', from: [34.4, 31.45] },
  ];
  // une colonne de lumière là où le sang a coulé
  const columns = [
    { seg: 'hebron-1994', at: 5.4, lon: 35.1104, lat: 31.5247, h: 22000, w: 22, value: '29 morts', until: 11.0 },
  ];

  root.TL = root.buildTL({
    name: 'paroles',
    seed: 1897,
    segments,
    zones,
    lights,
    relief: true,
    cities: [],
    hud: { label: null, index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: null },
  });
  root.TL.columns = columns;
})(typeof window !== 'undefined' ? window : globalThis);
