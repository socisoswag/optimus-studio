/*
 * Séquence « L'eau » (chapitre 23, Oslo, le mur et les colonies), ≈ 32 s. Remplace la fiche « Le partage de l'eau »
 * de documents-6.js. Modèles : timelines/terres-1945.js (colonnes sur le relief), timelines/flux-humains.js (flux).
 *
 * Faits retenus :
 *   - la nappe de la montagne (aquifère de la montagne) se recharge surtout sous les collines de Cisjordanie ; trois
 *     bassins : ouest (le plus grand, vers la plaine côtière d'Israël, sources du Yarkon à Rosh HaAyin et de Taninim),
 *     nord-est (vers Beit Shean et la vallée de Jezréel), est (vers la vallée du Jourdain et la mer Morte)
 *     (accords d'Oslo II, 28 septembre 1995, annexe III, article 40 ; Amnesty International, Troubled Waters, 2009) ;
 *   - depuis Oslo II : Israël garde environ 80 % de l'eau de la nappe ; tout nouveau puits palestinien passe par le
 *     comité mixte de l'eau, qui décide par consensus : Israël peut refuser (Amnesty International, 2009) ;
 *   - 2023 : 82,4 litres par jour et par Palestinien de Cisjordanie, 247 par Israélien, colons compris ; minimum
 *     recommandé par l'OMS : 100 litres (B'Tselem, Parched, 2 mai 2023 ; OMS à confirmer sur le rapport).
 * Les trajets de l'eau sont schématiques (des collines vers les sorties de chaque bassin).
 */
(function (root) {
  const WB = { lon: 35.22, lat: 32.0 };
  const cam = (lon, lat, w, pitch, bearing) => ({ lon, lat, w, pitch, bearing });
  const segments = [
    {
      id: 'mot', type: 'beat', dur: 5.0, hitAt: 0.9, rgb: 10,
      kicker: 'Cisjordanie · la nappe de la montagne', word: 'L’eau',
      sub: 'Sous les collines, une grande nappe d’eau souterraine.', subAt: 1.6,
      cam: cam(WB.lon, WB.lat, 0.036, 40, -36), camEnd: cam(WB.lon, WB.lat, 0.032, 44, -30),
    },
    {
      id: 'pluie', type: 'cap', dur: 9.0, fly: 1.4, anchor: [330, -60], textW: 860,
      kicker: 'La nappe de la montagne', title: 'Elle naît ici',
      text: 'La pluie qui tombe sur les collines de Cisjordanie remplit la nappe. [[Sous terre, l’eau coule surtout vers l’ouest, vers Israël.]]',
      cam: cam(35.12, 32.05, 0.034, 46, -24), camEnd: cam(35.1, 32.06, 0.031, 50, -16),
    },
    {
      id: 'partage', type: 'stat', dur: 8.0, fly: 1.4, layout: 'L', anchor: [480, 20],
      ghost: '1995', kicker: 'Depuis Oslo II, 1995', pre: 'Environ', value: 80, unit: '%',
      label: 'de l’eau de la nappe pour Israël',
      text: 'Tout nouveau puits palestinien doit être accepté par un comité israélo-palestinien. [[Israël peut le refuser.]]',
      textAt: 1.5, hlAt: 5.0, source: 'Accords d’Oslo II, annexe III, article 40 · Amnesty International, 2009', sourceAt: 4.0,
      countAt: 0.3, countDur: 2.4,
      cam: cam(35.2, 32.0, 0.03, 44, -30), camEnd: cam(35.2, 32.0, 0.028, 48, -26),
    },
    {
      id: 'litres', type: 'cap', dur: 10.0, fly: 1.6, anchor: [330, -60], textW: 900,
      kicker: 'Par jour et par personne · 2023', title: '82 litres contre 247',
      text: '82,4 litres pour un Palestinien de Cisjordanie, [[247 pour un Israélien, colons compris.]] L’OMS recommande au moins 100 litres.',
      cam: cam(34.98, 32.02, 0.044, 34, -10), camEnd: cam(34.98, 32.03, 0.041, 37, -4),
    },
  ];

  // la nappe : colline par colline, l'eau part vers la sortie de son bassin (froide, comme l'eau)
  const COLLINES = [[35.3, 32.46], [35.26, 32.22], [35.2, 31.9], [35.1, 31.53], [35.17, 32.06], [35.06, 31.7]];
  const flows = [
    { seg: 'pluie', cold: true, heat: 0.3, at: 1.2, dur: 5.0, n: 170, from: COLLINES, to: [34.93, 32.09], travel: [2.6, 3.8], bend: 0.12, spread: 0.06, spreadTo: 0.05, R: 200 },
    { seg: 'pluie', cold: true, heat: 0.3, at: 1.6, dur: 4.6, n: 70, from: [[35.3, 32.46], [35.0, 32.4]], to: [34.92, 32.53], travel: [2.2, 3.2], bend: -0.1, spread: 0.04, spreadTo: 0.04, R: 160 },
    { seg: 'pluie', cold: true, heat: 0.3, at: 2.0, dur: 4.4, n: 50, from: [[35.3, 32.46], [35.26, 32.22]], to: [35.45, 32.5], travel: [2.0, 3.0], bend: 0.12, spread: 0.04, spreadTo: 0.04, R: 140 },
    { seg: 'pluie', cold: true, heat: 0.3, at: 2.2, dur: 4.4, n: 60, from: [[35.2, 31.9], [35.1, 31.53], [35.26, 32.22]], to: [35.45, 31.78], travel: [2.0, 3.0], bend: -0.14, spread: 0.05, spreadTo: 0.06, R: 140 },
  ];
  const zones = [
    { seg: 'mot', at: 0.6, dur: 2.0, name: 'cisjordanie', from: [WB.lon, WB.lat], tone: 'stone', until: 23.0 },
  ];
  const markers = [
    { seg: 'pluie', at: 4.4, label: 'Rosh HaAyin · sources du Yarkon', lon: 34.93, lat: 32.09, dir: [-1, -1], endAt: 9.0 },
    { seg: 'pluie', at: 5.0, label: 'Vallée du Jourdain', lon: 35.45, lat: 31.95, dir: [1, -1], endAt: 9.0 },
    { seg: 'litres', at: 2.0, label: 'Ramallah', lon: 35.2, lat: 31.9, dir: [1, 1], off: 60, area: true, R: 1, endAt: 10.2 },
    { seg: 'litres', at: 2.6, label: 'Tel Aviv', lon: 34.78, lat: 32.08, dir: [-1, 1], off: 60, area: true, R: 1, endAt: 10.2 },
  ];
  // les litres : une colonne de lumière par personne et par jour, 250 m par litre
  const columns = [
    { seg: 'litres', at: 2.0, lon: 35.2, lat: 31.9, h: 250 * 82.4, w: 20, value: '82,4 L', cold: true },
    { seg: 'litres', at: 2.6, lon: 34.83, lat: 32.08, h: 250 * 247, w: 20, value: '247 L' },
  ];

  root.TL = root.buildTL({
    name: 'eau',
    relief: true,
    seed: 1995,
    segments,
    zones,
    markers,
    flows,
    cities: [],
    hud: { label: ['Sion', 'Chapitre 23 · L’eau'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: null },
  });
  root.TL.columns = columns;
})(typeof window !== 'undefined' ? window : globalThis);
