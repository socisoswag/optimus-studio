/*
 * Séquence « Sion, le mot » (chapitre 1), ≈ 55 s : d'une colline de Jérusalem à un programme politique.
 *
 * Textes et faits retenus :
 *   - 2 Samuel 5, 7 (Bible, traduction Louis Segond, 1910, domaine public) : « Mais David s'empara de
 *     la forteresse de Sion : c'est la cité de David. » La cité de David est l'éperon au sud de
 *     l'actuelle esplanade des Mosquées ; depuis l'Antiquité tardive, le nom de « mont Sion » désigne la
 *     colline voisine, au sud-ouest (en arabe, Jabal Sahyoun) ;
 *   - Psaume 137, 1 (Segond) : « Sur les bords des fleuves de Babylone, nous étions assis et nous
 *     pleurions, en nous souvenant de Sion. » Exil à Babylone après la prise de Jérusalem, en 587 ou
 *     586 avant notre ère ;
 *   - le repas de la Pâque juive se termine par « l'an prochain à Jérusalem » ;
 *   - 1890, Vienne : Nathan Birnbaum forge le mot « sionisme » (Zionismus) dans sa revue
 *     Selbst-Emancipation.
 * Tracés de Jérusalem approchés (repris de jerusalem.js) ; cité de David dessinée d'après les plans
 * archéologiques publiés (éperon de l'Ophel jusqu'à la piscine de Siloé).
 */
(function (root) {
  const OC = [35.2318, 31.7775];
  const segments = [
    {
      id: 'sion', type: 'beat', dur: 6.6, hitAt: 1.0, reveal: 'focus', rgb: 10,
      kicker: 'Jérusalem · Al-Quds', word: 'Sion',
      sub: 'Un mot, un mythe, un monde.', subAt: 1.6,
      cam: { lon: OC[0] + 0.001, lat: OC[1] - 0.0045, w: 0.0042, pitch: 46, bearing: -10 },
      camEnd: { lon: OC[0] + 0.001, lat: OC[1] - 0.0035, w: 0.003, pitch: 50, bearing: -4 },
    },
    {
      id: 'forteresse', type: 'cap', dur: 12.5, fly: 1.5, anchor: [330, -60], textW: 860,
      kicker: 'La Bible · deuxième livre de Samuel', title: 'La forteresse de Sion',
      text: '« Mais David s’empara de la forteresse de Sion : c’est [[la cité de David]]. » Le nom glissera plus tard vers la colline voisine, l’actuel mont Sion.',
      cam: { lon: 35.2318, lat: 31.7738, w: 0.00085, pitch: 52, bearing: -14 },
      camEnd: { lon: 35.2322, lat: 31.7738, w: 0.00072, pitch: 56, bearing: -4 },
    },
    {
      id: 'exil', type: 'cap', dur: 12.0, fly: 2.4, anchor: [330, -60], textW: 860,
      kicker: 'Babylone · vers 586 avant notre ère', title: 'Une prière',
      text: '« Sur les bords des fleuves de Babylone, nous étions assis et nous pleurions, [[en nous souvenant de Sion]]. » Psaume 137.',
      cam: { lon: 40.4, lat: 32.4, w: 0.29, pitch: 34, bearing: -4 },
      camEnd: { lon: 40.5, lat: 32.4, w: 0.27, pitch: 38, bearing: 3 },
    },
    {
      id: 'siecles', type: 'cap', dur: 11.0, fly: 1.8, anchor: [330, -60], textW: 860,
      kicker: 'Pendant des siècles · la diaspora', title: 'Un mot d’espérance',
      text: 'Pour les Juifs dispersés, Sion reste une espérance religieuse. Chaque année, le repas de la Pâque juive se termine par [[« l’an prochain à Jérusalem »]].',
      cam: { lon: 11.0, lat: 44.0, w: 0.98, pitch: 28, bearing: 0 },
      camEnd: { lon: 10.5, lat: 44.5, w: 0.9, pitch: 32, bearing: 3 },
    },
    {
      id: 'mot', type: 'cap', dur: 11.5, fly: 1.6, anchor: [330, -60], textW: 860,
      kicker: 'Vienne · 1890', title: 'Sionisme',
      text: 'Le journaliste viennois Nathan Birnbaum forge le mot. [[Une espérance religieuse devient un projet politique.]]',
      cam: { lon: 15.4, lat: 47.2, w: 0.36, pitch: 40, bearing: -8 },
      camEnd: { lon: 15.6, lat: 47.4, w: 0.31, pitch: 44, bearing: 2 },
    },
    {
      id: 'fin', type: 'outro', dur: 7.0, fly: 1.6, hitAt: 1.0,
      eyebrow: 'De la Bible à 1890',
      lines: ['D’une colline', 'de Jérusalem', 'à un projet politique.'],
      cam: { lon: 24.0, lat: 40.5, w: 0.7, pitch: 26, bearing: 0 },
    },
  ];

  // ---- Jérusalem : les remparts de la vieille ville, l'esplanade, la cité de David, le mont Sion
  const OLD_CITY = [[35.2276, 31.7766], [35.2268, 31.7788], [35.2271, 31.7800], [35.2302, 31.7816], [35.2331, 31.7820], [35.2362, 31.7820], [35.2368, 31.7809],
    [35.2373, 31.7787], [35.2372, 31.7754], [35.2344, 31.7757], [35.2338, 31.7743], [35.2297, 31.7720], [35.2283, 31.7722]];
  const HARAM = [[35.2344, 31.7757], [35.2338, 31.7801], [35.2370, 31.7799], [35.2372, 31.7754]];
  const DAVID = [[35.2347, 31.7754], [35.2367, 31.7752], [35.2364, 31.7734], [35.2357, 31.7716], [35.2350, 31.7704], [35.2341, 31.7707], [35.2339, 31.7731]];
  const plans = [], markers = [];
  plans.push({ seg: 'sion', at: 0.4, dur: 2.4, path: OLD_CITY, closed: true, style: 'wall', until: 20.5 });
  plans.push({ seg: 'forteresse', at: 0.4, dur: 1.2, style: 'grid', bbox: [35.2255, 31.7680, 35.2400, 31.7835], step: 25, until: 12.8 });
  plans.push({ seg: 'forteresse', at: 0.8, dur: 1.4, path: HARAM, closed: true, style: 'sacred', fill: 0.05, label: 'Esplanade', labelAt: [35.2357, 31.7793], until: 12.8 });
  plans.push({ seg: 'forteresse', at: 1.6, dur: 2.2, path: DAVID, closed: true, style: 'sacred', fill: 0.16, label: 'Cité de David', labelAt: [35.2353, 31.7728], big: true, until: 12.8 });
  markers.push({ seg: 'forteresse', at: 6.6, label: 'Mont Sion · Jabal Sahyoun', lon: 35.2290, lat: 31.7716, dir: [-1, 1], off: 50, endAt: 12.6 });

  // ---- l'exil : de Jérusalem à Babylone
  const flows = [{ seg: 'exil', at: 1.2, from: [35.23, 31.78], to: [44.42, 32.54], n: 110, dur: 4.0, travel: [2.6, 3.6], spread: 0.08, spreadTo: 0.25, bend: 0.16, cold: true }];
  markers.push({ seg: 'exil', at: 0.9, label: 'Jérusalem', lon: 35.23, lat: 31.78, dir: [-1, -1], off: 40, endAt: 12.2 });
  markers.push({ seg: 'exil', at: 4.6, label: 'Babylone', lon: 44.42, lat: 32.54, dir: [1, -1], off: 40, endAt: 12.2 });

  // ---- des siècles de diaspora : quelques grandes communautés juives de l'histoire
  [['Rome', 12.5, 41.9, [-1, -1]], ['Thessalonique', 22.94, 40.64, [1, -1]], ['Prague', 14.42, 50.08, [1, -1]],
    ['Amsterdam', 4.9, 52.37, [1, -1]]].forEach(([label, lon, lat, dir], k) =>
    markers.push({ seg: 'siecles', at: 1.4 + 0.45 * k, label, lon, lat, dir, off: 34, endAt: 11.2 }));
  markers.push({ seg: 'mot', at: 1.0, label: 'Vienne', lon: 16.37, lat: 48.21, dir: [1, -1], off: 46, endAt: 11.6 });

  root.TL = root.buildTL({
    name: 'sion-le-mot',
    seed: 1890,
    segments,
    relief: { fadeBelow: [0.0022, 0.0034] },  // le premier plan sur Jérusalem garde le relief fin ; la forteresse, trop près, sans
    plans,
    markers,
    flows,
    cities: root.CITIES.filter((c) => c[0] !== 'Rishon LeZion'),
    hud: { label: ['Sion', 'Chapitre 1 · Un mot, un mythe, un monde'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: null },
  });
})(typeof window !== 'undefined' ? window : globalThis);
