/*
 * Séquence « Trois promesses, 1915 – 1917 » (chapitre 7), ≈ 55 s.
 *
 * Trois engagements pris par Londres pendant la Première Guerre mondiale :
 *   - lettre de Henry McMahon au chérif Hussein, Le Caire, 24 octobre 1915
 *     (original anglais : « Great Britain is prepared to recognise and support the
 *     independence of the Arabs in all the regions within the limits demanded by
 *     the Sherif of Mecca », sous réserve des exclusions énoncées plus haut dans la lettre)
 *   - accords Sykes-Picot, 16 mai 1916 (secrets, publiés par les bolcheviks en novembre 1917)
 *   - déclaration Balfour, 2 novembre 1917 (traduction française usuelle)
 * Fin : Arthur Koestler, Promise and Fulfilment (1949) : « one nation solemnly promised
 * to a second nation the country of a third ».
 * [[ ]] : passage surligné. […] : coupe dans la citation.
 */
(function (root) {
  const segments = [
    {
      id: 'promesses', type: 'beat', dur: 6.0, hitAt: 1.0, reveal: 'slam',
      kicker: 'Première Guerre mondiale · de 1915 à 1917', word: 'Promesses',
      sub: 'Trois engagements britanniques, en deux ans.', subAt: 1.3,
      cam: { lon: 27.0, lat: 38.0, w: 0.95, pitch: 28, bearing: -4 },
      camEnd: { lon: 30.0, lat: 35.0, w: 0.75, pitch: 34, bearing: 3 },
    },
    {
      id: 'h1915', type: 'doc', dur: 12.5, fly: 1.8, layout: 'L', anchor: [540, 60],
      faces: [root.face('mcmahon', { tagPos: 'above', x: 1330, h: 640, at: 2.4, arrowTo: 1, label: 'lettre', link: { lon: 31.24, lat: 30.04 } }), root.face('hussein-ben-ali', { tagPos: 'above', x: 1700, h: 680, at: 3.0, link: { lon: 39.83, lat: 21.42 } })],
      ghost: '1915', eyebrow: 'Le Caire · 24 octobre 1915', title: ['Correspondance', 'Hussein-McMahon'],
      meta: 'Henry McMahon, Le Caire → Hussein, chérif de La Mecque',
      quote: 'La Grande-Bretagne est disposée à [[reconnaître et soutenir l’indépendance des Arabes]] dans toutes les régions comprises dans les limites demandées par le chérif de La Mecque.',
      ref: 'Lettre du 24 octobre 1915 · traduit de l’anglais',
      note: 'En échange : la révolte arabe contre l’Empire ottoman, en juin 1916. La lettre exclut une partie de la Syrie ; la Palestine n’y est pas nommée.', noteAt: 6.2,
      lon: 31.24, lat: 30.04, pin: true, place: 'Le Caire', pinLabel: true,
      cam: { lon: 36.0, lat: 27.0, w: 0.8, pitch: 34, bearing: -6 },
      camEnd: { lon: 36.0, lat: 27.0, w: 0.7, pitch: 40, bearing: 3 },
    },
    {
      id: 'sp1916', type: 'doc', dur: 12.5, fly: 1.6, layout: 'L', anchor: [500, 40],
      faces: [root.face('sykes', { tagPos: 'above', x: 1330, h: 640, at: 2.0, arrowTo: 1, label: 'accord secret' }), root.face('picot', { tagPos: 'above', x: 1700, h: 680, at: 2.5 })],
      ghost: '1916', eyebrow: 'Londres · 16 mai 1916 · secret', title: ['Accords', 'Sykes-Picot'],
      meta: 'Mark Sykes (Royaume-Uni) · François Georges-Picot (France)',
      rows: [
        ['France', 'Liban, côte syrienne, Cilicie ; influence sur Damas, Alep et Mossoul'],
        ['Royaume-Uni', 'Bagdad, Bassora, Haïfa et Acre ; influence de la Transjordanie à Kirkouk'],
        ['Palestine', 'Administration internationale, à définir avec la Russie, les Alliés et le chérif de La Mecque'],
      ],
      rowAt: [1.4, 2.6, 3.8],
      note: 'Un partage tenu secret, rendu public par les bolcheviks en novembre 1917.', noteAt: 6.4,
      cam: { lon: 39.5, lat: 32.5, w: 0.62, pitch: 34, bearing: 4 },
      camEnd: { lon: 39.5, lat: 32.5, w: 0.54, pitch: 40, bearing: -3 },
    },
    {
      id: 'b1917', type: 'doc', dur: 13.0, fly: 2.0, layout: 'L', anchor: [440, 40],
      faces: [root.face('balfour', { tagPos: 'above', x: 1330, h: 640, at: 2.4, arrowTo: 1, label: 'lettre', link: { lon: -0.13, lat: 51.51 } }), root.face('rothschild', { tagPos: 'above', x: 1700, h: 680, at: 3.0 })],
      ghost: '1917', eyebrow: 'Londres · 2 novembre 1917', title: ['Déclaration', 'Balfour'],
      meta: 'Arthur Balfour, ministre des Affaires étrangères → Lord Rothschild',
      quote: [
        'Le gouvernement de Sa Majesté envisage favorablement l’établissement en Palestine d’un [[foyer national pour le peuple juif]] […],',
        'étant clairement entendu que rien ne sera fait qui puisse porter atteinte aux droits civils et religieux des [[collectivités non juives]] existant en Palestine […]',
      ],
      ref: 'Lettre à Lord Rothschild · traduction française usuelle',
      lon: -0.13, lat: 51.51, pin: true, place: 'Londres', pinLabel: true,
      cam: { w: 0.17, pitch: 40, bearing: 8 },
      camEnd: { w: 0.11, pitch: 47, bearing: -2 },
    },
    {
      id: 'koestler', type: 'quote', pos: 'low', dur: 10.5, fly: 2.3, hitAt: 1.4, anchor: [0, -190],
      faces: [root.face('koestler', { x: 1560, h: 760, at: 1.3 })],
      text: 'Une nation promettait solennellement à une deuxième [[le pays d’une troisième.]]',
      author: 'Arthur Koestler · Promise and Fulfilment, 1949',
      cam: { lon: 35.1, lat: 32.0, w: 0.1, pitch: 44, bearing: -6 },
      camEnd: { lon: 35.1, lat: 32.0, w: 0.078, pitch: 50, bearing: 4 },
    },
  ];

  const markers = [
    // 1915
    { seg: 'h1915', at: 3.4, label: 'La Mecque · Hedjaz', lon: 39.83, lat: 21.42, area: true, R: 260, dir: [-1, -1], endAt: 13.0 },
    { seg: 'h1915', at: 3.9, label: 'Damas', lon: 36.29, lat: 33.51, dir: [1, -1], endAt: 13.0 },
    // 1916 : chaque ligne de l'accord allume sa zone
    { seg: 'sp1916', at: 3.0, num: 'FR', label: 'Beyrouth · Damas · Alep', lon: 36.6, lat: 34.6, area: true, R: 300, dir: [1, -1], endAt: 13.0 },
    { seg: 'sp1916', at: 4.2, num: 'UK', label: 'Bagdad · Bassora', lon: 45.2, lat: 32.0, area: true, R: 300, dir: [-1, 1], endAt: 13.0 },
    { seg: 'sp1916', at: 4.4, num: 'UK', label: 'Haïfa · Acre', lon: 35.02, lat: 32.85, dir: [-1, -1], off: 30, endAt: 13.0 },
    { seg: 'sp1916', at: 5.4, num: 'INT', label: 'Jérusalem', lon: 35.22, lat: 31.78, area: true, R: 160, dir: [-1, 1], endAt: 13.0 },
    // fin : trois engagements sur la même terre
    { seg: 'koestler', at: 2.5, num: '15', label: 'Indépendance arabe ?', lon: 35.42, lat: 32.45, area: true, R: 420, dir: [1, -1] },
    { seg: 'koestler', at: 3.1, num: '16', label: 'Zone internationale', lon: 35.18, lat: 31.72, area: true, R: 420, dir: [1, 1] },
    { seg: 'koestler', at: 3.7, num: '17', label: 'Foyer national juif', lon: 34.85, lat: 32.15, area: true, R: 420, dir: [-1, -1] },
  ];

  root.TL = root.buildTL({
    name: 'trois-promesses',
    seed: 1915,
    segments,
    markers,
    hud: { label: ['Sion', 'Chapitre 7 · Trois promesses, de 1915 à 1917'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.4,
    sound: {
      ticks: [0.6, 44.0],
      chords: [[0.0, 'Dm'], [6.0, 'Bb'], [18.5, 'Gm'], [31.0, 'A'], [44.0, 'Dm9']],
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
