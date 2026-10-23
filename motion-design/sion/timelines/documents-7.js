/*
 * Les manques relevés le 23 octobre 2026 (relecture complète du film), en fiches sur la carte (plans marqués
 * output/documents-7.mp4 dans script/*.yaml). Modèle : timelines/documents-6.js, même gabarit et même rythme.
 * Tout ce qui est marqué « verifier » dans le script attend la réponse Perplexity (script/A-FABRIQUER.md, section 8).
 *
 * La terre, de 1858 au mandat :
 *   Code foncier ottoman de 1858 (enregistrement des terres ; inscriptions au nom de notables).
 *   Edmond de Rothschild (1845-1934) : Rishon LeZion, Zikhron Yaakov, Rosh Pina, à partir de 1882-1883 ; colonies
 *   confiées à la Jewish Colonization Association en 1899-1900.
 *   Petah Tikva et le village de Yahudiya, 1886.
 *   Fonds national juif (Keren Kayemeth LeIsrael), 5e congrès sioniste, Bâle, décembre 1901.
 *   Ventes de la famille Sursock dans la plaine de Jezréel (Marj Ibn Amer), années 1920.
 *   Rapport de Sir John Hope Simpson, octobre 1930 ; lettre de Ramsay MacDonald, 13 février 1931.
 * 1948 :
 *   Plan Dalet, 10 mars 1948 (texte traduit par Walid Khalidi, Journal of Palestine Studies, 1988).
 *   Tantura, 22-23 mai 1948 ; al-Dawayima, 29 octobre 1948 ; « Tantura », film d'Alon Schwarz, 2022.
 * Gaza et la Cisjordanie :
 *   Gadi Eisenkot, doctrine Dahiya (Yedioth Ahronoth, octobre 2008).
 *   Isaac Herzog (13 octobre 2023), Amichai Eliyahu (5 novembre 2023), Avi Dichter (11 novembre 2023), cités dans la
 *   requête de l'Afrique du Sud devant la CIJ (29 décembre 2023) et l'ordonnance du 26 janvier 2024.
 *   Hind Rajab, 29 janvier 2024 (Croissant-Rouge palestinien ; Forensic Architecture).
 *   Secouristes tués à Rafah, 23 mars 2025 (Croissant-Rouge palestinien, Défense civile, ONU ; enquête de l'armée).
 *   Blocus total de l'aide, 2 mars au 19 mai 2025 ; CPI, mandats du 21 novembre 2024 (famine comme méthode de guerre).
 *   Projet E1, approuvé le 20 août 2025 ; Bezalel Smotrich, 14 août 2025.
 *   Grande Mosquée al-Omari (8 décembre 2023), universités, Archives centrales de Gaza.
 */
(function (root) {
  const D = { type: 'doc', layout: 'L', anchor: [540, 40] };
  const PAL = { cam: { lon: 34.95, lat: 31.85, w: 0.16, pitch: 42, bearing: -4 }, camEnd: { lon: 34.95, lat: 31.85, w: 0.14, pitch: 48, bearing: 4 } };
  const GAZA = { lon: 34.45, lat: 31.5, pin: true, place: 'Gaza', pinLabel: true,
    cam: { lon: 34.5, lat: 31.45, w: 0.08, pitch: 42, bearing: -6 }, camEnd: { lon: 34.5, lat: 31.45, w: 0.065, pitch: 48, bearing: 3 } };
  const lieu = (lon, lat, place, w = 0.1) => ({ lon, lat, pin: true, place, pinLabel: true,
    cam: { lon: lon - 0.02, lat: lat - 0.03, w, pitch: 42, bearing: -4 }, camEnd: { lon: lon - 0.02, lat: lat - 0.03, w: w * 0.85, pitch: 48, bearing: 4 } });
  const SOFT = { noWhoosh: true, k: 0.5, hitKind: 'soft' };
  const segments = [
    // ---- la terre (chapitres 5, 6 et 8)
    {
      ...D, id: 'd5-rothschild', dur: 15, fly: 2.4, hitAt: 0.8,
      ghost: '1882', eyebrow: 'Rishon LeZion · 1882', title: ['Le baron', 'de Rothschild'],
      rows: [['Dès 1882', 'Edmond de Rothschild finance Rishon LeZion, Zikhron Yaakov, Rosh Pina'], ['Ses agents', 'achètent des terres, souvent à de grands propriétaires absents'], ['En 1899', 'il confie ses colonies à la Jewish Colonization Association']],
      note: 'En hébreu, on l’appelle « le bienfaiteur connu ».',
      ...lieu(34.8, 31.96, 'Rishon LeZion'),
    },
    {
      ...D, id: 'd6-code', dur: 15, fly: 2.4, hitAt: 0.8,
      ghost: '1858', eyebrow: 'Empire ottoman · 1858', title: ['Le code', 'foncier'],
      rows: [['Toute terre', 'doit être enregistrée au nom d’un propriétaire'], ['Beaucoup de paysans', 'l’inscrivent au nom de notables, pour fuir l’impôt et l’armée']],
      note: 'Des familles de Beyrouth ou de Damas deviennent propriétaires de villages entiers.',
      lon: 35.0, lat: 31.8, pin: false, ...PAL,
    },
    {
      ...D, id: 'd6-petahtikva', dur: 13, fly: 2.0, hitAt: 0.8,
      ghost: '1886', eyebrow: 'Petah Tikva · 1886', title: ['Le premier', 'heurt'],
      rows: [['La colonie', 's’étend sur des terres achetées à des propriétaires absents'], ['Les paysans de Yahudiya', 'perdent leurs pâturages et attaquent la colonie']],
      note: 'Le premier affrontement pour la terre entre colons juifs et paysans arabes.',
      ...lieu(34.887, 32.087, 'Petah Tikva'),
    },
    {
      ...D, id: 'd6-kkl', dur: 13, fly: 2.4, hitAt: 0.8,
      ghost: '1901', eyebrow: 'Bâle · décembre 1901', title: ['Le Fonds', 'national juif'],
      rows: [['Le mouvement sioniste', 'crée un fonds pour acheter la terre de Palestine'], ['Ses terres', 'ne se revendent jamais et sont louées à des Juifs']],
      lon: 7.59, lat: 47.56, pin: true, place: 'Bâle', pinLabel: true,
      cam: { lon: 7.59, lat: 47.56, w: 0.05, pitch: 44, bearing: -6 },
      camEnd: { lon: 7.59, lat: 47.56, w: 0.04, pitch: 50, bearing: 4 },
    },
    {
      ...D, id: 'd8-sursock', dur: 14, fly: 2.4, hitAt: 0.8, ...SOFT,
      ghost: '1921', eyebrow: 'Plaine de Jezréel · années 1920', title: ['La grande', 'vente'],
      rows: [['La famille Sursock, de Beyrouth', 'vend une grande partie de la plaine'], ['Une vingtaine de villages', 'des milliers de métayers arabes expulsés']],
      note: 'Ils cultivaient ces terres depuis des générations, sans en être propriétaires.',
      ...lieu(35.3, 32.62, 'Marj Ibn Amer', 0.12),
    },
    {
      ...D, id: 'd8-hopesimpson', dur: 15, fly: 2.4, hitAt: 0.8,
      ghost: '1930', eyebrow: 'Londres · octobre 1930', title: ['Le rapport', 'Hope Simpson'],
      rows: [['Un enquêteur britannique', 'près de 30 % des familles arabes des villages sont sans terre'], ['Octobre 1930', 'Londres promet de freiner les achats'], ['Février 1931', 'sous la pression, Londres revient en arrière']],
      lon: -0.13, lat: 51.51, pin: true, place: 'Londres', pinLabel: true,
      cam: { lon: -0.12, lat: 51.51, w: 0.05, pitch: 46, bearing: 10 },
      camEnd: { lon: -0.12, lat: 51.51, w: 0.035, pitch: 52, bearing: 0 },
    },
    // ---- 1948 (chapitres 13 et 15)
    {
      ...D, id: 'd13-dalet', dur: 15, fly: 2.4, hitAt: 0.8,
      ghost: '1948', eyebrow: 'Haganah · 10 mars 1948', title: ['Le plan', 'Dalet'],
      rows: [['Détruire des villages', 'les incendier, les dynamiter, miner leurs ruines'], ['En cas de résistance', '« la population doit être expulsée hors des frontières de l’État »']],
      note: 'Pour Ilan Pappé, un plan de nettoyage ethnique ; pour Benny Morris, d’abord un plan militaire.',
      lon: 35.0, lat: 31.8, pin: false, ...PAL,
    },
    {
      ...D, id: 'd15-tantura', dur: 15, fly: 2.4, hitAt: 0.8, ...SOFT,
      ghost: '1948', eyebrow: 'Tantura · mai 1948', title: ['Tantura', 'et al-Dawayima'],
      rows: [['22 et 23 mai 1948 · Tantura', 'des dizaines d’hommes tués après la prise du village'], ['29 octobre 1948 · al-Dawayima', 'des dizaines, peut-être des centaines de morts']],
      note: 'En 2022, d’anciens soldats racontent Tantura devant la caméra (« Tantura », Alon Schwarz).',
      ...lieu(34.92, 32.61, 'Tantura'),
    },
    // ---- Gaza (chapitre 25)
    {
      ...D, id: 'd25-dahiya', dur: 14, fly: 2.0, hitAt: 0.8,
      ghost: '2008', eyebrow: 'Israël · octobre 2008', title: ['La doctrine', 'Dahiya'],
      rows: [['Le général Gadi Eisenkot', '« Nous emploierons une force disproportionnée »'], ['Les villages d’où l’on tire', '« ne sont pas des villages civils, ce sont des bases militaires »']],
      note: 'Dahiya : le quartier de Beyrouth rasé en 2006.',
      ...GAZA,
    },
    {
      ...D, id: 'd25-paroles', dur: 17, fly: 2.0, hitAt: 0.8,
      ghost: '2023', eyebrow: 'Israël · octobre et novembre 2023', title: ['D’autres', 'paroles'],
      rows: [['13 octobre · le président Isaac Herzog', '« C’est toute une nation, là-bas, qui est responsable »'], ['5 novembre · le ministre Amichai Eliyahu', 'une bombe atomique sur Gaza, « une des possibilités »'], ['11 novembre · le ministre Avi Dichter', '« Nous sommes en train de dérouler la Nakba de Gaza »']],
      note: 'Relevées par l’Afrique du Sud devant la Cour internationale de justice.',
      ...GAZA,
    },
    {
      ...D, id: 'd25-hind', dur: 15, fly: 2.0, hitAt: 0.8, ...SOFT,
      ghost: '2024', eyebrow: 'Gaza · 29 janvier 2024', title: ['Hind', 'Rajab'],
      rows: [['6 ans', 'seule vivante dans la voiture de sa famille, elle appelle le Croissant-Rouge'], ['L’ambulance envoyée', 'détruite, ses deux secouristes tués']],
      note: 'Retrouvée morte douze jours plus tard. En 2025, un film raconte son appel.',
      ...GAZA,
    },
    {
      ...D, id: 'd25-secouristes', dur: 14, fly: 2.0, hitAt: 0.8, ...SOFT,
      ghost: '2025', eyebrow: 'Rafah · 23 mars 2025', title: ['Les secouristes', 'de Rafah'],
      rows: [['15 secouristes et sauveteurs', 'tués, puis enterrés avec leurs véhicules'], ['La vidéo du téléphone de l’un d’eux', 'contredit la première version de l’armée']],
      note: 'L’armée reconnaît ensuite des « fautes professionnelles ».',
      ...lieu(34.25, 31.3, 'Rafah', 0.08),
    },
    {
      ...D, id: 'd25-blocus', dur: 13, fly: 2.0, hitAt: 0.8, ...SOFT,
      ghost: '2025', eyebrow: 'Gaza · 2 mars au 19 mai 2025', title: ['Onze semaines', 'sans rien'],
      rows: [['2 mars 2025', 'Israël bloque toute entrée de nourriture et de médicaments'], ['Novembre 2024', 'la CPI vise déjà « la famine comme méthode de guerre »']],
      ...GAZA,
    },
    // ---- Cisjordanie (chapitre 26) et patrimoine (chapitre 34)
    {
      ...D, id: 'd26-e1', dur: 14, fly: 2.0, hitAt: 0.8,
      ghost: '2025', eyebrow: 'Cisjordanie · août 2025', title: ['Le projet', 'E1'],
      rows: [['20 août 2025', 'Israël approuve 3 400 logements entre Jérusalem et Maalé Adoumim'], ['Bezalel Smotrich', '« Cela enterre l’idée d’un État palestinien »']],
      note: 'Le projet coupe la Cisjordanie en deux, entre le nord et le sud.',
      ...lieu(35.3, 31.79, 'Maalé Adoumim', 0.06),
    },
    {
      ...D, id: 'd34-patrimoine', dur: 15, fly: 2.0, hitAt: 0.8, ...SOFT,
      ghost: '2023', eyebrow: 'Gaza · depuis octobre 2023', title: ['Effacer', 'aussi la mémoire'],
      rows: [['8 décembre 2023', 'la Grande Mosquée al-Omari, la plus ancienne de Gaza, détruite'], ['Les universités de Gaza', 'toutes endommagées ou détruites'], ['Les Archives centrales', 'brûlées, avec plus d’un siècle de documents']],
      note: 'Des experts de l’ONU parlent de « scolasticide ».',
      ...GAZA,
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
    name: 'documents-7',
    seed: 1858,
    segments,
    hud: { label: ['Sion', 'Les faits'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: null },
  });
})(typeof window !== 'undefined' ? window : globalThis);
