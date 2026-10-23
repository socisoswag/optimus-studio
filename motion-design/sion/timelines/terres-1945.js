/*
 * Carte « La terre en 1945 » (chapitre 11), ≈ 31 s. Modèle : timelines/camps.js.
 *
 * Part des terres en propriété juive, par sous-district, au 1er avril 1945 : Nations unies, carte « Palestine : Land
 * ownership by sub-districts (1945) », août 1950 (comité ad hoc sur la question de Palestine), d'après les Village
 * Statistics 1945 du gouvernement de la Palestine (repris dans « Sous-districts de la Palestine mandataire »).
 * Ensemble du pays : environ 1,5 million de dounams sur 26,3 millions, soit moins de 6 %.
 * 1947 : 56 % du territoire attribués à l'État juif (plan de partage) ; 1949 : 78 % (lignes d'armistice).
 * Une grappe de lumières par sous-district, posée sur son chef-lieu, de surface proportionnelle à la part juive (pas de
 * frontières de sous-district à l'écran, les grappes disent la proportion, pas l'emplacement exact des terres).
 */
(function (root) {
  const segments = [
    {
      id: 'plaine', type: 'cap', dur: 13.0, fly: 1.4, anchor: [330, -60], textW: 860,
      kicker: 'Nations unies, 1950 · d’après les statistiques de 1945', title: 'La terre en 1945',
      text: 'Part des terres en propriété juive, sous-district par sous-district. Les achats se concentrent [[dans la plaine côtière et les vallées du nord.]]',
      cam: { lon: 35.0, lat: 32.36, w: 0.058, pitch: 34, bearing: -4 },
      camEnd: { lon: 35.02, lat: 32.38, w: 0.054, pitch: 38, bearing: 2 },
    },
    {
      id: 'collines', type: 'cap', dur: 10.0, fly: 1.6, anchor: [330, -60], textW: 860,
      kicker: 'Les collines et le sud', title: 'Moins de 1 %',
      text: 'À Jénine, Naplouse, Ramallah, Hébron et Beersheba, [[presque toute la terre est arabe, ou publique.]]',
      cam: { lon: 34.92, lat: 31.72, w: 0.066, pitch: 32, bearing: -2 },
      camEnd: { lon: 34.94, lat: 31.73, w: 0.062, pitch: 36, bearing: 3 },
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
    seg: 'plaine', at: 2.2 + 0.6 * i, label: nom, num: String(p), lon, lat, dir, off: 52, area: true, R: 1, endAt: 13.2,
  }));
  const COLLINES = [
    ['Jénine', 35.3, 32.46, '<1', [1, -1]], ['Naplouse', 35.26, 32.22, '<1', [1, -1]], ['Ramallah', 35.2, 31.9, '<1', [1, 1]],
    ['Jérusalem', 35.22, 31.78, '2', [1, 1]], ['Gaza', 34.46, 31.5, '4', [-1, 1]], ['Hébron', 35.1, 31.53, '<1', [1, 1]],
    ['Beersheba', 34.79, 31.25, '<1', [-1, 1]],
  ];
  COLLINES.forEach(([nom, lon, lat, p, dir], i) => markers.push({
    seg: 'collines', at: 2.2 + 0.55 * i, label: nom, num: p, lon, lat, dir, off: 48, area: true, R: 1, endAt: 10.2,
  }));
  // la donnée elle-même : une grappe de lumières par sous-district, de surface proportionnelle à la part juive
  const disque = (lon, lat, r) => Array.from({ length: 18 }, (_, k) => [lon + r * Math.cos((k / 18) * 2 * Math.PI), lat + 0.86 * r * Math.sin((k / 18) * 2 * Math.PI)]);
  const lights = [], TERRE = { Jaffa: 0.1, 'Haïfa': 0.07, Acre: 0.06, Gaza: 0.06 }; // villes de la côte : grappe poussée vers l'intérieur
  PLAINE.forEach(([nom, lon, lat, p], i) => lights.push({ seg: 'plaine', at: 2.2 + 0.6 * i, poly: disque(lon + (TERRE[nom] || 0), lat, 0.016 * Math.sqrt(p)), n: 14 * p, until: 23.4 }));
  COLLINES.forEach(([nom, lon, lat, p], i) => lights.push({ seg: 'collines', at: 2.2 + 0.55 * i, poly: disque(lon + (TERRE[nom] || 0), lat, 0.016 * Math.sqrt(p === '<1' ? 0.5 : +p)), n: p === '<1' ? 6 : 14 * +p, until: 10.4 }));
  const clock = [{ seg: 'plaine', at: 0.2, text: '1er avril 1945' }, { seg: 'collines', at: 0.2, text: '1er avril 1945' }, { seg: 'fin', at: 0.2, text: '' }];

  root.TL = root.buildTL({
    name: 'terres-1945',
    seed: 1945,
    segments,
    markers,
    lights,
    clock,
    cities: [],
    hud: { label: ['Sion', 'Chapitre 11 · La terre en 1945'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: null },
  });
})(typeof window !== 'undefined' ? window : globalThis);
