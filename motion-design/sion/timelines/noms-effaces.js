/*
 * Séquence « Les noms effacés » (chapitre 34), ≈ 1 min 15.
 *
 * Faits retenus :
 *   - la Commission gouvernementale des noms est créée par David Ben Gourion le 7 juillet 1949 ; elle
 *     donne aux lieux des noms hébreux, de préférence tirés de la Bible et de l'Antiquité. Selon Meron
 *     Benvenisti (Sacred Landscape, University of California Press, 2000), les noms arabes de plus de
 *     9 000 villages, ruines et sites naturels sont remplacés ;
 *   - al-Majdal, prise en novembre 1948, devient Migdal Gad puis Ashkelon ; ses derniers habitants sont
 *     expulsés vers Gaza en 1950 (B. Morris, 1948 and After) ; Isdud, vidée en 1948, laisse place à
 *     Ashdod, fondée en 1956 ; Bayt Jibrin, Saffuriyya, Zir'in et al-Khalisa : Beit Guvrin, Tzippori,
 *     Yizre'el et Kiryat Shmona, fondées sur leurs terres en 1948 et 1949 ;
 *   - Ayn Hawd : habitants chassés en 1948, maisons transformées en village d'artistes (Ein Hod, 1953) ;
 *     des familles s'installent sur la colline voisine, Ayn Hawd al-Jadida, longtemps non reconnue ;
 *   - Lubya, vidée en juillet 1948 : la forêt d'Afrique du Sud du Fonds national juif est plantée sur ses
 *     ruines ; Imwas, Yalu et Beit Nuba, rasées en juin 1967 : le Canada Park, aménagé dans les années
 *     1970 par le Fonds national juif avec des dons canadiens ;
 *   - Lifta, à l'entrée de Jérusalem : vidée en 1948, ses maisons sont restées debout, inhabitées ;
 *   - 418 villages dépeuplés en 1948 (Walid Khalidi, All That Remains, 1992), comme dans nakba-1948.js.
 */
(function (root) {
  const segments = [
    {
      id: 'effacer', type: 'beat', dur: 6.2, hitAt: 1.0, reveal: 'focus', rgb: 10,
      kicker: 'Depuis 1948', word: 'Effacer',
      sub: 'Les villages vidés, puis leurs noms.', subAt: 1.6,
      cam: { lon: 35.0, lat: 31.9, w: 0.06, pitch: 40, bearing: -6 },
      camEnd: { lon: 35.0, lat: 31.9, w: 0.05, pitch: 44, bearing: 2 },
    },
    {
      id: 'commission', type: 'stat', dur: 11.0, fly: 1.2, layout: 'L', anchor: [470, 30],
      ghost: '1949', kicker: 'À partir de 1949 · Commission gouvernementale des noms', pre: 'Plus de', value: 9000, step: 23, label: 'noms arabes remplacés',
      text: 'Villages, ruines, collines et sources reçoivent des noms hébreux, [[souvent tirés de la Bible.]]',
      textAt: 1.6, hlAt: 5.0, source: 'Meron Benvenisti, Sacred Landscape, 2000', sourceAt: 4.6, countAt: 0.3, countDur: 3.2,
      cam: { lon: 34.75, lat: 31.95, w: 0.065, pitch: 38, bearing: -4 },
      camEnd: { lon: 34.8, lat: 31.95, w: 0.058, pitch: 42, bearing: 2 },
    },
    {
      id: 'sud', type: 'cap', dur: 11.0, fly: 1.4, anchor: [330, -60], textW: 860,
      kicker: 'Plaine côtière · de 1948 à 1956', title: 'Des noms remplacés',
      text: 'Isdud laisse place à Ashdod, al-Majdal devient Ashkelon. [[Les derniers habitants d’al-Majdal sont expulsés vers Gaza en 1950.]]',
      cam: { lon: 34.8, lat: 31.69, w: 0.0125, pitch: 46, bearing: -8 },
      camEnd: { lon: 34.81, lat: 31.69, w: 0.0113, pitch: 50, bearing: 0 },
    },
    {
      id: 'nord', type: 'cap', dur: 11.0, fly: 1.6, anchor: [330, -60], textW: 860,
      kicker: 'Galilée · 1948 et 1949', title: 'D’autres villages, d’autres noms',
      text: 'Saffuriyya devient Tzippori, Zir’in devient Yizre’el, al-Khalisa devient Kiryat Shmona. [[Des localités israéliennes s’installent sur les terres des villages vidés.]]',
      cam: { lon: 35.1, lat: 32.86, w: 0.05, pitch: 44, bearing: -6 },
      camEnd: { lon: 35.11, lat: 32.86, w: 0.046, pitch: 48, bearing: 2 },
    },
    {
      id: 'einhod', type: 'cap', dur: 10.5, fly: 1.4, anchor: [330, -60], textW: 860,
      kicker: 'Ayn Hawd · 1953', title: 'Un village d’artistes',
      text: 'Ses habitants chassés en 1948, les maisons deviennent Ein Hod, un village d’artistes israéliens. [[Quelques familles reconstruisent sur la colline voisine, un village longtemps non reconnu.]]',
      cam: { lon: 34.965, lat: 32.705, w: 0.0042, pitch: 50, bearing: -10 },
      camEnd: { lon: 34.967, lat: 32.705, w: 0.0036, pitch: 54, bearing: 0 },
    },
    {
      id: 'forets', type: 'cap', dur: 11.0, fly: 1.6, anchor: [330, -60], textW: 860,
      kicker: 'Imwas, Yalu, Beit Nuba · 1967', title: 'Des forêts sur les ruines',
      text: 'Le Fonds national juif plante des forêts et des parcs : la forêt d’Afrique du Sud sur Lubya, [[le Canada Park sur Imwas, Yalu et Beit Nuba, rasés en 1967.]]',
      cam: { lon: 34.985, lat: 31.85, w: 0.0075, pitch: 48, bearing: -6 },
      camEnd: { lon: 34.988, lat: 31.85, w: 0.0066, pitch: 52, bearing: 2 },
    },
    {
      id: 'lifta', type: 'cap', dur: 9.6, fly: 1.4, anchor: [330, -60], textW: 860,
      kicker: 'Lifta · entrée de Jérusalem', title: 'Debout, mais vide',
      text: 'Ses maisons de pierre dominent l’autoroute de Jérusalem. [[L’un des rares villages vidés en 1948 ni détruits ni réhabités.]]',
      cam: { lon: 35.19, lat: 31.797, w: 0.0032, pitch: 52, bearing: -8 },
      camEnd: { lon: 35.191, lat: 31.797, w: 0.0027, pitch: 56, bearing: 2 },
    },
    {
      id: 'fin', type: 'outro', dur: 6.8, fly: 1.4, hitAt: 1.0,
      eyebrow: 'Depuis 1948',
      lines: ['418 villages vidés,', 'plus de 9 000 noms', 'remplacés.'],
      cam: { lon: 35.05, lat: 31.9, w: 0.08, pitch: 30, bearing: 0 },
    },
  ];

  // ancien nom (olive) barré, nouveau nom (pierre) au-dessus ; dir -1 : étiquette à gauche du point
  const R = (seg, at, from, to, lon, lat, dir = 1, until) => ({ seg, at, from, to, lon, lat, dir, strike: 1.3, gap: 0.45, until });
  const renames = [
    R('sud', 1.4, 'Isdud', 'Ashdod', 34.665, 31.755, 1, 11.2),
    R('sud', 2.6, 'al-Majdal', 'Ashkelon', 34.575, 31.665, -1, 11.2),
    R('sud', 3.8, 'Bayt Jibrin', 'Beit Guvrin', 34.895, 31.61, 1, 11.2),
    R('nord', 1.6, 'Saffuriyya', 'Tzippori', 35.279, 32.752, 1, 11.2),
    R('nord', 2.8, 'Zir’in', 'Yizre’el', 35.326, 32.557, 1, 11.2),
    R('nord', 4.0, 'al-Khalisa', 'Kiryat Shmona', 35.572, 33.208, -1, 11.2),
    R('einhod', 1.6, 'Ayn Hawd', 'Ein Hod', 34.982, 32.698, 1, 10.7),
    R('forets', 1.6, 'Imwas', 'Canada Park', 34.99, 31.84, -1, 11.2),
  ];
  const markers = [
    { seg: 'einhod', at: 5.2, label: 'Ayn Hawd al-Jadida', lon: 34.995, lat: 32.693, dir: [1, 1], off: 44, endAt: 10.4 },
    { seg: 'forets', at: 3.2, label: 'Yalu', lon: 35.025, lat: 31.835, erase: true, ghost: true, dir: [1, 1], off: 40, endAt: 11.0 },
    { seg: 'forets', at: 3.8, label: 'Beit Nuba', lon: 35.05, lat: 31.86, erase: true, ghost: true, dir: [1, -1], off: 40, endAt: 11.0 },
    { seg: 'lifta', at: 1.6, label: 'Lifta', lon: 35.1965, lat: 31.7955, dir: [1, -1], off: 46, endAt: 9.6 },
  ];

  root.TL = root.buildTL({
    name: 'noms-effaces',
    seed: 1949,
    segments,
    renames,
    markers,
    hud: { label: ['Sion', 'Chapitre 34 · L’effacement culturel'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: null },
  });

  // bruitages : le nom tapé à la machine, le trait de plume qui le barre
  const F = [];
  TL.renames.forEach((r) => {
    for (let j = 0; j < r.from.length; j++) if (r.from[j] !== ' ') F.push({ t: +(r.t + (j / r.from.length) * 0.45).toFixed(3), kind: 'key', gain: 0.45, v: (j * 7) % 5 });
    F.push({ t: +(r.t + r.strike).toFixed(3), kind: 'cut', dur: 0.35, gain: 0.7 });
    for (let j = 0; j < r.to.length; j++) if (r.to[j] !== ' ') F.push({ t: +(r.t + r.strike + r.gap + (j / r.to.length) * 0.45).toFixed(3), kind: 'key', gain: 0.55, v: (j * 3) % 5 });
  });
  TL.sound = { ...TL.sound, foley: F.sort((a, b) => a.t - b.t) };
})(typeof window !== 'undefined' ? window : globalThis);
