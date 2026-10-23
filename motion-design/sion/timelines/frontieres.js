/*
 * Séquence « Les frontières qui bougent » (chapitre 19), ≈ 50 s.
 *
 * Tracés : Natural Earth (palestine-mandataire, israel-1949, cisjordanie, gaza, jerusalem-est) et
 * OCHA (oslo-ab) ; voir tools/prep_territoires.py et tools/prep_ocha.py. Faits et chiffres retenus :
 *   - 1947 : environ 1,85 million d'habitants, dont près des deux tiers d'Arabes palestiniens
 *     (rapport de l'UNSCOP, 1947) ; plan de partage de l'ONU : 56 % pour l'État juif ;
 *   - 1949 : lignes d'armistice, Israël sur 78 % de la Palestine mandataire (77 % avec ces tracés) ;
 *     Cisjordanie sous contrôle jordanien, Gaza sous contrôle égyptien ;
 *   - juin 1967 : occupation de la Cisjordanie, de Jérusalem-Est et de Gaza ;
 *   - aujourd'hui : zones A et B (7,5 %) et bande de Gaza (1,3 %), moins de 10 % de la Palestine
 *     mandataire (8,7 % avec ces tracés, arrondi à 9 % dans la phrase finale).
 */
(function (root) {
  const CAM = { lon: 34.32, lat: 31.6, w: 0.095, pitch: 34, bearing: -4 };
  const segments = [
    {
      id: 'terre', type: 'cap', dur: 10.0, fly: 1.4, anchor: [330, -60], textW: 860,
      kicker: '1947 · Palestine sous mandat britannique', title: 'Une terre',
      text: 'Environ 1,85 million d’habitants, dont [[près des deux tiers d’Arabes palestiniens]]. Le plan de partage de l’ONU attribue 56 % du territoire à un État juif.',
      cam: { ...CAM, w: 0.15, pitch: 30 }, camEnd: CAM,
    },
    {
      id: '1949', type: 'cap', dur: 11.0, fly: 1.0, anchor: [330, -60], textW: 860,
      kicker: '1949 · lignes d’armistice', title: '78 %',
      text: 'Après la guerre et la Nakba, Israël s’étend sur 78 % de la Palestine mandataire. Restent [[la Cisjordanie et Gaza]], sous contrôle jordanien et égyptien.',
      cam: CAM, camEnd: { ...CAM, w: 0.125, bearing: -1 },
    },
    {
      id: '1967', type: 'cap', dur: 10.0, fly: 1.0, anchor: [330, -60], textW: 860,
      kicker: 'Juin 1967', title: 'Occupation',
      text: 'Israël occupe la Cisjordanie, Jérusalem-Est et Gaza : [[toute la Palestine mandataire passe sous son contrôle.]]',
      cam: { ...CAM, w: 0.125, bearing: -1 }, camEnd: { ...CAM, w: 0.12, bearing: 2 },
    },
    {
      id: 'auj', type: 'cap', dur: 11.0, fly: 1.0, anchor: [330, -60], textW: 860,
      kicker: 'Aujourd’hui', title: 'Moins de 10 %',
      text: 'Les îlots des zones A et B, en Cisjordanie, et la bande de Gaza, sous blocus : [[moins d’un dixième de la Palestine mandataire.]]',
      cam: { ...CAM, w: 0.12, bearing: 2 }, camEnd: { ...CAM, lon: 34.15, lat: 31.7, w: 0.095, pitch: 42, bearing: 4 },
    },
    {
      id: 'fin', type: 'outro', dur: 8.5, fly: 1.4, hitAt: 1.0,
      eyebrow: 'De 1947 à aujourd’hui',
      lines: ['1947 : une terre.', '1949 : 22 %.', 'Aujourd’hui : 9 %.'],
      cam: { ...CAM, w: 0.14, pitch: 30 }, camEnd: { ...CAM, w: 0.145, pitch: 28, bearing: 0 },
    },
  ];
  const zones = [
    // 1947 : toute la terre, en olive
    { seg: 'terre', at: 1.0, dur: 3.0, name: 'palestine-mandataire', from: [35.0, 31.8], tone: 'life', until: 11.4 },
    // 1949 : Israël (encre froide, comme l'État juif du plan de partage) ; ce qui reste aux Palestiniens (olive)
    { seg: '1949', at: 0.6, dur: 2.6, name: 'israel-1949', from: [34.8, 32.1], tone: 'cold', until: 10.6 },
    { seg: '1949', at: 1.4, dur: 1.6, name: ['cisjordanie', 'gaza'], from: [35.25, 31.9], tone: 'life', until: 10.6 },
    // 1967 : tout sous contrôle israélien, l'occupation en vermillon
    { seg: '1967', at: 0.3, dur: 1.0, name: 'israel-1949', from: [34.8, 32.1], tone: 'cold', until: 21.0 },
    { seg: '1967', at: 0.8, dur: 2.0, name: ['cisjordanie', 'gaza', 'jerusalem-est'], from: [35.25, 31.9], until: 9.6 },
    // aujourd'hui : il reste des îlots
    { seg: 'auj', at: 0.8, dur: 2.4, name: ['oslo-ab', 'gaza'], from: [35.2, 31.9], tone: 'life', until: 19.5 },
  ];
  const markers = [
    { seg: '1949', at: 2.4, label: 'Cisjordanie', lon: 35.3, lat: 32.15, dir: [1, -1], off: 40, endAt: 10.6 },
    { seg: '1949', at: 2.8, label: 'Gaza', lon: 34.42, lat: 31.45, dir: [-1, 1], off: 40, endAt: 10.6 },
    { seg: '1967', at: 2.0, label: 'Jérusalem-Est', lon: 35.23, lat: 31.78, dir: [1, 1], off: 40, endAt: 10.3 },
  ];
  const clock = [
    { seg: 'terre', at: 0.2, text: '1947' }, { seg: '1949', at: 0.2, text: '1949' },
    { seg: '1967', at: 0.2, text: '1967' }, { seg: 'auj', at: 0.2, text: 'Aujourd’hui' }, { seg: 'fin', at: 0.2, text: '' },
  ];

  root.TL = root.buildTL({
    name: 'frontieres',
    seed: 1949,
    segments,
    relief: true,
    zones,
    markers,
    clock,
    hud: { label: ['Sion', 'Chapitre 19 · Les frontières qui bougent'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: null },
  });
})(typeof window !== 'undefined' ? window : globalThis);
