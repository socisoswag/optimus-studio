/*
 * Générique de fin, ≈ 1 min. Aucun nom de l'équipe du film : seulement les crédits que demandent les
 * licences (photos, cartes, polices) et les sources des chiffres et des citations montrés à l'écran.
 * Les crédits des photos viennent de portraits/LISEZMOI.md.
 */
(function (root) {
  const sections = [
    {
      h: 'Documents et chiffres',
      lines: [
        ['Nations unies', 'Assemblée générale · Conseil de sécurité'],
        ['UNRWA', 'réfugiés de Palestine'],
        ['OCHA', 'coordination des affaires humanitaires'],
        'Haut-Commissariat des Nations unies aux droits de l’homme',
        'Commission internationale indépendante d’enquête de l’ONU',
        'Cour internationale de justice · Cour pénale internationale',
        ['IPC', 'classification de la sécurité alimentaire'],
        'B’Tselem · ministère de la Santé de Gaza',
        'Human Rights Watch · Amnesty International',
        ['Meta · OpenAI', 'rapports de mai 2024'],
        ['The New York Times · Haaretz', 'juin 2024'],
        ['JewishGen', 'migrations juives de 1881 à 1914'],
        ['Meron Benvenisti', 'Sacred Landscape, 2000'],
        ['The Lancet', 'Jamaluddine et al., 2025'],
        ['Université de Birzeit', 'S. Kanaana'],
        ['Walid Khalidi', 'All That Remains'],
        ['Salman Abu Sitta', 'les localités dépeuplées en 1948'],
        'Police libanaise · commission Kahan',
      ],
    },
    {
      h: 'Citations',
      lines: [
        ['Theodor Herzl', 'Journal, 1895 · éd. R. Patai, 1960'],
        ['David Ben Gourion', 'cité par Benny Morris, 2004'],
        ['Golda Meir', 'The Sunday Times, 15 juin 1969'],
        ['Mahmoud Darwich', '« Sur cette terre »'],
        ['La Bible', 'traduction Louis Segond, 1910'],
        ['Agnès Callamard', 'Amnesty International, 2022'],
        ['Arthur Koestler', 'Promise and Fulfilment, 1949'],
        ['Henry McMahon · Sykes et Picot · Arthur Balfour', 'lettres et accords de 1915 à 1917'],
      ],
    },
    {
      h: 'Photographies · Wikimedia Commons',
      lines: [
          ["Abd al-Qadir al-Husseini", "auteur inconnu · domaine public"],
          ["Alain Finkielkraut", "Jérémy Barande · CC BY-SA 2.0"],
          ["Alfred Dreyfus", "Aron Gerschel · domaine public"],
          ["Anouar el-Sadate", "gouvernement égyptien · domaine public"],
          ["Ariel Sharon", "IPPA, collection Dan Hadani, Bibliothèque nationale d’Israël · CC BY 4.0"],
          ["Arthur Balfour", "Bain News Service · domaine public"],
          ["Arthur Koestler", "Eric Koch / Anefo · CC BY-SA 3.0"],
          ["Avigdor Lieberman", "Département de la Défense des États-Unis · domaine public"],
          ["Benyamin Netanyahou", "Avi Ohayon · CC BY-SA 3.0"],
          ["Bernard-Henri Lévy", "Itzike · CC BY-SA 3.0"],
          ["Bezalel Smotrich", "Avi Ohayon · CC BY-SA 3.0"],
          ["Chaïm Weizmann", "Hugo Mendelson · CC BY-SA 3.0"],
          ["Cheikh Ahmed Yassine", "Yonathan Torgovnik, porte-parole de l’armée israélienne · CC BY-SA 3.0"],
          ["David Ben Gourion", "Fritz Cohen · domaine public"],
          ["François Georges-Picot", "auteur inconnu · domaine public"],
          ["Gamal Abdel Nasser", "Stevan Kragujević · CC BY-SA 3.0"],
          ["Golda Meir", "Willem van de Poll · CC BY-SA 4.0"],
          ["Hadj Amin al-Husseini", "American Colony, Jérusalem · domaine public"],
          ["Haïm Arlozoroff", "auteur inconnu · domaine public"],
          ["Henry McMahon", "auteur inconnu · domaine public"],
          ["Hussein ben Ali", "auteur inconnu · domaine public"],
          ["Itamar Ben Gvir", "Alon Nuriel · CC BY-SA 3.0"],
          ["Izz al-Din al-Qassam", "auteur inconnu · domaine public"],
          ["Mahmoud Darwich", "UmmNuniya · CC BY-SA 4.0"],
          ["Mark Sykes", "auteur inconnu · domaine public"],
          ["Menahem Begin", "US Air Force · domaine public"],
          ["Theodor Herzl", "Carl Pietzner · domaine public"],
          ["Walter Rothschild", "auteur inconnu · domaine public"],
          ["Yasser Arafat", "Gideon Markowiz · CC BY 4.0"],
          ["Yitzhak Rabin", "Yaakov Saar · CC BY-SA 3.0"],
          ["Ze’ev Jabotinsky", "Government Press Office (Israël) · domaine public"],
      ],
    },
    {
      h: 'Cartographie',
      lines: [['Natural Earth', 'domaine public'], ['OCHA · HDX', 'zones des accords d’Oslo, tracé du mur, janvier 2018'], ['Autorité palestinienne', 'ministère du Plan']],
    },
    {
      h: 'Polices de caractères',
      lines: [['Archivo · Newsreader · DM Mono', 'SIL Open Font License'], ['Noto Sans Hebrew · Noto Kufi Arabic', 'SIL Open Font License']],
    },
    { lines: ['À la mémoire de toutes les victimes.'] },
    { big: 'SION', lines: ['L’idée, la terre, le choc'] },
  ];
  const segments = [
    {
      id: 'roll', type: 'roll', dur: 62.0, fly: 1.5, hitAt: 0, hold: 5.0, sections,
      cam: { lon: 35.0, lat: 32.3, w: 0.13, pitch: 40, bearing: -8 },
      camEnd: { lon: 35.15, lat: 31.6, w: 0.1, pitch: 50, bearing: 6 },
    },
  ];
  // la vie sur la terre, en olive, pendant tout le générique
  const lights = [{ seg: 'roll', at: 0.5, poly: [[34.3, 33.1], [35.7, 33.1], [35.6, 31.2], [34.2, 31.2]], n: 900 }];

  root.TL = root.buildTL({
    name: 'generique-fin',
    seed: 2026,
    segments,
    lights,
    cities: [],
    hud: { label: ['Sion', 'Générique de fin'], index: false, coords: false, ruler: false, odo: false, from: 99 },
    fadeIn: 0.8,
    fadeOut: 2.0,
    sound: { ticks: null },
  });
})(typeof window !== 'undefined' ? window : globalThis);
