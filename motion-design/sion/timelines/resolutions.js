/*
 * Séquence « Les résolutions de l'ONU » (chapitre 33), ≈ 1 min.
 *
 * Trois textes, cités mot pour mot d'après leurs versions françaises officielles :
 *   A/RES/194 (III), 11 décembre 1948, paragraphe 11 (35 pour, 15 contre, 8 abstentions)
 *   S/RES/242 (1967), 22 novembre 1967, paragraphe 1 (unanimité, 15 voix)
 *   S/RES/338 (1973), 22 octobre 1973, paragraphe 2 (14 pour, 0 contre, la Chine ne vote pas)
 * Entre crochets doubles [[ ]] : passage surligné à l'écran. […] : coupe dans la citation.
 * Avant diffusion, relire la ponctuation sur les documents de l'ONU (digitallibrary.un.org).
 */
(function (root) {
  const segments = [
    {
      id: 'onu', type: 'beat', dur: 6.4, hitAt: 0.9, reveal: 'staccato', rgb: 16,
      kicker: 'Nations unies · New York', word: '194 242 338',
      letterHits: [0, 0, 0, 0, 0.5, 0.5, 0.5, 0.5, 1.0, 1.0, 1.0],
      extraHits: [[0.5, 0.8], [1.0, 1.05]],
      sub: 'Trois textes de l’ONU. Ce qu’ils disent, mot pour mot.', subAt: 1.9,
      cam: { lon: -73.968, lat: 40.749, w: 0.12, pitch: 48, bearing: -14 },
      cuts: [{ at: 1.4, w: 0.24, pitch: 38, bearing: 10 }, { at: 1.9, w: 0.07, pitch: 54, bearing: -24 }],
    },
    {
      id: 'r194', type: 'doc', dur: 12.5, fly: 2.4, layout: 'L', anchor: [440, 40],
      ghost: '1948', eyebrow: 'Assemblée générale · 11 décembre 1948', title: ['Résolution', '194'],
      meta: '35 pour · 15 contre · 8 abstentions',
      quote: 'Décide qu’il y a lieu de permettre aux réfugiés qui le désirent, de [[rentrer dans leurs foyers]] le plus tôt possible et de vivre en paix avec leurs voisins […]',
      ref: 'Résolution 194 (III) · paragraphe 11',
      note: 'Environ 700 000 Palestiniens ont fui ou ont été expulsés pendant la guerre, de 1947 à 1949.', noteAt: 6.6,
      lon: 34.95, lat: 31.75, heat: { R: 1300, amt: 0.95 },
      cam: { lon: 34.95, lat: 31.8, w: 0.17, pitch: 40, bearing: -6 },
      camEnd: { lon: 34.95, lat: 31.8, w: 0.1, pitch: 48, bearing: 4 },
    },
    {
      id: 'r242', type: 'doc', dur: 13.0, fly: 1.5, layout: 'L', anchor: [470, 40],
      ghost: '1967', eyebrow: 'Conseil de sécurité · 22 novembre 1967', title: ['Résolution', '242'],
      meta: 'Adoptée à l’unanimité · 15 voix',
      quote: [
        'Retrait des forces armées israéliennes [[des territoires occupés]] lors du récent conflit ;',
        '[…] respect et reconnaissance de la souveraineté […] de chaque État de la région et de leur [[droit de vivre en paix]] à l’intérieur de frontières sûres et reconnues […]',
      ],
      ref: 'Résolution 242 · paragraphe 1, principes i et ii',
      cam: { lon: 34.6, lat: 30.9, w: 0.36, pitch: 36, bearing: -4 },
      camEnd: { lon: 34.8, lat: 31.2, w: 0.27, pitch: 42, bearing: 5 },
    },
    {
      id: 'mot', type: 'split', dur: 8.6, fly: 1.0, pin: false, hlAt: 1.7,
      left: { kicker: 'Texte français', word: 'Des', text: '« Retrait des forces armées israéliennes [[des]] territoires occupés lors du récent conflit »' },
      right: { kicker: 'Texte anglais', word: 'From', text: '« Withdrawal of Israel armed forces [[from]] territories occupied in the recent conflict »' },
      footer: 'Un article d’écart · les deux versions font foi',
      cam: { lon: 35.0, lat: 31.4, w: 0.2, pitch: 46, bearing: -10 },
    },
    {
      id: 'r338', type: 'doc', dur: 12.0, fly: 1.4, layout: 'L', anchor: [460, 40],
      ghost: '1973', eyebrow: 'Conseil de sécurité · 22 octobre 1973', title: ['Résolution', '338'],
      meta: '14 pour · 0 contre · la Chine ne prend pas part au vote',
      quote: 'Demande aux parties en cause de commencer immédiatement après le cessez-le-feu l’application de la résolution 242 (1967) du Conseil de sécurité [[dans toutes ses parties]] ;',
      ref: 'Résolution 338 · paragraphe 2',
      note: 'Seize jours après le début de la guerre d’octobre 1973. Le cessez-le-feu est exigé dans les douze heures.', noteAt: 6.4,
      cam: { lon: 33.9, lat: 31.3, w: 0.32, pitch: 38, bearing: 6 },
      camEnd: { lon: 34.0, lat: 31.4, w: 0.23, pitch: 44, bearing: -3 },
    },
    {
      id: 'fin', type: 'outro', dur: 6.8,
      eyebrow: '1948 · 1967 · 1973',
      lines: ['Votées par l’ONU,', 'jamais appliquées', 'en entier.'],
      cam: { lon: 35.3, lat: 31.6, w: 0.5, pitch: 28, bearing: 0 },
    },
  ];

  // Lieux allumés sur la carte
  const markers = [
    // 1967 : les territoires occupés pendant la guerre des Six Jours
    { seg: 'r242', at: 3.5, label: 'Sinaï', lon: 33.8, lat: 29.6, area: true, R: 300, dir: [-1, 1], off: 40, hideAt: 20.6, endAt: 22.4 },
    { seg: 'r242', at: 3.75, label: 'Gaza', lon: 34.42, lat: 31.45, area: true, R: 110, dir: [-1, -1], hideAt: 20.6, endAt: 22.4 },
    { seg: 'r242', at: 4.0, label: 'Cisjordanie · Jérusalem-Est', lon: 35.25, lat: 31.95, area: true, R: 190, dir: [1, -1], hideAt: 20.6, endAt: 22.4 },
    { seg: 'r242', at: 4.25, label: 'Golan', lon: 35.78, lat: 33.0, area: true, R: 130, dir: [1, -1], hideAt: 20.6, endAt: 22.4 },
    // 1973 : les deux fronts
    { seg: 'r338', at: 2.3, label: 'Front du canal de Suez', lon: 32.4, lat: 30.5, area: true, R: 200, dir: [-1, 1], off: 34, endAt: 13.0 },
    { seg: 'r338', at: 2.6, label: 'Front du Golan', lon: 35.8, lat: 33.1, area: true, R: 160, dir: [1, -1], endAt: 13.0 },
  ];

  root.TL = root.buildTL({
    name: 'resolutions',
    seed: 242,
    segments,
    relief: true,
    markers,
    hud: { label: ['Sion', 'Chapitre 33 · Les résolutions de l’ONU'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: {
      ticks: [0.6, 52.0],
      chords: [[0.0, 'Gm'], [6.4, 'Dm'], [18.9, 'Bb'], [40.5, 'Gm'], [52.8, 'Dm9']],
    },
  });
})(typeof window !== 'undefined' ? window : globalThis);
