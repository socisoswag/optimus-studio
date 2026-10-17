/*
 * Séquence « L'Europe en feu » (chapitre 2), ≈ 1 min 05 : émancipation à l'Ouest, pogroms à l'Est,
 * et où partent les Juifs qui fuient, de 1881 à 1914.
 *
 * Faits et chiffres retenus :
 *   - émancipation (égalité des droits) : France 1791, Pays-Bas 1796, Royaume-Uni 1858, Autriche-Hongrie
 *     1867, Allemagne 1871 ; dans l'Empire russe, les Juifs restent assignés à la « zone de résidence »
 *     jusqu'en 1917 ;
 *   - pogroms : vague de 1881 et 1882 après l'assassinat d'Alexandre II (Elisavetgrad, Kiev, Varsovie) ;
 *     Kichinev, avril 1903, 49 morts ; Odessa, octobre 1905, plusieurs centaines de morts ; Bialystok, 1906 ;
 *   - antisémitisme politique à l'Ouest : condamnation d'Alfred Dreyfus à Paris (décembre 1894) ;
 *     Karl Lueger maire de Vienne (1897), élu sur un programme antisémite ;
 *   - de 1881 à 1914, environ 2,4 millions de Juifs quittent l'Europe de l'Est, dont environ 2 millions
 *     pour les États-Unis ; environ 70 000 pour la Palestine, moins de 3 % (JewishGen ; voir aussi
 *     aliyas.js, 55 000 à 75 000 arrivées de 1882 à 1914).
 * Les flux sont proportionnels pour les États-Unis et la Palestine ; Londres, Montréal et Buenos Aires
 * sont figurés sans chiffre.
 */
(function (root) {
  const segments = [
    {
      id: 'europe', type: 'beat', dur: 6.4, hitAt: 1.0, reveal: 'focus', rgb: 10,
      kicker: 'De 1881 à 1914', word: 'Europe',
      sub: 'À l’Ouest, l’égalité des droits. À l’Est, la violence.', subAt: 1.6,
      cam: { lon: 14.0, lat: 50.0, w: 0.75, pitch: 30, bearing: -4 },
      camEnd: { lon: 13.0, lat: 50.0, w: 0.68, pitch: 32, bearing: 2 },
    },
    {
      id: 'ouest', type: 'cap', dur: 10.6, fly: 1.2, anchor: [330, -60], textW: 860,
      kicker: 'De 1791 à 1871 · l’Ouest', title: 'L’émancipation',
      text: 'De la France à l’Allemagne, les Juifs deviennent des citoyens égaux en droits. [[Dans l’Empire russe, ils restent assignés à une « zone de résidence ».]]',
      cam: { lon: 17.5, lat: 50.0, w: 0.64, pitch: 32, bearing: -2 },
      camEnd: { lon: 18.0, lat: 50.0, w: 0.6, pitch: 34, bearing: 3 },
    },
    {
      id: 'est', type: 'cap', dur: 11.6, fly: 1.4, anchor: [330, -60], textW: 860,
      kicker: 'De 1881 à 1906 · l’Empire russe', title: 'Les pogroms',
      text: 'Après l’assassinat du tsar en 1881, les violences antijuives se répètent. [[À Kichinev en 1903, 49 morts]] ; à Odessa en 1905, plusieurs centaines.',
      cam: { lon: 26.8, lat: 49.6, w: 0.54, pitch: 38, bearing: -6 },
      camEnd: { lon: 27.0, lat: 49.6, w: 0.5, pitch: 42, bearing: 2 },
    },
    {
      id: 'antisemitisme', type: 'cap', dur: 10.8, fly: 1.4, anchor: [330, -60], textW: 860,
      kicker: 'À l’Ouest aussi · Paris, Vienne', title: 'L’antisémitisme politique',
      text: 'À Paris, en 1894, le capitaine Dreyfus est condamné à tort. [[À Vienne, en 1897, Karl Lueger devient maire]] sur un programme antisémite.',
      cam: { lon: 11.5, lat: 49.4, w: 0.36, pitch: 38, bearing: -4 },
      camEnd: { lon: 11.8, lat: 49.4, w: 0.33, pitch: 42, bearing: 3 },
    },
    {
      id: 'exode', type: 'stat', dur: 12.4, fly: 2.4, layout: 'B', anchor: [0, -170],
      ghost: '1914', kicker: 'De 1881 à 1914 · départs d’Europe de l’Est', pre: 'Environ', value: 2400000, label: 'Juifs émigrent',
      text: 'Ils fuient les pogroms et la misère. [[Environ 2 millions partent pour les États-Unis.]]',
      textAt: 1.6, hlAt: 5.4, source: 'JewishGen, migrations juives de 1881 à 1914', sourceAt: 5.0, countAt: 0.3, countDur: 3.6,
      cam: { lon: -23.5, lat: 46.0, w: 2.35, pitch: 24, bearing: 0 },
      camEnd: { lon: -23.5, lat: 46.0, w: 2.2, pitch: 26, bearing: 2 },
    },
    {
      id: 'palestine', type: 'stat', dur: 11.0, fly: 1.8, layout: 'L', anchor: [470, 30],
      ghost: '1914', kicker: 'Vers la Palestine', pre: 'Environ', value: 70000, step: 37, label: 'immigrants juifs',
      text: 'Moins de 3 % des départs. [[Le sionisme reste un choix très minoritaire.]]',
      textAt: 1.6, hlAt: 4.6, source: 'JewishGen · Encyclopaedia Judaica', sourceAt: 4.4, countAt: 0.3, countDur: 3.0,
      cam: { lon: 32.5, lat: 40.0, w: 0.56, pitch: 32, bearing: -4 },
      camEnd: { lon: 32.8, lat: 39.8, w: 0.52, pitch: 36, bearing: 2 },
    },
    {
      id: 'fin', type: 'outro', dur: 7.0, fly: 1.4, hitAt: 1.0,
      eyebrow: 'De 1881 à 1914',
      lines: ['Ils fuient l’Europe,', 'presque tous', 'vers l’Amérique.'],
      cam: { lon: 10.0, lat: 47.0, w: 1.0, pitch: 26, bearing: 0 },
    },
  ];

  const markers = [];
  // l'émancipation, d'ouest en est
  [['France · 1791', 2.35, 48.86, [-1, -1]], ['Pays-Bas · 1796', 4.9, 52.37, [-1, -1]], ['Royaume-Uni · 1858', -0.13, 51.51, [-1, 1]],
    ['Autriche-Hongrie · 1867', 16.37, 48.21, [1, 1]], ['Allemagne · 1871', 13.4, 52.52, [1, -1]]].forEach(([label, lon, lat, dir], k) =>
    markers.push({ seg: 'ouest', at: 1.4 + 0.55 * k, label, lon, lat, dir, off: 36, endAt: 10.6 }));
  markers.push({ seg: 'ouest', at: 5.4, label: 'Zone de résidence', lon: 27.5, lat: 50.2, area: true, R: 260, dir: [-1, -1], off: 46, endAt: 10.6 });
  // les pogroms : des foyers qui s'allument
  [['Elisavetgrad · 1881', 32.26, 48.51, [1, -1]], ['Kiev · 1881', 30.52, 50.45, [1, -1]], ['Varsovie · 1881', 21.01, 52.23, [-1, -1]],
    ['Kichinev · 1903', 28.86, 47.01, [-1, 1]], ['Odessa · 1905', 30.73, 46.48, [1, 1]], ['Bialystok · 1906', 23.16, 53.13, [-1, -1]]].forEach(([label, lon, lat, dir], k) =>
    markers.push({ seg: 'est', at: 1.2 + 0.6 * k, label, lon, lat, dir, area: true, R: 70, off: 34, endAt: 11.6 }));
  markers.push({ seg: 'antisemitisme', at: 1.6, label: 'Paris · 1894', lon: 2.35, lat: 48.86, dir: [-1, -1], off: 40, endAt: 10.8 });
  markers.push({ seg: 'antisemitisme', at: 4.0, label: 'Vienne · 1897', lon: 16.37, lat: 48.21, dir: [1, -1], off: 40, endAt: 10.8 });
  markers.push({ seg: 'exode', at: 5.6, label: 'New York', lon: -74.0, lat: 40.71, dir: [-1, -1], off: 40, endAt: 12.4 });
  markers.push({ seg: 'exode', at: 6.4, label: 'Buenos Aires', lon: -58.38, lat: -34.6, dir: [1, 1], off: 40, endAt: 12.4 });
  markers.push({ seg: 'palestine', at: 2.2, label: 'Palestine', lon: 34.85, lat: 31.9, area: true, R: 60, dir: [1, 1], off: 40, endAt: 11.0 });

  // les départs : de la zone de résidence et de Roumanie vers les Amériques, Londres et la Palestine
  const PALE = [[30.73, 46.48], [28.86, 47.01], [30.52, 50.45], [21.01, 52.23], [25.28, 54.69], [23.16, 53.13], [27.59, 47.16], [27.56, 53.9]];
  const fl = (to, n, at, extra = {}) => ({ seg: 'exode', at, dur: 5.2, n, from: PALE, to, travel: [3.4, 5.0], spread: 0.6, spreadTo: 0.8, bend: 0.14, cold: true, heat: 0.3, endAt: 12.4, ...extra });
  const flows = [
    fl([-74.0, 40.71], 260, 0.2, { R: 260 }),
    fl([-73.57, 45.5], 10, 0.5),
    fl([-0.13, 51.51], 20, 0.4, { travel: [2.0, 3.0] }),
    fl([-58.38, -34.6], 12, 0.6, { travel: [4.4, 5.6] }),
  ];
  // vers la Palestine : un mince filet, pendant le chiffre
  flows.push({ ...fl([34.85, 31.95], 14, 0.9, { travel: [2.2, 3.0] }), seg: 'palestine', dur: 4.0, endAt: 11.0 });

  root.TL = root.buildTL({
    name: 'europe-1881-1914',
    seed: 1881,
    segments,
    markers,
    flows,
    hud: { label: ['Sion', 'Chapitre 2 · L’Europe en feu'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: null },
  });
})(typeof window !== 'undefined' ? window : globalThis);
