/*
 * Séquence « Le découpage » : le plan de partage de l'ONU (chapitre 12), ≈ 1 min 40.
 *
 * Frontières : carte ONU n° 103.1(b), calée sur son quadrillage et vectorisée (data/partage.js,
 * tools/prep_partage.py) ; relief : SRTM (NASA). Faits et chiffres retenus :
 *   - résolution 181 (II) de l'Assemblée générale, Lake Success, 29 novembre 1947 : 33 pour,
 *     13 contre, 10 abstentions, 1 absent (Siam) ; la majorité des deux tiers est atteinte ;
 *   - Palestine fin 1946 : environ 1 846 000 habitants, dont 1 203 000 Arabes et 608 000 Juifs,
 *     un tiers de la population (rapport de l'UNSCOP, 3 septembre 1947) ;
 *   - le plan donne environ 56 % du territoire à l'État juif, 43 % à l'État arabe ; Jérusalem et
 *     Bethléem forment un corpus separatum sous régime international (55 %, 44 % et 0,7 % mesurés
 *     sur la carte de l'ONU) ; chaque État est fait de trois morceaux qui se touchent en deux points
 *     (près d'Afula et près d'Isdud) ; Jaffa, ville arabe, est une enclave de l'État arabe ;
 *   - dans l'État juif prévu : environ 498 000 Juifs et 407 000 Arabes, plus environ 90 000 Bédouins
 *     (UNSCOP, chiffres de 1945) ;
 *   - les Juifs possèdent environ 7 % des terres (S. Aly, S. Feldman, K. Shikaki, Arabs and Israelis,
 *     2013 ; environ 6 % du territoire selon les Village Statistics de 1945) ;
 *   - l'Agence juive accepte le plan, le Haut Comité arabe et les États arabes le rejettent ; la guerre
 *     civile commence le 30 novembre 1947.
 * Couleurs : olive = terres et localités arabes ; encre froide = territoire attribué à l'État juif,
 * localités juives ; pierre hachurée = Jérusalem ; vermillon = la lame. Aucun drapeau.
 * La dernière image est le cadre d'ouverture de « 1948, la Nakba » : on enchaîne sans coupe visible.
 */
(function (root) {
  const NAKBA = { lon: 35.1, lat: 31.9, w: 0.16, pitch: 30, bearing: -4 }; // première image de nakba-1948
  const segments = [
    {
      id: 'vote', type: 'ballot', dur: 12.5, hitAt: 0.6, anchor: [0, 40],
      kicker: 'Assemblée générale des Nations unies · Lake Success',
      title: 'RÉSOLUTION 181 (II)', titleAt: 0.8, cps: 11,
      sub: '29 novembre 1947 · plan de partage de la Palestine', subAt: 2.7,
      tallyAt: 3.0, result: 'Adoptée à la majorité des deux tiers.', resultAt: 9.2,
      cam: { lon: 4, lat: 27, w: 4.2, pitch: 10, bearing: 0 }, camEnd: { lon: 10, lat: 28, w: 3.85, pitch: 14, bearing: 1 },
    },
    {
      id: 'terre', type: 'cap', dur: 11.5, fly: 2.4, anchor: [360, 50], textW: 860,
      kicker: '1947 · Palestine sous mandat britannique', title: 'Qui vit où',
      text: 'Environ 1,85 million d’habitants : [[deux tiers d’Arabes]], un tiers de Juifs. Chaque point est une localité.',
      legend: [['life', 'Localités arabes'], ['cold', 'Localités juives']], legendAt: 3.6,
      cam: { lon: 35.02, lat: 31.85, w: 0.105, pitch: 34, bearing: -6 }, camEnd: { lon: 35.05, lat: 31.9, w: 0.094, pitch: 38, bearing: 0 },
    },
    {
      id: 'lame', type: 'camera', dur: 11.5, fly: 1.2,
      cam: { lon: 35.25, lat: 32.72, w: 0.066, pitch: 40, bearing: -8 }, camEnd: { lon: 34.98, lat: 31.6, w: 0.088, pitch: 40, bearing: -2 },
    },
    {
      id: 'decoupe', type: 'cap', dur: 9.5, fly: 1.4, anchor: [400, 110], textW: 820, capAt: 0.6,
      kicker: 'Résolution 181 · les frontières', title: 'Six morceaux',
      text: 'Un État arabe et un État juif, chacun [[en trois morceaux]]. Jérusalem à part, sous régime international.',
      cam: { lon: 35.0, lat: 31.75, w: 0.104, pitch: 44, bearing: -18 }, camEnd: { lon: 35.0, lat: 31.75, w: 0.097, pitch: 46, bearing: -12 },
    },
    {
      id: 'nord', type: 'cap', layout: 'small', dur: 6.8, fly: 1.8, anchor: [260, -90], textW: 760,
      kicker: 'Près d’Afula · vallée de Jezreel', title: 'Un seul point',
      text: 'Les deux morceaux de l’État arabe ne se touchent [[que par un point]]. Ceux de l’État juif aussi.',
      cam: { lon: 35.238, lat: 32.632, w: 0.024, pitch: 50, bearing: -10 }, camEnd: { lon: 35.238, lat: 32.632, w: 0.017, pitch: 54, bearing: -2 },
    },
    {
      id: 'sud', type: 'cap', layout: 'small', dur: 6.0, fly: 1.6, anchor: [260, -90], textW: 760,
      kicker: 'Près d’Isdud · plaine côtière', title: 'Le même nœud',
      text: 'Au sud aussi, quatre morceaux se rejoignent [[en un seul point]].',
      cam: { lon: 34.736, lat: 31.7533, w: 0.022, pitch: 50, bearing: 6 }, camEnd: { lon: 34.736, lat: 31.7533, w: 0.016, pitch: 54, bearing: 0 },
    },
    {
      id: 'jaffa', type: 'cap', layout: 'small', dur: 6.2, fly: 1.6, anchor: [240, -80], textW: 760,
      kicker: 'Jaffa', title: 'Une ville enclavée',
      text: 'Jaffa, ville arabe, revient à l’État arabe, mais [[entourée par l’État juif]]. Seule ouverture : la mer.',
      cam: { lon: 34.755, lat: 32.044, w: 0.0085, pitch: 48, bearing: -4 }, camEnd: { lon: 34.755, lat: 32.044, w: 0.0068, pitch: 52, bearing: 2 },
    },
    {
      id: 'chiffre', type: 'stat', layout: 'L', dur: 12.0, fly: 1.8, hitAt: 0.3, anchor: [520, 90], titleMax: 900,
      kicker: 'Résolution 181 · le partage',
      value: 56, unit: '%', countDur: 1.8, label: 'du territoire pour l’État juif',
      text: 'Les Juifs forment [[un tiers de la population]].', textAt: 1.2, hlAt: 2.4,
      grid: { own: 7, given: 56, at: 3.2, gap: 2.2, lines: [['≈ 7 %', 'des terres possédées par des Juifs'], ['56 %', 'du territoire attribué à l’État juif']] },
      source: 'ONU (UNSCOP), 1947 · S. Aly, S. Feldman, K. Shikaki, 2013', sourceAt: 7.0,
      cam: { lon: 35.0, lat: 31.85, w: 0.098, pitch: 36, bearing: -5 }, camEnd: { lon: 35.0, lat: 31.85, w: 0.092, pitch: 38, bearing: 0 },
    },
    {
      id: 'peuple', type: 'cap', dur: 8.6, fly: 1.4, anchor: [330, 80], textW: 900,
      kicker: 'Dans l’État juif prévu', title: '400 000 Arabes',
      text: 'Environ 500 000 Juifs et [[plus de 400 000 Arabes]] vivent sur le territoire attribué à l’État juif (estimations de l’ONU, 1947).',
      cam: { lon: 35.02, lat: 32.35, w: 0.07, pitch: 40, bearing: -6 }, camEnd: { lon: 35.02, lat: 32.35, w: 0.064, pitch: 42, bearing: 0 },
    },
    {
      id: 'lendemain', type: 'cap', dur: 10.0, fly: 1.6, anchor: [330, 40], textW: 900, out: 8.6,
      kicker: '29 et 30 novembre 1947', title: 'Le lendemain',
      text: 'L’Agence juive accepte le plan. Le Haut Comité arabe le rejette. Le 30 novembre, [[la guerre civile commence]].',
      cam: { lon: 35.05, lat: 31.85, w: 0.105, pitch: 34, bearing: -6 }, camEnd: { lon: 35.08, lat: 31.9, w: 0.125, pitch: 32, bearing: -4 },
    },
    {
      // raccord : la caméra rejoint la première image de « 1948, la Nakba » et s'y fige
      id: 'raccord', type: 'camera', dur: 3.2, fly: 2.0, hitAt: 99, anchor: [0, 250], cam: NAKBA, camEnd: NAKBA,
    },
  ];

  // ---- minutage de la carte (temps relatifs aux séquences)
  const blade = [
    { seg: 'lame', at: 1.4, dur: 1.5 },            // 0 frontière libanaise → point d'Afula
    { seg: 'lame', at: 2.9, dur: 0.9, rev: true }, // 1 point d'Afula → côte (Acre)
    { seg: 'lame', at: 2.9, dur: 1.0 },            // 2 point d'Afula → Jourdain
    { seg: 'lame', at: 2.9, dur: 2.4 },            // 3 point d'Afula → point d'Isdud
    { seg: 'lame', at: 9.8, dur: 0.6 },            // 4 Jaffa
    { seg: 'lame', at: 8.2, dur: 1.4 },            // 5 Jérusalem
    { seg: 'lame', at: 5.3, dur: 0.45, rev: true },// 6 point d'Isdud → côte
    { seg: 'lame', at: 5.3, dur: 2.6 },            // 7 point d'Isdud → sud-ouest
    { seg: 'lame', at: 5.3, dur: 2.0 },            // 8 point d'Isdud → mer Morte
  ];
  const tint = {
    'arabe-galilee': { seg: 'lame', at: 3.8 }, 'juif-galilee': { seg: 'lame', at: 3.9 },
    'juif-cote': { seg: 'lame', at: 5.8 }, 'arabe-centre': { seg: 'lame', at: 7.3 },
    'arabe-sud': { seg: 'lame', at: 7.9 }, 'juif-neguev': { seg: 'lame', at: 7.9 },
    jerusalem: { seg: 'lame', at: 9.6 }, jaffa: { seg: 'lame', at: 10.4 },
  };
  const labels = [
    { text: 'ÉTAT ARABE', lon: 35.24, lat: 32.1, seg: 'decoupe', at: 2.0, size: 26, tone: 'life' },
    { text: 'ÉTAT JUIF', lon: 34.95, lat: 30.75, seg: 'decoupe', at: 2.7, size: 26, tone: 'cold' },
    { text: 'ÉTAT ARABE', lon: 35.27, lat: 32.88, seg: 'decoupe', at: 3.3, size: 16, tone: 'life' },
    { text: 'ÉTAT ARABE', lon: 34.38, lat: 31.05, seg: 'decoupe', at: 3.6, size: 16, tone: 'life' },
    { text: 'ÉTAT JUIF', lon: 34.86, lat: 32.4, seg: 'decoupe', at: 3.9, size: 16, tone: 'cold' },
    { text: 'ÉTAT JUIF', lon: 35.52, lat: 33.0, seg: 'decoupe', at: 4.2, size: 16, tone: 'cold' },
    { text: 'JÉRUSALEM', lon: 35.24, lat: 31.735, seg: 'decoupe', at: 4.6, size: 17, tone: 'stone' },
    { text: 'RÉGIME INTERNATIONAL', lon: 35.24, lat: 31.665, seg: 'decoupe', at: 5.3, size: 12, tone: 'stone', cps: 26 },
    { text: 'JAFFA · ÉTAT ARABE', lon: 34.756, lat: 32.07, seg: 'jaffa', at: 2.4, size: 18, tone: 'life', free: true, until: 6.3 },
  ].map((l) => ({ until: l.until !== undefined ? l.until : 0, ...l }));
  // les mentions de « decoupe » restent jusqu'à ce que la carte se vide, dans « lendemain »
  const UNTIL_SEG = 'lendemain', UNTIL_AT = 8.4;

  // déclics du dépouillement (le moteur y cale l'allumage des pays) : 57 États, ordre figé
  const rnd = (() => { let a = 181; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let r = Math.imul(a ^ (a >>> 15), 1 | a); r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r; return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; })();
  const VOTE_AT = 4.0, VOTE_DUR = 5.4;
  const ticks = Array.from({ length: 57 }, (_, i) => +(VOTE_DUR * Math.pow((i + 0.3 + 0.5 * rnd()) / 57.5, 0.92)).toFixed(3));

  const partage = {
    land: { seg: 'terre', at: 1.5, dur: 2.6 },
    dotsArabe: { seg: 'terre', at: 3.4, dur: 3.2 },
    dotsJuif: { seg: 'terre', at: 6.6, dur: 2.0 },
    blade, tint, labels: [],
    split: { seg: 'decoupe', at: 0.9, dur: 1.3, sep: 18, lift: 13 },
    settle: { seg: 'decoupe', at: 7.0, dur: 1.8, keep: 0 },
    center: [35.0, 31.6],
    marks: [
      { seg: 'nord', at: 2.0, until: 7.4, lon: 35.238, lat: 32.632 },
      { seg: 'sud', at: 1.8, until: 6.9, lon: 34.736, lat: 31.7533 },
    ],
    pulse: { seg: 'peuple', at: 1.4, dur: 5.6 },
    drain: { seg: 'lendemain', at: 7.6, dur: 3.2 },
    dotsOut: { seg: 'lendemain', at: 7.4, dur: 2.8 },
    vote: { seg: 'vote', at: VOTE_AT, dur: VOTE_DUR, until: 13.6, ticks },
  };

  root.TL = root.buildTL({
    name: 'partage-1947',
    seed: 1947,
    segments,
    hud: { label: ['Sion', 'Chapitre 12 · Le plan de partage'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.8,
    fadeOut: 0,
    sound: { ticks: null, bedFrom: 11.0 },
  });
  const TL = root.TL, seg = (id) => TL.segments.find((s) => s.id === id);
  // mentions : temps de fin absolus convertis en temps relatifs à leur séquence
  // les grandes mentions restent jusqu'à ce que la carte se vide ; les petites s'effacent avant le chiffre-clé
  partage.labels = labels.map((l) => (l.seg === 'decoupe' && !l.until ? { ...l, until: (l.size >= 24 ? seg(UNTIL_SEG).start + UNTIL_AT : seg('chiffre').start + 0.6) - seg('decoupe').start } : l));
  TL.partage = partage;

  // ---- bruitages calés sur l'image (tools/sound.py, liste « foley »)
  const abs = (o) => seg(o.seg).start + (o.at || 0);
  const F = [];
  const vote = seg('vote');
  const I = vote.start + vote.fly + vote.hitAt;
  const keys = (t0, text, cps, gain = 1) => { for (let j = 0; j < text.length; j++) if (text[j] !== ' ') F.push({ t: +(t0 + j / cps).toFixed(3), kind: 'key', gain, v: (j * 7) % 5 }); };
  keys(I + vote.titleAt, vote.title, vote.cps, 1.0);
  F.push({ t: +(I + vote.titleAt + vote.title.length / vote.cps + 0.12).toFixed(3), kind: 'bell' });
  keys(I + vote.subAt, vote.sub, 30, 0.45);
  ticks.forEach((x) => F.push({ t: +(vote.start + VOTE_AT + x).toFixed(3), kind: 'tick', gain: 0.8 }));
  F.push({ t: +(I + 9.2).toFixed(3), kind: 'gavel' });
  keys(I + vote.resultAt, vote.result, 22, 0.7);
  F.push({ t: +(vote.start + 0.3).toFixed(3), kind: 'room', dur: 12.8 });
  // villages qui s'allument : scintillement discret
  F.push({ t: +abs(partage.dotsArabe).toFixed(3), kind: 'shimmer', dur: 3.2 });
  F.push({ t: +abs(partage.dotsJuif).toFixed(3), kind: 'shimmer', dur: 2.0, gain: 0.7 });
  // la lame : papier tranché au scalpel
  blade.forEach((b) => { F.push({ t: +abs(b).toFixed(3), kind: 'cut', dur: b.dur }); F.push({ t: +(abs(b) + b.dur).toFixed(3), kind: 'tick', gain: 0.6 }); });
  F.push({ t: +abs(partage.split).toFixed(3), kind: 'slab' });
  F.push({ t: +abs(partage.settle).toFixed(3), kind: 'slab', gain: 0.45 });
  partage.labels.forEach((l) => keys(abs(l), l.text, l.cps || 16, 0.55));
  // le lendemain : radio, puis premiers coups de feu au loin
  const len = seg('lendemain');
  F.push({ t: +(len.start + 0.4).toFixed(3), kind: 'radio', dur: 10.5 });
  [5.9, 6.5, 6.75, 7.6].forEach((d, k) => F.push({ t: +(len.start + d).toFixed(3), kind: 'shot', gain: [0.8, 0.6, 0.5, 0.7][k] }));
  TL.sound = { ...TL.sound, foley: F.sort((a, b) => a.t - b.t) };
})(typeof window !== 'undefined' ? window : globalThis);
