/*
 * Carte « La terre en 1945 » (chapitre 11), ≈ 31 s. Modèle : timelines/camps.js.
 *
 * Part des terres en propriété juive, par sous-district, au 1er avril 1945 : Nations unies, carte « Palestine : Land
 * ownership by sub-districts (1945) », août 1950 (comité ad hoc sur la question de Palestine), d'après les Village
 * Statistics 1945 du gouvernement de la Palestine (repris dans « Sous-districts de la Palestine mandataire »).
 * Ensemble du pays : environ 1,5 million de dounams sur 26,3 millions, soit moins de 6 %.
 * 1947 : 56 % du territoire attribués à l'État juif (plan de partage) ; 1949 : 78 % (lignes d'armistice).
 * Sur le relief éclairé de la carte du partage (SRTM, NASA) : une colonne de lumière par sous-district, posée sur son
 * chef-lieu, haute de 1 200 m par point de pourcentage (pas de frontières de sous-district à l'écran : la colonne dit la
 * proportion, pas l'emplacement exact des terres).
 */
(function (root) {
  const segments = [
    {
      id: 'plaine', type: 'cap', dur: 13.0, fly: 1.4, anchor: [330, -60], textW: 860,
      kicker: 'Nations unies, 1950 · d’après les statistiques de 1945', title: 'La terre en 1945',
      text: 'Part des terres en propriété juive, sous-district par sous-district. Les achats se concentrent [[dans la plaine côtière et les vallées du nord.]]',
      cam: { lon: 34.98, lat: 32.66, w: 0.066, pitch: 44, bearing: -8 },
      camEnd: { lon: 35.0, lat: 32.68, w: 0.061, pitch: 48, bearing: 4 },
    },
    {
      id: 'collines', type: 'cap', dur: 10.0, fly: 1.6, anchor: [330, -60], textW: 860,
      kicker: 'Les collines et le sud', title: 'Moins de 1 %',
      text: 'À Jénine, Naplouse, Ramallah, Hébron et Beersheba, [[presque toute la terre est arabe, ou publique.]]',
      cam: { lon: 34.96, lat: 31.86, w: 0.072, pitch: 46, bearing: -6 },
      camEnd: { lon: 34.98, lat: 31.87, w: 0.067, pitch: 50, bearing: 4 },
    },
    {
      id: 'fin', type: 'outro', dur: 8.5, fly: 1.6, hitAt: 1.0,
      eyebrow: 'La terre',
      lines: ['Moins de 6 % en 1945.', '56 % attribués en 1947.', '78 % en 1949.'],
      cam: { lon: 35.0, lat: 31.65, w: 0.12, pitch: 32, bearing: 0 },
      camEnd: { lon: 35.0, lat: 31.65, w: 0.124, pitch: 30, bearing: 4 },
    },
  ];
  const markers = [];
  // [sous-district, longitude, latitude du chef-lieu, part juive en %, sens de la légende]
  const PLAINE = [
    ['Jaffa', 34.76, 32.05, 39, [1, -1]], ['Tibériade', 35.53, 32.79, 38, [1, -1]], ['Haïfa', 34.99, 32.8, 35, [-1, -1]],
    ['Beisan', 35.5, 32.5, 34, [1, 1]], ['Nazareth', 35.3, 32.7, 28, [-1, 1]], ['Safed', 35.5, 32.965, 18, [1, -1]],
    ['Tulkarem', 35.03, 32.31, 17, [-1, 1]], ['Ramla', 34.87, 31.93, 14, [1, 1]], ['Acre', 35.07, 32.93, 3, [-1, -1]],
  ];
  PLAINE.forEach(([nom, lon, lat, p, dir], i) => markers.push({
    seg: 'plaine', at: 2.2 + 0.6 * i, label: nom, lon, lat, dir, off: 40, area: true, R: 1, endAt: 13.2,
  }));
  const COLLINES = [
    ['Jénine', 35.3, 32.46, '<1', [1, -1]], ['Naplouse', 35.26, 32.22, '<1', [1, 1]], ['Ramallah', 35.2, 31.9, '<1', [-1, -1]],
    ['Jérusalem', 35.22, 31.78, '2', [1, 1]], ['Gaza', 34.46, 31.5, '4', [-1, 1]], ['Hébron', 35.1, 31.53, '<1', [1, 1]],
    ['Beersheba', 34.79, 31.25, '<1', [-1, 1]],
  ];
  COLLINES.forEach(([nom, lon, lat, p, dir], i) => markers.push({
    seg: 'collines', at: 2.2 + 0.55 * i, label: nom, lon, lat, dir, off: 40, area: true, R: 1, endAt: 10.2,
  }));
  // la donnée elle-même : une colonne de lumière par sous-district, posée sur son chef-lieu,
  // haute de 1 200 m par point de pourcentage ; les collines n'ont qu'un socle éteint
  const TERRE = { Jaffa: 0.05, 'Haïfa': 0.03, Acre: 0.07, Gaza: 0.03 }; // villes de la côte : colonne posée sur la terre
  const columns = [];
  PLAINE.forEach(([nom, lon, lat, p], i) => columns.push({ seg: 'plaine', at: 2.2 + 0.6 * i, lon: lon + (TERRE[nom] || 0), lat, h: 1200 * p, w: 15, vx: { Safed: -40, Beisan: 46 }[nom] || 0, value: `${p} %`, until: 23.2 }));
  COLLINES.forEach(([nom, lon, lat, p], i) => columns.push({
    seg: 'collines', at: 2.2 + 0.55 * i, lon: lon + (TERRE[nom] || 0), lat, h: p === '<1' ? 400 : 1200 * +p, w: 15, vx: { Ramallah: -46, 'Jérusalem': 34 }[nom] || 0, value: p === '<1' ? 'moins de 1 %' : `${p} %`, cold: p === '<1', until: 10.2,
  }));
  const clock = [{ seg: 'plaine', at: 0.2, text: '1er avril 1945' }, { seg: 'collines', at: 0.2, text: '1er avril 1945' }, { seg: 'fin', at: 0.2, text: '' }];

  root.TL = root.buildTL({
    name: 'terres-1945',
    seed: 1945,
    segments,
    markers,
    clock,
    cities: [],
    hud: { label: ['Sion', 'Chapitre 11 · La terre en 1945'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: null },
  });
  // le relief éclairé de la carte du partage (SRTM, NASA), sans découpage : la terre elle-même
  root.TL.columns = columns;
  root.TL.partage = { center: [35.0, 31.6], land: { seg: 'plaine', at: 0.1, dur: 2.0 }, drain: { seg: 'fin', at: 0.4, dur: 2.0 } };
})(typeof window !== 'undefined' ? window : globalThis);
