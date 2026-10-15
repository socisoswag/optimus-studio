/*
 * Pièce « Titres de chapitre » : 39 cartons de 4,6 s, rendus d'un bloc puis
 * découpés en un fichier par chapitre (tools/build_chapitres.sh).
 *
 * Chaque titre est coupé au deux-points : la première partie en grand
 * (condensée), la suite en italique. Mise en page (gauche, centre, droite) et
 * apparition (impact, balayage, mise au point) alternent pour ne jamais
 * enchaîner deux cartons identiques. Chaque carton s'ouvre sur un lieu.
 */
(function (root) {
  const PARTS = {
    I: 'L’idée', II: 'Le basculement', III: 'La catastrophe fondatrice', IV: 'Résistances et oppressions',
    V: 'La dérive d’un projet', VI: 'Voix et contre-voix', VII: 'Une histoire universelle ?', C: 'Conclusion',
  };

  // Lieux : cadre final de la caméra (elle arrive de plus haut).
  const PLACES = {
    jerusalem: { lon: 35.22, lat: 31.78, w: 0.05, pitch: 48 },
    palestine: { lon: 35.0, lat: 31.8, w: 0.12, pitch: 46 },
    europeEst: { lon: 27.0, lat: 49.5, w: 0.45, pitch: 40 },
    paris: { lon: 2.35, lat: 48.86, w: 0.12, pitch: 44 },
    vienne: { lon: 16.37, lat: 48.21, w: 0.12, pitch: 44 },
    rishon: { lon: 34.8, lat: 31.96, w: 0.04, pitch: 50 },
    londres: { lon: -0.13, lat: 51.51, w: 0.12, pitch: 44 },
    berlin: { lon: 13.4, lat: 52.52, w: 0.12, pitch: 44 },
    europe: { lon: 14.0, lat: 47.0, w: 0.9, pitch: 34 },
    newyork: { lon: -73.95, lat: 40.75, w: 0.1, pitch: 44 },
    deiryassin: { lon: 35.178, lat: 31.786, w: 0.03, pitch: 52 },
    telaviv: { lon: 34.78, lat: 32.08, w: 0.04, pitch: 50 },
    bagdad: { lon: 44.37, lat: 33.31, w: 0.12, pitch: 44 },
    cisjordanie: { lon: 35.25, lat: 32.0, w: 0.08, pitch: 48 },
    beyrouth: { lon: 35.5, lat: 33.87, w: 0.06, pitch: 48 },
    gaza: { lon: 34.42, lat: 31.45, w: 0.05, pitch: 52 },
    levant: { lon: 35.5, lat: 32.5, w: 0.3, pitch: 40 },
    mediterranee: { lon: 22.0, lat: 37.0, w: 1.0, pitch: 30 },
  };

  // [numéro, partie, titre, lieu, effet, nom du lieu affiché]
  // effet : 'pin' (repère + nom), 'heat' (la zone s'embrase), 'flicker' (zone qui brûle),
  //         'erase' (les points s'éteignent), '' (vue seule)
  const LIST = [
    [1, 'I', 'Sion : un mot, un mythe, un monde', 'jerusalem', 'pin', 'Jérusalem'],
    [2, 'I', 'L’Europe en feu : entre antisémitisme et émancipation', 'europeEst', '', ''],
    [3, 'I', 'L’affaire Dreyfus : fracture française et choc identitaire', 'paris', 'pin', 'Paris'],
    [4, 'I', 'Theodor Herzl : le prophète du retour', 'vienne', 'pin', 'Vienne'],
    [5, 'I', 'Les premiers colons juifs en Palestine', 'rishon', 'pin', 'Rishon LeZion'],
    [6, 'I', 'La Palestine ottomane : coexistence et tensions sous la surface', 'palestine', 'heat', ''],
    [7, 'II', 'La Déclaration Balfour (1917)', 'londres', 'pin', 'Londres'],
    [8, 'II', 'Le mandat britannique : promesses brisées, haine semée', 'jerusalem', 'pin', 'Jérusalem'],
    [9, 'II', 'Le traité Haavara et l’assassinat d’Arlozoroff', 'berlin', 'pin', 'Berlin'],
    [10, 'II', 'Les juifs contre les juifs : sionistes, orthodoxes et antisionistes', 'europe', '', ''],
    [11, 'II', 'Congrès sionistes et montée des tensions avec les Arabes palestiniens', 'palestine', 'heat', ''],
    [12, 'III', '1947 : le plan de partage de l’ONU', 'newyork', 'pin', 'ONU · New York'],
    [13, 'III', '1948 : la création d’Israël et la Nakba', 'palestine', 'flicker', ''],
    [14, 'III', 'Les milices juives : Haganah, Irgoun, Lehi', 'telaviv', '', ''],
    [15, 'III', 'Le massacre de Deir Yassin', 'deiryassin', 'pin', 'Deir Yassin'],
    [16, 'III', 'Ben Gourion : bâtir un État, effacer un peuple', 'telaviv', 'pin', 'Tel-Aviv'],
    [17, 'III', 'L’exode des juifs arabes et sépharades', 'bagdad', 'pin', 'Bagdad'],
    [18, 'III', 'Golda Meir : « Les Palestiniens n’existent pas »', 'jerusalem', 'pin', 'Jérusalem'],
    [19, 'IV', 'Cisjordanie, Gaza, Jérusalem : terres volées, peuples divisés', 'cisjordanie', 'heat', ''],
    [20, 'IV', 'Les camps palestiniens et la vie dans l’exil', 'beyrouth', 'pin', 'Camps du Liban'],
    [21, 'IV', 'Yasser Arafat : l’icône d’un peuple sans drapeau', 'levant', '', ''],
    [22, 'IV', 'Les intifadas : pierres contre tanks', 'gaza', 'pin', 'Jabalia'],
    [23, 'IV', 'Colonisation rampante et colonies illégales', 'cisjordanie', 'flicker', ''],
    [24, 'V', 'Netanyahou, Lieberman, et la haine institutionnalisée', 'jerusalem', 'pin', 'Jérusalem'],
    [25, 'V', 'Gaza, un champ d’expérimentation militaire', 'gaza', 'flicker', ''],
    [26, 'V', 'Le Talmud : quand les textes nourrissent les extrêmes', 'mediterranee', '', ''],
    [27, 'V', 'La guerre numérique : désinformation, faux profils et chaos en ligne (Mossad)', 'levant', '', ''],
    [28, 'V', 'Le racisme en Israël : mizrahim, éthiopiens et palestiniens', 'telaviv', '', ''],
    [29, 'VI', 'Les juifs antisionistes : Neturei Karta, Jewish Voice for Peace', 'jerusalem', 'pin', 'Mea Shearim'],
    [30, 'VI', 'Les religieux contre le sionisme : foi ou nationalisme ?', 'jerusalem', '', ''],
    [31, 'VI', 'BHL, Finkielkraut et les intellectuels faussaires', 'paris', 'pin', 'Paris'],
    [32, 'VII', 'La Shoah utilisée comme bouclier politique', 'europe', '', ''],
    [33, 'VII', 'Les résolutions de l’ONU ignorées : 194, 242, 338', 'newyork', 'pin', 'ONU · New York'],
    [34, 'VII', 'L’effacement culturel : villages détruits, noms effacés', 'palestine', 'erase', ''],
    [35, 'VII', 'Le destin manifeste : colonialisme, apartheid, dépossession', 'levant', 'heat', ''],
    [36, 'VII', 'La fracture en Israël : extrémisme religieux vs démocratie', 'jerusalem', '', ''],
    [37, 'C', 'Le droit des peuples : libre arbitre contre dogme', 'mediterranee', '', ''],
    [38, 'C', 'La souffrance palestinienne : entre mémoire, poésie et lumière', 'palestine', 'heat', ''],
    [39, 'C', 'Pour une paix juste : aimer la terre, pas la détruire', 'jerusalem', '', ''],
  ];

  const DUR = 4.6;
  const LAYOUTS = ['L', 'C', 'R'];
  const REVEALS = ['slam', 'wipe', 'focus'];
  const ANCHORS = { L: [470, 40], C: [0, 300], R: [-470, 40] };
  const cap = (x) => x.charAt(0).toUpperCase() + x.slice(1);

  const markers = [];
  const segments = LIST.map(([n, part, full, place, fx, label], i) => {
    const num = String(n).padStart(2, '0');
    const k = full.indexOf(' : ');
    const title = k > 0 ? full.slice(0, k) : full;
    const sub = k > 0 ? cap(full.slice(k + 3)) : '';
    const layout = LAYOUTS[i % 3];
    const P = PLACES[place];
    const bearing = (i % 2 ? -1 : 1) * (4 + (i * 5) % 11);
    const s = {
      id: `c${num}`, type: 'chapter', dur: DUR, fly: 0, hitAt: 0.85,
      num, title, sub, layout, reveal: REVEALS[(i + Math.floor(i / 3)) % 3],
      kicker: part === 'C' ? `Chapitre ${num} · Conclusion` : `Chapitre ${num} · Partie ${part} · ${PARTS[part]}`,
      anchor: ANCHORS[layout], edgeFade: true, camEase: 'arrive',
      lon: P.lon, lat: P.lat,
      cam: { lon: P.lon, lat: P.lat, w: P.w * 2.8, pitch: P.pitch - 14, bearing: bearing * 2 },
      camEnd: { lon: P.lon, lat: P.lat, w: P.w, pitch: P.pitch, bearing },
      pin: fx === 'pin', place: label || undefined, pinLabel: fx === 'pin',
      flashRate: part === 'C' ? 0.35 : 1,
    };
    if (fx === 'heat') s.heat = { R: 1300, amt: 0.9 };
    if (fx === 'flicker') s.heat = { R: 1500, amt: 1.1, flicker: true };
    if (fx === 'erase') markers.push({ seg: s.id, at: 0.9, num, label: '', lon: P.lon, lat: P.lat, erase: true, R: 1500, eraseDur: 3.2 });
    return s;
  });

  // accords : un par partie
  const CH = { I: 'Dm', II: 'Bb', III: 'Gm', IV: 'A', V: 'Gm', VI: 'Dm', VII: 'Bb', C: 'Dm9' };
  const chords = [];
  LIST.forEach(([, part], i) => { if (!i || LIST[i - 1][1] !== part) chords.push([i * DUR, CH[part]]); });

  root.TL = root.buildTL({
    name: 'chapitres',
    seed: 39,
    segments,
    markers,
    hud: { label: null, index: false, coords: true, ruler: false, odo: false, from: 0.0 },
    fadeIn: 0,
    fadeOut: 0,
    sound: { ticks: null, chords, fadeIn: 0.3 },
  });
  root.TL.cardDur = DUR;
})(typeof window !== 'undefined' ? window : globalThis);
