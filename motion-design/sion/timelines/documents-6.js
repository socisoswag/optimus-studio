/*
 * Les sujets que le film n'abordait pas encore, en fiches sur la carte (plans marqués output/documents-6.mp4 dans
 * script/*.yaml). Modèle : timelines/documents-3.js. Les chiffres marqués « à vérifier » dans le script attendent la
 * réponse Perplexity (script/A-FABRIQUER.md) ; la fiche est refaite si un chiffre change.
 *
 * Sources :
 *   Loi sur les biens des absents, 14 mars 1950 ; loi du retour, 5 juillet 1950 (Knesset).
 *   Jour de la Terre, 30 mars 1976 : grève contre les expropriations en Galilée, six citoyens arabes tués.
 *   Villages bédouins non reconnus du Néguev : 35 (Negev Coexistence Forum, 27 juillet 2025 ; IWGIA 2026) ; al-Araqib,
 *   244e démolition le 24 décembre 2025 (WAFA), série commencée en 2010.
 *   Accords d'Oslo II, 28 septembre 1995, annexe III, article 40 : environ 80 % de l'aquifère de la montagne pour Israël
 *   (Amnesty, Troubled Waters, 2009) ; 82,4 litres par jour et par Palestinien, 247 par Israélien colons compris
 *   (B'Tselem, Parched, 2 mai 2023).
 *   Cheikh Jarrah, Jérusalem-Est, avril-mai 2021 : expulsions demandées par des associations de colons.
 *   Accords d'Abraham, Maison-Blanche, 15 septembre 2020 (Émirats arabes unis, Bahreïn ; puis Maroc et Soudan).
 *   Grande marche du retour, Gaza, à partir du 30 mars 2018 : 189 Palestiniens tués jusqu'au 31 décembre 2018
 *   (commission d'enquête de l'ONU, février 2019).
 *   Mavi Marmara, 31 mai 2010 : neuf militants tués à bord, un dixième mort de ses blessures en 2014.
 *   L'argent du Qatar vers Gaza, 2018-2023 : 15 millions de dollars par mois en espèces en 2018, environ 30 millions par
 *   mois en 2021 (M. Mazzetti et R. Bergman, « Buying Quiet », The New York Times, 10 décembre 2023). Netanyahou, réunion
 *   du Likoud de mars 2019, propos rapportés (Maariv ; Haaretz, 9 octobre et 15 novembre 2023) ; démenti, TIME,
 *   entretien du 4 août 2024. Smotrich, chaîne de la Knesset, octobre 2015 (N12, 5 mai 2026 ; Zman Israel).
 *   Shireen Abu Akleh, tuée à Jénine le 11 mai 2022 (ONU, HCDH, juin 2022) ; journalistes tués à Gaza : 189 par Israël
 *   (CPJ, données au 24 septembre 2026).
 *   France : accord nucléaire franco-israélien de 1957 (Dimona) ; CEDH, Baldassi et autres c. France, 11 juin 2020 ;
 *   reconnaissance de l'État de Palestine, 22 septembre 2025.
 *   CIJ, avis consultatif du 19 juillet 2024 ; Assemblée générale de l'ONU, résolution ES-10/24, 18 septembre 2024.
 *   États-Unis : protocole d'accord du 14 septembre 2016, 38 milliards de dollars pour 2019-2028 ; 52 vetos
 *   américains (51 projets, 1 amendement) sur des textes concernant Israël, du 10 septembre 1972 au 18 septembre 2025
 *   (liste officielle des vetos, bibliothèque Dag Hammarskjöld de l'ONU ; décompte refait projet par projet).
 *   Jérusalem : reconnaissance par les États-Unis le 6 décembre 2017, ambassade ouverte le 14 mai 2018.
 *   Mineurs devant les tribunaux militaires : 500 à 700 par an (DCI-Palestine, No Way to Treat a Child, 14 avril 2016) ;
 *   3 101 détenus administratifs au 1er octobre 2026 (HaMoked, d'après l'administration pénitentiaire israélienne).
 *   Edward Said (Jérusalem, 1935 ; New York, 2003), The Question of Palestine, 1979.
 *   Camp David, juillet 2000 ; Taba, janvier 2001. Retrait de Gaza, août-septembre 2005. Élections législatives
 *   palestiniennes du 25 janvier 2006. Liban : mort de Hassan Nasrallah, 27 septembre 2024 ; Syrie : chute d'Assad,
 *   8 décembre 2024 ; guerre Israël-Iran, 13-24 juin 2025. Cisjordanie : plus de 5 773 incidents de colons avec
 *   victimes ou dégâts du 7 octobre 2023 au 12 octobre 2026 (calcul d'après les séries de l'OCHA) ; opération « Mur de
 *   fer », janvier 2025 ; 34 176 déplacés des camps de Jénine, Tulkarem et Nour Chams (UNRWA, août 2026).
 *   Knesset : lois contre l'UNRWA, 28 octobre 2024. Marwan Barghouti, condamné en 2004 ; 34 % dans le sondage du
 *   PCPSR du 7-11 octobre 2026 (sept noms proposés). Emmanuel Macron, dîner du CRIF, 20 février 2019 (transcription de
 *   l'Élysée) ; résolution de l'Assemblée nationale, 3 décembre 2019. Ghassan Kanafani (8 juillet 1972) ;
 *   Naji al-Ali (Londres, 1987). No Other Land, Oscar du documentaire, 2 mars 2025.
 *   Échange Shalit, 18 octobre 2011 (1 027 prisonniers, dont Yahya Sinwar). Hamas, document de principes et de
 *   politiques générales, 1er mai 2017. AIPAC et United Democracy Project (dépenses aux primaires de 2024, FEC ; à
 *   vérifier) ; Christians United for Israel ; base de données de l'ONU sur les entreprises liées aux colonies,
 *   12 février 2020 (HCDH, mise à jour en 2023 ; à vérifier).
 *   Ajouts du 23 octobre 2026 (à vérifier, script/A-FABRIQUER.md) : « Jericho Wall » (The New York Times, 30 novembre
 *   2023) ; « Lavender » (+972 Magazine, 3 avril 2024) ; Donald Trump, 4 février 2025 ; aide alimentaire (HCDH, juillet
 *   2025) ; B'Tselem, Welcome to Hell, août 2024 ; églises de Gaza (19 octobre 2023, 17 juillet 2025) ; Disclose,
 *   mars 2024 ; Eurosatory, juin 2024 ; Conseil d'État, 18 octobre 2023 ; Meyer Habib ; ELNET France (HATVP) ;
 *   visas d'élus français annulés, avril 2025 ; lettre de Netanyahou à Macron, août 2025 ; rapport de Francesca
 *   Albanese, A/HRC/59/23, juillet 2025.
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
      ghost: '2025', eyebrow: 'Néguev · 2025', title: ['Les villages', 'non reconnus'],
      rows: [['35 villages bédouins', 'non reconnus par l’État'], ['Al-Araqib', 'démoli au moins 244 fois depuis 2010']],
      rowAt: [2.2, 6.2],
      note: 'Negev Coexistence Forum, 2025 · WAFA, décembre 2025', noteAt: 9.4,
      lon: 34.77, lat: 31.34, pin: true, place: 'al-Araqib', pinLabel: true,
      cam: { lon: 34.8, lat: 31.3, w: 0.12, pitch: 42, bearing: -4 },
      camEnd: { lon: 34.8, lat: 31.3, w: 0.1, pitch: 48, bearing: 4 },
    },
    {
      ...D, id: 'd23-eau', dur: 14, fly: 2.4, hitAt: 0.8,
      ghost: '1995', eyebrow: 'Cisjordanie · depuis Oslo II, 1995', title: ['Le partage', 'de l’eau'],
      rows: [['Oslo II, 1995', 'environ 80 % de la nappe de la montagne pour Israël'], ['82 litres par jour', 'pour un Palestinien, 247 pour un Israélien']],
      rowAt: [2.2, 6.4],
      note: 'Amnesty, 2009 · B’Tselem, 2023, colons compris', noteAt: 10.0,
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
      ghost: '2018', eyebrow: 'Gaza · de 2018 à 2023', title: ['L’argent', 'du Qatar'],
      rows: [['2018', '15 millions de dollars par mois, en espèces'], ['2021', 'environ 30 millions de dollars par mois']],
      rowAt: [2.2, 5.8],
      note: 'Avec l’accord du gouvernement israélien · The New York Times, 10 décembre 2023', noteAt: 9.0,
      ...GAZA,
    },
    {
      ...D, id: 'd22-akleh', dur: 13, fly: 2.4, hitAt: 0.8, ...SOFT,
      ghost: '2022', eyebrow: 'Jénine · 11 mai 2022', title: ['Shireen', 'Abu Akleh'],
      meta: 'Journaliste d’Al Jazeera, tuée par une balle israélienne selon l’ONU',
      note: 'À Gaza depuis 2023 : 189 journalistes et employés des médias tués par Israël (CPJ, septembre 2026)', noteAt: 7.6,
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
      rows: [['38 milliards de dollars', 'd’aide militaire, de 2019 à 2028'], ['52 vetos à l’ONU', 'sur des textes concernant Israël, de 1972 à 2025']],
      rowAt: [2.2, 6.6],
      note: 'Liste des vetos du Conseil de sécurité, bibliothèque de l’ONU', noteAt: 10.4,
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
      rows: [['500 à 700 mineurs par an', 'poursuivis devant des tribunaux militaires'], ['3 101 personnes', 'en détention administrative, sans procès']],
      rowAt: [2.2, 6.4],
      note: 'DCI-Palestine, 2016 · HaMoked, 1er octobre 2026', noteAt: 10.0,
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
    {
      ...D, id: 'd22-campdavid', dur: 13, fly: 2.4, hitAt: 0.8,
      ghost: '2000', eyebrow: 'Camp David · juillet 2000', title: ['Camp David', '2000'],
      rows: [['Ehud Barak et Yasser Arafat', 'aucun accord'], ['Taba, janvier 2001', 'les négociations s’arrêtent']],
      rowAt: [2.2, 6.2],
      lon: 35.0, lat: 31.8, pin: false, ...PAL,
    },
    {
      ...D, id: 'd25-retrait', dur: 13, fly: 2.4, hitAt: 0.8,
      ghost: '2005', eyebrow: 'Gaza · août et septembre 2005', title: ['Le retrait', 'de Gaza'],
      rows: [['Environ 8 000 colons évacués', 'sur ordre d’Ariel Sharon'], ['Israël garde le contrôle', 'des frontières, de la mer et du ciel']],
      rowAt: [2.2, 6.2],
      ...GAZA,
    },
    {
      ...D, id: 'd25-elections', dur: 13, fly: 2.0, hitAt: 0.8,
      ghost: '2006', eyebrow: 'Territoires palestiniens · 25 janvier 2006', title: ['Le Hamas gagne', 'les élections'],
      rows: [['Israël, les États-Unis et l’Europe', 'boycottent son gouvernement'], ['Depuis', 'aucune élection nationale palestinienne']],
      rowAt: [2.2, 6.2],
      lon: 35.0, lat: 31.8, pin: false, ...PAL,
    },
    {
      ...D, id: 'd25-region', dur: 15, fly: 2.6, hitAt: 0.8,
      ghost: '2024', eyebrow: 'Liban, Syrie, Iran · 2024 et 2025', title: ['La guerre', 's’étend'],
      rows: [['Septembre 2024', 'au Liban, Hassan Nasrallah est tué'], ['Décembre 2024', 'Israël avance en Syrie après la chute d’Assad'], ['Juin 2025', 'douze jours de guerre avec l’Iran']],
      rowAt: [2.0, 5.6, 9.4],
      lon: 35.5, lat: 33.0, pin: false,
      cam: { lon: 35.6, lat: 32.6, w: 0.5, pitch: 40, bearing: -4 },
      camEnd: { lon: 35.6, lat: 32.6, w: 0.44, pitch: 46, bearing: 4 },
    },
    {
      ...D, id: 'd26-cisjordanie', dur: 14, fly: 2.4, hitAt: 0.8, ...SOFT,
      ghost: '2025', eyebrow: 'Cisjordanie occupée · depuis octobre 2023', title: ['En Cisjordanie', 'aussi'],
      rows: [['Plus de 5 700 attaques de colons', 'avec victimes ou dégâts, en trois ans'], ['Jénine, Tulkarem, Nour Chams', 'plus de 34 000 déplacés des camps']],
      rowAt: [2.2, 6.2],
      note: 'Relevés de l’ONU (OCHA), 2023 à 2026 · UNRWA, août 2026', noteAt: 9.6,
      lon: 35.25, lat: 32.3, pin: true, place: 'Tulkarem', pinLabel: true,
      cam: { lon: 35.2, lat: 32.2, w: 0.14, pitch: 42, bearing: -4 },
      camEnd: { lon: 35.2, lat: 32.2, w: 0.12, pitch: 48, bearing: 4 },
    },
    {
      ...D, id: 'd20-unrwa', dur: 12, fly: 2.0, hitAt: 0.8,
      ghost: '2024', eyebrow: 'Knesset · 28 octobre 2024', title: ['L’UNRWA', 'interdite'],
      meta: 'L’agence de l’ONU pour les réfugiés palestiniens n’a plus le droit d’opérer en Israël',
      ...JER,
    },
    {
      ...D, id: 'd21-barghouti', dur: 12, fly: 2.0, hitAt: 0.8,
      ghost: '2002', eyebrow: 'En prison depuis 2002', title: ['Marwan', 'Barghouti'],
      rows: [['Figure du Fatah', 'cinq condamnations à perpétuité'], ['Octobre 2026', 'en tête des sondages, avec 34 %']],
      rowAt: [2.0, 5.6],
      note: 'PCPSR, 7 au 11 octobre 2026, face à six autres noms', noteAt: 8.6,
      lon: 35.0, lat: 31.8, pin: false, ...PAL,
    },
    {
      ...D, id: 'd31-antisionisme', dur: 15, fly: 2.0, hitAt: 0.8,
      ghost: '2019', eyebrow: 'Paris · 2019', title: ['Antisionisme', 'et antisémitisme'],
      rows: [['Emmanuel Macron, 20 février 2019', 'l’antisionisme, « une des formes modernes de l’antisémitisme »'], ['3 décembre 2019', 'l’Assemblée adopte la définition de l’IHRA']],
      rowAt: [2.0, 6.0],
      note: 'Critiquer un projet politique n’est pas haïr un peuple.', noteAt: 10.2,
      lon: 35.0, lat: 31.8, pin: false, ...PAL,
    },
    {
      ...D, id: 'd38-kanafani', dur: 14, fly: 2.4, hitAt: 0.8,
      ghost: '1972', eyebrow: 'Beyrouth 1972 · Londres 1987', title: ['Kanafani', 'et Handala'],
      rows: [['Ghassan Kanafani', 'écrivain, tué dans un attentat à Beyrouth en 1972'], ['Naji al-Ali', 'père de Handala, tué à Londres en 1987']],
      rowAt: [2.2, 6.4],
      lon: 35.0, lat: 31.8, pin: false, ...PAL,
    },
    {
      ...D, id: 'd38-nootherland', dur: 12, fly: 2.0, hitAt: 0.8,
      ghost: '2025', eyebrow: 'Masafer Yatta · Oscar, 2 mars 2025', title: ['No Other', 'Land'],
      meta: 'Un film palestinien et israélien reçoit l’Oscar du documentaire',
      lon: 35.12, lat: 31.4, pin: true, place: 'Masafer Yatta', pinLabel: true,
      cam: { lon: 35.1, lat: 31.42, w: 0.08, pitch: 42, bearing: -4 },
      camEnd: { lon: 35.1, lat: 31.42, w: 0.065, pitch: 48, bearing: 4 },
    },
    {
      ...D, id: 'd25-sinwar', dur: 13, fly: 2.0, hitAt: 0.8,
      ghost: '2011', eyebrow: 'Gaza · 18 octobre 2011', title: ['L’échange', 'Shalit'],
      rows: [['1 027 prisonniers palestiniens', 'libérés contre le soldat Gilad Shalit'], ['Parmi eux', 'Yahya Sinwar, futur chef du Hamas à Gaza']],
      rowAt: [2.2, 6.2],
      ...GAZA,
    },
    {
      ...D, id: 'd22-hamas2017', dur: 12, fly: 2.0, hitAt: 0.8,
      ghost: '2017', eyebrow: 'Doha · 1er mai 2017', title: ['Le Hamas', 'change de texte'],
      rows: [['Un État dans les frontières de 1967', '« une formule de consensus »'], ['Israël', 'toujours pas reconnu']],
      rowAt: [2.0, 6.0],
      lon: 35.0, lat: 31.8, pin: false, ...PAL,
    },
    {
      ...D, id: 'd33-soutiens', dur: 18, fly: 2.4, hitAt: 0.8,
      ghost: '2024', eyebrow: 'États-Unis · aujourd’hui', title: ['Les soutiens', 'd’Israël'],
      rows: [['L’AIPAC et son comité politique', 'plus de 60 millions de dollars dépensés en 2023 et 2024'], ['Christians United for Israel', 'revendique plus de 10 millions de membres'], ['L’armement', 'l’aide militaire se dépense surtout aux États-Unis']],
      rowAt: [2.0, 6.0, 10.0],
      note: 'Ces organisations ne parlent pas au nom des Juifs : beaucoup s’y opposent.', noteAt: 13.6,
      lon: 35.0, lat: 31.8, pin: false, ...PAL,
    },
    {
      ...D, id: 'd33-entreprises', dur: 12, fly: 2.0, hitAt: 0.8,
      ghost: '2020', eyebrow: 'ONU · 12 février 2020', title: ['Les entreprises', 'des colonies'],
      rows: [['Février 2020', '112 entreprises, dont Airbnb, Booking, Expedia, TripAdvisor'], ['Juin 2023', '97 restent sur la liste, dont les groupes français Alstom et Egis']],
      note: 'Ce n’est pas une liste de condamnations, précise l’ONU.',
      lon: 35.2, lat: 31.9, pin: false, ...PAL,
    },
    // ---- ajouts du 23 octobre 2026 : chapitres 25, 31, 33, 35 et 38 (voir script/CHANGEMENTS.md)
    {
      id: 'd25-netanyahou', type: 'quote', dur: 16, fly: 1.2, hitAt: 0.8,
      faces: [root.face('netanyahou', { x: 1610, h: 800, at: 0.7, tag: false })],
      text: 'Celui qui veut empêcher la création d’un État palestinien [[doit soutenir le renforcement du Hamas et le transfert d’argent au Hamas.]]',
      native: 'מי שרוצה לסכל הקמה של מדינה פלסטינית צריך לתמוך בחיזוק חמאס ובהעברת כסף לחמאס', lang: 'he',
      author: 'Benyamin Netanyahou · réunion du Likoud, mars 2019',
      context: 'Propos rapportés par la presse israélienne, traduits de l’hébreu. En août 2024, il dément : « Je n’ai jamais dit ça. »',
      cam: { lon: 35.2, lat: 31.78, w: 0.05, pitch: 40, bearing: -6 },
      camEnd: { lon: 35.2, lat: 31.78, w: 0.042, pitch: 46, bearing: 4 },
    },
    {
      id: 'd25-smotrich', type: 'quote', dur: 11, fly: 1.2, hitAt: 0.8,
      faces: [root.face('smotrich', { x: 1610, h: 800, at: 0.7, tag: false })],
      text: 'Sur le terrain international, dans le jeu de la délégitimation, l’Autorité palestinienne est un fardeau [[et le Hamas est un atout.]]',
      native: 'במגרש הבין-לאומי, במשחק הדה-לגיטימציה, הרשות הפלסטינית היא נטל וחמאס הוא נכס', lang: 'he',
      author: 'Bezalel Smotrich · chaîne de la Knesset, octobre 2015',
      context: 'Traduit de l’hébreu. Il est aujourd’hui ministre des Finances.',
      cam: { lon: 35.2, lat: 31.78, w: 0.042, pitch: 46, bearing: 4 },
      camEnd: { lon: 35.2, lat: 31.78, w: 0.036, pitch: 50, bearing: 10 },
    },
    {
      ...D, id: 'd25-jericho', dur: 13, fly: 2.0, hitAt: 0.8,
      ghost: '2022', eyebrow: 'Israël · 2022 et 2023', title: ['Le plan', '« Mur de Jéricho »'],
      rows: [['Plus d’un an avant le 7 octobre', 'l’armée obtient le plan de l’attaque'], ['Ses chefs', 'le jugent hors de portée du Hamas']],
      rowAt: [2.2, 6.2],
      note: 'The New York Times, 30 novembre 2023', noteAt: 9.4,
      ...GAZA,
    },
    {
      ...D, id: 'd25-lavender', dur: 14, fly: 2.0, hitAt: 0.8, ...SOFT,
      ghost: '2024', eyebrow: '+972 Magazine · 3 avril 2024', title: ['« Lavender »', 'la machine à cibles'],
      rows: [['Un programme d’intelligence artificielle', 'jusqu’à 37 000 Palestiniens désignés comme cibles'], ['Selon six officiers du renseignement', 'une vingtaine de secondes de contrôle humain']],
      rowAt: [2.2, 6.2],
      note: 'L’armée dément : ce ne sont, dit-elle, que des outils pour ses analystes.', noteAt: 10.0,
      ...GAZA,
    },
    {
      ...D, id: 'd25-riviera', dur: 12, fly: 2.0, hitAt: 0.8,
      ghost: '2025', eyebrow: 'Washington · 4 février 2025', title: ['« La Riviera', 'du Moyen-Orient »'],
      rows: [['Donald Trump', 'veut que les États-Unis prennent Gaza'], ['Ses habitants', 'seraient installés ailleurs']],
      rowAt: [2.0, 5.6],
      note: 'Le droit international interdit le transfert forcé d’une population.', noteAt: 8.4,
      ...GAZA,
    },
    {
      ...D, id: 'd25-aide', dur: 13, fly: 2.0, hitAt: 0.8, ...SOFT,
      ghost: '2025', eyebrow: 'Gaza · mai à juillet 2025', title: ['Tués', 'en cherchant à manger'],
      rows: [['27 mai 2025', 'une fondation soutenue par Israël et les États-Unis distribue l’aide'], ['Au 31 juillet 2025', '1 373 Palestiniens tués en cherchant de la nourriture']],
      rowAt: [2.2, 6.2],
      note: 'Haut-Commissariat de l’ONU aux droits de l’homme', noteAt: 9.6,
      ...GAZA,
    },
    {
      ...D, id: 'd35-prisons', dur: 15, fly: 2.4, hitAt: 0.8, ...SOFT,
      ghost: '2024', eyebrow: 'Israël · août 2024', title: ['« Bienvenue', 'en enfer »'],
      rows: [['B’Tselem, ONG israélienne', '55 anciens détenus décrivent des violences systématiques'], ['Juillet 2024 · camp de Sde Teiman', 'des soldats soupçonnés de sévices sexuels sur un détenu']],
      rowAt: [2.2, 6.4],
      note: 'Des manifestants d’extrême droite, dont des députés, envahissent alors la base pour les défendre.', noteAt: 10.4,
      lon: 34.72, lat: 31.29, pin: true, place: 'Sde Teiman', pinLabel: true,
      cam: { lon: 34.74, lat: 31.27, w: 0.12, pitch: 42, bearing: -4 },
      camEnd: { lon: 34.74, lat: 31.27, w: 0.1, pitch: 48, bearing: 4 },
    },
    {
      ...D, id: 'd38-chretiens', dur: 14, fly: 2.0, hitAt: 0.8, ...SOFT,
      ghost: '2023', eyebrow: 'Gaza · 2023 et 2025', title: ['Les chrétiens', 'de Palestine'],
      rows: [['19 octobre 2023', 'une frappe touche l’église Saint-Porphyre, où s’abritent des familles : au moins 18 morts'], ['17 juillet 2025', 'l’église de la Sainte-Famille, seule paroisse catholique de Gaza : 3 morts']],
      rowAt: [2.2, 6.4],
      note: 'De Bethléem à Nazareth, des Palestiniens chrétiens depuis les débuts du christianisme.', noteAt: 10.2,
      ...GAZA,
    },
    {
      ...D, id: 'd31-armes', dur: 15, fly: 2.4, hitAt: 0.8,
      ghost: '2023', eyebrow: 'Marseille · octobre 2023', title: ['Des pièces', 'françaises'],
      rows: [['Octobre 2023', 'au moins 100 000 maillons de mitrailleuse livrés en Israël (Disclose)'], ['Juin 2024', 'Paris écarte les firmes israéliennes d’Eurosatory, la justice suspend la mesure']],
      rowAt: [2.2, 6.6],
      note: 'Le gouvernement dit ne livrer que des pièces défensives ou destinées à la réexportation.', noteAt: 10.8,
      lon: 35.0, lat: 31.8, pin: false, ...PAL,
    },
    {
      ...D, id: 'd31-manifs', dur: 13, fly: 2.0, hitAt: 0.8,
      ghost: '2023', eyebrow: 'Paris · octobre 2023', title: ['Manifester', 'pour Gaza'],
      rows: [['12 octobre 2023', 'le ministre de l’Intérieur veut les interdire toutes'], ['18 octobre 2023', 'le Conseil d’État refuse une interdiction générale']],
      rowAt: [2.2, 6.2],
      lon: 35.0, lat: 31.8, pin: false, ...PAL,
    },
    {
      ...D, id: 'd31-habib', dur: 13, fly: 2.0, hitAt: 0.8,
      ghost: '2023', eyebrow: 'Assemblée nationale · 23 octobre 2023', title: ['Meyer', 'Habib'],
      rows: [['Député des Français de l’étranger', 'élu notamment par les Français d’Israël, de 2013 à 2024'], ['Dans l’hémicycle', '« Netanyahou a été élu, que cela vous plaise ou non ! »']],
      note: 'Son élection de 2022 est annulée par le Conseil constitutionnel ; il est battu en 2024.',
      rowAt: [2.2, 6.2],
      lon: 35.0, lat: 31.8, pin: false, ...PAL,
    },
    {
      ...D, id: 'd31-elnet', dur: 13, fly: 2.0, hitAt: 0.8,
      ghost: '2024', eyebrow: 'France · aujourd’hui', title: ['Les réseaux', 'pro-israéliens'],
      rows: [['ELNET France', 'inscrit au registre des lobbies (HATVP) en novembre 2024'], ['Depuis 2017', '101 des 666 voyages déclarés par des parlementaires, payés par ELNET']],
      rowAt: [2.2, 6.2],
      note: 'Mediapart, décembre 2024. Ces réseaux ne parlent pas au nom des Juifs de France.', noteAt: 9.6,
      lon: 35.0, lat: 31.8, pin: false, ...PAL,
    },
    {
      ...D, id: 'd31-pressions', dur: 15, fly: 2.0, hitAt: 0.8,
      ghost: '2025', eyebrow: 'Paris et Jérusalem · 2025', title: ['Les pressions', 'sur Paris'],
      rows: [['Avril 2025', 'Israël annule les visas de 27 élus français de gauche'], ['Août 2025', 'Netanyahou accuse Macron d’attiser l’antisémitisme'], ['L’Élysée', 'répond : des accusations « abjectes » et « erronées »']],
      rowAt: [2.0, 5.6, 9.4],
      ...JER,
    },
    {
      ...D, id: 'd33-albanese', dur: 14, fly: 2.0, hitAt: 0.8,
      ghost: '2025', eyebrow: 'ONU · 30 juin 2025', title: ['L’économie', 'de l’occupation'],
      rows: [['Francesca Albanese, rapporteuse de l’ONU', 'environ 1 000 entreprises recensées, des dizaines nommées'], ['Parmi elles', 'Elbit, Lockheed Martin, IBM, Microsoft, Alphabet, Amazon']],
      rowAt: [2.2, 6.2],
      note: 'Le 9 juillet 2025, les États-Unis la sanctionnent.', noteAt: 10.0,
      lon: 35.0, lat: 31.8, pin: false, ...PAL,
    },
  ];

  // rythme commun des fiches : chaque ligne reste lisible au moins 2,6 s, la note au moins 3,4 s avant la sortie
  segments.forEach((s) => {
    if (s.type !== 'doc') return;
    const I = s.fly + (s.hitAt || 0), end = s.dur - I - 3.4;
    if (s.note) s.noteAt = Math.min(s.noteAt ?? end, end);
    if (!s.rows) return;
    const n = s.rows.length, first = Math.min(s.rowAt?.[0] ?? 1.2, 1.2);
    const last = Math.min(s.rowAt?.[n - 1] ?? end, s.note ? s.noteAt - 2.6 : end);
    s.rowAt = s.rows.map((_, k) => (n === 1 ? first : first + ((last - first) * k) / (n - 1)));
  });

  root.TL = root.buildTL({
    name: 'documents-6',
    seed: 2024,
    segments,
    relief: true,
    hud: { label: ['Sion', 'Les faits'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: null },
  });
})(typeof window !== 'undefined' ? window : globalThis);
