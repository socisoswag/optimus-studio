/*
 * Séquence « Les aliyas » (chapitre 5), ≈ 50 s.
 *
 * Les vagues d'immigration juive en Palestine, 1882 — 1939. Chiffres retenus (fourchettes des
 * encyclopédies, Jewish Virtual Library, Encyclopaedia Judaica) :
 *   - 1882 — 1903 : 20 000 à 35 000 ; 1904 — 1914 : 35 000 à 40 000 (Russie, Roumanie) ;
 *   - 1919 — 1923 : environ 40 000 ; 1924 — 1929 : environ 82 000 (Russie, Pologne) ;
 *   - 1929 — 1939 : environ 250 000 (Pologne, Allemagne, Autriche ; fuite devant le nazisme) ;
 *   - 1936 : grande révolte arabe contre le mandat et l'immigration ;
 *   - 1945, Village Statistics (estimation du gouvernement mandataire) : 553 600 Juifs sur
 *     1 764 520 habitants.
 * Les flux sont dessinés de quelques grandes villes vers la Palestine (trajets symboliques).
 */
(function (root) {
  const PAL = [34.85, 32.0];
  const segments = [
    {
      id: 'aliyas', type: 'beat', dur: 6.5, hitAt: 1.0, reveal: 'focus', rgb: 10,
      kicker: '1882 — 1939', word: 'Aliyas',
      sub: 'Les « montées » : les vagues d’immigration juive en Palestine, portées par le mouvement sioniste.', subAt: 1.4,
      cam: { lon: 28.5, lat: 39.5, w: 0.9, pitch: 26, bearing: -6 },
      camEnd: { lon: 28.5, lat: 39.0, w: 0.84, pitch: 28, bearing: -2 },
    },
    {
      id: 'premieres', type: 'cap', dur: 10.5, fly: 1.2, anchor: [330, -60], textW: 860,
      kicker: '1882 — 1914 · Russie, Roumanie', title: 'Les premières colonies',
      text: 'Fuyant les pogroms, 55 000 à 75 000 personnes arrivent en deux vagues. Elles fondent des colonies agricoles [[sur des terres achetées à de grands propriétaires.]]',
      cam: { lon: 28.5, lat: 39.0, w: 0.84, pitch: 28, bearing: -2 }, camEnd: { lon: 29.0, lat: 38.5, w: 0.8, pitch: 30, bearing: 2 },
    },
    {
      id: 'mandat', type: 'cap', dur: 10.5, fly: 1.0, anchor: [330, -60], textW: 860,
      kicker: '1919 — 1929 · Pologne, Russie', title: 'Sous le mandat britannique',
      text: 'Après la déclaration Balfour, environ 120 000 arrivées en dix ans. Les terres achetées sont vidées de leurs paysans : [[les métayers palestiniens qui les cultivaient doivent partir.]]',
      cam: { lon: 29.0, lat: 38.5, w: 0.8, pitch: 30, bearing: 2 }, camEnd: { lon: 27.0, lat: 39.5, w: 0.86, pitch: 28, bearing: -2 },
    },
    {
      id: 'trente', type: 'cap', dur: 10.5, fly: 1.0, anchor: [330, -60], textW: 860,
      kicker: '1929 — 1939 · Pologne, Allemagne, Autriche', title: 'Fuir le nazisme',
      text: 'Environ 250 000 arrivées, dont beaucoup fuient l’Allemagne nazie. [[En 1936, la grande révolte arabe éclate]] contre le mandat et l’immigration.',
      cam: { lon: 27.0, lat: 39.5, w: 0.86, pitch: 28, bearing: -2 }, camEnd: { lon: 28.0, lat: 38.5, w: 0.8, pitch: 30, bearing: 2 },
    },
    {
      id: 'population', type: 'stat', dur: 11.0, fly: 1.6, layout: 'L', anchor: [470, 30],
      ghost: '1945', kicker: 'Palestine · 1945', value: 553600, label: 'Juifs en Palestine',
      text: 'Sur 1 764 520 habitants : [[moins d’un tiers de la population]], trois ans avant la création d’Israël.',
      textAt: 1.6, hlAt: 5.0, source: 'Village Statistics, 1945 (estimation du gouvernement mandataire)', sourceAt: 4.6, countAt: 0.3, countDur: 3.4,
      cam: { lon: 33.6, lat: 31.8, w: 0.11, pitch: 38, bearing: -4 }, camEnd: { lon: 33.7, lat: 31.8, w: 0.1, pitch: 42, bearing: 2 },
    },
    {
      id: 'fin', type: 'outro', dur: 8.0, fly: 1.4, hitAt: 1.0,
      eyebrow: '1882 — 1948',
      lines: ['1882 : une minorité.', '1948 : un État.'],
      cam: { lon: 33.8, lat: 31.8, w: 0.13, pitch: 34, bearing: 0 }, camEnd: { lon: 33.8, lat: 31.8, w: 0.135, pitch: 32, bearing: 3 },
    },
  ];
  const C = { odessa: [30.73, 46.48], kichinev: [28.86, 47.01], iasi: [27.59, 47.16], varsovie: [21.01, 52.23], lodz: [19.46, 51.76],
    vilnius: [25.28, 54.69], berlin: [13.4, 52.52], vienne: [16.37, 48.21], kiev: [30.52, 50.45] };
  const fl = (seg, at, n, from, travel) => ({ seg, cold: true, heat: 0.3, at, dur: 5.0, n, from: from.map((k) => C[k]), to: PAL, travel, bend: 0.12, spread: 0.4, spreadTo: 0.3, R: 120 });
  const flows = [
    fl('premieres', 1.6, 90, ['odessa', 'kichinev', 'iasi'], [3.6, 5.0]),
    fl('premieres', 3.2, 70, ['odessa', 'kiev', 'kichinev'], [3.6, 5.0]),
    fl('mandat', 1.4, 90, ['varsovie', 'vilnius', 'kiev'], [3.8, 5.2]),
    fl('mandat', 2.8, 110, ['varsovie', 'lodz', 'odessa'], [3.8, 5.2]),
    fl('trente', 1.2, 150, ['varsovie', 'lodz', 'vilnius'], [3.8, 5.4]),
    fl('trente', 2.2, 150, ['berlin', 'vienne'], [3.4, 5.0]),
  ];
  const markers = [
    { seg: 'premieres', at: 2.0, label: 'Odessa', lon: 30.73, lat: 46.48, dir: [1, -1], endAt: 10.8 },
    { seg: 'mandat', at: 1.8, label: 'Varsovie', lon: 21.01, lat: 52.23, dir: [-1, -1], endAt: 10.8 },
    { seg: 'trente', at: 1.6, label: 'Berlin', lon: 13.4, lat: 52.52, dir: [-1, -1], endAt: 10.8 },
    { seg: 'trente', at: 2.4, label: 'Vienne', lon: 16.37, lat: 48.21, dir: [-1, 1], endAt: 10.8 },
  ];
  const clock = [
    { seg: 'premieres', at: 0.2, text: '1882 — 1914' }, { seg: 'mandat', at: 0.2, text: '1919 — 1929' },
    { seg: 'trente', at: 0.2, text: '1929 — 1939' }, { seg: 'population', at: 0.2, text: '1945' }, { seg: 'fin', at: 0.2, text: '' },
  ];

  root.TL = root.buildTL({
    name: 'aliyas',
    seed: 1882,
    segments,
    flows,
    markers,
    clock,
    hud: { label: ['Sion', 'Chapitre 5 · Les aliyas'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: null },
  });
})(typeof window !== 'undefined' ? window : globalThis);
