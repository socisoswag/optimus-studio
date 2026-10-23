/*
 * Séquence « La carte de Sykes-Picot » (chapitre 7, juste après la fiche de l'accord), ≈ 19 s.
 * Modèle : timelines/peel-1937.js (relief, zones), avec la vraie carte de 1916 posée sur le terrain (TL.carte).
 *
 * Carte : signée par Mark Sykes et François Georges-Picot le 8 mai 1916, jointe aux lettres de l'accord (9 au 16 mai
 * 1916) ; The National Archives (Royaume-Uni), MPK 1/426, domaine public ; redressée par tools/prep_sykes_picot.py.
 * Accord : zone bleue (France) et zone rouge (Royaume-Uni) sous administration directe ; A et B, zones d'influence
 * française et britannique ; zone brune (en jaune sur cette carte) : « administration internationale », à définir avec
 * la Russie, les Alliés et le chérif de La Mecque ; au Royaume-Uni, les ports de Haïfa et d'Acre.
 */
(function (root) {
  const cam = (lon, lat, w, pitch, bearing) => ({ lon, lat, w, pitch, bearing });
  const segments = [
    {
      id: 'carte', type: 'cap', dur: 10.0, fly: 1.6, anchor: [330, -60], textW: 900,
      kicker: 'Londres et Paris · 8 mai 1916 · secret', title: 'La carte signée',
      text: 'Mark Sykes et François Georges-Picot signent cette carte : [[bleu pour la France, rouge pour le Royaume-Uni.]] A et B : leurs zones d’influence.',
      cam: cam(41.4, 33.9, 0.33, 20, -2), camEnd: cam(41.2, 33.8, 0.3, 24, 2),
    },
    {
      id: 'palestine', type: 'cap', dur: 9.0, fly: 2.4, anchor: [330, -60], textW: 900,
      kicker: 'En jaune sur la carte', title: 'Une Palestine internationale',
      text: 'Jérusalem et la Palestine doivent passer sous une « administration internationale ». [[Haïfa et Acre reviennent au Royaume-Uni.]]',
      cam: cam(35.15, 32.15, 0.065, 42, -10), camEnd: cam(35.15, 32.15, 0.058, 46, -4),
    },
  ];
  const zones = [
    { seg: 'palestine', at: 2.2, dur: 1.6, name: 'sp-brun', from: [35.0, 32.3], tone: 'stone' },
  ];
  const markers = [
    { seg: 'palestine', at: 3.0, label: 'Haïfa et Acre', lon: 35.03, lat: 32.86, dir: [-1, -1], off: 46, endAt: 9.0 },
    { seg: 'palestine', at: 3.6, label: 'Jérusalem', lon: 35.23, lat: 31.78, dir: [1, 1], off: 40, endAt: 9.0 },
  ];
  const clock = [{ seg: 'carte', at: 0.2, text: '8 mai 1916' }, { seg: 'palestine', at: 0.2, text: '8 mai 1916' }];

  root.TL = root.buildTL({
    name: 'sykes-picot',
    relief: true,
    seed: 1916,
    segments,
    zones,
    markers,
    clock,
    cities: [],
    hud: { label: ['Sion', 'Chapitre 7 · Sykes-Picot'], index: false, coords: true, ruler: false, odo: false, from: 0.5 },
    fadeIn: 0.6,
    fadeOut: 1.2,
    sound: { ticks: null },
  });
  // la vraie carte de 1916, posée sur le relief, puis gardée en transparence sous la zone internationale
  const SP = root.SYKES_PICOT && root.SYKES_PICOT.carte;
  if (SP) root.TL.carte = { ...SP, in: { seg: 'carte', at: 0.6, dur: 2.4 }, out: { seg: 'palestine', at: 1.4, dur: 2.6, keep: 0.4 } };
})(typeof window !== 'undefined' ? window : globalThis);
