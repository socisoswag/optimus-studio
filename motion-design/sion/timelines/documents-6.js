/*
 * Les sujets que le film n'abordait pas encore, en fiches sur la carte (plans marqués output/documents-6.mp4 dans
 * script/*.yaml). Modèle : timelines/documents-3.js. Les chiffres marqués « à vérifier » dans le script attendent la
 * réponse Perplexity (script/A-FABRIQUER.md) ; la fiche est refaite si un chiffre change.
 *
 * Sources :
 *   Loi sur les biens des absents, 14 mars 1950 ; loi du retour, 5 juillet 1950 (Knesset).
 *   Jour de la Terre, 30 mars 1976 : grève contre les expropriations en Galilée, six citoyens arabes tués.
 *   Villages bédouins non reconnus du Néguev ; al-Araqib (chiffres à vérifier).
 *   Accords d'Oslo II, 28 septembre 1995, annexe III, article 40 (l'eau ; chiffres à vérifier).
 *   Cheikh Jarrah, Jérusalem-Est, avril-mai 2021 : expulsions demandées par des associations de colons.
 *   Accords d'Abraham, Maison-Blanche, 15 septembre 2020 (Émirats arabes unis, Bahreïn ; puis Maroc et Soudan).
 *   Grande marche du retour, Gaza, à partir du 30 mars 2018 : 189 Palestiniens tués jusqu'au 31 décembre 2018
 *   (commission d'enquête de l'ONU, février 2019).
 *   Mavi Marmara, 31 mai 2010 : neuf militants tués à bord, un dixième mort de ses blessures en 2014.
 *   L'argent du Qatar vers Gaza, 2018-2023 (New York Times, 10 décembre 2023 ; Haaretz ; citation à vérifier).
 *   Shireen Abu Akleh, tuée à Jénine le 11 mai 2022 (ONU, HCDH, juin 2022) ; journalistes tués à Gaza (CPJ, à vérifier).
 *   France : accord nucléaire franco-israélien de 1957 (Dimona) ; CEDH, Baldassi et autres c. France, 11 juin 2020 ;
 *   reconnaissance de l'État de Palestine, 22 septembre 2025.
 *   CIJ, avis consultatif du 19 juillet 2024 ; Assemblée générale de l'ONU, résolution ES-10/24, 18 septembre 2024.
 *   États-Unis : protocole d'accord du 14 septembre 2016, 38 milliards de dollars pour 2019-2028 ; vetos (à vérifier).
 *   Jérusalem : reconnaissance par les États-Unis le 6 décembre 2017, ambassade ouverte le 14 mai 2018.
 *   Mineurs devant les tribunaux militaires et détention administrative (chiffres à vérifier).
 *   Edward Said (Jérusalem, 1935 ; New York, 2003), The Question of Palestine, 1979.
 */
(function (root) {
  const D = { type: 'doc', layout: 'L', anchor: [540, 40] };
  const PAL = { cam: { lon: 34.95, lat: 31.85, w: 0.16, pitch: 42, bearing: -4 }, camEnd: { lon: 34.95, lat: 31.85, w: 0.14, pitch: 48, bearing: 4 } };
  const JER = { lon: 35.21, lat: 31.78, pin: true, place: 'Jérusalem', pinLabel: true,
    cam: { lon: 35.2, lat: 31.78, w: 0.05, pitch: 44, bearing: -6 }, camEnd: { lon: 35.2, lat: 31.78, w: 0.042, pitch: 50, bearing: 3 } };
  const GAZA = { lon: 34.45, lat: 31.5, pin: true, place: 'Gaza', pinLabel: true,
    cam: { lon: 34.5, lat: 31.45, w: 0.08, pitch: 42, bearing: -6 }, camEnd: { lon: 34.5, lat: 31.45, w: 0.065, pitch: 48, bearing: 3 } };
  const SOFT = { noWhoosh: true, k: 0.5, hitKind: 'soft' };
  const segments = [
    {
      ...D, id: 'd16-lois', dur: 15, fly: 2.4, hitAt: 0.8,
      ghost: '1950', eyebrow: 'Knesset · 1950', title: ['Deux lois', 'de 1950'],
      rows: [['5 juillet 1950 · loi du retour', 'tout Juif du monde peut devenir citoyen'], ['14 mars 1950 · biens des absents', 'les terres des réfugiés passent à l’État']],
      rowAt: [2.2, 6.6],
      note: 'Les réfugiés palestiniens, eux, ne peuvent pas revenir.', noteAt: 10.6,
      ...JER,
    },
    {
      ...D, id: 'd28-terre', dur: 13, fly: 2.4, hitAt: 0.8, ...SOFT,
      ghost: '1976', eyebrow: 'Galilée · 30 mars 1976', title: ['Le Jour', 'de la Terre'],
      rows: [['Grève générale', 'contre les expropriations de terres'], ['Six citoyens arabes d’Israël', 'tués par la police et l’armée']],
      rowAt: [2.2, 6.2],
      lon: 35.3, lat: 32.86, pin: true, place: 'Sakhnin', pinLabel: true,
      cam: { lon: 35.25, lat: 32.8, w: 0.1, pitch: 42, bearing: -4 },
      camEnd: { lon: 35.25, lat: 32.8, w: 0.085, pitch: 48, bearing: 4 },
    },
    {
      ...D, id: 'd28-neguev', dur: 13, fly: 2.4, hitAt: 0.8,
      ghost: '2026', eyebrow: 'Néguev · aujourd’hui', title: ['Les villages', 'non reconnus'],
      meta: 'Des villages bédouins sans eau courante, sans électricité, menacés de démolition',
      lon: 34.77, lat: 31.34, pin: true, place: 'al-Araqib', pinLabel: true,
      cam: { lon: 34.8, lat: 31.3, w: 0.12, pitch: 42, bearing: -4 },
      camEnd: { lon: 34.8, lat: 31.3, w: 0.1, pitch: 48, bearing: 4 },
    },
    {
      ...D, id: 'd23-eau', dur: 14, fly: 2.4, hitAt: 0.8,
      ghost: '1995', eyebrow: 'Cisjordanie · depuis Oslo II, 1995', title: ['Le partage', 'de l’eau'],
      rows: [['Les nappes de Cisjordanie', 'sous contrôle israélien'], ['Un Palestinien', 'beaucoup moins d’eau qu’un colon']],
      rowAt: [2.2, 6.4],
      lon: 35.2, lat: 32.0, pin: false, ...PAL,
    },
    {
      ...D, id: 'd23-jarrah', dur: 12, fly: 2.0, hitAt: 0.8,
      ghost: '2021', eyebrow: 'Jérusalem-Est · mai 2021', title: ['Cheikh', 'Jarrah'],
      meta: 'Des familles palestiniennes menacées d’expulsion au profit de colons',
      lon: 35.229, lat: 31.792, pin: true, place: 'Cheikh Jarrah', pinLabel: true,
      cam: { lon: 35.22, lat: 31.79, w: 0.03, pitch: 46, bearing: -6 },
      camEnd: { lon: 35.22, lat: 31.79, w: 0.025, pitch: 52, bearing: 3 },
    },
    {
      ...D, id: 'd25-abraham', dur: 13, fly: 2.4, hitAt: 0.8,
      ghost: '2020', eyebrow: 'Washington · 15 septembre 2020', title: ['Les accords', 'd’Abraham'],
      rows: [['Émirats, Bahreïn, puis Maroc et Soudan', 'reconnaissent Israël'], ['Sans attendre', 'un État palestinien']],
      rowAt: [2.2, 6.4],
      lon: 35.0, lat: 31.8, pin: false, ...PAL,
    },
    {
      ...D, id: 'd25-marche', dur: 13, fly: 2.4, hitAt: 0.8, ...SOFT,
      ghost: '2018', eyebrow: 'Gaza · 2018-2019', title: ['La grande marche', 'du retour'],
      rows: [['Chaque vendredi', 'des milliers de manifestants à la clôture'], ['En 2018', '189 Palestiniens tués']],
      rowAt: [2.2, 6.2],
      note: 'Commission d’enquête de l’ONU, février 2019', noteAt: 9.0,
      ...GAZA,
    },
    {
      ...D, id: 'd25-flottille', dur: 12, fly: 2.4, hitAt: 0.8, ...SOFT,
      ghost: '2010', eyebrow: 'Eaux internationales · 31 mai 2010', title: ['Le Mavi', 'Marmara'],
      rows: [['Une flottille', 'veut briser le blocus'], ['L’armée israélienne aborde le navire', 'dix militants tués']],
      rowAt: [2.2, 6.0],
      lon: 34.2, lat: 31.9, pin: false,
      cam: { lon: 34.3, lat: 31.9, w: 0.3, pitch: 40, bearing: -4 },
      camEnd: { lon: 34.3, lat: 31.9, w: 0.26, pitch: 46, bearing: 4 },
    },
    {
      ...D, id: 'd25-qatar', dur: 13, fly: 2.0, hitAt: 0.8,
      ghost: '2018', eyebrow: 'Gaza · 2018-2023', title: ['L’argent', 'du Qatar'],
      meta: 'Le gouvernement Netanyahou laisse passer des millions de dollars vers Gaza, gouvernée par le Hamas',
      note: 'The New York Times, 10 décembre 2023', noteAt: 8.0,
      ...GAZA,
    },
    {
      ...D, id: 'd22-akleh', dur: 13, fly: 2.4, hitAt: 0.8, ...SOFT,
      ghost: '2022', eyebrow: 'Jénine · 11 mai 2022', title: ['Shireen', 'Abu Akleh'],
      meta: 'Journaliste d’Al Jazeera, tuée par une balle israélienne selon l’ONU',
      note: 'Gaza, depuis 2023 : le conflit le plus meurtrier pour les journalistes recensé par le CPJ', noteAt: 7.6,
      lon: 35.3, lat: 32.46, pin: true, place: 'Jénine', pinLabel: true,
      cam: { lon: 35.28, lat: 32.42, w: 0.08, pitch: 42, bearing: -6 },
      camEnd: { lon: 35.28, lat: 32.42, w: 0.065, pitch: 48, bearing: 3 },
    },
    {
      ...D, id: 'd31-france', dur: 16, fly: 2.4, hitAt: 0.8,
      ghost: '1957', eyebrow: 'La France · de 1957 à 2025', title: ['Le rôle', 'de la France'],
      rows: [['1957', 'elle aide Israël à bâtir la centrale de Dimona'], ['11 juin 2020', 'la CEDH la condamne pour avoir puni des appels au boycott'], ['22 septembre 2025', 'elle reconnaît l’État de Palestine']],
      rowAt: [2.0, 5.6, 9.4],
      lon: 35.14, lat: 31.0, pin: true, place: 'Dimona', pinLabel: true,
      cam: { lon: 35.1, lat: 31.1, w: 0.14, pitch: 42, bearing: -4 },
      camEnd: { lon: 35.1, lat: 31.1, w: 0.12, pitch: 48, bearing: 4 },
    },
    {
      ...D, id: 'd33-cij', dur: 15, fly: 2.4, hitAt: 0.8,
      ghost: '2024', eyebrow: 'La Haye · 19 juillet 2024', title: ['La Cour', 'internationale de justice'],
      rows: [['L’occupation', 'est illégale'], ['Israël doit y mettre fin', 'et évacuer les colons'], ['18 septembre 2024', 'l’ONU exige la fin dans les douze mois']],
      rowAt: [2.0, 5.4, 9.0],
      lon: 35.0, lat: 31.8, pin: false, ...PAL,
    },
    {
      ...D, id: 'd33-usa', dur: 14, fly: 2.4, hitAt: 0.8,
      ghost: '2016', eyebrow: 'Washington · 14 septembre 2016', title: ['Le soutien', 'américain'],
      rows: [['38 milliards de dollars', 'd’aide militaire, de 2019 à 2028'], ['Au Conseil de sécurité', 'des dizaines de vetos']],
      rowAt: [2.2, 6.6],
      lon: 35.0, lat: 31.8, pin: false, ...PAL,
    },
    {
      ...D, id: 'd33-ambassade', dur: 12, fly: 2.0, hitAt: 0.8,
      ghost: '2018', eyebrow: 'Jérusalem · 14 mai 2018', title: ['L’ambassade', 'américaine'],
      rows: [['6 décembre 2017', 'Washington reconnaît Jérusalem comme capitale d’Israël'], ['Le jour de l’ouverture', 'des dizaines de manifestants tués à Gaza']],
      rowAt: [2.0, 6.0],
      ...JER,
    },
    {
      ...D, id: 'd35-enfants', dur: 14, fly: 2.4, hitAt: 0.8, ...SOFT,
      ghost: '2026', eyebrow: 'Cisjordanie occupée · aujourd’hui', title: ['Les tribunaux', 'militaires'],
      rows: [['Des centaines de mineurs', 'jugés chaque année par l’armée'], ['Des milliers de Palestiniens', 'détenus sans procès']],
      rowAt: [2.2, 6.4],
      lon: 35.175, lat: 31.885, pin: true, place: 'Ofer', pinLabel: true,
      cam: { lon: 35.15, lat: 31.88, w: 0.1, pitch: 42, bearing: -4 },
      camEnd: { lon: 35.15, lat: 31.88, w: 0.085, pitch: 48, bearing: 4 },
    },
    {
      ...D, id: 'd38-said', dur: 13, fly: 2.4, hitAt: 0.8,
      ghost: '1979', eyebrow: 'Jérusalem 1935 · New York 2003', title: ['Edward', 'Said'],
      meta: 'Né à Jérusalem, il quitte la ville en 1947 et fait entendre la Palestine dans le monde',
      note: 'The Question of Palestine, 1979', noteAt: 8.0,
      ...JER,
    },
  ];

  root.TL = root.buildTL({
    name: 'documents-6',
    seed: 2024,
    segments,
    hud: { label: ['Sion', 'Les faits'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: null },
  });
})(typeof window !== 'undefined' ? window : globalThis);
