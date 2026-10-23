/*
 * Pièce « Chronologie des figures » (1897 – 1995).
 * Contenu et minutage du motion design.
 * Tout le texte affiché à l'écran est ici : modifiez-le puis relancez le rendu.
 *
 * Champs d'une fiche :
 *   year      année affichée en grand
 *   place     lieu affiché sur la carte (lon / lat en degrés décimaux)
 *   eyebrow   fonction, en petites capitales au-dessus du nom
 *   name      [prénom, nom] (deux lignes)
 *   native    nom dans sa langue (hébreu ou arabe), lang = 'he' | 'ar'
 *   life      dates de naissance et de mort
 *   text      une phrase, pas plus de vingt mots
 *   photo     chemin d'une photo d'archive (facultatif), ex. 'portraits/herzl.jpg'
 *   layout    'L' texte à gauche, 'R' texte à droite, 'pair' deux figures
 *   cam       w = largeur de vue (radians Mercator, petit = zoom fort),
 *             pitch = inclinaison de la carte (°), bearing = rotation (°)
 */
(function (root) {
  const FIG = 4.4; // durée d'une fiche, en secondes (vol de caméra compris)

  const segments = [
    {
      type: 'intro', dur: 6.0,
      eyebrow: 'Chronologie · de 1897 à 1995',
      title: ['Israël', 'Palestine'],
      sub: 'Les acteurs d’un siècle, en treize portraits',
      year: 1897,
      cam: { lon: 31.5, lat: 35.0, w: 0.95, pitch: 34, bearing: -4 },
      camEnd: { lon: 33.5, lat: 33.6, w: 0.62, pitch: 40, bearing: 4 },
    },
    {
      id: 'herzl', type: 'figure', dur: FIG, layout: 'L',
      year: 1897, place: 'Bâle', lon: 7.59, lat: 47.56,
      eyebrow: 'Journaliste viennois · Père du sionisme politique',
      name: ['Theodor', 'Herzl'], native: 'תאודור הרצל', lang: 'he',
      life: '1860-1904',
      text: "Publie L’État des Juifs (1896), puis réunit à Bâle le premier Congrès sioniste.",
      photo: 'portraits/herzl.png',
      cam: { w: 0.16, pitch: 42, bearing: -8 },
    },
    {
      id: 'weizmann', type: 'figure', dur: FIG, layout: 'R',
      year: 1917, place: 'Londres', lon: -0.13, lat: 51.51,
      eyebrow: 'Chimiste · Dirigeant sioniste',
      name: ['Chaïm', 'Weizmann'], native: 'חיים ויצמן', lang: 'he',
      life: '1874-1952',
      text: "Artisan de la déclaration Balfour : Londres soutient un « foyer national juif » en Palestine.",
      photo: 'portraits/weizmann.png',
      cam: { w: 0.16, pitch: 38, bearing: 7 },
    },
    {
      id: 'amin-husseini', type: 'figure', dur: FIG, layout: 'L',
      year: 1921, place: 'Jérusalem', lon: 35.22, lat: 31.78,
      eyebrow: 'Grand mufti de Jérusalem',
      name: ['Hadj Amin', 'al-Husseini'], native: 'أمين الحسيني', lang: 'ar',
      life: 'v. 1897-1974',
      text: "Nommé par les Britanniques, il prend la tête du mouvement national arabe palestinien sous le Mandat.",
      photo: 'portraits/amin-husseini.png',
      cam: { w: 0.05, pitch: 46, bearing: -10 },
    },
    {
      id: 'jabotinsky', type: 'figure', dur: FIG, layout: 'R',
      year: 1925, place: 'Paris', lon: 2.35, lat: 48.86,
      eyebrow: 'Fondateur du sionisme révisionniste',
      name: ['Ze’ev', 'Jabotinsky'], native: 'זאב ז׳בוטינסקי', lang: 'he',
      life: '1880-1940',
      text: "Fonde à Paris l’Union sioniste révisionniste. Théoricien du « mur de fer » (1923).",
      photo: 'portraits/jabotinsky.png',
      cam: { w: 0.14, pitch: 40, bearing: 10 },
    },
    {
      id: 'qassam', type: 'figure', dur: FIG, layout: 'L',
      year: 1935, place: 'Haïfa', lon: 34.99, lat: 32.79,
      eyebrow: 'Prédicateur · Chef armé',
      name: ['Izz al-Din', 'al-Qassam'], native: 'عز الدين القسام', lang: 'ar',
      life: '1882-1935',
      text: "Prend les armes contre le Mandat britannique. Sa mort précède la grande révolte arabe de 1936.",
      photo: 'portraits/qassam.png',
      cam: { w: 0.045, pitch: 46, bearing: 12 },
    },
    {
      id: 'abd-al-qadir', type: 'figure', dur: FIG, layout: 'R',
      year: 1948, place: 'Al-Qastal', lon: 35.143, lat: 31.794,
      eyebrow: 'Commandant palestinien',
      name: ['Abd al-Qadir', 'al-Husseini'], native: 'عبد القادر الحسيني', lang: 'ar',
      life: '1907-1948',
      text: "Chef de l’Armée de la guerre sainte. Tué le 8 avril 1948 à al-Qastal, sur la route de Jérusalem.",
      photo: 'portraits/abd-al-qadir.png',
      cam: { w: 0.032, pitch: 50, bearing: -14 },
    },
    {
      id: 'ben-gourion', type: 'figure', dur: FIG, layout: 'L',
      year: 1948, place: 'Tel-Aviv', lon: 34.78, lat: 32.08,
      eyebrow: 'Premier chef du gouvernement d’Israël',
      name: ['David', 'Ben Gourion'], native: 'דוד בן-גוריון', lang: 'he',
      life: '1886-1973',
      text: "Proclame l’indépendance de l’État d’Israël à Tel-Aviv, le 14 mai 1948.",
      photo: 'portraits/ben-gourion.png',
      cam: { w: 0.04, pitch: 44, bearing: 8 },
    },
    {
      id: 'split-1948', type: 'split', dur: 4.8,
      year: 1948, lon: 35.0, lat: 31.7,
      left: {
        kicker: '14 mai 1948', word: 'Indépendance', native: 'עצמאות', lang: 'he',
        text: "Naissance de l’État d’Israël. Première guerre israélo-arabe.",
      },
      right: {
        kicker: '1948 et 1949', word: 'Nakba', native: 'النكبة', lang: 'ar',
        text: "« La catastrophe » : environ 700 000 Palestiniens fuient ou sont chassés.",
      },
      footer: 'Un même événement, deux mémoires',
      cam: { w: 0.11, pitch: 22, bearing: 0 },
    },
    {
      id: 'nasser', type: 'figure', dur: FIG, layout: 'R',
      year: 1956, place: 'Le Caire', lon: 31.24, lat: 30.04,
      eyebrow: 'Président égyptien · Figure du panarabisme',
      name: ['Gamal', 'Abdel Nasser'], native: 'جمال عبد الناصر', lang: 'ar',
      life: '1918-1970',
      text: "Nationalise le canal de Suez (1956). Défait lors de la guerre des Six Jours (1967).",
      photo: 'portraits/nasser.png',
      cam: { w: 0.12, pitch: 42, bearing: -6 },
    },
    {
      id: 'arafat', type: 'figure', dur: FIG, layout: 'L',
      year: 1959, place: 'Koweït', lon: 47.98, lat: 29.37,
      eyebrow: 'Chef du mouvement national palestinien',
      name: ['Yasser', 'Arafat'], native: 'ياسر عرفات', lang: 'ar',
      life: '1929-2004',
      text: "Cofonde le Fatah au Koweït. Préside l’Organisation de libération de la Palestine de 1969 à sa mort.",
      photo: 'portraits/arafat.png',
      cam: { w: 0.14, pitch: 40, bearing: 10 },
    },
    {
      id: 'meir', type: 'figure', dur: FIG, layout: 'R',
      year: 1973, place: 'Jérusalem', lon: 35.22, lat: 31.78,
      eyebrow: 'Première ministre d’Israël de 1969 à 1974',
      name: ['Golda', 'Meir'], native: 'גולדה מאיר', lang: 'he',
      life: '1898-1978',
      text: "Dirige le pays pendant la guerre du Kippour, lancée par l’Égypte et la Syrie en octobre 1973.",
      photo: 'portraits/meir.png',
      cam: { w: 0.05, pitch: 48, bearing: 16 },
    },
    {
      id: 'camp-david', type: 'pair', dur: FIG + 0.4, fly: 1.7,
      year: 1978, place: 'Camp David', lon: -77.465, lat: 39.648,
      eyebrow: 'Accords de Camp David',
      people: [
        { name: ['Menahem', 'Begin'], native: 'מנחם בגין', lang: 'he', life: '1913-1992', photo: 'portraits/begin.png' },
        { name: ['Anouar', 'el-Sadate'], native: 'أنور السادات', lang: 'ar', life: '1918-1981', photo: 'portraits/sadate.png' },
      ],
      text: "Israël et l’Égypte posent les bases du premier traité de paix israélo-arabe (1979). Prix Nobel de la paix.",
      cam: { w: 0.09, pitch: 40, bearing: -8 },
    },
    {
      id: 'yassine', type: 'figure', dur: FIG, layout: 'L', fly: 1.7,
      year: 1987, place: 'Gaza', lon: 34.46, lat: 31.50,
      eyebrow: 'Fondateur du Hamas',
      name: ['Cheikh Ahmed', 'Yassine'], native: 'أحمد ياسين', lang: 'ar',
      life: '1936-2004',
      text: "Fonde le Hamas à Gaza en décembre 1987, au début de la première Intifada.",
      photo: 'portraits/yassine.png',
      cam: { w: 0.04, pitch: 48, bearing: -12 },
    },
    {
      id: 'oslo', type: 'pair', dur: FIG + 0.4,
      year: 1993, place: 'Oslo', lon: 10.75, lat: 59.91,
      eyebrow: 'Accords d’Oslo',
      people: [
        { name: ['Yitzhak', 'Rabin'], native: 'יצחק רבין', lang: 'he', life: '1922-1995', photo: 'portraits/rabin.png' },
        { name: ['Yasser', 'Arafat'], native: 'ياسر عرفات', lang: 'ar', life: '1929-2004', photo: 'portraits/arafat.png' },
      ],
      text: "Négociés en secret à Oslo, signés à Washington le 13 septembre 1993 : Israël et l’OLP se reconnaissent.",
      cam: { w: 0.15, pitch: 40, bearing: 6 },
    },
    {
      id: 'rabin-1995', type: 'event', dur: 4.2, quiet: true, slow: true, silenceBefore: 0.55, blackBefore: 0.5,
      faces: [root.face('rabin', { side: 'C', x: 960, h: 900, dim: 0.55, tag: false, at: 1.0 })],
      year: 1995, place: 'Tel-Aviv', lon: 34.78, lat: 32.08,
      kicker: 'Tel-Aviv',
      title: '4 novembre 1995',
      text: "Yitzhak Rabin est assassiné par un extrémiste israélien opposé aux accords d’Oslo.",
      cam: { w: 0.03, pitch: 56, bearing: 20 },
    },
    {
      id: 'outro', type: 'outro', dur: 6.6,
      year: 1995,
      eyebrow: 'De 1897 à 1995',
      lines: ['Un siècle.', 'Deux peuples.', 'Une terre.'],
      cam: { lon: 21.0, lat: 42.5, w: 1.05, pitch: 26, bearing: 0 },
    },
  ];

  // Repères de la frise du bas (année, libellé, [fin] pour une période).
  const events = [
    [1896, 'L’État des Juifs'],
    [1897, 'Congrès de Bâle'],
    [1916, 'Sykes-Picot'],
    [1917, 'Déclaration Balfour'],
    [1922, 'Mandat britannique'],
    [1929, 'Émeutes de 1929'],
    [1936, 'Grande révolte arabe', 1939],
    [1939, 'Shoah', 1945],
    [1947, 'Plan de partage (ONU)'],
    [1948, 'Indépendance · Nakba'],
    [1956, 'Crise de Suez'],
    [1964, 'Création de l’OLP'],
    [1967, 'Guerre des Six Jours'],
    [1970, 'Septembre noir'],
    [1973, 'Guerre du Kippour'],
    [1978, 'Camp David'],
    [1982, 'Guerre du Liban'],
    [1987, 'Première Intifada'],
    [1993, 'Accords d’Oslo'],
    [1995, 'Assassinat de Rabin'],
  ];

  root.TL = root.buildTL({
    name: 'chronologie',
    segments,
    relief: true,
    events,
    hud: { label: ['Israël · Palestine', 'Chronologie des figures'], index: true, coords: true, ruler: true, odo: true, from: 4.6 },
    sound: {
      ticks: [2.0, 76.6],
      chords: [[0.0, 'Dm'], [36.0, 'Bb'], [50.0, 'Gm'], [63.5, 'A'], [73.4, 'Dm9']],
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
